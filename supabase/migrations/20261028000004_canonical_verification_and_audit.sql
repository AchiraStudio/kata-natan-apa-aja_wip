-- =============================================================================
-- TITIK. — Migration 20261028000004: Canonical Verification, Audit & RLS Hardening
-- Description:
--   1. Adds CHECK constraint on reports.status for canonical 8 lifecycle statuses.
--   2. Adds evidence_verification_status, official_response, internal_notes,
--      last_reviewed_by, and last_reviewed_at columns to public.reports.
--   3. Adds is_internal column to public.report_events and restricts RLS so
--      is_internal = TRUE events are viewable exclusively by administrators.
--   4. Creates citizen_verification_audits table with admin-only RLS.
--   5. Implements server-enforced atomic RPCs:
--      - admin_transition_report_status (with mandatory notes for rejected/needs_info)
--      - admin_verify_report_evidence
--      - admin_set_citizen_verification
--      - hardened submit_report verifying citizen status server-side
--   6. Configures report-evidence-private storage bucket policies.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. HARDEN REPORT STATUS LIFECYCLE & VERIFICATION FIELDS
-- -----------------------------------------------------------------------------

-- 1.0 Map legacy and unknown statuses onto the canonical lifecycle before constraining
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS chk_reports_status_lifecycle;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
UPDATE public.reports SET status = CASE
  WHEN status = 'published' THEN 'accepted_for_routing'
  WHEN status = 'closed' THEN 'resolved'
  WHEN status IS NULL OR status NOT IN (
    'submitted', 'under_review', 'needs_info', 'accepted_for_routing',
    'forwarded_to_institution', 'institution_responded', 'resolved', 'rejected'
  ) THEN 'submitted'
  ELSE status
END
WHERE status IS NULL OR status NOT IN (
  'submitted', 'under_review', 'needs_info', 'accepted_for_routing',
  'forwarded_to_institution', 'institution_responded', 'resolved', 'rejected'
);

-- 1.1 Add CHECK constraint for 8 canonical statuses
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS chk_reports_status_lifecycle;
ALTER TABLE public.reports ADD CONSTRAINT chk_reports_status_lifecycle CHECK (
  status IN (
    'submitted',
    'under_review',
    'needs_info',
    'accepted_for_routing',
    'forwarded_to_institution',
    'institution_responded',
    'resolved',
    'rejected'
  )
);

-- 1.2 Add verification and review columns to reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS evidence_verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (evidence_verification_status IN ('unverified', 'verified', 'rejected', 'inconclusive')),
  ADD COLUMN IF NOT EXISTS official_response TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_reviewed_by TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- 1.3 Column-level security to prevent data leakage of internal_notes to non-admins
REVOKE SELECT (internal_notes) ON public.reports FROM anon, authenticated;
GRANT SELECT (internal_notes) ON public.reports TO service_role;

-- -----------------------------------------------------------------------------
-- 2. REPORT EVENTS AUDIT PRIVACY (INTERNAL NOTES VS PUBLIC RESPONSES)
-- -----------------------------------------------------------------------------

ALTER TABLE public.report_events
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

-- Update RLS: Public reads is_internal = FALSE; Admins read all
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Report events viewable by everyone" ON public.report_events;
DROP POLICY IF EXISTS "Report events visibility based on is_internal" ON public.report_events;

CREATE POLICY "Report events visibility based on is_internal" ON public.report_events
  FOR SELECT USING (
    is_internal = FALSE
    OR public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 3. CITIZEN ACCOUNT VERIFICATION AUDIT TRAIL
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.citizen_verification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('verified', 'revoked')),
  admin_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.citizen_verification_audits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.citizen_verification_audits FROM anon, authenticated;
GRANT SELECT ON public.citizen_verification_audits TO authenticated;

