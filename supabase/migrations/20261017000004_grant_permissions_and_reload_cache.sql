-- =============================================================================
-- TITIK. — Migration 04: Explicit Schema Permissions & PostgREST Cache Reload
-- Grants necessary table & sequence access to anon and authenticated roles
-- and signals PostgREST to reload its schema cache.
-- =============================================================================

-- 1. Schema USAGE
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Core Tables SELECT Permissions
GRANT SELECT ON TABLE public.facilities TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.budget_projects TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.reports TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_locations TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_media TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_events TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_relations TO anon, authenticated, service_role;

-- 3. Community Votes Table Permissions (Read & Cast Vote)
GRANT SELECT, INSERT ON TABLE public.report_votes TO anon, authenticated, service_role;

-- 4. Sequences Permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Stored Procedures Execution Permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 6. RPC Function for Community Moderation Queue (Security Definer)
CREATE OR REPLACE FUNCTION public.get_pending_reports_for_moderation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'public_reference', r.public_reference,
            'title', r.title,
            'description', r.description,
            'category', r.category,
            'severity', r.severity,
            'observed_at', r.observed_at,
            'status', r.status,
            'publication_status', r.publication_status,
            'subdistrict', r.subdistrict,
            'facility_id', r.facility_id,
            'created_at', r.created_at,
            'report_locations', (
                SELECT jsonb_agg(jsonb_build_object(
                    'public_latitude', rl.public_latitude,
                    'public_longitude', rl.public_longitude,
                    'accuracy_meters', rl.accuracy_meters,
                    'acquisition_method', rl.acquisition_method,
                    'is_approximate', rl.is_approximate,
                    'address_text', rl.address_text
                )) FROM public.report_locations rl WHERE rl.report_id = r.id
            ),
            'report_media', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', rm.id,
                    'storage_path', rm.storage_path,
                    'file_name', rm.file_name,
                    'mime_type', rm.mime_type,
                    'file_size_bytes', rm.file_size_bytes,
                    'upload_status', rm.upload_status,
                    'moderation_status', rm.moderation_status,
                    'is_public', rm.is_public
                )) FROM public.report_media rm WHERE rm.report_id = r.id
            )
        ) ORDER BY r.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.reports r
    WHERE r.publication_status = 'pending';

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_reports_for_moderation TO anon, authenticated, service_role;

-- 7. Notify PostgREST to immediately rebuild its OpenAPI schema cache
NOTIFY pgrst, 'reload schema';

