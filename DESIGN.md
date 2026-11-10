---
name: TITIK. Kebun Raya Glass
version: 5.0.0
description: "Botani green identity in frosted glass. Panels are translucent layers with a lit edge, floating over a forest-green aurora. Deep forest is the brand, lime is the one accent."
---

# TITIK. Design System: Kebun Raya Glass

Keeps the Kebun Raya (Bogor botanical garden) green identity from v4 and replaces its flat sage fills. Surfaces, insets and the page were all within a few percent of each other, so screens blended together. Glass fixes that by giving every layer its own tone, blur and edge. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

Reference: a frosted-panel dashboard (large radii, light 1px edges, soft depth, one bright accent on dark). Used as inspiration for the technique only. The palette, type and layout stay TITIK's.

## Principles
1. **Green is the brand.** Backdrop, sidebar and buttons are forest green in both themes. Neutrals lean sage, never grey.
2. **Layers, not fills.** Three layers, always distinguishable: **panel** (blurred glass, `bg-surface`), **inset** (flat tint for chips and hover, `bg-surface-2`), **well** (recessed tint for inputs, `bg-canvas`). A chip on a panel and a field in a panel must never share a tone.
3. **Glass needs something to refract.** The fixed aurora (`body::before`) gives the blur colour to work on. Brand greens plus the lime accent only. No purple, no blue.
4. **One accent.** Lime marks the active nav icon, the sidebar "Buat Laporan" action and live dots. It is not body UI.
5. **Status is semantic.** `--st-baru`, `--st-ditindak`, `--st-tuntas`, `--st-ditolak`, always with words, never colour alone.
6. **Real data only.** No seeded people, budgets, statistics or simulated replies. Empty, loading and error states exist for every list.

### Recorded decisions (antislop)
- **Broad glass is an owner override of R-10** (blur on sidebar, cards, dialogs and bars together). The owner asked for it explicitly after seeing the reference. Guard rails that stay: contrast 4.5:1 (R-25), near-opaque tone for dialogs and menus, glass sidebar kept dark so its text stays above 7:1, `prefers-reduced-motion` respected.
- **Aurora gradient (R-01):** purpose is giving the blur something to refract, in brand greens only. It is one fixed layer, not a decoration on every section.
- **Radii (R-11):** panels 24 to 28px, controls 10 to 14px, avatars and dots round. Pills are not the default shape.
- **Shadow (R-12):** depth shadow only on `.glass`, `.panel`, `titik-card-elevated-lg`, the sidebar and floating bars. Plain `bg-surface` gets the lit top edge but no drop shadow.

## Tokens (see `src/index.css`)
- Backdrop: `--base`, `--aurora-a`, `--aurora-b`, `--aurora-c`
- Layers: `surface` (panel), `surface-2` (inset), `canvas` (well), `surface-solid` (near-opaque, dialogs), `line`, `line-soft`
- Glass recipe: `--glass`, `--glass-strong`, `--glass-edge`, `--glass-hi`, `--glass-blur`, `--glass-shadow`
- Text: `ink`, `ink-2`, `ink-3` (all >= 4.5:1 on panel and inset in both themes); `on-ink` for text on a solid `bg-ink` chip
- Brand: `brand`, `brand-hover`, `brand-soft`, `on-brand`; accent `lime`, `on-lime`
- Sidebar: `side`, `side-2`, `side-ink`, `side-ink-2`, `side-line`
- Use the Tailwind names (`bg-surface`, `text-ink-2`, `bg-side`), never raw hex.
- Radius scale: Tailwind `rounded-lg` 12px, `rounded-xl` 16px, `rounded-2xl` 24px, `rounded-3xl` 28px.

## How glass is applied
- `bg-surface` (and `dark:bg-surface`) already carries blur, saturation and the lit top edge, so existing markup became glass without per-view edits. A bordered `bg-surface` gets the bright `--glass-edge` instead of a grey hairline.
- Explicit classes for new work: `.glass` (panel), `.glass-strong` (menus, sheets, bars over busy content), `.glass-media` (over photo or video, fixed dark tint), `.panel` (default container).
- Inside any `fixed inset-0` overlay, panels switch to `--surface-solid`, so dialog text never competes with the page behind it.
- `bg-surface-2` and `bg-canvas` never blur. Only panels do, to keep blur counts low and avoid blur inside blur.
- Primitives `titik-pill-btn`, `titik-pill-input`, `titik-pill-track`, `titik-pill-tab` live in `@layer components`, so a utility on the element always wins.

