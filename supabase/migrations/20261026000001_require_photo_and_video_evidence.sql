-- Citizen reports must include at least one photo and one video as evidence.
ALTER TABLE public.report_media
    DROP CONSTRAINT IF EXISTS report_media_mime_type_check;

ALTER TABLE public.report_media
    ADD CONSTRAINT report_media_mime_type_check
    CHECK (mime_type IN (
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'report-evidence-private',
        'report-evidence-private',
        false,
        10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
    ),
    (
        'report-evidence-public',
        'report-evidence-public',
        true,
        10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
    )
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.enforce_report_photo_and_video_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_report_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'reports' THEN
        v_report_id := COALESCE(NEW.id, OLD.id);
    ELSE
        v_report_id := COALESCE(NEW.report_id, OLD.report_id);
    END IF;

    IF EXISTS (SELECT 1 FROM public.reports WHERE id = v_report_id)
       AND (
           NOT EXISTS (
               SELECT 1
               FROM public.report_media
               WHERE report_id = v_report_id
                 AND mime_type IN ('image/jpeg', 'image/png', 'image/webp')
           )
           OR NOT EXISTS (
               SELECT 1
               FROM public.report_media
               WHERE report_id = v_report_id
                 AND mime_type IN ('video/mp4', 'video/webm', 'video/quicktime')
           )
       ) THEN
        RAISE EXCEPTION 'Setiap laporan wajib memiliki minimal satu foto dan satu video bukti.';
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS require_report_evidence_on_report ON public.reports;
CREATE CONSTRAINT TRIGGER require_report_evidence_on_report
    AFTER INSERT ON public.reports
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.enforce_report_photo_and_video_evidence();

DROP TRIGGER IF EXISTS require_report_evidence_on_media ON public.report_media;
CREATE CONSTRAINT TRIGGER require_report_evidence_on_media
    AFTER INSERT OR UPDATE OR DELETE ON public.report_media
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.enforce_report_photo_and_video_evidence();
