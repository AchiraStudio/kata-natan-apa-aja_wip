-- =============================================================================
-- TITIK. — Bulk Content Generator: Jabodetabek profiles, reports, posts, comments
-- Run in the Supabase SQL Editor (postgres role). One DO block = all or nothing.
--
-- WHAT IT CREATES (everything flagged is_demo = true, ids prefixed "gen-")
--   profiles          gen-usr-NNN          synthetic citizens (cannot log in: is_demo)
--   reports           rep-gen-<batch>-NNNN with a full status timeline
--                     (reports.events JSON that the UI reads + report_events rows)
--   posts             gen-<batch>-pNNNN    one post per report, plus discussion posts
--                     and (if an admin exists) official_update posts
--   comments          c-gen-<batch>-N      threaded, replies, admin replies on handled reports
--   post_likes / post_saves / report_supports / comment_likes
--                     REAL relation rows, so every counter is true. The like/save/
--                     support RPCs recompute counts from these tables, so stored-only
--                     numbers would snap back to ~1 on the first real tap.
--
-- HOW TO USE
--   1. Edit the c_* values just below. Defaults give ~120 reports, 36 discussions,
--      5 official posts and roughly 600 comments over 45 days.
--   2. Run the whole file. To add more content later, change c_batch ('b2', 'b3'...)
--      and run again; profiles are reused, ids never collide.
--   3. To remove everything this script made, run the CLEANUP block at the bottom.
--
-- NOTES
--   * Content is synthetic. Street names are real so it reads right, but the
--     coordinates are district centroids with ~1 km jitter and are marked
--     isApproximate = true. The report page shows the "[Data Contoh Simulasi]" tag.
--   * The feed query is limit(100), newest first. Anything older than the newest
--     100 posts is only reachable from profiles, report pages and search.
--   * Only 10 sample photos exist in /images/feed, so photos repeat. Set
--     c_image_prob = 0 for text-only, or swap the paths for Storage URLs later.
--   * shares_count stays 0: there is no shares table to back it.
-- =============================================================================

