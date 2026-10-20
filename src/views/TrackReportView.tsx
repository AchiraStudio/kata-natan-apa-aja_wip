import React, { useState } from 'react';
import {
  Search,
  Key,
  ShieldCheck,
  Clock,
  MapPin,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { dataService } from '../services/dataService';
import { Report } from '../types/domain';
import './TrackReportView.css';

const TRACKING_STEPS = [
  { status: 'submitted', label: 'Laporan diterima', detail: 'Nomor laporan berhasil dicatat.' },
  { status: 'under_review', label: 'Pemeriksaan awal', detail: 'Bukti dan lokasi sedang ditinjau.' },
  { status: 'accepted_for_routing', label: 'Laporan disetujui', detail: 'Laporan siap diteruskan ke instansi.' },
  { status: 'forwarded_to_institution', label: 'Dikirim ke instansi', detail: 'Instansi terkait menerima laporan.' },
  { status: 'institution_responded', label: 'Instansi merespons', detail: 'Tindak lanjut sedang disiapkan.' },
  { status: 'resolved', label: 'Penanganan selesai', detail: 'Laporan dinyatakan selesai.' },
] as const;

const STATUS_STEP_INDEX: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  needs_info: 1,
  accepted_for_routing: 2,
  forwarded_to_institution: 3,
  institution_responded: 4,
  resolved: 5,
};

