const fs = require('fs');
const path = require('path');

// Read mock data from built or source mockCivicData
// To avoid TS compilation issues, we can extract the objects directly
const mockPath = path.join(__dirname, '../src/data/mockCivicData.ts');
const mockCode = fs.readFileSync(mockPath, 'utf8');

console.log('Generating supabase/SEED_RANDOMIZED_ACCOUNTS_AND_CONTENT.sql...');

const sqlHeader = `-- =============================================================================
-- TITIK. — Seed Script: Randomized Citizen Accounts, Dynamic Posts & Reports
-- Run this script in the Supabase SQL Editor (Superuser / Postgres Role).
-- It idempotently creates:
--   1. Auth accounts (admin@titik.id & warga@titik.id) with auth.identities
--   2. All 16 citizen and administrative profiles in public.profiles
--   3. Public facilities in public.facilities
--   4. Civic reports in public.reports with mapped reporter_user_id
--   5. Social feed posts in public.posts with randomized metrics & varied timestamps
--   6. Civic discussion comments in public.comments
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. AUTH USERS & IDENTITIES (Zero 500 Error for Password Login)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_citizen_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_encrypted_admin_pw TEXT := crypt('admin2026', gen_salt('bf'));
  v_encrypted_citizen_pw TEXT := crypt('titik2026', gen_salt('bf'));
BEGIN
  -- Admin auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@titik.id', v_encrypted_admin_pw, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"admin.pupr","display_name":"Administrator Dinas PUPR","district":"Bogor Tengah"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = v_encrypted_admin_pw,
    email_confirmed_at = NOW(),
    updated_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_admin_id, v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@titik.id'),
    'email', v_admin_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider, provider_id) DO UPDATE SET
    updated_at = NOW();

  -- Citizen auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_citizen_id, 'authenticated', 'authenticated',
    'warga@titik.id', v_encrypted_citizen_pw, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"budi.santoso","display_name":"Budi Santoso","district":"Bogor Selatan"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = v_encrypted_citizen_pw,
    email_confirmed_at = NOW(),
    updated_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_citizen_id, v_citizen_id,
    jsonb_build_object('sub', v_citizen_id::text, 'email', 'warga@titik.id'),
    'email', v_citizen_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider, provider_id) DO UPDATE SET
    updated_at = NOW();

  -- Assign admin role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_id::text, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
END $$;
`;