DO $gen$
DECLARE
  -- ---------------------------------------------------------------- CONFIG
  c_batch         TEXT    := 'b1';   -- change for each additional run
  c_profiles      INT     := 80;     -- synthetic citizens (reused across batches)
  c_reports       INT     := 120;    -- reports, each with a linked feed post
  c_discussions   INT     := 36;     -- extra posts with no report
  c_official      INT     := 5;      -- admin official_update posts (needs an admin profile)
  c_days          INT     := 45;     -- spread content over the last N days
  c_max_comments  INT     := 9;      -- top-level comments per post: 0..N, skewed low
  c_engagement    NUMERIC := 1.0;    -- 0 = no likes/saves/supports; 2 = roughly double
  c_image_prob    NUMERIC := 0.8;    -- chance a photo-capable report gets its photo
  c_anon_prob     NUMERIC := 0.06;   -- share of anonymous reports
  c_verified_prob NUMERIC := 0.4;    -- share of verified citizens

  -- ----------------------------------------------------------- REFERENCE DATA
  v_firsts TEXT[] := ARRAY['Budi','Siti','Agus','Dewi','Rina','Andi','Eko','Fitri','Hendra','Indah',
    'Joko','Kartika','Lina','Mulyadi','Nurul','Putri','Rizky','Sari','Tono','Wulan',
    'Yusuf','Dian','Bayu','Citra','Danu','Evi','Fajar','Gita','Hasan','Irfan',
    'Jihan','Kevin','Lestari','Maya','Naufal','Oki','Panji','Rafi','Salsa','Teguh'];
  v_lasts TEXT[] := ARRAY['Santoso','Wijaya','Pratama','Hidayat','Saputra','Kusuma','Nugroho','Rahmawati','Siregar','Hutapea',
    'Simanjuntak','Nasution','Harahap','Purnomo','Setiawan','Gunawan','Susanto','Wibowo','Hartono','Permana',
    'Ramadhan','Firmansyah','Maulana','Halim','Tanjung','Lubis','Sihombing','Siahaan','Batubara','Utomo',
    'Suryadi','Kurniawan','Anggraini','Fauzi','Hakim','Basuki','Budiman','Cahyono','Daulay','Effendi'];
  v_bios TEXT[] := ARRAY[
    'Warga {district}. Suka memantau kondisi jalan dan drainase di sekitar rumah.',
    'Tinggal di {district}, aktif di kerja bakti lingkungan.',
    'Penglaju harian dari {district} ke pusat kota.',
    'Pejalan kaki dan pesepeda dari {district}. Peduli trotoar yang layak.',
    'Ibu rumah tangga di {district}, peduli sekolah dan posyandu.',
    'Pedagang kecil di {district}. Sering terdampak genangan.',
    'Mahasiswa yang tinggal di {district}. Suka mendokumentasikan fasilitas publik.',
    'Pengurus RT di {district}. Menyampaikan aspirasi warga.',
    'Pengemudi ojek online, hafal titik jalan rusak di {district}.',
    'Pegawai swasta di {district}. Ikut memantau kebersihan lingkungan.',
    'Warga {district} yang peduli keselamatan anak di jalan.',
    'Relawan lingkungan di {district}.'];

  -- region|city|province|district|lat|lon|streets(;)
  v_locs TEXT[] := ARRAY[
    'dki|Jakarta Pusat|DKI Jakarta|Tanah Abang|-6.1865|106.8113|Jl. KH Mas Mansyur;Jl. Jatibaru Raya;Jl. Kebon Kacang',
    'dki|Jakarta Pusat|DKI Jakarta|Menteng|-6.1962|106.8348|Jl. Cikini Raya;Jl. Diponegoro;Jl. Teuku Cik Ditiro',
    'dki|Jakarta Pusat|DKI Jakarta|Senen|-6.1790|106.8445|Jl. Kramat Raya;Jl. Senen Raya;Jl. Salemba Raya',
    'dki|Jakarta Pusat|DKI Jakarta|Kemayoran|-6.1650|106.8530|Jl. Benyamin Sueb;Jl. Angkasa',
    'dki|Jakarta Utara|DKI Jakarta|Cilincing|-6.1189|106.9381|Jl. Raya Cilincing;Jl. Cakung Cilincing Raya',
    'dki|Jakarta Utara|DKI Jakarta|Tanjung Priok|-6.1128|106.8803|Jl. Yos Sudarso;Jl. Enggano;Jl. Sulawesi',
    'dki|Jakarta Utara|DKI Jakarta|Kelapa Gading|-6.1584|106.9059|Jl. Boulevard Raya;Jl. Pegangsaan Dua;Jl. Boulevard Barat Raya',
    'dki|Jakarta Utara|DKI Jakarta|Penjaringan|-6.1215|106.7981|Jl. Pluit Raya;Jl. Pluit Selatan Raya;Jl. Muara Karang Raya',
    'dki|Jakarta Utara|DKI Jakarta|Pademangan|-6.1330|106.8350|Jl. Pademangan Raya;Jl. Gunung Sahari',
    'dki|Jakarta Barat|DKI Jakarta|Kebon Jeruk|-6.1900|106.7700|Jl. Panjang;Jl. Kebon Jeruk Raya;Jl. Meruya Ilir Raya',
    'dki|Jakarta Barat|DKI Jakarta|Grogol Petamburan|-6.1670|106.7900|Jl. Letjen S. Parman;Jl. Tomang Raya;Jl. Daan Mogot',
    'dki|Jakarta Barat|DKI Jakarta|Cengkareng|-6.1500|106.7350|Jl. Daan Mogot;Jl. Kamal Raya;Jl. Kapuk Raya',
    'dki|Jakarta Barat|DKI Jakarta|Kalideres|-6.1500|106.7050|Jl. Daan Mogot;Jl. Peta Barat;Jl. Kamal Raya',
    'dki|Jakarta Barat|DKI Jakarta|Tambora|-6.1450|106.8000|Jl. Latumenten;Jl. Tubagus Angke',
    'dki|Jakarta Selatan|DKI Jakarta|Mampang Prapatan|-6.2604|106.8158|Jl. Kemang Raya;Jl. Mampang Prapatan Raya;Jl. Tegal Parang',
    'dki|Jakarta Selatan|DKI Jakarta|Tebet|-6.2260|106.8530|Jl. Prof. Dr. Soepomo;Jl. Tebet Raya;Jl. Dr. Saharjo',
    'dki|Jakarta Selatan|DKI Jakarta|Pasar Minggu|-6.2840|106.8450|Jl. Raya Pasar Minggu;Jl. Raya Ragunan;Jl. Warung Buncit Raya',
    'dki|Jakarta Selatan|DKI Jakarta|Cilandak|-6.2924|106.7938|Jl. Fatmawati Raya;Jl. TB Simatupang;Jl. Cilandak KKO',
    'dki|Jakarta Selatan|DKI Jakarta|Kebayoran Baru|-6.2440|106.7990|Jl. Wolter Monginsidi;Jl. Panglima Polim;Jl. Kyai Maja',
    'dki|Jakarta Selatan|DKI Jakarta|Pesanggrahan|-6.2500|106.7600|Jl. Ciledug Raya;Jl. Swadarma Raya',
    'dki|Jakarta Selatan|DKI Jakarta|Jagakarsa|-6.3300|106.8200|Jl. Moh. Kahfi 1;Jl. Raya Lenteng Agung;Jl. Srengseng Sawah',
    'dki|Jakarta Timur|DKI Jakarta|Jatinegara|-6.2261|106.8568|Jl. Jatinegara Barat;Jl. Jatinegara Timur;Jl. Bekasi Barat Raya',
    'dki|Jakarta Timur|DKI Jakarta|Cakung|-6.1800|106.9400|Jl. Raya Cakung Cilincing;Jl. Penggilingan;Jl. Raya Bekasi',
    'dki|Jakarta Timur|DKI Jakarta|Duren Sawit|-6.2300|106.9000|Jl. Kalimalang;Jl. Raden Inten',
    'dki|Jakarta Timur|DKI Jakarta|Pasar Rebo|-6.3300|106.8700|Jl. Raya Bogor;Jl. Pasar Rebo',
    'dki|Jakarta Timur|DKI Jakarta|Ciracas|-6.3250|106.8800|Jl. Raya Ciracas;Jl. Susukan',
    'dki|Jakarta Timur|DKI Jakarta|Kramat Jati|-6.2800|106.8700|Jl. Raya Condet;Jl. Raya Bogor',
    'kota_bogor|Kota Bogor|Jawa Barat|Bogor Tengah|-6.5971|106.8060|Jl. Suryakencana;Jl. Otto Iskandardinata;Jl. Dewi Sartika;Jl. Jalak Harupat',
    'kota_bogor|Kota Bogor|Jawa Barat|Bogor Utara|-6.5600|106.8200|Jl. Raya Pajajaran;Jl. Ahmad Yani',
    'kota_bogor|Kota Bogor|Jawa Barat|Bogor Selatan|-6.6300|106.8000|Jl. Lawang Gintung;Jl. Batutulis;Jl. Raya Cipaku',
    'kota_bogor|Kota Bogor|Jawa Barat|Bogor Barat|-6.5900|106.7700|Jl. Raya Dramaga;Jl. Sindangbarang;Jl. Semplak',
    'kota_bogor|Kota Bogor|Jawa Barat|Bogor Timur|-6.6000|106.8300|Jl. Raya Tajur;Jl. Raya Pajajaran;Jl. Otista',
    'kota_bogor|Kota Bogor|Jawa Barat|Tanah Sareal|-6.5600|106.7900|Jl. KH Sholeh Iskandar;Jl. Raya Kedung Halang;Jl. Raya Cibadak',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Cibinong|-6.4817|106.8540|Jl. Raya Bogor;Jl. Raya Cibinong;Jl. Tegar Beriman',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Cileungsi|-6.3950|106.9650|Jl. Raya Narogong;Jl. Raya Cileungsi-Jonggol',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Gunung Putri|-6.4400|106.9000|Jl. Raya Wanaherang;Jl. Raya Gunung Putri',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Citeureup|-6.4800|106.8800|Jl. Raya Narogong;Jl. Mayor Oking Jaya Atmaja',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Bojonggede|-6.4930|106.7940|Jl. Raya Bojonggede;Jl. Raya Kemang',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Parung|-6.4250|106.7300|Jl. Raya Parung;Jl. Raya Atang Sanjaya',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Ciawi|-6.6500|106.8500|Jl. Raya Puncak;Jl. Raya Ciawi',
    'kab_bogor|Kabupaten Bogor|Jawa Barat|Cisarua|-6.6900|106.9300|Jl. Raya Puncak;Jl. Raya Cisarua',
    'depok|Kota Depok|Jawa Barat|Beji|-6.3725|106.8327|Jl. Margonda Raya;Jl. Juanda;Jl. Nusantara Raya;Jl. Kalimulya',
    'depok|Kota Depok|Jawa Barat|Pancoran Mas|-6.4025|106.7940|Jl. Dewi Sartika;Jl. Kartini',
    'depok|Kota Depok|Jawa Barat|Cimanggis|-6.3700|106.8700|Jl. Raya Bogor;Jl. Tapos Raya',
    'depok|Kota Depok|Jawa Barat|Sawangan|-6.4200|106.7600|Jl. Raya Sawangan;Jl. Raya Muchtar',
    'depok|Kota Depok|Jawa Barat|Limo|-6.3600|106.7800|Jl. Raya Limo;Jl. Meruyung',
    'depok|Kota Depok|Jawa Barat|Sukmajaya|-6.3800|106.8400|Jl. Merdeka Raya;Jl. Arif Rahman Hakim',
    'depok|Kota Depok|Jawa Barat|Cinere|-6.3300|106.7800|Jl. Cinere Raya;Jl. Gandul Raya',
    'kota_tangerang|Kota Tangerang|Banten|Ciledug|-6.2448|106.7226|Jl. KH Hasyim Ashari;Jl. HOS Cokroaminoto;Jl. Ciledug Raya',
    'kota_tangerang|Kota Tangerang|Banten|Cipondoh|-6.2000|106.6900|Jl. Raya Cipondoh;Jl. KH Hasyim Ashari',
    'kota_tangerang|Kota Tangerang|Banten|Karawaci|-6.2200|106.6100|Jl. Imam Bonjol;Jl. MH Thamrin;Jl. Jend. Sudirman',
    'kota_tangerang|Kota Tangerang|Banten|Batuceper|-6.1700|106.6700|Jl. Daan Mogot;Jl. Raya Batuceper',
    'kota_tangerang|Kota Tangerang|Banten|Tangerang|-6.1783|106.6319|Jl. Jend. Sudirman;Jl. Ki Samaun',
    'tangsel|Kota Tangerang Selatan|Banten|Serpong|-6.3012|106.6542|Jl. Raya Serpong;Jl. Pahlawan Seribu;Jl. Raya Puspiptek',
    'tangsel|Kota Tangerang Selatan|Banten|Pondok Aren|-6.2731|106.7118|Jl. Bintaro Utama;Jl. Jombang Raya;Jl. Raya Pondok Aren',
    'tangsel|Kota Tangerang Selatan|Banten|Ciputat|-6.3100|106.7500|Jl. Ir. H. Juanda;Jl. Cireundeu;Jl. Raya Ciputat',
    'tangsel|Kota Tangerang Selatan|Banten|Pamulang|-6.3400|106.7400|Jl. Raya Pamulang;Jl. Surya Kencana',
    'tangsel|Kota Tangerang Selatan|Banten|Setu|-6.3500|106.6900|Jl. Raya Setu;Jl. Raya Muncul',
    'kab_tangerang|Kabupaten Tangerang|Banten|Cikupa|-6.2200|106.5100|Jl. Raya Serang;Jl. Raya Cikupa',
    'kab_tangerang|Kabupaten Tangerang|Banten|Balaraja|-6.2000|106.4500|Jl. Raya Serang;Jl. Raya Balaraja',
    'kab_tangerang|Kabupaten Tangerang|Banten|Curug|-6.2500|106.5700|Jl. Raya Curug',
    'kab_tangerang|Kabupaten Tangerang|Banten|Kelapa Dua|-6.2200|106.6200|Jl. Boulevard Gading Serpong;Jl. Raya Kelapa Dua',
    'kota_bekasi|Kota Bekasi|Jawa Barat|Bekasi Selatan|-6.2650|106.9800|Jl. Jend. Ahmad Yani;Jl. Raya Pekayon',
    'kota_bekasi|Kota Bekasi|Jawa Barat|Bekasi Barat|-6.2300|106.9560|Jl. KH Noer Ali;Jl. Kalimalang;Jl. Raya Kranji',
    'kota_bekasi|Kota Bekasi|Jawa Barat|Bekasi Utara|-6.2000|106.9900|Jl. Raya Pejuang;Jl. Harapan Indah Boulevard',
    'kota_bekasi|Kota Bekasi|Jawa Barat|Bekasi Timur|-6.2500|107.0200|Jl. Cut Meutia;Jl. Ir. H. Juanda;Jl. Raya Narogong',
    'kota_bekasi|Kota Bekasi|Jawa Barat|Jatiasih|-6.2950|106.9500|Jl. Raya Jatiasih;Jl. Raya Jatiwarna',
    'kab_bekasi|Kabupaten Bekasi|Jawa Barat|Cikarang Utara|-6.2800|107.1500|Jl. Raya Industri;Jl. Raya Lemahabang',
    'kab_bekasi|Kabupaten Bekasi|Jawa Barat|Tambun Selatan|-6.2650|107.0500|Jl. Raya Tambun;Jl. Sultan Hasanuddin',
    'kab_bekasi|Kabupaten Bekasi|Jawa Barat|Cibitung|-6.2400|107.0800|Jl. Raya Cibitung;Jl. Teuku Umar'];

  -- code|category|title|description|post captions (~)|severities (,)|photo|agency kind
  v_issues TEXT[] := ARRAY[
    'pothole|Infrastruktur|Jalan Berlubang Cukup Dalam di {street}|Terdapat beberapa lubang jalan sedalam sekitar 10-15 cm di {street}, {district}. Lubang makin lebar setiap hujan dan membahayakan pengendara motor, terutama malam hari.|Lubang di {street} makin dalem, tadi hampir ada motor kepeleset. Tolong ditambal ya.~Jalan {street} udah kayak kubangan, motor sampai oleng. Kapan diperbaiki?~Awas lubang di {street} {district}! Pas hujan ketutup air, gak keliatan sama sekali.|medium,high,high,critical|k001.png|jalan',
    'sidewalk|Infrastruktur|Trotoar Rusak dan Berlubang di {street}|Paving trotoar di {street}, {district}, banyak yang amblas dan patah, sebagian penutup saluran terbuka. Pejalan kaki, lansia, dan pengguna kursi roda terpaksa turun ke badan jalan.|Trotoar {street} rusak parah, pejalan kaki harus turun ke jalan. Bahaya banget.~Paving trotoar {street} pada copot dan bolong. Lansia sering hampir jatuh di sini.|low,medium,medium,high|k002.png|jalan',
    'pju|Infrastruktur|Lampu Penerangan Jalan Padam di {street}|Lampu PJU di ruas {street}, {district}, padam sepanjang beberapa ratus meter sejak lebih dari seminggu. Jalan gelap dan rawan kecelakaan maupun tindak kriminal.|Lampu jalan {street} mati total, gelap gulita kalau malam. Tolong segera diperbaiki.~Sudah seminggu lebih PJU di {street} padam. Rawan banget buat yang pulang malam.|medium,high,high,critical|k003.png|jalan',
    'cables|Infrastruktur|Kabel Utilitas Menjuntai Rendah di {street}|Kabel listrik dan telekomunikasi menjuntai rendah di {street}, {district}, nyaris menyentuh kendaraan tinggi. Berpotensi menyebabkan kecelakaan dan korsleting saat hujan.|Kabel semrawut menjuntai rendah di {street}, truk dan pickup sering nyangkut. Tolong ditertibkan.~Kabel di {street} {district} turun sampai setinggi kepala pengendara motor. Bahaya!|high,high,critical|k003.png|pln',
    'zebra|Infrastruktur|Marka Zebra Cross Pudar di {street}|Marka penyeberangan pejalan kaki di {street}, {district}, nyaris tidak terlihat. Pengendara jarang berhenti sehingga pejalan kaki, termasuk anak sekolah, kesulitan menyeberang.|Zebra cross di {street} udah hampir hilang catnya. Mobil motor ngebut terus, susah nyeberang.~Mohon marka zebra cross {street} dicat ulang, anak-anak sekolah susah nyeberang di sini.|low,medium,medium,high|k004.png|perhubungan',
    'talud|Infrastruktur|Talud Penahan Tanah Retak dan Ambrol di {street}|Dinding penahan tanah di sisi {street}, {district}, retak dan sebagian ambrol setelah hujan deras. Berisiko longsor susulan ke badan jalan dan permukiman.|Talud di {street} mulai ambrol abis hujan semalaman. Warga sekitar was-was longsor susulan.~Dinding penahan tanah {street} retak makin lebar. Mohon segera ditinjau sebelum hujan lebat lagi.|high,high,critical|k005.png|sda',
    'bridge|Infrastruktur|Jembatan Penyeberangan Orang Rusak di {street}|Lantai dan pagar pengaman jembatan penyeberangan di {street}, {district}, berkarat dan berlubang. Pengguna harus berhati-hati agar tidak terperosok.|JPO di {street} lantainya bolong dan pagarnya karatan. Tolong diperbaiki sebelum ada korban.~Anak tangga JPO {street} patah-patah. Banyak pejalan kaki lebih milih nyeberang di bawah, bahaya juga.|medium,high,high|none|jalan',
    'trafficlight|Infrastruktur|Lampu Lalu Lintas Mati di Persimpangan {street}|Lampu pengatur lalu lintas di persimpangan {street}, {district}, mati sejak beberapa hari. Terjadi kemacetan dan beberapa nyaris tabrakan karena tidak ada petugas yang mengatur.|Lampu merah {street} mati total, perempatan jadi semrawut dan banyak yang nyaris tabrakan.~Traffic light {street} {district} udah 3 hari padam. Macet panjang tiap jam sibuk.|medium,high,high,critical|none|perhubungan',
    'roadcave|Infrastruktur|Badan Jalan Amblas di {street}|Sebagian badan jalan {street}, {district}, amblas dan membentuk cekungan yang makin melebar. Sudah dipasangi tanda seadanya oleh warga.|Jalan {street} amblas dan cekungannya makin luas. Warga cuma pasang ban bekas buat penanda.~Aspal {street} ambles, mobil bisa terperosok. Mohon segera diurug dan diperbaiki.|high,critical,critical|none|jalan',
    'signs|Infrastruktur|Rambu dan Penunjuk Jalan Hilang di {street}|Rambu lalu lintas di {street}, {district}, tumbang atau hilang sehingga pengendara kebingungan, terutama di putaran balik dan persimpangan.|Rambu di {street} tumbang dan belum dipasang lagi. Banyak yang salah arah di putaran balik.~Papan rambu {street} hilang, pengendara dari luar kota sering bingung.|low,medium,medium|none|perhubungan',
    'drainhole|Infrastruktur|Tutup Gorong-gorong Hilang di {street}|Penutup saluran di sisi {street}, {district}, hilang dan menyisakan lubang terbuka yang dalam. Rawan menjerumuskan pejalan kaki dan pengendara sepeda motor.|Tutup got di {street} hilang, lubangnya dalam banget dan gak ada penanda. Tolong ditutup.~Gorong-gorong di {street} terbuka lebar, kemarin hampir ada motor yang kecebur.|high,high,critical|k002.png|sda',
    'busstop|Infrastruktur|Halte dan Fasilitas Penumpang Rusak di {street}|Atap halte di {street}, {district}, bocor dan tempat duduknya patah. Penumpang kehujanan dan kepanasan saat menunggu angkutan.|Halte {street} atapnya bocor, kalau hujan semua penumpang basah kuyup.~Kursi halte di {street} patah dan lampunya mati. Tolong dibenahi.|low,medium,medium|none|perhubungan',
    'flood|Lingkungan|Banjir Luapan Merendam Permukiman Sekitar {street}|Hujan deras mengakibatkan air meluap dan merendam permukiman serta akses jalan di sekitar {street}, {district}, setinggi lutut hingga paha orang dewasa. Warga membutuhkan bantuan pompa dan evakuasi.|Banjir di sekitar {street} sudah setinggi paha, motor pada mogok. Butuh pompa dan bantuan evakuasi.~Air meluap lagi di {street} {district}. Warga lansia perlu dibantu dievakuasi.|high,critical,critical|k006.png|sda',
    'puddle|Lingkungan|Genangan Air Tak Surut di {street}|Setiap hujan sebentar saja {street}, {district}, tergenang hingga setinggi mata kaki dan baru surut berjam-jam kemudian. Saluran drainase diduga tersumbat atau terlalu kecil.|Hujan sebentar doang {street} udah banjir semata kaki. Drainasenya kayaknya mampet.~Genangan di {street} gak surut-surut, macet dan bau. Tolong dicek salurannya.|low,medium,medium,high|k007.png|sda',
    'gateflood|Lingkungan|Genangan Menutup Akses Gerbang Perumahan di {street}|Air setinggi paha menutup akses keluar-masuk perumahan di {street}, {district}. Banyak kendaraan roda dua mogok dan warga kesulitan berangkat kerja.|Gerbang perumahan di {street} terendam, motor pada mogok. Mohon bantuan pompa dari dinas.~Akses keluar kompleks di {street} tertutup banjir. Warga terisolasi sejak subuh.|high,critical|k008.png|sda',
    'trash|Lingkungan|Sampah Menumpuk Menyumbat Aliran Air di {street}|Timbunan sampah plastik dan ranting menumpuk di saluran dan jembatan sekitar {street}, {district}. Aliran air tersumbat dan bau menyengat mulai mengganggu warga.|Sampah numpuk di saluran {street}, air jadi mampet dan baunya nyengat banget.~Tumpukan sampah di dekat {street} {district} gak diangkut-angkut. Tolong dijadwalkan pengangkutan.|medium,medium,high|k009.png|lh',
    'illegaldump|Lingkungan|Tempat Pembuangan Sampah Liar di Pinggir {street}|Warga dan pengendara membuang sampah sembarangan di pinggir {street}, {district}, hingga membentuk tumpukan permanen. Tidak ada tempat sampah resmi maupun petugas yang rutin mengangkut.|Pinggir {street} jadi TPS liar, sampah rumah tangga numpuk sampai ke badan jalan.~Tolong dipasang larangan dan diangkut sampah liar di {street}. Sudah mengganggu pengguna jalan.|medium,medium,high|k009.png|lh',
    'river|Lingkungan|Air Sungai Tercemar dan Berbau di Dekat {street}|Air sungai di dekat {street}, {district}, berubah warna dan berbau menyengat. Warga menduga ada pembuangan limbah ke aliran sungai.|Air kali dekat {street} berubah warna dan bau banget. Curiga ada limbah dibuang malam-malam.~Sungai di sekitar {street} {district} tercemar, ikan-ikan mati. Mohon diselidiki.|medium,high,high|none|lh',
    'tree|Lingkungan|Pohon Tumbang Menutup Jalan di {street}|Pohon besar tumbang ke badan {street}, {district}, setelah hujan disertai angin. Lalu lintas tersendat dan ranting menimpa kabel di sekitarnya.|Pohon tumbang nutup separuh {street}, ranting nimpa kabel. Mohon segera dievakuasi.~Ada pohon rawan tumbang di {street}. Sudah miring banget, tolong dipangkas sebelum ada korban.|medium,high,high|none|lh',
    'pump|Lingkungan|Pompa Pengendali Banjir Tidak Berfungsi di Sekitar {street}|Unit pompa air di sekitar {street}, {district}, dilaporkan mati sehingga air hujan tidak tersedot dan menggenangi permukiman sekitarnya.|Pompa air dekat {street} mati lagi, genangan sampai ke pemukiman. Mohon segera diservis.~Warga {district} khawatir, pompa di dekat {street} gak jalan padahal sering hujan.|high,critical,critical|k010.png|sda',
    'burning|Lingkungan|Pembakaran Sampah Terbuka di Dekat {street}|Warga membakar sampah secara terbuka di dekat {street}, {district}, setiap sore. Asapnya mengganggu pernapasan terutama anak-anak dan lansia.|Tiap sore ada pembakaran sampah di dekat {street}, asapnya masuk rumah. Anak-anak batuk terus.~Mohon ditindak pembakaran sampah di {street} {district}. Asap pekat dan bikin sesak.|low,medium,medium|none|lh',
    'park|Lingkungan|Taman Kota Terbengkalai dan Kotor di {street}|Taman di sekitar {street}, {district}, tidak terawat: rumput meninggi, bangku rusak, dan banyak sampah. Padahal sering dipakai warga untuk olahraga pagi.|Taman di {street} kayak gak keurus, rumput tinggi dan bangkunya rusak. Sayang banget padahal ramai.~Mohon taman {street} dirawat lagi, lampunya mati dan banyak sampah.|low,low,medium|none|lh',
    'sewer|Lingkungan|Saluran Pembuangan Tersumbat dan Berbau di {street}|Saluran air di sepanjang {street}, {district}, tersumbat endapan lumpur dan sampah. Air hitam menggenang dan menimbulkan bau serta nyamuk.|Got di {street} mampet, airnya hitam dan bau, nyamuk di mana-mana.~Saluran di {street} {district} penuh lumpur. Tolong dikeruk sebelum musim hujan.|medium,medium,high|none|sda',
    'schoolroof|Pendidikan|Atap Ruang Kelas Bocor di Sekolah Dekat {street}|Atap beberapa ruang kelas di sekolah dasar dekat {street}, {district}, bocor parah saat hujan sehingga kegiatan belajar terganggu dan lantai licin.|Atap sekolah dekat {street} bocor, murid-murid harus pindah kelas tiap hujan.~Kelas di SD dekat {street} {district} bocor lagi. Tolong diperbaiki sebelum musim hujan puncak.|medium,high,high|none|pendidikan',
    'schoolfence|Pendidikan|Pagar Sekolah Roboh di Dekat {street}|Sebagian pagar sekolah dekat {street}, {district}, roboh dan belum diperbaiki. Siswa berisiko keluar area sekolah tanpa pengawasan.|Pagar sekolah dekat {street} roboh sebagian, anak-anak bisa keluar masuk bebas.~Mohon pagar sekolah di {street} segera diperbaiki, bahaya buat murid-murid kecil.|medium,high|none|pendidikan',
    'schooltoilet|Pendidikan|Toilet Sekolah Rusak dan Tidak Layak di Dekat {street}|Toilet siswa di sekolah dekat {street}, {district}, rusak, pintunya lepas, dan air tidak mengalir. Kondisi ini tidak layak dan berdampak pada kesehatan siswa.|Toilet sekolah dekat {street} rusak, airnya gak ngalir. Anak-anak jadi nahan buang air seharian.~Tolong toilet sekolah di {street} {district} diperbaiki, kondisinya udah gak layak.|medium,high,high|none|pendidikan',
    'schoolcross|Pendidikan|Penyeberangan Depan Sekolah Tanpa Pengaman di {street}|Di depan sekolah di {street}, {district}, tidak ada petugas, rambu zona sekolah, maupun marka yang jelas. Kendaraan melaju kencang saat jam masuk dan pulang.|Depan sekolah di {street} gak ada rambu zona sekolah. Mobil motor ngebut pas jam pulang.~Mohon dipasang rambu dan marka zona selamat sekolah di {street}. Banyak anak hampir keserempet.|medium,high,high|k004.png|perhubungan',
    'schoolchairs|Pendidikan|Meja dan Kursi Siswa Rusak di Sekolah Dekat {street}|Banyak meja dan kursi di sekolah dekat {street}, {district}, patah dan membahayakan siswa. Beberapa kelas terpaksa duduk di lantai.|Meja kursi di sekolah dekat {street} banyak yang patah, ada yang duduk di lantai.~Sekolah dekat {street} {district} butuh penggantian meja kursi, kondisinya memprihatinkan.|low,medium,medium|none|pendidikan',
    'puskesmasqueue|Kesehatan|Antrean Puskesmas Mengular dan Loket Terbatas di {district}|Antrean pendaftaran di puskesmas {district} sangat panjang karena loket yang buka terbatas. Pasien lansia dan ibu hamil harus menunggu berjam-jam.|Antre di puskesmas {district} dari subuh, loketnya cuma satu yang buka. Lansia kasihan banget.~Mohon puskesmas {district} nambah loket pendaftaran, antrean udah gak manusiawi.|low,medium,medium|none|kesehatan',
    'fogging|Kesehatan|Kasus DBD Meningkat, Warga Minta Fogging di Sekitar {street}|Beberapa warga di sekitar {street}, {district}, terkena demam berdarah dalam dua pekan terakhir. Lingkungan banyak genangan dan belum ada fogging maupun penyuluhan.|Udah beberapa tetangga kena DBD di sekitar {street}. Mohon dilakukan fogging dan pemeriksaan jentik.~Warga {district} khawatir DBD makin nyebar, belum ada fogging di {street}.|medium,high,high|none|kesehatan',
    'cleanwater|Kesehatan|Air PAM Keruh dan Berbau di Sekitar {street}|Air dari saluran PDAM di sekitar {street}, {district}, keruh dan berbau selama berhari-hari. Warga takut memakainya untuk memasak dan minum.|Air PAM di {street} keruh dan bau udah 4 hari. Warga terpaksa beli air galon.~Aliran air di {street} {district} berwarna kecoklatan. Mohon dicek kualitasnya.|medium,high,high|none|air',
    'posyandu|Kesehatan|Posyandu Tidak Punya Tempat Layak di Dekat {street}|Kegiatan posyandu di dekat {street}, {district}, masih menumpang di teras rumah warga karena tidak ada balai yang layak. Saat hujan kegiatan terpaksa dibatalkan.|Posyandu di dekat {street} masih numpang di teras rumah warga, kalau hujan bubar.~Mohon dibangunkan balai posyandu di {street} {district}, ibu-ibu dan balita kehujanan terus.|low,medium|none|kesehatan',
    'parking|Lainnya|Parkir Liar Menutup Badan Jalan di {street}|Kendaraan parkir sembarangan di sisi {street}, {district}, mempersempit badan jalan dan memicu kemacetan, terutama jam berangkat dan pulang kerja.|Parkir liar di {street} nutup separuh jalan, macet tiap sore. Tolong ditertibkan.~Mobil parkir berjejer di {street} {district}, angkot dan ambulans susah lewat.|low,medium,medium|none|perhubungan',
    'vendors|Lainnya|Pedagang Kaki Lima Menutup Trotoar di {street}|Trotoar di {street}, {district}, penuh lapak sehingga pejalan kaki terpaksa berjalan di badan jalan. Perlu penataan agar pedagang dan pejalan kaki sama-sama terakomodasi.|Trotoar {street} penuh lapak, pejalan kaki turun ke jalan. Mohon ditata, jangan cuma digusur.~Mohon ada relokasi atau penataan PKL di {street} {district} supaya trotoar bisa dipakai pejalan kaki.|low,low,medium|none|satpol',
    'cablemess|Lainnya|Kabel Fiber Optik Semrawut di Sepanjang {street}|Kabel udara fiber optik di {street}, {district}, saling silang dan menjuntai di atas tiang. Menimbulkan risiko dan merusak pemandangan jalan.|Kabel fiber di {street} semrawut kayak benang kusut, ada yang nyentuh jalan.~Mohon operator ditertibkan, kabel di {street} {district} berantakan banget.|low,medium,medium|none|kominfo',
    'disabled|Lainnya|Fasilitas Difabel Tidak Berfungsi di {street}|Jalur pemandu dan ramp untuk difabel di {street}, {district}, rusak atau terhalang tiang dan lapak. Pengguna kursi roda dan tunanetra kesulitan melintas.|Jalur difabel di {street} putus-putus dan terhalang tiang. Pengguna kursi roda terpaksa ke jalan.~Ramp di {street} {district} terlalu curam dan rusak. Tolong disesuaikan standar aksesibilitas.|low,medium,medium|none|jalan',
    'playground|Lainnya|Taman Bermain Anak Rusak di Dekat {street}|Ayunan dan perosotan di taman bermain dekat {street}, {district}, berkarat dan patah. Berbahaya bagi anak-anak yang bermain di sana.|Perosotan di taman dekat {street} karatan dan patah. Anak-anak masih main di situ.~Mohon taman bermain di {street} {district} diperbaiki, banyak besi tajam menonjol.|low,medium,medium|none|lh'];

  -- discussion posts (no report); placeholders {district} {city}
  v_discuss TEXT[] := ARRAY[
    'Tanya warga {district}: ada yang tahu jam operasional puskesmas keliling minggu ini?',
    'Terima kasih petugas kebersihan di {district} yang pagi ini mengangkut sampah lebih awal. Semoga konsisten ya.',
    'Salut sama warga {district} yang gotong royong bersihin saluran air hari Minggu kemarin. Hasilnya langsung terasa pas hujan.',
    'Ada yang tahu cara cek status laporan di TITIK? Baru pertama kali lapor soal fasilitas umum di {district}.',
    'Ada yang tahu rute alternatif dari {district} ke pusat kota yang gak macet pas jam berangkat kerja?',
    'Menurut warga {district}, lebih efektif mana: lapor lewat TITIK atau langsung ke kelurahan? Pengalaman kalian gimana?',
    'Ayo bikin kerja bakti bersih lingkungan di {district} akhir pekan ini. Siapa yang mau ikut?',
    'Tips buat yang rumahnya di area rawan genangan di {district}: cek saluran depan rumah sebelum musim hujan, jangan tunggu air naik.',
    'Anggaran perbaikan jalan di {city} tahun ini bisa dilihat di mana ya? Penasaran soal transparansinya.',
    'Pejalan kaki di {district}, kalian merasa trotoar di sekitar sini sudah ramah difabel dan lansia belum?',
    'Kalau lampu jalan mati di {district}, lapor ke mana yang paling cepat direspons?',
    'Ngobrol sama tetangga di {district}, ternyata banyak yang belum tahu ada fitur dukung laporan di TITIK. Share ya biar laporan penting cepat naik.',
    'Transportasi umum dari {district}: halte dan angkot masih kurang nyaman buat dipakai tiap hari. Kalian setuju?',
    'Terima kasih untuk petugas yang sigap menangani aduan warga {district}. Sesekali perlu diapresiasi juga.',
    'Musim hujan sudah dekat. Yuk cek kondisi talud, got, dan pohon besar di lingkungan {district} masing-masing, laporkan kalau ada yang berisiko.',
    'Ada rekomendasi komunitas peduli lingkungan di {city}? Pengen ikut gabung.'];

  -- official posts from the admin account: generic how-to guidance, no invented statistics
  v_official TEXT[] := ARRAY[
    'Pengingat musim hujan: warga dapat melaporkan saluran tersumbat, pohon rawan tumbang, dan talud retak lewat TITIK lengkap dengan foto dan lokasi.',
    'Agar laporan lebih cepat diverifikasi, sertakan foto yang jelas, lokasi yang spesifik, dan uraian singkat tentang dampaknya bagi warga.',
    'Laporan berstatus Perlu Info menunggu keterangan tambahan dari pelapor. Mohon cek riwayat laporan Anda dan lengkapi datanya.',
    'Setiap laporan diverifikasi sebelum diteruskan ke instansi terkait. Laporan dengan bukti yang jelas biasanya diproses lebih cepat.',
    'Gunakan tombol Dukung pada laporan yang juga Anda alami agar instansi melihat seberapa luas dampaknya.',
    'Data kontak pelapor tidak ditampilkan ke publik. Anda juga dapat melapor secara anonim.'];

  -- comment building blocks
  v_op_infra TEXT[] := ARRAY[
    'Setiap hari lewat sini, kondisinya makin parah.',
    'Kemarin hampir jatuh di titik ini.',
    'Warga {district} sudah lama mengeluhkan hal ini.',
    'Bahaya banget terutama kalau malam atau pas hujan.',
    'Saya juga sering lewat sini tiap pagi, memang seperti di foto.',
    'Tolong dikasih penanda sementara dulu kalau perbaikan butuh waktu.',
    'Semoga bukan cuma ditambal sementara, perlu perbaikan permanen.',
    'Titik ini rawan bikin pengendara motor jatuh.'];
  v_op_env TEXT[] := ARRAY[
    'Kalau hujan lebat pasti kejadian lagi di sini.',
    'Warga sudah sering kerja bakti, tapi tanpa dukungan dinas tetap kewalahan.',
    'Bau dan nyamuknya mengganggu banget, apalagi buat yang punya balita.',
    'Saya tinggal dekat sini, kondisinya memang seperti di foto.',
    'Perlu penanganan dari hulunya, bukan cuma dibersihkan sesaat.',
    'Warga {district} butuh solusi jangka panjang untuk masalah ini.',
    'Perlu edukasi warga juga supaya tidak buang sampah sembarangan.'];
  v_op_edu TEXT[] := ARRAY[
    'Kasihan anak-anak belajar dalam kondisi seperti ini.',
    'Sebagai orang tua murid, saya ikut merasakan dampaknya.',
    'Keselamatan siswa harus nomor satu.',
    'Anak-anak di {district} layak dapat ruang belajar yang aman.',
    'Sudah disampaikan ke pihak sekolah, tapi butuh dukungan dinas.',
    'Warga {district} peduli sama sekolah di lingkungan kita.'];
  v_op_health TEXT[] := ARRAY[
    'Pelayanan kesehatan dasar itu hak semua warga.',
    'Sebagai warga {district}, saya mengalami hal yang sama.',
    'Kasihan lansia dan ibu hamil kalau kondisinya begini terus.',
    'Banyak warga yang diam saja, terima kasih sudah berani melapor.',
    'Fasilitas kesehatan harusnya jadi yang paling dirawat di lingkungan kita.',
    'Warga {district} butuh layanan yang lebih ramah dan cepat.'];
  v_op_other TEXT[] := ARRAY[
    'Setuju, perlu penataan yang adil buat semua pihak.',
    'Kondisi ini sudah lama dan mengganggu banyak orang.',
    'Saya juga sering terganggu di titik ini.',
    'Semoga ada solusi, bukan cuma penertiban sesaat.',
    'Warga {district} berharap ada aturan yang jelas dan konsisten.',
    'Ini bukan cuma soal estetika, tapi soal keselamatan juga.'];
  v_op_discuss TEXT[] := ARRAY[
    'Setuju, menurut saya juga begitu.',
    'Pengalaman saya serupa di {district}, semoga makin baik ke depannya.',
    'Terima kasih sudah berbagi info, bermanfaat.',
    'Boleh ikut kalau jadwalnya cocok, kabari ya.',
    'Coba tanya ke pengurus RT atau kelurahan setempat dulu, biasanya cepat dijawab.',
    'Saya biasanya lapor lewat TITIK dan simpan nomor referensinya untuk dipantau.',
    'Ide bagus, perlu lebih banyak warga yang terlibat.',
    'Cek menu laporan saya untuk melihat status laporan kamu.',
    'Mantap, semoga jadi kebiasaan baik warga sekitar.'];
  v_closers TEXT[] := ARRAY[
    'Semoga segera ditindaklanjuti.',
    'Mohon diprioritaskan ya.',
    'Terima kasih sudah melapor.',
    'Ditunggu kabar baiknya.',
    'Tolong dipantau terus sampai tuntas.',
    'Dukung laporan ini!',
    'Kalau perlu kami warga siap bantu.',
    'Semoga dinas terkait cepat merespons.',
    'Mohon ada update kalau sudah ditangani.'];
  v_replies TEXT[] := ARRAY[
    'Betul banget, saya juga lihat sendiri kemarin.',
    'Setuju, semoga cepat ditindaklanjuti.',
    'Terima kasih infonya, jadi lebih waspada.',
    'Ikut mendukung. Ada update terbaru dari lokasi?',
    'Bisa ditambah foto dari sudut lain supaya verifikasinya lebih cepat.',
    'Nanti saya coba cek lagi ke lokasi dan kabari di sini.',
    'Semoga laporan ini cepat naik statusnya.',
    'Sama, saya juga mengalaminya.',
    'Makasih sudah menambahkan, makin jelas kondisinya.',
    'Coba pantau lewat menu laporan, statusnya bisa berubah sewaktu-waktu.',
    'Saya lewat situ tadi pagi, kondisinya masih sama.',
    'Kalau ada yang tahu nama ketua RT sekitar situ, mungkin bisa ikut disampaikan.',
    'Terima kasih sudah mengingatkan, besok saya ajak tetangga ikut mendukung.',
    'Mudah-mudahan kali ini beneran ditindak, bukan cuma dicatat.',
    'Fotonya jelas, jadi gampang dipahami petugas.',
    'Warga sekitar sini juga merasakan hal yang sama.',
    'Ikut nimbrung, titik ini memang perlu perhatian.',
    'Coba tambahkan patokan lokasi terdekat biar petugas gampang menemukan.',
    'Saya sudah dukung laporannya, semoga makin banyak yang ikut.',
    'Pantau terus ya, nanti kita kabari kalau ada perkembangan.'];
  v_resolved TEXT[] := ARRAY[
    'Alhamdulillah sudah ditangani, terima kasih semua yang ikut mendukung.',
    'Sudah dicek ke lokasi, perbaikannya sudah selesai. Terima kasih petugas.',
    'Akhirnya ditangani juga, kerja bagus!',
    'Sudah beres di lapangan, makasih TITIK.',
    'Terima kasih tindak lanjutnya. Semoga hasilnya awet.'];

  -- status lifecycle and a weighted bag to draw the current status from
  v_life TEXT[] := ARRAY['submitted','under_review','accepted_for_routing','forwarded_to_institution','institution_responded','resolved'];
  v_status_bag TEXT[] := ARRAY['submitted','submitted','submitted',
    'under_review','under_review','under_review','under_review',
    'needs_info','accepted_for_routing','accepted_for_routing',
    'forwarded_to_institution','forwarded_to_institution','forwarded_to_institution','forwarded_to_institution',
    'institution_responded','institution_responded',
    'resolved','resolved','resolved','rejected'];

  -- ------------------------------------------------------------- WORKING VARS
  v_missing TEXT;
  v_users TEXT[];
  v_n_users INT;
  v_admin_id TEXT;
  v_admin_name TEXT;
  v_admin_username TEXT;
  v_loc TEXT[];
  v_tpl TEXT[];
  v_streets TEXT[];
  v_bodies TEXT[];
  v_sevs TEXT[];
  v_path TEXT[];
  v_pool TEXT[];
  v_street TEXT;
  v_admin_label TEXT;
  v_agency TEXT;
  v_status TEXT;
  v_sev TEXT;
  v_title TEXT;
  v_desc TEXT;
  v_body TEXT;
  v_text TEXT;
  v_district TEXT;
  v_city TEXT;
  v_loc_tag TEXT;
  v_uid TEXT;
  v_uname TEXT;
  v_dname TEXT;
  v_verified BOOLEAN;
  v_anon BOOLEAN;
  v_rep_id TEXT;
  v_post_id TEXT;
  v_ref TEXT;
  v_has_img BOOLEAN;
  v_media_urls JSONB;
  v_post_media JSONB;
  v_events JSONB;
  v_first TEXT;
  v_last TEXT;
  v_n INT;
  v_pn INT := 0;
  v_cn INT := 0;
  v_age DOUBLE PRECISION;
  v_created TIMESTAMPTZ;
  v_ev_time TIMESTAMPTZ;
  v_last_ev_time TIMESTAMPTZ;
  v_gap INTERVAL;
  v_ncom INT;
  v_nrep INT;
  v_tid TEXT;
  v_ttime TIMESTAMPTZ;
  v_rtime TIMESTAMPTZ;
  v_first_top TEXT;
  v_first_top_time TIMESTAMPTZ;
  v_loc_dist TEXT;
  v_official_resp TEXT;
  v_ev_desc TEXT;
  v_cnt_profiles INT;
  v_cnt_posts INT;
  v_cnt_reports INT;
  v_cnt_comments INT;
  i INT;
  j INT;
  s INT;
  rec RECORD;
