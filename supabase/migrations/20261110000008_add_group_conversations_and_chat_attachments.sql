-- =============================================================================
-- Migration: Add Group Conversations, Members, and Chat Attachments
-- File: 20261110000008_add_group_conversations_and_chat_attachments.sql
-- Description:
--   1. Adds group fields to public.conversations (is_group, title, avatar_url, description, created_by)
--   2. Creates public.conversation_members table for scalable 100+ member groups
--   3. Sets up RLS policies and indexes for group messaging
--   4. Creates and configures public 'chat-attachments' storage bucket
-- =============================================================================

-- 1. EXTEND CONVERSATIONS TABLE
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON public.conversations(is_group);

-- 2. CREATE CONVERSATION MEMBERS TABLE (For 100+ members in groups/communities)
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON public.conversation_members(conversation_id);

-- Enable Realtime for group members
ALTER TABLE public.conversation_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
  END IF;
END $$;

-- 3. RLS FOR CONVERSATION MEMBERS
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversation_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;

DROP POLICY IF EXISTS "Users can view members in their conversations" ON public.conversation_members;
CREATE POLICY "Users can view members in their conversations" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND auth.uid()::text = ANY(c.participant_ids)
    )
  );

DROP POLICY IF EXISTS "Members and admins can join or add members" ON public.conversation_members;
CREATE POLICY "Members and admins can join or add members" ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Can add self or add others if conversation creator or existing member
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND (c.created_by = auth.uid()::text OR auth.uid()::text = ANY(c.participant_ids))
    )
  );

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.conversation_members;
CREATE POLICY "Owners and admins can manage members" ON public.conversation_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()::text -- Self leave
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()::text
    )
  );

-- 4. UPDATE CONVERSATIONS RLS TO ALLOW MEMBERS TO SEE GROUP CHATS
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text = ANY(participant_ids)
    OR created_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id
        AND cm.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          auth.uid()::text = ANY(c.participant_ids)
          OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = c.id
              AND cm.user_id = auth.uid()::text
          )
        )
    )
  );

-- 5. CHAT ATTACHMENTS STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated users to upload chat attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload chat attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Allow public read on chat attachments" ON storage.objects;
CREATE POLICY "Allow public read on chat attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'chat-attachments');