const profilesSql = `
-- -----------------------------------------------------------------------------
-- 2. PUBLIC PROFILES (16 Complete Citizen & Authority Accounts)
-- -----------------------------------------------------------------------------
INSERT INTO public.profiles (id, username, display_name, email, avatar_url, bio, district, role, is_verified, is_demo)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin.pupr', 'Administrator Dinas PUPR', 'admin@titik.id', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Akun resmi verifikasi dan tindak lanjut laporan infrastruktur dinas PUPR Kota Bogor.', 'Bogor Tengah', 'admin', true, false),
  ('c0000000-0000-0000-0000-000000000001', 'budi.santoso', 'Budi Santoso', 'warga@titik.id', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Warga Bogor Selatan pemerhati fasilitas jalan, drainase, dan keterbukaan APBD.', 'Bogor Selatan', 'citizen', true, false),
  ('usr-kn-001', 'mamatojol_bks', 'Mamat Saputra', 'mamat@demo.titik.id', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Ojol Bekasi pejuang aspal pantura & Ahmad Yani.', 'Bekasi Barat', 'citizen', true, true),
  ('usr-kn-002', 'dian.margonda', 'Dian Prameswari', 'dian@demo.titik.id', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Warga Margonda, pejalan kaki harian kawasan kampus UI.', 'Pancoran Mas', 'citizen', true, true),
  ('usr-kn-003', 'bangipul_cilincing', 'Syaiful Anwar', 'syaiful@demo.titik.id', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', 'Warga pesisir Cilincing & pemerhati keselamatan truk kontainer.', 'Cilincing', 'citizen', true, true),
  ('usr-kn-004', 'bsd.stroller', 'Farhan Wibisono', 'farhan@demo.titik.id', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Urban commuter Tangsel & pegiat stroller walk ramah pejalan kaki.', 'Serpong', 'citizen', true, true),
  ('usr-kn-005', 'wardi_pajajaran', 'Wardi Gunawan', 'wardi@demo.titik.id', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Warga Bogor Utara, rutin melintas koridor Pajajaran.', 'Bogor Utara', 'citizen', true, true),
  ('usr-kn-006', 'warga_kampungmelayu', 'Siti Aminah', 'siti@demo.titik.id', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'Warga bantaran Kp. Melayu, relawan posko siaga banjir.', 'Jatinegara', 'citizen', true, true),
  ('usr-kn-007', 'najla.kemang', 'Najla Savitri', 'najla@demo.titik.id', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Warga Kemang & penikmat kuliner Jakarta Selatan.', 'Mampang Prapatan', 'citizen', true, true),
  ('usr-kn-008', 'bangdedi.ciledug', 'Dedi Hermawan', 'dedi@demo.titik.id', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Warga Ciledug, pegiat drainase perumahan anti-genangan.', 'Ciledug', 'citizen', true, true),
  ('usr-kn-009', 'pojok_kebunraya', 'Pak Hendra', 'hendra@demo.titik.id', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'Pedagang kuliner lingkar Kebun Raya Bogor.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-010', 'warga_pluit_112', 'Kevin Wijaya', 'kevin@demo.titik.id', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 'Warga Pluit, pemerhati pompa banjir & rob pesisir.', 'Penjaringan', 'citizen', true, true),
  ('usr-kn-011', 'sahabatbogor', 'Rizky Pratama', 'rizky@demo.titik.id', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 'Komunitas peduli fasilitas publik & taman Kota Bogor.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-012', 'sariwulan', 'Sari Wulandari', 'sari@demo.titik.id', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Pemerhati keselamatan pejalan kaki dan jembatan kota.', 'Bogor Timur', 'citizen', true, true),
  ('usr-kn-013', 'dikasetia', 'Dika Setiawan', 'dika@demo.titik.id', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'Teknisi kelistrikan & pemerhati penerangan jalan umum.', 'Bogor Selatan', 'citizen', true, true),
  ('usr-kn-014', 'infobogor', 'Portal Info Warga Bogor', 'info@demo.titik.id', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150', 'Kanal independen pemantauan infrastruktur dan agenda kota.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-015', 'rizkyaprianto', 'Rizky Aprianto', 'rizkya@demo.titik.id', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 'Warga Bogor Tengah pemerhati drainase perumahan.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-016', 'ahmadfauzi', 'Ahmad Fauzi', 'ahmad@demo.titik.id', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Warga Pasar Anyar pemerhati kebersihan lingkungan.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-017', 'nurulhidayah', 'Nurul Hidayah', 'nurul@demo.titik.id', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Pedagang pasar & warga aktif Kota Bogor.', 'Bogor Tengah', 'citizen', true, true),
  ('usr-kn-018', 'hendrokurnia', 'Hendro Kurnia', 'hendro@demo.titik.id', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 'Penglaju harian motor rute Bogor - Jakarta.', 'Bogor Utara', 'citizen', true, true),
  ('usr-kn-019', 'aguspramono', 'Agus Pramono', 'agus@demo.titik.id', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Pengawas konstruksi independen & warga Bogor Barat.', 'Bogor Barat', 'citizen', true, true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  district = EXCLUDED.district,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified,
  is_demo = EXCLUDED.is_demo;
`;

