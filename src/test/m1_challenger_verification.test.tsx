import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BadgeCheck } from 'lucide-react';
import { Report, ReportStatus } from '../types/domain';
import { MOCK_REPORTS } from '../data/mockCivicData';

const ROOT_SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Mirror the exact JSX expression from src/views/ReportDetailView.tsx:646-656
 */
const EvidenceBadgeOverlay: React.FC<{ report: Partial<Report> }> = ({ report }) => {
  return (
    <div
      data-testid="evidence-badge-overlay"
      className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5"
    >
      {(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified') && (
        <BadgeCheck data-testid="badge-check-icon" className="w-3.5 h-3.5 text-emerald-400" />
      )}
      <span data-testid="evidence-badge-text">
        {(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified')
          ? 'Bukti fisik terverifikasi'
          : 'Bukti media laporan warga'}
      </span>
    </div>
  );
};

describe('Milestone 1 Challenger Empirical Verification Suite', () => {
  // ===========================================================================
  // 1. ADVERSARIAL REPO-WIDE AUDIT FOR MODULO % 3 AND FAKE SHORTCUTS
  // ===========================================================================
  describe('Adversarial Codebase Audit for Modulo Math & Fake Verification', () => {
    it('verifies that no source file outside test suites uses modulo to compute verification', () => {
      const filesToCheck = [
        path.resolve(ROOT_SRC, 'services/accountGenerator.ts'),
        path.resolve(REPO_ROOT, 'scripts/seed-fake-accounts.js'),
        path.resolve(ROOT_SRC, 'context/AuthContext.tsx'),
        path.resolve(ROOT_SRC, 'services/adapters/supabaseAdapter.ts'),
        path.resolve(ROOT_SRC, 'services/adapters/mockAdapter.ts'),
        path.resolve(ROOT_SRC, 'views/ReportDetailView.tsx'),
        path.resolve(ROOT_SRC, 'views/AdminView.tsx'),
        path.resolve(ROOT_SRC, 'views/ProfileView.tsx'),
        path.resolve(ROOT_SRC, 'components/layout/Sidebar.tsx'),
      ];

      for (const filePath of filesToCheck) {
        expect(fs.existsSync(filePath), `File exists: ${filePath}`).toBe(true);
        const code = fs.readFileSync(filePath, 'utf-8');

        // Must not contain modulo used for verification
        expect(code).not.toMatch(/is_?verified\s*:\s*[^,\n]*%/i);
        expect(code).not.toMatch(/%\s*3\s*!==\s*0/i);
        expect(code).not.toMatch(/evidence_verification_status\s*:\s*[^,\n]*%/i);
      }
    });

    it('seeded-accounts.json strictly maintains zero dummy verified citizens', () => {
      const accountsJsonPath = path.resolve(REPO_ROOT, 'seeded-accounts.json');
      expect(fs.existsSync(accountsJsonPath)).toBe(true);
      const accounts = JSON.parse(fs.readFileSync(accountsJsonPath, 'utf-8'));

      expect(accounts.length).toBe(50);
      const verifiedAccounts = accounts.filter((a: any) => a.is_verified === true);
      const unverifiedAccounts = accounts.filter((a: any) => a.is_verified === false);

      // Only the administrator account (account 50) is verified
      expect(verifiedAccounts.length).toBe(1);
      expect(verifiedAccounts[0].role).toBe('admin');
      expect(verifiedAccounts[0].id).toBe('usr-gen-000050');

      // All 49 citizen accounts are unverified
      expect(unverifiedAccounts.length).toBe(49);
      for (const citizen of unverifiedAccounts) {
        expect(citizen.role).toBe('citizen');
        expect(citizen.is_verified).toBe(false);
      }
    });

    it('verifies all MOCK_REPORTS have explicit, authentic evidence_verification_status without modulo patterns', () => {
      expect(MOCK_REPORTS.length).toBeGreaterThanOrEqual(13);

      const verifiedReports = MOCK_REPORTS.filter((r) => r.evidence_verification_status === 'verified');
      const unverifiedReports = MOCK_REPORTS.filter((r) => r.evidence_verification_status === 'unverified');

      // Only 3 reports have verified physical evidence
      expect(verifiedReports.length).toBe(3);
      expect(unverifiedReports.length).toBe(10);

      // Verify that accepting or resolving a report DOES NOT imply verified evidence
      const resolvedReports = MOCK_REPORTS.filter((r) => r.status === 'resolved');
      expect(resolvedReports.length).toBeGreaterThan(0);
      // At least one resolved report has unverified evidence
      const resolvedWithUnverifiedEvidence = resolvedReports.filter(
        (r) => r.evidence_verification_status === 'unverified'
      );
      expect(resolvedWithUnverifiedEvidence.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 2. EMPIRICAL EDGE-CASE TESTING FOR ReportDetailView.tsx EVIDENCE BADGE
  // ===========================================================================
  describe('ReportDetailView Evidence Badge Rendering Edge Cases', () => {
    it('renders BadgeCheck and "Bukti fisik terverifikasi" when evidence_verification_status is "verified"', () => {
      const report: Partial<Report> = {
        evidence_verification_status: 'verified',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).toContain('lucide-badge-check');
      expect(html).toContain('text-emerald-400');
      expect(html).toContain('Bukti fisik terverifikasi');
    });

    it('renders BadgeCheck and "Bukti fisik terverifikasi" when evidenceVerificationStatus (camelCase) is "verified"', () => {
      const report: Partial<Report> = {
        evidenceVerificationStatus: 'verified',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).toContain('lucide-badge-check');
      expect(html).toContain('text-emerald-400');
      expect(html).toContain('Bukti fisik terverifikasi');
    });

    it('does NOT render BadgeCheck and renders "Bukti media laporan warga" when evidence_verification_status is "unverified"', () => {
      const report: Partial<Report> = {
        evidence_verification_status: 'unverified',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck and renders "Bukti media laporan warga" when evidence_verification_status is "rejected"', () => {
      const report: Partial<Report> = {
        evidence_verification_status: 'rejected',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck and renders "Bukti media laporan warga" when evidence_verification_status is "inconclusive"', () => {
      const report: Partial<Report> = {
        evidence_verification_status: 'inconclusive',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck when evidence_verification_status is undefined', () => {
      const report: Partial<Report> = {
        evidence_verification_status: undefined,
        evidenceVerificationStatus: undefined,
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck when evidence_verification_status is null (defensive handling)', () => {
      const report: Partial<Report> = {
        evidence_verification_status: null as any,
        evidenceVerificationStatus: null as any,
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck when report is "resolved" but evidence is "unverified" (R1 verification decoupling)', () => {
      const report: Partial<Report> = {
        status: 'resolved' as ReportStatus,
        evidence_verification_status: 'unverified',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      // Proves accepting or resolving report does NOT falsely verify evidence
      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });

    it('does NOT render BadgeCheck when report is "accepted_for_routing" and evidence is "rejected"', () => {
      const report: Partial<Report> = {
        status: 'accepted_for_routing' as ReportStatus,
        evidence_verification_status: 'rejected',
      };
      const html = renderToStaticMarkup(<EvidenceBadgeOverlay report={report} />);

      expect(html).not.toContain('lucide-badge-check');
      expect(html).not.toContain('text-emerald-400');
      expect(html).not.toContain('Bukti fisik terverifikasi');
      expect(html).toContain('Bukti media laporan warga');
    });
  });

  // ===========================================================================
  // 3. ACTUAL FILE CONTENT INTEGRITY ON ReportDetailView.tsx
  // ===========================================================================
  describe('ReportDetailView.tsx Static File Inspection', () => {
    it('verifies exact lines 646-656 in src/views/ReportDetailView.tsx match the strict conditional logic', () => {
      const filePath = path.resolve(ROOT_SRC, 'views/ReportDetailView.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Verify strict check
      expect(fileContent).toContain(
        "(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified')"
      );

      // Verify BadgeCheck is guarded
      const guardedBadgeRegex =
        /\(report\.evidence_verification_status === 'verified' \|\| report\.evidenceVerificationStatus === 'verified'\)\s*&&\s*\(\s*<BadgeCheck/s;
      expect(guardedBadgeRegex.test(fileContent)).toBe(true);

      // Verify no unconditional BadgeCheck inside evidence overlay
      const unconditionalRegex = /Evidence badge overlay[\s\S]*?<div[^>]*>\s*<BadgeCheck/;
      expect(unconditionalRegex.test(fileContent)).toBe(false);
    });
  });
});