DROP POLICY IF EXISTS "Admins can view citizen verification audits" ON public.citizen_verification_audits;
CREATE POLICY "Admins can view citizen verification audits" ON public.citizen_verification_audits
  FOR SELECT USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. SERVER-ENFORCED RPC: admin_set_citizen_verification
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_citizen_verification(
  p_user_id TEXT,
  p_is_verified BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  v_admin_uid TEXT;
  v_res public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengubah status verifikasi warga.';
  END IF;

  v_admin_uid := (SELECT auth.uid()::text);

  UPDATE public.profiles
  SET
    is_verified = p_is_verified,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_res;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan: %', p_user_id;
  END IF;

  INSERT INTO public.citizen_verification_audits (
    user_id,
    action,
    admin_id,
    notes
  ) VALUES (
    p_user_id,
    CASE WHEN p_is_verified THEN 'verified' ELSE 'revoked' END,
    v_admin_uid,
    p_notes
  );

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_set_citizen_verification(TEXT, BOOLEAN, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. SERVER-ENFORCED RPC: admin_transition_report_status
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_transition_report_status(
  p_report_id TEXT,
  p_target_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_is_internal BOOLEAN DEFAULT FALSE,
  p_official_response TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
DECLARE
  v_admin_uid TEXT;
  v_admin_name TEXT;
  v_report public.reports;
  v_old_status TEXT;
  v_res public.reports;
  v_notes_trimmed TEXT;
  v_response_trimmed TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan.';
  END IF;

  v_admin_uid := (SELECT auth.uid()::text);
  SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = v_admin_uid;

  -- Concurrency control: row lock
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
  IF v_report.id IS NULL THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan: %', p_report_id;
  END IF;

  v_old_status := v_report.status;
  v_notes_trimmed := NULLIF(BTRIM(p_notes, E' \t\n\r'), '');
  v_response_trimmed := NULLIF(BTRIM(p_official_response, E' \t\n\r'), '');

  -- Validate target lifecycle status
  IF p_target_status NOT IN (
    'submitted',
    'under_review',
    'needs_info',
    'accepted_for_routing',
    'forwarded_to_institution',
    'institution_responded',
    'resolved',
    'rejected'
  ) THEN
    RAISE EXCEPTION 'Status target tidak valid: %', p_target_status;
  END IF;

  -- Enforce transition contract: non-empty notes for rejected and needs_info
  IF p_target_status IN ('rejected', 'needs_info') THEN
    IF v_notes_trimmed IS NULL AND v_response_trimmed IS NULL THEN
      RAISE EXCEPTION 'Status % wajib menyertakan catatan penjelasan atau tanggapan resmi yang tidak boleh kosong.', p_target_status;
    END IF;
  END IF;

  -- Execute atomic update on reports
  UPDATE public.reports
  SET
    status = p_target_status,
    official_response = COALESCE(v_response_trimmed, official_response),
    internal_notes = CASE WHEN p_is_internal IS TRUE THEN COALESCE(v_notes_trimmed, internal_notes) ELSE internal_notes END,
    last_reviewed_by = v_admin_uid,
    last_reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO v_res;

  -- Record audit event in report_events
  -- Status change event MUST ALWAYS have is_internal = FALSE for public citizen timeline visibility
  INSERT INTO public.report_events (
    report_id,
    event_type,
    actor_id,
    actor_name,
    previous_status,
    new_status,
    notes,
    is_internal
  ) VALUES (
    p_report_id,
    'status_change',
    v_admin_uid,
    COALESCE(v_admin_name, 'Admin TITIK'),
    v_old_status,
    p_target_status,
    COALESCE(v_response_trimmed, 'Status diperbarui menjadi ' || p_target_status),
    FALSE
  );

  -- Record internal notes as separate internal audit entry if internal review notes exist
  IF v_notes_trimmed IS NOT NULL THEN
    INSERT INTO public.report_events (
      report_id,
      event_type,
      actor_id,
      actor_name,
      previous_status,
      new_status,
      notes,
      is_internal
    ) VALUES (
      p_report_id,
      'internal_review_note',
      v_admin_uid,
      COALESCE(v_admin_name, 'Admin TITIK'),
      v_old_status,
      p_target_status,
      v_notes_trimmed,
      TRUE
    );
  END IF;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_transition_report_status(TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- Backward-compatibility wrapper for existing admin_update_report_status
CREATE OR REPLACE FUNCTION public.admin_update_report_status(
  p_report_id TEXT,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
BEGIN
  RETURN public.admin_transition_report_status(
    p_report_id,
    p_status,
    NULL,
    FALSE,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_update_report_status(TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. SERVER-ENFORCED RPC: admin_verify_report_evidence
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_verify_report_evidence(
  p_report_id TEXT,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
DECLARE
  v_admin_uid TEXT;
  v_admin_name TEXT;
  v_res public.reports;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berwenang memvalidasi bukti laporan.';
  END IF;

  IF p_status NOT IN ('unverified', 'verified', 'rejected', 'inconclusive') THEN
    RAISE EXCEPTION 'Status validasi bukti tidak valid: %', p_status;
  END IF;

  v_admin_uid := (SELECT auth.uid()::text);
  SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = v_admin_uid;

  UPDATE public.reports
  SET
    evidence_verification_status = p_status,
    last_reviewed_by = v_admin_uid,
    last_reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO v_res;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan: %', p_report_id;
  END IF;

  INSERT INTO public.report_events (
    report_id,
    event_type,
    actor_id,
    actor_name,
    notes,
    is_internal
  ) VALUES (
    p_report_id,
    'evidence_verification',
    v_admin_uid,
    COALESCE(v_admin_name, 'Admin TITIK'),
    COALESCE(p_notes, 'Status verifikasi bukti diubah menjadi ' || p_status),
    FALSE
  );

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.admin_verify_report_evidence(TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. HARDENED submit_report: SERVER-ENFORCED CITIZEN VERIFICATION
-- -----------------------------------------------------------------------------

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
  v_real_reporter_type TEXT;
  v_is_user_verified BOOLEAN := FALSE;
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

  -- Link to public feed if enabled
  IF p_link_to_feed THEN
    v_post_id := 'post_' || gen_random_uuid()::text;
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
      0,
      0,
      0,
      0,
      0,
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

-- -----------------------------------------------------------------------------
-- 8. STORAGE BUCKET POLICIES FOR PRIVATE EVIDENCE
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-evidence-private',
  'report-evidence-private',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];

DROP POLICY IF EXISTS "Users can view own private evidence" ON storage.objects;
DROP POLICY IF EXISTS "Private evidence viewable by owner or admin" ON storage.objects;
CREATE POLICY "Private evidence viewable by owner or admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'report-evidence-private'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "Authenticated users upload evidence to own folder" ON storage.objects;
CREATE POLICY "Authenticated users upload evidence to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'report-evidence-private'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    )
  );

-- -----------------------------------------------------------------------------
-- 9. RELOAD SCHEMA CACHE
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
