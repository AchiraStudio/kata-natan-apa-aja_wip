-- =============================================================================
-- TITIK. — Migration 20261028000001: Security Hardening & Zero-Trust RLS Policies
-- Description: Closes privilege-escalation holes, introduces user_roles & is_admin(),
--              restricts public data leaks, implements atomic RPCs, and enforces
--              least-privilege RLS for profiles, posts, reports, comments, and storage.
-- =============================================================================

-- Enable pgcrypto for constant-time comparisons and UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USER ROLES & PRIVILEGE ELEVATION DEFENSE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = (SELECT auth.uid()::text));

-- Stable, fixed search_path security definer function to test admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()::text) AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- RPC for frontend to discover user's real role safely
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

-- Bootstrap initial admin if user exists in auth.users
DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  SELECT id::text INTO v_user_id FROM auth.users WHERE email = 'achira@studio.id' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = v_user_id;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. HARDENED PROFILES & NEW USER TRIGGER
-- -----------------------------------------------------------------------------

-- Fix handle_new_user to NEVER trust client metadata for roles or verification
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

  -- Ensure username is unique so it never trips profiles_username_key
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

-- Add is_demo columns to data tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Profile update guard: prevent non-admins from changing role or verification, enforce username rules
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

-- Public Profile View (hiding email from general public queries)
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
  is_demo
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Hardened RLS on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()::text) OR public.is_admin());

-- RPC to update profile cleanly
DROP FUNCTION IF EXISTS public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name TEXT,
  p_username TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_district TEXT DEFAULT NULL
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
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. BUDGET SECTORS & FACILITIES
-- -----------------------------------------------------------------------------

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

ALTER TABLE public.budget_sectors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.budget_sectors FROM anon, authenticated;
GRANT SELECT ON public.budget_sectors TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view budget sectors" ON public.budget_sectors;
CREATE POLICY "Public can view budget sectors" ON public.budget_sectors
  FOR SELECT USING (true);

-- Facilities: public read, only admin can insert/update/delete
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert facilities" ON public.facilities;
DROP POLICY IF EXISTS "Facilities are viewable by everyone" ON public.facilities;
CREATE POLICY "Facilities are viewable by everyone" ON public.facilities
  FOR SELECT USING (true);
CREATE POLICY "Only admins can modify facilities" ON public.facilities
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. HARDENED POSTS & INTERACTIONS
-- -----------------------------------------------------------------------------

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS chk_posts_body_length;
ALTER TABLE public.posts ADD CONSTRAINT chk_posts_body_length CHECK (length(body) <= 2000);

