import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ReportStatus } from '../types';

const MIGRATION_FILE = path.resolve(__dirname, '../../supabase/migrations/20261028000004_canonical_verification_and_audit.sql');
const SCHEMA_FILE = path.resolve(__dirname, '../../supabase/schema.sql');

/**
 * ============================================================================
 * PL/pgSQL Stored Procedure Behavioral Simulation Oracle
 * ============================================================================
 * Mirrors the exact database semantics implemented in Supabase migrations:
 * - public.is_admin()
 * - public.admin_transition_report_status()
 * - public.admin_verify_report_evidence()
 * - public.admin_set_citizen_verification()
 * - Row-level security for report_events and citizen_verification_audits
 */
interface DBUserRole {
  user_id: string;
  role: 'admin';
}

interface DBProfile {
  id: string;
  username: string;
  display_name: string;
  role: string;
  is_verified: boolean;
}

interface DBReport {
  id: string;
  status: string;
  evidence_verification_status: string;
  official_response: string | null;
  internal_notes: string | null;
  last_reviewed_by: string | null;
  last_reviewed_at: string | null;
}

interface DBReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  actor_id: string;
  actor_name: string;
  previous_status?: string | null;
  new_status?: string | null;
  notes: string | null;
  is_internal: boolean;
  created_at: string;
}

interface DBCitizenVerificationAudit {
  id: string;
  user_id: string;
  action: 'verified' | 'revoked';
  admin_id: string;
  notes: string | null;
  created_at: string;
}

class PostgresPlpgsqlSimulationEngine {
  userRoles: DBUserRole[] = [];
  profiles: Map<string, DBProfile> = new Map();
  reports: Map<string, DBReport> = new Map();
  reportEvents: DBReportEvent[] = [];
  citizenAudits: DBCitizenVerificationAudit[] = [];
  currentAuthUid: string | null = null;

  setAuthContext(uid: string | null) {
    this.currentAuthUid = uid;
  }

  // Corresponds to public.is_admin() STABLE SECURITY DEFINER SET search_path = public, auth
  isAdmin(): boolean {
    if (!this.currentAuthUid) return false;
    return this.userRoles.some(
      (ur) => ur.user_id === this.currentAuthUid && ur.role === 'admin'
    );
  }