export const TrackReportView: React.FC = () => {
  const [reference, setReference] = useState('');
  const [token, setToken] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setIsSearching(true);
    setError('');
    setReport(null);

    try {
      // If token provided, verify via tracking auth; otherwise lookup by public ref for demo
      let result: Report | null = null;
      if (token.trim()) {
        result = await dataService.verifyReportTracking(reference.trim(), token.trim());
      } else {
        result = await dataService.getReportByReference(reference.trim());
      }

      if (result) {
        setReport(result);
      } else {
        setError('Laporan tidak ditemukan atau token rahasia tidak cocok.');
      }
    } catch {
      setError('Terjadi kendala saat memeriksa laporan.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickFillDemo = () => {
    setReference('TIK-2026-000123');
    setToken('');
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
      <Sidebar currentPath="/track" />

      {/* Main Track Console */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 max-w-4xl w-full space-y-6 pb-24 lg:pb-12 min-w-0">
          {/* Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) */}
          <div className="track-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-col justify-between border border-[#263F35]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="track-slashes-container" aria-hidden="true">
              <div className="track-ambient-glow" />
              <div className="track-ribbon track-ribbon-1" />
              <div className="track-ribbon track-ribbon-2" />
              <div className="track-slash-line track-slash-1" />
              <div className="track-slash-line track-slash-2" />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#E7EBDD] border border-white/20 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pelacakan Akuntabilitas Publik</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Lacak Status Laporan Sipil
              </h1>
              <p className="text-xs lg:text-sm text-[#E7EBDD]/90 mt-1.5 leading-relaxed">
                Kawal transparansi tindak lanjut laporan Anda. Masukkan ID Laporan dan token rahasia yang Anda terima saat mengajukan laporan anonim.
              </p>
            </div>
          </div>

          {/* Search Box Card */}
          <div className="track-search-card bg-white border border-[#E4E2DA] rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1.5">
                  ID Referensi Publik Laporan *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#686B65]" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TIK-2026-000123"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="track-pill-input w-full pl-11 pr-4 py-3 bg-[#F7F6F1] border border-[#E4E2DA] rounded-full text-xs font-mono text-[#20221D] focus:outline-none focus:border-[#263F35] focus:ring-1 focus:ring-[#263F35] shadow-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1.5">
                  Token Rahasia Pelacakan Anonim (Opsional untuk status publik)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-4 top-3.5 text-[#686B65]" />
                  <input
                    type="password"
                    placeholder="Masukkan 16 karakter token rahasia..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="track-pill-input w-full pl-11 pr-4 py-3 bg-[#F7F6F1] border border-[#E4E2DA] rounded-full text-xs font-mono text-[#20221D] focus:outline-none focus:border-[#263F35] focus:ring-1 focus:ring-[#263F35] shadow-xs transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="text-xs text-[#263F35] font-semibold hover:underline cursor-pointer"
                >
                  Gunakan Contoh Data (TIK-2026-000123)
                </button>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="track-submit-btn px-6 py-3 bg-[#263F35] text-white rounded-full text-xs font-bold hover:bg-[#1d3129] disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearching ? 'Memeriksa...' : 'Cek Status Laporan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Report Tracking Results */}
          {report && (
            <div className="track-result-card bg-white border border-[#E4E2DA] rounded-3xl p-6 lg:p-8 shadow-xs space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E4E2DA]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#686B65]">
                      {report.publicReference}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-[#92400E] border border-amber-300">
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#20221D] mt-1">{report.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#686B65] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{report.location.address}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#686B65]">Dukungan Warga</div>
                  <div className="text-base font-bold text-[#263F35]">
                    {report.supportCount} Warga
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B65] mb-1">
                  Deskripsi Laporan
                </h4>
                <p className="text-xs text-[#20221D] leading-relaxed bg-[#F7F6F1] p-3.5 rounded-2xl border border-[#E4E2DA]">
                  {report.description}
                </p>
              </div>

              {/* APBD Budget Context */}
              {report.budgetContext && (
                <div className="p-4 bg-[#F7F6F1] border border-[#E4E2DA] rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#20221D]">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#263F35]" />
                      <span>Korelasi APBD: {report.budgetContext.subSectorName}</span>
                    </div>
                    <span className="text-[10px] text-[#263F35] font-mono font-semibold">
                      {report.budgetContext.executionRatePercent}% Terserap
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#686B65]">
                    <span>Dinas Penanggung Jawab: {report.responsibleAgency}</span>
                    <span>Pagu: Rp {(report.budgetContext.paguAllocation / 1000000000).toFixed(1)} M</span>
                  </div>
                </div>
              )}

              {/* Shipment-style progress timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B65] mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#263F35]" />
                  <span>Progres Penanganan</span>
                </h4>
                {report.status === 'rejected' ? (
                  <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-800">
                    Laporan belum dapat diproses. Buka riwayat di bawah untuk melihat alasan dari petugas.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 border-l-2 border-[#E4E2DA] ml-2">
                    {TRACKING_STEPS.map((step, index) => {
                      const currentStep = STATUS_STEP_INDEX[report.status] ?? 0;
                      const isComplete = index < currentStep;
                      const isCurrent = index === currentStep;
                      const event = report.events.filter((item) => item.newStatus === step.status).pop();

                      return (
                        <div key={step.status} className="relative">
                          <span className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                            isComplete || isCurrent ? 'bg-[#263F35]' : 'bg-[#D5D8D2]'
                          }`} />
                          <div className={`${isCurrent ? 'font-semibold text-[#20221D]' : isComplete ? 'text-[#263F35]' : 'text-[#686B65]'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                              <span>{step.label}</span>
                              {event && <span className="text-[10px] font-normal text-[#686B65]">{event.timestamp}</span>}
                            </div>
                            <p className="text-[11px] mt-0.5">{event?.description || step.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {report.status === 'needs_info' && (
                  <div className="mt-3 p-3 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
                    Petugas membutuhkan informasi tambahan. Lihat catatan terbaru pada riwayat tindak lanjut.
                  </div>
                )}
              </div>

              {/* Audit Trail Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B65] mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#263F35]" />
                  <span>Riwayat Tindak Lanjut Resmi</span>
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-[#E4E2DA] ml-2">
                  {report.events.map((ev) => (
                    <div key={ev.id} className="relative">
                      <span className="track-timeline-node absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#263F35] ring-4 ring-white"></span>
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-[#20221D]">
                          <span>{ev.eventType}</span>
                          <span className="text-[10px] text-[#686B65] font-normal">{ev.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-[#263F35] font-medium mt-0.5">
                          Oleh: {ev.actorName}
                        </div>
                        <p className="text-xs text-[#686B65] mt-1 leading-relaxed bg-[#F7F6F1] p-3 rounded-2xl border border-[#E4E2DA]/60">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      <BottomNav />
    </div>
  );
};
