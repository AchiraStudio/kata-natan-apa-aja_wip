-- =============================================================================
-- TITIK. - Migration 20261101000001: Direct Messaging & E2EE Relay Schema
-- Description: Sets up conversations and messages tables, indexes, RLS policies,
--              realtime replication for ciphertext direct messaging, and
--              the admin_set_user_role RPC function.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DIRECT MESSAGING TABLES (E2EE Ciphertext Relay)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT REFERENCES public.reports(id) ON DELETE SET NULL,
  participant_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'status_update', 'info_request', 'resolution')),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for performance & array containment
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON public.conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_report_id ON public.conversations(report_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, sender_id, read_at) WHERE read_at IS NULL;

-- Enable Realtime Replication
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY: CONVERSATIONS & MESSAGES
-- -----------------------------------------------------------------------------

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (auth.uid()::text = ANY(participant_ids) OR public.is_admin());

DROP POLICY IF EXISTS "Users can create conversations they participate in" ON public.conversations;
CREATE POLICY "Users can create conversations they participate in" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid()::text = ANY(participant_ids) OR public.is_admin());

DROP POLICY IF EXISTS "Participants can update conversation timestamp" ON public.conversations;
CREATE POLICY "Participants can update conversation timestamp" ON public.conversations
  FOR UPDATE USING (auth.uid()::text = ANY(participant_ids) OR public.is_admin());

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid()::text = ANY(c.participant_ids) OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (auth.uid()::text = ANY(c.participant_ids) OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Participants can update message read status" ON public.messages;
CREATE POLICY "Participants can update message read status" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid()::text = ANY(c.participant_ids) OR public.is_admin())
    )
  );

-- -----------------------------------------------------------------------------
-- 3. ADMIN RPC: USER ROLE MANAGEMENT
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_set_user_role(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id TEXT,
  p_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berwenang mengubah peran pengguna.';
  END IF;

  IF p_role NOT IN ('admin', 'citizen') THEN
    RAISE EXCEPTION 'Peran tidak valid. Gunakan admin atau citizen.';
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = NOW()
  WHERE id = p_user_id;

  IF p_role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  ELSE
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RELOAD SCHEMA CACHE
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
