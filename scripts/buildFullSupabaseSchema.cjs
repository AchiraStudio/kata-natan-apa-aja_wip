const fs = require('fs');
const path = require('path');

// Read mockCivicData to parse reports and posts cleanly
const rawContent = fs.readFileSync(path.join(__dirname, '../src/data/mockCivicData.ts'), 'utf8');

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return val.toString();
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Generate the complete unified SQL
const sqlContent = `-- =============================================================================
-- TITIK. — Master Supabase Database Schema & Production Seed
-- Architecture: 100% Server-Side Live Storage on Supabase (PostgreSQL)
-- Generated: ${new Date().toISOString()}
-- =============================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0. CLEANUP & RESET CONFLICTING LEGACY TABLES
-- -----------------------------------------------------------------------------
-- Safely drop legacy tables to eliminate incompatible column types (e.g. UUID vs TEXT)
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_saves CASCADE;
DROP TABLE IF EXISTS public.report_supports CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.report_events CASCADE;
DROP TABLE IF EXISTS public.report_attachments CASCADE;
DROP TABLE IF EXISTS public.report_revisions CASCADE;
DROP TABLE IF EXISTS public.report_status_audit CASCADE;
DROP TABLE IF EXISTS public.budget_projects CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- -----------------------------------------------------------------------------
-- 1. PROFILES (Citizen & Administrator Profiles linked with Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  verified_agency TEXT,
  district TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- Trigger to create profile when auth user signs up
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. FACILITIES (Civic Infrastructure Reference)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  responsible_agency TEXT NOT NULL,
  active_reports_count INTEGER NOT NULL DEFAULT 0,
  resolved_reports_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Facilities are viewable by everyone" ON public.facilities;
CREATE POLICY "Facilities are viewable by everyone" ON public.facilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert facilities" ON public.facilities;
CREATE POLICY "Anyone can insert facilities" ON public.facilities FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 3. REPORTS (Citizen Verified Reports & Audit Trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  public_reference TEXT NOT NULL UNIQUE,
  reporter_user_id TEXT,
  secret_follow_up_token_hash TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'submitted',
  publication_status TEXT NOT NULL DEFAULT 'published',
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  facility_name TEXT,
  estimated_cost BIGINT DEFAULT 0,
  responsible_agency TEXT NOT NULL,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  reporter_type TEXT NOT NULL DEFAULT 'verified_citizen',
  reporter_display_name TEXT,
  support_count INTEGER NOT NULL DEFAULT 0,
  budget_context JSONB DEFAULT '{}'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;
CREATE POLICY "Reports are viewable by everyone" ON public.reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update reports" ON public.reports;
CREATE POLICY "Users can update reports" ON public.reports FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete reports" ON public.reports;
CREATE POLICY "Users can delete reports" ON public.reports FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- 4. POSTS (TikTok-Style Vertical Civic Feed Stream)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT,
  author_username TEXT NOT NULL DEFAULT 'warga_bogor',
  author_display_name TEXT NOT NULL DEFAULT 'Warga Sipil',
  author_avatar_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  author_role TEXT NOT NULL DEFAULT 'citizen',
  body TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'citizen_report',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_tag TEXT NOT NULL DEFAULT 'Kota Bogor',
  related_report_id TEXT REFERENCES public.reports(id) ON DELETE SET NULL,
  support_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update posts" ON public.posts;
CREATE POLICY "Users can update posts" ON public.posts FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- 5. COMMENTS (Threaded Citizen Discussion)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT NOT NULL,
  avatar_url TEXT,
  body TEXT NOT NULL,
  parent_id TEXT REFERENCES public.comments(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Public can view comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can insert comments" ON public.comments;
CREATE POLICY "Public can insert comments" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update comments" ON public.comments;
CREATE POLICY "Public can update comments" ON public.comments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public can delete comments" ON public.comments;
CREATE POLICY "Public can delete comments" ON public.comments FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. POST_LIKES (Relational Likes & Personalization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Post likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle like" ON public.post_likes;
CREATE POLICY "Users can toggle like" ON public.post_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can remove like" ON public.post_likes;
CREATE POLICY "Users can remove like" ON public.post_likes FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- 7. POST_SAVES (Bookmarks / Saved Posts Personalization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post saves viewable by everyone" ON public.post_saves;
CREATE POLICY "Post saves viewable by everyone" ON public.post_saves FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can save post" ON public.post_saves;
CREATE POLICY "Users can save post" ON public.post_saves FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can remove saved post" ON public.post_saves;
CREATE POLICY "Users can remove saved post" ON public.post_saves FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- 8. REPORT_SUPPORTS ("Saya Terdampak Juga" Relational Civic Verification)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

ALTER TABLE public.report_supports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Report supports viewable by everyone" ON public.report_supports;
CREATE POLICY "Report supports viewable by everyone" ON public.report_supports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle support" ON public.report_supports;
CREATE POLICY "Users can toggle support" ON public.report_supports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can remove support" ON public.report_supports;
CREATE POLICY "Users can remove support" ON public.report_supports FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- 9. USER_PREFERENCES (Civic Personalization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light',
  preferred_district TEXT NOT NULL DEFAULT 'Kota Bogor',
  saved_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User preferences viewable by everyone" ON public.user_preferences;
CREATE POLICY "User preferences viewable by everyone" ON public.user_preferences FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can upsert preferences" ON public.user_preferences;
CREATE POLICY "Users can upsert preferences" ON public.user_preferences FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 10. REAL-TIME COUNT SYNCHRONIZATION TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_post_likes ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.sync_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_post_saves ON public.post_saves;
CREATE TRIGGER trg_sync_post_saves
AFTER INSERT OR DELETE ON public.post_saves
FOR EACH ROW EXECUTE FUNCTION public.sync_post_saves_count();

CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_post_comments ON public.comments;
CREATE TRIGGER trg_sync_post_comments
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

CREATE OR REPLACE FUNCTION public.sync_report_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reports SET support_count = support_count + 1 WHERE id = NEW.report_id;
    UPDATE public.posts SET support_count = support_count + 1 WHERE related_report_id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reports SET support_count = GREATEST(0, support_count - 1) WHERE id = OLD.report_id;
    UPDATE public.posts SET support_count = GREATEST(0, support_count - 1) WHERE related_report_id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_report_supports ON public.report_supports;
CREATE TRIGGER trg_sync_report_supports
AFTER INSERT OR DELETE ON public.report_supports
FOR EACH ROW EXECUTE FUNCTION public.sync_report_supports_count();

-- -----------------------------------------------------------------------------
-- 11. CLEAN CIVIC SEED DATA (All Counts = 0 Default)
-- -----------------------------------------------------------------------------

-- Facilities Seed
INSERT INTO public.facilities (id, name, category, address, latitude, longitude, responsible_agency, active_reports_count, resolved_reports_count)
VALUES
  ('fac-01', 'Puskesmas Bogor Barat', 'Kesehatan', 'Jl. Darul Quran No. 5, Loji, Bogor Barat', -6.589211, 106.772412, 'Dinas Kesehatan Kota Bogor', 0, 14),
  ('fac-02', 'SMP Negeri 1 Kota Bogor', 'Pendidikan', 'Jl. Menteng No. 12, Bogor Barat', -6.581903, 106.778942, 'Dinas Pendidikan Kota Bogor', 0, 8),
  ('fac-03', 'Saluran Drainase Utama Pajajaran', 'Infrastruktur', 'Koridor Jl. Pajajaran KM 2 - KM 5', -6.602314, 106.804119, 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor', 0, 22),
  ('fac-04', 'Taman Kencana', 'Lingkungan', 'Babakan, Bogor Tengah', -6.590745, 106.801287, 'Dinas Perumahan dan Permukiman', 0, 19)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  responsible_agency = EXCLUDED.responsible_agency;

-- 10 Reports Seed with support_count = 0
INSERT INTO public.reports (id, public_reference, reporter_user_id, secret_follow_up_token_hash, title, description, category, severity, status, publication_status, location, facility_name, responsible_agency, media_urls, reporter_type, reporter_display_name, support_count, budget_context, events, created_at, updated_at)
VALUES
  ('rep-kn-001', 'TIK-2026-000101', 'usr-kn-001', 'hash_secret_token_kn_001', 'Lubang Jalan Menganga di Jalur Cepat Ahmad Yani', 'Aspal ambles berdiameter sekitar 80 cm dengan kedalaman lebih dari 15 cm di lajur kanan arah Summarecon. Sangat membahayakan pengendara motor.', 'Infrastruktur', 'critical', 'under_review', 'published', '{"latitude": -6.2384, "longitude": 106.9912, "address": "Jl. Jendral Ahmad Yani, Marga Jaya", "district": "Bekasi Selatan", "city": "Kota Bekasi", "province": "Jawa Barat", "isApproximate": false}'::jsonb, 'Ruas Jalan Arteri Primer Ahmad Yani', 'Dinas Bina Marga dan Sumber Daya Air Kota Bekasi', '["/images/feed/k001.png"]'::jsonb, 'verified_citizen', 'Mamat Saputra', 0, '{"sectorName": "Infrastruktur Jalan", "responsibleAgency": "Dinas Bina Marga Kota Bekasi"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat di sistem TITIK."}]'::jsonb, '2026-10-19T07:48:00+07:00', '2026-10-19T08:15:00+07:00'),
  ('rep-kn-002', 'TIK-2026-000102', 'usr-kn-002', 'hash_secret_token_kn_002', 'U-Ditch Terbuka & Trotoar Ambles Margonda', 'Trotoar pejalan kaki di depan deretan ruko Margonda ambles, penutup saluran beton pecah menyisakan lubang terbuka sedalam 1.2 meter.', 'Infrastruktur', 'medium', 'forwarded_to_institution', 'published', '{"latitude": -6.3725, "longitude": 106.8327, "address": "Jl. Margonda Raya, Pondok Cina", "district": "Beji", "city": "Kota Depok", "province": "Jawa Barat", "isApproximate": false}'::jsonb, 'Pedestrian & Saluran Drainase Margonda Raya', 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Depok', '["/images/feed/k002.png"]'::jsonb, 'verified_citizen', 'Dian Prameswari', 0, '{"sectorName": "Infrastruktur Trotoar", "responsibleAgency": "Dinas PUPR Depok"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-18T10:14:00+07:00', '2026-10-18T11:20:00+07:00'),
  ('rep-kn-003', 'TIK-2026-000103', 'usr-kn-003', 'hash_secret_token_kn_003', 'PJU Padam Total di Jalur Truk Logistik Pelabuhan', 'Penerangan jalan umum padam sepanjang hampir 500 meter di koridor kontainer Pelabuhan Tanjung Priok.', 'Infrastruktur', 'critical', 'needs_info', 'published', '{"latitude": -6.1189, "longitude": 106.8856, "address": "Jl. Sulawesi, Tanjung Priok", "district": "Tanjung Priok", "city": "Jakarta Utara", "province": "DKI Jakarta", "isApproximate": false}'::jsonb, 'Jaringan PJU Jalur Arteri Pelabuhan Tanjung Priok', 'Dinas Bina Marga Provinsi DKI Jakarta', '["/images/feed/k003.png"]'::jsonb, 'verified_citizen', 'Syaiful Anwar', 0, '{"sectorName": "Penerangan Jalan", "responsibleAgency": "Dinas Bina Marga DKI"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-17T19:35:00+07:00', '2026-10-17T20:10:00+07:00'),
  ('rep-kn-004', 'TIK-2026-000104', 'usr-kn-004', 'hash_secret_token_kn_004', 'Marka Zebra Cross Pudar & Lampu Kedip Sekolah Mati', 'Marka penyeberangan anak sekolah di depan SDN Bintaro 03 hampir hilang tak terlihat.', 'Infrastruktur', 'medium', 'under_review', 'published', '{"latitude": -6.2731, "longitude": 106.7118, "address": "Jl. Bintaro Utama Sektor 3A", "district": "Pondok Aren", "city": "Kota Tangerang Selatan", "province": "Banten", "isApproximate": false}'::jsonb, 'Zebra Cross & Rambu Keselamatan Sekolah', 'Dinas Perhubungan Kota Tangerang Selatan', '["/images/feed/k004.png"]'::jsonb, 'verified_citizen', 'Farhan Wibisono', 0, '{"sectorName": "Keselamatan Lalu Lintas", "responsibleAgency": "Dishub Tangsel"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-17T11:45:00+07:00', '2026-10-17T13:00:00+07:00'),
  ('rep-kn-005', 'TIK-2026-000105', 'usr-kn-005', 'hash_secret_token_kn_005', 'Retakan Tebing Curam Bantaran Sungai Cisadane Empang', 'Retakan tanah selebar 10 cm terlihat di tebing penyangga jalan setapak pinggir sungai Cisadane.', 'Infrastruktur', 'critical', 'forwarded_to_institution', 'published', '{"latitude": -6.6082, "longitude": 106.7941, "address": "Kampung Empang Hilir", "district": "Bogor Selatan", "city": "Kota Bogor", "province": "Jawa Barat", "isApproximate": false}'::jsonb, 'Dinding Penahan Tebing DAS Cisadane Empang', 'Balai Besar Wilayah Sungai (BBWS) Ciliwung Cisadane', '["/images/feed/k005.png"]'::jsonb, 'verified_citizen', 'Wardi Gunawan', 0, '{"sectorName": "Penanganan Bencana & Tebing", "responsibleAgency": "BBWS Ciliwung Cisadane"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-17T15:20:00+07:00', '2026-10-17T16:05:00+07:00'),
  ('rep-kn-006', 'TIK-2026-000106', 'usr-kn-006', 'hash_secret_token_kn_006', 'Banjir Luapan Kali Sunter Merendam Akses Cipinang Melayu', 'Hujan deras semalam mengakibatkan luapan Kali Sunter merendam permukiman dan akses jalan utama Cipinang Melayu hingga setinggi paha.', 'Lingkungan', 'critical', 'forwarded_to_institution', 'published', '{"latitude": -6.2483, "longitude": 106.9042, "address": "Jl. Inspeksi Kali Sunter, Cipinang Melayu", "district": "Makasar", "city": "Jakarta Timur", "province": "DKI Jakarta", "isApproximate": false}'::jsonb, 'Tanggul & Saluran Pengendali Banjir Kali Sunter', 'Dinas Sumber Daya Air Provinsi DKI Jakarta', '["/images/feed/k006.png"]'::jsonb, 'verified_citizen', 'Hendra Kusuma', 0, '{"sectorName": "Pengendalian Banjir", "responsibleAgency": "Dinas SDA DKI"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-17T08:12:00+07:00', '2026-10-17T09:00:00+07:00'),
  ('rep-kn-007', 'TIK-2026-000107', 'usr-kn-007', 'hash_secret_token_kn_007', 'Genangan Simpang Fatmawati-TB Simatupang Menghambat Akses MRT', 'Antrean kendaraan mengular lebih dari 1 kilometer akibat genangan air setinggi 30 cm di kolong layang MRT Fatmawati.', 'Lingkungan', 'critical', 'under_review', 'published', '{"latitude": -6.2924, "longitude": 106.7938, "address": "Simpang Fatmawati - TB Simatupang", "district": "Cilandak", "city": "Jakarta Selatan", "province": "DKI Jakarta", "isApproximate": false}'::jsonb, 'Saluran Pembuangan Primer Simpang Fatmawati', 'Suku Dinas Sumber Daya Air Kota Administrasi Jakarta Selatan', '["/images/feed/k007.png"]'::jsonb, 'verified_citizen', 'Najla Savitri', 0, '{"sectorName": "Drainase Perkotaan", "responsibleAgency": "Sudin SDA Jaksel"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-16T18:37:00+07:00', '2026-10-16T19:10:00+07:00'),
  ('rep-kn-008', 'TIK-2026-000108', 'usr-kn-008', 'hash_secret_token_kn_008', 'Genangan Akses Gerbang Kompleks Perumahan Ciledug', 'Air setinggi paha menutup gerbang perumahan di Ciledug, banyak kendaraan roda dua mogok dan warga terisolasi.', 'Lingkungan', 'critical', 'forwarded_to_institution', 'published', '{"latitude": -6.2448, "longitude": 106.7226, "address": "Jl. KH Hasyim Ashari, Ciledug", "district": "Ciledug", "city": "Kota Tangerang", "province": "Banten", "isApproximate": false}'::jsonb, 'Pintu Gerbang & Saluran Kali Cantiga Ciledug', 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Tangerang', '["/images/feed/k008.png"]'::jsonb, 'verified_citizen', 'Budi Santoso', 0, '{"sectorName": "Pengendalian Banjir", "responsibleAgency": "Dinas PUPR Tangerang"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-16T16:20:00+07:00', '2026-10-16T17:00:00+07:00'),
  ('rep-kn-009', 'TIK-2026-000109', 'usr-kn-009', 'hash_secret_token_kn_009', 'Sampah Menumpuk di Jembatan Merah Menyumbat Aliran Air', 'Timbunan sampah plastik, ranting bambu, dan kasur bekas tersangkut di tiang penyangga Jembatan Merah.', 'Lingkungan', 'medium', 'forwarded_to_institution', 'published', '{"latitude": -6.5947, "longitude": 106.7892, "address": "Jembatan Merah, Panaragan", "district": "Bogor Tengah", "city": "Kota Bogor", "province": "Jawa Barat", "isApproximate": false}'::jsonb, 'Infrastruktur Jembatan Merah & Aliran Sungai Cisadane', 'Dinas Lingkungan Hidup Kota Bogor', '["/images/feed/k009.png"]'::jsonb, 'verified_citizen', 'Asep Suhendar', 0, '{"sectorName": "Pengelolaan Persampahan", "responsibleAgency": "DLH Kota Bogor"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-16T09:15:00+07:00', '2026-10-16T10:00:00+07:00'),
  ('rep-kn-010', 'TIK-2026-000110', 'usr-kn-010', 'hash_secret_token_kn_010', 'Pompa Air Pluit Rusak Mengakibatkan Rob Menggenang', 'Satu dari tiga unit mesin pompa pengendali rob di Waduk Pluit mengalami mati daya.', 'Infrastruktur', 'critical', 'needs_info', 'published', '{"latitude": -6.1215, "longitude": 106.7981, "address": "Rumah Pompa Waduk Pluit", "district": "Penjaringan", "city": "Jakarta Utara", "province": "DKI Jakarta", "isApproximate": false}'::jsonb, 'Stasiun Pompa Pengendali Rob Waduk Pluit', 'Dinas Sumber Daya Air Provinsi DKI Jakarta', '["/images/feed/k010.png"]'::jsonb, 'verified_citizen', 'Johan Susilo', 0, '{"sectorName": "Stasiun Pompa Pengendali Rob", "responsibleAgency": "Dinas SDA DKI"}'::jsonb, '[{"eventType": "SUBMITTED", "description": "Laporan warga tercatat."}]'::jsonb, '2026-10-15T14:40:00+07:00', '2026-10-15T15:20:00+07:00')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status,
  support_count = 0;

-- 10 Posts Seed with zero counts (likes=0, saves=0, comments=0, shares=0)
INSERT INTO public.posts (id, author_id, author_username, author_display_name, author_avatar_url, author_role, body, post_type, media, location_tag, related_report_id, support_count, likes_count, saves_count, comments_count, shares_count, created_at)
VALUES
  ('kn-001', 'usr-kn-001', 'mamatojol_bks', 'Mamat Saputra', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'citizen', 'Lubang di depan lampu merah Ahmad Yani makin dalem, tadi ada bapak-bapak hasil kopling di situ. Tolong ditambal ya kang, motor sampai seret.', 'citizen_report', '[{"id": "m-kn-001", "type": "image", "url": "/images/feed/k001.png", "aspectRatio": "4/5"}]'::jsonb, 'Bekasi, Jawa Barat', 'rep-kn-001', 0, 0, 0, 0, 0, '2026-10-19T07:48:00+07:00'),
  ('kn-002', 'usr-kn-002', 'dian_prames', 'Dian Prameswari', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'citizen', 'Trotoar Margonda deket kampus UI bolong gede banget, tutup betonnya hancur. Bahaya banget kalau malam pejalan kaki bisa kejeblos!', 'citizen_report', '[{"id": "m-kn-002", "type": "image", "url": "/images/feed/k002.png", "aspectRatio": "4/5"}]'::jsonb, 'Depok, Jawa Barat', 'rep-kn-002', 0, 0, 0, 0, 0, '2026-10-18T10:14:00+07:00'),
  ('kn-003', 'usr-kn-003', 'syaiful_priok', 'Syaiful Anwar', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'citizen', 'Lampu jalan padam sepanjang 500 meter di jalur kontainer Priok. Gelap gulita, rawan begal dan kecelakaan truk tronton.', 'citizen_report', '[{"id": "m-kn-003", "type": "image", "url": "/images/feed/k003.png", "aspectRatio": "4/5"}]'::jsonb, 'Jakarta Utara, DKI Jakarta', 'rep-kn-003', 0, 0, 0, 0, 0, '2026-10-17T19:35:00+07:00'),
  ('kn-004', 'usr-kn-004', 'farhan_bintaro', 'Farhan Wibisono', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'citizen', 'Zebra cross depan SDN Bintaro 03 udah gak kelihatan sama sekali. Mobil motor ngebut terus, anak-anak susah nyebrang.', 'citizen_report', '[{"id": "m-kn-004", "type": "image", "url": "/images/feed/k004.png", "aspectRatio": "4/5"}]'::jsonb, 'Tangerang Selatan, Banten', 'rep-kn-004', 0, 0, 0, 0, 0, '2026-10-17T11:45:00+07:00'),
  ('kn-005', 'usr-kn-005', 'wardi_bgr', 'Wardi Gunawan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'citizen', 'Tebing pinggir sungai Cisadane di Empang mulai retak-retak. Kalau hujan gede takut longsor kena jalan setapak warga.', 'citizen_report', '[{"id": "m-kn-005", "type": "image", "url": "/images/feed/k005.png", "aspectRatio": "4/5"}]'::jsonb, 'Bogor, Jawa Barat', 'rep-kn-005', 0, 0, 0, 0, 0, '2026-10-17T15:20:00+07:00'),
  ('kn-006', 'usr-kn-006', 'hendra_jaktim', 'Hendra Kusuma', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'citizen', 'Banjir Kali Sunter meluap lagi sampai paha orang dewasa di Cipinang Melayu. Akses jalan putus total, warga butuh perahu evakuasi.', 'citizen_report', '[{"id": "m-kn-006", "type": "image", "url": "/images/feed/k006.png", "aspectRatio": "4/5"}]'::jsonb, 'Jakarta Timur, DKI Jakarta', 'rep-kn-006', 0, 0, 0, 0, 0, '2026-10-17T08:12:00+07:00'),
  ('kn-007', 'usr-kn-007', 'najla_jaksel', 'Najla Savitri', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'citizen', 'Simpang Fatmawati bawah MRT banjir 30cm, macetnya sampai 1 km lebih. Saluran tali air mampet ketutup sampah.', 'citizen_report', '[{"id": "m-kn-007", "type": "image", "url": "/images/feed/k007.png", "aspectRatio": "4/5"}]'::jsonb, 'Jakarta Selatan, DKI Jakarta', 'rep-kn-007', 0, 0, 0, 0, 0, '2026-10-16T18:37:00+07:00'),
  ('kn-008', 'usr-kn-008', 'budi_ciledug', 'Budi Santoso', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'citizen', 'Gerbang kompleks perumahan di Ciledug terendam banjir sepinggang. Motor pada mogok, tolong bantuan pompa dari Pemkot.', 'citizen_report', '[{"id": "m-kn-008", "type": "image", "url": "/images/feed/k008.png", "aspectRatio": "4/5"}]'::jsonb, 'Tangerang, Banten', 'rep-kn-008', 0, 0, 0, 0, 0, '2026-10-16T16:20:00+07:00'),
  ('kn-009', 'usr-kn-009', 'asep_bogor', 'Asep Suhendar', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 'citizen', 'Sampah ranting pohon dan plastik numpuk di kolong Jembatan Merah. Air sungai mulai tersumbat, baunya menyengat.', 'citizen_report', '[{"id": "m-kn-009", "type": "image", "url": "/images/feed/k009.png", "aspectRatio": "4/5"}]'::jsonb, 'Bogor, Jawa Barat', 'rep-kn-009', 0, 0, 0, 0, 0, '2026-10-16T09:15:00+07:00'),
  ('kn-010', 'usr-kn-010', 'johan_pluit', 'Johan Susilo', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'citizen', 'Satu mesin pompa air di Pluit mati lagi, air rob laut mulai rembes ke jalanan pemukiman. Mohon suku dinas segera servis!', 'citizen_report', '[{"id": "m-kn-010", "type": "image", "url": "/images/feed/k010.png", "aspectRatio": "4/5"}]'::jsonb, 'Jakarta Utara, DKI Jakarta', 'rep-kn-010', 0, 0, 0, 0, 0, '2026-10-15T14:40:00+07:00')
ON CONFLICT (id) DO UPDATE SET
  author_username = EXCLUDED.author_username,
  author_display_name = EXCLUDED.author_display_name,
  body = EXCLUDED.body,
  support_count = 0,
  likes_count = 0,
  saves_count = 0,
  comments_count = 0,
  shares_count = 0;
`;

// Write schema.sql
fs.writeFileSync(path.join(__dirname, '../supabase/schema.sql'), sqlContent, 'utf8');

// Write new migration file
fs.writeFileSync(
  path.join(__dirname, '../supabase/migrations/20261027000001_full_server_side_schema_and_clean_seed.sql'),
  sqlContent,
  'utf8'
);

console.log('Successfully generated supabase/schema.sql and migration file!');
