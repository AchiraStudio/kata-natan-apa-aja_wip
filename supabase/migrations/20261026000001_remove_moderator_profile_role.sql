UPDATE public.profiles
SET role = 'citizen'
WHERE role = 'moderator';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('citizen', 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url, role, district, is_verified, bio)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    CASE WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin' ELSE 'citizen' END,
    COALESCE(new.raw_user_meta_data->>'district', 'Bogor Tengah'),
    true,
    'Warga terdaftar di portal TITIK.'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.report_events
SET actor_type = 'agency'
WHERE actor_type = 'moderator';

ALTER TABLE public.report_events
  DROP CONSTRAINT IF EXISTS report_events_actor_type_check;

ALTER TABLE public.report_events
  ADD CONSTRAINT report_events_actor_type_check
  CHECK (actor_type IN ('citizen', 'system', 'agency'));

DROP FUNCTION IF EXISTS public.moderate_report(UUID, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION public.moderate_report(
    p_report_id UUID,
    p_new_status TEXT,
    p_publication_status TEXT,
    p_notes TEXT,
    p_admin_id TEXT DEFAULT 'admin'
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
        v_event_desc := COALESCE(p_notes, 'Laporan dan bukti foto telah diverifikasi oleh admin dan dipublikasikan.');

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
        'agency',
        p_admin_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'report_id', p_report_id,
        'status', p_new_status,
        'publication_status', p_publication_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderate_report(UUID, TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated, service_role;
