import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportDetailDrawer } from '../components/reporting/ReportDetailDrawer';
import { TitikContext } from '../context/TitikContext';
import { MOCK_REPORTS_KN } from '../data/mockCivicData';
import { Report, BudgetSectorContext } from '../types/domain';
import { FeedComment } from '../services/adapters/types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createMockContextValue(report: Report | null, isOpen = true) {
  return {
    posts: [],
    activePost: null,
    activeFeedTab: 'for_you' as const,
    selectedCategory: 'Semua',
    facilities: [],
    budgetSectors: [],
    reportModalOpen: false,
    composerOpen: false,
    composerTab: 'post' as const,
    openComposer: vi.fn(),
    closeComposer: vi.fn(),

    reportDetailOpen: isOpen,
    selectedReport: report,
    searchModalOpen: false,
    landingBannerOpen: false,
    isLoading: false,
    setActivePostId: () => {},
    setActiveFeedTab: () => {},
    setSelectedCategory: () => {},
    openReportModal: () => {},
    closeReportModal: () => {},
    openReportDetail: () => {},
    closeReportDetail: () => {},
    setSearchModalOpen: () => {},
    setLandingBannerOpen: () => {},
    toggleSupport: async () => {},
    addComment: async (): Promise<FeedComment> => ({
      id: 'mock-c-1',
      authorName: 'User',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      body: 'Mock',
      timeAgo: 'Baru saja',
      likes: 0,
    }),
    getComments: async (): Promise<FeedComment[]> => [],
    submitReport: async () => ({
      success: true,
      report: {} as Report,
      publicReference: 'TIK-2026-999999',
      secretFollowUpToken: 'tok',
    }),
    deleteReport: async () => {},
    updateReportStatus: async () => {},
    refreshFeed: async () => {},
  };
}

describe('ReportDetailDrawer Empirical Stress Test (rep-kn-001 through rep-kn-010)', () => {
  it('verifies MOCK_REPORTS_KN contains all 10 seed reports', () => {
    expect(MOCK_REPORTS_KN.length).toBe(10);
    const expectedIds = Array.from({ length: 10 }, (_, i) => `rep-kn-${String(i + 1).padStart(3, '0')}`);
    expect(MOCK_REPORTS_KN.map((r) => r.id)).toEqual(expectedIds);
  });

  describe('Hydrated Reports (rep-kn-001..rep-kn-010) Drawer Rendering', () => {
    MOCK_REPORTS_KN.forEach((report, index) => {
      const reportNum = String(index + 1).padStart(3, '0');
      it(`renders rep-kn-${reportNum} (${report.publicReference}) without null-pointer crashes`, () => {
        const contextValue = createMockContextValue(report, true);

        let html = '';
        expect(() => {
          html = renderToStaticMarkup(
            <TitikContext.Provider value={contextValue}>
              <ReportDetailDrawer />
            </TitikContext.Provider>
          );
        }).not.toThrow();

        // Must produce non-empty markup
        expect(html.length).toBeGreaterThan(0);

        // Header public reference and status
        expect(html).toContain(report.publicReference);

        // Title and description
        expect(html).toContain(escapeHtml(report.title));
        expect(html).toContain(escapeHtml(report.description));

        // Location address
        expect(html).toContain(escapeHtml(report.location.address));

        // Media URL
        expect(html).toContain(report.mediaUrls[0]);

        // Budget context verification
        if (report.budgetContext) {
          expect(html).toContain('Konteks Anggaran APBD 2026');
          expect(html).toContain(escapeHtml(report.budgetContext.sectorName));
          expect(html).toContain(escapeHtml(report.budgetContext.responsibleAgency));
          expect(html).toContain(`${report.budgetContext.executionRatePercent}% Terserap`);
        }

        // Audit events timeline
        expect(report.events.length).toBeGreaterThanOrEqual(1);
        report.events.forEach((ev) => {
          expect(html).toContain(escapeHtml(ev.eventType));
          expect(html).toContain(escapeHtml(ev.actorName));
        });

        // Bottom support button
        expect(html).toContain(String(report.supportCount));
      });
    });
  });

  describe('Boundary Conditions & Defensive Handling', () => {
    it('returns null/empty string when reportDetailOpen is false', () => {
      const report = MOCK_REPORTS_KN[0];
      const contextValue = createMockContextValue(report, false);

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={contextValue}>
          <ReportDetailDrawer />
        </TitikContext.Provider>
      );

      expect(html).toBe('');
    });

    it('returns null/empty string when selectedReport is null', () => {
      const contextValue = createMockContextValue(null, true);

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={contextValue}>
          <ReportDetailDrawer />
        </TitikContext.Provider>
      );

      expect(html).toBe('');
    });

    it('safely renders when budgetContext is undefined (non-APBD report)', () => {
      const reportWithoutBudget: Report = {
        ...MOCK_REPORTS_KN[0],
        id: 'rep-custom-no-budget',
        budgetContext: undefined as unknown as BudgetSectorContext,
      };
      const contextValue = createMockContextValue(reportWithoutBudget, true);

      let html = '';
      expect(() => {
        html = renderToStaticMarkup(
          <TitikContext.Provider value={contextValue}>
            <ReportDetailDrawer />
          </TitikContext.Provider>
        );
      }).not.toThrow();

      expect(html).toContain(reportWithoutBudget.publicReference);
      expect(html).not.toContain('Konteks Anggaran APBD 2026');
    });

    it('safely renders when events array is empty', () => {
      const reportWithNoEvents: Report = {
        ...MOCK_REPORTS_KN[0],
        id: 'rep-custom-no-events',
        events: [],
      };
      const contextValue = createMockContextValue(reportWithNoEvents, true);

      let html = '';
      expect(() => {
        html = renderToStaticMarkup(
          <TitikContext.Provider value={contextValue}>
            <ReportDetailDrawer />
          </TitikContext.Provider>
        );
      }).not.toThrow();

      expect(html).toContain(reportWithNoEvents.publicReference);
      expect(html).toContain('Riwayat Audit &amp; Penanganan');
    });

    it('handles unexpected report status gracefully with default fallback color', () => {
      const reportWithUnknownStatus = {
        ...MOCK_REPORTS_KN[0],
        id: 'rep-custom-unknown-status',
        status: 'custom_archived_status' as unknown as Report['status'],
      };
      const contextValue = createMockContextValue(reportWithUnknownStatus, true);

      let html = '';
      expect(() => {
        html = renderToStaticMarkup(
          <TitikContext.Provider value={contextValue}>
            <ReportDetailDrawer />
          </TitikContext.Provider>
        );
      }).not.toThrow();

      expect(html).toContain('custom archived_status');
      expect(html).toContain('bg-[#E7EBDD]');
    });

    it('displays correct support button copy when isSupportedByMe is true vs false', () => {
      const supportedReport = { ...MOCK_REPORTS_KN[0], isSupportedByMe: true };
      const unsupportedReport = { ...MOCK_REPORTS_KN[0], isSupportedByMe: false };

      const htmlSupported = renderToStaticMarkup(
        <TitikContext.Provider value={createMockContextValue(supportedReport, true)}>
          <ReportDetailDrawer />
        </TitikContext.Provider>
      );
      expect(htmlSupported).toContain('✓ Anda Telah Mendukung');

      const htmlUnsupported = renderToStaticMarkup(
        <TitikContext.Provider value={createMockContextValue(unsupportedReport, true)}>
          <ReportDetailDrawer />
        </TitikContext.Provider>
      );
      expect(htmlUnsupported).toContain('Saya Terdampak Juga');
    });
  });
});
