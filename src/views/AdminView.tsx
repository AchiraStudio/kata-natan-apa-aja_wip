import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Filter,
  Building,
  MapPin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useTitik } from '../context/TitikContext';
import { Report, ReportStatus, ReportEvent } from '../types/domain';
import { getReportMediaType } from '../utils/reportEvidence';
import './AdminView.css';

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const { posts, updateReportStatus, deleteReport, refreshFeed } = useTitik();

  // Collect reports from feed
  const reports: Report[] = posts
    .map((p) => p.relatedReport)
    .filter((r): r is Report => Boolean(r));

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionNote, setActionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });
  const selectedReport = filteredReports.find((r) => r.id === selectedReportId) || filteredReports[0];

  const handleApplyTransition = async (targetStatus: ReportStatus) => {
    if (!selectedReport || isUpdating) return;
    if (targetStatus === 'rejected' && !actionNote.trim()) {
      setActionError('Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');
      setActionSuccess('');
      return;
    }
    setIsUpdating(true);
    setActionError('');
    setActionSuccess('');
    try {
      const defaultDesc: Record<ReportStatus, string> = {
        submitted: 'Status dikembalikan ke antrean penerimaan.',
        under_review: 'Admin memulai peninjauan kesesuaian bukti laporan.',
        needs_info: actionNote.trim() || 'Admin meminta klarifikasi tambahan dari warga pelapor.',
        accepted_for_routing: 'Laporan disetujui untuk diteruskan ke dinas teknis berwenang.',
        forwarded_to_institution:
          actionNote.trim() ||
          `Laporan diteruskan ke portal koordinasi ${selectedReport.responsibleAgency} untuk jadwal survei lapangan.`,
        institution_responded:
          actionNote.trim() ||
          `${selectedReport.responsibleAgency} telah memberikan respon resmi dan memasukkan jadwal perbaikan APBD.`,
        resolved:
          actionNote.trim() ||
          'Pekerjaan perbaikan fisik telah diverifikasi tuntas oleh tim lapangan.',
        rejected: actionNote.trim() || 'Laporan ditolak karena tidak memenuhi kriteria bukti.',
      };

      await updateReportStatus(selectedReport.id, targetStatus, defaultDesc[targetStatus]);
      setActionNote('');
      setActionSuccess(`Status laporan ${selectedReport.publicReference} berhasil diperbarui.`);
    } catch (error) {
      console.error('Failed to update report status:', error);
      setActionError(error instanceof Error ? error.message : 'Status laporan gagal diperbarui. Silakan coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport || isUpdating) return;
    const confirmed = window.confirm(
      `Hapus permanen laporan ${selectedReport.publicReference} (“${selectedReport.title}”)? Laporan tidak akan bisa dipulihkan.`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    setActionError('');
    setActionSuccess('');
    try {
      const reference = selectedReport.publicReference;
      await deleteReport(selectedReport.id);
      setSelectedReportId('');
      setActionNote('');
      setActionSuccess(`Laporan ${reference} berhasil dihapus.`);
    } catch (error) {
      console.error('Failed to delete report:', error);
      setActionError(error instanceof Error ? error.message : 'Laporan gagal dihapus. Silakan coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] dark:bg-[#131916] border-b border-[#E4E2DA] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#20221D] dark:text-[#F3F6F4]"
        >
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#263F35] dark:bg-[#10B981]"></span>
        </a>
        <div className="flex items-center gap-2">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover border border-[#E4E2DA] dark:border-[#26352E]"
          />
        </div>
      </header>

      {/* Left Navigation Hub */}
      <Sidebar />

      {/* Main Admin Console */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-7xl space-y-6 pb-24 lg:pb-12 min-w-0">
          {/* Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) */}
          <div className="admin-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-wrap items-center justify-between gap-6 border border-[#263F35]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="admin-slashes-container" aria-hidden="true">
              <div className="admin-ambient-glow" />
              <div className="admin-ribbon admin-ribbon-1" />
              <div className="admin-ribbon admin-ribbon-2" />
              <div className="admin-slash-line admin-slash-1" />
              <div className="admin-slash-line admin-slash-2" />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#E7EBDD] border border-white/20 text-xs font-semibold mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Operasional & Moderasi Sipil</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Antrean Tinjauan & Validasi Laporan
              </h1>
              <p className="text-xs lg:text-sm text-[#E7EBDD]/90 mt-1.5 leading-relaxed">
                Verifikasi bukti fisik, rute ke dinas penanggung jawab, dan perbarui status akuntabilitas publik.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshFeed}
              className="admin-refresh-btn relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white/90 hover:bg-white border border-white/30 rounded-full text-xs font-bold text-[#20221D] hover:text-[#263F35] shadow-xs cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#263F35]" />
              <span>Segarkan Antrean</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="admin-metric-card bg-white border border-[#E4E2DA] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 transition-all">
              <span className="text-[11px] text-[#686B65] font-medium">Menunggu Verifikasi</span>
              <div className="text-xl font-bold text-[#92400E] mt-1">
                {reports.filter((r) => r.status === 'under_review').length}
              </div>
            </div>

            <div className="admin-metric-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 dark:hover:border-[#10B981]/40 transition-all">
              <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3] font-medium">Butuh Info Warga</span>
              <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                {reports.filter((r) => r.status === 'needs_info').length}
              </div>
            </div>

            <div className="admin-metric-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 dark:hover:border-[#10B981]/40 transition-all">
              <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3] font-medium">Diteruskan ke Dinas</span>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {reports.filter((r) => r.status === 'forwarded_to_institution').length}
              </div>
            </div>

            <div className="admin-metric-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 dark:hover:border-[#10B981]/40 transition-all">
              <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3] font-medium">Tuntas Ditangani</span>
              <div className="text-xl font-bold text-[#263F35] dark:text-[#34D399] mt-1">
                {reports.filter((r) => r.status === 'resolved').length}
              </div>
            </div>
          </div>

          {/* Main 2-Column Triage Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue (5 Cols) */}
            <div className="admin-queue-card lg:col-span-5 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA] dark:border-[#26352E]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#20221D] dark:text-[#F3F6F4]">
                  Antrean Laporan ({filteredReports.length})
                </h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[#686B65] dark:text-[#9EACA3]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-full px-3 py-1.5 text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981]"
                  >
                    <option value="all">Semua Status</option>
                    <option value="under_review">Menunggu Verifikasi</option>
                    <option value="needs_info">Butuh Info</option>
                    <option value="forwarded_to_institution">Diteruskan ke Dinas</option>
                    <option value="resolved">Selesai</option>
                  </select>
                </div>
              </div>

              {/* Queue Items */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                {filteredReports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReportId(r.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] border-[#263F35] dark:border-[#10B981] shadow-xs'
                          : 'bg-[#F7F6F1]/60 dark:bg-[#131916]/60 border-[#E4E2DA] dark:border-[#26352E] hover:bg-white dark:hover:bg-[#1A221E]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-[#20221D] dark:text-[#F3F6F4]">{r.publicReference}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] text-[#686B65] dark:text-[#9EACA3]">
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] truncate">{r.title}</div>
                      <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3] truncate mt-0.5">{r.location.address}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Review & Action Console (7 Cols) */}
            {selectedReport ? (
              <div className="admin-console-card lg:col-span-7 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-start justify-between pb-3 border-b border-[#E4E2DA] dark:border-[#26352E]">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#686B65] dark:text-[#9EACA3]">
                      {selectedReport.publicReference}
                    </span>
                    <h2 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4] mt-0.5">
                      {selectedReport.title}
                    </h2>
                    <div className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{selectedReport.location.address}</span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Evidence Thumbnail & Details */}
                <div className="flex items-start gap-3">
                  {selectedReport.mediaUrls.map((url, index) => (
                    getReportMediaType(url) === 'video' ? (
                      <video
                        key={`${selectedReport.id}-evidence-${index}`}
                        src={url}
                        controls
                        playsInline
                        aria-label={`Video bukti ${index + 1} ${selectedReport.title}`}
                        className="w-24 h-24 rounded-2xl object-cover border border-[#E4E2DA] dark:border-[#26352E] shrink-0"
                      />
                    ) : (
                      <img
                        key={`${selectedReport.id}-evidence-${index}`}
                        src={url}
                        alt={`Foto bukti ${index + 1} ${selectedReport.title}`}
                        className="w-24 h-24 rounded-2xl object-cover border border-[#E4E2DA] dark:border-[#26352E] shrink-0"
                      />
                    )
                  ))}
                  <div className="text-xs space-y-1.5">
                    <p className="text-[#20221D] dark:text-[#F3F6F4] leading-relaxed bg-[#F7F6F1] dark:bg-[#131916] p-3 rounded-2xl border border-[#E4E2DA] dark:border-[#26352E]">
                      {selectedReport.description}
                    </p>
                    <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                      Pelapor: <span className="font-semibold">{selectedReport.reporterDisplayName || 'Anonim'}</span> • Sektor:{' '}
                      <span className="font-semibold">{selectedReport.category}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-[#686B65] dark:text-[#9EACA3]">Estimasi Biaya</div>
                    <div className="font-semibold text-[#20221D] dark:text-[#F3F6F4] mt-1">
                      {selectedReport.estimatedCost
                        ? `Rp ${selectedReport.estimatedCost.toLocaleString('id-ID')}`
                        : 'Belum dicantumkan'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-[#686B65] dark:text-[#9EACA3]">Dokumen Pendukung</div>
                    {selectedReport.supportingDocuments?.length ? (
                      <ul className="mt-1 space-y-1">
                        {selectedReport.supportingDocuments.map((document, index) => (
                          <li key={`${document.name}-${index}`}>
                            <a
                              href={document.dataUrl}
                              download={document.name}
                              className="text-[#263F35] dark:text-[#34D399] underline underline-offset-2 break-all"
                            >
                              {document.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="font-medium text-[#20221D] dark:text-[#F3F6F4] mt-1">Tidak ada lampiran</div>
                    )}
                  </div>
                </div>

                {/* Agency & APBD Connection */}
                <div className="p-3.5 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#263F35] dark:text-[#34D399]" />
                    <span className="font-medium text-[#20221D] dark:text-[#F3F6F4]">{selectedReport.responsibleAgency}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#263F35] dark:text-[#34D399] font-semibold">
                    Alokasi: Rp {(selectedReport.budgetContext.paguAllocation / 1000000000).toFixed(1)} M
                  </span>
                </div>

                {/* Action Note Input */}
                <div>
                  <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1.5">
                    Saran Perbaikan untuk Pelapor
                  </label>
                  <textarea
                    rows={3}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Jelaskan bukti atau informasi yang kurang dan cara memperbaikinya. Warga akan melihat catatan ini jika laporan ditolak atau perlu informasi."
                    className="admin-note-input w-full px-4 py-3 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981] shadow-xs resize-y"
                  />
                </div>

                {actionError && (
                  <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
                    {actionError}
                  </p>
                )}
                {actionSuccess && (
                  <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">
                    {actionSuccess}
                  </p>
                )}

                {/* State Machine Transition Action Buttons */}
                <div className="pt-2 border-t border-[#E4E2DA] dark:border-[#26352E] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3]">
                    Aksi Transisi Status:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('under_review')}
                      className="admin-transition-btn px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded-full font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-all text-xs"
                    >
                      Mulai Review
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('needs_info')}
                      className="admin-transition-btn px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-full font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-all text-xs"
                    >
                      Minta Info Tambahan
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('accepted_for_routing')}
                      className="admin-transition-btn px-4 py-2 bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] border border-[#263F35]/30 dark:border-[#10B981]/40 rounded-full font-semibold hover:bg-[#d8e0cc] dark:hover:bg-[#243f31] disabled:opacity-50 transition-all text-xs"
                    >
                      Setujui Laporan
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('forwarded_to_institution')}
                      className="admin-transition-btn px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-full font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-all text-xs"
                    >
                      Teruskan ke Dinas
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('institution_responded')}
                      className="admin-transition-btn px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-full font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all text-xs"
                    >
                      Catat Respon Dinas
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('resolved')}
                      className="admin-transition-btn px-4 py-2 bg-emerald-700 dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-full font-semibold hover:bg-emerald-800 dark:hover:bg-[#34D399] disabled:opacity-50 transition-all shadow-xs text-xs"
                    >
                      ✓ Tandai Selesai
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('rejected')}
                      className="admin-transition-btn px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-full font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-all text-xs"
                    >
                      Tolak Laporan
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleDeleteReport}
                      className="admin-transition-btn px-4 py-2 bg-rose-700 dark:bg-rose-800 text-white border border-rose-800 dark:border-rose-700 rounded-full font-semibold hover:bg-rose-800 dark:hover:bg-rose-700 disabled:opacity-50 transition-all text-xs"
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus Permanen
                      </span>
                    </button>
                  </div>
                </div>

                {/* Audit History Log */}
                <div className="pt-2 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3] mb-2 block">
                    Riwayat Audit Terakhir:
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar text-xs">
                    {selectedReport.events.map((ev: ReportEvent) => (
                      <div key={ev.id} className="p-2.5 bg-[#F7F6F1] dark:bg-[#131916] rounded-2xl border border-[#E4E2DA]/60 dark:border-[#26352E]">
                        <div className="flex justify-between font-semibold text-[#20221D] dark:text-[#F3F6F4]">
                          <span>{ev.eventType}</span>
                          <span className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">{ev.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3] mt-0.5">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-console-card lg:col-span-7 p-12 text-center text-[#686B65] dark:text-[#9EACA3] bg-white dark:bg-[#1A221E] rounded-3xl border border-[#E4E2DA] dark:border-[#26352E]">
                Pilih laporan dari antrean untuk meninjau detail.
              </div>
            )}
          </div>
        </main>
      <BottomNav />
    </div>
  );
};
