import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { useReports } from '../hooks/useReports';
import { ReportWorkflowForm } from '../components/reporting/ReportWorkflowForm';
import { SECTORS, SUBDISTRICTS } from '../data/titikRegionalData';
import { SectorType, SubdistrictType } from '../types';
import { 
  MapPin, 
  Building2, 
  ThumbsUp, 
  ArrowRight, 
  Search,
  Filter,
  AlertCircle,
  Radio,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ImageIcon
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

  const [activeTab, setActiveTab] = useState<'NEW_REPORT' | 'ALL_REPORTS'>(
    prefilledFacilityId ? 'NEW_REPORT' : 'ALL_REPORTS'
  );

  // Hook for live/published reports from Supabase (or transparent fallback)
  const { reports, loading, error, isLive, vote } = useReports({
    category: selectedSector !== 'Semua' ? selectedSector : undefined,
    subdistrict: selectedSubdistrict !== 'Semua' ? selectedSubdistrict : undefined,
    search: searchQuery || undefined,
  });

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

    </div>
  );
};
