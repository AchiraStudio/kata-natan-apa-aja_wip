CREATE TABLE IF NOT EXISTS public.report_saves (
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

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
