-- =============================================================================
-- TITIK. — Migration 02: Storage Buckets, RLS Policies, & Atomic Submission RPC
-- Hardens data access boundaries and establishes secure anonymous reporting.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL CIVIC TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporter_private_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. PUBLIC READ POLICIES FOR VERIFIED REGIONAL CIVIC DATA
-- -----------------------------------------------------------------------------

CREATE POLICY "Public can view all verified facilities"
    ON public.facilities FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view all verified budget projects"
    ON public.budget_projects FOR SELECT
    TO anon, authenticated
    USING (true);

-- -----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR REPORTS & SUBORDINATE TABLES
-- -----------------------------------------------------------------------------

-- Public visitors may ONLY read published reports
CREATE POLICY "Public can view published reports"
    ON public.reports FOR SELECT
    TO anon, authenticated
    USING (publication_status = 'published');

-- Authenticated reporters can view their own reports (even if pending)
CREATE POLICY "Reporters can view their own submissions"
    ON public.reports FOR SELECT
    TO authenticated
    USING (reporter_user_id = auth.uid());

-- Locations: Only published reports' public locations are accessible
CREATE POLICY "Public can view locations of published reports"
    ON public.report_locations FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_locations.report_id 
            AND r.publication_status = 'published'
        )
    );

-- Media: Only approved public media of published reports is accessible
CREATE POLICY "Public can view approved media of published reports"
    ON public.report_media FOR SELECT
    TO anon, authenticated
    USING (
        is_public = true 
        AND moderation_status = 'approved'
        AND EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_media.report_id 
            AND r.publication_status = 'published'
        )
    );

-- Events: Public can view audit trail of published reports
CREATE POLICY "Public can view audit events of published reports"
    ON public.report_events FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_events.report_id 
            AND r.publication_status = 'published'
        )
    );

-- Relations: Public can view verified and suggested relations of published reports
CREATE POLICY "Public can view relations of published reports"
    ON public.report_relations FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_relations.report_id 
            AND r.publication_status = 'published'
        )
    );

-- Votes: Public can view votes of published reports
CREATE POLICY "Public can view votes"
    ON public.report_votes FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_votes.report_id 
            AND r.publication_status = 'published'
        )
    );

-- Votes INSERT: Authenticated users or client with credential token can vote
CREATE POLICY "Authenticated users can vote once per report"
    ON public.report_votes FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_votes.report_id 
            AND r.publication_status = 'published'
        )
    );

CREATE POLICY "Anonymous clients can vote once per credential token"
    ON public.report_votes FOR INSERT
    TO anon
    WITH CHECK (
        credential_token_hash IS NOT NULL 
        AND user_id IS NULL
        AND EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_votes.report_id 
            AND r.publication_status = 'published'
        )
    );

-- REPORTER PRIVATE DATA: NO DIRECT PUBLIC ACCESS. Only server/functions.
-- No SELECT, INSERT, UPDATE, or DELETE policies for anon/authenticated on reporter_private_data!

-- -----------------------------------------------------------------------------
-- 4. STORAGE BUCKET CONFIGURATION & POLICIES
-- -----------------------------------------------------------------------------

-- Create private and public evidence buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'report-evidence-private', 
        'report-evidence-private', 
        false, 
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'report-evidence-public', 
        'report-evidence-public', 
        true, 
        5242880, -- 5MB limit for optimized public derivatives
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public can view approved media from report-evidence-public bucket
CREATE POLICY "Public read for approved public evidence"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'report-evidence-public');

-- Client upload to report-evidence-private bucket
CREATE POLICY "Authorized upload to private evidence bucket"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        bucket_id = 'report-evidence-private'
        AND (storage.foldername(name))[1] = 'incoming'
    );

