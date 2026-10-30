-- =============================================================================
-- TITIK. - Migration 20261030000001: Server-Side Account Sync & Orphan Cleanup
-- Description:
--   1. Purges any orphaned non-demo profiles in public.profiles whose account
--      was deleted from auth.users.
--   2. Adds an AFTER DELETE trigger on auth.users so deleting an account in
--      Supabase Auth automatically deletes its public.profiles and user_roles.
--   3. Updates handle_new_user() so new accounts never receive placeholder
--      bio or district strings unless explicitly provided.
-- =============================================================================

-- 1. Purge orphaned non-demo profiles that no longer exist in auth.users
DELETE FROM public.profiles
WHERE is_demo = FALSE
  AND id NOT IN (SELECT id::text FROM auth.users);

DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id::text FROM auth.users);

-- 2. Clear legacy trigger placeholder bio on existing user profiles
UPDATE public.profiles
SET bio = NULL
WHERE is_demo = FALSE
  AND bio = 'Warga terdaftar di portal TITIK.';

-- 3. Automatically delete public.profiles and public.user_roles when auth.users is deleted
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_roles WHERE user_id = OLD.id::text;
  DELETE FROM public.profiles WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();

-- 4. Ensure handle_new_user() sets NULL instead of placeholder bio/district
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
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    ),
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
EXCEPTION WHEN unique_violation THEN
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
    clean_username || '_' || substr(md5(random()::text), 1, 4),
    display_str,
    NEW.email,
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'citizen',
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'district'), ''),
    FALSE,
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'bio'), ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

NOTIFY pgrst, 'reload schema';

