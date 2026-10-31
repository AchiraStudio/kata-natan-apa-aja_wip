---
name: TITIK. Botani Civic-Ledger Design System
version: 2.5.0
description: "Precision Civic-Tech & Bogor City Telemetry design system for TITIK. Grounded in 'Setiap masalah adalah titik' (Every problem is a point/dot that appears, pulses, travels, and settles)."
colors:
  paper: "#F7F5EF"
  surface: "#FFFFFF"
  ink: "#101913"
  muted: "#4F5A52"
  line: "#E3E0D6"
  botani-900: "#1B4332"
  botani-700: "#2D6A4F"
  botani-subtle: "#E7EBDD"
  hujan-600: "#2E5E8C"
  status-baru: "#B45309"
  status-diverifikasi: "#2563EB"
  status-ditindak: "#2E5E8C"
  status-tuntas: "#2D6A4F"
  status-ditolak: "#B3261E"
  dark-canvas: "#0C100E"
  dark-surface: "#1A221E"
  dark-line: "#26352E"
  dark-ink: "#F3F6F4"
  dark-muted: "#9EACA3"
typography:
  display: "Plus Jakarta Sans, system-ui, sans-serif"
  body: "Plus Jakarta Sans, system-ui, sans-serif"
  mono-id: "IBM Plex Mono, JetBrains Mono, monospace"
  tabular: "tabular-nums"
---

# TITIK. Design Specification (v2.5 — Botani Civic-Ledger)

## 1. Brand Concept: "Setiap Masalah Adalah Titik"
Every civic report is a **titik** (point/dot in Indonesian). A titik has a clear lifecycle:
1. **Muncul (Appears)**: Warga melapor, titik terdaftar dengan ID monospaced unik (`TIK-2026-XXXX`).
2. **Berdenyut (Pulses)**: Menandakan laporan aktif dan sedang dihimpun dukungannya (`.titik-live`).
3. **Ditindak (Moves)**: Dinas terkait menugaskan tim lapangan beserta status alokasi APBD.
4. **Tuntas (Settles)**: Masalah terselesaikan dengan bukti foto penuntasan dan tandatangan verifikasi dinas.

## 2. Bogor Identity & Telemetry
- **Kota Hujan (Rain City)**: Telemetri presipitasi & curah hujan real-time pada header direktori dan peta geospatial.
- **Botani Green Palette**: Formalisasi hijau Kebun Raya Bogor (`#1B4332`, `#2D6A4F`) di atas kanvas kertas hangat (`#F7F5EF`).
- **Pemerintah Kota Bogor Co-Branding**: Elemen institusional yang mempertegas bahwa TITIK adalah kanal tindak nyata resmi berpartner dengan dinas terkait (PUPR, DLH, Dishub).

## 3. The Trust Layer
1. **4-Stage Status System**:
   - `Baru` (Amber `#B45309`) -> `Diverifikasi` (Cobalt `#2563EB`) -> `Ditindak` (Hujan `#2E5E8C`) -> `Tuntas` (Botani `#2D6A4F`).
2. **Official Agency Response ("Respons Resmi")**:
   - Background tinted Botani (`#1B4332` 4-6% opacity).
   - Border kiri 3px warna instansi.
   - Badge "Respons Resmi", logo resmi dinas, dan checklist verifikasi akun dinas.
3. **Absolute Timestamps**:
   - Format standar: `"31 Okt 2026, 14:20 WIB"` agar memiliki kekuatan arsip hukum dan akuntabilitas sipil.
4. **Alokasi APBD Terbuka**:
   - Informasi anggaran ditampilkan langsung pada kartu detail laporan: *"Dialokasikan Rp 250 jt · APBD 2026 · Status serapan: 62%"*.

## 4. Motion & Micro-Interactions
- **Signature Move**: `.titik-live` (ripple pulse 2.4s).
- **Easing**: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`.
- **Like Burst**: 8-dot radial burst (titik partikel, bukan hati biasa).
- **Tuntas Celebration**: Ripple burst dan animasi status saat masalah terselesaikan.
- **Chip & Tabs**: Sliding active indicator pill (`layoutId`).
- **Physical Feel**: Tombol memiliki micro-scale tap feedback (`active:scale-[0.98]`).
- **Accessibility**: Mendukung penuh `prefers-reduced-motion: reduce`.
