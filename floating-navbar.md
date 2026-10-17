# Task Plan: Floating Island Navbar with Smart Auto-Hide & Mobile Floating Dock

## Status: Planning & Ready for Implementation
**Design System:** TITIK. Daylight Editorial (DESIGN.md)  
**Primary Agent:** `frontend-specialist`  
**Primary Skill:** `frontend-design`

---

## 1. Objectives & User Specifications
- **Desktop (≥ 1024px):** Unified floating island header detached from viewport boundaries (`top-4`, inset margins, rounded-2xl corners, frosted glassmorphism `#FAF9F6/90` with `backdrop-blur-md`, subtle hairline border `#E5E4DF`, and daylight drop shadow).
- **Scroll Behavior:** Smart auto-hide. Smoothly glides up out of view on scroll down (`translate-y-[-150%] opacity-0`), glides back in on scroll up or when near the top (`translate-y-0 opacity-100`). Suspends auto-hide when dropdowns or modals are open.
- **Mobile (< 1024px):** 
  - Floating top brand capsule (Logo + Search button + Report CTA).
  - Floating bottom ergonomic thumb dock with smart auto-hide (Home, Peta, Anggaran, Lapor, and Menu to open drawer).
  - Safe area handling: `env(safe-area-inset-bottom)`.
- **Page Layout Clearance:** Proper top clearance on standard pages (`pt-20 sm:pt-24`) and bottom clearance for mobile dock (`pb-24`), keeping `/peta` full geospatial view smooth.

---

## 2. Affected Files
1. `src/components/Navbar.tsx`:
   - Add scroll direction detection hook (`useScrollDirection` or internal state) with hysteresis threshold.
   - Structure desktop unified floating island with auto-hide classes.
   - Structure mobile top floating brand bar and mobile bottom floating thumb dock.
   - Maintain full keyboard accessibility (Escape, Cmd+K), dropdown popovers, and cascading navigation modal.
2. `src/styles/components/navbar.css`:
   - Floating island container utility classes.
   - Glassmorphic daylight frosted background tokens.
   - Smooth CSS transitions (`transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease`).
   - Mobile floating bottom dock styles with safe-area padding.
3. `src/App.tsx` & Page Views:
   - Ensure main container and view shells have appropriate top/bottom padding to avoid content occlusion while maintaining seamless map display.

---

## 3. Verification Criteria
- [ ] Desktop navbar floats cleanly with uniform margins and blur.
- [ ] Scrolling down hides the navbar smoothly; scrolling up reveals it immediately.
- [ ] Dropdowns hover and submenus operate without visual glitching or clipping.
- [ ] Mobile bottom dock appears comfortably with icons for Beranda, Peta, Anggaran, Lapor, and Drawer trigger.
- [ ] Mobile bottom dock auto-hides on scroll down and reappears on scroll up.
- [ ] No regression on Cmd+K search, SIKD modal, or Report modal.
- [ ] All code conforms to Clean Code and TITIK Daylight Editorial Design tokens (no purple, crisp hairline borders).

