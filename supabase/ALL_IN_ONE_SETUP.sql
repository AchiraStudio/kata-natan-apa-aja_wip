-- =============================================================================
-- TITIK. — ALL-IN-ONE MASTER DATABASE SETUP & SECURITY HARDENING
-- Project: kata-natan-apa-aja (oetnxbovjwovaddivmwf)
-- Description: Complete, self-contained, idempotent SQL script that sets up:
--              1. Tables (user_roles, profiles, facilities, reports, posts, comments, budgets)
--              2. Least-privilege RLS policies & secure public views
--              3. Atomic RPCs (create_post, submit_report, toggle likes/saves/supports)
--              4. Storage buckets & policies (post-media, avatars, report-evidence-private)
--              5. Seed accounts in auth.users (admin@titik.id & warga@titik.id)
--              6. Schema cache reload for PostgREST
-- Safe to run repeatedly in Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONS & SEQUENCES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS public.report_public_ref_seq START WITH 101 INCREMENT BY 1;

-- -----------------------------------------------------------------------------
-- 1. BASE TABLES DEFINITION
-- -----------------------------------------------------------------------------

-- User Roles (Separated from client-accessible profiles table)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (Citizen & Official Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  verified_agency TEXT,
  district TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  banner_url TEXT,
  background_theme TEXT DEFAULT 'editorial_forest',
  website_url TEXT,
  custom_status TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities (Civic Infrastructure)
CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  responsible_agency TEXT NOT NULL,
  active_reports_count INTEGER NOT NULL DEFAULT 0,
  resolved_reports_count INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports (Civic Issue Submissions)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  public_reference TEXT UNIQUE NOT NULL,
  reporter_user_id TEXT,
  secret_follow_up_token_hash TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'in_progress', 'resolved', 'rejected')),
  publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('published', 'under_review', 'rejected', 'archived')),
  location JSONB NOT NULL,
  facility_name TEXT,
  responsible_agency TEXT NOT NULL DEFAULT 'Pemerintah Kota Bogor',
  estimated_cost NUMERIC,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  reporter_type TEXT NOT NULL DEFAULT 'verified_citizen' CHECK (reporter_type IN ('verified_citizen', 'anonymous', 'community_representative')),
  reporter_display_name TEXT,
  support_count INTEGER NOT NULL DEFAULT 0,
  budget_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  request_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Events Timeline
CREATE TABLE IF NOT EXISTS public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Private Data (Zero-leakage table for secret tracking token hashes)
CREATE TABLE IF NOT EXISTS public.report_private_data (
  report_id TEXT PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  reporter_user_id TEXT,
  secret_follow_up_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feed Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  author_avatar_url TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'citizen',
  body TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'citizen_report' CHECK (post_type IN ('citizen_report', 'community_discussion', 'official_update')),
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_tag TEXT NOT NULL DEFAULT 'Kota Bogor',
  related_report_id TEXT REFERENCES public.reports(id) ON DELETE SET NULL,
  support_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  request_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_posts_body_length CHECK (length(body) <= 2000)
);

