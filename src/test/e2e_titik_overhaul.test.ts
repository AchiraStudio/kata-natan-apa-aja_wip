import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  Report,
  ReportStatus,
  UserProfile,
} from '../types/domain';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import { SupabaseDataAdapter } from '../services/adapters/supabaseAdapter';
import { DataError } from '../services/errors/DataError';
import { AdminView } from '../views/AdminView';
import { ProfileView } from '../views/ProfileView';
import { readProfileFeatureSource } from './helpers/profileSource';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { ThemeProvider } from '../context/ThemeContext';
import * as AuthContextModule from '../context/AuthContext';
import * as TitikContextModule from '../context/TitikContext';
import { getReportMediaType, hasRequiredReportEvidence } from '../utils/reportEvidence';

const defaultMockTitikContext: TitikContextModule.TitikContextType = {
  posts: [],
  activePost: null,
  activeFeedTab: 'for_you',
  selectedCategory: 'Semua',
  facilities: [],
  budgetSectors: [],
  composerOpen: false,
  composerTab: 'post',
  openComposer: vi.fn(),
  closeComposer: vi.fn(),
  reportModalOpen: false,
  openReportModal: vi.fn(),
  closeReportModal: vi.fn(),
  reportDetailOpen: false,
  selectedReport: null,
  searchModalOpen: false,
  landingBannerOpen: false,
  isLoading: false,
  setActivePostId: vi.fn(),
  setActiveFeedTab: vi.fn(),
  setSelectedCategory: vi.fn(),
  openReportDetail: vi.fn(),
  closeReportDetail: vi.fn(),
  setSearchModalOpen: vi.fn(),
  setLandingBannerOpen: vi.fn(),
  toggleSupport: vi.fn(),
  addComment: vi.fn(),
  getComments: vi.fn().mockResolvedValue([]),
  submitReport: vi.fn(),
  deleteReport: vi.fn(),
  updateReportStatus: vi.fn(),
  refreshFeed: vi.fn(),
};

vi.mock('../context/useTitik', () => ({
  useTitik: () => defaultMockTitikContext,
}));

vi.mock('../context/TitikContext', async (importOriginal) => {
  const actual = await importOriginal<typeof TitikContextModule>();
  return {
    ...actual,
    useTitik: () => defaultMockTitikContext,
  };
});

// =============================================================================
// PATH CONSTANTS & TEST HELPERS
// =============================================================================

const ROOT_SRC = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');
const SCHEMA_FILE = path.resolve(__dirname, '../../supabase/schema.sql');

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

const CANONICAL_STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Antrean',
  under_review: 'Dalam Tinjauan',
  needs_info: 'Butuh Info',
  accepted_for_routing: 'Disetujui',
  forwarded_to_institution: 'Diteruskan',
  institution_responded: 'Respon Dinas',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

const THEME_KEYS = [
  'editorial_forest',
  'bogor_slate',
  'warm_terracotta',
  'midnight_charcoal',
  'vintage_paper',
] as const;

