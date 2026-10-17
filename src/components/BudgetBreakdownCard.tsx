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
    <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
        <div>
          <h4 className="font-bold text-sm sm:text-base text-[#111827] dark:text-[#F9FAFB] tracking-tight">{title}</h4>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>
        <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data self-start sm:self-auto whitespace-nowrap">
          Kesesuaian Data: <strong className="text-[#111827] dark:text-[#F9FAFB]">{budget.linkageConfidence}</strong>
        </div>
      </div>

      {/* Multi-Segment Proportion Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#4B5563] dark:text-[#94A3B8]">
          <span>Total Pagu Disetujui</span>
          <span className="font-bold text-[#111827] dark:text-[#F9FAFB] font-mono-data text-sm">{formatRupiahFull(paguAnggaran)}</span>
        </div>
        
        <div className="w-full h-3 bg-[#F3F4F6] dark:bg-[#1C2638] rounded overflow-hidden flex border border-[#E5E7EB] dark:border-[#243042]">
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
            className="bg-[#E5E7EB] dark:bg-[#334155] h-full transition-all duration-500"
            title={`Sisa Pagu Belum Terikat: ${availablePct}% (${formatRupiahShort(sisaPaguBelumTerikat)})`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#6B7280] dark:text-[#94A3B8] pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            <span>Realisasi Kas ({realizedPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Terikat Kontrak ({contractedPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#64748B]"></span>
            <span>Belum Terikat ({availablePct}% · {formatRupiahFull(sisaPaguBelumTerikat)})</span>
          </div>
        </div>
      </div>

      {/* 4-Tier Daylight Ledger Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-[#F9FAFB]"></span>
              <span>1. Pagu Anggaran</span>
            </span>
            <span className="font-mono-data text-[#111827] dark:text-[#F9FAFB]">100%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] font-mono-data">
            {formatRupiahFull(paguAnggaran)}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono-data bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-0.5 rounded font-semibold text-[#111827] dark:text-[#F9FAFB]">
              DPA-SKPD Resmi
            </span>
            <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data">Perda APBD</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              <span>2. Terikat Kontrak</span>
            </span>
            <span className="font-mono-data text-[#111827] dark:text-[#F9FAFB]">{contractedPct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] font-mono-data">
            {formatRupiahFull(danaTerikatKontrak)}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono-data bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-0.5 rounded font-semibold text-[#D97706]">
              SPK Sah Rekanan
            </span>
            <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data">Ikatan Hukum</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span>3. Realisasi Penyerapan</span>
            </span>
            <span className="font-mono-data text-[#111827] dark:text-[#F9FAFB]">{realizedPct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] font-mono-data">
            {formatRupiahFull(realisasiPenyerapan)}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono-data bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-0.5 rounded font-semibold text-[#0D9488]">
              SP2D Kas Cair
            </span>
            <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data">BAP Fisik</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-1">
          <div className="text-[11px] font-semibold text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] dark:bg-[#64748B]"></span>
              <span>4. Sisa Belum Terikat</span>
            </span>
            <span className="font-mono-data text-[#111827] dark:text-[#F9FAFB]">{availablePct}%</span>
          </div>
          <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] font-mono-data">
            {formatRupiahFull(sisaPaguBelumTerikat)}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono-data bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-0.5 rounded font-semibold text-[#6B7280] dark:text-[#94A3B8]">
              Belum Kontrak
            </span>
            <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data">Sisa Alokasi</span>
          </div>
        </div>
      </div>

      {/* Methodology Visual Note */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] text-[11px]">
        <span className="font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#0D9488]" />
          Ketentuan Kas:
        </span>
        <span className="bg-white dark:bg-[#151D2A] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#243042] text-[#4B5563] dark:text-[#94A3B8]">
          Bukan Kas Bebas
        </span>
        <span className="bg-white dark:bg-[#151D2A] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#243042] text-[#4B5563] dark:text-[#94A3B8]">
          Perlu Prosedur Perubahan APBD
        </span>
        <span className="bg-white dark:bg-[#151D2A] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#243042] text-[#0D9488] font-mono-data font-semibold">
          Format SIKD Sah
        </span>
      </div>

      {/* Source Attribution */}
      <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#94A3B8] pt-1 border-t border-[#E5E7EB] dark:border-[#243042]">
        <span>Sumber: {dataSource}</span>
        <span className="font-mono-data">Diperbarui: {lastUpdated}</span>
      </div>
    </div>
  );
};
