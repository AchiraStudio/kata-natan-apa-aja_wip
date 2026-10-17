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
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div>
          <h3 className="font-bold text-base text-[#111827] tracking-tight">
            Daftar Proyek dengan Selisih Serapan & Kondisi Lapangan
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Proyek yang pencairan anggarannya sudah berjalan tetapi masih memiliki laporan kerusakan aktif dari warga
          </p>
        </div>

        {showAllLink && (
          <button
            onClick={() => navigate('/analisis')}
            className="text-xs font-semibold text-[#111827] hover:text-[#2563EB] flex items-center gap-1 transition-colors shrink-0"
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
            className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#111827] transition-colors p-5 space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  <span className="font-mono-data font-bold text-[#111827]">{item.id}</span>
                  <span>•</span>
                  <span>{item.subdistrict}</span>
                  <span>•</span>
                  <span>{item.sector}</span>
                  <span>•</span>
                  <span className="font-mono-data">Kode: {item.projectCode}</span>
                </div>

                <h4 className="font-bold text-base text-[#111827]">
                  {item.title}
                </h4>

                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {item.flagReason}
                </p>
              </div>

              {/* Metrics Comparison Ledger */}
              <div className="flex items-center gap-4 bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E5E7EB] shrink-0">
                <div className="text-left pr-2">
                  <div className="text-[11px] text-[#6B7280]">Dana Cair</div>
                  <div className="text-lg font-extrabold text-[#111827] font-mono-data">
                    {item.realizationPercent}%
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB]" />

                <div className="text-left pr-2">
                  <div className="text-[11px] text-[#6B7280]">Laporan Aktif</div>
                  <div className="text-lg font-extrabold text-[#DC2626] font-mono-data">
                    {item.unresolvedReportsCount}
                  </div>
                </div>

                <button
                  onClick={() => handleInspect(item)}
                  className="px-3.5 py-2 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Periksa Fasilitas
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-[#111827]">Tindak Lanjut yang Disarankan: </span>
                <span className="text-[#4B5563]">{item.auditRecommendation}</span>
              </div>
              <span className="text-[11px] text-[#6B7280] shrink-0">
                Instansi: {item.agencyName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
