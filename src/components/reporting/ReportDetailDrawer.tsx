import React from 'react';
import {
  X,
  MapPin,
  Building,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import '../../views/ReportDetailView.css';

export const ReportDetailDrawer: React.FC = () => {
  const { reportDetailOpen, closeReportDetail, selectedReport, toggleSupport } = useTitik();

  if (!reportDetailOpen || !selectedReport) return null;

  const budget = selectedReport.budgetContext;

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'under_review':
        return 'bg-amber-100 text-[#92400E] border-amber-300';
      case 'forwarded_to_institution':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'needs_info':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-[#E7EBDD] text-[#263F35] border-[#263F35]/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E4E2DA] rounded-t-[36px] sm:rounded-none">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E4E2DA] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#686B65]">
              {selectedReport.publicReference}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                selectedReport.status
              )}`}
            >
              {selectedReport.status.replace('_', ' ')}
            </span>
            {selectedReport.isSampleData && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                Data Contoh
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeReportDetail}
            className="p-1.5 rounded-full text-[#686B65] hover:text-[#20221D] hover:bg-[#F7F6F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Main Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-[#20221D] leading-snug">
              {selectedReport.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#686B65] mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{selectedReport.location.address}</span>
            </div>
            <p className="text-sm text-[#20221D] mt-3 leading-relaxed">
              {selectedReport.description}
            </p>
          </div>

          {/* Photo Evidence */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B65] mb-2">
              Bukti Lapangan
            </h4>
            <div className="rounded-2xl overflow-hidden border border-[#E4E2DA] bg-[#F7F6F1]">
              <img
                src={selectedReport.mediaUrls[0]}
                alt={selectedReport.title}
                className="w-full h-64 object-cover"
              />
            </div>
          </div>

          {/* APBD Budget Correlation Card (OGD Spine!) */}
          {budget && (
            <div className="p-4 bg-white border border-[#E4E2DA] rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DA]/60">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20221D]">
                  <TrendingUp className="w-4 h-4 text-[#263F35]" />
                  <span>Konteks Anggaran APBD 2026</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E7EBDD] text-[#263F35] font-semibold">
                  SIKD Kemendagri
                </span>
              </div>

              <div className="text-xs">
                <div className="text-[11px] text-[#686B65]">Sektor Anggaran:</div>
                <div className="font-bold text-sm text-[#20221D]">{budget.sectorName}</div>
                <div className="text-xs text-[#263F35] font-medium mt-0.5">{budget.subSectorName}</div>
              </div>

              {/* Budget Progress Bar & Numbers Grid */}
              <div className="p-3 bg-[#F7F6F1] rounded-xl border border-[#E4E2DA] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#686B65]">
                    Realisasi Belanja: <strong className="text-[#20221D]">Rp {(budget.realizedSpending / 1000000000).toFixed(1)} Miliar</strong>
                  </span>
                  <span className="font-bold text-[#263F35]">
                    {budget.executionRatePercent}% Terserap
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white overflow-hidden border border-[#E4E2DA]">
                  <div
                    ref={(el) => {
                      if (el) el.style.setProperty('--drawer-budget-pct', `${budget.executionRatePercent}%`);
                    }}
                    className="drawer-budget-bar-fill"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#686B65]">
                  <span>Pagu Total Alokasi:</span>
                  <span className="font-semibold text-[#20221D]">Rp {(budget.paguAllocation / 1000000000).toFixed(1)} Miliar</span>
                </div>
              </div>

              {/* Responsible Agency Profile */}
              <div className="pt-2 border-t border-[#E4E2DA]/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building className="w-4 h-4 text-[#686B65] shrink-0" />
                  <span className="font-medium text-[#20221D] truncate">{budget.responsibleAgency}</span>
                </div>
                <div className="text-[11px] text-[#263F35] font-semibold shrink-0 pl-2">
                  Skor Responsif: {budget.responsivenessScore}/100
                </div>
              </div>

              <div className="text-[10px] text-[#686B65]/70 font-mono">
                {budget.dataSource} • [Data Contoh]
              </div>
            </div>
          )}

          {/* Audit Event Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B65] mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#263F35]" />
              <span>Riwayat Audit & Penanganan</span>
            </h4>

            <div className="relative pl-6 space-y-4 border-l-2 border-[#E4E2DA] ml-2">
              {selectedReport.events.map((ev) => (
                <div key={ev.id} className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#263F35] ring-4 ring-white"></span>
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#20221D]">
                      <span>{ev.eventType}</span>
                      <span className="text-[10px] text-[#686B65] font-normal">{ev.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#263F35] font-medium mt-0.5">
                      Oleh: {ev.actorName}
                    </div>
                    <p className="text-xs text-[#686B65] mt-1 leading-relaxed bg-[#F7F6F1] p-2.5 rounded-xl border border-[#E4E2DA]/60">
                      {ev.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-[#E4E2DA] bg-[#F7F6F1] flex items-center justify-between gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={() => toggleSupport(selectedReport.id)}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              selectedReport.isSupportedByMe
                ? 'bg-red-600 text-white'
                : 'bg-white border border-[#E4E2DA] text-[#20221D] hover:border-[#263F35]'
            }`}
          >
            <span>
              {selectedReport.isSupportedByMe ? '✓ Anda Telah Mendukung' : 'Saya Terdampak Juga'}
            </span>
            <span className="font-mono">({selectedReport.supportCount})</span>
          </button>

          <a
            href="/track"
            className="py-2.5 px-4 bg-[#263F35] text-white rounded-full text-xs font-semibold hover:bg-[#1d3129] transition-colors"
          >
            Lacak Mandiri
          </a>
        </div>
      </div>
    </div>
  );
};
