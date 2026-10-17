# Task Plan: Comprehensive Dynamic Light/Dark Theme Overhaul

## Status: Planning & Ready for Implementation
**Design System:** TITIK. Daylight & Midnight Editorial (DESIGN.md)  
**Primary Agent:** `frontend-specialist`  
**Primary Skills:** `frontend-design`, `clean-code`, `antislop-ui`

---

## 1. Specifications & User Choices
- **Aesthetic:** Obsidian & Slate Midnight.
  - Light: `#FAF9F6` / `#F8F9FA` canvas, `#FFFFFF` cards, `#E5E7EB` hairline borders, `#111827` ink.
  - Dark: `#0B0F17` obsidian canvas, `#151D2A` dark slate surfaces, `#243042` hairline borders, `#F9FAFB` crisp white ink.
  - Semantic Status Accents: Emerald `#0D9488` / `#14B8A6`, Amber `#D97706` / `#F59E0B`, Crimson `#DC2626` / `#EF4444`, Cobalt `#2563EB` / `#3B82F6`.
- **Theme Persistence:** System auto-detect (`prefers-color-scheme`) on initial visit, with instant toggle saved to `localStorage.getItem('titik-theme')`.
- **Map Basemap:** Dynamically switches CARTO tiles between **Positron (`light_all`)** and **Dark Matter (`dark_all`)**.
- **Controls & Placement:** Seamless Sun/Moon toggle button in desktop floating island, mobile top capsule, and modal navigation rail.
- **Data Visualizations:** Recharts dynamically adapts grid strokes (`#243042`), tooltip backgrounds (`#151D2A`), and text colors.

---

## 2. Implementation Steps
1. **Tokens & Tailwind v4 Custom Variant:**
   - Add `@custom-variant dark (&:where(.dark, .dark *));` to `src/index.css`.
   - Update `src/styles/tokens.css` with `.dark` CSS custom properties.
2. **Context State (`src/context/TitikContext.tsx`):**
   - Add `theme: 'light' | 'dark'` and `toggleTheme: () => void`.
   - Handle initialization from `localStorage` or `window.matchMedia`.
   - Update `document.documentElement.classList` on change.
3. **Interactive Map Adaptation (`src/components/InteractiveMap.tsx`):**
   - Link CARTO tile style to `theme`: `light_all` in light mode, `dark_all` in dark mode.
4. **Navbar & Toggle Integration (`src/components/Navbar.tsx` & `navbar.css`):**
   - Add Sun / Moon toggle icon in desktop floating island, mobile capsule, and rail.
   - Add dark styles for island, pill bar, popovers, and mobile dock.
5. **Layouts & Modals:**
   - Update `src/App.tsx`, `Footer.tsx`, and `Modal.tsx` with dark classes.
6. **Views Adaptation:**
   - Update `LandingView.tsx` and `landing.css`.
   - Update `ObservatoryView.tsx`, `BudgetView.tsx` (Recharts), `FacilitiesView.tsx`, `FacilityDetailView.tsx`, `DiscrepancyView.tsx`, `ReportView.tsx`.
7. **Verification:**
   - Run `npm run build` and `npm run lint`.
   - Verify dynamic toggle, map basemap swap, and zero style breakage.

