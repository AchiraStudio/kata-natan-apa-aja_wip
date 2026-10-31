-- =============================================================================
-- TITIK. — Migration 20261031000001: Fix Instant Signup, Report Saves & Profile Trigger
-- Description:
--   1. Creates public.report_saves table, RLS policies, and toggle_report_save RPC
--      (fixes 404 Could not find the table 'public.report_saves' in the schema cache).
--   2. Auto-confirms all existing & new users in auth.users and adds auto_confirm_user RPC
--      (fixes 400 Bad Request on /auth/v1/token?grant_type=password).
--   3. Updates handle_new_user() so new accounts start with clean NULL avatar_url, bio,
--      and district instead of legacy placeholder strings.
--   4. Cleans legacy trigger defaults on existing non-demo accounts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. report_saves (reports.id is TEXT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_saves (
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

ALTER TABLE public.report_saves ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_saves FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.report_saves TO authenticated;

DROP POLICY IF EXISTS "Users can view own saved reports" ON public.report_saves;
CREATE POLICY "Users can view own saved reports" ON public.report_saves
  FOR SELECT USING (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can save reports for themselves" ON public.report_saves;
CREATE POLICY "Users can save reports for themselves" ON public.report_saves
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can remove their saved reports" ON public.report_saves;
CREATE POLICY "Users can remove their saved reports" ON public.report_saves
  FOR DELETE USING (user_id = (SELECT auth.uid()::text));

CREATE OR REPLACE FUNCTION public.toggle_report_save(p_report_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_exists BOOLEAN;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk menyimpan laporan.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.report_saves
    WHERE report_id = p_report_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.report_saves
    WHERE report_id = p_report_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.report_saves (report_id, user_id)
    VALUES (p_report_id, v_uid)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('is_saved', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.toggle_report_save(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. AUTO-CONFIRM USERS IN auth.users (ZERO EMAIL VERIFICATION FRICTION)
-- -----------------------------------------------------------------------------
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_updated_auto_confirm
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

CREATE OR REPLACE FUNCTION public.auto_confirm_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = p_user_id AND email_confirmed_at IS NULL;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.auto_confirm_user(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.auto_confirm_user_by_email(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE lower(email) = lower(p_email);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.auto_confirm_user_by_email(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. CLEAN handle_new_user() TRIGGER (NO PLACEHOLDER BIO, DISTRICT, OR AVATAR)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_username TEXT;
  clean_username TEXT;
  display_str TEXT;
BEGIN
  raw_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'warga_' || substr(NEW.id::text, 1, 6)
  );
  clean_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_.]', '', 'g'));
  IF length(clean_username) < 3 THEN
    clean_username := 'warga_' || substr(NEW.id::text, 1, 6);
  END IF;

  -- If username already exists, append Discord-style #[4-digit number] (e.g. natan#1042)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(clean_username) AND id <> NEW.id::text) LOOP
    clean_username := regexp_replace(clean_username, '#\d+$', '') || '#' || lpad((floor(random() * 9000) + 1000)::text, 4, '0');
  END LOOP;

  display_str := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1),
    'Warga'
  );

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    email,
    avatar_url,
    role,
    district,
    is_verified,
    bio,
    is_demo
  )
  VALUES (
    NEW.id::text,
    clean_username,
    display_str,
    NEW.email,
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    'citizen',
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'district'), ''),
    FALSE,
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'bio'), ''),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- -----------------------------------------------------------------------------
-- 4. CLEAN EXISTING NON-DEMO PROFILES CREATED BY LEGACY TRIGGER
-- -----------------------------------------------------------------------------
UPDATE public.profiles
SET
  avatar_url = CASE
    WHEN avatar_url LIKE '%1535713875002-d1d0cf377fde%' THEN NULL
    ELSE avatar_url
  END,
  bio = CASE
    WHEN bio ILIKE 'Warga terdaftar di portal%' THEN NULL
    ELSE bio
  END,
  district = CASE
    WHEN district = 'Bogor' THEN NULL
    ELSE district
  END
WHERE is_demo = FALSE;

-- -----------------------------------------------------------------------------
-- 5. RPC TO RESOLVE USERNAME TO EMAIL FOR DUAL LOGIN (EMAIL OR USERNAME)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
  clean_un TEXT;
BEGIN
  clean_un := lower(regexp_replace(BTRIM(p_username), '^@+', ''));
  
  -- Exact or case-insensitive match
  SELECT email INTO v_email
  FROM public.profiles
  WHERE lower(username) = clean_un
  LIMIT 1;

  -- Prefix match for Discord discriminator (e.g. searching 'natan' matches 'natan#1042')
  IF v_email IS NULL AND NOT clean_un LIKE '%#%' THEN
    SELECT email INTO v_email
    FROM public.profiles
    WHERE lower(username) LIKE clean_un || '#%'
    LIMIT 1;
  END IF;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

-- Reload PostgREST schema cache so report_saves and new RPCs are immediately visible
NOTIFY pgrst, 'reload schema';

