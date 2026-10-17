# Task Plan: Modern Daylight Editorial Landing Page Redesign

## Status: Planning & Ready for Implementation
**Design System:** TITIK. Daylight Editorial (DESIGN.md)  
**Primary Agent:** `frontend-specialist`  
**Primary Skill:** `frontend-design`

---

## 1. Problem Identification (From User Screenshots)
1. **Muddy Pale-Green Wash:** The entire page currently uses a dated mint-green canvas (`#EAF3E8`, `#F5FAF3`, `#E5EFE3`, `#D3E1D1`) which severely lowers optical contrast, conflicts with `DESIGN.md` tokens, and looks like an early-2000s brochure.
2. **Generic Facility Cards:** 4 flat rectangular cards with dark image overlays, low contrast metadata, and lack of visual progress or tactile interaction.
3. **Wall-of-Text Monthly Digest:** Large text block with plain, generic stat boxes lacking newsroom/editorial punch.
4. **Static 4-Column Resolution Stages:** A rigid, disconnected 4-column box with no pipeline feel, visual momentum, or milestone progression.
5. **Monotonous 4-Tier Budget Boxes:** 4 washed-out green boxes with identical visual weight and no proportional fiscal stack visualization.

---

## 2. Modern Daylight Editorial Architecture
1. **Canvas & Surfaces:**
   - Base canvas: Architectural alabaster `#F8F9FA` (clean, official civic broadsheet tone).
   - Surfaces: Crisp `#FFFFFF` card elevation with 1px hairline border `#E5E7EB` and subtle daylight drop shadow (`0 4px 20px -2px rgba(0, 0, 0, 0.04)`).
   - Accents: Forest Emerald `#0D9488`, Warm Amber `#D97706`, Terracotta Crimson `#DC2626`, Editorial Cobalt `#2563EB`, Ink Primary `#111827`.
2. **Public Facility Showcase (Section 2):**
   - Redesigned tactile cards with subtle hover lift (`translate-y-[-2px]`), rounded-2xl geometry, sector tag, crisp tabular budget tag, condition status pill with glowing dot, and a proportional budget execution bar (`danaTerikatKontrak / paguAnggaran`).
   - Quick sector filter chips or badge pill strip for instant sector filtering.
3. **High-Impact Newsroom Monthly Digest (Section 3):**
   - Editorial masthead layout: Period badge, authoritative headline, pull-quote summary.
   - Interactive 3-card telemetry ledger with visual percentage gauges, micro-indicators, and direct audit insights.
4. **Connected Pipeline Stepper (Section 4):**
   - Connected 4-stage pipeline with milestone badges, status numbers (`JetBrains Mono`), progressive connection line (`100% -> 70% -> 50% -> 27%`), and responsive mobile vertical timeline.
5. **Proportional Fiscal Stack & 4-Tier Budget Breakdown (Section 5):**
   - Visual proportional stacked bar (Pagu, Terikat Kontrak, Realisasi, Sisa Belum Terikat) demonstrating where public funds actually sit.
   - 4 distinct tier cards with clear hierarchical styling, color-coded status chips, and official Permendagri No. 77/2020 legal citation.

---

## 3. Files to Update
- `src/styles/views/landing.css`: Update classes to remove all green-wash variables, replace with crisp daylight tokens, add pipeline styles, and tactile elevation.
- `src/views/LandingView.tsx`: Overhaul JSX structure with modern bento hierarchy, connected pipeline stepper, tactile facility cards, and proportional budget stack.

---

## 4. Verification Checklist
- [ ] No green swamp tint (`#EAF3E8`, `#D3E1D1`, `#F5FAF3`, `#E5EFE3`) remains on the page.
- [ ] Background is clean architectural alabaster (`#F8F9FA`) and cards are crisp white (`#FFFFFF`) with 1px `#E5E7EB` borders.
- [ ] Facility cards show image, sector badge, budget pill, condition status dot, and execution progress bar with smooth hover lift.
- [ ] Monthly digest renders as an authoritative editorial news ledger with 3 telemetry metric cards.
- [ ] 4-stage report resolution flows as a connected pipeline on desktop and responsive vertical timeline on mobile.
- [ ] 4-tier budget includes proportional visual gauge and clear distinction between contract commitments vs free funds.
- [ ] Zero TypeScript or Vite build errors.
