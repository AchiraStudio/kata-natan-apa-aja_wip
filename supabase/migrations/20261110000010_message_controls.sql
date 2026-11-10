CREATE TABLE IF NOT EXISTS public.message_user_states (
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, message_id),
  CONSTRAINT message_user_states_has_state CHECK (is_hidden OR is_starred)
);

CREATE INDEX IF NOT EXISTS idx_message_user_states_message_id
  ON public.message_user_states (message_id);

ALTER TABLE public.message_user_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.message_user_states FROM anon, authenticated;
GRANT SELECT ON public.message_user_states TO authenticated;

DROP POLICY IF EXISTS "Users can view their own message states" ON public.message_user_states;
CREATE POLICY "Users can view their own message states" ON public.message_user_states
  FOR SELECT USING (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Senders can delete their own messages for everyone" ON public.messages;
CREATE POLICY "Senders can delete their own messages for everyone" ON public.messages
  FOR DELETE USING (
    sender_id = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid()::text = ANY(c.participant_ids)
    )
  );

CREATE OR REPLACE FUNCTION public.set_message_user_state(
  p_message_id UUID,
  p_state TEXT,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id TEXT := (SELECT auth.uid()::text);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk mengubah status pesan.'
      USING ERRCODE = '42501';
  END IF;

  IF p_state IS NULL OR p_state NOT IN ('hidden', 'starred') OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'Status pesan tidak valid.'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = p_message_id
      AND v_user_id = ANY(c.participant_ids)
  ) THEN
    RAISE EXCEPTION 'Pesan tidak ditemukan atau akses ditolak.'
      USING ERRCODE = '42501';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.message_user_states (user_id, message_id, is_hidden, is_starred)
    VALUES (v_user_id, p_message_id, p_state = 'hidden', p_state = 'starred')
    ON CONFLICT (user_id, message_id) DO UPDATE
    SET is_hidden = CASE
          WHEN p_state = 'hidden' THEN TRUE
          ELSE message_user_states.is_hidden
        END,
        is_starred = CASE
          WHEN p_state = 'starred' THEN TRUE
          ELSE message_user_states.is_starred
        END;
  ELSE
    IF p_state = 'hidden' THEN
      DELETE FROM public.message_user_states
      WHERE user_id = v_user_id
        AND message_id = p_message_id
        AND NOT is_starred;
      UPDATE public.message_user_states SET is_hidden = FALSE
      WHERE user_id = v_user_id
        AND message_id = p_message_id
        AND is_starred;
    ELSE
      DELETE FROM public.message_user_states
      WHERE user_id = v_user_id
        AND message_id = p_message_id
        AND NOT is_hidden;
      UPDATE public.message_user_states SET is_starred = FALSE
      WHERE user_id = v_user_id
        AND message_id = p_message_id
        AND is_hidden;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.set_message_user_state(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_message_user_state(UUID, TEXT, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
