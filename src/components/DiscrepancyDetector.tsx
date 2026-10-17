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
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
            Proyek yang pencairan anggarannya sudah berjalan tetapi masih memiliki laporan kerusakan aktif dari warga
          </p>
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

                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  {item.flagReason}
                </p>
              </div>

              {/* Metrics Comparison Ledger */}
              <div className="flex items-center gap-4 bg-[#F8F9FA] dark:bg-[#101622] p-3.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042] shrink-0">
                <div className="text-left pr-2">
                  <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">Dana Cair</div>
                  <div className="text-lg font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data">
                    {item.realizationPercent}%
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#243042]" />

                <div className="text-left pr-2">
                  <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">Laporan Aktif</div>
                  <div className="text-lg font-extrabold text-[#DC2626] dark:text-[#F87171] font-mono-data">
                    {item.unresolvedReportsCount}
                  </div>
                </div>

                <button
                  onClick={() => handleInspect(item)}
                  className="px-3.5 py-2 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Periksa Fasilitas
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">Tindak Lanjut yang Disarankan: </span>
                <span className="text-[#4B5563] dark:text-[#94A3B8]">{item.auditRecommendation}</span>
              </div>
              <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] shrink-0">
                Instansi: {item.agencyName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
