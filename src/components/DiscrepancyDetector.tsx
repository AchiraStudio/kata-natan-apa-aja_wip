import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiscrepancyFlag } from '../types';
import { useTitik } from '../context/TitikContext';
import { ChevronRight } from 'lucide-react';

interface Props {
  discrepancies: DiscrepancyFlag[];
  limit?: number;
  showAllLink?: boolean;
}

export const DiscrepancyDetector: React.FC<Props> = ({ 
  discrepancies, 
  limit, 
  showAllLink = true 
}) => {
  const navigate = useNavigate();
  const { setSelectedFacility, facilities } = useTitik();

  const displayedItems = limit ? discrepancies.slice(0, limit) : discrepancies;

  const handleInspect = (disc: DiscrepancyFlag) => {
    const matchedFac = facilities.find(
      f => f.name.toLowerCase().includes(disc.facilityName.toLowerCase()) || 
           disc.facilityName.toLowerCase().includes(f.name.toLowerCase())
    );
    if (matchedFac) {
      setSelectedFacility(matchedFac);
      navigate(`/fasilitas/${matchedFac.id}`);
    } else {
      navigate('/peta');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
        <div>
          <h3 className="font-bold text-base text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            Daftar Proyek dengan Selisih Serapan & Kondisi Lapangan
          </h3>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[11px] font-mono-data text-[#6B7280] dark:text-[#94A3B8]">Audit SIKD vs Temuan Lapangan</span>
            <span className="w-1 h-1 rounded-full bg-[#9CA3AF]"></span>
            <span className="text-[11px] font-mono-data text-[#DC2626] font-semibold">{discrepancies.length} Titik Anomali</span>
          </div>
        </div>

        {showAllLink && (
          <button
            onClick={() => navigate('/analisis')}
            className="text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#38BDF8] flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Lihat Semua ({discrepancies.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayedItems.map(item => (
          <div 
            key={item.id}
            className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] hover:border-[#111827] dark:hover:border-[#0D9488] transition-colors p-5 space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  <span className="font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB]">{item.id}</span>
                  <span>•</span>
                  <span>{item.subdistrict}</span>
                  <span>•</span>
                  <span>{item.sector}</span>
                  <span>•</span>
                  <span className="font-mono-data">Kode: {item.projectCode}</span>
                </div>

                <h4 className="font-bold text-base text-[#111827] dark:text-[#F9FAFB]">
                  {item.title}
                </h4>

                {/* Visual Ratio Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono-data">
                    <span className="text-[#6B7280] dark:text-[#94A3B8]">Dana Cair: <strong className="text-[#111827] dark:text-[#F9FAFB]">{item.realizationPercent}%</strong></span>
                    <span className="text-[#DC2626] dark:text-[#F87171] font-bold">{item.unresolvedReportsCount} Aduan Aktif</span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] dark:bg-[#101622] rounded-full overflow-hidden flex border border-[#E5E7EB] dark:border-[#243042]">
                    <div 
                      style={{ width: `${Math.min(100, item.realizationPercent)}%` }} 
                      className="bg-[#111827] dark:bg-[#0D9488] h-full" 
                    />
                    <div 
                      style={{ width: `${Math.min(100, item.unresolvedReportsCount * 10)}%` }} 
                      className="bg-[#DC2626] h-full" 
                    />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4B5563] dark:text-[#94A3B8] bg-[#F8F9FA] dark:bg-[#101622] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#243042]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                  <span>{item.flagReason}</span>
                </div>
              </div>

              {/* Metrics Comparison Ledger */}
              <div className="flex items-center gap-3 bg-[#F8F9FA] dark:bg-[#101622] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#243042] shrink-0">
                <div className="text-left px-2">
                  <div className="text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] uppercase">Kas Cair</div>
                  <div className="text-lg font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data">
                    {item.realizationPercent}%
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#243042]" />

                <div className="text-left px-2">
                  <div className="text-[10px] font-mono-data text-[#DC2626] dark:text-[#F87171] uppercase">Aduan</div>
                  <div className="text-lg font-extrabold text-[#DC2626] dark:text-[#F87171] font-mono-data">
                    {item.unresolvedReportsCount}
                  </div>
                </div>

                <button
                  onClick={() => handleInspect(item)}
                  className="px-3 py-2 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Periksa
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data font-bold uppercase bg-[#D97706]/10 text-[#D97706] dark:text-[#FBBF24] px-2 py-0.5 rounded">
                  Rekomendasi
                </span>
                <span className="text-[#4B5563] dark:text-[#94A3B8] text-[11px]">{item.auditRecommendation}</span>
              </div>
              <span className="text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] shrink-0">
                SKPD: {item.agencyName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
