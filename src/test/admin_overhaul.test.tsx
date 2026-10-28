import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import {
  AdminHeroBanner,
  AdminMetricsCards,
  ReportQueueList,
  ReportQueueItem,
  EvidenceInspector,
  EvidenceZoomModal,
  OfficialResponseComposer,
  StatusTransitionActions,
  ReportAuditTrail,
} from '../components/admin';
import { AdminView } from '../views/AdminView';
import { Report, ReportStatus, UserProfile } from '../types/domain';
import { ThemeProvider } from '../context/ThemeContext';
import * as AuthContextModule from '../context/AuthContext';
import * as TitikContextModule from '../context/TitikContext';

const mockAdminUser: UserProfile = {
  id: 'usr-admin-m3',
  username: 'verifikator_pupr',
  displayName: 'Ir. Hendrawan M.T.',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  role: 'admin',
  verifiedAgency: 'Dinas Bina Marga dan Penataan Ruang Kota Bogor',
  isVerified: true,
};

function createSampleReport(overrides: Partial<Report> = {}): Report {
  return {
    id: `rep-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    publicReference: 'TIK-2026-000101',
    reporterUserId: 'usr-citizen-1',
    title: 'Lubang Aspal Sedalam 15cm Dekat Halte Sukasari',
    description: 'Aspal amblas sangat membahayakan pengendara roda dua terutama saat hujan lebat.',
    category: 'Infrastruktur',
    severity: 'high',
    status: 'under_review',
    publicationStatus: 'published',
    location: {
      latitude: -6.595,
      longitude: 106.79,
      address: 'Jl. Pajajaran No. 45, Sukasari, Bogor Timur',
      district: 'Bogor Timur',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
    },
    facilityName: 'Halte Sukasari',
    estimatedCost: 15000000,
    responsibleAgency: 'Dinas Bina Marga dan Sumber Daya Air',
    mediaUrls: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
    ],
    supportingDocuments: [
      {
        name: 'survei-kerusakan-awal.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
        dataUrl: 'https://example.com/survei.pdf',
      },
    ],
    reporterType: 'verified_citizen',
    reporterDisplayName: 'Mamat Saputra',
    supportCount: 14,
    isSupportedByMe: false,
    budgetContext: {
      sectorId: 'sec-infra-01',
      sectorName: 'Infrastruktur Jalan',
      subSectorName: 'Pemeliharaan Jalan & Jembatan',
      paguAllocation: 42000000000,
      realizedSpending: 26500000000,
      executionRatePercent: 63.1,
      fiscalYear: 2026,
      responsibleAgency: 'Dinas PUPR Kota Bogor',
      agencyAcronym: 'PUPR',
      responsivenessScore: 88,
      avgResolutionDays: 12,
      lastUpdated: '2026-10-28T00:00:00Z',
      dataSource: 'Simulasi SIKD Kemendagri 2026',
      isSampleData: false,
    },
    events: [
      {
        id: 'ev-1',
        reportId: 'rep-001',
        eventType: 'SUBMITTED',
        actorType: 'citizen',
        actorName: 'Mamat Saputra',
        description: 'Laporan dibuat oleh warga pelapor.',
        timestamp: '2026-10-28T08:00:00Z',
      },
      {
        id: 'ev-2',
        reportId: 'rep-001',
        eventType: 'UNDER_REVIEW',
        actorType: 'agency_officer',
        actorName: 'Ir. Hendrawan M.T.',
        description: 'Verifikator memulai tinjauan teknis.',
        notes: 'Koordinasi internal dengan UPT Wilayah Timur.',
        isInternal: true,
        timestamp: '2026-10-28T09:15:00Z',
      },
    ],
    createdAt: '2026-10-28T08:00:00Z',
    updatedAt: '2026-10-28T09:15:00Z',
    isSampleData: false,
    ...overrides,
  };
}

describe('Milestone 3: Ergonomic Admin Validation Interface Overhaul Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. AdminHeroBanner Verification
  // ---------------------------------------------------------------------------
  describe('AdminHeroBanner component', () => {
    it('renders hero title, subtitle, ribbons, and Segarkan Antrean button with aria-label', () => {
      const html = renderToStaticMarkup(
        <AdminHeroBanner onRefresh={vi.fn()} isLoading={false} />
      );

      expect(html).toContain('Antrean Tinjauan &amp; Validasi Laporan');
      expect(html).toContain('Verifikasi bukti fisik, rute ke dinas penanggung jawab');
      expect(html).toContain('aria-label="Segarkan"');
      expect(html).toContain('Segarkan Antrean');
      expect(html).toContain('admin-hero-banner');
      expect(html).toContain('admin-slashes-container');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. AdminMetricsCards Verification
  // ---------------------------------------------------------------------------
  describe('AdminMetricsCards component', () => {
    it('accurately renders 4 summary KPI cards with proper counts and labels', () => {
      const metrics = {
        underReview: 5,
        needsInfo: 1,
        forwarded: 3,
        resolved: 2,
      };

      const html = renderToStaticMarkup(
        <AdminMetricsCards
          metrics={metrics}
          activeStatus="under_review"
          onSelectStatus={vi.fn()}
        />
      );

      expect(html).toContain('Menunggu Verifikasi');
      expect(html).toContain('>5<');

      expect(html).toContain('Butuh Info Warga');
      expect(html).toContain('>1<');

      expect(html).toContain('Diteruskan ke Dinas');
      expect(html).toContain('>3<');

      expect(html).toContain('Tuntas Ditangani');
      expect(html).toContain('>2<');
      expect(html).toContain('admin-metric-card');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ReportQueueList & ReportQueueItem Verification
  // ---------------------------------------------------------------------------
  describe('ReportQueueList and ReportQueueItem components', () => {
    it('renders queue items with reference code, title, address, and category badge', () => {
      const reports = [
        createSampleReport({ id: 'r1', publicReference: 'TIK-2026-000101', title: 'Lubang Aspal Sukasari' }),
        createSampleReport({ id: 'r2', publicReference: 'TIK-2026-000102', title: 'Lampu PJU Padam Pajajaran', category: 'Lingkungan', status: 'needs_info' }),
      ];

      const html = renderToStaticMarkup(
        <ReportQueueList
          reports={reports}
          totalReportsCount={2}
          selectedReportId="r1"
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

      expect(html).toContain('TIK-2026-000101');
      expect(html).toContain('Lubang Aspal Sukasari');
      expect(html).toContain('TIK-2026-000102');
      expect(html).toContain('Lampu PJU Padam Pajajaran');
      expect(html).toContain('Infrastruktur');
      expect(html).toContain('Lingkungan');
      expect(html).toContain('Semua Status');
    });

    it('renders empty queue state when reports array is empty', () => {
      const html = renderToStaticMarkup(
        <ReportQueueList
          reports={[]}
          totalReportsCount={0}
          selectedReportId=""
          onSelectReport={vi.fn()}
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          categoryFilter="Semua"
          onCategoryFilterChange={vi.fn()}
          searchQuery="TidakAda"
          onSearchQueryChange={vi.fn()}
          sortBy="newest"
          onSortByChange={vi.fn()}
        />
      );

      expect(html).toContain('Tidak ada laporan yang cocok.');
      expect(html).toContain('Reset Semua Filter');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. EvidenceInspector & EvidenceZoomModal Verification
  // ---------------------------------------------------------------------------
  describe('EvidenceInspector and EvidenceZoomModal', () => {
    it('renders evidence media, metadata strip, and verification badge', () => {
      const report = createSampleReport({
        mediaUrls: ['https://images.unsplash.com/damage.jpg'],
        supportingDocuments: [
          {
            name: 'dokumen-uji.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1234,
            dataUrl: 'https://example.com/dok.pdf',
          },
        ],
      });

      const html = renderToStaticMarkup(
        <EvidenceInspector report={report} onOpenZoom={vi.fn()} />
      );

      expect(html).toContain('Dinas &amp; Pagu');
      expect(html).toContain('Estimasi Biaya');
      expect(html).toContain('Dokumen Pendukung');
      expect(html).toContain('dokumen-uji.pdf');
      expect(html).toContain('Bukti Fisik &amp; Deskripsi');
      expect(html).toContain('Dinas Bina Marga dan Sumber Daya Air');
    });

    it('renders EvidenceZoomModal with zoom controls, title, address, and aria attributes', () => {
      const zoomMedia = {
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
        type: 'image' as const,
        title: 'Lubang Aspal Sedalam 15cm',
        address: 'Jl. Pajajaran No. 45',
      };

      const html = renderToStaticMarkup(
        <EvidenceZoomModal media={zoomMedia} onClose={vi.fn()} />
      );

      expect(html).toContain('Lubang Aspal Sedalam 15cm');
      expect(html).toContain('Jl. Pajajaran No. 45');
      expect(html).toContain('aria-label="Perbesar"');
      expect(html).toContain('aria-label="Perkecil"');
      expect(html).toContain('aria-label="Tutup Pratinjau Bukti"');
      expect(html).toContain('100%');
    });

    it('returns null from EvidenceZoomModal when media is null', () => {
      const html = renderToStaticMarkup(
        <EvidenceZoomModal media={null} onClose={vi.fn()} />
      );
      expect(html).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. OfficialResponseComposer Verification
  // ---------------------------------------------------------------------------
  describe('OfficialResponseComposer component', () => {
    it('renders public response tab with informative guidance and character count', () => {
      const html = renderToStaticMarkup(
        <OfficialResponseComposer
          reportId="rep-1"
          publicResponse="Draf perbaikan gorong-gorong"
          internalNote=""
          onChangePublicResponse={vi.fn()}
          onChangeInternalNote={vi.fn()}
          activeTab="public"
          onTabChange={vi.fn()}
        />
      );

      expect(html).toContain('Tanggapan Publik');
      expect(html).toContain('Catatan Internal');
      expect(html).toContain('Draf perbaikan gorong-gorong');
      expect(html).toContain('Tanggapan resmi ini ditampilkan secara terbuka');
      expect(html).toContain('karakter (Draf tersimpan)');
    });

    it('renders internal audit notes tab with privacy assurance', () => {
      const html = renderToStaticMarkup(
        <OfficialResponseComposer
          reportId="rep-1"
          publicResponse=""
          internalNote="Catatan inspeksi rahasia dinas verifikator"
          onChangePublicResponse={vi.fn()}
          onChangeInternalNote={vi.fn()}
          activeTab="internal"
          onTabChange={vi.fn()}
        />
      );

      expect(html).toContain('Catatan privat verifikator');
      expect(html).toContain('Catatan inspeksi rahasia dinas verifikator');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. StatusTransitionActions Matrix Verification
  // ---------------------------------------------------------------------------
  describe('StatusTransitionActions component', () => {
    it('renders all 8 action transition buttons and displays error/success feedback', () => {
      const html = renderToStaticMarkup(
        <StatusTransitionActions
          currentStatus="under_review"
          isUpdating={false}
          actionError="Tuliskan saran perbaikan yang jelas sebelum menolak laporan."
          actionSuccess="Status berhasil diperbarui."
          onApplyTransition={vi.fn()}
          onDeleteReport={vi.fn()}
        />
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');

      expect(html).toContain('role="status"');
      expect(html).toContain('Status berhasil diperbarui.');

      // Check all 8 transition buttons
      expect(html).toContain('Mulai Review');
      expect(html).toContain('Minta Info Tambahan');
      expect(html).toContain('Setujui Laporan');
      expect(html).toContain('Teruskan ke Dinas');
      expect(html).toContain('Catat Respon Dinas');
      expect(html).toContain('✓ Tandai Selesai');
      expect(html).toContain('Tolak Laporan');
      expect(html).toContain('Hapus Permanen');
      expect(html).toContain('admin-transition-btn');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. ReportAuditTrail Verification
  // ---------------------------------------------------------------------------
  describe('ReportAuditTrail component', () => {
    it('renders audit events with Indonesian formatting and distinguishes internal notes', () => {
      const events = [
        {
          id: 'ev-1',
          reportId: 'rep-001',
          eventType: 'SUBMITTED',
          actorType: 'citizen' as const,
          actorName: 'Mamat Saputra',
          description: 'Laporan dikirimkan oleh warga pelapor.',
          timestamp: '2026-10-28T08:00:00Z',
        },
        {
          id: 'ev-2',
          reportId: 'rep-001',
          eventType: 'UNDER_REVIEW',
          actorType: 'agency_officer' as const,
          actorName: 'Ir. Hendrawan M.T.',
          description: 'Verifikator memulai tinjauan teknis.',
          notes: 'Diverifikasi via citra drone.',
          isInternal: true,
          timestamp: '2026-10-28T09:15:00Z',
        },
      ];

      const html = renderToStaticMarkup(<ReportAuditTrail events={events} />);

      expect(html).toContain('Riwayat Audit Terakhir');
      expect(html).toContain('SUBMITTED');
      expect(html).toContain('UNDER_REVIEW');
      expect(html).toContain('Publik');
      expect(html).toContain('Internal');
      expect(html).toContain('Diverifikasi via citra drone.');
      expect(html).toContain('WIB');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. AdminView Integration & Contract Invariants
  // ---------------------------------------------------------------------------
  describe('AdminView integration', () => {
    it('renders full AdminView with required static contracts and test IDs', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        profile: mockAdminUser,
        isAuthenticated: true,
        isLoading: false,
        user: null,
        session: null,
        isLiveMode: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const html = renderToStaticMarkup(
        <ThemeProvider>
          <TitikContextModule.TitikProvider>
            <MemoryRouter initialEntries={['/admin']}>
              <AdminView />
            </MemoryRouter>
          </TitikContextModule.TitikProvider>
        </ThemeProvider>
      );

      // Verify all mandatory test strings
      expect(html).toContain('ADMIN PUPR');
      expect(html).toContain('Konsol');
      expect(html).toContain('aria-label="Kembali"');
      expect(html).toContain('aria-label="Segarkan"');
      expect(html).toContain('Antrean (');
      expect(html).toContain('Detail');
      expect(html).toContain('admin-hero-banner');
      expect(html).toContain('admin-metric-card');
      expect(html).toContain('admin-queue-card');
    });

    it('displays access restriction for unauthenticated or citizen users', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        profile: { ...mockAdminUser, role: 'citizen' },
        isAuthenticated: true,
        isLoading: false,
        user: null,
        session: null,
        isLiveMode: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const html = renderToStaticMarkup(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <AdminView />
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(html).toContain('Akses Khusus Verifikator PUPR');
      expect(html).toContain('Portal Tinjauan Admin memerlukan akun berwenang verifikator dinas.');
      expect(html).toContain('Kembali ke Beranda');
      expect(html).toContain('Masuk Akun Admin');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Zero Inline Styles Invariant Verification for src/components/admin/
  // ---------------------------------------------------------------------------
  describe('Zero inline styles invariant', () => {
    it('confirms 0 inline style={{ ... }} violations across all src/components/admin/ files', () => {
      const adminDir = path.resolve(__dirname, '../components/admin');
      const files = fs.readdirSync(adminDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

      for (const file of files) {
        const fullPath = path.join(adminDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (/style\s*=\s*\{\{/.test(line)) {
            throw new Error(`Inline style violation found in ${file}:${idx + 1}: ${line}`);
          }
        });
      }
    });
  });
});