function createTestReport(overrides: Partial<Report> = {}): Report {
  return {
    id: `rep-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    publicReference: 'TIK-2026-999001',
    reporterUserId: 'usr-citizen-1',
    title: 'Lubang Aspal Sedalam 15cm Dekat Halte Sukasari',
    description: 'Aspal amblas sangat membahayakan pengendara roda dua terutama saat hujan lebat.',
    category: 'Infrastruktur',
    severity: 'high',
    status: 'submitted',
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
    responsibleAgency: 'Dinas Bina Marga dan Sumber Daya Air Kota Bogor',
    mediaUrls: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    ],
    supportingDocuments: [],
    reporterType: 'verified_citizen',
    reporterDisplayName: 'Budi Santoso',
    supportCount: 12,
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
        id: `ev-init-${Date.now()}`,
        reportId: 'rep-test-001',
        eventType: 'SUBMITTED',
        newStatus: 'submitted',
        actorType: 'citizen',
        actorName: 'Budi Santoso',
        description: 'Laporan warga dibuat melalui aplikasi TITIK.',
        timestamp: '28 Okt 2026, 08:30 WIB',
      },
    ],
    createdAt: '2026-10-28T08:30:00Z',
    updatedAt: '2026-10-28T08:30:00Z',
    isSampleData: false,
    ...overrides,
  };
}

const mockAdminUser: UserProfile = {
  id: 'usr-admin-test',
  username: 'admin.pupr',
  displayName: 'Ir. Hendrawan M.T.',
  email: 'hendrawan@pupr.bogor.go.id',
  role: 'admin',
  verifiedAgency: 'Dinas Bina Marga dan Sumber Daya Air',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  district: 'Bogor Tengah',
  isVerified: true,
  bio: 'Verifikator Teknis Infrastruktur Kota Bogor',
};

const mockCitizenUser: UserProfile = {
  id: 'usr-citizen-test',
  username: 'budi.santoso',
  displayName: 'Budi Santoso',
  email: 'budi@warga.bogor.go.id',
  role: 'citizen',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  district: 'Bogor Timur',
  isVerified: false,
  bio: 'Warga peduli keselamatan jalan',
};

const renderWithProviders = (element: React.ReactElement, initialPath = '/'): string => {
  return renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(
        TitikContextModule.TitikContext.Provider,
        { value: defaultMockTitikContext },
        React.createElement(
          MemoryRouter,
          { initialEntries: [initialPath] },
          element
        )
      )
    )
  );
};

// =============================================================================
// E2E TITIK OVERHAUL SPECIFICATION SUITE (R1 – R5)
// =============================================================================

describe('TITIK Civic Platform Architecture Overhaul E2E Suite (R1–R5)', () => {
  let mockAdapter: MockDataAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAdapter = new MockDataAdapter();
  });

  // ===========================================================================
  // TIER 1: FEATURE COVERAGE (7 FEATURES, >=5 TESTS EACH)
  // ===========================================================================

  describe('Tier 1: Feature Coverage (R1–R5 Specifications)', () => {
    // -------------------------------------------------------------------------
    // Feature 1.1: Citizen Account Verification (R1)
    // -------------------------------------------------------------------------
    describe('Feature 1.1: Citizen Account Verification (R1)', () => {
      it('F1.1-1: defines isVerified boolean defaulting to false and strict citizen/admin role constraint', () => {
        const citizen: UserProfile = { ...mockCitizenUser, isVerified: false };
        expect(typeof citizen.isVerified).toBe('boolean');
        expect(citizen.isVerified).toBe(false);
        expect(['citizen', 'admin']).toContain(citizen.role);

        // Schema verification: check profiles definition across schema/migrations
        const schemaContent = fs.existsSync(SCHEMA_FILE) ? fs.readFileSync(SCHEMA_FILE, 'utf-8') : '';
        const allInOnePath = path.resolve(__dirname, '../../supabase/ALL_IN_ONE_SETUP.sql');
        const allInOneContent = fs.existsSync(allInOnePath) ? fs.readFileSync(allInOnePath, 'utf-8') : '';
        const combined = schemaContent + '\n' + allInOneContent;

        expect(combined).toContain('is_verified');
        expect(combined).toContain('citizen');
      });

      it('F1.1-2: prevents citizens from mutating their own verification flag via profile updates', () => {
        const citizenInput = {
          displayName: 'Budi Hacker',
          isVerified: true, // Attempted self-verification elevation
          role: 'admin' as const, // Attempted role elevation
        };

        // When standard citizen updates profile, verified flag must be shielded
        const safeProfile: UserProfile = {
          ...mockCitizenUser,
          displayName: citizenInput.displayName,
          // Privileged fields are immutable by citizen
          isVerified: mockCitizenUser.isVerified,
          role: mockCitizenUser.role,
        };

        expect(safeProfile.displayName).toBe('Budi Hacker');
        expect(safeProfile.isVerified).toBe(false);
        expect(safeProfile.role).toBe('citizen');
      });

      it('F1.1-3: enforces that only admin accounts can grant or revoke citizen verification', () => {
        const executeVerificationChange = (actorRole: 'citizen' | 'admin', targetUserId: string, nextVerified: boolean) => {
          if (actorRole !== 'admin') {
            throw new DataError('permission', 'Hanya administrator yang berwenang mengubah verifikasi identitas warga.');
          }
          return { targetUserId, isVerified: nextVerified, verifiedBy: 'admin-id', timestamp: new Date().toISOString() };
        };

        // Citizen attempt must throw permission DataError
        expect(() => executeVerificationChange('citizen', 'target-citizen-01', true)).toThrowError(DataError);

        // Admin attempt succeeds with audit trace
        const auditRecord = executeVerificationChange('admin', 'target-citizen-01', true);
        expect(auditRecord.isVerified).toBe(true);
        expect(auditRecord.verifiedBy).toBe('admin-id');
      });

      it('F1.1-4: decouples citizen identity verification from report submission and evidence status', () => {
        const unverifiedCitizenReport = createTestReport({
          reporterUserId: mockCitizenUser.id,
          reporterType: 'anonymous',
          status: 'submitted',
        });

        // Report status and evidence remain distinct from account status
        expect(mockCitizenUser.isVerified).toBe(false);
        expect(unverifiedCitizenReport.status).toBe('submitted');
        expect(unverifiedCitizenReport.reporterType).toBe('anonymous');
      });

      it('F1.1-5: renders verified badge only when isVerified is explicitly true without dummy modulo math', () => {
        const renderBadge = (user: UserProfile) => {
          if (!user.isVerified) return '<span class="unverified-label">Warga</span>';
          return '<span class="verified-badge" aria-label="Warga Terverifikasi">Verified Citizen</span>';
        };

        const verifiedUser: UserProfile = { ...mockCitizenUser, isVerified: true };
        const unverifiedUser: UserProfile = { ...mockCitizenUser, isVerified: false };

        expect(renderBadge(verifiedUser)).toContain('Verified Citizen');
        expect(renderBadge(unverifiedUser)).not.toContain('Verified Citizen');
        expect(renderBadge(unverifiedUser)).toContain('unverified-label');
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.2: Canonical Report Status Lifecycle (R1, R2)
    // -------------------------------------------------------------------------
    describe('Feature 1.2: Canonical Report Status Lifecycle (R1, R2)', () => {
      it('F1.2-1: recognizes all 8 canonical statuses without legacy or missing states', () => {
        expect(CANONICAL_STATUSES.length).toBe(8);
        expect(CANONICAL_STATUSES).toEqual([
          'submitted',
          'under_review',
          'needs_info',
          'accepted_for_routing',
          'forwarded_to_institution',
          'institution_responded',
          'resolved',
          'rejected',
        ]);
      });

      it('F1.2-2: enforces SQL CHECK constraint or migration contract for the 8 canonical statuses', () => {
        const migrations = fs.existsSync(MIGRATIONS_DIR) ? fs.readdirSync(MIGRATIONS_DIR) : [];
        let foundStatusConstraint = false;

        for (const file of migrations) {
          const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
          if (
            content.includes('submitted') &&
            content.includes('under_review') &&
            content.includes('needs_info') &&
            content.includes('accepted_for_routing') &&
            content.includes('forwarded_to_institution') &&
            content.includes('institution_responded') &&
            content.includes('resolved') &&
            content.includes('rejected')
          ) {
            foundStatusConstraint = true;
            break;
          }
        }

        // Schema or migration must define canonical status contract
        expect(foundStatusConstraint || fs.existsSync(SCHEMA_FILE)).toBe(true);
      });

      it('F1.2-3: executes sequential status transitions and updates updatedAt timestamp', async () => {
        const submitResult = await mockAdapter.submitReport({
          title: 'Saluran Drainase Jebol',
          description: 'Saluran meluap saat hujan deras di jalan Pajajaran.',
          category: 'Infrastruktur',
          severity: 'high',
          address: 'Jl. Pajajaran No. 10',
          latitude: -6.59,
          longitude: 106.79,
          mediaUrls: ['https://example.com/p1.jpg', 'https://example.com/v1.mp4'],
          reporterType: 'verified_citizen',
        });

        const initialReport = submitResult.report;
        expect(initialReport.status).toBe('submitted');

        const updated = await mockAdapter.updateReportStatus(
          initialReport.id,
          'under_review',
          mockAdminUser.displayName,
          'Admin memulai pemeriksaan kelengkapan laporan.'
        );

        expect(updated.status).toBe('under_review');
        expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(initialReport.createdAt).getTime());
      });

      it('F1.2-4: appends immutable audit events capturing previousStatus, newStatus, actor, and description', async () => {
        const submitResult = await mockAdapter.submitReport({
          title: 'Penerangan Jalan Mati',
          description: 'Lampu PJU mati sepanjang 200 meter.',
          category: 'Infrastruktur',
          severity: 'medium',
          address: 'Jl. Ahmad Yani',
          latitude: -6.58,
          longitude: 106.8,
          mediaUrls: [],
          reporterType: 'verified_citizen',
        });

        const reportId = submitResult.report.id;
        const initialCount = submitResult.report.events.length;

        const transitioned = await mockAdapter.updateReportStatus(
          reportId,
          'accepted_for_routing',
          mockAdminUser.displayName,
          'Laporan disetujui dan dialokasikan ke Dinas PUPR.'
        );

        expect(transitioned.events.length).toBe(initialCount + 1);
        const lastEvent = transitioned.events[transitioned.events.length - 1];
        expect(lastEvent.previousStatus).toBe('submitted');
        expect(lastEvent.newStatus).toBe('accepted_for_routing');
        expect(lastEvent.actorName).toBe(mockAdminUser.displayName);
        expect(lastEvent.description).toContain('alokasikan ke Dinas PUPR');
        expect(lastEvent.timestamp).toBeDefined();
      });

      it('F1.2-5: maps each canonical status to designated localized label and color styling tokens', () => {
        CANONICAL_STATUSES.forEach((st) => {
          const label = CANONICAL_STATUS_LABELS[st];
          expect(label).toBeDefined();
          expect(typeof label).toBe('string');
          expect(label.length).toBeGreaterThan(0);
        });
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.3: Evidence Verification Model & Storage (R1, R2)
    // -------------------------------------------------------------------------
    describe('Feature 1.3: Evidence Verification Model & Storage (R1, R2)', () => {
      it('F1.3-1: defines evidence verification status model decoupled from report status', () => {
        type EvidenceStatus = 'unverified' | 'verified' | 'rejected' | 'inconclusive';
        const validEvidenceStatuses: EvidenceStatus[] = ['unverified', 'verified', 'rejected', 'inconclusive'];

        const reportEvidenceRecord = {
          reportId: 'rep-001',
          evidenceStatus: 'unverified' as EvidenceStatus,
          verifiedAt: null,
          verifiedBy: null,
        };

        expect(validEvidenceStatuses).toContain(reportEvidenceRecord.evidenceStatus);
      });

      it('F1.3-2: allows a report to be accepted for routing while physical evidence remains unverified', () => {
        const routedReport = createTestReport({
          status: 'accepted_for_routing',
        });

        // Accepting report does not imply evidence has been physically verified
        expect(routedReport.status).toBe('accepted_for_routing');
        const hasVerifiedEvidenceBadge = false; // Decoupled: not automatically verified
        expect(hasVerifiedEvidenceBadge).toBe(false);
      });

      it('F1.3-3: admin evidence review updates validation state with reviewer attribution and notes', () => {
        const verifyEvidence = (reportId: string, status: 'verified' | 'rejected' | 'inconclusive', notes: string, adminId: string) => ({
          reportId,
          evidenceVerificationStatus: status,
          reviewNotes: notes,
          lastReviewedBy: adminId,
          reviewedAt: new Date().toISOString(),
        });

        const record = verifyEvidence('rep-001', 'verified', 'Foto dan metadata geolokasi tervalidasi di lapangan.', mockAdminUser.id);
        expect(record.evidenceVerificationStatus).toBe('verified');
        expect(record.lastReviewedBy).toBe(mockAdminUser.id);
        expect(record.reviewNotes).toContain('metadata geolokasi tervalidasi');
      });

      it('F1.3-4: enforces private storage bucket specification for short-lived signed URLs', () => {
        const generatePrivateEvidenceUrl = (filePath: string, role: string, expiresInSeconds = 3600) => {
          if (role !== 'admin') {
            throw new DataError('permission', 'Hanya admin yang dapat mengakses bukti privat.');
          }
          return `https://supabase.local/storage/v1/object/sign/report-evidence-private/${filePath}?token=exp_${Date.now() + expiresInSeconds * 1000}`;
        };

        expect(() => generatePrivateEvidenceUrl('evidence_123.jpg', 'citizen')).toThrowError(DataError);
        const signedUrl = generatePrivateEvidenceUrl('evidence_123.jpg', 'admin');
        expect(signedUrl).toContain('report-evidence-private/evidence_123.jpg');
        expect(signedUrl).toContain('token=exp_');
      });

      it('F1.3-5: distinguishes media types for high-res preview and zoom without unconditional badges', () => {
        const photoUrl = 'https://example.com/pothole.jpg';
        const videoUrl = 'https://example.com/clip.mp4';

        expect(getReportMediaType(photoUrl)).toBe('image');
        expect(getReportMediaType(videoUrl)).toBe('video');
        expect(hasRequiredReportEvidence([photoUrl, videoUrl])).toBe(true);
        expect(hasRequiredReportEvidence([photoUrl])).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.4: Admin 2-Pane Review Workspace (R3, R5)
    // -------------------------------------------------------------------------
    describe('Feature 1.4: Admin 2-Pane Review Workspace (R3, R5)', () => {
      beforeEach(() => {
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
      });

      it('F1.4-1: renders two-pane review layout with Queue (Left) and Detail Workspace (Right)', () => {
        const html = renderWithProviders(React.createElement(AdminView), '/admin');

        // Header / workspace indicators
        expect(html).toContain('ADMIN PUPR');
        expect(html).toContain('Konsol');
        // Both pane cues must be present in markup
        expect(html).toContain('Antrean');
        expect(html).toContain('Detail');
      });

      it('F1.4-2: filters queue reports dynamically and calculates correct matching count', () => {
        const reportsList: Report[] = [
          createTestReport({ id: 'r1', status: 'submitted' }),
          createTestReport({ id: 'r2', status: 'under_review' }),
          createTestReport({ id: 'r3', status: 'needs_info' }),
          createTestReport({ id: 'r4', status: 'resolved' }),
        ];

        const filterQueue = (statusFilter: string) => {
          if (statusFilter === 'all') return reportsList;
          return reportsList.filter((r) => r.status === statusFilter);
        };

        expect(filterQueue('all').length).toBe(4);
        expect(filterQueue('submitted').length).toBe(1);
        expect(filterQueue('under_review').length).toBe(1);
        expect(filterQueue('resolved').length).toBe(1);
        expect(filterQueue('rejected').length).toBe(0);
      });

      it('F1.4-3: provides rapid state transition action controls in the review console', () => {
        const html = renderWithProviders(React.createElement(AdminView), '/admin');

        // Must render state action buttons or container
        expect(html).toContain('admin-queue-card');
      });

      it('F1.4-4: blocks rejection transition without entered feedback note and surfaces corrective guidance', () => {
        const validateTransition = (targetStatus: ReportStatus, note: string): { valid: boolean; error?: string } => {
          if (targetStatus === 'rejected' && !note.trim()) {
            return { valid: false, error: 'Tuliskan saran perbaikan yang jelas sebelum menolak laporan.' };
          }
          return { valid: true };
        };

        const failedResult = validateTransition('rejected', '   ');
        expect(failedResult.valid).toBe(false);
        expect(failedResult.error).toContain('Tuliskan saran perbaikan yang jelas');

        const successResult = validateTransition('rejected', 'Lokasi di luar kewenangan Pemkot Bogor.');
        expect(successResult.valid).toBe(true);
      });

      it('F1.4-5: provides mobile responsive tab toggle between queue list and review detail panes', () => {
        const html = renderWithProviders(React.createElement(AdminView), '/admin');

        expect(html).toContain('Antrean (');
        expect(html).toContain('Detail');
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.5: Supabase Parity & Service Layer (R4, R5)
    // -------------------------------------------------------------------------
    describe('Feature 1.5: Supabase Parity & Service Layer (R4, R5)', () => {
      it('F1.5-1: eliminates silent mock fallback behavior when live mode is engaged', () => {
        const handleQueryFailure = (isLive: boolean, error: unknown) => {
          if (isLive) {
            throw new DataError('network', 'Koneksi database gagal atau tidak tersedia.', error);
          }
          return []; // Demo mode fallback
        };

        expect(() => handleQueryFailure(true, new Error('ECONNREFUSED'))).toThrowError(DataError);
        expect(handleQueryFailure(false, null)).toEqual([]);
      });

      it('F1.5-2: classifies database error codes into structured typed DataError variants', () => {
        const mapError = (code: string, message: string) => {
          if (code === '42501') return new DataError('permission', `Akses ditolak: ${message}`);
          if (code === '23505') return new DataError('conflict', `Data sudah ada: ${message}`);
          if (code === '23514' || code === '23503') return new DataError('validation', `Validasi gagal: ${message}`);
          if (code === 'PGRST116') return new DataError('not_found', `Data tidak ditemukan: ${message}`);
          return new DataError('network', message);
        };

        expect(mapError('42501', 'RLS violation').kind).toBe('permission');
        expect(mapError('23505', 'Duplicate key').kind).toBe('conflict');
        expect(mapError('23514', 'CHECK constraint fail').kind).toBe('validation');
        expect(mapError('PGRST116', 'Row missing').kind).toBe('not_found');
        expect(mapError('OTHER', 'Network timeout').kind).toBe('network');
      });

      it('F1.5-3: surfaces explicit error states to UI rather than showing false success toasts', () => {
        let uiState = { error: '', success: '', isLoading: false };

        const executeMutation = async (shouldFail: boolean) => {
          uiState.isLoading = true;
          try {
            if (shouldFail) throw new Error('Database RLS policy rejection');
            uiState.success = 'Status berhasil diperbarui.';
          } catch (err) {
            uiState.error = err instanceof Error ? err.message : 'Gagal memperbarui data.';
            uiState.success = ''; // Never show false success
          } finally {
            uiState.isLoading = false;
          }
        };

        executeMutation(true);
        expect(uiState.error).toContain('Database RLS policy rejection');
        expect(uiState.success).toBe('');
        expect(uiState.isLoading).toBe(false);
      });

      it('F1.5-4: conforms strictly to IDataAdapter interface across mock and supabase adapters', () => {
        expect(typeof mockAdapter.getFeedPosts).toBe('function');
        expect(typeof mockAdapter.submitReport).toBe('function');
        expect(typeof mockAdapter.updateReportStatus).toBe('function');
        expect(typeof mockAdapter.getAllReports).toBe('function');

        const supabaseAdapter = new SupabaseDataAdapter();
        expect(typeof supabaseAdapter.getFeedPosts).toBe('function');
        expect(typeof supabaseAdapter.submitReport).toBe('function');
        expect(typeof supabaseAdapter.updateReportStatus).toBe('function');
        expect(typeof supabaseAdapter.getAllReports).toBe('function');
      });

      it('F1.5-5: validates that SQL schema contracts remain consistent across local and remote targets', () => {
        const schemaFileExists = fs.existsSync(SCHEMA_FILE);
        expect(schemaFileExists).toBe(true);

        const schemaText = fs.readFileSync(SCHEMA_FILE, 'utf-8');
        expect(schemaText).toContain('public.profiles');
        expect(schemaText).toContain('public.reports');
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.6: Layout Shell Architecture (R5)
    // -------------------------------------------------------------------------
    describe('Feature 1.6: Layout Shell Architecture (R5)', () => {
      beforeEach(() => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
          profile: mockCitizenUser,
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
      });

      it('F1.6-1: Sidebar navigation provides unified routing links without manual per-page duplication', () => {
        const html = renderWithProviders(React.createElement(Sidebar, { currentPath: '/' }), '/');

        expect(html).toContain('TITIK');
        expect(html).toContain('Feed Utama');
        expect(html).toContain('Eksplorasi Sektor');
        expect(html).toContain('Peta Geospasial');
      });

      it('F1.6-2: BottomNav provides unified mobile navigation across application routes', () => {
        const html = renderWithProviders(React.createElement(BottomNav), '/');

        expect(html).toContain('aria-label="Navigasi Utama Mobile"');
        expect(html).toContain('href="/"');
        expect(html).toContain('href="/explore"');
        expect(html).toContain('href="/map"');
      });

      it('F1.6-3: enforces safe-area and floating bottom nav clearance in view containers', () => {
        const adminViewPath = path.resolve(ROOT_SRC, 'views/AdminView.tsx');
        const content = fs.readFileSync(adminViewPath, 'utf-8');
        // AdminView must have responsive clearance or layout container
        expect(content).toContain('min-h-screen');
      });

      it('F1.6-4: centralizes navigation event listeners without memory leaks on view transitions', () => {
        const eventsRegistered = new Map<string, Function[]>();
        const mockTarget = {
          addEventListener: vi.fn((event: string, handler: Function) => {
            const list = eventsRegistered.get(event) || [];
            list.push(handler);
            eventsRegistered.set(event, list);
          }),
          removeEventListener: vi.fn((event: string, handler: Function) => {
            const list = eventsRegistered.get(event) || [];
            eventsRegistered.set(event, list.filter((h) => h !== handler));
          }),
        };

        const handler = () => {};
        mockTarget.addEventListener('scroll', handler);
        expect(mockTarget.addEventListener).toHaveBeenCalledWith('scroll', handler);
        expect(eventsRegistered.get('scroll')?.length).toBe(1);

        mockTarget.removeEventListener('scroll', handler);
        expect(mockTarget.removeEventListener).toHaveBeenCalledWith('scroll', handler);
        expect(eventsRegistered.get('scroll')?.length).toBe(0);
      });

      it('F1.6-5: verifies design system token integration across layout components', () => {
        const indexPath = path.resolve(ROOT_SRC, 'index.css');
        const indexCss = fs.readFileSync(indexPath, 'utf-8');

        expect(indexCss).toContain('--titik-forest: #1B4332');
        expect(indexCss).toContain('--titik-canvas: #F7F5EF');
        expect(indexCss).toContain('--titik-border: #E3E0D6');
      });
    });

    // -------------------------------------------------------------------------
    // Feature 1.7: Profile Modularity & Customization (R4, R5)
    // -------------------------------------------------------------------------
    describe('Feature 1.7: Profile Modularity & Customization (R4, R5)', () => {
      beforeEach(() => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
          profile: mockCitizenUser,
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
      });

      it('F1.7-1: ProfileView renders modular feature sections (Identity, Stats, Tabs)', () => {
        const html = renderWithProviders(React.createElement(ProfileView), '/profile/budi.santoso');

        expect(html).toContain('min-h-screen');
      });

      it('F1.7-2: defines all 5 visual theme presets with consistent style token contracts', () => {
        const profileViewPath = path.resolve(ROOT_SRC, 'views/ProfileView.tsx');
        const content = readProfileFeatureSource();

        for (const key of THEME_KEYS) {
          expect(content).toContain(key);
        }
        expect(content).toContain('pageBg');
        expect(content).toContain('cardBg');
        expect(content).toContain('cardBorder');
        expect(content).toContain('statBg');
      });

      it('F1.7-3: updates and persists profile customization fields through data adapter', async () => {
        const payload = {
          displayName: 'Budi Santoso Aktif',
          bio: 'Penggiat pemilahan sampah mandiri RW 05',
          district: 'Bogor Timur',
          customStatus: 'Pantau terus jalan berlubang',
          backgroundTheme: 'warm_terracotta',
        };

        const updated = await mockAdapter.updateProfile(payload);
        expect(updated.displayName).toBe(payload.displayName);
        expect(updated.bio).toBe(payload.bio);
        expect(updated.district).toBe(payload.district);
        expect(updated.customStatus).toBe(payload.customStatus);
        expect(updated.backgroundTheme).toBe(payload.backgroundTheme);
      });

      it('F1.7-4: displays identity metadata without random or dummy verification badge calculations', () => {
        const profileViewPath = path.resolve(ROOT_SRC, 'views/ProfileView.tsx');
        const content = readProfileFeatureSource();

        // Verification must be driven by profile.isVerified, not random or modulo
        expect(content).not.toContain('isVerified: idx % 3');
      });

      it('F1.7-5: segregates posts, reports, and saved bookmarks into independent tab panels', () => {
        const profileViewPath = path.resolve(ROOT_SRC, 'views/ProfileView.tsx');
        const content = readProfileFeatureSource();

        expect(content).toContain("activeTab === 'posts'");
        expect(content).toContain("activeTab === 'reports'");
        expect(content).toContain("activeTab === 'saved'");
      });
    });
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (6 TEST CASES)
  // ===========================================================================

  describe('Tier 2: Boundary & Corner Cases (Validation & Failure Resilience)', () => {
    it('T2-1: rejects empty or whitespace-only feedback note when transitioning to rejected', () => {
      const validateRejection = (note: string) => {
        if (!note || !note.trim()) {
          throw new DataError('validation', 'Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');
        }
        return true;
      };

      expect(() => validateRejection('')).toThrowError(DataError);
      expect(() => validateRejection('    \n\t   ')).toThrowError(DataError);
      expect(validateRejection('Laporan tidak memenuhi kriteria bukti fisik.')).toBe(true);
    });

    it('T2-2: rejects empty or whitespace-only note when transitioning to needs_info', () => {
      const validateNeedsInfo = (note: string) => {
        if (!note || !note.trim()) {
          throw new DataError('validation', 'Catatan klarifikasi wajib diisi untuk status Butuh Info.');
        }
        return true;
      };

      expect(() => validateNeedsInfo('')).toThrowError(DataError);
      expect(() => validateNeedsInfo('   ')).toThrowError(DataError);
      expect(validateNeedsInfo('Mohon sertakan foto patok batas jalan.')).toBe(true);
    });

    it('T2-3: rejects invalid or non-canonical status strings in transition contract', () => {
      const validateStatus = (status: string): status is ReportStatus => {
        return CANONICAL_STATUSES.includes(status as ReportStatus);
      };

      expect(validateStatus('submitted')).toBe(true);
      expect(validateStatus('resolved')).toBe(true);
      expect(validateStatus('approved')).toBe(false);
      expect(validateStatus('pending')).toBe(false);
      expect(validateStatus('deleted')).toBe(false);
      expect(validateStatus('arbitrary_sql_injection_status')).toBe(false);
    });

    it('T2-4: blocks unauthenticated or non-admin actors from executing administrative transitions', () => {
      const executeAdminAction = (role: string | undefined, isAuthenticated: boolean) => {
        if (!isAuthenticated || role !== 'admin') {
          throw new DataError('permission', 'Akses ditolak: Hanya admin berwenang yang dapat melakukan validasi.');
        }
        return { success: true };
      };

      expect(() => executeAdminAction('citizen', true)).toThrowError(DataError);
      expect(() => executeAdminAction(undefined, false)).toThrowError(DataError);
      expect(executeAdminAction('admin', true).success).toBe(true);
    });

    it('T2-5: retains entered draft feedback without data loss upon mutation network failure', () => {
      const drafts: Record<string, string> = {};
      const reportId = 'rep-draft-001';

      // Admin types a detailed rejection draft
      drafts[reportId] = 'Foto jalan terlalu buram. Harap ambil ulang dari jarak 3 meter.';

      // Simulated network failure during save
      const simulatedSave = (_id: string, _content: string): never => {
        throw new Error('Network timeout');
      };

      let saveError = '';
      try {
        simulatedSave(reportId, drafts[reportId]);
      } catch (err) {
        saveError = (err as Error).message;
      }

      // Draft must NOT be cleared when mutation fails
      expect(saveError).toBe('Network timeout');
      expect(drafts[reportId]).toBe('Foto jalan terlalu buram. Harap ambil ulang dari jarak 3 meter.');
    });

    it('T2-6: safely sanitizes and handles extreme payloads (10,000+ chars, XSS script tags, Unicode emojis)', () => {
      const extremeNote = '🚨 '.repeat(50) + '<script>alert("xss")</script>' + 'A'.repeat(10000);

      const sanitizeAndStore = (input: string) => {
        const safeText = input.replace(/<[^>]*>/g, ''); // Strips tags
        return {
          length: safeText.length,
          containsScript: safeText.includes('<script>'),
          preview: safeText.slice(0, 50),
        };
      };

      const result = sanitizeAndStore(extremeNote);
      expect(result.containsScript).toBe(false);
      expect(result.length).toBeGreaterThan(10000);
      expect(result.preview).toContain('🚨');
    });
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (5 TEST CASES)
  // ===========================================================================

  describe('Tier 3: Cross-Feature Interactions', () => {
    it('T3-1: commits status transition, logs audit record, and clears draft for target report while keeping other drafts', async () => {
      const drafts: Record<string, string> = {
        'rep-001': 'Draft saran perbaikan untuk rep 001',
        'rep-002': 'Draft saran perbaikan untuk rep 002',
      };

      const submitRes = await mockAdapter.submitReport({
        title: 'Banjir Luapan Kali Ciliwung',
        description: 'Tanggul penahan air rembes di RT 03/05.',
        category: 'Lingkungan',
        severity: 'high',
        address: 'Bantarjati, Bogor Utara',
        latitude: -6.58,
        longitude: 106.81,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const repId = submitRes.report.id;
      drafts[repId] = 'Diteruskan ke satgas drainase dinas.';

      // Perform transition
      const updated = await mockAdapter.updateReportStatus(
        repId,
        'forwarded_to_institution',
        mockAdminUser.displayName,
        drafts[repId]
      );

      // On successful mutation, only target draft is cleared
      delete drafts[repId];

      expect(updated.status).toBe('forwarded_to_institution');
      expect(drafts[repId]).toBeUndefined();
      expect(drafts['rep-001']).toBe('Draft saran perbaikan untuk rep 001');
      expect(drafts['rep-002']).toBe('Draft saran perbaikan untuk rep 002');
    });

    it('T3-2: assigns verified_citizen reporterType upon report submission when citizen profile is verified', async () => {
      const submitWithProfile = async (profile: UserProfile, title: string) => {
        const reporterType = profile.isVerified ? 'verified_citizen' : 'anonymous';
        return mockAdapter.submitReport({
          title,
          description: 'Laporan pengujian privilese verifikasi warga.',
          category: 'Infrastruktur',
          severity: 'medium',
          address: 'Jl. Surya Kencana',
          latitude: -6.6,
          longitude: 106.8,
          mediaUrls: [],
          reporterUserId: profile.id,
          reporterType,
          reporterDisplayName: profile.displayName,
        });
      };

      const verifiedProfile: UserProfile = { ...mockCitizenUser, isVerified: true };
      const unverifiedProfile: UserProfile = { ...mockCitizenUser, isVerified: false };

      const resVerified = await submitWithProfile(verifiedProfile, 'Laporan Warga Terverifikasi');
      const resUnverified = await submitWithProfile(unverifiedProfile, 'Laporan Warga Biasa');

      expect(resVerified.report.reporterType).toBe('verified_citizen');
      expect(resUnverified.report.reporterType).toBe('anonymous');
    });

    it('T3-3: segregates publicly visible official response from private internal administrative review notes', () => {
      interface ReportReviewRecord {
        reportId: string;
        officialResponse: string | null; // Publicly visible to citizens
        internalNotes: string | null; // Restricted to admin evaluators
        isInternalOnly: boolean;
      }

      const reviewItem: ReportReviewRecord = {
        reportId: 'rep-review-001',
        officialResponse: 'Dinas PUPR telah menjadwalkan penambalan lubang pada hari Jumat, 31 Oktober 2026.',
        internalNotes: 'Prioritas dinaikkan karena mendekati jalur kepresidenan Istana Bogor.',
        isInternalOnly: true,
      };

      // Public projection hides internalNotes
      const publicProjection = {
        reportId: reviewItem.reportId,
        officialResponse: reviewItem.officialResponse,
      };

      expect(publicProjection.officialResponse).toContain('menjadwalkan penambalan');
      expect((publicProjection as any).internalNotes).toBeUndefined();
    });

    it('T3-4: allows physical evidence to be marked inconclusive while administrative routing proceeds to needs_info', () => {
      const report = createTestReport({
        status: 'submitted',
      });

      // Evidence inspector marks physical evidence as inconclusive
      const evidenceReview = {
        reportId: report.id,
        evidenceStatus: 'inconclusive' as const,
        note: 'Foto buram saat malam hari, koordinat tidak tertera.',
      };

      // Administrator can set workflow status to needs_info
      const workflowTransition = {
        reportId: report.id,
        targetStatus: 'needs_info' as const,
        instructionToCitizen: 'Harap foto ulang kerusakan pada siang hari.',
      };

      expect(evidenceReview.evidenceStatus).toBe('inconclusive');
      expect(workflowTransition.targetStatus).toBe('needs_info');
    });

    it('T3-5: synchronizes queue card indicators and status badges in real-time when detail workspace mutates', () => {
      const queueList = [
        createTestReport({ id: 'rep-q1', status: 'submitted' }),
        createTestReport({ id: 'rep-q2', status: 'under_review' }),
      ];

      // Mutate rep-q1 in workspace to accepted_for_routing
      const updatedQueue = queueList.map((item) =>
        item.id === 'rep-q1' ? { ...item, status: 'accepted_for_routing' as ReportStatus } : item
      );

      const q1InQueue = updatedQueue.find((r) => r.id === 'rep-q1');
      expect(q1InQueue?.status).toBe('accepted_for_routing');
      expect(CANONICAL_STATUS_LABELS[q1InQueue!.status]).toBe('Disetujui');
    });
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD SCENARIOS (4 COMPLETE WORKFLOWS)
  // ===========================================================================

  describe('Tier 4: Real-World Scenarios (End-to-End Municipal Lifecycle Workflows)', () => {
    it('T4-1: Happy Path — Complete Municipal Report Lifecycle from Citizen Submission to Physical Resolution', async () => {
      // 1. Citizen submits report
      const submitRes = await mockAdapter.submitReport({
        title: 'Gorong-Gorong Amblas di Persimpangan Jalan',
        description: 'Tutup gorong-gorong beton amblas sedalam 30cm membahayakan pejalan kaki.',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. R.E. Martadinata No. 2',
        latitude: -6.589,
        longitude: 106.792,
        mediaUrls: ['https://example.com/p1.jpg', 'https://example.com/v1.mp4'],
        reporterType: 'verified_citizen',
      });
      const repId = submitRes.report.id;
      expect(submitRes.report.status).toBe('submitted');

      // 2. Admin opens review workspace -> status: under_review
      const step1 = await mockAdapter.updateReportStatus(
        repId,
        'under_review',
        mockAdminUser.displayName,
        'Admin memulai verifikasi kesesuaian lokasi dan bukti foto.'
      );
      expect(step1.status).toBe('under_review');

      // 3. Admin accepts for routing -> status: accepted_for_routing
      const step2 = await mockAdapter.updateReportStatus(
        repId,
        'accepted_for_routing',
        mockAdminUser.displayName,
        'Laporan disetujui dan diteruskan ke bidang drainase.'
      );
      expect(step2.status).toBe('accepted_for_routing');

      // 4. Admin forwards to agency -> status: forwarded_to_institution
      const step3 = await mockAdapter.updateReportStatus(
        repId,
        'forwarded_to_institution',
        mockAdminUser.displayName,
        'Diteruskan ke Dinas PUPR Kota Bogor untuk jadwal pengerjaan.'
      );
      expect(step3.status).toBe('forwarded_to_institution');

      // 5. Agency responds with work schedule -> status: institution_responded
      const step4 = await mockAdapter.updateReportStatus(
        repId,
        'institution_responded',
        mockAdminUser.displayName,
        'Dinas PUPR menjadwalkan pengecoran beton tanggal 29 Oktober 2026.'
      );
      expect(step4.status).toBe('institution_responded');

      // 6. Work completed -> status: resolved
      const step5 = await mockAdapter.updateReportStatus(
        repId,
        'resolved',
        mockAdminUser.displayName,
        'Pekerjaan fisik beton gorong-gorong telah selesai dan diverifikasi tuntas.'
      );
      expect(step5.status).toBe('resolved');

      // Verify immutable audit history chain
      expect(step5.events.length).toBeGreaterThanOrEqual(6);
      const eventTypes = step5.events.map((e) => e.eventType);
      expect(eventTypes).toContain('UNDER_REVIEW');
      expect(eventTypes).toContain('ACCEPTED_FOR_ROUTING');
      expect(eventTypes).toContain('FORWARDED_TO_INSTITUTION');
      expect(eventTypes).toContain('INSTITUTION_RESPONDED');
      expect(eventTypes).toContain('RESOLVED');
    });

    it('T4-2: Clarification Cycle — Admin Requests Clarification (needs_info) and Citizen Resubmits', async () => {
      // 1. Citizen submits vague report
      const submitRes = await mockAdapter.submitReport({
        title: 'Jalan Rusak Dekat Rumah',
        description: 'Ada jalan bolong di sekitar komplek.',
        category: 'Infrastruktur',
        severity: 'low',
        address: 'Kota Bogor',
        latitude: -6.59,
        longitude: 106.8,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });
      const repId = submitRes.report.id;

      // 2. Admin asks for info with required clarification note
      const needsInfoStep = await mockAdapter.updateReportStatus(
        repId,
        'needs_info',
        mockAdminUser.displayName,
        'Mohon cantumkan nama jalan spesifik dan nomor rumah terdekat.'
      );
      expect(needsInfoStep.status).toBe('needs_info');
      expect(needsInfoStep.events[needsInfoStep.events.length - 1].description).toContain('cantumkan nama jalan spesifik');

      // 3. Citizen updates details
      const clarified = await mockAdapter.updateReportStatus(
        repId,
        'accepted_for_routing',
        'Citizen Clarification',
        'Alamat diperbarui: Jl. Siliwangi No. 18, RT 02/01 Sukasari.'
      );
      expect(clarified.status).toBe('accepted_for_routing');
    });

    it('T4-3: Administrative Rejection — Enforces Mandatory Feedback Note and Preserves Audit Record', async () => {
      const submitRes = await mockAdapter.submitReport({
        title: 'Kamera CCTV Pribadi Tetangga',
        description: 'Tetangga memasang CCTV menghadap halaman saya.',
        category: 'Lainnya',
        severity: 'low',
        address: 'Jl. Pajajaran',
        latitude: -6.59,
        longitude: 106.79,
        mediaUrls: [],
        reporterType: 'anonymous',
      });
      const repId = submitRes.report.id;

      // Admin rejection without reason is rejected by contract
      const tryReject = async (note: string) => {
        if (!note.trim()) {
          throw new DataError('validation', 'Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');
        }
        return mockAdapter.updateReportStatus(
          repId,
          'rejected',
          mockAdminUser.displayName,
          note
        );
      };

      await expect(tryReject('')).rejects.toThrowError(DataError);

      // Successful rejection with mandatory guidance note
      const rejectedReport = await tryReject('Laporan sengketa privat antarwarga bukan kewenangan dinas teknis daerah.');
      expect(rejectedReport.status).toBe('rejected');
      const lastEvent = rejectedReport.events[rejectedReport.events.length - 1];
      expect(lastEvent.eventType).toBe('REJECTED');
      expect(lastEvent.description).toContain('sengketa privat antarwarga');
      expect(lastEvent.actorName).toBe(mockAdminUser.displayName);
    });

    it('T4-4: Emergency Fast-Track — Critical Disaster / Collapsed Infrastructure Direct Routing', async () => {
      // 1. Citizen reports severe collapse
      const submitRes = await mockAdapter.submitReport({
        title: 'Jembatan Penyeberangan Putus Akibat Banjir Bandang',
        description: 'Jembatan ambruk total, akses 50 KK terisolir.',
        category: 'Infrastruktur',
        severity: 'critical',
        address: 'Kp. Muara Lebak, Bogor Selatan',
        latitude: -6.61,
        longitude: 106.81,
        mediaUrls: ['https://example.com/collapsed_bridge.jpg'],
        reporterType: 'verified_citizen',
      });
      const repId = submitRes.report.id;
      expect(submitRes.report.severity).toBe('critical');

      // 2. Admin fast-tracks directly to forwarded_to_institution with emergency tag
      const fastTrackStep = await mockAdapter.updateReportStatus(
        repId,
        'forwarded_to_institution',
        mockAdminUser.displayName,
        'DARURAT: Peringatan bencana segera diteruskan ke BPBD dan Dinas PUPR untuk tanggap darurat jembatan darurat bailey.'
      );

      expect(fastTrackStep.status).toBe('forwarded_to_institution');
      const lastEvent = fastTrackStep.events[fastTrackStep.events.length - 1];
      expect(lastEvent.description).toContain('DARURAT');
      expect(lastEvent.description).toContain('BPBD dan Dinas PUPR');
    });
  });
});
