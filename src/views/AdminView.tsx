import React, { useState } from 'react';
import {
  ShieldAlert,
  Filter,
  Building,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useTitik } from '../context/TitikContext';
import { Report, ReportStatus, ReportEvent } from '../types/domain';
import './AdminView.css';

export const AdminView: React.FC = () => {
  const { posts, updateReportStatus, refreshFeed } = useTitik();

  // Collect reports from feed
  const reports: Report[] = posts
    .map((p) => p.relatedReport)
    .filter((r): r is Report => Boolean(r));

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionNote, setActionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const handleApplyTransition = async (targetStatus: ReportStatus) => {
    if (!selectedReport || isUpdating) return;
    setIsUpdating(true);
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
      await refreshFeed();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F7F6F1] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] selection:text-white">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] border-b border-[#E4E2DA] px-4 flex items-center justify-between shrink-0 z-20">
        <a href="/" className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#20221D]">
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#263F35]"></span>
        </a>
        <div className="flex items-center gap-2">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover border border-[#E4E2DA]"
          />
        </div>
      </header>

      {/* Left Navigation Hub */}
      <Sidebar currentPath="/admin" />

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

            <div className="admin-metric-card bg-white border border-[#E4E2DA] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 transition-all">
              <span className="text-[11px] text-[#686B65] font-medium">Butuh Info Warga</span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {reports.filter((r) => r.status === 'needs_info').length}
              </div>
            </div>

            <div className="admin-metric-card bg-white border border-[#E4E2DA] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 transition-all">
              <span className="text-[11px] text-[#686B65] font-medium">Diteruskan ke Dinas</span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {reports.filter((r) => r.status === 'forwarded_to_institution').length}
              </div>
            </div>

            <div className="admin-metric-card bg-white border border-[#E4E2DA] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/30 transition-all">
              <span className="text-[11px] text-[#686B65] font-medium">Tuntas Ditangani</span>
              <div className="text-xl font-bold text-[#263F35] mt-1">
                {reports.filter((r) => r.status === 'resolved').length}
              </div>
            </div>
          </div>

          {/* Main 2-Column Triage Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue (5 Cols) */}
            <div className="admin-queue-card lg:col-span-5 bg-white border border-[#E4E2DA] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#20221D]">
                  Antrean Laporan ({filteredReports.length})
                </h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[#686B65]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-[#F7F6F1] border border-[#E4E2DA] rounded-full px-3 py-1.5 text-[#20221D] focus:outline-none focus:border-[#263F35]"
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
                          ? 'bg-[#E7EBDD] border-[#263F35] shadow-xs'
                          : 'bg-[#F7F6F1]/60 border-[#E4E2DA] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-[#20221D]">{r.publicReference}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#E4E2DA] text-[#686B65]">
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#20221D] truncate">{r.title}</div>
                      <div className="text-[11px] text-[#686B65] truncate mt-0.5">{r.location.address}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Review & Action Console (7 Cols) */}
            {selectedReport ? (
              <div className="admin-console-card lg:col-span-7 bg-white border border-[#E4E2DA] rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-start justify-between pb-3 border-b border-[#E4E2DA]">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#686B65]">
                      {selectedReport.publicReference}
                    </span>
                    <h2 className="text-base font-bold text-[#20221D] mt-0.5">
                      {selectedReport.title}
                    </h2>
                    <div className="text-xs text-[#686B65] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{selectedReport.location.address}</span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-[#92400E] border border-amber-300">
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Evidence Thumbnail & Details */}
                <div className="flex items-start gap-4">
                  <img
                    src={selectedReport.mediaUrls[0]}
                    alt={selectedReport.title}
                    className="w-24 h-24 rounded-2xl object-cover border border-[#E4E2DA] shrink-0"
                  />
                  <div className="text-xs space-y-1.5">
                    <p className="text-[#20221D] leading-relaxed bg-[#F7F6F1] p-3 rounded-2xl border border-[#E4E2DA]">
                      {selectedReport.description}
                    </p>
                    <div className="text-[11px] text-[#686B65]">
                      Pelapor: <span className="font-semibold">{selectedReport.reporterDisplayName || 'Anonim'}</span> • Sektor:{' '}
                      <span className="font-semibold">{selectedReport.category}</span>
                    </div>
                  </div>
                </div>

                {/* Agency & APBD Connection */}
                <div className="p-3.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-2xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#263F35]" />
                    <span className="font-medium text-[#20221D]">{selectedReport.responsibleAgency}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#263F35] font-semibold">
                    Alokasi: Rp {(selectedReport.budgetContext.paguAllocation / 1000000000).toFixed(1)} M
                  </span>
                </div>

                {/* Action Note Input */}
                <div>
                  <label className="block text-xs font-bold text-[#20221D] mb-1.5">
                    Catatan Audit & Penanganan (Dicatat Permanen)
                  </label>
                  <input
                    type="text"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Tuliskan alasan penolakan, catatan nomor berkas, atau jadwal survei dinas..."
                    className="admin-note-input w-full px-4 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-full text-xs text-[#20221D] focus:outline-none focus:border-[#263F35] shadow-xs"
                  />
                </div>

                {/* State Machine Transition Action Buttons */}
                <div className="pt-2 border-t border-[#E4E2DA] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65]">
                    Aksi Transisi Status:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('needs_info')}
                      className="admin-transition-btn px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-semibold hover:bg-rose-100 disabled:opacity-50 transition-all text-xs"
                    >
                      Minta Info Tambahan
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('accepted_for_routing')}
                      className="admin-transition-btn px-4 py-2 bg-[#E7EBDD] text-[#263F35] border border-[#263F35]/30 rounded-full font-semibold hover:bg-[#d8e0cc] disabled:opacity-50 transition-all text-xs"
                    >
                      Setujui Laporan
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('forwarded_to_institution')}
                      className="admin-transition-btn px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold hover:bg-blue-100 disabled:opacity-50 transition-all text-xs"
                    >
                      Teruskan ke Dinas
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('institution_responded')}
                      className="admin-transition-btn px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-semibold hover:bg-indigo-100 disabled:opacity-50 transition-all text-xs"
                    >
                      Catat Respon Dinas
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('resolved')}
                      className="admin-transition-btn px-4 py-2 bg-emerald-700 text-white rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs text-xs"
                    >
                      ✓ Tandai Selesai
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleApplyTransition('rejected')}
                      className="admin-transition-btn px-4 py-2 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-full font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-all text-xs"
                    >
                      Tolak Laporan
                    </button>
                  </div>
                </div>

                {/* Audit History Log */}
                <div className="pt-2 border-t border-[#E4E2DA]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65] mb-2 block">
                    Riwayat Audit Terakhir:
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar text-xs">
                    {selectedReport.events.map((ev: ReportEvent) => (
                      <div key={ev.id} className="p-2.5 bg-[#F7F6F1] rounded-2xl border border-[#E4E2DA]/60">
                        <div className="flex justify-between font-semibold text-[#20221D]">
                          <span>{ev.eventType}</span>
                          <span className="text-[10px] text-[#686B65]">{ev.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-[#686B65] mt-0.5">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-console-card lg:col-span-7 p-12 text-center text-[#686B65] bg-white rounded-3xl border border-[#E4E2DA]">
                Pilih laporan dari antrean untuk meninjau detail.
              </div>
            )}
          </div>
        </main>
      <BottomNav />
    </div>
  );
};
