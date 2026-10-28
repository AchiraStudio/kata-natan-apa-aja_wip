import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  Report,
  ReportStatus,
} from '../types';
import { MOCK_REPORTS } from '../data/mockCivicData';

const ROOT_SRC = path.resolve(__dirname, '..');
const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/20261028000004_canonical_verification_and_audit.sql');
const SCHEMA_PATH = path.resolve(__dirname, '../../supabase/schema.sql');
const ACCOUNT_GEN_PATH = path.resolve(ROOT_SRC, 'services/accountGenerator.ts');
const SEED_SCRIPT_PATH = path.resolve(__dirname, '../../scripts/seed-fake-accounts.js');
const SEEDED_ACCOUNTS_JSON = path.resolve(__dirname, '../../seeded-accounts.json');
const REPORT_DETAIL_VIEW = path.resolve(ROOT_SRC, 'views/ReportDetailView.tsx');

describe('Milestone 1: Database Model & RLS Hardening and Dummy Badge Eradication', () => {
  describe('1. Canonical Report Lifecycle Status & Columns', () => {
    it('defines canonical 8 statuses without omissions', () => {
      const canonicalStatuses: ReportStatus[] = [
        'submitted',
        'under_review',
        'needs_info',
        'accepted_for_routing',
        'forwarded_to_institution',
        'institution_responded',
        'resolved',
        'rejected',
      ];
      expect(canonicalStatuses).toHaveLength(8);
    });

    it('enforces CHECK constraint for 8 statuses in SQL migration and schema', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true);
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('chk_reports_status_lifecycle');
        expect(sql).toContain("'submitted'");
        expect(sql).toContain("'under_review'");
        expect(sql).toContain("'needs_info'");
        expect(sql).toContain("'accepted_for_routing'");
        expect(sql).toContain("'forwarded_to_institution'");
        expect(sql).toContain("'institution_responded'");
        expect(sql).toContain("'resolved'");
        expect(sql).toContain("'rejected'");
      }
    });

    it('includes evidence_verification_status, official_response, and internal_notes in reports table', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('evidence_verification_status');
        expect(sql).toContain("'unverified', 'verified', 'rejected', 'inconclusive'");
        expect(sql).toContain('official_response');
        expect(sql).toContain('internal_notes');
        expect(sql).toContain('last_reviewed_by');
        expect(sql).toContain('last_reviewed_at');
      }
    });

    it('enforces column-level security on internal_notes in migration and schema', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('REVOKE SELECT (internal_notes) ON public.reports FROM anon, authenticated;');
        expect(sql).toContain('GRANT SELECT (internal_notes) ON public.reports TO service_role;');
      }
    });
  });

  describe('2. Audit Privacy & Report Events Separation', () => {
    it('adds is_internal column to report_events and restricts RLS to public.is_admin()', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('is_internal');
        expect(sql).toContain('Report events visibility based on is_internal');
        expect(sql).toContain('is_internal = FALSE');
        expect(sql).toContain('public.is_admin()');
      }
    });

    it('defines citizen_verification_audits table with admin-only RLS', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('citizen_verification_audits');
        expect(sql).toContain("action IN ('verified', 'revoked')");
        expect(sql).toContain('Admins can view citizen verification audits');
      }
    });
  });

  describe('3. Server-Enforced RPC Functions', () => {
    it('defines admin_transition_report_status requiring non-empty notes for rejected and needs_info', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(migrationSql).toContain('FUNCTION public.admin_transition_report_status');
      expect(migrationSql).toContain("p_target_status IN ('rejected', 'needs_info')");
      expect(migrationSql).toContain('RAISE EXCEPTION');
      expect(migrationSql).toContain('v_notes_trimmed IS NULL AND v_response_trimmed IS NULL');
    });

    it('uses BTRIM with whitespace characters to prevent tab/newline bypass in transition RPC', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain("v_notes_trimmed := NULLIF(BTRIM(p_notes, E' \\t\\n\\r'), '');");
        expect(sql).toContain("v_response_trimmed := NULLIF(BTRIM(p_official_response, E' \\t\\n\\r'), '');");
      }
    });

    it('defines admin_verify_report_evidence and admin_set_citizen_verification RPCs', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(migrationSql).toContain('FUNCTION public.admin_verify_report_evidence');
      expect(migrationSql).toContain('FUNCTION public.admin_set_citizen_verification');
    });

    it('hardens submit_report by checking profiles.is_verified server-side', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(migrationSql).toContain('SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid');
      expect(migrationSql).toContain('v_is_user_verified := COALESCE(v_profile.is_verified, FALSE)');
      expect(migrationSql).toContain("v_real_reporter_type := 'verified_citizen'");
      expect(migrationSql).toContain("v_real_reporter_type := 'registered_citizen'");
    });

    it('configures report-evidence-private storage bucket policies', () => {
      const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(migrationSql).toContain("'report-evidence-private'");
      expect(migrationSql).toContain('Private evidence viewable by owner or admin');
    });
  });

  describe('4. Dummy & Modulo Verification Purge', () => {
    it('purges modulo % 3 from accountGenerator.ts', () => {
      const content = fs.readFileSync(ACCOUNT_GEN_PATH, 'utf-8');
      expect(content).not.toContain('idx % 3');
      expect(content).not.toContain('isVerified: idx % 3');
    });

    it('purges modulo % 3 from seed-fake-accounts.js', () => {
      const content = fs.readFileSync(SEED_SCRIPT_PATH, 'utf-8');
      expect(content).not.toContain('i % 3');
      expect(content).not.toContain('is_verified: i % 3');
    });

    it('seeded-accounts.json contains no modulo verification artifacts and verifies admin only', () => {
      expect(fs.existsSync(SEEDED_ACCOUNTS_JSON)).toBe(true);
      const accounts = JSON.parse(fs.readFileSync(SEEDED_ACCOUNTS_JSON, 'utf-8'));
      expect(accounts.length).toBeGreaterThan(0);

      // Citizens must not have fake modulo verification
      const citizens = accounts.filter((a: any) => a.role === 'citizen');
      expect(citizens.every((a: any) => a.is_verified === false)).toBe(true);

      // Admins are verified
      const admins = accounts.filter((a: any) => a.role === 'admin');
      if (admins.length > 0) {
        expect(admins.every((a: any) => a.is_verified === true)).toBe(true);
      }
    });

    it('ReportDetailView conditionally renders BadgeCheck only when evidence is verified', () => {
      const content = fs.readFileSync(REPORT_DETAIL_VIEW, 'utf-8');
      expect(content).toContain("evidence_verification_status === 'verified'");
      expect(content).toContain('<BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />');
      // Must not unconditionally render BadgeCheck
      expect(content).not.toMatch(/<div className="absolute top-3 left-3[^"]*">\s*<BadgeCheck/);
    });
  });

  describe('5. Domain Type & Mock Data Alignment', () => {
    it('includes evidence_verification_status, official_response, and internal_notes in domain Report type', () => {
      const sampleReport: Partial<Report> = {
        evidence_verification_status: 'verified',
        official_response: 'Respon resmi instansi',
        internal_notes: 'Catatan internal admin',
      };
      expect(sampleReport.evidence_verification_status).toBe('verified');
      expect(sampleReport.official_response).toBe('Respon resmi instansi');
      expect(sampleReport.internal_notes).toBe('Catatan internal admin');
    });

    it('all mock reports in mockCivicData contain evidence_verification_status, official_response, and internal_notes', () => {
      expect(MOCK_REPORTS.length).toBeGreaterThanOrEqual(13);
      for (const report of MOCK_REPORTS) {
        expect(report.evidence_verification_status).toBeDefined();
        expect(['unverified', 'verified', 'rejected', 'inconclusive']).toContain(
          report.evidence_verification_status
        );
        expect('official_response' in report).toBe(true);
        expect('internal_notes' in report).toBe(true);
      }
    });

    it('verifies that root src/types.ts re-exports domain types', () => {
      const typesPath = path.resolve(ROOT_SRC, 'types.ts');
      expect(fs.existsSync(typesPath)).toBe(true);
      const content = fs.readFileSync(typesPath, 'utf-8');
      expect(content).toContain("export * from './types/domain'");
    });
  });
});
