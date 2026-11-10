-- =============================================================================
-- TITIK. - Migration 20261110000001: Clean Database & Setup Primary Admin
-- Description: Wipes all dummy reports, posts, comments, notifications,
--              and configures primary administrator admin@titik.com.
-- =============================================================================

-- 1. Wipe interaction tables
DELETE FROM public.comments;
DELETE FROM public.posts;
DELETE FROM public.reports;
DELETE FROM public.conversations;
DELETE FROM public.messages;

-- 2. Mark any legacy demo/sample profiles as demo so they are ignored by live queries
UPDATE public.profiles
SET is_demo = true
WHERE email != 'admin@titik.com' AND username != 'admin';

-- 3. Ensure primary admin profile exists and is assigned admin role
DO $$
DECLARE
  v_admin_id TEXT := 'ccfd5947-1152-44b6-82b7-cd9a3dea7d30';
BEGIN
  -- Insert or update user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- Upsert profiles table
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    email,
    avatar_url,
    role,
    verified_agency,
    district,
    is_verified,
    is_demo,
    bio,
    updated_at
  )
  VALUES (
    v_admin_id,
    'admin',
    'Administrator TITIK',
    'admin@titik.com',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'admin',
    'Pemerintah Kota Bogor',
    'Bogor Tengah',
    true,
    false,
    'Akun resmi administrator sistem TITIK Kota Bogor.',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    display_name = 'Administrator TITIK',
    username = 'admin',
    email = 'admin@titik.com',
    verified_agency = 'Pemerintah Kota Bogor',
    is_verified = true,
    is_demo = false,
    updated_at = NOW();
END $$;
