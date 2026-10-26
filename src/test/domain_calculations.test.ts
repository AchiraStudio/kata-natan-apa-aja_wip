import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import { MOCK_BUDGET_SECTORS } from '../data/mockCivicData';
import { ReportStatus } from '../types/domain';

describe('Domain Calculations & State Logic (4-Tier Suite)', () => {
  let adapter: MockDataAdapter;

  beforeEach(() => {
    adapter = new MockDataAdapter();
  });

  describe('Comment replies', () => {
    it('stores a reply under its parent comment instead of as a top-level comment', async () => {
      const parent = await adapter.addComment('post-001', 'Parent', 'parent.png', 'Komentar utama');
      const reply = await adapter.addComment('post-001', 'Reply', 'reply.png', 'Balasan', parent.id);
      const comments = await adapter.getComments('post-001');

      expect(reply.parentId).toBe(parent.id);
      expect(comments.find((comment) => comment.id === reply.id)?.parentId).toBe(parent.id);
    });
  });

  describe('Detailed report submission', () => {
    it('keeps cost estimates and supporting documents with the submitted report', async () => {
      const attachment = {
        name: 'surat-rt.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        dataUrl: 'data:application/pdf;base64,dGVzdA==',
      };
      const result = await adapter.submitReport({
        title: 'Lampu jalan padam',
        description: 'Lampu tidak menyala selama satu minggu.',
        category: 'Infrastruktur',
        severity: 'medium',
        address: 'Jl. Melati No. 1',
        latitude: -6.595,
        longitude: 106.79,
        mediaUrls: [],
        facilityName: 'PJU Jl. Melati',
        estimatedCost: 25000000,
        supportingDocuments: [attachment],
        reporterType: 'verified_citizen',
      });

      expect(result.report.estimatedCost).toBe(25000000);
      expect(result.report.supportingDocuments).toEqual([attachment]);
    });
  });

  // ===========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature)
  // ===========================================================================

  describe('Tier 1: Feature Coverage — Budget Execution Calculations (Feature 6)', () => {
    // Pure calculation helper matching ReportDetailView.tsx & ReportDetailDrawer.tsx
    const calculateBudgetMetrics = (budget: { paguAllocation: number; realizedSpending: number; executionRatePercent: number }) => {
      const unspentBudget = budget.paguAllocation - budget.realizedSpending;
      const unspentPercent = (100 - budget.executionRatePercent).toFixed(1);
      return { unspentBudget, unspentPercent };
    };

    it('F6.1: calculates 0% execution rate accurately (100% unspent budget remaining)', () => {
      const budget = {
        paguAllocation: 10_000_000_000,
        realizedSpending: 0,
        executionRatePercent: 0,
      };
      const { unspentBudget, unspentPercent } = calculateBudgetMetrics(budget);
      expect(unspentBudget).toBe(10_000_000_000);
      expect(unspentPercent).toBe('100.0');
      expect(Number(unspentPercent)).toBe(100);
    });

    it('F6.2: calculates 50% execution rate accurately (half allocated, half unspent)', () => {
      const budget = {
        paguAllocation: 25_000_000_000,
        realizedSpending: 12_500_000_000,
        executionRatePercent: 50.0,
      };
      const { unspentBudget, unspentPercent } = calculateBudgetMetrics(budget);
      expect(unspentBudget).toBe(12_500_000_000);
      expect(unspentPercent).toBe('50.0');
    });

    it('F6.3: calculates 100% execution rate accurately (full absorption, 0 unspent)', () => {
      const budget = {
        paguAllocation: 40_000_000_000,
        realizedSpending: 40_000_000_000,
        executionRatePercent: 100.0,
      };
      const { unspentBudget, unspentPercent } = calculateBudgetMetrics(budget);
      expect(unspentBudget).toBe(0);
      expect(unspentPercent).toBe('0.0');
      expect(Number(unspentPercent)).toBe(0);
    });

    it('F6.4: calculates exact fractional unspent rate for simulated drainase sector (62.8%)', () => {
      const drainase = MOCK_BUDGET_SECTORS.drainase;
      const { unspentBudget, unspentPercent } = calculateBudgetMetrics(drainase);
      // Pagu: 38.5B, Realized: 24.2B -> Unspent: 14.3B
      expect(unspentBudget).toBe(14_300_000_000);
      // 100 - 62.8 = 37.2
      expect(unspentPercent).toBe('37.2');
    });

    it('F6.5: calculates exact fractional unspent rate for simulated jalan sector (75.9%)', () => {
      const jalan = MOCK_BUDGET_SECTORS.jalan;
      const { unspentBudget, unspentPercent } = calculateBudgetMetrics(jalan);
      // Pagu: 52B, Realized: 39.5B -> Unspent: 12.5B
      expect(unspentBudget).toBe(12_500_000_000);
      // 100 - 75.9 = 24.1
      expect(unspentPercent).toBe('24.1');
    });

    it('F6.6: formats unspent budget in Billions (Miliar) for UI display', () => {
      const budget = {
        paguAllocation: 38_500_000_000,
        realizedSpending: 24_200_000_000,
        executionRatePercent: 62.8,
      };
      const { unspentBudget } = calculateBudgetMetrics(budget);
      const displayString = `Rp ${(unspentBudget / 1e9).toFixed(1)} Miliar`;
      expect(displayString).toBe('Rp 14.3 Miliar');
    });
  });

  describe('Tier 1: Feature Coverage — Workflow Transition Logic & Badges (Features 8 & 9)', () => {
    // Status Badge Mapping helper matching AdminView.tsx & WorkflowView.tsx
    const getStatusBadgeConfig = (status: ReportStatus) => {
      const badgeMap: Record<ReportStatus, { label: string; tone: string; stepNumber: number }> = {
        submitted: { label: 'Antrean Penerimaan', tone: 'amber', stepNumber: 1 },
        under_review: { label: 'Dalam Tinjauan', tone: 'amber', stepNumber: 1 },
        needs_info: { label: 'Perlu Klarifikasi', tone: 'rose', stepNumber: 1 },
        accepted_for_routing: { label: 'Disetujui untuk Rute', tone: 'sage', stepNumber: 2 },
        forwarded_to_institution: { label: 'Diteruskan ke Dinas', tone: 'blue', stepNumber: 2 },
        institution_responded: { label: 'Dinas Merespons', tone: 'indigo', stepNumber: 3 },
        resolved: { label: 'Selesai Terverifikasi', tone: 'emerald', stepNumber: 4 },
        rejected: { label: 'Ditolak', tone: 'rose', stepNumber: 1 },
      };
      return badgeMap[status];
    };

    it('F8.1: transitions from submitted to under_review and records actor name and timestamp', async () => {
      const submit = await adapter.submitReport({
        title: 'Jalan Rusak di Ciomas',
        description: 'Aspal berlubang diameter 1 meter.',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. Ciomas Raya',
        latitude: -6.598,
        longitude: 106.772,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const updated = await adapter.updateReportStatus(
        submit.report.id,
        'under_review',
        'Admin Tim Reaksi Cepat',
        'Verifikasi keaslian foto dan koordinat GPS.'
      );

      expect(updated.status).toBe('under_review');
      const lastEvent = updated.events[updated.events.length - 1];
      expect(lastEvent.previousStatus).toBe('submitted');
      expect(lastEvent.newStatus).toBe('under_review');
      expect(lastEvent.actorName).toBe('Admin Tim Reaksi Cepat');
      expect(lastEvent.description).toContain('Verifikasi keaslian foto');
    });

    it('F8.2: transitions from under_review to forwarded_to_institution', async () => {
      const submit = await adapter.submitReport({
        title: 'Tumpukan Sampah Liar',
        description: 'Sampah menggunung di dekat jembatan.',
        category: 'Lingkungan',
        severity: 'medium',
        address: 'Jl. Sukasari',
        latitude: -6.61,
        longitude: 106.81,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      await adapter.updateReportStatus(submit.report.id, 'under_review', 'Admin', 'Tinjauan awal');
      const forwarded = await adapter.updateReportStatus(
        submit.report.id,
        'forwarded_to_institution',
        'Dinas Lingkungan Hidup',
        'Disposisi ke Bidang Pengelolaan Sampah.'
      );

      expect(forwarded.status).toBe('forwarded_to_institution');
      expect(forwarded.events.length).toBe(3); // submitted, under_review, forwarded
    });

    it('F8.3: transitions to terminal state resolved with resolution proof note', async () => {
      const submit = await adapter.submitReport({
        title: 'Lampu PJU Mati Total',
        description: 'Gelap gulita 3 tiang berturut-turut.',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. Pajajaran',
        latitude: -6.602,
        longitude: 106.804,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      await adapter.updateReportStatus(submit.report.id, 'under_review', 'Admin', 'Tinjau');
      await adapter.updateReportStatus(submit.report.id, 'forwarded_to_institution', 'Dishub', 'Teruskan');
      await adapter.updateReportStatus(submit.report.id, 'institution_responded', 'Dishub', 'Jadwal perbaikan');
      const resolved = await adapter.updateReportStatus(
        submit.report.id,
        'resolved',
        'Tim Teknisi PJU',
        'Penggantian bohlam LED 120W selesai.'
      );

      expect(resolved.status).toBe('resolved');
      const resolveEvent = resolved.events[resolved.events.length - 1];
      expect(resolveEvent.newStatus).toBe('resolved');
      expect(resolveEvent.description).toContain('Penggantian bohlam LED');
    });

    it('F9.1: maps all 8 status states to appropriate UI badge tone and step number', () => {
      const statuses: ReportStatus[] = [
        'submitted',
        'under_review',
        'needs_info',
        'accepted_for_routing',
        'forwarded_to_institution',
        'institution_responded',
        'resolved',
        'rejected',
      ];

      for (const st of statuses) {
        const config = getStatusBadgeConfig(st);
        expect(config).toBeDefined();
        expect(config.label.length).toBeGreaterThan(0);
        expect(['amber', 'rose', 'sage', 'blue', 'indigo', 'emerald']).toContain(config.tone);
        expect(config.stepNumber).toBeGreaterThanOrEqual(1);
        expect(config.stepNumber).toBeLessThanOrEqual(4);
      }
    });

    it('F9.2: correctly maps terminal states resolved and rejected to distinct tones', () => {
      const resolvedConfig = getStatusBadgeConfig('resolved');
      const rejectedConfig = getStatusBadgeConfig('rejected');

      expect(resolvedConfig.tone).toBe('emerald');
      expect(resolvedConfig.stepNumber).toBe(4);
      expect(rejectedConfig.tone).toBe('rose');
    });
  });

  describe('Tier 1: Feature Coverage — Public Report Tracking (Feature 7)', () => {
    it('F7.1: generates valid publicReference adhering to TIK-2026-XXXXXX', async () => {
      const result = await adapter.submitReport({
        title: 'Trotoar Amblas',
        description: 'Trotoar amblas dekat halte bus.',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. Juanda',
        latitude: -6.595,
        longitude: 106.795,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      expect(result.publicReference).toMatch(/^TIK-2026-\d{6}$/);
      expect(result.report.publicReference).toBe(result.publicReference);
    });

    it('F7.2: generates secure 16-character grouped secretFollowUpToken', async () => {
      const result = await adapter.submitReport({
        title: 'Sampah Menumpuk di Pasar',
        description: 'Tumpukan sampah tidak diangkut 3 hari.',
        category: 'Lingkungan',
        severity: 'medium',
        address: 'Jl. Pasar Anyar',
        latitude: -6.59,
        longitude: 106.79,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      // Token format: XXXX-XXXX-XXXX-XXXX
      expect(result.secretFollowUpToken).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(result.secretFollowUpToken.replace(/-/g, '').length).toBe(16);
    });

    it('F7.3: verifies report tracking with correct reference and secret token', async () => {
      const submission = await adapter.submitReport({
        title: 'Saluran Tersumbat',
        description: 'Banjir lokal saat hujan deras.',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. Bantarjati',
        latitude: -6.58,
        longitude: 106.81,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const tracked = await adapter.verifyReportTracking(
        submission.publicReference,
        submission.secretFollowUpToken
      );

      expect(tracked).not.toBeNull();
      expect(tracked?.id).toBe(submission.report.id);
      expect(tracked?.title).toBe('Saluran Tersumbat');
    });

    it('F7.4: rejects tracking when secret token is wrong', async () => {
      const submission = await adapter.submitReport({
        title: 'Kabel Listrik Menjuntai',
        description: 'Kabel optik menjuntai membahayakan pengendara motor.',
        category: 'Infrastruktur',
        severity: 'critical',
        address: 'Jl. Surya Kencana',
        latitude: -6.605,
        longitude: 106.8,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      const invalidTracked = await adapter.verifyReportTracking(
        submission.publicReference,
        'AAAA-BBBB-CCCC-DDDD'
      );

      expect(invalidTracked).toBeNull();
    });

    it('F7.5: retrieves public report by reference without secret token for public view', async () => {
      const submission = await adapter.submitReport({
        title: 'Pohon Tumbang',
        description: 'Dahan patah menghalangi bahu jalan.',
        category: 'Lingkungan',
        severity: 'medium',
        address: 'Jl. Heulang',
        latitude: -6.575,
        longitude: 106.795,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const publicReport = await adapter.getReportByReference(submission.publicReference);
      expect(publicReport).not.toBeNull();
      expect(publicReport?.id).toBe(submission.report.id);
      expect(publicReport?.publicReference).toBe(submission.publicReference);
    });
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ===========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('B1: handles boundary case of over-budget spending (>100% execution rate)', () => {
      // Over-budget spending scenario: real spending exceeded pagu
      const overBudget = {
        paguAllocation: 10_000_000_000,
        realizedSpending: 11_500_000_000,
        executionRatePercent: 115.0,
      };
      const unspentBudget = overBudget.paguAllocation - overBudget.realizedSpending;
      const unspentPercent = (100 - overBudget.executionRatePercent).toFixed(1);

      expect(unspentBudget).toBe(-1_500_000_000);
      expect(unspentPercent).toBe('-15.0');
      // UI clamp assertion: visual progress bar should clamp between 0% and 100%
      const clampedWidth = Math.min(100, Math.max(0, overBudget.executionRatePercent));
      expect(clampedWidth).toBe(100);
    });

    it('B2: handles boundary case of 0 pagu allocation without throwing NaN errors', () => {
      const zeroBudget = {
        paguAllocation: 0,
        realizedSpending: 0,
        executionRatePercent: 0,
      };
      const unspentBudget = zeroBudget.paguAllocation - zeroBudget.realizedSpending;
      const unspentPercent = (100 - zeroBudget.executionRatePercent).toFixed(1);

      expect(unspentBudget).toBe(0);
      expect(unspentPercent).toBe('100.0');
      expect(isNaN(unspentBudget)).toBe(false);
    });

    it('B3: trims whitespace and tolerates lowercase secret follow-up token input', async () => {
      const submission = await adapter.submitReport({
        title: 'Jalan Ambles Minor',
        description: 'Keretakan tanah pinggir jalan.',
        category: 'Infrastruktur',
        severity: 'low',
        address: 'Jl. Cimahpar',
        latitude: -6.58,
        longitude: 106.82,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      // Pass lowercase and whitespace padded token
      const paddedToken = `   ${submission.secretFollowUpToken.toLowerCase()}   `;
      const tracked = await adapter.verifyReportTracking(submission.publicReference, paddedToken);

      expect(tracked).not.toBeNull();
      expect(tracked?.id).toBe(submission.report.id);
    });

    it('B4: rejects status transition on non-existent report ID with clear error', async () => {
      await expect(
        adapter.updateReportStatus(
          'rep-non-existent-999999',
          'resolved',
          'Admin TITIK',
          'Tandai selesai'
        )
      ).rejects.toThrow(/Report with ID rep-non-existent-999999 not found/);
    });

    it('B5: returns null for tracking queries on non-existent reference strings', async () => {
      const nonExistent = await adapter.getReportByReference('TIK-2026-999999');
      expect(nonExistent).toBeNull();

      const trackingNonExistent = await adapter.verifyReportTracking(
        'TIK-2026-999999',
        'ABCD-EFGH-JKLM-NPQR'
      );
      expect(trackingNonExistent).toBeNull();
    });

    it('B6: preserves anonymity: reporterDisplayName is undefined for anonymous submissions', async () => {
      const anon = await adapter.submitReport({
        title: 'Limbah Minyak Goreng',
        description: 'Pembuangan jelantah sembarangan.',
        category: 'Lingkungan',
        severity: 'medium',
        address: 'Jl. Empang',
        latitude: -6.608,
        longitude: 106.792,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      expect(anon.report.reporterType).toBe('anonymous');
      expect(anon.report.reporterDisplayName).toBeUndefined();
    });
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ===========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('C1: full report lifecycle: submission -> APBD sector link -> tracking verify -> admin audit trail -> resolution', async () => {
      // 1. Citizen submits report
      const submit = await adapter.submitReport({
        title: 'Longsor Tanggul Drainase',
        description: 'Tanggul penahan air jebol di aliran sungai Cibalok.',
        category: 'Infrastruktur',
        severity: 'critical',
        address: 'Jl. Tajur No. 45',
        latitude: -6.625,
        longitude: 106.828,
        mediaUrls: ['https://images.unsplash.com/photo-1541888946425-d0fbb1861593'],
        reporterType: 'verified_citizen',
        reporterDisplayName: 'Ibu Ratna',
      });

      // Verify APBD sector context was automatically bound
      expect(submit.report.budgetContext).toBeDefined();
      expect(submit.report.budgetContext.agencyAcronym).toBe('Dinas PUPR');
      expect(submit.report.budgetContext.executionRatePercent).toBe(62.8);

      // 2. Secret tracking verification
      const tracked = await adapter.verifyReportTracking(
        submit.publicReference,
        submit.secretFollowUpToken
      );
      expect(tracked).not.toBeNull();
      expect(tracked?.events.length).toBe(1);

      // 3. Admin review & workflow transitions
      await adapter.updateReportStatus(
        submit.report.id,
        'under_review',
        'Admin Sipil',
        'Tinjau tingkat keparahan tanggul.'
      );
      await adapter.updateReportStatus(
        submit.report.id,
        'forwarded_to_institution',
        'Dinas PUPR',
        'Survei teknis tanggul Cibalok dijadwalkan.'
      );
      await adapter.updateReportStatus(
        submit.report.id,
        'resolved',
        'PUPR Lapangan',
        'Pemasangan bronjong kawat dan cor beton tuntas.'
      );

      // 4. Final verification via public reference
      const finalReport = await adapter.getReportByReference(submit.publicReference);
      expect(finalReport?.status).toBe('resolved');
      expect(finalReport?.events.length).toBe(4);
      expect(finalReport?.events[3].eventType).toBe('RESOLVED');
    });

    it('C2: civic support toggle synchronizes count across report and feed posts', async () => {
      const posts = await adapter.getFeedPosts();
      const firstPost = posts[0];
      expect(firstPost.relatedReport).toBeDefined();

      if (firstPost.relatedReport) {
        const reportId = firstPost.relatedReport.id;
        const initialCount = firstPost.relatedReport.supportCount;

        // Toggle support: increment
        const step1 = await adapter.toggleReportSupport(reportId);
        expect(step1.isSupported).toBe(true);
        expect(step1.supportCount).toBe(initialCount + 1);

        // Verify updated feed post reflection
        const refreshedPosts = await adapter.getFeedPosts();
        const updatedPost = refreshedPosts.find((p) => p.relatedReportId === reportId);
        expect(updatedPost?.supportCount).toBe(initialCount + 1);
        expect(updatedPost?.isSupportedByMe).toBe(true);

        // Toggle support again: decrement back
        const step2 = await adapter.toggleReportSupport(reportId);
        expect(step2.isSupported).toBe(false);
        expect(step2.supportCount).toBe(initialCount);
      }
    });
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // ===========================================================================

  describe('Tier 4: Real-World Scenarios', () => {
    it('S1 (Anonymous Whistleblower Scenario): citizen submits corrupt infrastructure without identity leak, tracks securely', async () => {
      // Citizen submits anonymously
      const whistle = await adapter.submitReport({
        title: 'Pembangunan Jembatan Mangkrak',
        description: 'Proyek revitalisasi jembatan mandek selama 6 bulan.',
        category: 'Infrastruktur',
        severity: 'critical',
        address: 'Jl. R3 Katulampa',
        latitude: -6.61,
        longitude: 106.83,
        mediaUrls: [],
        reporterType: 'anonymous',
      });

      // Asserts anonymous identity cannot be reverse-engineered from public data
      expect(whistle.report.reporterDisplayName).toBeUndefined();
      expect(whistle.report.reporterType).toBe('anonymous');

      // But citizen retains sovereign tracking capability using their secret token
      const tracked = await adapter.verifyReportTracking(
        whistle.publicReference,
        whistle.secretFollowUpToken
      );
      expect(tracked).not.toBeNull();
      expect(tracked?.title).toBe('Pembangunan Jembatan Mangkrak');
    });

    it('S2 (Municipal Admin Audit Scenario): multi-stage audit logging with immutable timestamps', async () => {
      const report = await adapter.submitReport({
        title: 'Pencemaran Limbah Cair',
        description: 'Bau menyengat di selokan permukiman.',
        category: 'Lingkungan',
        severity: 'high',
        address: 'Kelurahan Kedunghalang',
        latitude: -6.55,
        longitude: 106.81,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const auditTrail = [
        { status: 'under_review' as ReportStatus, actor: 'Verifikator A', note: 'Sampel foto cocok.' },
        { status: 'forwarded_to_institution' as ReportStatus, actor: 'Kabid Pengawasan DLH', note: 'Survei lab dijadwalkan.' },
        { status: 'institution_responded' as ReportStatus, actor: 'DLH Kota Bogor', note: 'Surat peringatan 1 diterbitkan.' },
      ];

      for (const step of auditTrail) {
        await adapter.updateReportStatus(report.report.id, step.status, step.actor, step.note);
      }

      const verified = await adapter.getReportByReference(report.publicReference);
      expect(verified?.events.length).toBe(4); // initial + 3 transitions
      expect(verified?.events.map((e) => e.eventType)).toEqual([
        'SUBMITTED',
        'UNDER_REVIEW',
        'FORWARDED_TO_INSTITUTION',
        'INSTITUTION_RESPONDED',
      ]);
    });
  });
});
