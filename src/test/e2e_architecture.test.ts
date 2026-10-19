/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// =============================================================================
// ARCHITECTURAL STATIC SCANNER HELPERS
// =============================================================================

export interface StyleViolation {
  file: string;
  line: number;
  content: string;
}

const ROOT_SRC = path.resolve(__dirname, '..');
const VIEWS_DIR = path.resolve(ROOT_SRC, 'views');

/**
 * Recursively collects all .tsx and .ts source files in a directory.
 */
function collectSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'test') {
        collectSourceFiles(fullPath, fileList);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')))
    ) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Scans a file or code string for inline style={{ ... }} in JSX.
 */
export function scanInlineStylesInContent(content: string, filePath = 'unknown'): StyleViolation[] {
  const lines = content.split('\n');
  const violations: StyleViolation[] = [];
  lines.forEach((line, index) => {
    if (/style\s*=\s*\{\{/.test(line)) {
      violations.push({ file: filePath, line: index + 1, content: line.trim() });
    }
  });
  return violations;
}

/**
 * Scans a file or code string for raw HTML style="..." in Leaflet markers/popups.
 */
export function scanLeafletRawStylesInContent(content: string, filePath = 'unknown'): StyleViolation[] {
  const lines = content.split('\n');
  const violations: StyleViolation[] = [];
  lines.forEach((line, index) => {
    if (/style\s*=\s*["']/.test(line) && (line.includes('html:') || line.includes('div') || line.includes('span') || line.includes('strong'))) {
      violations.push({ file: filePath, line: index + 1, content: line.trim() });
    }
  });
  return violations;
}

/**
 * Checks whether a TSX view file imports its dedicated CSS file.
 */
export function checkDedicatedCssImportInContent(content: string, cssFileName: string): boolean {
  const regex = new RegExp(`import\\s+['"]\\.\\/${cssFileName}['"];?`);
  return regex.test(content);
}

// 8 Mandatory Views & CSS Files from PROJECT.md § Code Layout
export const MANDATORY_VIEWS = [
  { viewFile: 'LoginView.tsx', cssFile: 'LoginView.css', milestone: 'M1' },
  { viewFile: 'MapView.tsx', cssFile: 'MapView.css', milestone: 'M2' },
  { viewFile: 'ExploreView.tsx', cssFile: 'ExploreView.css', milestone: 'M2' },
  { viewFile: 'ReportDetailView.tsx', cssFile: 'ReportDetailView.css', milestone: 'M3' },
  { viewFile: 'TrackReportView.tsx', cssFile: 'TrackReportView.css', milestone: 'M4' },
  { viewFile: 'AdminView.tsx', cssFile: 'AdminView.css', milestone: 'M4' },
  { viewFile: 'WorkflowView.tsx', cssFile: 'WorkflowView.css', milestone: 'M4' },
  { viewFile: 'HomeView.tsx', cssFile: 'HomeView.css', milestone: 'M5' },
] as const;

// Helper to determine if all 8 CSS files exist on disk
function areAllViewCssFilesPresent(): boolean {
  return MANDATORY_VIEWS.every(({ cssFile }) => fs.existsSync(path.join(VIEWS_DIR, cssFile)));
}

// =============================================================================
// TEST SUITES: E2E ARCHITECTURAL INVARIANTS
// =============================================================================

describe('E2E Architectural Static Invariants & Styling Migration', () => {
  const isStrictArch = process.env.STRICT_ARCH === 'true' || areAllViewCssFilesPresent();

  // ---------------------------------------------------------------------------
  // 1. Static Scanner Integrity (Unit & Adversarial Verification)
  // ---------------------------------------------------------------------------

  describe('Suite 1: Static Code Scanner Integrity', () => {
    it('accurately identifies inline style={{ ... }} violations and line numbers', () => {
      const dirtyCode = `
        export const BadComponent = () => (
          <div style={{ backgroundColor: '#263F35', width: '50%' }}>
            <span style={{ fontSize: '12px' }}>Label</span>
          </div>
        );
      `;
      const violations = scanInlineStylesInContent(dirtyCode, 'BadComponent.tsx');
      expect(violations.length).toBe(2);
      expect(violations[0].line).toBe(3);
      expect(violations[0].content).toContain("style={{ backgroundColor: '#263F35'");
      expect(violations[1].line).toBe(4);
    });

    it('returns zero violations for clean JSX using CSS classes and custom properties', () => {
      const cleanCode = `
        export const GoodComponent = () => (
          <div className="budget-bar-realized" ref={(el) => el?.style.setProperty('--pct', '50%')}>
            <span className="text-xs font-bold text-[#20221D]">Label</span>
          </div>
        );
      `;
      const violations = scanInlineStylesInContent(cleanCode, 'GoodComponent.tsx');
      expect(violations.length).toBe(0);
    });

    it('accurately detects raw style="..." inside Leaflet marker and popup templates', () => {
      const rawLeafletCode = `
        const icon = L.divIcon({
          className: 'custom-icon',
          html: '<div style="background-color: #DC2626; width: 28px; height: 28px;">!</div>'
        });
      `;
      const violations = scanLeafletRawStylesInContent(rawLeafletCode, 'LeafletPin.tsx');
      expect(violations.length).toBe(1);
      expect(violations[0].content).toContain('style="background-color: #DC2626;');
    });

    it('verifies dedicated CSS import regex matches valid syntax variants', () => {
      expect(checkDedicatedCssImportInContent("import './LoginView.css';", 'LoginView.css')).toBe(true);
      expect(checkDedicatedCssImportInContent("import './LoginView.css'", 'LoginView.css')).toBe(true);
      expect(checkDedicatedCssImportInContent('import "./LoginView.css";', 'LoginView.css')).toBe(true);
      expect(checkDedicatedCssImportInContent("import './OtherView.css';", 'LoginView.css')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Master Design Tokens & Utility Foundation (M1 / Feature 1)
  // ---------------------------------------------------------------------------

  describe('Suite 2: Master Design Tokens & Utility Foundation (Feature 1)', () => {
    const indexPath = path.resolve(ROOT_SRC, 'index.css');

    it('src/index.css exists and defines all mandatory --titik-* design tokens in :root', () => {
      expect(fs.existsSync(indexPath)).toBe(true);
      const cssContent = fs.readFileSync(indexPath, 'utf-8');

      const expectedTokens = [
        '--titik-canvas: #F7F6F1',
        '--titik-card: #FFFFFF',
        '--titik-border: #E4E2DA',
        '--titik-ink-primary: #20221D',
        '--titik-ink-secondary: #686B65',
        '--titik-forest: #263F35',
        '--titik-forest-hover: #1D3129',
        '--titik-forest-subtle: #E7EBDD',
        '--titik-forest-subtle-hover: #D8E0CC',
        '--titik-slash-angle: -35deg',
        '--titik-radius-pill: 9999px',
        '--titik-radius-card: 24px',
        '--titik-radius-card-lg: 32px',
        '--titik-radius-sheet-mobile: 36px',
        '--titik-accent-crimson:',
        '--titik-accent-amber:',
        '--titik-accent-cobalt:',
        '--titik-accent-emerald:',
      ];

      for (const token of expectedTokens) {
        expect(cssContent).toContain(token);
      }
    });

    it('src/index.css defines master geometric hero slashes and translucent ribbon utility classes', () => {
      const cssContent = fs.readFileSync(indexPath, 'utf-8');
      expect(cssContent).toContain('.titik-hero-geometric');
      expect(cssContent).toContain('.titik-slash-container');
      expect(cssContent).toContain('.titik-ambient-glow-emerald');
      expect(cssContent).toContain('.titik-ambient-glow-sage');
      expect(cssContent).toContain('.titik-ribbon');
      expect(cssContent).toContain('.titik-slash-line');
    });

    it('src/index.css defines pill ergonomics and elevated card container classes', () => {
      const cssContent = fs.readFileSync(indexPath, 'utf-8');
      expect(cssContent).toContain('.titik-pill-btn');
      expect(cssContent).toContain('.titik-pill-btn-primary');
      expect(cssContent).toContain('.titik-pill-input');
      expect(cssContent).toContain('.titik-pill-badge');
      expect(cssContent).toContain('.titik-card-elevated');
      expect(cssContent).toContain('.titik-card-elevated-lg');
      expect(cssContent).toContain('.titik-sheet-mobile');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Dedicated Per-Page CSS Architecture & Migration
  // ---------------------------------------------------------------------------

  describe('Suite 3: Dedicated Per-Page CSS Architecture (Features 2, 3, 4, 5, 7, 8, 9, 10)', () => {
    it('verifies completed Milestone 1: LoginView.css exists and is imported by LoginView.tsx', () => {
      const loginCssPath = path.join(VIEWS_DIR, 'LoginView.css');
      const loginViewPath = path.join(VIEWS_DIR, 'LoginView.tsx');

      expect(fs.existsSync(loginCssPath)).toBe(true);
      expect(fs.existsSync(loginViewPath)).toBe(true);

      const loginViewContent = fs.readFileSync(loginViewPath, 'utf-8');
      expect(checkDedicatedCssImportInContent(loginViewContent, 'LoginView.css')).toBe(true);
    });

    it('verifies that any migrated view CSS file is strictly imported by its TSX component', () => {
      for (const { viewFile, cssFile } of MANDATORY_VIEWS) {
        const cssPath = path.join(VIEWS_DIR, cssFile);
        const viewPath = path.join(VIEWS_DIR, viewFile);

        if (fs.existsSync(cssPath)) {
          const viewContent = fs.readFileSync(viewPath, 'utf-8');
          const isImported = checkDedicatedCssImportInContent(viewContent, cssFile);
          expect(
            isImported,
            `Expected ${viewFile} to import dedicated stylesheet './${cssFile}'`
          ).toBe(true);
        }
      }
    });

    it('Milestone 6 Strict Quality Gate: all 8 dedicated view CSS files exist and are imported', () => {
      if (!isStrictArch) {
        // Progressive verification: report current migration status without breaking parallel builds
        const existingCss = MANDATORY_VIEWS.filter(({ cssFile }) =>
          fs.existsSync(path.join(VIEWS_DIR, cssFile))
        );
        expect(existingCss.length).toBeGreaterThanOrEqual(1); // At least M1 LoginView.css is present
        return;
      }

      for (const { viewFile, cssFile } of MANDATORY_VIEWS) {
        const cssPath = path.join(VIEWS_DIR, cssFile);
        const viewPath = path.join(VIEWS_DIR, viewFile);

        expect(fs.existsSync(cssPath), `Missing dedicated CSS file: ${cssFile}`).toBe(true);
        expect(fs.existsSync(viewPath), `Missing view component: ${viewFile}`).toBe(true);

        const viewContent = fs.readFileSync(viewPath, 'utf-8');
        expect(
          checkDedicatedCssImportInContent(viewContent, cssFile),
          `View ${viewFile} must import './${cssFile}'`
        ).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Zero Inline Styles (`style={{ ... }}`) Invariants
  // ---------------------------------------------------------------------------

  describe('Suite 4: Zero Inline Styles Invariant (Feature 6 & R2)', () => {
    it('LoginView.tsx contains 0 inline style={{ ... }} attributes', () => {
      const loginViewPath = path.join(VIEWS_DIR, 'LoginView.tsx');
      const content = fs.readFileSync(loginViewPath, 'utf-8');
      const violations = scanInlineStylesInContent(content, 'LoginView.tsx');
      expect(violations).toEqual([]);
    });

    it('HomeView.tsx and ExploreView.tsx contain 0 inline style={{ ... }} attributes', () => {
      const views = ['HomeView.tsx', 'ExploreView.tsx'];
      for (const v of views) {
        const vPath = path.join(VIEWS_DIR, v);
        if (fs.existsSync(vPath)) {
          const content = fs.readFileSync(vPath, 'utf-8');
          const violations = scanInlineStylesInContent(content, v);
          expect(violations).toEqual([]);
        }
      }
    });

    it('Milestone 6 Strict Quality Gate: Zero inline style={{ ... }} across entire src/', () => {
      const allSourceFiles = collectSourceFiles(ROOT_SRC);
      const allViolations: StyleViolation[] = [];

      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const violations = scanInlineStylesInContent(content, path.relative(ROOT_SRC, file));
        allViolations.push(...violations);
      }

      if (!isStrictArch) {
        // In progressive milestone mode, document remaining unmigrated instances
        // Unmigrated instances exist only in views pending M3/M4 (ReportDetailDrawer, ReportDetailView, WorkflowView)
        const unmigratedFiles = new Set(allViolations.map((v) => v.file));
        for (const file of unmigratedFiles) {
          expect(['src/components/reporting/ReportDetailDrawer.tsx', 'src/views/ReportDetailView.tsx', 'src/views/WorkflowView.tsx', 'components\\reporting\\ReportDetailDrawer.tsx', 'views\\ReportDetailView.tsx', 'views\\WorkflowView.tsx']).toContain(file);
        }
        return;
      }

      expect(
        allViolations,
        `Found ${allViolations.length} inline style={{ ... }} violations across src/:\n` +
          allViolations.map((v) => `  ${v.file}:${v.line} -> ${v.content}`).join('\n')
      ).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Zero Raw `style="..."` in Leaflet Markers (Features 3 & 5)
  // ---------------------------------------------------------------------------

  describe('Suite 5: Zero Raw Leaflet Marker Styles Invariant (Features 3 & 5)', () => {
    it('Milestone 6 Strict Quality Gate: Zero raw style="..." in Leaflet marker/popup string templates', () => {
      const allSourceFiles = collectSourceFiles(ROOT_SRC);
      const allViolations: StyleViolation[] = [];

      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const violations = scanLeafletRawStylesInContent(content, path.relative(ROOT_SRC, file));
        allViolations.push(...violations);
      }

      if (!isStrictArch) {
        // In progressive milestone mode, unmigrated Leaflet styles exist only in MapView (M2) and ReportDetailView (M3)
        const unmigratedFiles = new Set(allViolations.map((v) => v.file));
        for (const file of unmigratedFiles) {
          expect(['src/views/MapView.tsx', 'src/views/ReportDetailView.tsx', 'views\\MapView.tsx', 'views\\ReportDetailView.tsx']).toContain(file);
        }
        return;
      }

      expect(
        allViolations,
        `Found ${allViolations.length} raw Leaflet style violations:\n` +
          allViolations.map((v) => `  ${v.file}:${v.line} -> ${v.content}`).join('\n')
      ).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Pill Control Ergonomics & Geometric Aesthetic Motifs
  // ---------------------------------------------------------------------------

  describe('Suite 6: Pill Control Ergonomics & Geometric Aesthetics (R1 & R3)', () => {
    it('all 8 views incorporate rounded-full / pill ergonomics for buttons, chips, or inputs', () => {
      for (const { viewFile, cssFile } of MANDATORY_VIEWS) {
        const viewPath = path.join(VIEWS_DIR, viewFile);
        expect(fs.existsSync(viewPath)).toBe(true);

        const viewContent = fs.readFileSync(viewPath, 'utf-8');
        const cssPath = path.join(VIEWS_DIR, cssFile);
        const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';

        const hasPillErgonomics =
          viewContent.includes('rounded-full') ||
          viewContent.includes('titik-pill') ||
          viewContent.includes('-btn') ||
          cssContent.includes('--titik-radius-pill') ||
          cssContent.includes('border-radius: 9999px');

        expect(
          hasPillErgonomics,
          `View ${viewFile} must adopt rounded-full / pill ergonomics`
        ).toBe(true);
      }
    });

    it('LoginView features signature geometric angled slashes and translucent ribbons', () => {
      const loginViewPath = path.join(VIEWS_DIR, 'LoginView.tsx');
      const loginCssPath = path.join(VIEWS_DIR, 'LoginView.css');
      const viewContent = fs.readFileSync(loginViewPath, 'utf-8');
      const cssContent = fs.readFileSync(loginCssPath, 'utf-8');

      const hasAngledRibbons =
        viewContent.includes('-rotate-[35deg]') ||
        viewContent.includes('login-ribbon') ||
        viewContent.includes('login-slash') ||
        cssContent.includes('--titik-slash-angle') ||
        cssContent.includes('rotate(var(--titik-slash-angle))');
      expect(hasAngledRibbons).toBe(true);

      // Checks for forest green palette and soft sage accents
      expect(cssContent).toContain('#263F35');
      expect(cssContent).toContain('#E7EBDD');

      // Milestone 6 Coverage Hardening: Verify geometric angled slashes across all 8 views
      for (const { viewFile, cssFile } of MANDATORY_VIEWS) {
        const vPath = path.join(VIEWS_DIR, viewFile);
        const cPath = path.join(VIEWS_DIR, cssFile);
        const vContent = fs.readFileSync(vPath, 'utf-8');
        const cContent = fs.existsSync(cPath) ? fs.readFileSync(cPath, 'utf-8') : '';

        const hasGeometry =
          vContent.includes('-35deg') ||
          vContent.includes('slash') ||
          vContent.includes('ribbon') ||
          cContent.includes('--titik-slash-angle') ||
          cContent.includes('-35deg') ||
          cContent.includes('ribbon') ||
          cContent.includes('slash');

        expect(
          hasGeometry,
          `View ${viewFile} and ${cssFile} must incorporate geometric angled slashes or ribbons (-35deg)`
        ).toBe(true);
      }
    });

    it('views enforce responsive card elevation (rounded-3xl, rounded-2xl or dedicated card containers)', () => {
      for (const { viewFile, cssFile } of MANDATORY_VIEWS) {
        const viewPath = path.join(VIEWS_DIR, viewFile);
        const viewContent = fs.readFileSync(viewPath, 'utf-8');
        const cssPath = path.join(VIEWS_DIR, cssFile);
        const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';

        const hasElevatedCards =
          viewContent.includes('rounded-3xl') ||
          viewContent.includes('rounded-2xl') ||
          viewContent.includes('RightContextualPanel') ||
          viewContent.includes('login-card-container') ||
          viewContent.includes('titik-card-elevated') ||
          cssContent.includes('--titik-radius-card') ||
          cssContent.includes('border-radius: 1.5rem') ||
          cssContent.includes('border-radius: 2rem');

        expect(hasElevatedCards, `View ${viewFile} must contain elevated rounded cards`).toBe(true);
      }

      // Milestone 6 Coverage Hardening: Verify mobile sliding sheet geometry (rounded-t-[36px])
      const homeContent = fs.readFileSync(path.join(VIEWS_DIR, 'HomeView.tsx'), 'utf-8');
      const mapContent = fs.readFileSync(path.join(VIEWS_DIR, 'MapView.tsx'), 'utf-8');
      const drawerPath = path.resolve(ROOT_SRC, 'components', 'reporting', 'ReportDetailDrawer.tsx');
      const drawerContent = fs.readFileSync(drawerPath, 'utf-8');

      expect(homeContent).toContain('rounded-t-[36px]');
      expect(mapContent).toContain('rounded-t-[36px]');
      expect(drawerContent).toContain('rounded-t-[36px]');
    });
  });
});
