---
name: TITIK. Daylight Editorial Design System
version: 1.0.0
description: "Civic-Tech, Geospatial & Data-Transparency design tokens for TITIK. (Transparansi Infrastruktur, Anggaran & Tindak Komunitas)"
colors:
  canvas: "#F8F9FA"
  canvas-subtle: "#F3F4F6"
  surface: "#FFFFFF"
  surface-hover: "#F9FAFB"
  ink-primary: "#111827"
  ink-secondary: "#4B5563"
  ink-muted: "#6B7280"
  border-hairline: "#E5E7EB"
  border-subtle: "#D1D5DB"
  cta-primary: "#111827"
  cta-hover: "#1F2937"
  accent-emerald: "#0D9488"
  accent-emerald-bg: "#F0FDF4"
  accent-amber: "#D97706"
  accent-amber-bg: "#FFFBEB"
  accent-crimson: "#DC2626"
  accent-crimson-bg: "#FEF2F2"
  accent-cobalt: "#2563EB"
  accent-cobalt-bg: "#EFF6FF"
typography:
  display-hero:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "52px"
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.035em"
  h1:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "36px"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "24px"
    fontWeight: "600"
    lineHeight: "1.25"
    letterSpacing: "-0.025em"
  h3:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.02em"
  body-lead:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "17px"
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: "-0.01em"
  body-default:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "-0.005em"
  label-caps:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "11px"
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  mono-data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "13px"
    fontWeight: "500"
    lineHeight: "1.4"
    fontVariantNumeric: "tabular-nums"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border-hairline}"
    rounded: "{rounded.lg}"
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
  button-primary:
    backgroundColor: "{colors.cta-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    letterSpacing: "-0.01em"
  button-outline:
    backgroundColor: "transparent"
    border: "1px solid {colors.border-hairline}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
---

# TITIK. Design Specification & Visual Direction

## Overview
TITIK. is a high-trust Civic-Tech, Regional Public Services Observatory & Participatory Accountability platform for the **Multimedia In Action (MIA) 2026 - Web In Action (WIA)** competition under the theme *"Designing Digital Futures – Powering Public Transparency"*.

The visual language follows a **daylight editorial aesthetic**: clean alabaster surfaces, tactile showcase cards, authoritative ink typography, and high-contrast accountability markers. It deliberately rejects dark-mode clichés, purple glows, and chaotic pill soup.

## Colors
- **Canvas Base (`#F8F9FA`):** An architectural alabaster canvas that evokes official public records and civic broadsheets without harsh white glare.
- **Card Surface (`#FFFFFF`):** Crisp pure white card elevation for maximum optical contrast and readability.
- **Ink Primary (`#111827`):** Authoritative deep charcoal ink for titles, body copy, and primary action anchors.
- **Ink Secondary (`#4B5563`) & Ink Muted (`#6B7280`):** Muted slate tones for metadata, coordinates, agency tags, and timestamps.
- **Semantic "Titik" Accents (Never Neon):**
  - **Forest Emerald (`#0D9488` / `#15803D`):** Verified evidence, completed APBD public projects, and resolved community cases.
  - **Warm Amber (`#D97706`):** Active procurement, committed contractual obligations, and in-progress public works.
  - **Terracotta Crimson (`#DC2626`):** Unresolved citizen issues, urgent public hazards, and flagged budget-to-reality discrepancies.
  - **Editorial Cobalt (`#2563EB`):** Public facility coordinates (Schools, Puskesmas, Drainage corridors, Road networks).

## Typography
- **Primary Interface Type:** `Plus Jakarta Sans` with tight kerning (`-0.03em`) for high-legibility editorial headings and crisp interface text.
- **Tabular Data & Currency:** `JetBrains Mono` / `tabular-nums` for all Indonesian Rupiah (Rp) figures, fiscal percentages, geographic coordinates, and public case IDs.
- **Dot Motif:** The period (`.`) in **TITIK.** serves as the geometric anchor of the design system, reflecting geographic coordinates (`titik koordinat`) and uncompromising accountability.

## Layout & Spacing
- **Editorial Bento Grid:** 12-column grid structure with intentional visual hierarchy, structured showcase cards, and comfortable white space.
- **Peta Titik Split-View:** 55% sticky geospatial map viewport on the left, paired with a 45% filterable public facility feed, 4-tier financial breakdown, and discrepancy radar on the right.
- **5-Second Readability Rule:** Every card, chart bar, and audit trail must be immediately decipherable by an ordinary Indonesian citizen within 5 seconds.

## Elevation & Depth
- Flat matte daylight planes with minimal, whisper-light drop shadows (`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04)`).
- Borders use crisp 1px solid hairlines (`#E5E7EB`).

## Shapes & Radii
- Cards use medium radii (`14px` to `16px`).
- Input controls and buttons use `8px` to `10px`.
- Circular indicators (`•`) are strictly reserved for status dots and geographic pins, avoiding generic pill badge clutter.

## Components
- **Top Navigation Bar:** Sticky frosted alabaster with minimalist **TITIK.** logotype, clear nav links, and obsidian CTA (`+ Tandai Titik Masalah`).
- **Tactile Showcase Cards:** Fanned/tilted presentation of pilot facilities (e.g., SDN 01 Menteng, Puskesmas Bogor Tengah, Drainase Jl. Pajajaran).
- **4-Tier Financial Breakdown:** Approved Allocation (Pagu), Committed Contracts (Terikat Kontrak), Realized Spending (Realisasi), and Potentially Available (Sisa Pagu Belum Terikat) with mandatory methodology disclaimer.
- **Discrepancy Detector:** High-visibility audit cards pairing budget execution percentages against verified citizen problem density.
- **Lapor & Kawal Modal:** Smart reporting flow with auto-detected responsible Dinas, linked APBD budget items, duplicate consolidation ("Suara Prioritas"), and 6-step public audit trail.

## Do's and Don'ts
- **DO** format all currency in Indonesian Rupiah with clear abbreviations (`Rp 450 Jt`, `Rp 1,2 M`).
- **DO** provide data source attribution (`Sumber: Simulasi SIKD / Satu Data Kota Bogor 2026`) and timestamp on every record.
- **DON'T** use purple gradients, cyberpunk dark modes, or glowing neon buttons.
- **DON'T** scatter chaotic pill tags everywhere; use clean typography, subtle dot indicators, and structured rows instead.
- **DON'T** call uncommitted allocation "free money"; always use the official 4-tier budget taxonomy with explicit agency verification disclaimers.

