import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { useReports } from '../hooks/useReports';
import { ReportWorkflowForm } from '../components/reporting/ReportWorkflowForm';
import { SECTORS, SUBDISTRICTS } from '../data/titikRegionalData';
import { PublicCivicReport, ReportStatus } from '../types/database';
import { fetchPendingReports, moderateReport } from '../services/reportService';
import { 
  MapPin, 
  ThumbsUp, 
  ArrowRight, 
  Search,
  AlertCircle,
  Radio,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ImageIcon,
  XCircle,
  RefreshCw
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledFacilityId = searchParams.get('facilityId') || undefined;

  const { 
    selectedSubdistrict, 
    setSelectedSubdistrict, 
    selectedSector, 
    setSelectedSector,
    searchQuery,
    setSearchQuery
  } = useTitik();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'NEW_REPORT' | 'ALL_REPORTS' | 'MODERATION'>(
    prefilledFacilityId || tabParam === 'new' 
      ? 'NEW_REPORT' 
      : tabParam === 'moderation' 
      ? 'MODERATION' 
      : 'ALL_REPORTS'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'new') setActiveTab('NEW_REPORT');
    else if (tab === 'moderation') setActiveTab('MODERATION');
    else if (tab === 'all') setActiveTab('ALL_REPORTS');
  }, [searchParams]);

  // Hook for live/published reports from Supabase (or transparent fallback)
  const { reports, loading, error, isLive, vote, refetch } = useReports({
    category: selectedSector !== 'Semua' ? selectedSector : undefined,
    subdistrict: selectedSubdistrict !== 'Semua' ? selectedSubdistrict : undefined,
    search: searchQuery || undefined,
  });

  // Moderation state
  const [pendingReports, setPendingReports] = useState<PublicCivicReport[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState<{ [id: string]: string }>({});
  const [actionFeedback, setActionFeedback] = useState<{ [id: string]: { type: 'success' | 'error'; message: string } }>({});

  const loadPending = async () => {
    setLoadingPending(true);
    setPendingError(null);
    try {
      const data = await fetchPendingReports();
      setPendingReports(data);
    } catch (err: any) {
      setPendingError(err.message || 'Gagal memuat antrean moderasi.');
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'MODERATION') {
      loadPending();
    }
  }, [activeTab]);

  const handleModerate = async (
    reportId: string, 
    newStatus: ReportStatus, 
    publicationStatus: 'pending' | 'published' | 'rejected'
  ) => {
    setModeratingId(reportId);
    try {
      const notes = moderatorNotes[reportId] || (
        publicationStatus === 'published' 
          ? 'Bukti foto dan koordinat telah diverifikasi sesuai kondisi lapangan.'
          : publicationStatus === 'rejected'
          ? 'Bukti tidak memenuhi kriteria verifikasi fisik atau di luar kewenangan publik.'
          : 'Laporan ditandai sedang dalam peninjauan bukti fisik lanjutan.'
      );

      const ok = await moderateReport(reportId, newStatus, publicationStatus, notes, 'kurator_komunitas');
      if (ok) {
        setActionFeedback(prev => ({
          ...prev,
          [reportId]: {
            type: 'success',
            message: publicationStatus === 'published' 
              ? 'Laporan berhasil disetujui & dipublikasikan ke observatorium!'
              : publicationStatus === 'rejected'
              ? 'Laporan telah ditandai ditolak.'
              : 'Status laporan diperbarui dalam peninjauan.'
          }
        }));

        setTimeout(() => {
          setPendingReports(prev => prev.filter(r => r.id !== reportId));
          refetch();
        }, 1200);
      }
    } catch (err: any) {
      setActionFeedback(prev => ({
        ...prev,
        [reportId]: {
          type: 'error',
          message: err.message || 'Gagal memproses moderasi.'
        }
      }));
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#243042] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
              <span>Partisipasi &amp; Pengawasan Warga • Jabodetabek</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Tandai Titik Masalah &amp; Kawal Realisasi
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] max-w-2xl">
              Lihat isu di lapangan. Telusuri pos anggaran yang mendanai. Pantau respon dan penyelesaian secara terbuka.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="inline-flex rounded-xl bg-[#F8F9FA] dark:bg-[#101622] p-1 border border-[#E5E7EB] dark:border-[#243042] self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('ALL_REPORTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALL_REPORTS'
                  ? 'bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`}
            >
              <span>Daftar Kasus Warga</span>
              <span className="px-1.5 py-0.5 bg-[#F3F4F6] dark:bg-[#243042] text-[#4B5563] dark:text-[#94A3B8] rounded text-[10px] font-mono-data font-semibold">
                {reports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NEW_REPORT'
                  ? 'bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`}
            >
              + Buat Laporan Baru
            </button>
            <button
              onClick={() => setActiveTab('MODERATION')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'MODERATION'
                  ? 'bg-white dark:bg-[#1C2638] text-[#0D9488] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kurasi Komunitas</span>
              {pendingReports.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#0D9488] text-white rounded-full text-[10px] font-mono-data font-bold">
                  {pendingReports.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Realtime Status Indicator & 3-Step Principle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] text-[#111827] dark:text-[#F9FAFB] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#111827] dark:bg-[#0D9488] text-white flex items-center justify-center text-[10px] font-mono-data font-bold">1</span>
              <span>Bukti Fisik Riil &amp; Geotag</span>
            </div>
            <span className="text-[#9CA3AF] dark:text-[#64748B] hidden sm:inline">&rarr;</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] text-[#111827] dark:text-[#F9FAFB] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#111827] dark:bg-[#0D9488] text-white flex items-center justify-center text-[10px] font-mono-data font-bold">2</span>
              <span>Korelasi Instansi &amp; Pos APBD</span>
            </div>
            <span className="text-[#9CA3AF] dark:text-[#64748B] hidden sm:inline">&rarr;</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] text-[#0D9488] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[10px] font-mono-data font-bold">3</span>
              <span>Audit Append-Only &amp; Suara Warga</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#4B5563] dark:text-[#94A3B8]">
            <Radio className={`w-3 h-3 ${isLive ? 'text-[#0D9488] animate-pulse' : 'text-[#D97706]'}`} />
            <span>{isLive ? 'Supabase Realtime Aktif' : 'Penyimpanan Terverifikasi'}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: ALL REPORTS LISTING VIEW */}
      {/* ============================================================== */}
      {activeTab === 'ALL_REPORTS' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#151D2A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari laporan berdasarkan judul, deskripsi, atau nomor referensi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSubdistrict}
                onChange={e => setSelectedSubdistrict(e.target.value as any)}
                aria-label="Pilih Wilayah"
                className="text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              >
                <option value="Semua">Semua Wilayah</option>
                {SUBDISTRICTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value as any)}
                aria-label="Pilih Sektor"
                className="text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              >
                <option value="Semua">Semua Sektor</option>
                {SECTORS.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>

              <button
                onClick={() => setActiveTab('NEW_REPORT')}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg transition-all shrink-0"
              >
                + Lapor
              </button>
            </div>
          </div>

          {/* Loading / Error States */}
          {loading && (
            <div className="p-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Memuat laporan warga dari database...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1215] border border-[#FCA5A5] dark:border-[#7F1D1D] text-xs text-[#991B1B] dark:text-[#FCA5A5] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && reports.length === 0 && (
            <div className="bg-white dark:bg-[#151D2A] p-12 text-center rounded-2xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
              <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
                Belum ada laporan yang sesuai kriteria pencarian.
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Cobalah mengubah kata kunci pencarian atau bersihkan filter wilayah/sektor.
              </p>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map(report => {
              const primaryPhoto = report.approvedMedia?.[0]?.url;
              const agencyRel = report.relations?.find(r => r.targetType === 'agency');
              const projectRel = report.relations?.find(r => r.targetType === 'budget_project');

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] hover:border-[#111827] dark:hover:border-[#0D9488] p-5 shadow-xs transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    
                    {/* Media Preview */}
                    <div 
                      onClick={() => navigate(`/lapor/${report.publicReference || report.id}`)}
                      className="relative h-44 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F3F4F6] dark:bg-[#101622] cursor-pointer"
                    >
                      {primaryPhoto ? (
                        <img 
                          src={primaryPhoto} 
                          alt={report.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3AF] p-4 text-center space-y-1">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[11px] font-medium">Foto Bukti Dalam Tinjauan Moderasi</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-data font-bold bg-[#111827]/85 dark:bg-[#0B0F17]/90 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                          {report.publicReference}
                        </span>
                        {report.isApproximateLocation && (
                          <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded font-medium">
                            Perkiraan ~110m
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold bg-white/90 dark:bg-[#151D2A]/90 backdrop-blur-xs text-[#111827] dark:text-[#F9FAFB] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#243042]">
                          {report.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-data text-white ${
                          report.severity === 'Kritis' ? 'bg-[#DC2626]' : report.severity === 'Sedang' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Title */}
                    <div 
                      onClick={() => navigate(`/lapor/${report.publicReference || report.id}`)}
                      className="cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                        <MapPin className="w-3 h-3 text-[#DC2626]" />
                        <span>{report.subdistrict}</span>
                        <span>•</span>
                        <span>{report.observedAt}</span>
                      </div>

                      <h3 className="font-extrabold text-sm text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#0D9488] transition-colors line-clamp-2 leading-snug">
                        {report.title}
                      </h3>

                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Correlation Context */}
                    <div className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] bg-[#F8F9FA] dark:bg-[#101622] p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042] space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold">Tautan Instansi:</span>
                        <span className={`font-mono-data text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          agencyRel?.matchStatus === 'confirmed'
                            ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]'
                            : 'bg-[#FFFBEB] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]'
                        }`}>
                          {agencyRel?.matchStatus === 'confirmed' ? 'TERKONFIRMASI' : 'SARAN SISTEM'}
                        </span>
                      </div>
                      <div className="font-medium text-[#111827] dark:text-[#F9FAFB] truncate">
                        {agencyRel?.targetId || 'Dinas Teknis Terkait'}
                      </div>
                    </div>

                    {projectRel && (
                      <div className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] bg-[#F8F9FA] dark:bg-[#101622] p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042] space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold">Korelasi APBD:</span>
                          <span className={`font-mono-data text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            projectRel.matchStatus === 'confirmed'
                              ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]'
                              : 'bg-[#FFFBEB] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]'
                          }`}>
                            {projectRel.matchStatus === 'confirmed' ? 'TERKONFIRMASI' : 'SARAN SISTEM'}
                          </span>
                        </div>
                        <div className="font-mono-data text-[11px] font-medium text-[#111827] dark:text-[#F9FAFB] truncate">
                          {projectRel.targetId}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#F3F4F6] dark:border-[#243042] flex items-center justify-between">
                    <button
                      onClick={() => vote(report.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all transform active:scale-95 ${
                        report.hasUserVoted
                          ? 'bg-[#0D9488] text-white shadow-xs'
                          : 'bg-[#F8F9FA] dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] border border-[#E5E7EB] dark:border-[#243042]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{report.votesCount} Suara</span>
                    </button>

                    <button
                      onClick={() => navigate(`/lapor/${report.publicReference || report.id}`)}
                      className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] hover:text-[#0D9488] transition-colors flex items-center gap-1"
                    >
                      <span>Jejak Audit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: CANONICAL 3-STEP REPORTING WORKFLOW */}
      {/* ============================================================== */}
      {activeTab === 'NEW_REPORT' && (
        <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-xs p-6 sm:p-8 transition-colors">
          <ReportWorkflowForm
            initialFacilityId={prefilledFacilityId}
            onSuccess={() => {
              // The form renders a full success view with follow-up token & button to view report
            }}
            onCancel={() => setActiveTab('ALL_REPORTS')}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3: COMMUNITY MODERATION & CURATION WORKFLOW */}
      {/* ============================================================== */}
      {activeTab === 'MODERATION' && (
        <div className="space-y-6">
          
          {/* Moderation Mission Banner */}
          <div className="bg-white dark:bg-[#151D2A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                <ShieldCheck className="w-4 h-4" />
                <span>Pintu Kurasi Bukti Independen</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#111827] dark:text-[#F9FAFB]">
                Antrean Verifikasi Bukti Warga
              </h2>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
                Setiap laporan warga dikarantina di bucket privat (<code className="font-mono-data text-[11px] text-[#0D9488]">report-evidence-private</code>) hingga bukti fisik diperiksa. Persetujuan publikasi otomatis membuka visibilitas publik dan mencatat peristiwa ke buku kas audit append-only (<code className="font-mono-data text-[11px]">report_events</code>).
              </p>
            </div>

            <button
              onClick={loadPending}
              disabled={loadingPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-[#F8F9FA] dark:bg-[#1C2638] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] text-[#111827] dark:text-[#F9FAFB] rounded-lg border border-[#E5E7EB] dark:border-[#243042] transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} />
              <span>Segarkan Antrean</span>
            </button>
          </div>

          {/* Fallback Notice if Supabase not yet migrated */}
          {!isLive && (
            <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-[#2B2313] border border-[#FCD34D] dark:border-[#78350F] text-xs text-[#92400E] dark:text-[#FDE68A] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Mode Pengujian Database Lokal:</span>
                <p>
                  Prosedur tersimpan <code className="font-mono-data">submit_citizen_report</code> dan <code className="font-mono-data">moderate_report</code> memerlukan eksekusi migrasi di Supabase SQL Editor. Laporan yang masuk ke tabel <code className="font-mono-data">reports</code> dengan <code className="font-mono-data">publication_status = 'pending'</code> akan tampil di sini.
                </p>
              </div>
            </div>
          )}

          {/* Pending Error */}
          {pendingError && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1215] border border-[#FCA5A5] dark:border-[#7F1D1D] text-xs text-[#991B1B] dark:text-[#FCA5A5] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pendingError}</span>
            </div>
          )}

          {/* Loading */}
          {loadingPending && (
            <div className="p-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Memeriksa antrean moderasi dari database Supabase...
            </div>
          )}

          {/* Empty State */}
          {!loadingPending && pendingReports.length === 0 && (
            <div className="bg-white dark:bg-[#151D2A] p-12 text-center rounded-2xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#0D9488] mx-auto" />
              <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
                Antrean Kurasi Bersih
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                Tidak ada laporan warga yang menunggu peninjauan saat ini. Semua laporan yang dikirim melalui formulir pelaporan akan masuk ke antrean ini sebelum dipublikasikan.
              </p>
            </div>
          )}

          {/* Pending Cards List */}
          {!loadingPending && pendingReports.length > 0 && (
            <div className="space-y-4">
              {pendingReports.map(report => {
                const primaryPhoto = report.approvedMedia?.[0]?.url;
                const feedback = actionFeedback[report.id];
                const isProcessing = moderatingId === report.id;

                return (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-5 shadow-xs space-y-4 transition-colors"
                  >
                    {/* Top Row: Ref & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] dark:border-[#243042] pb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-bold bg-[#111827] dark:bg-[#0B0F17] text-white px-2.5 py-0.5 rounded text-[11px]">
                          {report.publicReference}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]">
                          Menunggu Kurasi
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3F4F6] dark:bg-[#243042] text-[#4B5563] dark:text-[#94A3B8]">
                          {report.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                        <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>{report.subdistrict}</span>
                        <span>•</span>
                        <span>{report.observedAt}</span>
                      </div>
                    </div>

                    {/* Content & Evidence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Photo Evidence (Private Bucket) */}
                      <div className="md:col-span-1 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622] h-48 relative flex items-center justify-center">
                        {primaryPhoto ? (
                          <img
                            src={primaryPhoto}
                            alt={report.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-4 text-center text-[#9CA3AF] space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto" />
                            <span className="text-[11px]">Foto belum dimuat atau dalam proses dekripsi</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 text-[10px] font-mono-data bg-black/75 text-white px-2 py-0.5 rounded">
                          EXIF Sanitized
                        </span>
                      </div>

                      {/* Issue Details & Spatial Context */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
                            {report.title}
                          </h3>
                          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed mt-1">
                            {report.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8F9FA] dark:bg-[#101622] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
                          <div>
                            <span className="text-[#6B7280] dark:text-[#94A3B8] block">Tingkat Dampak:</span>
                            <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">{report.severity}</span>
                          </div>
                          <div>
                            <span className="text-[#6B7280] dark:text-[#94A3B8] block">Metode Akuisisi:</span>
                            <span className="font-mono-data font-semibold text-[#111827] dark:text-[#F9FAFB] uppercase">
                              {report.locationMethod} {report.isApproximateLocation ? '(Perkiraan)' : '(Akurat)'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[#6B7280] dark:text-[#94A3B8] block">Koordinat Publik:</span>
                            <span className="font-mono-data text-[#111827] dark:text-[#F9FAFB]">
                              {report.coordinates[0].toFixed(5)}, {report.coordinates[1].toFixed(5)}
                            </span>
                          </div>
                        </div>

                        {/* Moderator Notes Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#4B5563] dark:text-[#94A3B8]">
                            Catatan Kurator / Justifikasi Audit:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Bukti fisik valid, lubang jalan terkonfirmasi mengganggu keselamatan..."
                            value={moderatorNotes[report.id] || ''}
                            onChange={(e) => setModeratorNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                            className="w-full px-3 py-1.5 text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#0D9488]"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => handleModerate(report.id, 'published', 'published')}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui &amp; Publikasikan</span>
                          </button>

                          <button
                            onClick={() => handleModerate(report.id, 'rejected', 'rejected')}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#FEE2E2] dark:hover:bg-[#3D1418] text-[#DC2626] border border-[#FCA5A5] dark:border-[#7F1D1D] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak Laporan</span>
                          </button>

                          <button
                            onClick={() => handleModerate(report.id, 'under_review', 'pending')}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#FEF3C7] dark:hover:bg-[#3E2C0C] text-[#D97706] border border-[#FCD34D] dark:border-[#78350F] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tandai Dalam Tinjauan</span>
                          </button>
                        </div>

                        {/* Status feedback */}
                        {feedback && (
                          <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                            feedback.type === 'success'
                              ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]'
                              : 'bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2A1215] dark:text-[#FCA5A5]'
                          }`}>
                            {feedback.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