  // Corresponds to public.admin_set_citizen_verification
  adminSetCitizenVerification(
    p_user_id: string,
    p_is_verified: boolean,
    p_notes?: string | null
  ): DBProfile {
    if (!this.isAdmin()) {
      throw new Error('Akses ditolak: Hanya administrator yang dapat mengubah status verifikasi warga.');
    }

    const profile = this.profiles.get(p_user_id);
    if (!profile) {
      throw new Error(`Pengguna tidak ditemukan: ${p_user_id}`);
    }

    profile.is_verified = p_is_verified;
    this.profiles.set(p_user_id, profile);

    this.citizenAudits.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: p_user_id,
      action: p_is_verified ? 'verified' : 'revoked',
      admin_id: this.currentAuthUid!,
      notes: p_notes ?? null,
      created_at: new Date().toISOString(),
    });

    return { ...profile };
  }

  // Corresponds to public.admin_verify_report_evidence
  adminVerifyReportEvidence(
    p_report_id: string,
    p_status: string,
    p_notes?: string | null
  ): DBReport {
    if (!this.isAdmin()) {
      throw new Error('Akses ditolak: Hanya administrator yang berwenang memvalidasi bukti laporan.');
    }

    const validStatuses = ['unverified', 'verified', 'rejected', 'inconclusive'];
    if (!validStatuses.includes(p_status)) {
      throw new Error(`Status validasi bukti tidak valid: ${p_status}`);
    }

    const report = this.reports.get(p_report_id);
    if (!report) {
      throw new Error(`Laporan tidak ditemukan: ${p_report_id}`);
    }

    report.evidence_verification_status = p_status;
    report.last_reviewed_by = this.currentAuthUid!;
    report.last_reviewed_at = new Date().toISOString();
    this.reports.set(p_report_id, report);

    const adminProfile = this.profiles.get(this.currentAuthUid!);
    this.reportEvents.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      report_id: p_report_id,
      event_type: 'evidence_verification',
      actor_id: this.currentAuthUid!,
      actor_name: adminProfile?.display_name || 'Admin TITIK',
      notes: p_notes ?? `Status verifikasi bukti diubah menjadi ${p_status}`,
      is_internal: false,
      created_at: new Date().toISOString(),
    });

    return { ...report };
  }

  // Corresponds to public.admin_transition_report_status
  adminTransitionReportStatus(
    p_report_id: string,
    p_target_status: string,
    p_notes?: string | null,
    p_is_internal: boolean = false,
    p_official_response?: string | null
  ): DBReport {
    if (!this.isAdmin()) {
      throw new Error('Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan.');
    }

    const report = this.reports.get(p_report_id);
    if (!report) {
      throw new Error(`Laporan tidak ditemukan: ${p_report_id}`);
    }

    const canonicalStatuses = [
      'submitted',
      'under_review',
      'needs_info',
      'accepted_for_routing',
      'forwarded_to_institution',
      'institution_responded',
      'resolved',
      'rejected',
    ];

    if (!canonicalStatuses.includes(p_target_status)) {
      throw new Error(`Status target tidak valid: ${p_target_status}`);
    }

    // Mirror Postgres PL/pgSQL: NULLIF(BTRIM(str, E' \t\n\r'), '')
    const trimPostgres = (str: string | null | undefined): string | null => {
      if (str === null || str === undefined) return null;
      const trimmed = str.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
      return trimmed === '' ? null : trimmed;
    };

    const v_notes_trimmed = trimPostgres(p_notes);
    const v_response_trimmed = trimPostgres(p_official_response);

    // Enforce transition contract for rejected and needs_info
    if (['rejected', 'needs_info'].includes(p_target_status)) {
      if (v_notes_trimmed === null && v_response_trimmed === null) {
        throw new Error(
          `Status ${p_target_status} wajib menyertakan catatan penjelasan atau tanggapan resmi yang tidak boleh kosong.`
        );
      }
    }

    const oldStatus = report.status;
    report.status = p_target_status;
    if (v_response_trimmed !== null) {
      report.official_response = v_response_trimmed;
    }
    if (p_is_internal && v_notes_trimmed !== null) {
      report.internal_notes = v_notes_trimmed;
    }
    report.last_reviewed_by = this.currentAuthUid!;
    report.last_reviewed_at = new Date().toISOString();
    this.reports.set(p_report_id, report);

    const adminProfile = this.profiles.get(this.currentAuthUid!);
    const adminName = adminProfile?.display_name || 'Admin TITIK';

    // Event 1 (Status change audit event: MUST ALWAYS have is_internal = false for citizen timeline visibility)
    this.reportEvents.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      report_id: p_report_id,
      event_type: 'status_change',
      actor_id: this.currentAuthUid!,
      actor_name: adminName,
      previous_status: oldStatus,
      new_status: p_target_status,
      notes: v_response_trimmed ?? `Status diperbarui menjadi ${p_target_status}`,
      is_internal: false,
      created_at: new Date().toISOString(),
    });

    // Event 2 (Dedicated internal note event if internal review notes exist: MUST ALWAYS have is_internal = true)
    if (v_notes_trimmed !== null) {
      this.reportEvents.push({
        id: `ev-int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        report_id: p_report_id,
        event_type: 'internal_review_note',
        actor_id: this.currentAuthUid!,
        actor_name: adminName,
        previous_status: oldStatus,
        new_status: p_target_status,
        notes: v_notes_trimmed,
        is_internal: true,
        created_at: new Date().toISOString(),
      });
    }

    return { ...report };
  }

  // Mirror column-level security: REVOKE SELECT (internal_notes) ON public.reports FROM anon, authenticated
  selectReport(reportId: string, requestedColumns?: string[]): Partial<DBReport> | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const admin = this.isAdmin();
    if (requestedColumns && requestedColumns.includes('internal_notes') && !admin) {
      throw new Error('permission denied for column "internal_notes" of relation "reports"');
    }

    const copy = { ...report };
    if (!admin) {
      delete (copy as any).internal_notes;
    }
    return copy;
  }

  // Mirror RLS policy: FOR SELECT USING (is_internal = FALSE OR public.is_admin())
  selectReportEvents(reportId: string): DBReportEvent[] {
    const admin = this.isAdmin();
    return this.reportEvents.filter((ev) => {
      if (ev.report_id !== reportId) return false;
      return ev.is_internal === false || admin;
    });
  }

  // Mirror RLS policy on citizen_verification_audits: FOR SELECT USING (public.is_admin())
  selectCitizenAudits(userId?: string): DBCitizenVerificationAudit[] {
    if (!this.isAdmin()) {
      return []; // RLS filters out all rows for non-admins
    }
    return this.citizenAudits.filter((a) => !userId || a.user_id === userId);
  }
}

describe('Milestone 1 Challenger Empirical Stress & Adversarial Suite', () => {
  let db: PostgresPlpgsqlSimulationEngine;

  beforeEach(() => {
    db = new PostgresPlpgsqlSimulationEngine();

    // Populate seed identities
    db.profiles.set('admin-001', {
      id: 'admin-001',
      username: 'achira_admin',
      display_name: 'Achira Administrator',
      role: 'admin',
      is_verified: true,
    });
    db.userRoles.push({ user_id: 'admin-001', role: 'admin' });

    db.profiles.set('citizen-001', {
      id: 'citizen-001',
      username: 'budi_warga',
      display_name: 'Budi Santoso',
      role: 'citizen',
      is_verified: false,
    });

    db.profiles.set('citizen-verified-001', {
      id: 'citizen-verified-001',
      username: 'sari_wulan',
      display_name: 'Sari Wulan',
      role: 'citizen',
      is_verified: true,
    });

    // Seed report
    db.reports.set('rep-001', {
      id: 'rep-001',
      status: 'submitted',
      evidence_verification_status: 'unverified',
      official_response: null,
      internal_notes: null,
      last_reviewed_by: null,
      last_reviewed_at: null,
    });

    // Seed initial public submission event
    db.reportEvents.push({
      id: 'ev-init-001',
      report_id: 'rep-001',
      event_type: 'status_change',
      actor_id: 'citizen-001',
      actor_name: 'Budi Santoso',
      previous_status: null,
      new_status: 'submitted',
      notes: 'Laporan berhasil diajukan ke sistem.',
      is_internal: false,
      created_at: new Date().toISOString(),
    });
  });

  // ===========================================================================
  // 1. CANONICAL REPORT STATUS LIFECYCLE REJECTION HARNESS
  // ===========================================================================
  describe('Canonical Report Status Lifecycle Adversarial Rejections', () => {
    const CANONICAL_STATUSES: ReportStatus[] = [
      'submitted',
      'under_review',
      'needs_info',
      'accepted_for_routing',
      'forwarded_to_institution',
      'institution_responded',
      'resolved',
      'rejected',
    ];

    it('empirically verifies the 8 canonical statuses are accepted by the RPC engine', () => {
      db.setAuthContext('admin-001');

      for (const status of CANONICAL_STATUSES) {
        const note = 'Catatan resmi verifikasi pengujian.';
        const result = db.adminTransitionReportStatus('rep-001', status, note, false, note);
        expect(result.status).toBe(status);
      }
    });

    it('empirically rejects an exhaustive adversarial matrix of 20 non-canonical statuses', () => {
      db.setAuthContext('admin-001');

      const adversarialStatuses = [
        '', // Empty string
        '   ', // Whitespace
        'pending', // Deprecated status
        'in_progress', // Common external status
        'closed', // External status
        'approved', // External status
        'dismissed', // External status
        'archived', // External status
        'in_review', // Similar but non-canonical
        'action_taken', // Non-canonical
        'SUBMITTED', // Upper case
        'RESOLVED', // Upper case
        'Rejected', // Title case
        'needs-info', // Hyphenated instead of underscore
        'accepted for routing', // Space instead of underscore
        'forwarded_to_inst', // Truncated
        'submitted; DROP TABLE reports;--', // SQL injection attempt
        'resolved/*comment*/', // Comment injection
        'null', // String null
        'undefined', // String undefined
      ];

      for (const badStatus of adversarialStatuses) {
        expect(() => {
          db.adminTransitionReportStatus(
            'rep-001',
            badStatus,
            'Catatan transisi'
          );
        }).toThrow(/Status target tidak valid/);
      }
    });

    it('verifies that both SQL files enforce the exact identical 8-status CHECK constraint', () => {
      const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');

      const checkConstraintRegex = /CONSTRAINT\s+chk_reports_status_lifecycle\s+CHECK\s*\(\s*status\s+IN\s*\(([^)]+)\)\s*\)/i;

      const migrationMatch = migrationSql.match(checkConstraintRegex);
      const schemaMatch = schemaSql.match(checkConstraintRegex);

      expect(migrationMatch).not.toBeNull();
      expect(schemaMatch).not.toBeNull();

      const parseStatuses = (raw: string) =>
        raw
          .split(',')
          .map((s) => s.trim().replace(/^'|'$/g, ''))
          .sort();

      const migrationStatuses = parseStatuses(migrationMatch![1]);
      const schemaStatuses = parseStatuses(schemaMatch![1]);

      expect(migrationStatuses).toEqual([...CANONICAL_STATUSES].sort());
      expect(schemaStatuses).toEqual([...CANONICAL_STATUSES].sort());
      expect(migrationStatuses).toEqual(schemaStatuses);
    });
  });

  // ===========================================================================
  // 2. MANDATORY NOTES VALIDATION FOR REJECTED & NEEDS_INFO
  // ===========================================================================
  describe('Transition Contracts: Mandatory Notes for rejected and needs_info', () => {
    beforeEach(() => {
      db.setAuthContext('admin-001');
    });

    const emptyAndWhitespaceInputs = [
      { notes: null, resp: null, desc: 'both null' },
      { notes: undefined, resp: undefined, desc: 'both undefined' },
      { notes: '', resp: '', desc: 'both empty strings' },
      { notes: '   ', resp: '   ', desc: 'both whitespace spaces' },
      { notes: '\t\t', resp: '\t\t', desc: 'both tab characters' },
      { notes: '\n\r\n', resp: '\n\r\n', desc: 'both newlines' },
      { notes: '  \t  \n  ', resp: '  \r\n  ', desc: 'mixed whitespace' },
      { notes: '', resp: null, desc: 'empty notes with null response' },
      { notes: null, resp: '   ', desc: 'null notes with whitespace response' },
    ];

    it('rejects transitioning to "rejected" when notes and official response are blank', () => {
      for (const item of emptyAndWhitespaceInputs) {
        expect(() => {
          db.adminTransitionReportStatus(
            'rep-001',
            'rejected',
            item.notes,
            false,
            item.resp
          );
        }, `Failed for ${item.desc}`).toThrow(/wajib menyertakan catatan penjelasan atau tanggapan resmi yang tidak boleh kosong/);
      }
    });

    it('rejects transitioning to "needs_info" when notes and official response are blank', () => {
      for (const item of emptyAndWhitespaceInputs) {
        expect(() => {
          db.adminTransitionReportStatus(
            'rep-001',
            'needs_info',
            item.notes,
            false,
            item.resp
          );
        }, `Failed for ${item.desc}`).toThrow(/wajib menyertakan catatan penjelasan atau tanggapan resmi yang tidak boleh kosong/);
      }
    });

    it('accepts transitioning to "rejected" when non-empty notes or response are provided', () => {
      const validNotes = 'Foto tidak menampilkan nomor pelat kendaraan dinas yang dilaporkan.';
      const res = db.adminTransitionReportStatus(
        'rep-001',
        'rejected',
        validNotes,
        false,
        validNotes
      );
      expect(res.status).toBe('rejected');
      expect(res.official_response).toBe(validNotes);
    });

    it('accepts transitioning to "needs_info" when non-empty response is provided', () => {
      const prompt = 'Mohon sertakan foto patok jalan kilometer terdekat.';
      const res = db.adminTransitionReportStatus(
        'rep-001',
        'needs_info',
        null,
        false,
        prompt
      );
      expect(res.status).toBe('needs_info');
      expect(res.official_response).toBe(prompt);
    });

    it('permits non-rejecting statuses (e.g. under_review, resolved) to transition with null notes', () => {
      const res = db.adminTransitionReportStatus(
        'rep-001',
        'under_review',
        null,
        false,
        null
      );
      expect(res.status).toBe('under_review');
    });
  });

  // ===========================================================================
  // 3. AUTHORIZATION BARRIERS & PRIVILEGE ESCALATION DEFENSE
  // ===========================================================================
  describe('Authorization Barriers & Non-Admin Caller Blocking', () => {
    it('blocks anonymous callers (unauthenticated) from calling admin RPCs', () => {
      db.setAuthContext(null);

      expect(() => {
        db.adminSetCitizenVerification('citizen-001', true, 'Test verification');
      }).toThrow(/Akses ditolak: Hanya administrator yang dapat mengubah status verifikasi warga/);

      expect(() => {
        db.adminVerifyReportEvidence('rep-001', 'verified', 'Test evidence');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memvalidasi bukti laporan/);

      expect(() => {
        db.adminTransitionReportStatus('rep-001', 'under_review', 'Test transition');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan/);
    });

    it('blocks regular citizen callers from calling admin RPCs', () => {
      db.setAuthContext('citizen-001');

      expect(() => {
        db.adminSetCitizenVerification('citizen-001', true, 'Self-grant verification');
      }).toThrow(/Akses ditolak: Hanya administrator yang dapat mengubah status verifikasi warga/);

      expect(() => {
        db.adminVerifyReportEvidence('rep-001', 'verified', 'Self-verify evidence');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memvalidasi bukti laporan/);

      expect(() => {
        db.adminTransitionReportStatus('rep-001', 'resolved', 'Self-resolve report');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan/);
    });

    it('blocks verified citizens (non-admins) from calling admin RPCs', () => {
      db.setAuthContext('citizen-verified-001');

      expect(() => {
        db.adminSetCitizenVerification('citizen-001', true, 'Grant other citizen');
      }).toThrow(/Akses ditolak: Hanya administrator yang dapat mengubah status verifikasi warga/);

      expect(() => {
        db.adminVerifyReportEvidence('rep-001', 'verified', 'Verify report');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memvalidasi bukti laporan/);

      expect(() => {
        db.adminTransitionReportStatus('rep-001', 'under_review', 'Transition report');
      }).toThrow(/Akses ditolak: Hanya administrator yang berwenang memperbarui status laporan/);
    });

    it('permits authorized admin in public.user_roles to execute all admin RPCs successfully', () => {
      db.setAuthContext('admin-001');

      // 1. Verify evidence
      const evRes = db.adminVerifyReportEvidence('rep-001', 'verified', 'Bukti foto telah dicocokkan dengan GIS');
      expect(evRes.evidence_verification_status).toBe('verified');
      expect(evRes.last_reviewed_by).toBe('admin-001');

      // 2. Set citizen verification
      const citRes = db.adminSetCitizenVerification('citizen-001', true, 'KTP dan NIK telah diverifikasi DISDUKCAPIL');
      expect(citRes.is_verified).toBe(true);

      // 3. Transition report status
      const transRes = db.adminTransitionReportStatus(
        'rep-001',
        'under_review',
        'Dalam pemeriksaan teknis',
        true,
        'Laporan telah diterima dinas terkait'
      );
      expect(transRes.status).toBe('under_review');
      expect(transRes.internal_notes).toBe('Dalam pemeriksaan teknis');
      expect(transRes.official_response).toBe('Laporan telah diterima dinas terkait');
    });

    it('rejects invalid evidence verification statuses outside the 4 canonical values', () => {
      db.setAuthContext('admin-001');

      const invalidEvidenceStatuses = ['pending', 'approved', 'declined', 'true', 'false', ''];
      for (const bad of invalidEvidenceStatuses) {
        expect(() => {
          db.adminVerifyReportEvidence('rep-001', bad);
        }).toThrow(/Status validasi bukti tidak valid/);
      }
    });

    it('verifies SQL defines direct table write restriction to admins on public.reports', () => {
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      expect(schemaSql).toContain('CREATE POLICY "Admin write reports" ON public.reports');
      expect(schemaSql).toContain('FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())');
      expect(schemaSql).toContain('DROP POLICY IF EXISTS "Users can insert reports" ON public.reports');
      expect(schemaSql).toContain('DROP POLICY IF EXISTS "Users can update reports" ON public.reports');
    });
  });

  // ===========================================================================
  // 4. AUDIT EVENT ISOLATION & INFORMATION LEAKAGE PREVENTION
  // ===========================================================================
  describe('Audit Event Isolation & RLS Security Simulation', () => {
    beforeEach(() => {
      db.setAuthContext('admin-001');

      // Admin transitions report with both internal notes and public official response
      db.adminTransitionReportStatus(
        'rep-001',
        'under_review',
        'Catatan internal rahasia: pelapor dicurigai akun buzzer.',
        true, // is_internal = true
        'Tanggapan resmi publik: Laporan sedang ditinjau dinas teknis.'
      );
    });

    it('ensures internal audit events are completely hidden from anonymous users', () => {
      db.setAuthContext(null);

      const events = db.selectReportEvents('rep-001');
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((ev) => ev.is_internal === false)).toBe(true);

      // Ensure confidential string does NOT leak in any visible event
      const confidentialStr = 'pelapor dicurigai akun buzzer';
      events.forEach((ev) => {
        expect(ev.notes).not.toContain(confidentialStr);
      });
    });

    it('ensures internal audit events are completely hidden from regular citizen accounts', () => {
      db.setAuthContext('citizen-001');

      const events = db.selectReportEvents('rep-001');
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((ev) => ev.is_internal === false)).toBe(true);

      const confidentialStr = 'pelapor dicurigai akun buzzer';
      events.forEach((ev) => {
        expect(ev.notes).not.toContain(confidentialStr);
      });
    });

    it('allows administrators to view both public events and internal audit records', () => {
      db.setAuthContext('admin-001');

      const events = db.selectReportEvents('rep-001');
      const internalEvents = events.filter((ev) => ev.is_internal === true);
      const publicEvents = events.filter((ev) => ev.is_internal === false);

      expect(internalEvents.length).toBeGreaterThanOrEqual(1);
      expect(publicEvents.length).toBeGreaterThanOrEqual(1);

      const foundConfidential = internalEvents.some((ev) =>
        ev.notes?.includes('pelapor dicurigai akun buzzer')
      );
      expect(foundConfidential).toBe(true);
    });

    it('ensures citizen_verification_audits are accessible only by administrators', () => {
      // Admin writes an audit record
      db.setAuthContext('admin-001');
      db.adminSetCitizenVerification('citizen-001', true, 'Verifikasi identitas via KTP');

      // Admin can select audits
      const adminAudits = db.selectCitizenAudits('citizen-001');
      expect(adminAudits.length).toBe(1);
      expect(adminAudits[0].action).toBe('verified');

      // Citizen cannot select audits (RLS yields empty set)
      db.setAuthContext('citizen-001');
      const citizenAudits = db.selectCitizenAudits('citizen-001');
      expect(citizenAudits.length).toBe(0);

      // Anonymous cannot select audits
      db.setAuthContext(null);
      const anonAudits = db.selectCitizenAudits('citizen-001');
      expect(anonAudits.length).toBe(0);
    });

    it('ensures citizen can see the status change on their timeline even when admin provided confidential internal notes', () => {
      db.setAuthContext('citizen-001');

      const events = db.selectReportEvents('rep-001');
      const statusChangeEvent = events.find(
        (ev) => ev.event_type === 'status_change' && ev.new_status === 'under_review'
      );
      expect(statusChangeEvent).toBeDefined();
      expect(statusChangeEvent?.is_internal).toBe(false);
      expect(statusChangeEvent?.notes).toBe('Tanggapan resmi publik: Laporan sedang ditinjau dinas teknis.');
    });

    it('generates a clean public status update message when official response is omitted but internal notes are provided', () => {
      db.setAuthContext('admin-001');
      db.adminTransitionReportStatus(
        'rep-001',
        'forwarded_to_institution',
        'Catatan rahasia admin internal untuk dinas teknis',
        true,
        null
      );

      db.setAuthContext('citizen-001');
      const events = db.selectReportEvents('rep-001');
      const latest = events[events.length - 1];
      expect(latest.event_type).toBe('status_change');
      expect(latest.new_status).toBe('forwarded_to_institution');
      expect(latest.is_internal).toBe(false);
      expect(latest.notes).toBe('Status diperbarui menjadi forwarded_to_institution');
      expect(latest.notes).not.toContain('Catatan rahasia');
    });

    it('enforces column-level security so non-admins cannot select internal_notes from public.reports', () => {
      // Admin can select internal_notes
      db.setAuthContext('admin-001');
      const adminView = db.selectReport('rep-001', ['id', 'status', 'internal_notes']);
      expect(adminView?.internal_notes).toBe('Catatan internal rahasia: pelapor dicurigai akun buzzer.');

      // Regular citizen cannot select internal_notes
      db.setAuthContext('citizen-001');
      expect(() => {
        db.selectReport('rep-001', ['id', 'status', 'internal_notes']);
      }).toThrow(/permission denied for column "internal_notes"/);

      // Anonymous cannot select internal_notes
      db.setAuthContext(null);
      expect(() => {
        db.selectReport('rep-001', ['id', 'status', 'internal_notes']);
      }).toThrow(/permission denied for column "internal_notes"/);
    });

    it('verifies SQL files contain column-level security REVOKE and GRANT on internal_notes', () => {
      const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain('REVOKE SELECT (internal_notes) ON public.reports FROM anon, authenticated;');
        expect(sql).toContain('GRANT SELECT (internal_notes) ON public.reports TO service_role;');
      }
    });

    it('verifies SQL files use BTRIM with whitespace characters to prevent tab/newline bypass', () => {
      const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');

      for (const sql of [migrationSql, schemaSql]) {
        expect(sql).toContain("v_notes_trimmed := NULLIF(BTRIM(p_notes, E' \\t\\n\\r'), '');");
        expect(sql).toContain("v_response_trimmed := NULLIF(BTRIM(p_official_response, E' \\t\\n\\r'), '');");
      }
    });
  });

  // ===========================================================================
  // 5. SERVER-ENFORCED SUBMIT_REPORT CITIZEN VERIFICATION PROOF
  // ===========================================================================
  describe('Server-Enforced submit_report Reporter Type Verification', () => {
    it('verifies SQL implementation forces reporter_type based on profiles.is_verified, ignoring client parameter', () => {
      const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf-8').replace(/\r\n/g, '\n');
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8').replace(/\r\n/g, '\n');

      for (const sql of [migrationSql, schemaSql]) {
        // Must check auth.uid() against profiles.is_verified
        expect(sql).toContain('SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid');
        expect(sql).toContain('v_is_user_verified := COALESCE(v_profile.is_verified, FALSE)');

        // Only true verified users get 'verified_citizen'
        expect(sql).toContain("IF v_is_user_verified IS TRUE THEN\n      v_real_reporter_type := 'verified_citizen';\n    ELSE\n      v_real_reporter_type := 'registered_citizen';\n    END IF;");

        // Uses v_real_reporter_type for insert, NOT client p_reporter_type
        expect(sql).toContain('v_real_reporter_type,');
      }
    });
  });
});
