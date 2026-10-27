-- =============================================================================
-- TITIK. — Migration 20261028000002: Seed Normal Citizen and Administrator Accounts
-- Description: Creates deterministic Supabase Auth accounts for normal citizen
--              (warga@titik.id) and official admin (admin@titik.id) with verified
--              email, encrypted passwords, profiles, and admin roles.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_citizen_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_encrypted_admin_pw TEXT;
  v_encrypted_citizen_pw TEXT;
BEGIN
  -- Generate secure bcrypt hashes
  v_encrypted_admin_pw := crypt('admin2026', gen_salt('bf'));
  v_encrypted_citizen_pw := crypt('titik2026', gen_salt('bf'));

  -- 1. Create or update Administrator (admin@titik.id / admin2026)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@titik.id') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@titik.id',
      v_encrypted_admin_pw,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin.pupr","display_name":"Administrator Dinas PUPR","district":"Bogor Tengah"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_admin_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = '{"username":"admin.pupr","display_name":"Administrator Dinas PUPR","district":"Bogor Tengah"}'::jsonb,
      updated_at = NOW()
    WHERE email = 'admin@titik.id';
  END IF;

  -- 2. Create or update Normal Citizen (warga@titik.id / titik2026)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'warga@titik.id') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_citizen_id,
      'authenticated',
      'authenticated',
      'warga@titik.id',
      v_encrypted_citizen_pw,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"budi.santoso","display_name":"Budi Santoso","district":"Bogor Selatan"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_citizen_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = '{"username":"budi.santoso","display_name":"Budi Santoso","district":"Bogor Selatan"}'::jsonb,
      updated_at = NOW()
    WHERE email = 'warga@titik.id';
  END IF;

  -- 3. Upsert Profile for Administrator
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
  SELECT
    u.id::text,
    'admin.pupr',
    'Administrator Dinas PUPR',
    'admin@titik.id',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'admin',
    'Bogor Tengah',
    true,
    'Akun resmi verifikator dan pengawas infrastruktur Dinas PUPR Kota Bogor.',
    false
  FROM auth.users u WHERE u.email = 'admin@titik.id'
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    display_name = 'Administrator Dinas PUPR',
    username = 'admin.pupr',
    is_verified = true,
    avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';

  -- 4. Upsert Profile for Normal Citizen
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
  SELECT
    u.id::text,
    'budi.santoso',
    'Budi Santoso',
    'warga@titik.id',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'citizen',
    'Bogor Selatan',
    true,
    'Warga aktif pemerhati fasilitas umum dan transparansi APBD Kota Bogor.',
    false
  FROM auth.users u WHERE u.email = 'warga@titik.id'
  ON CONFLICT (id) DO UPDATE SET
    role = 'citizen',
    display_name = 'Budi Santoso',
    username = 'budi.santoso',
    is_verified = true,
    avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  -- 5. Grant Admin Role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id::text, 'admin'
  FROM auth.users u WHERE u.email = 'admin@titik.id'
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- Also grant admin to achira@studio.id if exists
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id::text, 'admin'
  FROM auth.users u WHERE u.email = 'achira@studio.id'
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

END $$;

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
