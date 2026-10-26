# TITIK. — Observatorium Layanan Publik & Akuntabilitas Anggaran

> **Kompetisi:** Multimedia In Action (MIA) 2026 — Web In Action (WIA)
> **Subtema:** Civic — Transparansi, Akuntabilitas, Partisipasi Publik
> **Tagline:** *See the issue. Trace the budget. Track the impact.*

🌐 **[Demo Langsung → kata-natan-apa-aja-wip.pages.dev](https://kata-natan-apa-aja-wip.pages.dev/)**

---

## Apa itu TITIK.?

**TITIK.** adalah platform partisipasi warga berbasis civic-tech yang menggabungkan feed vertikal ala TikTok dengan sistem pelaporan infrastruktur publik terstruktur dan data anggaran daerah terbuka (APBD). Setiap laporan warga bisa ditelusuri mulai dari bukti foto/video, koordinat lokasi, alokasi dana publik, hingga status penanganan resmi instansi.

Singkatan: **T**ransparansi **I**nfrastruktur, **T**indak **I**klim, **K**omunitas.

---

## Fitur Utama

### 📱 Feed Sipil Vertikal (TikTok-style)
- Scroll snap per-postingan dengan gestur sentuh mobile dan mouse-wheel desktop
- Tiga tab feed: **Untuk Anda**, **Mengikuti**, **Terdekat**
- Bottom nav melayang yang otomatis sembunyi & muncul saat scroll (mobile)
- Desktop: sidebar navigasi sipil dengan radar sektor publik aktif (Drainase, Jalan, PJU, Lingkungan, Fasilitas Sosial)
- Panel kontekstual kanan desktop: data TITIK Report, konteks APBD, dan komentar warga real-time

### 🗺️ Peta Geospasial Interaktif
- Peta Leaflet dengan marker laporan warga (merah) dan fasilitas publik (hijau)
- Tile basemap CARTO Voyager (diautentikasi via `?key=`) dengan fallback otomatis ke OpenStreetMap jika jaringan bermasalah
- Filter berdasarkan jenis: Semua, Laporan Warga, Fasilitas Publik

### 📋 Sistem Pelaporan Terstruktur
- Form pelaporan dengan upload bukti foto/video, geolokasi presisi, dan kategori sektor
- ID referensi unik publik (`TIK-2026-XXXXXX`) + token rahasia untuk pelaporan anonim
- State machine status: `submitted` → `under_review` → `needs_info` → `forwarded_to_institution` → `resolved`
- Immutable audit log setiap transisi status (aktor, waktu, catatan)

### 💬 Komentar Sipil Berulir (Threaded)
- Komentar warga dengan dukungan balasan bertingkat (threaded replies)
- Bottom sheet komentar on mobile, panel samping di desktop
- Sinkronisasi ke Supabase dengan fallback ke mock data lokal
- Generator komentar kontekstual otomatis berbasis kategori laporan (AI-assisted seeding)

### 🔐 Autentikasi & Manajemen Akun
- Login/registrasi via Supabase Auth
- Halaman login dengan generator akun demo bulk (ratusan akun preset persona warga)
- Role-based access: `citizen`, `admin`
- Panel admin: antrean verifikasi laporan, transisi status, dan konsol moderasi

### 🌙 Dark Mode
- Toggle tema terang/gelap persisten via `localStorage`
- Seluruh halaman mendukung dark mode penuh menggunakan CSS custom properties (`data-theme="dark"`)

### 🔍 Pencarian Global
- Modal pencarian (shortcut `⌘K` / `Ctrl+K`) untuk laporan dan fasilitas publik

---

## Tumpukan Teknologi

| Lapisan | Teknologi |
|---------|-----------|
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + CSS Modules per-view |
| Routing | React Router v7 |
| Maps | Leaflet 1.9 + CARTO Basemaps |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Build | Vite 8 + Rolldown |
| Linter | Oxlint |
| Test | Vitest (304 test, 17 file) |
| Deploy | Cloudflare Pages |

---

## Arsitektur Dual-Adapter

Aplikasi dirancang tahan terhadap kondisi jaringan terputus saat demo:

```
DataService
  ├── SupabaseDataAdapter   (live: PostgreSQL + Auth + Storage)
  └── MockDataAdapter       (offline fallback: localStorage)
```

Seluruh logika state machine, token hashing, dan korelasi APBD berjalan 100% di sisi klien tanpa ketergantungan server eksternal.

---

## Peta Halaman

| Rute | Halaman | Akses |
|------|---------|-------|
| `/` | Feed Utama (vertikal, snap scroll) | Terautentikasi |
| `/login` | Login & Registrasi + Generator Akun Demo | Publik |
| `/explore` | Eksplorasi Sektor & Fasilitas Publik | Terautentikasi |
| `/map` | Peta Geospasial Observatorium | Terautentikasi |
| `/track` | Lacak Laporan via ID Referensi | Terautentikasi |
| `/alur` | Alur Pelaporan & Panduan Warga | Terautentikasi |
| `/report/:id` | Detail Laporan Warga + Peta Mini + Audit Log | Publik |
| `/admin` | Konsol Operasional & Moderasi | Admin only |

---

## Skema Database (Supabase)

```sql
profiles      -- Profil pengguna (citizen / admin)
comments      -- Komentar berulir per postingan (threaded, dengan likes)
```

Row Level Security (RLS) aktif di semua tabel. Trigger otomatis membuat profil warga saat registrasi Supabase Auth.

---

## Menjalankan Proyek

### Prasyarat
- Node.js 18+ atau 20+
- npm

### Instalasi

```bash
git clone https://github.com/AchiraStudio/kata-natan-apa-aja_wip.git
cd kata-natan-apa-aja_wip
npm install
```

### Konfigurasi Environment

Salin `.env.example` menjadi `.env` dan isi:

```bash
cp .env.example .env
```

```env
# Supabase (wajib untuk mode live)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# CARTO Basemaps — dapatkan kunci gratis di carto.com/basemaps/apikey
# Jika dikosongkan, peta otomatis fallback ke OpenStreetMap
VITE_CARTO_API_KEY=
VITE_CARTO_STYLE=voyager
```

### Menjalankan Dev Server

```bash
npm run dev
# → http://localhost:5173
```

### Perintah Lainnya

```bash
npm run build      # Build produksi (TypeScript + Vite)
npm run lint       # Oxlint static analysis
npm run test       # Vitest (304 tests, 17 file)
npm run seed:comments  # Seed komentar sipil ke Supabase
```

---

## Pengujian Otomatis

17 file test, **304 assertion** meliputi:

| Suite | Cakupan |
|-------|---------|
| `e2e_architecture` | Zero inline styles, invariant struktur file |
| `domain_calculations` | State machine, status transitions, audit log |
| `civic_feed_e2e` | Feed rendering, tab switching, scroll |
| `comment_generator` | Generator komentar kontekstual AI |
| `map_tiles` | CARTO API key resolution, fallback ke OSM |
| `time_ago` | Lokalisasi format waktu relatif (Bahasa Indonesia) |
| `supabase_comments_adapter` | Sinkronisasi komentar live + fallback graceful |
| `tier5_adversarial_coverage` | Edge case, XSS sanitasi, input malformed |

---

## Desain Visual

Sistem desain TITIK. v2.0 menggunakan palet editorial hangat (warm broadsheet) anti-slop:

- **Canvas** `#FAF9F6` — Kertas alami daylight
- **Dark Canvas** `#0C100E` — Obsidian midnight
- **Primary Ink** `#0F172A` / `#F3F6F4`
- **Aksen Civic** — Emerald `#10B981`, Amber `#D97706`, Crimson `#E11D48`, Cobalt `#2563EB`
- **Tipografi** — `Poppins` (UI) + `JetBrains Mono` (ID Referensi, nominal APBD)

Diatur dalam [`DESIGN.md`](./DESIGN.md) sebagai token desain machine-readable.

---

## Kontributor

Proyek ini dikembangkan sebagai karya kompetisi **MIA 2026 — Web In Action** kategori Civic.

---

> *"Ruang publik, suara bersama. Dari aspirasi warga menuju tindakan yang bisa ditelusuri."*
