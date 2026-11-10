CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> followed_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followed_id
  ON public.user_follows (followed_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_follows FROM anon, authenticated;
GRANT SELECT ON public.user_follows TO anon, authenticated;

DROP POLICY IF EXISTS "Follow relationships are publicly readable" ON public.user_follows;
CREATE POLICY "Follow relationships are publicly readable" ON public.user_follows
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.toggle_user_follow(p_followed_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_follower_id TEXT := (SELECT auth.uid()::text);
BEGIN
  IF v_follower_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk mengikuti akun.'
      USING ERRCODE = '42501';
  END IF;

  IF p_followed_user_id IS NULL OR p_followed_user_id = v_follower_id THEN
    RAISE EXCEPTION 'Akun tujuan mengikuti tidak valid.'
      USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.user_follows
  WHERE follower_id = v_follower_id
    AND followed_id = p_followed_user_id;

  IF FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_follows (follower_id, followed_id)
  VALUES (v_follower_id, p_followed_user_id)
  ON CONFLICT (follower_id, followed_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.toggle_user_follow(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_user_follow(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
