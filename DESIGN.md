---
name: TITIK. Editorial Civic Design System
version: 2.0.0
description: "High-craft Civic-Tech, Geospatial & Data-Transparency design tokens for TITIK. (Transparansi Infrastruktur, Anggaran & Tindak Komunitas) powered by taste-skill anti-slop guidelines."
colors:
  canvas-light: "#FAF9F6"
  canvas-subtle-light: "#F3F2ED"
  surface-light: "#FFFFFF"
  surface-hover-light: "#F7F6F2"
  canvas-dark: "#0A0E17"
  canvas-subtle-dark: "#101622"
  surface-dark: "#141C2B"
  surface-hover-dark: "#1B2436"
  ink-primary-light: "#0F172A"
  ink-secondary-light: "#475569"
  ink-muted-light: "#64748B"
  ink-primary-dark: "#F8FAFC"
  ink-secondary-dark: "#94A3B8"
  ink-muted-dark: "#64748B"
  border-hairline-light: "#E5E4DF"
  border-subtle-light: "#D8D6CE"
  border-hairline-dark: "#243042"
  border-subtle-dark: "#334155"
  cta-primary-light: "#0F172A"
  cta-hover-light: "#1E293B"
  cta-primary-dark: "#0D9488"
  cta-hover-dark: "#0F766E"
  accent-teal: "#0D9488"
  accent-teal-subtle: "rgba(13, 148, 136, 0.12)"
  accent-amber: "#D97706"
  accent-amber-subtle: "rgba(217, 119, 6, 0.12)"
  accent-crimson: "#E11D48"
  accent-crimson-subtle: "rgba(225, 29, 72, 0.12)"
  accent-cobalt: "#2563EB"
  accent-cobalt-subtle: "rgba(37, 99, 235, 0.12)"
typography:
  display-hero:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3.75rem)"
    fontWeight: "800"
    lineHeight: "1.08"
    letterSpacing: "-0.035em"
  h1:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 2.75rem)"
    fontWeight: "700"
    lineHeight: "1.15"
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.025em"
  h3:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.015em"
  body-lead:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: "400"
    lineHeight: "1.65"
  body-default:
    fontFamily: "Poppins, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: "400"
    lineHeight: "1.6"
  label-caps:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: "600"
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  mono-data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: "500"
    fontVariantNumeric: "tabular-nums"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  xxl: "56px"
components:
  card:
    backgroundColor: "{colors.surface-light}"
    border: "1px solid {colors.border-hairline-light}"
    rounded: "{rounded.lg}"
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)"
  button-primary:
    backgroundColor: "{colors.cta-primary-light}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 22px"
    letterSpacing: "-0.01em"
  button-outline:
    backgroundColor: "transparent"
    border: "1px solid {colors.border-hairline-light}"
    textColor: "{colors.ink-primary-light}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
---

# TITIK. Design Specification (v2.0 — Taste-Skill Overhaul)

## 1. Overview & Visual Philosophy
TITIK. is a high-trust Civic-Tech, Regional Public Services Observatory & Participatory Budget Accountability platform for **Multimedia In Action (MIA) 2026 - Web In Action (WIA)**.

The overhauled visual language merges **Investigative Civic Editorial (`editorial-report`)** with **Precision Instrument Telemetry (`quiet-instrument`)**:
- **Tactile broadsheet canvas**: Natural alabaster paper (`#FAF9F6`) in daylight mode and deep obsidian slate (`#0A0E17`) in midnight mode.
- **Dramatic typographic contrast**: Bold modernist grotesque sans paired with expressive editorial italics (`Instrument Serif`) and monospaced tabular data (`JetBrains Mono`).
- **Anti-slop enforcement**: No generic 3-card feature templates with icons in circles; no violet/neon glows; no hollow significance inflation.

## 2. Color System
- **Daylight Canvas (`#FAF9F6`)**: Architectural warm paper ground that reduces eye strain and evokes official investigative reports.
- **Midnight Canvas (`#0A0E17`)**: Deep obsidian dark ground with crisp slate cards (`#141C2B`).
- **Primary Ink**: `#0F172A` (Daylight) / `#F8FAFC` (Midnight).
- **Secondary Ink**: `#475569` (Daylight) / `#94A3B8` (Midnight).
- **Semantic Accents (High-Contrast, Non-Neon)**:
  - **Forest Teal (`#0D9488`)**: Verified civic evidence, resolved community issues, completed public works.
  - **Signal Amber (`#D97706`)**: Committed APBD contracts, active procurement, in-progress civic actions.
  - **Crimson Alert (`#E11D48`)**: Unresolved citizen defects, critical infrastructure hazards, budget discrepancies.
  - **Civic Cobalt (`#2563EB`)**: Public facility geospatial coordinates (Schools, Health Centers, Primary Drainage).

## 3. Typography Architecture
1. **Headline Discipline**: Strict ban on mixed-family serif italics in headlines. Titles use a single, confident architectural grotesque sans (`Poppins`) with high-contrast semantic accents (e.g., `#0D9488` for positive punchlines, `#DC2626` for anomalies).
2. **Restrained Scale**: Hero headlines are sized intentionally (`clamp(2rem, 4.5vw, 3.75rem)`) so that CTAs, search bars, and the financial ledger fit within the desktop viewport without excessive scrolling.
3. **Data Ledger**: Monospaced tabular figures (`JetBrains Mono`) for all financial sums (Rp), fiscal percentages, coordinates, and case references (`TITIK-2026-XXXXX`).
4. **Clean Hierarchy**: No floating eyebrow badges or capsule pills cluttering headings. Headlines and descriptions speak directly with intentional whitespace and clean typography.

## 4. Layout & Grid Rules
- **Structural 12-Column Grid**: Strict horizontal and vertical baselines with 1px solid hairline dividers (`#E5E4DF` light, `#243042` dark).
- **Whitespace with Intent**: Sections breathe with 48px–80px spacing instead of separating everything with boxes or pills.
- **Mobile First Rhythms**: Responsive collapse from desktop side-by-side bento layouts to stacked editorial narrative blocks without horizontal overflow.

## 5. Strict Anti-Slop Banned Patterns
- ❌ No eyebrow badges, pill badges, or decorative capsule tags cluttering headlines and cards.
- ❌ No mixed-family serif italics in titles or headings (e.g. no Instrument Serif inserted into sans headlines).
- ❌ No oversized headline scales that push CTAs below the initial desktop viewport fold.
- ❌ No generic 3-column feature cards with colorful rounded icon circles.
- ❌ No purple or cyberpunk gradient fills.
- ❌ No artificial low-contrast gray text on gray backgrounds.
- ❌ No decorative pill badge soup cluttering headings.
- ❌ No simulated data without explicit source attribution (`Sumber: SIKD Kemendagri & Portal Satu Data 2026`).
