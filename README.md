# TITIK.

Platform warga untuk melaporkan masalah fasilitas publik di Kota Bogor, lalu melacak laporannya sampai ada tindak lanjut. Feed-nya vertikal seperti TikTok, tapi setiap laporan punya bukti, lokasi, nomor referensi, dan konteks anggaran APBD.

Dibuat untuk **Multimedia In Action 2026 (Web In Action)**, subtema Civic.

**Demo:** https://kata-natan-apa-aja-wip.pages.dev/

## Yang bisa dilakukan

- **Feed** vertikal: lihat postingan dan laporan warga, dukung ("saya terdampak juga"), suka, simpan, komentar berulir.
- **Buat**: satu tombol, dua tab.
  - *Postingan*: tulisan, media, lokasi, opsional tautkan ke fasilitas.
  - *Laporan*: form 4 langkah dengan bukti wajib (1 foto + 1 video). Hasilnya nomor referensi `TIK-2026-XXXXXX` dan token rahasia untuk melacak.
- **Lacak** laporan lewat `/track` pakai nomor referensi dan token, tanpa perlu login.
- **Peta** fasilitas dan laporan (Leaflet + OpenStreetMap).
- **Profil** di `/u/:username` berisi postingan dan laporan publik. Postingan tersimpan hanya terlihat oleh pemiliknya.
- **Admin** untuk mengubah status laporan.

Metadata EXIF/GPS dihapus dari foto sebelum diunggah. Laporan anonim tidak menyimpan ID akun pelapor.

## Teknologi

React 19, TypeScript, Tailwind v4, React Router 7, Leaflet, Recharts, Supabase (Postgres, Auth, Storage), Vite, Vitest, Oxlint. Hosting di Cloudflare Pages.

## Menjalankan lokal

Butuh Node 18+.

```bash
git clone https://github.com/AchiraStudio/kata-natan-apa-aja_wip.git
cd kata-natan-apa-aja_wip
npm install
cp .env.example .env
npm run dev
```

Buka http://localhost:5173.

### Environment

```env
VITE_DATA_MODE=live        # 'live' = Supabase, 'demo' = data lokal tanpa backend
VITE_SUPABASE_URL=https://<ref-proyek>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_MAP_PROVIDER=osm      # opsional: CARTO butuh VITE_CARTO_API_KEY
```

Jangan pernah menaruh `service_role` key di variabel `VITE_`.

### Database

Jalankan isi `supabase/migrations/` secara berurutan di SQL Editor (atau `supabase db push`). `supabase/schema.sql` adalah versi gabungannya.

Admin pertama ditentukan lewat tabel `public.user_roles`, bukan metadata akun. Tambahkan lewat SQL Editor.

### Data contoh (opsional)

Skrip seed memakai `service_role` key, jadi simpan di environment lokal atau `.env.seed`, bukan di `.env` frontend.

```bash
npm run seed:all
npx vite-node scripts/seed/seedAll.ts --reset-demo   # hapus data demo lalu isi ulang
```

Data demo ditandai `is_demo` dan hanya itu yang dihapus saat reset.

## Perintah

```bash
npm run dev      # dev server
npm run test     # Vitest
npm run lint     # Oxlint
npm run build    # type-check + build produksi
```

## Rute

| Rute | Isi | Akses |
|------|-----|-------|
| `/` | Feed | Publik |
| `/post/:id` | Detail postingan | Publik |
| `/report/:id` | Detail laporan dan riwayat status | Publik |
| `/u/:username` | Profil warga | Publik |
| `/explore`, `/map` | Fasilitas, sektor, peta | Publik |
| `/track` | Lacak laporan | Publik |
| `/alur` | Panduan alur pelaporan | Publik |
| `/login` | Masuk dan daftar | Publik |
| `/me` | Profil sendiri | Login |
| `/laporan-saya` | Laporan milik sendiri | Login |
| `/admin` | Konsol admin | Admin |

Pengecekan akses di frontend hanya untuk kenyamanan. Yang sebenarnya menjaga data adalah RLS di Supabase.

## Catatan

Data anggaran dan sebagian laporan di mode demo adalah contoh, bukan data resmi pemerintah.