const facilitiesSql = `
-- -----------------------------------------------------------------------------
-- 3. PUBLIC FACILITIES (Fasilitas Infrastruktur & Layanan Publik)
-- -----------------------------------------------------------------------------
INSERT INTO public.facilities (id, name, category, address, latitude, longitude, responsible_agency, active_reports_count, resolved_reports_count, is_demo)
VALUES
  ('fac-01', 'Puskesmas Bogor Tengah', 'Kesehatan', 'Jl. Pemuda No. 34, Bogor Tengah', -6.586112, 106.794211, 'Dinas Kesehatan Kota Bogor', 1, 14, true),
  ('fac-02', 'Taman Sempur', 'Taman & Olahraga', 'Jl. Sempur No. 1, Bogor Tengah', -6.592144, 106.801244, 'Dinas Lingkungan Hidup Kota Bogor', 0, 28, true),
  ('fac-03', 'SDN Paledang', 'Pendidikan', 'Jl. Paledang No. 12, Bogor Tengah', -6.599812, 106.791244, 'Dinas Pendidikan Kota Bogor', 2, 8, true),
  ('fac-04', 'Pasar Anyar Bogor', 'Perdagangan & Pasar', 'Jl. Dewi Sartika, Bogor Tengah', -6.589112, 106.793884, 'Perumda Pasar Pakuan Jaya', 3, 45, true),
  ('fac-05', 'Jembatan Otista', 'Infrastruktur Jalan', 'Jl. Otto Iskandardinata, Bogor Timur', -6.600122, 106.802114, 'Dinas PUPR Kota Bogor', 1, 19, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  responsible_agency = EXCLUDED.responsible_agency,
  active_reports_count = EXCLUDED.active_reports_count,
  resolved_reports_count = EXCLUDED.resolved_reports_count;
`;

