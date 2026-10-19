# TITIK. — Observatorium Layanan Publik & Akuntabilitas Anggaran

> **Kompetisi:** Multimedia In Action (MIA) 2026 — Web In Action (WIA)  
> **Subtema:** Civic (Transparansi, Akuntabilitas, Partisipasi Publik)  
> **Tagline:** *See the issue. Trace the budget. Track the impact.*  
> **Posisi Produk:** *Ruang publik, suara bersama. Dari aspirasi warga menuju tindakan yang bisa ditelusuri.*

---

## 🏛️ 1. Ikhtisar Produk

**TITIK.** adalah platform partisipasi sosial-sipil yang memadukan kenyamanan browsing feed vertikal ala TikTok dengan ketelitian sistem pelaporan infrastruktur publik terverifikasi dan integrasi data terbuka anggaran daerah (APBD).

### Tiga Pilar Pemisahan Konten
1. **Community Content:** Apa yang dikatakan, diamati, atau didiskusikan oleh warga di ruang publik.
2. **Submitted Reports:** Klaim terstruktur dengan bukti foto/video, koordinat presisi, dan ID referensi publik.
3. **Verified Institutional Information:** Respon resmi instansi, keterkaitan alokasi APBD SIKD Kemendagri, dan catatan audit perubahan status yang permanen.

---

## 🎨 2. Sistem Desain & Visual (Sesuai Referensi Disetujui)

Aplikasi dibangun menggunakan palet editorial hangat (warm broadsheet) tanpa gradien ungu neon dan tanpa card template generik:
- **Canvas Base (`#F7F6F1`):** Latar kertas hangat daylight yang nyaman di mata.
- **Card Surface (`#FFFFFF`):** Kartu putih dengan hairline divider solid (`#E4E2DA`).
- **Primary Ink (`#20221D`):** Teks hitam slate dengan legibilitas tinggi.
- **Secondary Ink (`#686B65`):** Metadata, tanggal, koordinat, dan label dinas.
- **Primary Action (`#263F35`):** Hijau hutan sipil berwibawa untuk tombol utama.
- **Muted Sage Surface (`#E7EBDD`):** Latar badge dan penanda aktifitas.
- **Status Aksesibel Amber (`#FEF3C7` / `#92400E`):** Memenuhi standar rasio kontras WCAG 2.1 AA (> 4.5:1).
- **Tipografi:** `Plus Jakarta Sans` untuk teks antarmuka dan `JetBrains Mono` untuk ID referensi dan nominal Rupiah APBD.

---

## 🗺️ 3. Peta Navigasi & Rute Halaman

| Rute | Deskripsi | Shell / Komponen |
|---|---|---|
| `/` | **Home Feed:** Feed video/foto vertikal bergulir snap ala TikTok, sidebar navigasi, banner alur akuntabilitas, dan panel kontekstual dinamis (**TITIK REPORT** + **Konteks APBD** + **Komentar Langsung**). | Publik (3 Kolom Desktop / Bottom Nav Mobile) |
| `/explore` | **Eksplorasi Sektor & Fasilitas:** Pencarian terpadu fasilitas publik, filter kategori (Infrastruktur, Lingkungan, Pendidikan, Kesehatan), dan galeri laporan warga. | Publik |
| `/map` | **Peta Geospasial Observatorium:** Peta interaktif Leaflet dengan marker laporan warga dan fasilitas publik Kota Bogor. | Publik |
| `/track` | **Lacak Laporan Mandiri:** Pengecekan status penanganan menggunakan ID Referensi (`TIK-2026-XXXXXX`) dan token rahasia pelapor anonim. | Publik / Terproteksi Kredensial |
| `/admin` | **Konsol Operasional & Moderasi:** Antrean verifikasi bukti, transisi status state machine (`under_review` → `needs_info` → `forwarded_to_institution` → `resolved`), dan pencatatan riwayat audit. | Khusus Moderator / Pengelola |

---

## ⚙️ 4. Arsitektur Dual-Adapter (Online Supabase + Offline Fallback)

Untuk menjamin kelancaran presentasi offline pada babak final 28 November serta demo online:
- `SupabaseDataAdapter`: Menghubungkan ke PostgreSQL, Row Level Security, dan Storage Supabase.
- `MockDataAdapter`: Adapter lokal cadangan otomatis jika jaringan terputus atau Supabase offline. Semua alur state machine, token hashing, dan korelasi APBD tetap 100% fungsional tanpa server eksternal.

---

## 🚀 5. Cara Menjalankan Proyek

### Prasyarat
- Node.js versi 18+ atau 20+
- npm atau pnpm

### Instalasi & Menjalankan Dev Server
```bash
# 1. Masuk ke direktori proyek
cd kata-natan-apa-aja_wip

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:5173`.

### Pengujian Otomatis & Mutu Kode
```bash
# Menjalankan unit tests (Vitest)
npm run test

# Menjalankan linter (Oxlint)
npm run lint

# Menjalankan build produksi TypeScript
npm run build
```

---

## 📸 6. Panduan Pengambilan Tangkapan Layar (Submit 1 November)

1. **Halaman 1 (Finished Landing & Social Feed):** Buka `http://localhost:5173/`, pastikan banner "Ruang publik, suara bersama" aktif di atas feed TikTok vertikal dan panel kanan menampilkan kartu "TITIK REPORT" bersama "Konteks APBD 2026".
2. **Halaman 2 (Detail Audit / Admin Queue):** 
   - Klik *"Lihat detail laporan →"* pada panel kanan untuk mengambil tangkapan layar drawer timeline 6 langkah audit.
   - Atau buka `http://localhost:5173/admin` untuk memperlihatkan antrean penanganan dan transisi status instansi.
