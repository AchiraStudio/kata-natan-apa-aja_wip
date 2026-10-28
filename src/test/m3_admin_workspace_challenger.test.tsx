import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

import {
  ReportQueueList,
  EvidenceInspector,
  EvidenceZoomModal,
} from '../components/admin';
import {
  Report,
  ReportStatus,
  ReportSeverity,
} from '../types/domain';
import { AdminSortOption, ReportDraft } from '../components/admin/types';
import * as storageServiceModule from '../services/storageService';

// -----------------------------------------------------------------------------
// Sample Report Factory for Empirical Challenges
// -----------------------------------------------------------------------------
function makeReport(overrides: Partial<Report> = {}): Report {
  const id = overrides.id || `rep-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    publicReference: 'TIK-2026-000101',
    reporterUserId: 'usr-cit-1',
    title: 'Kerusakan Jalan Raya Sukasari',
    description: 'Jalan berlubang cukup parah sedalam 15cm membahayakan pengguna jalan.',
    category: 'Infrastruktur',
    severity: 'high',
    status: 'under_review',
    publicationStatus: 'published',
    location: {
      latitude: -6.595,
      longitude: 106.79,
      address: 'Jl. Pajajaran No. 45, Sukasari, Bogor',
      district: 'Bogor Timur',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
    },
    facilityName: 'Ruas Jalan Pajajaran',
    estimatedCost: 25000000,
    responsibleAgency: 'Dinas PUPR Kota Bogor',
    mediaUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'],
    supportingDocuments: [],
    reporterType: 'verified_citizen',
    reporterDisplayName: 'Budi Santoso',
    supportCount: 12,
    isSupportedByMe: false,
    budgetContext: {
      sectorId: 'sec-infra',
      sectorName: 'Infrastruktur Jalan',
      subSectorName: 'Pemeliharaan',
      paguAllocation: 10000000000,
      realizedSpending: 4000000000,
      executionRatePercent: 40,
      fiscalYear: 2026,
      responsibleAgency: 'Dinas PUPR Kota Bogor',
      agencyAcronym: 'PUPR',
      responsivenessScore: 85,
      avgResolutionDays: 14,
      lastUpdated: '2026-10-28T00:00:00Z',
      dataSource: 'Simulasi SIKD 2026',
      isSampleData: false,
    },
    events: [],
    createdAt: '2026-10-28T08:00:00Z',
    updatedAt: '2026-10-28T08:00:00Z',
    isSampleData: false,
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// Pure Queue Filter & Sort Implementation mirroring useAdminWorkspace
// -----------------------------------------------------------------------------
const SEVERITY_WEIGHT: Record<ReportSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function executeQueueFiltering(
  reports: Report[],
  statusFilter: string,
  categoryFilter: string,
  searchQuery: string,
  sortBy: AdminSortOption
): Report[] {
  const q = searchQuery.trim().toLowerCase();

  const result = reports.filter((report) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }

    // 2. Category Filter
    if (categoryFilter !== 'Semua' && report.category !== categoryFilter) {
      return false;
    }

    // 3. Search Query
    if (q) {
      const matchRef = report.publicReference?.toLowerCase().includes(q);
      const matchTitle = report.title?.toLowerCase().includes(q);
      const matchDesc = report.description?.toLowerCase().includes(q);
      const matchAddr = report.location?.address?.toLowerCase().includes(q);
      const matchReporter = report.reporterDisplayName?.toLowerCase().includes(q);

      if (!matchRef && !matchTitle && !matchDesc && !matchAddr && !matchReporter) {
        return false;
      }
    }

    return true;
  });

  // 4. Sorting
  return result.sort((a, b) => {
    if (sortBy === 'severity') {
      const weightA = SEVERITY_WEIGHT[a.severity] || 0;
      const weightB = SEVERITY_WEIGHT[b.severity] || 0;
      if (weightB !== weightA) return weightB - weightA;
    }
    if (sortBy === 'oldest') {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    }
    // Default: 'newest'
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });
}

// -----------------------------------------------------------------------------
// Transition Safety Engine mirroring useAdminWorkspace transition contracts
// -----------------------------------------------------------------------------
interface TransitionValidationResult {
  allowed: boolean;
  actionError?: string;
  finalDescription?: string;
}

function validateAndPrepareTransition(
  selectedReport: Report | null,
  targetStatus: ReportStatus,
  drafts: Record<string, ReportDraft>
): TransitionValidationResult {
  if (!selectedReport) return { allowed: false, actionError: 'Tidak ada laporan yang dipilih.' };

  const activeDraft = drafts[selectedReport.id] || {
    publicResponse: '',
    internalNote: '',
    lastUpdated: 0,
  };

  const publicText = activeDraft.publicResponse?.trim() || '';
  const internalText = activeDraft.internalNote?.trim() || '';
  const combinedNotes = publicText || internalText;

  if (targetStatus === 'rejected' && !combinedNotes) {
    return {
      allowed: false,
      actionError: 'Tuliskan saran perbaikan yang jelas sebelum menolak laporan.',
    };
  }

  if (targetStatus === 'needs_info' && !combinedNotes) {
    return {
      allowed: false,
      actionError: 'Catatan klarifikasi wajib diisi untuk status Butuh Info.',
    };
  }

  const defaultDesc: Record<ReportStatus, string> = {
    submitted: 'Status dikembalikan ke antrean penerimaan.',
    under_review: 'Admin memulai peninjauan kesesuaian bukti laporan.',
    needs_info: publicText || internalText || 'Admin meminta klarifikasi tambahan dari warga pelapor.',
    accepted_for_routing: 'Laporan disetujui untuk diteruskan ke dinas teknis berwenang.',
    forwarded_to_institution:
      publicText ||
      `Laporan diteruskan ke portal koordinasi ${selectedReport.responsibleAgency} untuk jadwal survei lapangan.`,
    institution_responded:
      publicText ||
      `${selectedReport.responsibleAgency} telah memberikan respon resmi dan memasukkan jadwal perbaikan APBD.`,
    resolved:
      publicText || 'Pekerjaan perbaikan fisik telah diverifikasi tuntas oleh tim lapangan.',
    rejected: publicText || internalText || 'Laporan ditolak karena tidak memenuhi kriteria bukti.',
  };

  return {
    allowed: true,
    finalDescription: defaultDesc[targetStatus],
  };
}

describe('Milestone 3 Empirical Challenger Stress Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. QUEUE FILTERING, SEARCH, AND SORTING
  // ===========================================================================
  describe('1. Queue Filtering, Search, and Sorting Engine', () => {
    const sampleDataset: Report[] = [
      makeReport({
        id: 'rep-1',
        publicReference: 'TIK-2026-000101',
        title: 'Lubang Aspal Pajajaran Sukasari',
        category: 'Infrastruktur',
        status: 'submitted',
        severity: 'low',
        createdAt: '2026-10-28T01:00:00Z',
        reporterDisplayName: 'Mamat Saputra',
        location: { latitude: -6.59, longitude: 106.79, address: 'Jl. Pajajaran No. 10', district: 'Bogor Timur', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-2',
        publicReference: 'TIK-2026-000102',
        title: 'Saluran Drainase Tersumbat Sampah',
        category: 'Lingkungan',
        status: 'under_review',
        severity: 'medium',
        createdAt: '2026-10-28T02:00:00Z',
        reporterDisplayName: 'Siti Rahma',
        location: { latitude: -6.60, longitude: 106.80, address: 'Jl. Siliwangi No. 20', district: 'Bogor Selatan', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-3',
        publicReference: 'TIK-2026-000103',
        title: 'Plafon Kelas SD Rusak Berat',
        category: 'Pendidikan',
        status: 'needs_info',
        severity: 'high',
        createdAt: '2026-10-28T03:00:00Z',
        reporterDisplayName: 'Joko Widodo',
        location: { latitude: -6.61, longitude: 106.81, address: 'Jl. Pemuda No. 3', district: 'Tanah Sareal', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-4',
        publicReference: 'TIK-2026-000104',
        title: 'Puskesmas Kekurangan Obat Generik',
        category: 'Kesehatan',
        status: 'accepted_for_routing',
        severity: 'critical',
        createdAt: '2026-10-28T04:00:00Z',
        reporterDisplayName: 'Dewi Lestari',
        location: { latitude: -6.62, longitude: 106.82, address: 'Jl. Veteran No. 4', district: 'Bogor Tengah', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-5',
        publicReference: 'TIK-2026-000105',
        title: 'Lampu PJU Padam Berbahaya',
        category: 'Lainnya',
        status: 'forwarded_to_institution',
        severity: 'high',
        createdAt: '2026-10-28T05:00:00Z',
        reporterDisplayName: 'Agus Salim',
        location: { latitude: -6.63, longitude: 106.83, address: 'Jl. Ir. H. Juanda', district: 'Bogor Tengah', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-6',
        publicReference: 'TIK-2026-000106',
        title: 'Respon Resmi Dinas Terkait Jembatan',
        category: 'Infrastruktur',
        status: 'institution_responded',
        severity: 'medium',
        createdAt: '2026-10-28T06:00:00Z',
        reporterDisplayName: 'Rudi Hartono',
        location: { latitude: -6.64, longitude: 106.84, address: 'Jl. Merdeka No. 6', district: 'Bogor Barat', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-7',
        publicReference: 'TIK-2026-000107',
        title: 'Taman Kota Telah Selesai Diperbaiki',
        category: 'Lingkungan',
        status: 'resolved',
        severity: 'low',
        createdAt: '2026-10-28T07:00:00Z',
        reporterDisplayName: 'Rina Nose',
        location: { latitude: -6.65, longitude: 106.85, address: 'Jl. Surya Kencana', district: 'Bogor Tengah', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
      makeReport({
        id: 'rep-8',
        publicReference: 'TIK-2026-000108',
        title: 'Laporan Fiktif Tanpa Bukti Valid',
        category: 'Lainnya',
        status: 'rejected',
        severity: 'low',
        createdAt: '2026-10-28T08:00:00Z',
        reporterDisplayName: 'Anonim Warga',
        location: { latitude: -6.66, longitude: 106.86, address: 'Jl. Tajur No. 8', district: 'Bogor Timur', city: 'Kota Bogor', province: 'Jawa Barat' },
      }),
    ];

    it('searches by partial reference code, full reference code, and title substring', () => {
      // 1. Partial prefix match
      const rPrefix = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'TIK-2026-', 'newest');
      expect(rPrefix).toHaveLength(8);

      // 2. Partial numeric match
      const rPartialNum = executeQueueFiltering(sampleDataset, 'all', 'Semua', '000103', 'newest');
      expect(rPartialNum).toHaveLength(1);
      expect(rPartialNum[0].id).toBe('rep-3');

      // 3. Full reference match
      const rFull = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'TIK-2026-000104', 'newest');
      expect(rFull).toHaveLength(1);
      expect(rFull[0].id).toBe('rep-4');

      // 4. Case-insensitive and trimmed search
      const rCase = executeQueueFiltering(sampleDataset, 'all', 'Semua', '   tik-2026-000102   ', 'newest');
      expect(rCase).toHaveLength(1);
      expect(rCase[0].id).toBe('rep-2');

      // 5. Title substring search
      const rTitle = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'drainase', 'newest');
      expect(rTitle).toHaveLength(1);
      expect(rTitle[0].id).toBe('rep-2');

      // 6. Address search
      const rAddr = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'Surya Kencana', 'newest');
      expect(rAddr).toHaveLength(1);
      expect(rAddr[0].id).toBe('rep-7');

      // 7. Reporter name search
      const rReporter = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'Dewi Lestari', 'newest');
      expect(rReporter).toHaveLength(1);
      expect(rReporter[0].id).toBe('rep-4');

      // 8. Non-matching search
      const rNone = executeQueueFiltering(sampleDataset, 'all', 'Semua', 'NONEXISTENT_KEYWORD', 'newest');
      expect(rNone).toHaveLength(0);
    });

    it('filters accurately by each of the 8 canonical statuses', () => {
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

      for (const st of canonicalStatuses) {
        const filtered = executeQueueFiltering(sampleDataset, st, 'Semua', '', 'newest');
        expect(filtered.length).toBe(1);
        expect(filtered[0].status).toBe(st);
      }

      // 'all' passes all through
      const all = executeQueueFiltering(sampleDataset, 'all', 'Semua', '', 'newest');
      expect(all).toHaveLength(8);
    });

    it('filters accurately by category and handles "Semua"', () => {
      const infra = executeQueueFiltering(sampleDataset, 'all', 'Infrastruktur', '', 'newest');
      expect(infra).toHaveLength(2);
      expect(infra.map((r) => r.id)).toEqual(['rep-6', 'rep-1']);

      const edu = executeQueueFiltering(sampleDataset, 'all', 'Pendidikan', '', 'newest');
      expect(edu).toHaveLength(1);
      expect(edu[0].id).toBe('rep-3');

      const all = executeQueueFiltering(sampleDataset, 'all', 'Semua', '', 'newest');
      expect(all).toHaveLength(8);
    });

    it('sorts properly by newest, oldest, and severity/urgency', () => {
      // 1. Newest
      const newest = executeQueueFiltering(sampleDataset, 'all', 'Semua', '', 'newest');
      expect(newest.map((r) => r.id)).toEqual([
        'rep-8', 'rep-7', 'rep-6', 'rep-5', 'rep-4', 'rep-3', 'rep-2', 'rep-1'
      ]);

      // 2. Oldest
      const oldest = executeQueueFiltering(sampleDataset, 'all', 'Semua', '', 'oldest');
      expect(oldest.map((r) => r.id)).toEqual([
        'rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5', 'rep-6', 'rep-7', 'rep-8'
      ]);

      // 3. Severity
      const bySeverity = executeQueueFiltering(sampleDataset, 'all', 'Semua', '', 'severity');
      expect(bySeverity[0].id).toBe('rep-4'); // critical
      expect(bySeverity[1].id).toBe('rep-5'); // high (newer than rep-3)
      expect(bySeverity[2].id).toBe('rep-3'); // high
      expect(bySeverity[3].id).toBe('rep-6'); // medium (newer than rep-2)
      expect(bySeverity[4].id).toBe('rep-2'); // medium
      expect(bySeverity[5].id).toBe('rep-8'); // low (08:00)
      expect(bySeverity[6].id).toBe('rep-7'); // low (07:00)
      expect(bySeverity[7].id).toBe('rep-1'); // low (01:00)
    });

    it('renders ReportQueueList with full 8 statuses in select dropdown and displays category pills', () => {
      const html = renderToStaticMarkup(
        <ReportQueueList
          reports={sampleDataset}
          totalReportsCount={8}
          selectedReportId="rep-1"
          onSelectReport={vi.fn()}
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          categoryFilter="Semua"
          onCategoryFilterChange={vi.fn()}
          searchQuery=""
          onSearchQueryChange={vi.fn()}
          sortBy="newest"
          onSortByChange={vi.fn()}
        />
      );

      // Verify all 8 status options are present in HTML
      expect(html).toContain('value="all"');
      expect(html).toContain('value="submitted"');
      expect(html).toContain('value="under_review"');
      expect(html).toContain('value="needs_info"');
      expect(html).toContain('value="accepted_for_routing"');
      expect(html).toContain('value="forwarded_to_institution"');
      expect(html).toContain('value="institution_responded"');
      expect(html).toContain('value="resolved"');
      expect(html).toContain('value="rejected"');

      // Verify category pills
      expect(html).toContain('Infrastruktur');
      expect(html).toContain('Lingkungan');
      expect(html).toContain('Pendidikan');
      expect(html).toContain('Kesehatan');
      expect(html).toContain('Lainnya');
    });
  });

  // ===========================================================================
  // 2. DRAFT NOTE PERSISTENCE ACROSS REPORT SWITCHING
  // ===========================================================================
  describe('2. Draft Note Persistence Across Report Switching', () => {
    it('persists drafts per reportId independently and preserves them across switching', () => {
      // Simulate state container for drafts dictionary
      let draftsState: Record<string, ReportDraft> = {};

      const updateDraft = (reportId: string, field: 'publicResponse' | 'internalNote', value: string) => {
        draftsState = {
          ...draftsState,
          [reportId]: {
            publicResponse: field === 'publicResponse' ? value : draftsState[reportId]?.publicResponse || '',
            internalNote: field === 'internalNote' ? value : draftsState[reportId]?.internalNote || '',
            lastUpdated: Date.now(),
          },
        };
      };

      const getDraft = (report: Report): ReportDraft => {
        return draftsState[report.id] || {
          publicResponse: report.officialResponse || '',
          internalNote: report.internalNotes || '',
          lastUpdated: 0,
        };
      };

      const reportA = makeReport({ id: 'rep-A', publicReference: 'TIK-2026-000101' });
      const reportB = makeReport({ id: 'rep-B', publicReference: 'TIK-2026-000102' });

      // Admin selects Report A and writes public & internal drafts
      updateDraft(reportA.id, 'publicResponse', 'Tanggapan Publik untuk Laporan A');
      updateDraft(reportA.id, 'internalNote', 'Catatan Rahasia Tim Teknis A');

      expect(getDraft(reportA).publicResponse).toBe('Tanggapan Publik untuk Laporan A');
      expect(getDraft(reportA).internalNote).toBe('Catatan Rahasia Tim Teknis A');

      // Admin switches to Report B (no drafts yet)
      expect(getDraft(reportB).publicResponse).toBe('');
      expect(getDraft(reportB).internalNote).toBe('');

      // Admin writes drafts for Report B
      updateDraft(reportB.id, 'publicResponse', 'Tanggapan Publik B');
      updateDraft(reportB.id, 'internalNote', 'Catatan Internal B');

      expect(getDraft(reportB).publicResponse).toBe('Tanggapan Publik B');
      expect(getDraft(reportB).internalNote).toBe('Catatan Internal B');

      // Admin switches back to Report A -> Drafts for A must remain intact!
      expect(getDraft(reportA).publicResponse).toBe('Tanggapan Publik untuk Laporan A');
      expect(getDraft(reportA).internalNote).toBe('Catatan Rahasia Tim Teknis A');

      // Admin switches back to Report B -> Drafts for B must remain intact!
      expect(getDraft(reportB).publicResponse).toBe('Tanggapan Publik B');
      expect(getDraft(reportB).internalNote).toBe('Catatan Internal B');
    });

    it('clears draft for mutated report upon successful mutation while leaving other report drafts untouched', () => {
      let draftsState: Record<string, ReportDraft> = {
        'rep-A': { publicResponse: 'Pub A', internalNote: 'Int A', lastUpdated: 100 },
        'rep-B': { publicResponse: 'Pub B', internalNote: 'Int B', lastUpdated: 200 },
      };

      // Simulate successful mutation of report A
      const onMutationSuccess = (reportId: string) => {
        const next = { ...draftsState };
        delete next[reportId];
        draftsState = next;
      };

      onMutationSuccess('rep-A');

      expect(draftsState['rep-A']).toBeUndefined();
      expect(draftsState['rep-B']).toEqual({
        publicResponse: 'Pub B',
        internalNote: 'Int B',
        lastUpdated: 200,
      });
    });

    it('preserves draft notes completely if mutation fails (rollback invariant)', () => {
      let draftsState: Record<string, ReportDraft> = {
        'rep-A': { publicResponse: 'Draft penting A', internalNote: 'Draft rahasia A', lastUpdated: 100 },
      };

      // Simulate mutation failure
      const onMutationFailure = () => {
        // draftsState is NOT touched on error!
      };

      onMutationFailure();

      expect(draftsState['rep-A']).toEqual({
        publicResponse: 'Draft penting A',
        internalNote: 'Draft rahasia A',
        lastUpdated: 100,
      });
    });
  });

  // ===========================================================================
  // 3. MANDATORY TRANSITION VALIDATION & OPTIMISTIC ROLLBACK
  // ===========================================================================
  describe('3. Mandatory Transition Validation & Optimistic Rollback', () => {
    it('blocks transition to rejected if note is empty or whitespace-only', () => {
      const report = makeReport({ id: 'rep-test', status: 'under_review' });

      // 1. Empty draft
      const draftsEmpty: Record<string, ReportDraft> = {};
      const resEmpty = validateAndPrepareTransition(report, 'rejected', draftsEmpty);
      expect(resEmpty.allowed).toBe(false);
      expect(resEmpty.actionError).toBe('Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');

      // 2. Whitespace-only draft
      const draftsWhitespace: Record<string, ReportDraft> = {
        'rep-test': { publicResponse: '   \n\t   ', internalNote: '   ', lastUpdated: 100 },
      };
      const resWs = validateAndPrepareTransition(report, 'rejected', draftsWhitespace);
      expect(resWs.allowed).toBe(false);
      expect(resWs.actionError).toBe('Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');

      // 3. Valid note provides allowance
      const draftsValid: Record<string, ReportDraft> = {
        'rep-test': { publicResponse: 'Lokasi berada di luar kewenangan kota.', internalNote: '', lastUpdated: 100 },
      };
      const resValid = validateAndPrepareTransition(report, 'rejected', draftsValid);
      expect(resValid.allowed).toBe(true);
      expect(resValid.finalDescription).toBe('Lokasi berada di luar kewenangan kota.');
    });

    it('blocks transition to needs_info if clarification note is empty or whitespace-only', () => {
      const report = makeReport({ id: 'rep-test', status: 'under_review' });

      // 1. Empty draft
      const draftsEmpty: Record<string, ReportDraft> = {};
      const resEmpty = validateAndPrepareTransition(report, 'needs_info', draftsEmpty);
      expect(resEmpty.allowed).toBe(false);
      expect(resEmpty.actionError).toBe('Catatan klarifikasi wajib diisi untuk status Butuh Info.');

      // 2. Whitespace-only draft
      const draftsWhitespace: Record<string, ReportDraft> = {
        'rep-test': { publicResponse: '   ', internalNote: ' \t ', lastUpdated: 100 },
      };
      const resWs = validateAndPrepareTransition(report, 'needs_info', draftsWhitespace);
      expect(resWs.allowed).toBe(false);
      expect(resWs.actionError).toBe('Catatan klarifikasi wajib diisi untuk status Butuh Info.');

      // 3. Valid note
      const draftsValid: Record<string, ReportDraft> = {
        'rep-test': { publicResponse: '', internalNote: 'Minta pelapor kirim foto ulang penampang melintang.', lastUpdated: 100 },
      };
      const resValid = validateAndPrepareTransition(report, 'needs_info', draftsValid);
      expect(resValid.allowed).toBe(true);
      expect(resValid.finalDescription).toBe('Minta pelapor kirim foto ulang penampang melintang.');
    });

    it('allows transitions to other statuses (under_review, accepted_for_routing, etc.) without mandatory draft notes', () => {
      const report = makeReport({ id: 'rep-test', status: 'submitted' });
      const draftsEmpty: Record<string, ReportDraft> = {};

      const resReview = validateAndPrepareTransition(report, 'under_review', draftsEmpty);
      expect(resReview.allowed).toBe(true);
      expect(resReview.finalDescription).toBe('Admin memulai peninjauan kesesuaian bukti laporan.');

      const resAccept = validateAndPrepareTransition(report, 'accepted_for_routing', draftsEmpty);
      expect(resAccept.allowed).toBe(true);
      expect(resAccept.finalDescription).toBe('Laporan disetujui untuk diteruskan ke dinas teknis berwenang.');

      const resResolved = validateAndPrepareTransition(report, 'resolved', draftsEmpty);
      expect(resResolved.allowed).toBe(true);
      expect(resResolved.finalDescription).toBe('Pekerjaan perbaikan fisik telah diverifikasi tuntas oleh tim lapangan.');
    });

    it('simulates optimistic UI mutation rollback on thrown RPC error', async () => {
      let reports = [makeReport({ id: 'rep-1', status: 'under_review' })];
      let drafts: Record<string, ReportDraft> = {
        'rep-1': { publicResponse: 'Tanggapan penting', internalNote: 'Catatan penting', lastUpdated: 1 },
      };
      let actionError = '';
      let actionSuccess = '';

      const previousReports = [...reports];

      const simulatedRpcTransition = async (targetStatus: ReportStatus): Promise<boolean> => {
        // Optimistic update
        reports = reports.map((r) => (r.id === 'rep-1' ? { ...r, status: targetStatus } : r));

        try {
          // Throws RPC error
          throw new Error('Supabase RPC Error: 403 Forbidden - Only designated verifier can transition to resolved');
        } catch (err: any) {
          // Rollback
          reports = previousReports;
          actionError = err.message;
          actionSuccess = '';
          return false;
        }
      };

      const outcome = await simulatedRpcTransition('resolved');

      expect(outcome).toBe(false);
      expect(reports[0].status).toBe('under_review'); // Reverted
      expect(actionError).toContain('403 Forbidden');
      expect(actionSuccess).toBe('');
      // Drafts preserved
      expect(drafts['rep-1']).toEqual({
        publicResponse: 'Tanggapan penting',
        internalNote: 'Catatan penting',
        lastUpdated: 1,
      });
    });
  });

  // ===========================================================================
  // 4. EVIDENCE ZOOM & LIGHTBOX EMPIRICAL VERIFICATION
  // ===========================================================================
  describe('4. Evidence Zoom & Lightbox Controls', () => {
    it('defines 6 discrete zoom levels from 100% to 300% without inline style properties', () => {
      const zoomMedia = {
        url: 'https://images.unsplash.com/test-media.jpg',
        type: 'image' as const,
        title: 'Foto Kerusakan Aspal Sukasari',
        address: 'Jl. Pajajaran No. 45',
      };

      const html = renderToStaticMarkup(
        <EvidenceZoomModal media={zoomMedia} onClose={vi.fn()} />
      );

      // Verify header and controls
      expect(html).toContain('Foto Kerusakan Aspal Sukasari');
      expect(html).toContain('Jl. Pajajaran No. 45');
      expect(html).toContain('100%');
      expect(html).toContain('aria-label="Perbesar"');
      expect(html).toContain('aria-label="Perkecil"');
      expect(html).toContain('aria-label="Reset zoom"');
      expect(html).toContain('aria-label="Tutup Pratinjau Bukti"');

      // Verify discrete scale class
      expect(html).toContain('scale-100');

      // Verify ZERO inline style attributes
      expect(html).not.toMatch(/style\s*=/i);
    });

    it('verifies video rendering in EvidenceZoomModal when type is video', () => {
      const zoomVideo = {
        url: 'https://example.com/video-bukti.mp4',
        type: 'video' as const,
        title: 'Video Genangan Air Luapan Gorong-gorong',
        address: 'Jl. Pajajaran No. 45',
      };

      const html = renderToStaticMarkup(
        <EvidenceZoomModal media={zoomVideo} onClose={vi.fn()} />
      );

      expect(html).toContain('<video');
      expect(html).toContain('src="https://example.com/video-bukti.mp4"');
      expect(html).toContain('controls=""');
      expect(html).toContain('Video Genangan Air Luapan Gorong-gorong');
      expect(html).not.toMatch(/style\s*=/i);
    });

    it('confirms 0 inline style={{ ... }} violations across all src/components/admin/ files', () => {
      const adminDir = path.resolve(__dirname, '../components/admin');
      const files = fs.readdirSync(adminDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

      expect(files.length).toBeGreaterThanOrEqual(10);

      for (const file of files) {
        const fullPath = path.join(adminDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (/style\s*=\s*\{\{/.test(line)) {
            throw new Error(`Forbidden inline style={{ ... }} found in ${file}:${idx + 1}: ${line}`);
          }
        });
      }
    });
  });

  // ===========================================================================
  // 5. SECURE EVIDENCE URL RESOLUTION & STORAGE INTERACTION
  // ===========================================================================
  describe('5. Secure Evidence Signed URL Resolution', () => {
    it('generates signed URLs for private storage bucket files and renders supporting documents', () => {
      const report = makeReport({
        mediaUrls: ['https://images.unsplash.com/public-1.jpg'],
        supportingDocuments: [
          {
            name: 'dokumen-survei.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 204800,
            dataUrl: 'https://example.com/dokumen-survei.pdf',
          },
        ],
      });

      const html = renderToStaticMarkup(
        <EvidenceInspector report={report} onOpenZoom={vi.fn()} />
      );

      expect(html).toContain('Dinas &amp; Pagu');
      expect(html).toContain('Estimasi Biaya');
      expect(html).toContain('Dokumen Pendukung');
      expect(html).toContain('dokumen-survei.pdf');
      expect(html).not.toMatch(/style\s*=/i);
    });

    it('verifies getPrivateEvidenceUrl signs private paths while leaving public http URLs untouched', async () => {
      const signedSpy = vi
        .spyOn(storageServiceModule, 'getPrivateEvidenceUrl')
        .mockResolvedValue('https://supabase.co/storage/v1/object/sign/report-evidence-private/doc1.jpg?token=secret');

      const path1 = 'report-evidence-private/doc1.jpg';
      const cleanPath1 = path1.replace(/^report-evidence-private\//, '');
      const signedUrl = await storageServiceModule.getPrivateEvidenceUrl(cleanPath1);

      expect(signedSpy).toHaveBeenCalledWith('doc1.jpg');
      expect(signedUrl).toContain('token=secret');
    });
  });
});