const reportsSql = `
-- -----------------------------------------------------------------------------
-- 4. CIVIC REPORTS (Laporan Warga Berbukti dengan Mapped Reporter ID)
-- -----------------------------------------------------------------------------
INSERT INTO public.reports (
  id, public_reference, reporter_user_id, title, description, category, severity,
  status, publication_status, location, facility_name, responsible_agency, media_urls,
  reporter_type, reporter_display_name, support_count, budget_context, events, is_demo, created_at, updated_at
) VALUES
  (
    'rep-kn-001', 'TIK-2026-000101', 'usr-kn-001',
    'Jalan Berlubang Parah Depan Lampu Merah Ahmad Yani',
    'Lubang jalan sedalam 15cm tergenang air di lajur kiri Jl. Ahmad Yani dekat lampu merah. Sering membuat pengendara motor oleng dan velg penyok.',
    'Infrastruktur', 'critical', 'under_review', 'published',
    '{"latitude": -6.2384, "longitude": 106.9912, "address": "Jl. Ahmad Yani No. 14, Margajaya", "district": "Bekasi Selatan", "city": "Kota Bekasi", "province": "Jawa Barat"}'::jsonb,
    'Ruas Jalan Arteri Ahmad Yani', 'Dinas Bina Marga dan Sumber Daya Air (BMSDA) Kota Bekasi',
    '["/images/feed/k001.png"]'::jsonb, 'verified_citizen', 'Mamat Saputra', 8425,
    '{"sectorId": "bdg-bks-jalan-01", "sectorName": "Infrastruktur Jalan & Jembatan", "paguAllocation": 42000000000, "realizedSpending": 29820000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-1","eventType":"SUBMITTED","actorName":"Mamat Saputra","timestamp":"19 Oktober 2026, 07:48 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'
  ),
  (
    'rep-kn-002', 'TIK-2026-000102', 'usr-kn-002',
    'Kerusakan Trotoar & Besi Rebar Mencuat di Margonda Raya',
    'Trotoar Margonda depan ruko buckled dan besi rebar keluar. Pejalan kaki dan pengguna kursi roda kesulitan melintas.',
    'Infrastruktur', 'medium', 'forwarded_to_institution', 'published',
    '{"latitude": -6.3901, "longitude": 106.8283, "address": "Jl. Margonda Raya No. 230", "district": "Beji", "city": "Kota Depok", "province": "Jawa Barat"}'::jsonb,
    'Jalur Pedestrian Margonda Raya', 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Depok',
    '["/images/feed/k002.png"]'::jsonb, 'verified_citizen', 'Dian Prameswari', 428,
    '{"sectorId": "bdg-dpk-trotoar-02", "sectorName": "Infrastruktur Pedestrian", "paguAllocation": 28500000000, "realizedSpending": 19380000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-2","eventType":"SUBMITTED","actorName":"Dian Prameswari","timestamp":"13 Oktober 2026, 12:42 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  ),
  (
    'rep-kn-003', 'TIK-2026-000103', 'usr-kn-003',
    'PJU Padam & Kabel Utilitas Menggelantung Rendah di Cilincing',
    'Lampu penerangan jalan padam dan kabel PLN bergelantungan rendah di jalur lintas truk kontainer Cilincing.',
    'Infrastruktur', 'critical', 'under_review', 'published',
    '{"latitude": -6.1189, "longitude": 106.9381, "address": "Jl. Raya Cilincing No. 8", "district": "Cilincing", "city": "Jakarta Utara", "province": "DKI Jakarta"}'::jsonb,
    'Koridor Penerangan Jalan Cilincing', 'Suku Dinas Bina Marga Jakarta Utara',
    '["/images/feed/k003.png"]'::jsonb, 'verified_citizen', 'Syaiful Anwar', 1562,
    '{"sectorId": "bdg-jku-pju-03", "sectorName": "Penerangan Jalan Umum", "paguAllocation": 19500000000, "realizedSpending": 13260000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-3","eventType":"SUBMITTED","actorName":"Syaiful Anwar","timestamp":"17 Oktober 2026, 20:15 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
  ),
  (
    'rep-kn-004', 'TIK-2026-000104', 'usr-kn-004',
    'Pengecatan Marka Zebra Cross BSD Boulevard',
    'Apresiasi pengecatan ulang marka penyeberangan pejalan kaki di depan sentra niaga BSD. Terlihat kontras dan jelas.',
    'Infrastruktur', 'low', 'resolved', 'published',
    '{"latitude": -6.3012, "longitude": 106.6542, "address": "BSD Boulevard Utama", "district": "Serpong", "city": "Kota Tangerang Selatan", "province": "Banten"}'::jsonb,
    'Penyeberangan Pejalan Kaki BSD', 'Dinas Perhubungan Kota Tangsel',
    '["/images/feed/k004.png"]'::jsonb, 'verified_citizen', 'Farhan Wibisono', 124,
    '{"sectorId": "bdg-tgs-marka-04", "sectorName": "Marka & Rambu Lalu Lintas", "paguAllocation": 12000000000, "realizedSpending": 9600000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-4","eventType":"RESOLVED","actorName":"Farhan Wibisono","timestamp":"19 Oktober 2026, 09:30 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
  ),
  (
    'rep-kn-005', 'TIK-2026-000105', 'usr-kn-005',
    'Dinding Penahan Tebing Ambrol Pasca Hujan di Pajajaran',
    'Talud penahan tanah retak dan batu penahan longsor sebagian ke saluran drainase. Rawan ambrol susulan.',
    'Infrastruktur', 'high', 'forwarded_to_institution', 'published',
    '{"latitude": -6.5812, "longitude": 106.8114, "address": "Jl. Raya Pajajaran No. 88", "district": "Bogor Utara", "city": "Kota Bogor", "province": "Jawa Barat"}'::jsonb,
    'Dinding Penahan Tanah Koridor Pajajaran', 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    '["/images/feed/k005.png"]'::jsonb, 'verified_citizen', 'Wardi Gunawan', 289,
    '{"sectorId": "bdg-bgr-drainase-05", "sectorName": "Drainase & Penahan Tebing", "paguAllocation": 34000000000, "realizedSpending": 23800000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-5","eventType":"SUBMITTED","actorName":"Wardi Gunawan","timestamp":"19 Oktober 2026, 16:05 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  ),
  (
    'rep-kn-006', 'TIK-2026-000106', 'usr-kn-006',
    'Banjir Luapan Ciliwung Pemukiman Kampung Melayu',
    'Genangan air mencapai pinggang orang dewasa di gang-gang pemukiman Kampung Melayu. Perahu karet BPBD sudah bersiaga.',
    'Lingkungan', 'critical', 'in_progress', 'published',
    '{"latitude": -6.2261, "longitude": 106.8568, "address": "Jl. Kebon Pala I, Kampung Melayu", "district": "Jatinegara", "city": "Jakarta Timur", "province": "DKI Jakarta"}'::jsonb,
    'Bantaran Kali Ciliwung Kp. Melayu', 'Dinas Sumber Daya Air Provinsi DKI Jakarta',
    '["/images/feed/k006.png"]'::jsonb, 'verified_citizen', 'Siti Aminah', 14800,
    '{"sectorId": "bdg-jkt-pompa-06", "sectorName": "Pengendalian Banjir & Pompa", "paguAllocation": 78000000000, "realizedSpending": 54600000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-6","eventType":"IN_PROGRESS","actorName":"Siti Aminah","timestamp":"18 Oktober 2026, 06:23 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  ),
  (
    'rep-kn-007', 'TIK-2026-000107', 'usr-kn-007',
    'Genangan Air Hujan di Ruas Utama Kemang Raya',
    'Genangan air setinggi mata kaki merendam jalan dan trotoar depan pertokoan Kemang meski hujan baru turun sebentar.',
    'Lingkungan', 'medium', 'under_review', 'published',
    '{"latitude": -6.2604, "longitude": 106.8158, "address": "Jl. Kemang Raya No. 45", "district": "Mampang Prapatan", "city": "Jakarta Selatan", "province": "DKI Jakarta"}'::jsonb,
    'Sistem Drainase Mikro Kemang Raya', 'Sudin Sumber Daya Air Jakarta Selatan',
    '["/images/feed/k007.png"]'::jsonb, 'verified_citizen', 'Najla Savitri', 746,
    '{"sectorId": "bdg-jks-drainase-07", "sectorName": "Sistem Drainase Mikro", "paguAllocation": 24000000000, "realizedSpending": 16800000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-7","eventType":"SUBMITTED","actorName":"Najla Savitri","timestamp":"16 Oktober 2026, 18:37 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
  ),
  (
    'rep-budi-001', 'TIK-2026-000188', 'c0000000-0000-0000-0000-000000000001',
    'Paving Trotoar Rusak & Lubang Drainase Jl. Suryakencana',
    'Paving block trotoar di depan pertokoan Suryakencana amblas dan penutup drainase patah. Membahayakan pejalan kaki dan lansia yang beraktivitas pagi hari.',
    'Infrastruktur', 'medium', 'under_review', 'published',
    '{"latitude": -6.6045, "longitude": 106.8012, "address": "Jl. Suryakencana No. 112, Bogor Selatan", "district": "Bogor Selatan", "city": "Kota Bogor", "province": "Jawa Barat"}'::jsonb,
    'Koridor Pedestrian Suryakencana', 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    '["https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200"]'::jsonb,
    'verified_citizen', 'Budi Santoso', 684,
    '{"sectorId": "bdg-jalan-02", "sectorName": "Infrastruktur Jalan & Pejalan Kaki", "paguAllocation": 52000000000, "realizedSpending": 39500000000, "fiscalYear": 2026}'::jsonb,
    '[{"id":"ev-budi-1","eventType":"SUBMITTED","actorName":"Budi Santoso","timestamp":"22 Oktober 2026, 09:15 WIB"}]'::jsonb,
    true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  public_reference = EXCLUDED.public_reference,
  reporter_user_id = EXCLUDED.reporter_user_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status,
  publication_status = EXCLUDED.publication_status,
  location = EXCLUDED.location,
  facility_name = EXCLUDED.facility_name,
  responsible_agency = EXCLUDED.responsible_agency,
  media_urls = EXCLUDED.media_urls,
  reporter_type = EXCLUDED.reporter_type,
  reporter_display_name = EXCLUDED.reporter_display_name,
  support_count = EXCLUDED.support_count,
  budget_context = EXCLUDED.budget_context,
  events = EXCLUDED.events,
  is_demo = EXCLUDED.is_demo;
`;

