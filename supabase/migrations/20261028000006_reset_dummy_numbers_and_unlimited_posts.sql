-- =============================================================================
-- Migration: 20261028000006_reset_dummy_numbers_and_unlimited_posts.sql
-- Description: 
--   1. Reset legacy dummy counts across all posts and reports to exact 0 (synced to real interaction records).
--   2. Update create_post RPC to use full UUID generation ('post_' || gen_random_uuid()) for unlimited collision-free posts.
--   3. Synchronize post support_count whenever report_supports are toggled.
-- =============================================================================

-- 1. Reset metrics to exact count of real relations (or 0 if none)
UPDATE public.posts p
SET 
  likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = p.id),
  saves_count = (SELECT count(*) FROM public.post_saves WHERE post_id = p.id),
  comments_count = (SELECT count(*) FROM public.comments WHERE post_id = p.id),
  support_count = CASE 
    WHEN p.related_report_id IS NOT NULL 
    THEN (SELECT count(*) FROM public.report_supports WHERE report_id = p.related_report_id)
    ELSE 0 
  END,
  shares_count = 0;

UPDATE public.reports r
SET support_count = (SELECT count(*) FROM public.report_supports WHERE report_id = r.id);

-- 2. Update create_post RPC to support unlimited collision-free posts with gen_random_uuid()
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
  v_id := 'post_' || gen_random_uuid()::text;

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
  ) VALUES (
    v_id,
    p_request_id,
    v_uid,
    COALESCE(v_profile.username, 'warga'),
    COALESCE(v_profile.display_name, 'Warga TITIK'),
    v_profile.avatar_url,
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

-- 3. Robust atomic triggers and functions for likes, saves, and supports
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

  SELECT count(*) INTO v_count FROM public.post_likes WHERE post_id = p_post_id;
  UPDATE public.posts SET likes_count = v_count WHERE id = p_post_id;

  RETURN jsonb_build_object('likes_count', COALESCE(v_count, 0), 'is_liked', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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

  SELECT count(*) INTO v_count FROM public.post_saves WHERE post_id = p_post_id;
  UPDATE public.posts SET saves_count = v_count WHERE id = p_post_id;

  RETURN jsonb_build_object('saves_count', COALESCE(v_count, 0), 'is_saved', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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

  SELECT count(*) INTO v_count FROM public.report_supports WHERE report_id = p_report_id;
  UPDATE public.reports SET support_count = v_count WHERE id = p_report_id;
  UPDATE public.posts SET support_count = v_count WHERE related_report_id = p_report_id;

  RETURN jsonb_build_object('support_count', COALESCE(v_count, 0), 'is_supported', NOT v_exists);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.toggle_post_like(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_save(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_report_support(TEXT) TO authenticated;

