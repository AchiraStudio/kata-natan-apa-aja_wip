-- =============================================================================
-- TITIK. — Security & RLS Test Verification Suite
-- File: supabase/tests/20261028000001_security_test.sql
-- =============================================================================
-- This script validates that least-privilege security controls and RLS policies
-- are properly enforced in PostgreSQL / Supabase.
--
-- How to run:
-- 1. Via Supabase CLI (local docker environment):
--    supabase test db
-- 2. Or execute via psql on remote database:
--    psql "<SUPABASE_DB_URL>" -f supabase/tests/20261028000001_security_test.sql
-- =============================================================================

BEGIN;

-- Helper notice
DO $$
BEGIN
  RAISE NOTICE '>>> Memulai Pengujian Kebijakan Keamanan dan RLS TITIK...';
END $$;

-- -----------------------------------------------------------------------------
-- TEST 1: user_roles isolation (Normal users cannot insert/update user_roles)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_test_uid TEXT := 'test-usr-normal-001';
  v_err_caught BOOLEAN := FALSE;
BEGIN
  -- Simulate unauthenticated or non-admin context
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', v_test_uid), true);

  BEGIN
    -- Attempt to escalate own role to admin
    INSERT INTO public.user_roles (user_id, role) VALUES (v_test_uid, 'admin');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := TRUE;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 1 GAGAL: Pengguna biasa berhasil melakukan insert ke user_roles!';
  ELSE
    RAISE NOTICE 'TEST 1 LULUS: Eskalasi peran ke user_roles berhasil dicegah oleh RLS.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 2: Anonymity Integrity Check (reporter_user_id MUST be null for anonymous)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_test_uid TEXT := 'test-usr-reporter-001';
  v_err_caught BOOLEAN := FALSE;
BEGIN
  BEGIN
    -- Attempt to create report with anonymous type but with a user id attached
    INSERT INTO public.reports (
      id,
      public_reference,
      reporter_user_id,
      title,
      description,
      category,
      severity,
      status,
      publication_status,
      location,
      responsible_agency,
      media_urls,
      reporter_type,
      budget_context,
      events
    ) VALUES (
      'test-rep-leak-001',
      'TIK-2026-999999',
      v_test_uid, -- LEAK!
      'Laporan Bocor Akun',
      'Deskripsi uji kebocoran identitas',
      'Infrastruktur',
      'medium',
      'submitted',
      'published',
      '{"address": "Kota Bogor", "latitude": -6.59, "longitude": 106.79}'::jsonb,
      'Dinas PUPR',
      '["https://example.com/test.jpg"]'::jsonb,
      'anonymous',
      '{"sectorName": "Jalan", "allocatedBudget": 0}'::jsonb,
      '[]'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := TRUE;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 2 GAGAL: Laporan anonim diizinkan menyimpan reporter_user_id!';
  ELSE
    RAISE NOTICE 'TEST 2 LULUS: Constraint chk_reports_anonymity_integrity berhasil mencegah kebocoran ID pada laporan anonim.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 3: Profile Impersonation Prevention (Users cannot update others profile)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_alice TEXT := 'usr-alice-001';
  v_user_bob TEXT := 'usr-bob-002';
  v_rows_affected INTEGER;
BEGIN
  -- Setup test profile for Bob
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (v_user_bob, 'bob_official', 'Bob Original', 'citizen')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Bob Original';

  -- Alice logs in
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', v_user_alice), true);

  -- Alice tries to update Bob's profile
  UPDATE public.profiles
  SET display_name = 'Hacked by Alice'
  WHERE id = v_user_bob;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 3 GAGAL: Alice berhasil memperbarui profil Bob (RLS bocor)!';
  ELSE
    RAISE NOTICE 'TEST 3 LULUS: Alice tidak dapat memperbarui profil Bob (0 baris diubah).';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 4: Character Length Constraints (chk_posts_body_length <= 2000)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_err_caught BOOLEAN := FALSE;
  v_huge_body TEXT := repeat('A', 2001);
BEGIN
  BEGIN
    INSERT INTO public.posts (
      id,
      author_id,
      author_username,
      author_display_name,
      body,
      media,
      location_tag
    ) VALUES (
      'test-post-oversize',
      'usr-test-len',
      'test_len',
      'Test Len',
      v_huge_body,
      '[]'::jsonb,
      'Bogor'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := TRUE;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 4 GAGAL: Postingan melebihi 2000 karakter berhasil disimpan!';
  ELSE
    RAISE NOTICE 'TEST 4 LULUS: Constraint chk_posts_body_length berhasil membatasi postingan maksimal 2000 karakter.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST 5: Public Profiles View Email Redaction (Citizen emails hidden)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_col_count INTEGER;
BEGIN
  -- Verify public_profiles view does NOT expose email column
  SELECT COUNT(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'public_profiles'
    AND column_name = 'email';

  IF v_col_count > 0 THEN
    RAISE EXCEPTION 'TEST 5 GAGAL: View public_profiles mengekspos kolom email warga!';
  ELSE
    RAISE NOTICE 'TEST 5 LULUS: View public_profiles aman dan tidak mengekspos kolom email.';
  END IF;
END $$;

ROLLBACK; -- Never persist test modifications