## Dropdowns
- Use `Select` from `src/components/common/Select.tsx`, never a native `<select>`: the browser draws its popup in OS colours, outside the glass theme.
- It takes `<option>` children or an `options` array. `onChange` gets the value, not an event. `size="sm"` for dense rows, and `className` for width (`sm:w-44`), not for padding or colour.
- Trigger is a well (`--canvas`, same as `titik-pill-input`). Menu is near-opaque glass (`--surface-solid`) in a portal on `body`, so modals never clip it. It flips upward near the viewport bottom.
- Selected option is `--brand-soft` with a check, the keyboard or hover option is `--surface-2`. Tokens only, so the theme switch needs no extra rules. Styles are `.titik-select`, `.titik-menu`, `.titik-option` in `src/index.css`.
- Escape closes only the menu (it stops propagation, because modals close on a window-level Escape). Focus stays on the trigger, so modal focus traps keep working.

## Type
- Display: Bricolage Grotesque (headings, numbers). UI: Figtree. Report IDs: IBM Plex Mono.
- Sentence-case labels. No wide-tracked uppercase.

## Layout
- Sidebar is a floating glass rail inset 12px from the viewport edge, rounded 28px: icon rail from `lg`, labelled from `xl`. On Beranda, Jelajah, Laporan Saya, Tersimpan and profiles it is wider (320px at `xl`, 496px at `2xl`) and shows a hint under each destination plus a live city summary counted from loaded reports.
- One scroll container only: the viewport. Never give `html` or `body` their own overflow. `body` uses `overflow-x: clip`.
- `body` has no background of its own. The page colour is on `html`, because a body background would paint over the aurora.
- Scrollbars are slim with a transparent track.
- Scrolling pages use `PageShell` / `PageHeader`. `/pesan` and `/admin` are viewport-locked workspaces.
- Report details are a page (`/laporan/:id`), never a drawer.
- Admin portal: header with section tabs (Ringkasan, Validasi, Disposisi, Rekap APBD, Pengguna). The open report is `?r=<id>`.

## Messaging
- Direct messages use the server tables when they exist. When they do not (migration `20261101000001` not applied), threads and messages are kept in `localStorage` (`titik_local_messages_v1`) and the page says so. Local thread ids start with `conv-`.
- "Minta info" (admin) moves a report to `needs_info` and delivers the same note as an `info_request` message.

## Motion
Purpose: show where new content comes from and confirm presses. Nothing decorative loops except the live dot.
- **Entrances** animate `opacity` and `transform` only, with `backwards` fill so no transform lingers afterwards (a lingering transform would trap `fixed` children). Never animate blur.
- `.titik-stagger` on a container: its first eight children rise in 45ms apart. `PageShell` and the conversation list use it. `.titik-rise` (one block) and `.titik-pop` (panel, with a slight scale) are for single elements.
- Dialogs and sheets: any `fixed inset-0` overlay fades its scrim and pops its panel automatically.
- **Interaction:** every `a`, `button`, field and `[role=tab]` transitions colour, background, border, shadow, opacity, `translate` and `scale` over 160ms (specific properties, never `all`). It sits in the base layer, so a `transition-*` utility on the element wins. Pressed buttons scale to 0.98. Panels that are links brighten on hover instead of moving.
- Scrolling is smooth (`scroll-behavior`). The aurora is static.
- **Fallbacks:** under 1024px the blur radius drops to 14px. `prefers-reduced-transparency` and browsers without `backdrop-filter` get solid surfaces. `prefers-reduced-motion` zeroes every duration globally.

## Pitfalls (learned)
- **Never use a layer token as a text colour.** `canvas`, `surface` and `surface-2` are translucent, so `text-canvas` on a dark chip rendered dark on dark. Use `text-on-ink` on `bg-ink`, `text-on-brand` on `bg-brand`.
- Do not put a background on `body`: it paints over the aurora.
- Workspaces such as `/pesan` and `/admin` use separate floating glass panels with a gap and 28px radius on desktop, and stay full-bleed single panes on phones. Flush panes split by hard divider lines read as boxed.