const postsSql = `
-- -----------------------------------------------------------------------------
-- 5. SOCIAL FEED POSTS (Dengan Metrik Ter-randomisasi & Timestamp Beragam)
-- -----------------------------------------------------------------------------
INSERT INTO public.posts (
  id, author_id, author_username, author_display_name, author_avatar_url, author_role,
  body, post_type, media, location_tag, related_report_id, support_count, likes_count,
  comments_count, shares_count, saves_count, is_demo, created_at
) VALUES
  (
    'kn-001', 'usr-kn-001', 'mamatojol_bks', 'Mamat Saputra',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Lubang di depan lampu merah Ahmad Yani makin dalem, tadi ada bapak-bapak hasil kopling di situ. Tolong ditambal ya kang, motor sampai seret.',
    'citizen_report', '[{"id":"med-kn-001","type":"image","url":"/images/feed/k001.png","aspectRatio":"4/5"}]'::jsonb,
    'Jl. Ahmad Yani, Bekasi', 'rep-kn-001', 8425, 3420, 182, 89, 45, true, NOW() - INTERVAL '2 hours'
  ),
  (
    'kn-002', 'usr-kn-002', 'dian.margonda', 'Dian Prameswari',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Trotoar Margonda depan ruko itu udah kayak jalur slalom, rebar keluar semua. Jalan kaki aja ribet, apalagi bawa trolley belanja.',
    'citizen_report', '[{"id":"med-kn-002","type":"image","url":"/images/feed/k002.png","aspectRatio":"4/5"}]'::jsonb,
    'Jl. Margonda Raya, Depok', 'rep-kn-002', 428, 1180, 65, 38, 29, true, NOW() - INTERVAL '5 hours'
  ),
  (
    'kn-003', 'usr-kn-003', 'bangipul_cilincing', 'Syaiful Anwar',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Lampu jalan Cilincing tinggal segini yang nyala, kabel PLN nongol rendah gini. Malem-malem lewat sini bahaya parah, tolong dibenerin.',
    'citizen_report', '[{"id":"med-kn-003","type":"image","url":"/images/feed/k003.png","aspectRatio":"4/5"}]'::jsonb,
    'Cilincing, Jakarta Utara', 'rep-kn-003', 1562, 2890, 142, 88, 54, true, NOW() - INTERVAL '9 hours'
  ),
  (
    'kn-004', 'usr-kn-004', 'bsd.stroller', 'Farhan Wibisono',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Salfok lihat petugas cat ulang zebra cross di BSD pagi ini, rapi banget hasilnya. Respect buat yang di lapangan.',
    'community_discussion', '[{"id":"med-kn-004","type":"image","url":"/images/feed/k004.png","aspectRatio":"4/5"}]'::jsonb,
    'BSD City, Tangerang Selatan', 'rep-kn-004', 124, 640, 38, 29, 18, true, NOW() - INTERVAL '14 hours'
  ),
  (
    'kn-005', 'usr-kn-005', 'wardi_pajajaran', 'Wardi Gunawan',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Dinding penahan di Pajajaran mulai ambrol abis hujan semaleman, udah dikasih kerucut tapi motor tetep nekat lewat pinggir. Hati-hati.',
    'citizen_report', '[{"id":"med-kn-005","type":"image","url":"/images/feed/k005.png","aspectRatio":"4/5"}]'::jsonb,
    'Jl. Raya Pajajaran, Bogor', 'rep-kn-005', 289, 970, 51, 43, 21, true, NOW() - INTERVAL '1 day'
  ),
  (
    'kn-006', 'usr-kn-006', 'warga_kampungmelayu', 'Siti Aminah',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Banjir Kampung Melayu udah pinggang, gang dalaman pake perahu aja. Yg rumahnya kena, kuat ya semua. Titip info posko sekitar kalo ada.',
    'citizen_report', '[{"id":"med-kn-006","type":"image","url":"/images/feed/k006.png","aspectRatio":"4/5"}]'::jsonb,
    'Kampung Melayu, Jakarta Timur', 'rep-kn-006', 14800, 4920, 564, 215, 120, true, NOW() - INTERVAL '2 days'
  ),
  (
    'kn-budi-001', 'c0000000-0000-0000-0000-000000000001', 'budi.santoso', 'Budi Santoso',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'citizen',
    'Trotoar di Jalan Suryakencana dekat persimpangan Gang Aut pavingnya banyak yang copot dan berlubang. Bahaya untuk lansia yang jalan pagi.',
    'citizen_report', '[{"id":"med-budi-001","type":"image","url":"/images/feed/k002.png","aspectRatio":"4/5"}]'::jsonb,
    'Jl. Suryakencana, Bogor Selatan', 'rep-budi-001', 684, 1420, 86, 42, 31, true, NOW() - INTERVAL '18 hours'
  ),
  (
    'kn-admin-001', 'a0000000-0000-0000-0000-000000000001', 'admin.pupr', 'Administrator Dinas PUPR',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'admin',
    'Rekapitulasi Penanganan Aduan Infrastruktur Pekan III Oktober 2026: 42 titik jalan berlubang telah selesai ditambal cepat oleh Tim Reaksi Cepat PUPR Bogor. Terima kasih warga yang aktif melapor lewat portal TITIK.',
    'official_update', '[{"id":"med-admin-001","type":"image","url":"/images/feed/k004.png","aspectRatio":"4/5"}]'::jsonb,
    'Kota Bogor', NULL, 890, 3410, 145, 230, 88, false, NOW() - INTERVAL '6 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  author_id = EXCLUDED.author_id,
  author_username = EXCLUDED.author_username,
  author_display_name = EXCLUDED.author_display_name,
  author_avatar_url = EXCLUDED.author_avatar_url,
  author_role = EXCLUDED.author_role,
  body = EXCLUDED.body,
  post_type = EXCLUDED.post_type,
  media = EXCLUDED.media,
  location_tag = EXCLUDED.location_tag,
  related_report_id = EXCLUDED.related_report_id,
  support_count = EXCLUDED.support_count,
  likes_count = EXCLUDED.likes_count,
  comments_count = EXCLUDED.comments_count,
  shares_count = EXCLUDED.shares_count,
  saves_count = EXCLUDED.saves_count,
  is_demo = EXCLUDED.is_demo;
`;