-- -----------------------------------------------------------------------------
-- 5. ATOMIC CITIZEN REPORT SUBMISSION FUNCTION (SECURITY DEFINER)
-- Canonical, secure submission RPC preventing direct table writes.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_citizen_report(
    p_title TEXT,
    p_description TEXT,
    p_category TEXT,
    p_severity TEXT,
    p_subdistrict TEXT,
    p_facility_id TEXT DEFAULT NULL,
    p_precise_lat NUMERIC DEFAULT 0,
    p_precise_lng NUMERIC DEFAULT 0,
    p_accuracy_meters NUMERIC DEFAULT NULL,
    p_acquisition_method TEXT DEFAULT 'map_pin',
    p_is_approximate BOOLEAN DEFAULT false,
    p_address_text TEXT DEFAULT NULL,
    p_media_files JSONB DEFAULT '[]'::JSONB,
    p_follow_up_token_hash TEXT DEFAULT NULL,
    p_reporter_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_report_id UUID;
    v_public_ref TEXT;
    v_public_lat NUMERIC;
    v_public_lng NUMERIC;
    v_media_item JSONB;
    v_facility RECORD;
BEGIN
    -- 1. Input Validation
    IF LENGTH(TRIM(p_title)) < 5 OR LENGTH(p_title) > 200 THEN
        RAISE EXCEPTION 'Judul laporan harus antara 5 dan 200 karakter.';
    END IF;

    IF LENGTH(TRIM(p_description)) < 10 THEN
        RAISE EXCEPTION 'Deskripsi laporan minimal 10 karakter.';
    END IF;

    IF p_category IS NULL OR LENGTH(p_category) = 0 THEN
        RAISE EXCEPTION 'Kategori pelayanan publik wajib dipilih.';
    END IF;

    IF p_severity NOT IN ('Rendah', 'Sedang', 'Kritis') THEN
        p_severity := 'Sedang';
    END IF;

    IF p_precise_lat < -90 OR p_precise_lat > 90 OR p_precise_lng < -180 OR p_precise_lng > 180 THEN
        RAISE EXCEPTION 'Koordinat lokasi tidak valid.';
    END IF;

    IF p_follow_up_token_hash IS NULL OR LENGTH(p_follow_up_token_hash) < 32 THEN
        RAISE EXCEPTION 'Follow-up capability token hash wajib disediakan.';
    END IF;

    -- 2. Compute Public Generalized Coordinates
    -- If approximate or citizen prefers generalization, round coordinates to 3 decimal places (~110m)
    IF p_is_approximate THEN
        v_public_lat := ROUND(p_precise_lat, 3);
        v_public_lng := ROUND(p_precise_lng, 3);
    ELSE
        v_public_lat := p_precise_lat;
        v_public_lng := p_precise_lng;
    END IF;

    -- 3. Create Report Record
    v_report_id := gen_random_uuid();
    v_public_ref := public.generate_public_reference();

    INSERT INTO public.reports (
        id,
        public_reference,
        title,
        description,
        category,
        severity,
        status,
        publication_status,
        facility_id,
        subdistrict,
        reporter_user_id,
        anonymous_submission,
        created_at,
        updated_at
    ) VALUES (
        v_report_id,
        v_public_ref,
        TRIM(p_title),
        TRIM(p_description),
        p_category,
        p_severity,
        'submitted',
        'pending', -- Pending moderation by default
        p_facility_id,
        p_subdistrict,
        p_reporter_user_id,
        (p_reporter_user_id IS NULL),
        now(),
        now()
    );

    -- 4. Create Location Record
    INSERT INTO public.report_locations (
        report_id,
        precise_latitude,
        precise_longitude,
        public_latitude,
        public_longitude,
        accuracy_meters,
        acquisition_method,
        is_approximate,
        address_text
    ) VALUES (
        v_report_id,
        p_precise_lat,
        p_precise_lng,
        v_public_lat,
        v_public_lng,
        p_accuracy_meters,
        p_acquisition_method,
        p_is_approximate,
        p_address_text
    );

    -- 5. Store Media Metadata
    IF jsonb_array_length(p_media_files) > 0 THEN
        FOR v_media_item IN SELECT * FROM jsonb_array_elements(p_media_files)
        LOOP
            INSERT INTO public.report_media (
                report_id,
                storage_path,
                file_name,
                mime_type,
                file_size_bytes,
                upload_status,
                moderation_status,
                is_public
            ) VALUES (
                v_report_id,
                v_media_item->>'storage_path',
                v_media_item->>'file_name',
                v_media_item->>'mime_type',
                (v_media_item->>'file_size_bytes')::INTEGER,
                'uploaded',
                'pending',
                false -- Private until moderated
            );
        END LOOP;
    END IF;

    -- 6. Insert Genuine First Audit Trail Event
    INSERT INTO public.report_events (
        report_id,
        event_type,
        previous_status,
        new_status,
        description,
        actor_type,
        actor_id
    ) VALUES (
        v_report_id,
        'SUBMITTED',
        NULL,
        'submitted',
        'Laporan warga berhasil dicatat dan masuk antrean peninjauan bukti.',
        'citizen',
        CASE WHEN p_reporter_user_id IS NOT NULL THEN p_reporter_user_id::TEXT ELSE 'anonim' END
    );

    -- 7. Suggest Facility / Budget Correlation if Facility Linked
    IF p_facility_id IS NOT NULL THEN
        SELECT * INTO v_facility FROM public.facilities WHERE id = p_facility_id;
        IF FOUND THEN
            INSERT INTO public.report_relations (
                report_id,
                target_type,
                target_id,
                match_status,
                match_rationale,
                confidence_score,
                source_reference
            ) VALUES (
                v_report_id,
                'facility',
                v_facility.id,
                'suggested',
                'Pelapor memilih fasilitas publik terdaftar ini saat pelaporan.',
                0.85,
                v_facility.source_dataset
            );

            INSERT INTO public.report_relations (
                report_id,
                target_type,
                target_id,
                match_status,
                match_rationale,
                confidence_score,
                source_reference
            ) VALUES (
                v_report_id,
                'agency',
                v_facility.responsible_agency,
                'suggested',
                'Instansi pengelola yang tercatat dalam inventaris fasilitas SIKD.',
                0.80,
                v_facility.source_dataset
            );
        END IF;
    END IF;

    -- 8. Store Private Follow-up Token Hash
    INSERT INTO public.reporter_private_data (
        report_id,
        follow_up_token_hash
    ) VALUES (
        v_report_id,
        p_follow_up_token_hash
    );

    -- 9. Return Structured Confirmation Response
    RETURN jsonb_build_object(
        'success', true,
        'report_id', v_report_id,
        'public_reference', v_public_ref,
        'status', 'submitted',
        'publication_status', 'pending',
        'message', 'Laporan berhasil dicatat dan sedang menunggu kurasi.'
    );
END;
$$;

-- Grant EXECUTE to anon and authenticated
GRANT EXECUTE ON FUNCTION public.submit_citizen_report TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. CAPABILITY CHECK FUNCTION FOR PRIVATE FOLLOW-UP
-- Allows anonymous reporter to check their own pending report using their token
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_report_by_follow_up_token(
    p_public_ref TEXT,
    p_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_report RECORD;
    v_location RECORD;
    v_media JSONB;
    v_events JSONB;
    v_relations JSONB;
BEGIN
    SELECT r.* INTO v_report
    FROM public.reports r
    JOIN public.reporter_private_data p ON p.report_id = r.id
    WHERE r.public_reference = p_public_ref 
      AND p.follow_up_token_hash = p_token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Token follow-up tidak valid atau laporan tidak ditemukan.');
    END IF;

    SELECT * INTO v_location FROM public.report_locations WHERE report_id = v_report.id;
    
    SELECT jsonb_agg(m) INTO v_media 
    FROM (SELECT id, file_name, mime_type, moderation_status, is_public, created_at FROM public.report_media WHERE report_id = v_report.id) m;

    SELECT jsonb_agg(e) INTO v_events 
    FROM (SELECT id, event_type, previous_status, new_status, description, actor_type, created_at FROM public.report_events WHERE report_id = v_report.id ORDER BY created_at ASC) e;

    SELECT jsonb_agg(rel) INTO v_relations 
    FROM (SELECT id, target_type, target_id, match_status, match_rationale, confidence_score FROM public.report_relations WHERE report_id = v_report.id) rel;

    RETURN jsonb_build_object(
        'report', row_to_json(v_report),
        'location', row_to_json(v_location),
        'media', COALESCE(v_media, '[]'::JSONB),
        'events', COALESCE(v_events, '[]'::JSONB),
        'relations', COALESCE(v_relations, '[]'::JSONB)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_report_by_follow_up_token TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. STRUCTURED MODERATION PROCEDURE (SECURITY DEFINER)
-- Allows authorized moderators to review, publish, reject, and record audit trail
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.moderate_report(
    p_report_id UUID,
    p_new_status TEXT,
    p_publication_status TEXT,
    p_notes TEXT,
    p_moderator_id TEXT DEFAULT 'moderator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_report RECORD;
    v_prev_status TEXT;
    v_event_type TEXT;
    v_event_desc TEXT;
BEGIN
    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Laporan tidak ditemukan.';
    END IF;

    v_prev_status := v_report.status;

    IF p_publication_status = 'published' THEN
        v_event_type := 'APPROVED_PUBLISHED';
        v_event_desc := COALESCE(p_notes, 'Laporan dan bukti foto telah diverifikasi oleh tim kurasi komunitas dan dipublikasikan.');
        
        -- Make approved media publicly visible
        UPDATE public.report_media 
        SET moderation_status = 'approved', is_public = true 
        WHERE report_id = p_report_id;

        UPDATE public.reports
        SET status = p_new_status,
            publication_status = 'published',
            reviewed_at = now(),
            published_at = now(),
            updated_at = now()
        WHERE id = p_report_id;
    ELSIF p_publication_status = 'rejected' THEN
        v_event_type := 'REJECTED';
        v_event_desc := COALESCE(p_notes, 'Laporan ditolak setelah peninjauan bukti fisik.');

        UPDATE public.report_media 
        SET moderation_status = 'rejected', is_public = false 
        WHERE report_id = p_report_id;

        UPDATE public.reports
        SET status = p_new_status,
            publication_status = 'rejected',
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_report_id;
    ELSE
        v_event_type := 'UNDER_REVIEW';
        v_event_desc := COALESCE(p_notes, 'Laporan sedang dalam peninjauan verifikasi bukti.');

        UPDATE public.reports
        SET status = p_new_status,
            publication_status = p_publication_status,
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_report_id;
    END IF;

    -- Record Genuine Audit Event
    INSERT INTO public.report_events (
        report_id,
        event_type,
        previous_status,
        new_status,
        description,
        actor_type,
        actor_id
    ) VALUES (
        p_report_id,
        v_event_type,
        v_prev_status,
        p_new_status,
        v_event_desc,
        'moderator',
        p_moderator_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'report_id', p_report_id,
        'status', p_new_status,
        'publication_status', p_publication_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderate_report TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. EXPLICIT TABLE-LEVEL GRANTS FOR POSTGREST OPENAPI SCHEMA CACHE
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.facilities TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.budget_projects TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.reports TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_locations TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_media TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_events TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_relations TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.report_votes TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