BEGIN
  -- ------------------------------------------------------------- PREFLIGHT
  SELECT string_agg(t.tbl || '.' || t.col, ', ') INTO v_missing
  FROM (VALUES
    ('profiles','is_demo'), ('posts','is_demo'), ('reports','is_demo'), ('comments','is_demo'),
    ('comments','author_id'), ('reports','events'), ('reports','evidence_verification_status'),
    ('reports','official_response'), ('reports','last_reviewed_by'), ('reports','last_reviewed_at')
  ) AS t(tbl, col)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns ic
    WHERE ic.table_schema = 'public' AND ic.table_name = t.tbl AND ic.column_name = t.col
  );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Kolom belum ada: %. Terapkan migrasi security_hardening dan canonical_verification dulu.', v_missing;
  END IF;

  SELECT string_agg(t.tbl, ', ') INTO v_missing
  FROM (VALUES ('post_likes'), ('post_saves'), ('report_supports'), ('comment_likes'), ('report_events')) AS t(tbl)
  WHERE to_regclass('public.' || t.tbl) IS NULL;
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Tabel belum ada: %. Terapkan migrasi dulu.', v_missing;
  END IF;

  CREATE SEQUENCE IF NOT EXISTS public.report_public_ref_seq START WITH 101;

  SELECT id, display_name, username INTO v_admin_id, v_admin_name, v_admin_username
  FROM public.profiles
  WHERE role = 'admin' AND COALESCE(is_demo, false) = false
  ORDER BY created_at
  LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Tidak ada profil admin: balasan resmi, event petugas, dan post resmi dilewati.';
  END IF;

  -- ------------------------------------------------------------- 1. PROFILES
  FOR i IN 1..c_profiles LOOP
    v_first := v_firsts[1 + ((i - 1) % cardinality(v_firsts))];
    v_last  := v_lasts[1 + (((i - 1) * 7 + (i - 1) / cardinality(v_firsts)) % cardinality(v_lasts))];
    v_loc   := string_to_array(v_locs[1 + floor(random() * cardinality(v_locs))::int], '|');
    v_uname := CASE i % 4
      WHEN 0 THEN lower(v_first) || '.' || lower(v_last) || lpad(i::text, 2, '0')
      WHEN 1 THEN lower(v_first) || '_' || lower(v_last) || lpad(i::text, 2, '0')
      WHEN 2 THEN lower(v_last) || lower(v_first) || i::text
      ELSE lower(v_first) || '.' || substr(lower(v_last), 1, 3) || (i * 3 + 10)::text
    END;
    INSERT INTO public.profiles (id, username, display_name, email, avatar_url, role, district, is_verified, bio, is_demo, created_at)
    VALUES (
      'gen-usr-' || lpad(i::text, 3, '0'), v_uname, v_first || ' ' || v_last, NULL, NULL, 'citizen',
      v_loc[4], random() < c_verified_prob,
      replace(v_bios[1 + floor(random() * cardinality(v_bios))::int], '{district}', v_loc[4]),
      true, now() - random() * interval '120 days'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  SELECT array_agg(id ORDER BY id) INTO v_users FROM public.profiles WHERE id LIKE 'gen-usr-%';
  v_n_users := COALESCE(cardinality(v_users), 0);
  IF v_n_users = 0 THEN
    RAISE EXCEPTION 'Tidak ada profil gen-usr-%% yang bisa dipakai. Naikkan c_profiles.';
  END IF;

  -- ------------------------------------------------------------- 2. REPORTS + LINKED POSTS
  FOR i IN 1..c_reports LOOP
    v_loc    := string_to_array(v_locs[1 + floor(random() * cardinality(v_locs))::int], '|');
    v_tpl    := string_to_array(v_issues[1 + floor(random() * cardinality(v_issues))::int], '|');
    v_streets := string_to_array(v_loc[7], ';');
    v_street := v_streets[1 + floor(random() * cardinality(v_streets))::int];
    v_district := v_loc[4];
    v_city := v_loc[2];
    v_loc_tag := v_district || ', ' || v_city;

    v_admin_label := CASE v_loc[1]
      WHEN 'dki' THEN 'Provinsi DKI Jakarta'  WHEN 'kota_bogor' THEN 'Kota Bogor'
      WHEN 'kab_bogor' THEN 'Kabupaten Bogor' WHEN 'depok' THEN 'Kota Depok'
      WHEN 'kota_tangerang' THEN 'Kota Tangerang' WHEN 'tangsel' THEN 'Kota Tangerang Selatan'
      WHEN 'kab_tangerang' THEN 'Kabupaten Tangerang' WHEN 'kota_bekasi' THEN 'Kota Bekasi'
      ELSE 'Kabupaten Bekasi' END;
    v_agency := CASE v_tpl[8]
      WHEN 'jalan' THEN CASE WHEN v_loc[1] = 'dki' THEN 'Dinas Bina Marga Provinsi DKI Jakarta'
                             ELSE 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) ' || v_admin_label END
      WHEN 'sda' THEN CASE WHEN v_loc[1] = 'dki' THEN 'Dinas Sumber Daya Air Provinsi DKI Jakarta'
                           ELSE 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) ' || v_admin_label END
      WHEN 'lh' THEN 'Dinas Lingkungan Hidup ' || v_admin_label
      WHEN 'pendidikan' THEN 'Dinas Pendidikan ' || v_admin_label
      WHEN 'kesehatan' THEN 'Dinas Kesehatan ' || v_admin_label
      WHEN 'perhubungan' THEN 'Dinas Perhubungan ' || v_admin_label
      WHEN 'satpol' THEN 'Satuan Polisi Pamong Praja ' || v_admin_label
      WHEN 'kominfo' THEN 'Dinas Komunikasi dan Informatika ' || v_admin_label
      WHEN 'pln' THEN 'PT PLN (Persero) UP3 setempat'
      WHEN 'air' THEN 'Perusahaan Daerah Air Minum (PDAM) setempat'
      ELSE 'Pemerintah ' || v_admin_label END;

    v_sevs := string_to_array(v_tpl[6], ',');
    v_sev := v_sevs[1 + floor(random() * cardinality(v_sevs))::int];
    v_status := v_status_bag[1 + floor(random() * cardinality(v_status_bag))::int];

    v_title := replace(v_tpl[3], '{street}', v_street);
    v_desc  := replace(replace(replace(v_tpl[4], '{street}', v_street), '{district}', v_district), '{city}', v_city);
    v_bodies := string_to_array(v_tpl[5], '~');
    v_body := replace(replace(replace(v_bodies[1 + floor(random() * cardinality(v_bodies))::int],
                '{street}', v_street), '{district}', v_district), '{city}', v_city);

    -- reporter
    v_anon := random() < c_anon_prob;
    IF v_anon THEN
      v_uid := NULL; v_uname := 'anonim'; v_dname := 'Warga Anonim'; v_verified := false;
    ELSE
      v_uid := v_users[1 + floor(random() * v_n_users)::int];
      SELECT username, display_name, COALESCE(is_verified, false) INTO v_uname, v_dname, v_verified
      FROM public.profiles WHERE id = v_uid;
    END IF;

    -- photo (only some templates have a matching sample photo)
    v_has_img := v_tpl[7] <> 'none' AND random() < c_image_prob;
    v_media_urls := CASE WHEN v_has_img THEN jsonb_build_array('/images/feed/' || v_tpl[7]) ELSE '[]'::jsonb END;

    v_rep_id  := 'rep-gen-' || c_batch || '-' || lpad(i::text, 4, '0');
    v_pn := v_pn + 1;
    v_post_id := 'gen-' || c_batch || '-p' || lpad(v_pn::text, 4, '0');
    v_post_media := CASE WHEN v_has_img THEN jsonb_build_array(jsonb_build_object(
        'id', 'm-' || v_post_id, 'type', 'image', 'url', '/images/feed/' || v_tpl[7], 'aspectRatio', '4/5'))
      ELSE '[]'::jsonb END;
    v_ref := 'TIK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.report_public_ref_seq')::text, 6, '0');

    -- timeline: recent-skewed creation time; later steps spread over the time since
    v_age := power(random(), 1.6) * c_days + 0.05;
    v_created := now() - v_age * interval '1 day';
    IF v_status = 'needs_info' THEN v_path := ARRAY['submitted','under_review','needs_info'];
    ELSIF v_status = 'rejected' THEN v_path := ARRAY['submitted','under_review','rejected'];
    ELSE v_path := v_life[1:array_position(v_life, v_status)];
    END IF;
    v_gap := (now() - v_created) * 0.85::float8 / GREATEST(cardinality(v_path), 1);

    v_events := '[]'::jsonb;
    v_last_ev_time := v_created;
    FOR s IN 1..cardinality(v_path) LOOP
      v_ev_time := v_created + v_gap * (s - 1);
      v_last_ev_time := v_ev_time;
      v_ev_desc := CASE v_path[s]
        WHEN 'submitted' THEN 'Laporan warga tercatat di sistem TITIK.'
        WHEN 'under_review' THEN 'Laporan sedang ditinjau dan diverifikasi oleh petugas.'
        WHEN 'needs_info' THEN 'Petugas meminta keterangan tambahan dari pelapor.'
        WHEN 'accepted_for_routing' THEN 'Laporan diterima dan disiapkan untuk diteruskan ke instansi.'
        WHEN 'forwarded_to_institution' THEN 'Laporan diteruskan ke ' || v_agency || '.'
        WHEN 'institution_responded' THEN 'Instansi memberikan tanggapan atas laporan.'
        WHEN 'resolved' THEN 'Laporan dinyatakan selesai ditangani.'
        ELSE 'Laporan belum dapat diproses karena bukti belum memadai.' END;
      v_events := v_events || jsonb_build_array(jsonb_build_object(
        'id', v_rep_id || '-ev' || s,
        'reportId', v_rep_id,
        'eventType', upper(v_path[s]),
        'previousStatus', CASE WHEN s > 1 THEN v_path[s - 1] END,
        'newStatus', v_path[s],
        'actorType', CASE WHEN s = 1 THEN 'citizen' ELSE 'agency_officer' END,
        'actorName', CASE WHEN s = 1 THEN v_dname ELSE COALESCE(v_admin_name, 'Petugas TITIK') END,
        'description', v_ev_desc,
        'isInternal', false,
        'timestamp', to_char(v_ev_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ));
    END LOOP;

    v_official_resp := CASE v_status
      WHEN 'institution_responded' THEN 'Laporan diterima instansi terkait dan dijadwalkan untuk ditangani.'
      WHEN 'resolved' THEN 'Penanganan di lokasi telah selesai dilakukan.'
      WHEN 'needs_info' THEN 'Mohon lengkapi foto dan keterangan lokasi pada laporan ini.'
      WHEN 'rejected' THEN 'Laporan belum dapat diproses karena bukti dan informasi belum memadai.'
      ELSE NULL END;

    INSERT INTO public.reports (
      id, public_reference, reporter_user_id, title, description, category, severity, status,
      publication_status, location, responsible_agency, media_urls, supporting_documents,
      reporter_type, reporter_display_name, support_count, budget_context, events,
      evidence_verification_status, official_response, last_reviewed_by, last_reviewed_at,
      is_demo, created_at, updated_at
    ) VALUES (
      v_rep_id, v_ref, v_uid, v_title, v_desc, v_tpl[2], v_sev, v_status,
      'published',
      jsonb_build_object(
        'latitude', round(v_loc[5]::numeric + ((random() - 0.5) * 0.016)::numeric, 6),
        'longitude', round(v_loc[6]::numeric + ((random() - 0.5) * 0.016)::numeric, 6),
        'address', v_street || ' No. ' || (1 + floor(random() * 240))::int || ', ' || v_district,
        'district', v_district, 'city', v_city, 'province', v_loc[3], 'isApproximate', true),
      v_agency, v_media_urls, '[]'::jsonb,
      CASE WHEN v_anon THEN 'anonymous' WHEN v_verified THEN 'verified_citizen' ELSE 'registered_citizen' END,
      v_dname, 0, '{}'::jsonb, v_events,
      CASE WHEN v_status = 'rejected' THEN 'rejected'
           WHEN v_status IN ('submitted','under_review','needs_info') THEN 'unverified'
           ELSE 'verified' END,
      v_official_resp,
      CASE WHEN v_status <> 'submitted' THEN v_admin_id END,
      CASE WHEN v_status <> 'submitted' AND v_admin_id IS NOT NULL THEN v_last_ev_time END,
      true, v_created, v_last_ev_time
    );

    -- same audit rows the RPCs write (the UI timeline reads reports.events above)
    FOR s IN 1..cardinality(v_path) LOOP
      INSERT INTO public.report_events (report_id, event_type, actor_id, actor_name, previous_status, new_status, notes, is_internal, created_at)
      VALUES (
        v_rep_id, 'status_change',
        CASE WHEN s = 1 THEN COALESCE(v_uid, 'anon') ELSE COALESCE(v_admin_id, 'system') END,
        CASE WHEN s = 1 THEN v_dname ELSE COALESCE(v_admin_name, 'Petugas TITIK') END,
        CASE WHEN s > 1 THEN v_path[s - 1] END, v_path[s],
        v_events -> (s - 1) ->> 'description', false,
        v_created + v_gap * (s - 1)
      );
    END LOOP;

    -- demo reports get an unmatchable follow-up hash, so nobody can claim them by token
    IF to_regclass('public.report_private_data') IS NOT NULL THEN
      INSERT INTO public.report_private_data (report_id, secret_follow_up_token_hash, reporter_user_id, supporting_documents)
      VALUES (v_rep_id, 'demo-no-follow-up-' || md5(random()::text), v_uid, '[]'::jsonb);
    END IF;

    INSERT INTO public.posts (
      id, author_id, author_username, author_display_name, author_avatar_url, author_role,
      body, post_type, media, location_tag, related_report_id,
      support_count, likes_count, saves_count, comments_count, shares_count, is_demo, created_at, updated_at
    ) VALUES (
      v_post_id, v_uid, v_uname, v_dname, '', 'citizen',
      v_body, 'citizen_report', v_post_media, v_loc_tag, v_rep_id,
      0, 0, 0, 0, 0, true, v_created + random() * interval '10 minutes', v_created + random() * interval '10 minutes'
    );
  END LOOP;

  -- ------------------------------------------------------------- 3. DISCUSSION POSTS
  FOR i IN 1..c_discussions LOOP
    v_loc := string_to_array(v_locs[1 + floor(random() * cardinality(v_locs))::int], '|');
    v_uid := v_users[1 + floor(random() * v_n_users)::int];
    SELECT username, display_name INTO v_uname, v_dname FROM public.profiles WHERE id = v_uid;
    v_text := replace(replace(v_discuss[1 + floor(random() * cardinality(v_discuss))::int],
                '{district}', v_loc[4]), '{city}', v_loc[2]);
    v_pn := v_pn + 1;
    v_post_id := 'gen-' || c_batch || '-p' || lpad(v_pn::text, 4, '0');
    v_created := now() - (power(random(), 1.6) * c_days + 0.02) * interval '1 day';
    INSERT INTO public.posts (
      id, author_id, author_username, author_display_name, author_avatar_url, author_role,
      body, post_type, media, location_tag, related_report_id,
      support_count, likes_count, saves_count, comments_count, shares_count, is_demo, created_at, updated_at
    ) VALUES (
      v_post_id, v_uid, v_uname, v_dname, '', 'citizen',
      v_text, 'community_discussion', '[]'::jsonb, v_loc[4] || ', ' || v_loc[2], NULL,
      0, 0, 0, 0, 0, true, v_created, v_created
    );
  END LOOP;

  -- ------------------------------------------------------------- 4. OFFICIAL POSTS (admin)
  IF v_admin_id IS NOT NULL THEN
    FOR i IN 1..c_official LOOP
      v_pn := v_pn + 1;
      v_post_id := 'gen-' || c_batch || '-p' || lpad(v_pn::text, 4, '0');
      v_created := now() - (power(random(), 1.3) * c_days + 0.02) * interval '1 day';
      INSERT INTO public.posts (
        id, author_id, author_username, author_display_name, author_avatar_url, author_role,
        body, post_type, media, location_tag, related_report_id,
        support_count, likes_count, saves_count, comments_count, shares_count, is_demo, created_at, updated_at
      ) VALUES (
        v_post_id, v_admin_id, COALESCE(v_admin_username, 'admin'), COALESCE(v_admin_name, 'Administrator TITIK'), '', 'admin',
        v_official[1 + ((i - 1) % cardinality(v_official))], 'official_update', '[]'::jsonb, 'Jabodetabek', NULL,
        0, 0, 0, 0, 0, true, v_created, v_created
      );
    END LOOP;
  END IF;

  -- ------------------------------------------------------------- 5. COMMENTS (this batch's posts)
  FOR rec IN
    SELECT p.id, p.created_at, p.post_type, p.location_tag,
           r.category, r.status, r.public_reference, r.responsible_agency
    FROM public.posts p
    LEFT JOIN public.reports r ON r.id = p.related_report_id
    WHERE p.id LIKE 'gen-' || c_batch || '-%'
  LOOP
    v_loc_dist := split_part(rec.location_tag, ',', 1);
    v_pool := CASE
      WHEN rec.post_type <> 'citizen_report' THEN v_op_discuss
      WHEN rec.category = 'Infrastruktur' THEN v_op_infra
      WHEN rec.category = 'Lingkungan' THEN v_op_env
      WHEN rec.category = 'Pendidikan' THEN v_op_edu
      WHEN rec.category = 'Kesehatan' THEN v_op_health
      ELSE v_op_other END;

    v_ncom := floor(c_max_comments * power(random(), 2))::int;
    IF rec.post_type = 'official_update' THEN v_ncom := LEAST(v_ncom, 3); END IF;
    v_first_top := NULL;
    v_first_top_time := NULL;

    FOR j IN 1..v_ncom LOOP
      v_cn := v_cn + 1;
      v_tid := 'c-gen-' || c_batch || '-' || v_cn;
      v_ttime := rec.created_at + (now() - rec.created_at) * power(random(), 2)::float8;
      IF rec.status = 'resolved' AND random() < 0.4 THEN
        v_text := v_resolved[1 + floor(random() * cardinality(v_resolved))::int];
      ELSE
        v_text := v_pool[1 + floor(random() * cardinality(v_pool))::int];
        IF rec.post_type = 'citizen_report' AND random() < 0.6 THEN
          v_text := v_text || ' ' || v_closers[1 + floor(random() * cardinality(v_closers))::int];
        END IF;
      END IF;
      v_text := replace(v_text, '{district}', v_loc_dist);
      v_uid := v_users[1 + floor(random() * v_n_users)::int];
      SELECT display_name INTO v_dname FROM public.profiles WHERE id = v_uid;
      INSERT INTO public.comments (id, post_id, author_id, author_name, avatar_url, body, parent_id, likes, is_demo, created_at)
      VALUES (v_tid, rec.id, v_uid, v_dname, '', v_text, NULL, 0, true, v_ttime);

      IF v_first_top IS NULL THEN v_first_top := v_tid; v_first_top_time := v_ttime; END IF;

      IF random() < 0.35 THEN
        v_nrep := CASE WHEN random() < 0.3 THEN 2 ELSE 1 END;
        FOR s IN 1..v_nrep LOOP
          v_cn := v_cn + 1;
          v_rtime := v_ttime + (now() - v_ttime) * power(random(), 1.5)::float8;
          v_uid := v_users[1 + floor(random() * v_n_users)::int];
          SELECT display_name INTO v_dname FROM public.profiles WHERE id = v_uid;
          INSERT INTO public.comments (id, post_id, author_id, author_name, avatar_url, body, parent_id, likes, is_demo, created_at)
          VALUES ('c-gen-' || c_batch || '-' || v_cn, rec.id, v_uid, v_dname, '',
                  v_replies[1 + floor(random() * cardinality(v_replies))::int], v_tid, 0, true, v_rtime);
        END LOOP;
      END IF;
    END LOOP;

    -- the admin answers most reports that are past "submitted"
    IF v_admin_id IS NOT NULL AND rec.post_type = 'citizen_report'
       AND rec.status <> 'submitted' AND random() < 0.75 THEN
      v_cn := v_cn + 1;
      v_text := CASE rec.status
        WHEN 'under_review' THEN 'Laporan ' || rec.public_reference || ' sedang kami tinjau dan verifikasi. Terima kasih sudah melapor.'
        WHEN 'needs_info' THEN 'Mohon lengkapi keterangan lokasi dan foto tambahan agar laporan ' || rec.public_reference || ' dapat kami proses lebih lanjut.'
        WHEN 'accepted_for_routing' THEN 'Laporan ' || rec.public_reference || ' sudah diverifikasi dan sedang disiapkan untuk diteruskan ke instansi terkait.'
        WHEN 'forwarded_to_institution' THEN 'Terima kasih atas laporannya. Laporan ' || rec.public_reference || ' sudah diverifikasi dan diteruskan ke ' || rec.responsible_agency || ' untuk tindak lanjut.'
        WHEN 'institution_responded' THEN 'Laporan ' || rec.public_reference || ': ' || rec.responsible_agency || ' telah memberikan tanggapan. Rinciannya dapat dilihat pada halaman laporan.'
        WHEN 'resolved' THEN 'Laporan ' || rec.public_reference || ' dinyatakan selesai. Terima kasih atas partisipasi warga. Jika masalah muncul kembali, silakan ajukan laporan baru.'
        ELSE 'Laporan ' || rec.public_reference || ' belum dapat kami proses karena bukti dan informasi belum memadai. Silakan ajukan kembali dengan data yang lebih lengkap.' END;
      v_ttime := GREATEST(COALESCE(v_first_top_time, rec.created_at), rec.created_at)
                 + (now() - GREATEST(COALESCE(v_first_top_time, rec.created_at), rec.created_at)) * (0.1 + random() * 0.5)::float8;
      INSERT INTO public.comments (id, post_id, author_id, author_name, avatar_url, body, parent_id, likes, is_demo, created_at)
      VALUES ('c-gen-' || c_batch || '-' || v_cn, rec.id, v_admin_id, COALESCE(v_admin_name, 'Administrator TITIK'), '',
              v_text, v_first_top, 0, true, v_ttime);
    END IF;
  END LOOP;

  -- ------------------------------------------------------------- 6. REAL ENGAGEMENT ROWS
  -- Each row is a real like/save/support by a synthetic citizen. Triggers keep the
  -- counters in step and the reconcile below makes them exact.
  WITH tgt AS (
    SELECT id, floor(c_engagement * v_n_users * 0.6 * power(random(), 3))::int AS k
    FROM public.posts WHERE id LIKE 'gen-' || c_batch || '-%'
  )
  INSERT INTO public.post_likes (user_id, post_id)
  SELECT u.id, t.id
  FROM tgt t
  CROSS JOIN LATERAL (
    SELECT pr.id FROM public.profiles pr WHERE pr.id LIKE 'gen-usr-%' ORDER BY random() LIMIT t.k
  ) u
  ON CONFLICT DO NOTHING;

  WITH tgt AS (
    SELECT id, floor(c_engagement * v_n_users * 0.25 * power(random(), 3))::int AS k
    FROM public.posts WHERE id LIKE 'gen-' || c_batch || '-%'
  )
  INSERT INTO public.post_saves (user_id, post_id)
  SELECT u.id, t.id
  FROM tgt t
  CROSS JOIN LATERAL (
    SELECT pr.id FROM public.profiles pr WHERE pr.id LIKE 'gen-usr-%' ORDER BY random() LIMIT t.k
  ) u
  ON CONFLICT DO NOTHING;

  WITH tgt AS (
    SELECT id, floor(c_engagement * v_n_users * 0.7 * power(random(), 2.2) *
      CASE severity WHEN 'critical' THEN 1.0 WHEN 'high' THEN 0.75 WHEN 'medium' THEN 0.5 ELSE 0.3 END)::int AS k
    FROM public.reports WHERE id LIKE 'rep-gen-' || c_batch || '-%'
  )
  INSERT INTO public.report_supports (user_id, report_id)
  SELECT u.id, t.id
  FROM tgt t
  CROSS JOIN LATERAL (
    SELECT pr.id FROM public.profiles pr WHERE pr.id LIKE 'gen-usr-%' ORDER BY random() LIMIT t.k
  ) u
  ON CONFLICT DO NOTHING;

  WITH tgt AS (
    SELECT id, floor(c_engagement * LEAST(v_n_users, 15) * power(random(), 3))::int AS k
    FROM public.comments WHERE id LIKE 'c-gen-' || c_batch || '-%'
  )
  INSERT INTO public.comment_likes (user_id, comment_id)
  SELECT u.id, t.id
  FROM tgt t
  CROSS JOIN LATERAL (
    SELECT pr.id FROM public.profiles pr WHERE pr.id LIKE 'gen-usr-%' ORDER BY random() LIMIT t.k
  ) u
  ON CONFLICT DO NOTHING;

  -- ------------------------------------------------------------- 7. RECONCILE COUNTERS
  -- Same recount migration 20261028000006 uses, so numbers equal the relation rows
  -- whichever trigger versions are live.
  UPDATE public.reports r
  SET support_count = (SELECT count(*) FROM public.report_supports WHERE report_id = r.id)
  WHERE r.id LIKE 'rep-gen-%';

  UPDATE public.posts p
  SET likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = p.id),
      saves_count = (SELECT count(*) FROM public.post_saves WHERE post_id = p.id),
      comments_count = (SELECT count(*) FROM public.comments WHERE post_id = p.id),
      support_count = CASE WHEN p.related_report_id IS NOT NULL
        THEN (SELECT count(*) FROM public.report_supports WHERE report_id = p.related_report_id) ELSE 0 END,
      shares_count = 0
  WHERE p.id LIKE 'gen-%';

  UPDATE public.comments c
  SET likes = (SELECT count(*) FROM public.comment_likes WHERE comment_id = c.id)
  WHERE c.id LIKE 'c-gen-%';

  SELECT count(*) INTO v_cnt_profiles FROM public.profiles WHERE id LIKE 'gen-usr-%';
  SELECT count(*) INTO v_cnt_reports  FROM public.reports  WHERE id LIKE 'rep-gen-' || c_batch || '-%';
  SELECT count(*) INTO v_cnt_posts    FROM public.posts    WHERE id LIKE 'gen-' || c_batch || '-%';
  SELECT count(*) INTO v_cnt_comments FROM public.comments WHERE id LIKE 'c-gen-' || c_batch || '-%';
  RAISE NOTICE 'Batch %: % profil (total), % laporan, % post, % komentar.',
    c_batch, v_cnt_profiles, v_cnt_reports, v_cnt_posts, v_cnt_comments;
END
$gen$;

NOTIFY pgrst, 'reload schema';

-- Quick check: everything this script has generated so far
SELECT 'profiles' AS tabel, count(*) AS jumlah FROM public.profiles WHERE id LIKE 'gen-usr-%'
UNION ALL SELECT 'reports',  count(*) FROM public.reports  WHERE id LIKE 'rep-gen-%'
UNION ALL SELECT 'posts',    count(*) FROM public.posts    WHERE id LIKE 'gen-%'
UNION ALL SELECT 'comments', count(*) FROM public.comments WHERE id LIKE 'c-gen-%'
UNION ALL SELECT 'post_likes', count(*) FROM public.post_likes WHERE post_id LIKE 'gen-%'
UNION ALL SELECT 'report_supports', count(*) FROM public.report_supports WHERE report_id LIKE 'rep-gen-%';

-- =============================================================================
-- CLEANUP: removes everything this script generated, across all batches.
-- Uncomment and run on its own. Order matters: posts go before reports so the
-- posts.related_report_id link is gone first. Likes, saves, supports,
-- comment likes and report_events cascade from their parents.
-- =============================================================================
-- DELETE FROM public.posts    WHERE id LIKE 'gen-%';
-- DELETE FROM public.reports  WHERE id LIKE 'rep-gen-%';
-- DELETE FROM public.profiles WHERE id LIKE 'gen-usr-%';