-- Post Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Post Saves
CREATE TABLE IF NOT EXISTS public.post_saves (
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Report Civic Supports
CREATE TABLE IF NOT EXISTS public.report_supports (
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

-- Private saved-report collection
CREATE TABLE IF NOT EXISTS public.report_saves (
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  body TEXT NOT NULL,
  parent_id TEXT REFERENCES public.comments(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id TEXT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Budget Sectors (APBD Transparency)
CREATE TABLE IF NOT EXISTS public.budget_sectors (
  id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  department TEXT NOT NULL,
  allocated_budget NUMERIC NOT NULL,
  realization_budget NUMERIC NOT NULL,
  fiscal_year INTEGER NOT NULL DEFAULT 2026,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all is_demo columns exist if tables already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure request_id columns exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;

-- -----------------------------------------------------------------------------
-- 2. VIEWS (Public Profile without exposing email)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- Admin Check (Security Definer, fixed search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()::text) AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- Discover User Role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles
  WHERE user_id = (SELECT auth.uid()::text);
  RETURN COALESCE(v_role, 'citizen');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Hardened New User Trigger (Never trust client metadata for admin role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_username TEXT;
  v_cleaned_username TEXT;
BEGIN
  v_raw_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_cleaned_username := LOWER(REGEXP_REPLACE(v_raw_username, '[^a-z0-9_.]', '', 'g'));
  IF length(v_cleaned_username) < 3 THEN
    v_cleaned_username := 'warga_' || substr(md5(random()::text), 1, 6);
  END IF;

  -- Prevent collision on profiles_username_key
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_cleaned_username AND id <> new.id::text) THEN
    v_cleaned_username := v_cleaned_username || '_' || substr(md5(random()::text), 1, 4);
  END IF;

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
    new.id::text,
    v_cleaned_username,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    'citizen', -- Always citizen! No self-service admin
    COALESCE(new.raw_user_meta_data->>'district', 'Bogor'),
    false,
    'Warga terdaftar di portal TITIK.',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-Confirm Users Trigger (Instant Signups Without Email Verification)
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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

-- Guard Profile Updates
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.is_verified := OLD.is_verified;
    NEW.verified_agency := OLD.verified_agency;
    NEW.id := OLD.id;
    NEW.is_demo := OLD.is_demo;
  END IF;

  IF NEW.username IS NOT NULL AND NEW.username <> OLD.username THEN
    NEW.username := LOWER(NEW.username);
    IF NOT (NEW.username ~ '^[a-z0-9_.]{3,24}$') THEN
      RAISE EXCEPTION 'Username harus terdiri dari 3-24 karakter (huruf kecil, angka, titik, atau garis bawah).';
    END IF;
    IF NEW.username IN ('admin', 'administrator', 'titik', 'support', 'help', 'root', 'system', 'official') THEN
      RAISE EXCEPTION 'Username ini dilindungi dan tidak dapat digunakan.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_profile_update ON public.profiles;
CREATE TRIGGER trg_check_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_update();

-- Update Own Profile RPC
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
RETURNS public.profiles AS 
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
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. ATOMIC INTERACTION RPCS
-- -----------------------------------------------------------------------------

-- Create Post RPC
DROP FUNCTION IF EXISTS public.create_post(UUID, TEXT, TEXT, JSONB, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_post(
  p_request_id UUID,
  p_body TEXT,
  p_post_type TEXT DEFAULT 'citizen_report',
  p_media JSONB DEFAULT '[]'::jsonb,
  p_location_tag TEXT DEFAULT 'Kota Bogor',
  p_related_report_id TEXT DEFAULT NULL
)
RETURNS public.posts AS $$
DECLARE
  v_uid TEXT;
  v_profile public.profiles;
  v_post_id TEXT;
  v_post public.posts;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk menerbitkan postingan.';
  END IF;

  -- Idempotency check
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_post FROM public.posts WHERE request_id = p_request_id;
    IF v_post.id IS NOT NULL THEN
      RETURN v_post;
    END IF;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

  IF p_post_type = 'official_update' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat menerbitkan pembaruan resmi.';
  END IF;

  v_post_id := 'post-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);

  INSERT INTO public.posts (
    id, author_id, author_username, author_display_name, author_avatar_url, author_role,
    body, post_type, media, location_tag, related_report_id, is_demo, request_id, created_at
  )
  VALUES (
    v_post_id, v_uid, v_profile.username, v_profile.display_name,
    COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
    v_profile.role, p_body, p_post_type, COALESCE(p_media, '[]'::jsonb),
    p_location_tag, p_related_report_id, false, p_request_id, NOW()
  )
  RETURNING * INTO v_post;

  RETURN v_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.create_post(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Atomic Like Toggle
DROP FUNCTION IF EXISTS public.toggle_post_like(TEXT);
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, v_uid) ON CONFLICT DO NOTHING;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.post_likes WHERE post_id = p_post_id;
  UPDATE public.posts SET likes_count = v_count WHERE id = p_post_id;

  RETURN jsonb_build_object('likes_count', v_count, 'is_liked', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Atomic Save Toggle
DROP FUNCTION IF EXISTS public.toggle_post_save(TEXT);
CREATE OR REPLACE FUNCTION public.toggle_post_save(p_post_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_saves WHERE post_id = p_post_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.post_saves WHERE post_id = p_post_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.post_saves (post_id, user_id) VALUES (p_post_id, v_uid) ON CONFLICT DO NOTHING;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.post_saves WHERE post_id = p_post_id;
  UPDATE public.posts SET saves_count = v_count WHERE id = p_post_id;

  RETURN jsonb_build_object('saves_count', v_count, 'is_saved', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Atomic Report Support Toggle
DROP FUNCTION IF EXISTS public.toggle_report_support(TEXT);
CREATE OR REPLACE FUNCTION public.toggle_report_support(p_report_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.report_supports WHERE report_id = p_report_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.report_supports WHERE report_id = p_report_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.report_supports (report_id, user_id) VALUES (p_report_id, v_uid) ON CONFLICT DO NOTHING;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.report_supports WHERE report_id = p_report_id;
  UPDATE public.reports SET support_count = v_count WHERE id = p_report_id;
  UPDATE public.posts SET support_count = v_count WHERE related_report_id = p_report_id;

  RETURN jsonb_build_object('support_count', v_count, 'is_supported', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.toggle_post_like(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_save(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_report_support(TEXT) TO authenticated;

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

-- Submit Report RPC
DROP FUNCTION IF EXISTS public.submit_report(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, JSONB, JSONB, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION public.submit_report(
  p_request_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_severity TEXT,
  p_location JSONB,
  p_responsible_agency TEXT,
  p_media_urls JSONB,
  p_supporting_documents JSONB,
  p_reporter_type TEXT,
  p_reporter_display_name TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT FALSE,
  p_link_to_feed BOOLEAN DEFAULT TRUE,
  p_facility_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_report_id TEXT;
  v_public_ref TEXT;
  v_token TEXT;
  v_token_hash TEXT;
  v_profile public.profiles;
  v_seq_num BIGINT;
  v_existing_report public.reports;
BEGIN
  v_uid := (SELECT auth.uid()::text);

  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_existing_report FROM public.reports WHERE request_id = p_request_id;
    IF v_existing_report.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'report_id', v_existing_report.id,
        'public_reference', v_existing_report.public_reference,
        'token', 'ALREADY_SUBMITTED'
      );
    END IF;
  END IF;

  v_seq_num := nextval('public.report_public_ref_seq');
  v_public_ref := 'BGR-2026-' || LPAD(v_seq_num::text, 4, '0');
  v_report_id := 'rep-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
  v_token := encode(gen_random_bytes(16), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  IF v_uid IS NOT NULL AND NOT p_is_anonymous THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  END IF;

  INSERT INTO public.reports (
    id, public_reference, reporter_user_id, secret_follow_up_token_hash, title, description,
    category, severity, status, publication_status, location, facility_name, responsible_agency,
    media_urls, supporting_documents, reporter_type, reporter_display_name, support_count,
    is_demo, request_id, created_at, updated_at
  )
  VALUES (
    v_report_id, v_public_ref,
    CASE WHEN p_is_anonymous THEN NULL ELSE v_uid END,
    NULL, -- Private token hash stored strictly in report_private_data
    p_title, p_description, p_category, p_severity, 'submitted', 'published',
    p_location, p_facility_name, p_responsible_agency,
    COALESCE(p_media_urls, '[]'::jsonb), COALESCE(p_supporting_documents, '[]'::jsonb),
    p_reporter_type,
    CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(p_reporter_display_name, v_profile.display_name, 'Warga TITIK') END,
    0, false, p_request_id, NOW(), NOW()
  );

  INSERT INTO public.report_private_data (report_id, reporter_user_id, secret_follow_up_token_hash)
  VALUES (v_report_id, CASE WHEN p_is_anonymous THEN NULL ELSE v_uid END, v_token_hash);

  INSERT INTO public.report_events (report_id, event_type, actor_id, actor_name, previous_status, new_status, notes)
  VALUES (
    v_report_id, 'SUBMITTED', v_uid,
    CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(p_reporter_display_name, v_profile.display_name, 'Warga TITIK') END,
    NULL, 'submitted', 'Laporan diajukan warga.'
  );

  IF p_link_to_feed THEN
    INSERT INTO public.posts (
      id, author_id, author_username, author_display_name, author_avatar_url, author_role,
      body, post_type, media, location_tag, related_report_id, is_demo, created_at
    )
    VALUES (
      'post-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10),
      COALESCE(v_uid, 'usr-anon'),
      COALESCE(v_profile.username, 'warga.anonim'),
      CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(p_reporter_display_name, v_profile.display_name, 'Warga') END,
      COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
      COALESCE(v_profile.role, 'citizen'),
      p_title || E'\n\n' || p_description,
      'citizen_report', COALESCE(p_media_urls, '[]'::jsonb),
      COALESCE(p_location->>'district', 'Kota Bogor'),
      v_report_id, false, NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'report_id', v_report_id,
    'public_reference', v_public_ref,
    'token', v_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.submit_report(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, JSONB, JSONB, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT) TO anon, authenticated;

-- Tracking RPC by Token
DROP FUNCTION IF EXISTS public.get_report_by_follow_up_token(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.get_report_by_follow_up_token(
  p_reference TEXT,
  p_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_hash TEXT;
  v_report public.reports;
  v_events JSONB;
BEGIN
  IF length(p_token) < 8 OR length(p_reference) < 5 THEN
    RETURN NULL;
  END IF;

  SELECT rpd.secret_follow_up_token_hash INTO v_hash
  FROM public.report_private_data rpd
  JOIN public.reports r ON r.id = rpd.report_id
  WHERE r.public_reference = p_reference;

  IF v_hash IS NULL THEN
    RETURN NULL;
  END IF;

  IF encode(digest(p_token, 'sha256'), 'hex') <> v_hash THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_report FROM public.reports WHERE public_reference = p_reference;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'eventType', event_type, 'actorName', actor_name,
    'previousStatus', previous_status, 'newStatus', new_status,
    'notes', notes, 'timestamp', created_at
  ) ORDER BY created_at ASC), '[]'::jsonb) INTO v_events
  FROM public.report_events WHERE report_id = v_report.id;

  RETURN jsonb_build_object(
    'id', v_report.id,
    'public_reference', v_report.public_reference,
    'title', v_report.title,
    'description', v_report.description,
    'category', v_report.category,
    'severity', v_report.severity,
    'status', v_report.status,
    'publication_status', v_report.publication_status,
    'location', v_report.location,
    'facility_name', v_report.facility_name,
    'responsible_agency', v_report.responsible_agency,
    'media_urls', v_report.media_urls,
    'reporter_type', v_report.reporter_type,
    'reporter_display_name', v_report.reporter_display_name,
    'support_count', v_report.support_count,
    'events', v_events,
    'created_at', v_report.created_at,
    'updated_at', v_report.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.get_report_by_follow_up_token(TEXT, TEXT) TO anon, authenticated;

-- Admin Moderation RPCs
DROP FUNCTION IF EXISTS public.admin_update_report_status(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_update_report_status(
  p_report_id TEXT,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
DECLARE
  v_uid TEXT;
  v_old_status TEXT;
  v_res public.reports;
  v_admin_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan.';
  END IF;

  v_uid := (SELECT auth.uid()::text);
  SELECT status INTO v_old_status FROM public.reports WHERE id = p_report_id;
  SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = v_uid;

  UPDATE public.reports
  SET status = p_status, updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO v_res;

  INSERT INTO public.report_events (report_id, event_type, actor_id, actor_name, previous_status, new_status, notes)
  VALUES (p_report_id, 'status_change', v_uid, COALESCE(v_admin_name, 'Admin TITIK'), v_old_status, p_status, p_notes);

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP FUNCTION IF EXISTS public.admin_delete_report(TEXT);
CREATE OR REPLACE FUNCTION public.admin_delete_report(p_report_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berwenang menghapus laporan.';
  END IF;

  DELETE FROM public.reports WHERE id = p_report_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_update_report_status(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_report(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (Least-Privilege Enforcement)
-- -----------------------------------------------------------------------------

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (user_id = (SELECT auth.uid()::text));

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()::text));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()::text) OR public.is_admin());

-- Facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Facilities are viewable by everyone" ON public.facilities;
DROP POLICY IF EXISTS "Anyone can insert facilities" ON public.facilities;
CREATE POLICY "Facilities are viewable by everyone" ON public.facilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can modify facilities" ON public.facilities;
CREATE POLICY "Only admins can modify facilities" ON public.facilities FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Budget Sectors
ALTER TABLE public.budget_sectors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.budget_sectors FROM anon, authenticated;
GRANT SELECT ON public.budget_sectors TO anon, authenticated;
DROP POLICY IF EXISTS "Public can view budget sectors" ON public.budget_sectors;
CREATE POLICY "Public can view budget sectors" ON public.budget_sectors FOR SELECT USING (true);

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Authenticated users can insert posts" ON public.posts FOR INSERT WITH CHECK (
  author_id = (SELECT auth.uid()::text) AND (post_type <> 'official_update' OR public.is_admin())
);
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE
  USING (author_id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK ((author_id = (SELECT auth.uid()::text) AND (post_type <> 'official_update' OR public.is_admin())) OR public.is_admin());
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (author_id = (SELECT auth.uid()::text) OR public.is_admin());

-- Post Likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own post likes" ON public.post_likes;
CREATE POLICY "Users can manage their own post likes" ON public.post_likes FOR ALL
  USING (user_id = (SELECT auth.uid()::text)) WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Post Saves
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own saves" ON public.post_saves;
CREATE POLICY "Users can only view their own saves" ON public.post_saves FOR SELECT USING (user_id = (SELECT auth.uid()::text));
DROP POLICY IF EXISTS "Users can manage their own saves" ON public.post_saves;
CREATE POLICY "Users can manage their own saves" ON public.post_saves FOR ALL
  USING (user_id = (SELECT auth.uid()::text)) WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE
  USING (author_id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK (author_id = (SELECT auth.uid()::text) OR public.is_admin());
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (author_id = (SELECT auth.uid()::text) OR public.is_admin());

-- Comment Likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comment likes viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage comment likes" ON public.comment_likes;
CREATE POLICY "Users can manage comment likes" ON public.comment_likes FOR ALL
  USING (user_id = (SELECT auth.uid()::text)) WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published reports viewable by everyone" ON public.reports;
DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;
CREATE POLICY "Reports viewable by everyone" ON public.reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert reports directly" ON public.reports;
CREATE POLICY "Admins can insert reports directly" ON public.reports FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Only reporter or admin can update report" ON public.reports;
CREATE POLICY "Only reporter or admin can update report" ON public.reports FOR UPDATE
  USING ((reporter_user_id IS NOT NULL AND reporter_user_id = (SELECT auth.uid()::text)) OR public.is_admin())
  WITH CHECK ((reporter_user_id IS NOT NULL AND reporter_user_id = (SELECT auth.uid()::text)) OR public.is_admin());
DROP POLICY IF EXISTS "Only admins can delete reports" ON public.reports;
CREATE POLICY "Only admins can delete reports" ON public.reports FOR DELETE USING (public.is_admin());

-- Report Supports
ALTER TABLE public.report_supports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Supports viewable by everyone" ON public.report_supports;
CREATE POLICY "Supports viewable by everyone" ON public.report_supports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage report supports" ON public.report_supports;
CREATE POLICY "Users can manage report supports" ON public.report_supports FOR ALL
  USING (user_id = (SELECT auth.uid()::text)) WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Saved reports are private to the user who saved them
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

-- Report Events
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Report events viewable by everyone" ON public.report_events;
CREATE POLICY "Report events viewable by everyone" ON public.report_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only system and admin can insert report events" ON public.report_events;
CREATE POLICY "Only system and admin can insert report events" ON public.report_events FOR INSERT WITH CHECK (public.is_admin());

-- Report Private Data
ALTER TABLE public.report_private_data ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_private_data FROM anon, authenticated;
DROP POLICY IF EXISTS "Reporter or admin can view private data" ON public.report_private_data;
CREATE POLICY "Reporter or admin can view private data" ON public.report_private_data FOR SELECT
  USING ((reporter_user_id IS NOT NULL AND reporter_user_id = (SELECT auth.uid()::text)) OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. STORAGE BUCKETS & POLICIES
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('post-media', 'post-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('report-evidence-private', 'report-evidence-private', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view post media" ON storage.objects;
CREATE POLICY "Public can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can view own private evidence" ON storage.objects;
CREATE POLICY "Users can view own private evidence" ON storage.objects FOR SELECT
  USING (bucket_id = 'report-evidence-private' AND ((storage.foldername(name))[1] = (SELECT auth.uid()::text) OR public.is_admin()));

DROP POLICY IF EXISTS "Authenticated users can upload to own folder" ON storage.objects;
CREATE POLICY "Authenticated users can upload to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('post-media', 'avatars', 'report-evidence-private') AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
CREATE POLICY "Users can delete own objects" ON storage.objects FOR DELETE
  USING ((storage.foldername(name))[1] = (SELECT auth.uid()::text) OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. SEED DETERMINISTIC AUTH ACCOUNTS (Admin & Citizen)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_citizen_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_existing_admin_id UUID;
  v_existing_citizen_id UUID;
  v_encrypted_admin_pw TEXT;
  v_encrypted_citizen_pw TEXT;
BEGIN
  -- Generate secure bcrypt hashes
  v_encrypted_admin_pw := crypt('admin2026', gen_salt('bf'));
  v_encrypted_citizen_pw := crypt('titik2026', gen_salt('bf'));

  -- Clean up conflicting pre-existing profiles with duplicate usernames
  DELETE FROM public.profiles
  WHERE username IN ('admin.pupr', 'budi.santoso')
    AND id NOT IN (SELECT id::text FROM auth.users WHERE email IN ('admin@titik.id', 'warga@titik.id'));

  -- Administrator (admin@titik.id / admin2026)
  SELECT id INTO v_existing_admin_id FROM auth.users WHERE email = 'admin@titik.id' LIMIT 1;
  IF v_existing_admin_id IS NOT NULL THEN
    v_admin_id := v_existing_admin_id;
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_admin_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      aud = 'authenticated',
      role = 'authenticated',
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"username":"admin.pupr","display_name":"Administrator Dinas PUPR","district":"Bogor Tengah"}'::jsonb,
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      updated_at = NOW()
    WHERE id = v_admin_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin@titik.id', v_encrypted_admin_pw, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin.pupr","display_name":"Administrator Dinas PUPR","district":"Bogor Tengah"}'::jsonb,
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;

  -- Normal Citizen (warga@titik.id / titik2026)
  SELECT id INTO v_existing_citizen_id FROM auth.users WHERE email = 'warga@titik.id' LIMIT 1;
  IF v_existing_citizen_id IS NOT NULL THEN
    v_citizen_id := v_existing_citizen_id;
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_citizen_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      aud = 'authenticated',
      role = 'authenticated',
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"username":"budi.santoso","display_name":"Budi Santoso","district":"Bogor Selatan"}'::jsonb,
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      updated_at = NOW()
    WHERE id = v_citizen_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_citizen_id, 'authenticated', 'authenticated',
      'warga@titik.id', v_encrypted_citizen_pw, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"budi.santoso","display_name":"Budi Santoso","district":"Bogor Selatan"}'::jsonb,
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;

  -- CRITICAL FOR SUPABASE GOTRUE: auth.identities
  -- GoTrue crashes with 500 on grant_type=password if identity records are missing
  DELETE FROM auth.identities
  WHERE user_id IN (v_admin_id, v_citizen_id)
     OR provider_id IN (v_admin_id::text, v_citizen_id::text);

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@titik.id'),
    'email',
    v_admin_id::text,
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    v_citizen_id,
    jsonb_build_object('sub', v_citizen_id::text, 'email', 'warga@titik.id'),
    'email',
    v_citizen_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- Upsert Profile for Administrator
  INSERT INTO public.profiles (
    id, username, display_name, email, avatar_url, role, district, is_verified, bio, is_demo
  )
  VALUES (
    v_admin_id::text, 'admin.pupr', 'Administrator Dinas PUPR', 'admin@titik.id',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'admin', 'Bogor Tengah', true, 'Akun resmi verifikator dan pengawas infrastruktur Dinas PUPR Kota Bogor.', false
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin', display_name = 'Administrator Dinas PUPR', username = 'admin.pupr',
    is_verified = true, avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';

  -- Upsert Profile for Normal Citizen
  INSERT INTO public.profiles (
    id, username, display_name, email, avatar_url, role, district, is_verified, bio, is_demo
  )
  VALUES (
    v_citizen_id::text, 'budi.santoso', 'Budi Santoso', 'warga@titik.id',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'citizen', 'Bogor Selatan', true, 'Warga aktif pemerhati fasilitas umum dan transparansi APBD Kota Bogor.', false
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'citizen', display_name = 'Budi Santoso', username = 'budi.santoso',
    is_verified = true, avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  -- Assign Admin Role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_id::text, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- Also grant admin to achira@studio.id if exists
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id::text, 'admin'
  FROM auth.users u WHERE u.email = 'achira@studio.id'
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

END $$;

-- -----------------------------------------------------------------------------
-- 8. RELOAD SCHEMA CACHE
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
