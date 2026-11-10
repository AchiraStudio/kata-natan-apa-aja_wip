CREATE OR REPLACE FUNCTION public.delete_my_report(p_report_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id TEXT := (SELECT auth.uid()::text);
  v_deleted_id TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk menghapus laporan.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.reports
  WHERE id = p_report_id
    AND reporter_user_id = v_user_id
    AND reporter_type <> 'anonymous'
  RETURNING id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan atau bukan milik akun Anda.'
      USING ERRCODE = '42501';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.delete_my_report(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_report(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
