---
name: TITIK. Kebun Raya
version: 4.0.0
description: "Botani green identity for TITIK. Deep forest green is the brand and the sidebar, sage-tinted paper carries the surfaces, one lime accent marks active and live states. Glass only on layers that float over media."
---

# TITIK. Design System: Kebun Raya

Brings back the Botani green of the original brand (Kebun Raya Bogor) and replaces the grey-beige "Warm Slate" pass, which lost the identity. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

## Principles
1. **Green is the brand.** The sidebar is deep forest (`--side`) in both themes, buttons are forest green (`--brand`), neutrals are tinted toward sage, never grey or beige.
2. **One accent.** Lime (`--lime`) marks the active nav icon, the primary "Buat Laporan" action on the sidebar, and live dots. It is not used for body UI.
3. **Solid by default, glass by exception.** `.glass*` only for layers that float over media or content: video-feed controls, mobile bars, dialogs, sheets.
4. **Status is semantic.** `--st-baru`, `--st-ditindak`, `--st-tuntas`, `--st-ditolak`. They always ship with words, never color alone.
5. **Real data only.** No seeded people, budgets, statistics or simulated replies. Empty, loading and error states exist for every list.

## Tokens (see `src/index.css`)
- Surfaces: `canvas`, `surface`, `surface-2`, `line`, `line-soft`
- Text: `ink`, `ink-2`, `ink-3` (all >= 4.5:1 on their surfaces)
- Brand: `brand`, `brand-hover`, `brand-soft`, `on-brand`; accent `lime`, `on-lime`
- Sidebar: `side`, `side-2`, `side-ink`, `side-ink-2`, `side-line`
- Use the Tailwind names (`bg-surface`, `text-ink-2`, `bg-side`), never raw hex.
- Radius: controls 10px, panels 14 to 20px, sheets 20 to 28px. Pills only for avatars and dots.
- Legacy `.titik-pill-*` primitives live in `@layer components`, so a utility class on the element always overrides them.

## Type
- Display: Bricolage Grotesque (headings, numbers). UI: Figtree. Report IDs: IBM Plex Mono.
- Sentence-case labels. No wide-tracked uppercase.

## Layout
- Sidebar flush left: icon rail from `lg`, labelled from `xl`. On Beranda, Jelajah and Laporan Saya it is wider (320px at `xl`, 496px at `2xl`) and uses the room for a hint under each destination and a live city summary counted from loaded reports.
- One scroll container only: the viewport. Never give `html` and `body` their own overflow. `body` uses `overflow-x: clip`.
- Scrollbars are slim with a transparent track (global rule in `index.css`).
- Scrolling pages use `PageShell` / `PageHeader`. `/pesan` and `/admin` are viewport-locked workspaces.
- Report details are a page (`/laporan/:id`), never a drawer.
- Admin portal: header with section tabs (Ringkasan, Validasi, Disposisi, Rekap APBD, Pengguna). The open report is `?r=<id>` so links and reloads land on it.

## Messaging
- Direct messages use the server tables when they exist. When they do not (migration `20261101000001` not applied), threads and messages are kept in `localStorage` (`titik_local_messages_v1`) and the page says so. Local thread ids start with `conv-`.
- "Minta info" (admin) moves a report to `needs_info` and delivers the same note as an `info_request` message.

## Motion
- The pulsing dot (`.titik-live`) marks live states. Everything else is short transitions. `prefers-reduced-motion` is respected globally.
