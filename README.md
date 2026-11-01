# TITIK.

Platform warga untuk melaporkan masalah fasilitas publik di Kota Bogor dan memantau penanganannya secara transparan. Dilengkapi feed vertikal, penandaan lokasi geospasial, pelacakan anggaran APBD, dan pesan langsung terenkripsi end-to-end (E2EE).

Dibuat untuk **Multimedia In Action 2026 (Web In Action)**, subtema Civic.

**Demo:** https://kata-natan-apa-aja-wip.pages.dev/

## Fitur Utama

- **Feed Vertikal**: Laporan & postingan warga, dukungan dampak publik ("saya terdampak juga"), suka, simpan, dan komentar berulir.
- **Buat Konten**:
  - *Postingan*: Opini warga, foto/video, lokasi, dan tautan fasilitas publik.
  - *Laporan*: Formulir 4 langkah dengan bukti visual wajib. Menghasilkan ID referensi unik `TIK-2026-XXXXXX` dan token pelacak privat.
- **Pesan Terenkripsi (E2EE)** di `/pesan`: Obrolan dua arah warga dan verifikator dengan enkripsi Web Crypto API (AES-GCM-256). Supabase hanya bertindak sebagai perantara ciphertext.
- **Portal admin** di `/admin`: Antarmuka 100vh dengan 5 sub-halaman:
  - `/admin/overview`: Ringkasan metrik dan KPI laporan masuk.
  - `/admin/validasi`: Meja kerja verifikasi bukti fisik & respons resmi.
  - `/admin/disposisi`: Distribusi rute dinas teknis (PUPR, Dishub, DLH) dan SLA.
  - `/admin/anggaran`: Rekap APBD live per sektor dan audit serapan dana.
  - `/admin/pengguna`: Manajemen warga dan pengaturan peran admin.
- **Peta & Eksplorasi** (`/map`, `/explore`): Pemetaan geospasial fasilitas dan sektor terdampak.
- **Pelacakan Tanpa Akun** (`/track`): Cek status laporan langsung via kode referensi & token rahasia.

Privasi: Metadata EXIF/GPS dibersihkan otomatis dari foto sebelum diunggah. Laporan anonim tidak mengikat identitas akun.

## Teknologi

React 19, TypeScript, Tailwind CSS v4, React Router 7, Leaflet, Web Crypto API (SubtleCrypto), Supabase (Postgres, Auth, Storage, Realtime), Vite, Vitest, Oxlint.

## Menjalankan Lokal

Persyaratan: Node.js 18+.

```bash
git clone https://github.com/AchiraStudio/kata-natan-apa-aja_wip.git
cd kata-natan-apa-aja_wip
npm install
cp .env.example .env
npm run dev
```

Buka http://localhost:5173.

### Konfigurasi Environment (`.env`)

```env
VITE_SUPABASE_URL=https://<ref-proyek>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_MAP_PROVIDER=osm      # Default: OpenStreetMap (gratis). Opsi lain: CARTO
```

### Database & Migrasi

Skrip database mandiri dan idempoten tersedia di:
- **`supabase/ALL_IN_ONE_SETUP.sql`**: Skrip master lengkap (tabel, RLS, index, realtime publication, trigger, dan RPC).
- Atau jalankan migrasi bertahap di `supabase/migrations/` via Supabase SQL Editor.

Peran admin dikelola melalui tabel `public.user_roles` (bukan metadata akun di client).

## Perintah Pengembangan

```bash
npm run dev      # Menjalankan development server
npm run test     # Menjalankan unit & integration test (Vitest)
npm run lint     # Linting cepat menggunakan Oxlint
npm run build    # Type-check (tsc) dan bundle produksi (Vite)
```

## Daftar Rute

| Rute | Halaman / Fungsi | Akses |
| :--- | :--- | :--- |
| `/` | Feed vertikal utama | Publik |
| `/explore`, `/map` | Eksplorasi sektor & peta geospasial | Publik |
| `/track` | Pelacakan status laporan publik | Publik |
| `/alur` | Panduan alur akuntabilitas pelaporan | Publik |
| `/pesan` | Kotak masuk & chat terenkripsi (E2EE) | Login |
| `/u/:username` | Profil publik warga | Publik |
| `/laporan-saya`, `/tersimpan` | Arsip laporan & simpanan pribadi | Login |
| `/admin/*` | Portal verifikasi & konsol admin (5 modul) | admin |
