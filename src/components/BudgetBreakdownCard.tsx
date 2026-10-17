import React from 'react';
import { BudgetBreakdown } from '../types';
import { formatRupiahFull, formatRupiahShort } from '../data/titikRegionalData';
import { Info } from 'lucide-react';

interface Props {
  budget: BudgetBreakdown;
  title?: string;
  subtitle?: string;
}

export const BudgetBreakdownCard: React.FC<Props> = ({ 
  budget, 
  title = "Rincian 4 Status Anggaran APBD",
  subtitle = "Pagu disetujui, nilai kontrak berjalan, dana cair, dan sisa pagu belum terikat"
}) => {
  const { paguAnggaran, danaTerikatKontrak, realisasiPenyerapan, sisaPaguBelumTerikat, dataSource, lastUpdated } = budget;

  const contractedPct = Math.min(100, Math.round((danaTerikatKontrak / paguAnggaran) * 100));
  const realizedPct = Math.min(100, Math.round((realisasiPenyerapan / paguAnggaran) * 100));
  const availablePct = Math.max(0, Math.round((sisaPaguBelumTerikat / paguAnggaran) * 100));

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
        <div>
          <h4 className="font-bold text-sm sm:text-base text-[#111827] tracking-tight">{title}</h4>
          <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
        </div>
        <div className="text-[11px] text-[#6B7280] font-mono-data self-start sm:self-auto whitespace-nowrap">
          Kesesuaian Data: <strong className="text-[#111827]">{budget.linkageConfidence}</strong>
        </div>
      </div>

      {/* Multi-Segment Proportion Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#4B5563]">
          <span>Total Pagu Disetujui</span>
          <span className="font-bold text-[#111827] font-mono-data text-sm">{formatRupiahFull(paguAnggaran)}</span>
        </div>
        
        <div className="w-full h-3 bg-[#F3F4F6] rounded overflow-hidden flex border border-[#E5E7EB]">
          <div 
            style={{ width: `${realizedPct}%` }}
            className="bg-[#0D9488] h-full transition-all duration-500"
            title={`Realisasi Kas: ${realizedPct}% (${formatRupiahShort(realisasiPenyerapan)})`}
          />
          <div 
            style={{ width: `${Math.max(0, contractedPct - realizedPct)}%` }}
            className="bg-[#D97706] h-full transition-all duration-500"
            title={`Terikat Kontrak Belum Cair: ${contractedPct - realizedPct}%`}
          />
          <div 
            style={{ width: `${availablePct}%` }}
            className="bg-[#E5E7EB] h-full transition-all duration-500"
            title={`Sisa Pagu Belum Terikat: ${availablePct}% (${formatRupiahShort(sisaPaguBelumTerikat)})`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <span>Realisasi Kas ({realizedPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Terikat Kontrak ({contractedPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]"></span>
            <span>Belum Terikat ({availablePct}%)</span>
          </div>
        </div>
      </div>

      {/* 4-Tier Daylight Ledger Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111827]"></span>
              <span>1. Pagu Anggaran</span>
            </span>
            <span className="font-mono-data text-[#111827]">100%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] font-mono-data">
            {formatRupiahFull(paguAnggaran)}
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Alokasi resmi yang disahkan dalam dokumen APBD Kota Bogor.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              <span>2. Terikat Kontrak</span>
            </span>
            <span className="font-mono-data text-[#111827]">{contractedPct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] font-mono-data">
            {formatRupiahFull(danaTerikatKontrak)}
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Dana yang sudah masuk dalam Surat Perjanjian Kerja (SPK) kontraktor.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span>3. Realisasi Penyerapan</span>
            </span>
            <span className="font-mono-data text-[#111827]">{realizedPct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] font-mono-data">
            {formatRupiahFull(realisasiPenyerapan)}
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Pembayaran yang telah dicairkan Kas Daerah sesuai progres fisik.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]"></span>
              <span>4. Sisa Belum Terikat</span>
            </span>
            <span className="font-mono-data text-[#111827]">{availablePct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] font-mono-data">
            {formatRupiahFull(sisaPaguBelumTerikat)}
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Selisih pagu yang belum dikontrakkan kepada penyedia jasa.
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#4B5563]">
        <Info className="w-4 h-4 text-[#6B7280] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-[#111827]">Catatan Perbendaharaan:</strong> Sisa Pagu Belum Terikat bukan dana tunai bebas. Penggunaan atau pergeseran anggaran ini memerlukan pengadaan baru atau mekanisme perubahan penjabaran APBD.
        </p>
      </div>

      {/* Source Attribution */}
      <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
        <span>Sumber: {dataSource}</span>
        <span className="font-mono-data">Diperbarui: {lastUpdated}</span>
      </div>
    </div>
  );
};
