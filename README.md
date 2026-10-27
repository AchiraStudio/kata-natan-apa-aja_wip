# TITIK. — Observatorium Layanan Publik & Akuntabilitas Anggaran

> **Kompetisi:** Multimedia In Action (MIA) 2026 — Web In Action (WIA)  
> **Subtema:** Civic — Transparansi, Akuntabilitas, Partisipasi Publik  
> **Tagline:** *See the issue. Trace the budget. Track the impact.*  

🌐 **Demo Situs Langsung:** [https://kata-natan-apa-aja-wip.pages.dev/](https://kata-natan-apa-aja-wip.pages.dev/)

---

## 📌 Sekilas Tentang TITIK.

**TITIK.** adalah platform partisipasi warga berbasis civic-tech yang menyatukan dinamika feed vertikal interaktif (ala TikTok) dengan sistem pelaporan infrastruktur publik terstruktur dan transparansi anggaran daerah (APBD). Setiap aspirasi dan laporan kerusakan fasilitas publik warga Kota Bogor dapat ditelusuri secara jujur: mulai dari bukti foto/video terverifikasi, koordinat geospasial presisi, nomor referensi unik, alokasi dana APBD terkait, hingga respons instansi berwenang (Dinas PUPR).

Singkatan: **T**ransparansi **I**nfrastruktur, **T**indak **I**klim, **K**omunitas.

---

## 🚀 Fitur Utama & Pembaruan

### 1. 📱 Linimasa Feed Sipil Vertikal (TikTok-Style)
- **Smooth Snapping Feed**: Transisi snap mulus antar postingan dengan dukungan gestur swipe ponsel dan mouse-wheel desktop.
- **Tiga Tab Feed**: *Untuk Anda*, *Mengikuti*, dan *Terdekat*.
- **Interaksi Warga Nyata**: Dukungan civic (*Saya terdampak juga*), suka (*likes*), simpan (*bookmark*), dan bagikan postingan dengan tautan permalink permanen.
- **Tautan Profil & Komentar**: Klik avatar atau `@username` langsung mengarahkan ke halaman profil publik pembuat postingan.

### 2. ✍️ Modal Terpadu "Buat" (Postingan & Laporan Warga)
- **Tombol Tunggal "Buat"**: Menggantikan tombol ganda yang membingungkan di Sidebar dan Bottom Navigation.
- **Tab Postingan**: Teks aspirasi/diskusi warga (maks. 2.000 karakter), tag lokasi, pemilihan fasilitas publik terkait, dan unggahan media.
- **Tab Laporan Warga**: Wizard terstruktur 4 langkah (Kategori, Detail & Lokasi, Bukti Wajib 1 Foto + 1 Video, Konfirmasi) dengan penerbitan nomor referensi unik (`TIK-2026-XXXXXX`) dan token rahasia pelacak.
- **Pembersihan Metadata EXIF/GPS Klien**: Gambar diproses ulang melalui kanvas 2D browser sebelum diunggah ke Supabase Storage demi melindungi privasi lokasi pribadi pelapor anonim.
- **Draft Otomatis**: Draf tersimpan di `sessionStorage` sehingga data tidak hilang saat tab tertutup tanpa sengaja.

### 3. 👤 Sistem Profil Warga & Rute `/u/:username`
- **Profil Lengkap**: Menampilkan avatar, nama tampilan, `@username`, badge peran instansi/warga terverifikasi, kecamatan domisili, bio, serta statistik aktivitas warga.
- **Tab Konten**:
  - **Postingan**: Seluruh postingan linimasa yang dipublikasikan oleh warga tersebut.
  - **Laporan**: Seluruh laporan publik yang diajukan ke dinas terkait (dengan status penyelesaian).
  - **Disimpan**: Daftar postingan yang disimpan (hanya tampil jika pemilik akun yang melihat profilnya sendiri).
- **Edit Profil Langsung**: Ubah nama, username, bio, wilayah domisili, dan unggah foto profil baru ke bucket `avatars`.
- **Rute `/me`**: Mengarahkan pengguna terautentikasi langsung ke profil pribadinya.

### 4. 🔗 Tautan Permanen Postingan (`/post/:id`)
- Akses langsung ke postingan spesifik melalui URL mandiri.
- Tampilan konten lengkap, kartu keterhubungan laporan warga, metrik keterlibatan, dan kolom komentar berulir langsung.

### 5. 🗺️ Peta Geospasial Observatorium & Ketahanan Peta (Zero Watermark)
- Peta interaktif Leaflet dengan penanda laporan warga dan sebaran fasilitas publik Kota Bogor.
- **Ketahanan Basemap**: Otomatis menggunakan OpenStreetMap murni jika API key CARTO tidak dikonfigurasi, memastikan peta bersih tanpa watermark *"API KEY REQUIRED"*.

### 6. 🔐 Lapisan Keamanan & Supabase Truthful Data Layer
- **Pemisahan Peran Anti-Eskalasi**: Hak akses admin dikelola terpisah di tabel terlindungi `public.user_roles`, mencegah manipulasi role dari metadata klien.
- **Row Level Security (RLS) Least-Privilege**: Kebijakan RLS ketat pada tabel `profiles`, `posts`, `reports`, `comments`, `post_likes`, `post_saves`, dan bucket storage.
- **Zero Mock Swallowing**: Pada mode `live`, data dijamin bersumber langsung dari Supabase tanpa silent fallback ke data palsu. Error jaringan/validasi ditangani secara eksplisit dengan notifikasi informatif.
- **Perlindungan Anonimitas**: Laporan bertipe `anonymous` menjamin `reporter_user_id` tidak tersimpan di database publik.

---

## 🛠️ Tumpukan Teknologi

| Komponen | Spesifikasi & Teknologi |
|----------|--------------------------|
| **Frontend Framework** | React 19 + TypeScript (Strict Type Safety) |
| **Styling & Tema** | Tailwind CSS v4 + Dark/Light Mode Theme Provider |
| **Routing & Code Splitting**| React Router v7 + `React.lazy` / `Suspense` |
| **Peta & Geospasial** | Leaflet 1.9 + OpenStreetMap / CARTO Basemaps |
| **Grafik & Analisis** | Recharts (APBD Sektor Publik) |
| **Ikon UI** | Lucide React |
| **Backend & Basis Data** | Supabase (PostgreSQL 15+, Auth, Storage, Stored Procedures PL/pgSQL) |
| **Build & Bundler** | Vite 8 + Rolldown |
| **Linter & Validator** | Oxlint (0 errors) |
| **Pengujian Otomatis** | Vitest (19 test files, 317 tests passing) |
| **Hosting & CDN** | Cloudflare Pages |

---

## 🧭 Peta Rute Aplikasi

| Rute URL | Halaman / Tampilan | Hak Akses |
|----------|---------------------|-----------|
| `/` | Linimasa Feed Sipil Vertikal | Publik |
| `/u/:username` | Profil Warga Publik (Postingan, Laporan, Simpanan) | Publik |
| `/me` | Pintasan ke Profil Pengguna Aktif | Terautentikasi (Redirect ke `/login` jika belum masuk) |
| `/post/:id` | Tautan Permanen Detail Postingan & Komentar | Publik |
| `/report/:id` | Detail Laporan Warga, Riwayat Status, dan Peta Mini | Publik |
| `/explore` | Eksplorasi Radar Sektor & Fasilitas Publik | Publik |
| `/map` | Peta Sebaran Fasilitas dan Laporan Warga | Publik |
| `/track` | Lacak Progres Laporan dengan ID Referensi & Token | Publik |
| `/alur` | Panduan Alur Pelaporan Warga | Publik |
| `/login` | Masuk & Registrasi Akun Warga | Publik |
| `/laporan-saya` | Dashboard Pantauan Laporan Pribadi | Terautentikasi |
| `/admin` | Konsol Verifikasi & Transisi Status Dinas PUPR | Admin Only |

---

## 💻 Panduan Menjalankan Proyek Lokal

### 1. Prasyarat
- Node.js versi 18 atau 20+
- npm (versi 9+)

### 2. Kloning & Instalasi

```bash
git clone https://github.com/AchiraStudio/kata-natan-apa-aja_wip.git
cd kata-natan-apa-aja_wip
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)

Salin berkas `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi konfigurasi Supabase proyek Anda:

```env
# Mode Data: 'live' (Supabase riil) atau 'demo' (lokal offline)
VITE_DATA_MODE=live

# Kredensial Supabase
VITE_SUPABASE_URL=https://<ref-proyek>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Konfigurasi Peta (Default: osm - Gratis & Tanpa Watermark)
VITE_MAP_PROVIDER=osm
VITE_CARTO_API_KEY=
VITE_CARTO_STYLE=voyager
```

### 4. Eksekusi Migrasi Supabase
Jalankan berkas migrasi pengerasan keamanan di Supabase SQL Editor:
- `supabase/migrations/20261028000001_security_hardening.sql`

Atau gunakan skrip skema gabungan:
- `supabase/schema.sql`

### 5. Seeding Data Deterministik (Opsional)
Jalankan skrip seeding otomatis untuk mengisi fasilitas, laporan awal, postingan, dan akun demo:

```bash
# Seed semua data demo
npm run seed:all

# Reset data demo lalu isi ulang dari awal
npx vite-node scripts/seed/seedAll.ts --reset-demo
```

### 6. Menjalankan Server Pengembangan

```bash
npm run dev
# Akses melalui browser di http://localhost:5173
```

---

## 🧪 Eksekusi Pengujian & Verifikasi

Seluruh logika, komponen, isolasi scroll, dan adaptor diuji secara otomatis menggunakan Vitest:

```bash
# Menjalankan seluruh pengujian (317 tests)
npm run test

# Menjalankan linter oxlint
npm run lint

# Menjalankan build produksi & type-check
npm run build
```

---

## 🎨 Filosofi Desain

TITIK. mengedepankan pendekatan **Editorial Broadsheet Hangat** yang manusiawi, bebas dari klise visual AI (tanpa gradien ungu/violet generik, tanpa efek mengambang berlebihan):
- **Warna Utama**: Deep Forest (`#263F35`), Emerald (`#10B981`), Sand/Cream (`#F7F6F1`), Obsidian Dark (`#0A100D`).
- **Aksen Transparansi**: Amber (`#D97706`) untuk peninjauan anggaran, Crimson (`#DC2626`) untuk laporan infrastruktur darurat.
- **Tipografi**: Bersih, proporsional, dan mudah dibaca pada berbagai ukuran layar gawai warga.

---

> *"Dari keresahan di jalanan, menjadi aksi transparan yang dapat dipertanggungjawabkan."*