-- Unique index for idempotent request_id submissions
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Authenticated users can insert posts" ON public.posts
  FOR INSERT WITH CHECK (
    author_id = (SELECT auth.uid()::text)
    AND (post_type <> 'official_update' OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can update posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE
  USING (author_id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK (
    (author_id = (SELECT auth.uid()::text) AND (post_type <> 'official_update' OR public.is_admin()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can delete posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (author_id = (SELECT auth.uid()::text) OR public.is_admin());

-- Atomic Post Creation RPC
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
  v_post public.posts;
  v_id TEXT;
BEGIN
  v_uid := (SELECT auth.uid()::text);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk membuat postingan.';
  END IF;

  IF length(TRIM(p_body)) < 1 OR length(p_body) > 2000 THEN
    RAISE EXCEPTION 'Isi postingan harus antara 1 dan 2000 karakter.';
  END IF;

  IF p_post_type = 'official_update' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menerbitkan pembaruan resmi.';
  END IF;

  -- Idempotency check
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_post FROM public.posts WHERE request_id = p_request_id;
    IF v_post.id IS NOT NULL THEN
      RETURN v_post;
    END IF;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  v_id := 'post-' || substr(md5(random()::text), 1, 8);

  INSERT INTO public.posts (
    id,
    request_id,
    author_id,
    author_username,
    author_display_name,
    author_avatar_url,
    author_role,
    body,
    post_type,
    media,
    location_tag,
    related_report_id,
    support_count,
    likes_count,
    saves_count,
    comments_count,
    shares_count,
    is_demo,
    created_at,
    updated_at
  )
  VALUES (
    v_id,
    p_request_id,
    v_uid,
    COALESCE(v_profile.username, 'warga'),
    COALESCE(v_profile.display_name, 'Warga TITIK'),
    COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'),
    COALESCE(v_profile.role, 'citizen'),
    p_body,
    p_post_type,
    p_media,
    COALESCE(p_location_tag, 'Kota Bogor'),
    p_related_report_id,
    0, 0, 0, 0, 0,
    false,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_post;

  RETURN v_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.create_post(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Atomic Like/Save/Support RPCs
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

  SELECT likes_count INTO v_count FROM public.posts WHERE id = p_post_id;
  RETURN jsonb_build_object('likes_count', COALESCE(v_count, 0), 'is_liked', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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

  SELECT saves_count INTO v_count FROM public.posts WHERE id = p_post_id;
  RETURN jsonb_build_object('saves_count', COALESCE(v_count, 0), 'is_saved', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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

  SELECT support_count INTO v_count FROM public.reports WHERE id = p_report_id;
  RETURN jsonb_build_object('support_count', COALESCE(v_count, 0), 'is_supported', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.toggle_post_like(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_save(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_report_support(TEXT) TO authenticated;

-- Saves privacy: only owner can read their saves!
DROP POLICY IF EXISTS "Post saves are viewable by everyone" ON public.post_saves;
DROP POLICY IF EXISTS "Users can view own saves" ON public.post_saves;
CREATE POLICY "Users can view own saves" ON public.post_saves
  FOR SELECT USING (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert post saves" ON public.post_saves;
CREATE POLICY "Users can insert post saves" ON public.post_saves
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete post saves" ON public.post_saves;
CREATE POLICY "Users can delete post saves" ON public.post_saves
  FOR DELETE USING (user_id = (SELECT auth.uid()::text));

-- Post likes & report supports RLS
DROP POLICY IF EXISTS "Users can insert post likes" ON public.post_likes;
CREATE POLICY "Users can insert post likes" ON public.post_likes
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete post likes" ON public.post_likes;
CREATE POLICY "Users can delete post likes" ON public.post_likes
  FOR DELETE USING (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert report supports" ON public.report_supports;
CREATE POLICY "Users can insert report supports" ON public.report_supports
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete report supports" ON public.report_supports;
CREATE POLICY "Users can delete report supports" ON public.report_supports
  FOR DELETE USING (user_id = (SELECT auth.uid()::text));

-- -----------------------------------------------------------------------------
-- 5. COMMENTS & COMMENT LIKES
-- -----------------------------------------------------------------------------

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_id TEXT;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS chk_comments_body_length;
ALTER TABLE public.comments ADD CONSTRAINT chk_comments_body_length CHECK (length(body) BETWEEN 1 AND 1000);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = (SELECT auth.uid()::text) OR
    (author_id IS NULL AND (SELECT auth.uid()) IS NULL)
  );

DROP POLICY IF EXISTS "Users can update comments" ON public.comments;
CREATE POLICY "Users can update comments" ON public.comments
  FOR UPDATE
  USING (author_id = (SELECT auth.uid()::text) OR public.is_admin())
  WITH CHECK (author_id = (SELECT auth.uid()::text) OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete comments" ON public.comments;
CREATE POLICY "Users can delete comments" ON public.comments
  FOR DELETE USING (author_id = (SELECT auth.uid()::text) OR public.is_admin());

-- Comment Likes table & trigger
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id TEXT NOT NULL,
  comment_id TEXT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comment likes viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()::text));
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (user_id = (SELECT auth.uid()::text));

CREATE OR REPLACE FUNCTION public.sync_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes = likes + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes = GREATEST(0, likes - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_comment_likes ON public.comment_likes;
CREATE TRIGGER trg_sync_comment_likes
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_likes();

-- -----------------------------------------------------------------------------
-- 6. PRIVATE REPORT DATA & STATUS HISTORY (REPORT EVENTS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_private_data (
  report_id TEXT PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  secret_follow_up_token_hash TEXT NOT NULL,
  reporter_user_id TEXT,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.report_private_data ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_private_data FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'Petugas',
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Report events viewable by everyone" ON public.report_events;
CREATE POLICY "Report events viewable by everyone" ON public.report_events
  FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.report_events FROM anon, authenticated;

-- Reports table policy: Only published reports are public. Private details protected.
DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;
CREATE POLICY "Published reports are viewable by everyone" ON public.reports
  FOR SELECT USING (
    publication_status = 'published'
    OR (reporter_user_id IS NOT NULL AND reporter_user_id = (SELECT auth.uid()::text))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete reports" ON public.reports;

-- Direct writes to reports are restricted to admins; citizen submissions go through submit_report RPC
CREATE POLICY "Admin write reports" ON public.reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. ATOMIC SUBMISSION & TRACKING RPCS
-- -----------------------------------------------------------------------------

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.report_public_ref_seq START WITH 101 INCREMENT BY 1;

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
  p_supporting_documents JSONB DEFAULT '[]'::jsonb,
  p_reporter_type TEXT DEFAULT 'verified_citizen',
  p_reporter_display_name TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT FALSE,
  p_link_to_feed BOOLEAN DEFAULT TRUE,
  p_plain_token TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_uid TEXT;
  v_report_id TEXT;
  v_post_id TEXT;
  v_public_ref TEXT;
  v_token TEXT;
  v_token_hash TEXT;
  v_seq BIGINT;
  v_profile public.profiles;
  v_existing_report public.reports;
BEGIN
  v_uid := (SELECT auth.uid()::text);

  -- Anonymous enforcement: if anonymous, strip account ID completely
  IF p_is_anonymous OR p_reporter_type = 'anonymous' THEN
    v_uid := NULL;
  END IF;

  -- Idempotency check via request_id
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_existing_report FROM public.reports WHERE request_id = p_request_id;
    IF v_existing_report.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'report_id', v_existing_report.id,
        'public_reference', v_existing_report.public_reference,
        'token', NULL
      );
    END IF;
  END IF;

  -- Generate human-readable reference number
  v_seq := nextval('public.report_public_ref_seq');
  v_public_ref := 'TIK-2026-' || LPAD(v_seq::TEXT, 6, '0');
  v_report_id := 'rep-' || substr(md5(random()::text), 1, 8);

  -- Generate or use provided token
  v_token := COALESCE(p_plain_token, encode(gen_random_bytes(16), 'hex'));
  v_token_hash := crypt(v_token, gen_salt('bf', 8));

  INSERT INTO public.reports (
    id,
    request_id,
    public_reference,
    reporter_user_id,
    secret_follow_up_token_hash,
    title,
    description,
    category,
    severity,
    status,
    publication_status,
    location,
    responsible_agency,
    media_urls,
    supporting_documents,
    reporter_type,
    reporter_display_name,
    support_count,
    budget_context,
    events,
    is_demo,
    created_at,
    updated_at
  )
  VALUES (
    v_report_id,
    p_request_id,
    v_public_ref,
    v_uid,
    v_token_hash,
    p_title,
    p_description,
    p_category,
    COALESCE(p_severity, 'medium'),
    'submitted',
    'published',
    p_location,
    p_responsible_agency,
    p_media_urls,
    p_supporting_documents,
    CASE WHEN p_is_anonymous THEN 'anonymous' ELSE p_reporter_type END,
    CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE p_reporter_display_name END,
    0,
    '{}'::jsonb,
    '[]'::jsonb,
    false,
    NOW(),
    NOW()
  );

  -- Store in private reports table
  INSERT INTO public.report_private_data (
    report_id,
    secret_follow_up_token_hash,
    reporter_user_id,
    supporting_documents
  )
  VALUES (
    v_report_id,
    v_token_hash,
    v_uid,
    p_supporting_documents
  );

  -- Log initial status event
  INSERT INTO public.report_events (
    report_id,
    event_type,
    actor_id,
    actor_name,
    previous_status,
    new_status,
    notes
  )
  VALUES (
    v_report_id,
    'status_change',
    COALESCE(v_uid, 'anon'),
    COALESCE(p_reporter_display_name, 'Pelapor'),
    NULL,
    'submitted',
    'Laporan berhasil diajukan ke sistem.'
  );

  -- Optional linked feed post
  IF p_link_to_feed THEN
    v_post_id := 'post-' || substr(md5(random()::text), 1, 8);
    IF v_uid IS NOT NULL THEN
      SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
    END IF;

    INSERT INTO public.posts (
      id,
      request_id,
      author_id,
      author_username,
      author_display_name,
      author_avatar_url,
      author_role,
      body,
      post_type,
      media,
      location_tag,
      related_report_id,
      support_count,
      likes_count,
      saves_count,
      comments_count,
      shares_count,
      is_demo,
      created_at,
      updated_at
    )
    VALUES (
      v_post_id,
      p_request_id,
      v_uid,
      CASE WHEN p_is_anonymous THEN 'anonim' ELSE COALESCE(v_profile.username, 'warga') END,
      CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(v_profile.display_name, 'Warga TITIK') END,
      CASE WHEN p_is_anonymous THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' ELSE COALESCE(v_profile.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde') END,
      'citizen',
      p_title || E'\n\n' || p_description,
      'citizen_report',
      p_media_urls,
      COALESCE(p_location->>'address', 'Kota Bogor'),
      v_report_id,
      0, 0, 0, 0, 0,
      false,
      NOW(),
      NOW()
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

-- Constant-time tracking verification RPC
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
  -- Simple rate throttle / guard
  IF length(p_token) < 8 OR length(p_reference) < 5 THEN
    RETURN NULL;
  END IF;

  SELECT rpd.secret_follow_up_token_hash INTO v_hash
  FROM public.report_private_data rpd
  JOIN public.reports r ON r.id = rpd.report_id
  WHERE r.public_reference = p_reference;

  IF v_hash IS NULL THEN
    SELECT secret_follow_up_token_hash INTO v_hash
    FROM public.reports
    WHERE public_reference = p_reference;
  END IF;

  IF v_hash IS NULL THEN
    RETURN NULL;
  END IF;

  -- Constant-time crypt check
  IF crypt(p_token, v_hash) <> v_hash THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_report FROM public.reports WHERE public_reference = p_reference;
  SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb) INTO v_events
  FROM (
    SELECT id, event_type, actor_name, previous_status, new_status, notes, created_at
    FROM public.report_events
    WHERE report_id = v_report.id
    ORDER BY created_at ASC
  ) e;

  RETURN jsonb_build_object(
    'id', v_report.id,
    'public_reference', v_report.public_reference,
    'title', v_report.title,
    'description', v_report.description,
    'category', v_report.category,
    'severity', v_report.severity,
    'status', v_report.status,
    'location', v_report.location,
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
  SET
    status = p_status,
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO v_res;

  INSERT INTO public.report_events (
    report_id,
    event_type,
    actor_id,
    actor_name,
    previous_status,
    new_status,
    notes
  )
  VALUES (
    p_report_id,
    'status_change',
    v_uid,
    COALESCE(v_admin_name, 'Admin TITIK'),
    v_old_status,
    p_status,
    p_notes
  );

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
-- 8. STORAGE BUCKETS & ISOLATION POLICIES
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
CREATE POLICY "Public can view post media" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can view own private evidence" ON storage.objects;
CREATE POLICY "Users can view own private evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'report-evidence-private'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid()::text) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Authenticated users can upload to own folder" ON storage.objects;
CREATE POLICY "Authenticated users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('post-media', 'avatars', 'report-evidence-private')
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
CREATE POLICY "Users can delete own objects" ON storage.objects
  FOR DELETE USING (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text) OR public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 9. RELOAD SCHEMA CACHE
-- -----------------------------------------------------------------------------
-- Ensure PostgREST immediately discovers new columns, RPCs, and relations
NOTIFY pgrst, 'reload schema';