const commentsSql = `
-- -----------------------------------------------------------------------------
-- 6. CIVIC DISCUSSION COMMENTS & REPLIES
-- -----------------------------------------------------------------------------
INSERT INTO public.comments (
  id, post_id, author_id, author_name, avatar_url, body, parent_id, likes, is_demo, created_at
) VALUES
  (
    'c-budi-01', 'kn-001', 'c0000000-0000-0000-0000-000000000001', 'Budi Santoso',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'Kemarin malam lewat sini hampir slip ban depan. Hati-hati buat rekan ojol lain pas hujan.',
    NULL, 42, true, NOW() - INTERVAL '90 minutes'
  ),
  (
    'c-admin-reply-01', 'kn-001', 'a0000000-0000-0000-0000-000000000001', 'Administrator Dinas PUPR',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'Terima kasih informasinya Pak Budi dan Mas Mamat. Laporan TIK-2026-000101 telah diverifikasi dan masuk jadwal penambalan darurat regu malam.',
    'c-budi-01', 89, false, NOW() - INTERVAL '45 minutes'
  ),
  (
    'c-dian-01', 'kn-002', 'usr-kn-002', 'Dian Prameswari',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'Kemarin saya temani nenek jalan kaki harus turun ke aspal karena rebar mencuat. Sangat berbahaya.',
    NULL, 28, true, NOW() - INTERVAL '3 hours'
  ),
  (
    'c-mamat-reply-02', 'kn-002', 'usr-kn-001', 'Mamat Saputra',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'Betul mbak Dian, saya narik ojol di Margonda sering lihat pejalan kaki kesandung di titik situ.',
    'c-dian-01', 19, true, NOW() - INTERVAL '2 hours'
  ),
  (
    'c-wardi-01', 'kn-005', 'usr-kn-005', 'Wardi Gunawan',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'Kalau hujan lebat lagi dikhawatirkan ambles sampai bahu jalan utama. Mohon segera dipasang bronjong batu sementara.',
    NULL, 35, true, NOW() - INTERVAL '18 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  body = EXCLUDED.body,
  likes = EXCLUDED.likes;

-- -----------------------------------------------------------------------------
-- 7. REFRESH POSTGREST SCHEMA CACHE
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
`;

const finalSql = [sqlHeader, profilesSql, facilitiesSql, reportsSql, postsSql, commentsSql].join('\n');

const outputPath = path.join(__dirname, '../supabase/SEED_RANDOMIZED_ACCOUNTS_AND_CONTENT.sql');
fs.writeFileSync(outputPath, finalSql, 'utf8');

console.log('✅ Generated supabase/SEED_RANDOMIZED_ACCOUNTS_AND_CONTENT.sql successfully!');
console.log('Size:', (finalSql.length / 1024).toFixed(2), 'KB');
