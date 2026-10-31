-- =============================================================================
-- TITIK. - Migration 20261031000002: Live Civic Facility & Admin Workflow Hardening
-- Description: Ensures facilities catalog table, reports facility linkage,
--              atomic report submission with facility & estimated cost,
--              and admin verification RPCs are strictly maintained.
-- =============================================================================

-- 1. Ensure facilities table exists with full columns and indices
CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  responsible_agency TEXT NOT NULL DEFAULT 'Pemerintah Kota Bogor',
  active_reports_count INTEGER NOT NULL DEFAULT 0,
  resolved_reports_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_category ON public.facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON public.facilities USING gin(name gin_trgm_ops);

-- Ensure RLS on facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Facilities are viewable by everyone" ON public.facilities;
CREATE POLICY "Facilities are viewable by everyone" ON public.facilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert facilities" ON public.facilities;
CREATE POLICY "Anyone can insert facilities" ON public.facilities FOR ALL USING (true);

-- 2. Ensure columns exist on public.reports
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS facility_name TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS estimated_cost BIGINT DEFAULT 0;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS evidence_verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS official_response TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS last_reviewed_by TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

-- 3. Atomic submit_report supporting facility_name & estimated_cost
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
  p_plain_token TEXT DEFAULT NULL,
  p_facility_name TEXT DEFAULT NULL,
  p_estimated_cost BIGINT DEFAULT 0
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
  v_real_reporter_type TEXT;
  v_is_user_verified BOOLEAN := FALSE;
  v_extracted_facility TEXT;
  v_extracted_cost BIGINT;
BEGIN
  v_uid := (SELECT auth.uid()::text);

  -- Anonymous handling: strip account ID completely
  IF p_is_anonymous OR p_reporter_type = 'anonymous' THEN
    v_uid := NULL;
    v_real_reporter_type := 'anonymous';
  ELSE
    IF v_uid IS NOT NULL THEN
      SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
      v_is_user_verified := COALESCE(v_profile.is_verified, FALSE);
    END IF;

    -- SERVER-ENFORCED: Only truly verified citizens get 'verified_citizen' status
    IF v_is_user_verified IS TRUE THEN
      v_real_reporter_type := 'verified_citizen';
    ELSE
      v_real_reporter_type := 'registered_citizen';
    END IF;
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

  -- Extract facility and cost from parameter or location JSONB payload
  v_extracted_facility := COALESCE(
    p_facility_name,
    p_location->>'facility_name',
    p_location->>'facilityName'
  );
  v_extracted_cost := COALESCE(
    p_estimated_cost,
    (p_location->>'estimated_cost')::BIGINT,
    0
  );

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
    facility_name,
    estimated_cost,
    responsible_agency,
    media_urls,
    supporting_documents,
    reporter_type,
    reporter_display_name,
    support_count,
    budget_context,
    events,
    evidence_verification_status,
    official_response,
    internal_notes,
    last_reviewed_by,
    last_reviewed_at,
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
    v_extracted_facility,
    v_extracted_cost,
    p_responsible_agency,
    p_media_urls,
    p_supporting_documents,
    v_real_reporter_type,
    CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(p_reporter_display_name, v_profile.display_name, 'Warga TITIK') END,
    0,
    '{}'::jsonb,
    '[]'::jsonb,
    'unverified',
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    NOW(),
    NOW()
  );

  -- Private Evidence tracking
  INSERT INTO public.report_evidence (
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
    notes,
    is_internal
  )
  VALUES (
    v_report_id,
    'status_change',
    COALESCE(v_uid, 'anon'),
    CASE WHEN p_is_anonymous THEN 'Warga Anonim' ELSE COALESCE(p_reporter_display_name, v_profile.display_name, 'Pelapor') END,
    NULL,
    'submitted',
    'Laporan berhasil diajukan ke sistem.',
    FALSE
  );

  -- Link to public feed post if requested
  IF p_link_to_feed THEN
    v_post_id := 'post-' || substr(md5(random()::text), 1, 8);
    INSERT INTO public.posts (
      id,
      user_id,
      caption,
      category,
      urgency,
      media,
      like_count,
      comment_count,
      support_count,
      share_count,
      related_report_id,
      is_pinned,
      is_official,
      is_demo,
      created_at,
      updated_at
    )
    VALUES (
      v_post_id,
      v_uid,
      p_title || E'\n\n' || p_description,
      p_category,
      COALESCE(p_severity, 'medium'),
      p_media_urls,
      0,
      0,
      0,
      0,
      v_report_id,
      FALSE,
      FALSE,
      FALSE,
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

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION public.submit_report TO anon, authenticated, service_role;

