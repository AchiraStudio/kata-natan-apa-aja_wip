-- =============================================================================
-- TITIK. — Migration 01: Core Civic Reporting & Regional Data Schema
-- Conforms to production PostgreSQL standards with strict constraints.
-- =============================================================================

-- Enable pgcrypto for UUID and SHA functions if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. REGIONAL CIVIC REFERENCE TABLES (Facilities & Budget Projects)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    subdistrict TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    condition TEXT NOT NULL DEFAULT 'Baik',
    responsible_agency TEXT NOT NULL,
    service_capacity TEXT NOT NULL,
    pagu_anggaran BIGINT NOT NULL DEFAULT 0,
    dana_terikat_kontrak BIGINT NOT NULL DEFAULT 0,
    realisasi_penyerapan BIGINT NOT NULL DEFAULT 0,
    source_dataset TEXT NOT NULL DEFAULT 'Portal Satu Data & SIKD 2026',
    reporting_period TEXT NOT NULL DEFAULT 'TA 2026',
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budget_projects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    sector TEXT NOT NULL,
    subdistrict TEXT NOT NULL,
    facility_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
    pagu_anggaran BIGINT NOT NULL,
    dana_terikat_kontrak BIGINT NOT NULL,
    realisasi_penyerapan BIGINT NOT NULL,
    progress_percent INTEGER NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
    contractor_name TEXT NOT NULL,
    responsible_agency TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL DEFAULT 2026,
    source_dataset TEXT NOT NULL DEFAULT 'SIKD Kemendagri Format APBD',
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. SEQUENCE & GENERATOR FOR CONCURRENCY-SAFE HUMAN-READABLE REFERENCE
-- -----------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.report_public_ref_seq START WITH 101 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_public_reference()
RETURNS TEXT AS $$
DECLARE
    seq_val BIGINT;
BEGIN
    seq_val := nextval('public.report_public_ref_seq');
    RETURN 'TITIK-2026-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- -----------------------------------------------------------------------------
-- 3. REPORTS TABLE (Primary Civic Reports)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_reference TEXT NOT NULL UNIQUE DEFAULT public.generate_public_reference(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Sedang' CHECK (severity IN ('Rendah', 'Sedang', 'Kritis')),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'under_review', 'published', 'needs_info', 'rejected', 'resolved', 'closed')
    ),
    publication_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        publication_status IN ('pending', 'published', 'rejected')
    ),
    facility_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
    subdistrict VARCHAR(100) NOT NULL,
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_submission BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_publication_status ON public.reports(publication_status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_subdistrict ON public.reports(subdistrict);
CREATE INDEX IF NOT EXISTS idx_reports_facility ON public.reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_reports_public_ref ON public.reports(public_reference);

-- -----------------------------------------------------------------------------
-- 4. REPORT LOCATIONS (Exact vs Public Generalization)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    precise_latitude NUMERIC(10, 7) NOT NULL CHECK (precise_latitude BETWEEN -90 AND 90),
    precise_longitude NUMERIC(10, 7) NOT NULL CHECK (precise_longitude BETWEEN -180 AND 180),
    public_latitude NUMERIC(10, 7) NOT NULL CHECK (public_latitude BETWEEN -90 AND 90),
    public_longitude NUMERIC(10, 7) NOT NULL CHECK (public_longitude BETWEEN -180 AND 180),
    accuracy_meters NUMERIC(8, 2),
    acquisition_method VARCHAR(30) NOT NULL DEFAULT 'map_pin' CHECK (
        acquisition_method IN ('gps', 'map_pin', 'address_search', 'approximate')
    ),
    is_approximate BOOLEAN NOT NULL DEFAULT false,
    address_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_locations_report_id ON public.report_locations(report_id);
CREATE INDEX IF NOT EXISTS idx_report_locations_coords ON public.report_locations(public_latitude, public_longitude);

-- -----------------------------------------------------------------------------
-- 5. REPORT MEDIA (Evidence Files Metadata)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 10485760),
    upload_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        upload_status IN ('pending', 'uploaded', 'failed')
    ),
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        moderation_status IN ('pending', 'approved', 'rejected')
    ),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON public.report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_report_media_public ON public.report_media(is_public) WHERE is_public = true;

-- -----------------------------------------------------------------------------
-- 6. REPORT EVENTS (Append-Only Verified Audit Trail)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'SUBMITTED', 
            'UNDER_REVIEW', 
            'MORE_INFO_REQUESTED', 
            'APPROVED_PUBLISHED', 
            'REJECTED', 
            'FACILITY_LINK_SUGGESTED', 
            'FACILITY_LINK_CONFIRMED', 
            'BUDGET_LINK_SUGGESTED', 
            'BUDGET_LINK_CONFIRMED', 
            'AGENCY_DISPATCHED', 
            'AGENCY_ACKNOWLEDGED', 
            'WORK_SCHEDULED', 
            'INSPECTION_COMPLETED', 
            'RESOLVED', 
            'CLOSED'
        )
    ),
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    description TEXT NOT NULL,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('citizen', 'system', 'moderator', 'agency')),
    actor_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_events_report_id ON public.report_events(report_id, created_at ASC);

-- Enforce Append-Only: Reject UPDATE and DELETE on report_events
CREATE OR REPLACE FUNCTION public.prevent_report_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail integrity error: report_events records are append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_events_mutation ON public.report_events;
CREATE TRIGGER trg_prevent_events_mutation
BEFORE UPDATE OR DELETE ON public.report_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_report_events_mutation();

-- -----------------------------------------------------------------------------
-- 7. REPORT RELATIONS (Facility, Agency, & Budget Correlations)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('facility', 'budget_project', 'agency')),
    target_id TEXT NOT NULL,
    match_status VARCHAR(20) NOT NULL DEFAULT 'suggested' CHECK (
        match_status IN ('suggested', 'under_review', 'confirmed', 'rejected')
    ),
    match_rationale TEXT NOT NULL,
    confidence_score NUMERIC(3, 2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_relations_report ON public.report_relations(report_id);
CREATE INDEX IF NOT EXISTS idx_report_relations_target ON public.report_relations(target_type, target_id);

-- -----------------------------------------------------------------------------
-- 8. REPORTER PRIVATE DATA (Follow-up capability & optional contact)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reporter_private_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
    follow_up_token_hash TEXT NOT NULL,
    contact_email_encrypted TEXT,
    contact_phone_encrypted TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reporter_private_token ON public.reporter_private_data(follow_up_token_hash);

-- -----------------------------------------------------------------------------
-- 9. REPORT VOTES (Community Priority Support with Abuse Controls)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_token_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_vote_identity CHECK (user_id IS NOT NULL OR credential_token_hash IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_user ON public.report_votes(report_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_credential ON public.report_votes(report_id, credential_token_hash) WHERE credential_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_votes_report_id ON public.report_votes(report_id);

-- -----------------------------------------------------------------------------
-- 10. UPDATE TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

