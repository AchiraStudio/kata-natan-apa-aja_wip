-- =============================================================================
-- TITIK. — Migration 20261028000003: Deep Profile Customization
-- Description: Adds banner_url, background_theme, website_url, and custom_status
--              to public.profiles, updates public_profiles view, and provides
--              the updated update_my_profile RPC.
-- =============================================================================

-- 1. Add customization columns to public.profiles if they don't already exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS background_theme TEXT DEFAULT 'editorial_forest',
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_status TEXT;

-- 2. Populate curated banners and themes for seeded profiles
UPDATE public.profiles
SET
  banner_url = 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  background_theme = 'editorial_forest',
  website_url = 'https://kotabogor.go.id',
  custom_status = 'Siap Melayani Warga'
WHERE username = 'admin.pupr' AND (banner_url IS NULL OR banner_url = '');

UPDATE public.profiles
SET
  banner_url = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  background_theme = 'bogor_slate',
  website_url = 'https://budi-bogor.id',
  custom_status = 'Pantau APBD Bogor Bersama'
WHERE username = 'budi.santoso' AND (banner_url IS NULL OR banner_url = '');

UPDATE public.profiles
SET background_theme = 'editorial_forest'
WHERE background_theme IS NULL;

-- 3. Update public_profiles view to include new customization fields
DROP VIEW IF EXISTS public.public_profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  bio,
  district,
  is_verified,
  role,
  created_at,
  is_demo,
  banner_url,
  background_theme,
  website_url,
  custom_status
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Update the update_my_profile RPC with full customization support
DROP FUNCTION IF EXISTS public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name TEXT,
  p_username TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_district TEXT DEFAULT NULL,
  p_banner_url TEXT DEFAULT NULL,
  p_background_theme TEXT DEFAULT NULL,
  p_website_url TEXT DEFAULT NULL,
  p_custom_status TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  v_uid TEXT;
  v_res public.profiles;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  UPDATE public.profiles
  SET
    display_name = COALESCE(NULLIF(TRIM(p_display_name), ''), display_name),
    username = COALESCE(NULLIF(TRIM(p_username), ''), username),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    district = COALESCE(p_district, district),
    banner_url = COALESCE(p_banner_url, banner_url),
    background_theme = COALESCE(p_background_theme, background_theme),
    website_url = COALESCE(p_website_url, website_url),
    custom_status = COALESCE(p_custom_status, custom_status),
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

