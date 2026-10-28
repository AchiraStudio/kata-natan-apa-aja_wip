import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { useTitik } from '../../context/TitikContext';
import { Report, ReportStatus, ReportSeverity } from '../../types/domain';
import { AdminSortOption, ReportDraft, ZoomMedia, AdminMetricsSummary } from './types';

const SEVERITY_WEIGHT: Record<ReportSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useAdminWorkspace() {
  const { updateReportStatus, deleteReport, refreshFeed } = useTitik();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<AdminSortOption>('newest');

  // Per-report draft persistence: drafts[reportId]
  const [drafts, setDrafts] = useState<Record<string, ReportDraft>>({});

  // Active composer tab per report or workspace
  const [composerTab, setComposerTab] = useState<'public' | 'internal'>('public');

  // Mutation and notification states
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Mobile layout tab
  const [mobileTab, setMobileTab] = useState<'queue' | 'detail'>('queue');

  // Zoom lightbox modal state
  const [zoomMedia, setZoomMedia] = useState<ZoomMedia | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const data = await dataService.getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load admin reports:', err);
      setActionError(err instanceof Error ? err.message : 'Gagal memuat antrean laporan.');
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Draft helper for selected report
  const updateDraft = useCallback((reportId: string, field: 'publicResponse' | 'internalNote', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [reportId]: {
        publicResponse: field === 'publicResponse' ? value : prev[reportId]?.publicResponse || '',
        internalNote: field === 'internalNote' ? value : prev[reportId]?.internalNote || '',
        lastUpdated: Date.now(),
      },
    }));
  }, []);

  // Filter & Sort Logic
  const filteredReports = useMemo(() => {
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

      // 3. Search Query (matches reference, title, description, address, reporter)
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
  }, [reports, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Selected report computation
  const selectedReport = useMemo(() => {
    if (selectedReportId) {
      const found = reports.find((r) => r.id === selectedReportId);
      if (found) return found;
    }
    return filteredReports[0] || reports[0] || null;
  }, [reports, filteredReports, selectedReportId]);

  // Active draft for the currently selected report
  const currentDraft: ReportDraft = useMemo(() => {
    if (!selectedReport) {
      return { publicResponse: '', internalNote: '', lastUpdated: 0 };
    }
    return drafts[selectedReport.id] || {
      publicResponse: selectedReport.officialResponse || '',
      internalNote: selectedReport.internalNotes || '',
      lastUpdated: 0,
    };
  }, [drafts, selectedReport]);

  // KPI Metrics Calculation
  const metrics: AdminMetricsSummary = useMemo(() => {
    return {
      underReview: reports.filter((r) => r.status === 'under_review').length,
      needsInfo: reports.filter((r) => r.status === 'needs_info').length,
      forwarded: reports.filter((r) => r.status === 'forwarded_to_institution').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    };
  }, [reports]);

  // State Transition Execution with Safety & Draft Preservation
  const handleApplyTransition = async (targetStatus: ReportStatus): Promise<boolean> => {
    if (!selectedReport || isUpdating) return false;

    const activeDraftForReport = drafts[selectedReport.id] || {
      publicResponse: '',
      internalNote: '',
      lastUpdated: 0,
    };

    const publicText = activeDraftForReport.publicResponse?.trim() || '';
    const internalText = activeDraftForReport.internalNote?.trim() || '';
    const combinedNotes = publicText || internalText;

    // Transition Validation Contract enforcement
    if (targetStatus === 'rejected' && !combinedNotes) {
      setActionError('Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');
      setActionSuccess('');
      return false;
    }

    if (targetStatus === 'needs_info' && !combinedNotes) {
      setActionError('Catatan klarifikasi wajib diisi untuk status Butuh Info.');
      setActionSuccess('');
      return false;
    }

    setIsUpdating(true);
    setActionError('');
    setActionSuccess('');

    // Save previous state for potential rollback
    const previousReports = [...reports];

    try {
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
          publicText ||
          'Pekerjaan perbaikan fisik telah diverifikasi tuntas oleh tim lapangan.',
        rejected: publicText || internalText || 'Laporan ditolak karena tidak memenuhi kriteria bukti.',
      };

      const finalDescription = defaultDesc[targetStatus];

      // Perform update via context / dataService
      await updateReportStatus(selectedReport.id, targetStatus, finalDescription);

      // On successful mutation: clear draft for this report and surface success feedback
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[selectedReport.id];
        return next;
      });

      setActionSuccess(`Status laporan ${selectedReport.publicReference} berhasil diperbarui.`);
      await fetchReports();
      return true;
    } catch (error) {
      console.error('Failed to update report status:', error);
      // Rollback optimistic state and preserve drafts
      setReports(previousReports);
      setActionError(
        error instanceof Error ? error.message : 'Status laporan gagal diperbarui. Silakan coba lagi.'
      );
      // Administrator's draft remains untouched in drafts[selectedReport.id]!
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Report Handler with Safety
  const handleDeleteReport = async (): Promise<boolean> => {
    if (!selectedReport || isUpdating) return false;

    const confirmed = window.confirm(
      `Hapus permanen laporan ${selectedReport.publicReference} (“${selectedReport.title}”)? Laporan tidak akan bisa dipulihkan.`
    );
    if (!confirmed) return false;

    setIsUpdating(true);
    setActionError('');
    setActionSuccess('');
    const previousReports = [...reports];

    try {
      const reference = selectedReport.publicReference;
      const reportId = selectedReport.id;
      await deleteReport(reportId);

      // Clear draft on successful deletion
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });

      setSelectedReportId('');
      setActionSuccess(`Laporan ${reference} berhasil dihapus.`);
      await fetchReports();
      return true;
    } catch (error) {
      console.error('Failed to delete report:', error);
      setReports(previousReports);
      setActionError(error instanceof Error ? error.message : 'Laporan gagal dihapus. Silakan coba lagi.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const openZoom = useCallback(
    (url: string, type: 'image' | 'video', title: string, address: string) => {
      setZoomMedia({ url, type, title, address });
    },
    []
  );

  const closeZoom = useCallback(() => {
    setZoomMedia(null);
  }, []);

  const refresh = useCallback(() => {
    fetchReports();
    refreshFeed();
  }, [fetchReports, refreshFeed]);

  return {
    reports,
    isLoadingReports,
    fetchReports,
    refresh,
    selectedReportId,
    setSelectedReportId,
    selectedReport,
    filteredReports,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    drafts,
    updateDraft,
    currentDraft,
    composerTab,
    setComposerTab,
    isUpdating,
    actionError,
    setActionError,
    actionSuccess,
    setActionSuccess,
    handleApplyTransition,
    handleDeleteReport,
    metrics,
    mobileTab,
    setMobileTab,
    zoomMedia,
    openZoom,
    closeZoom,
  };
}
