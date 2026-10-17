import React, { useState, useMemo } from 'react';
import { useTitik } from '../context/TitikContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  MapPin, 
  Building2, 
  Coins, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatRupiahShort } from '../data/titikRegionalData';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    facilities, 
    budgetProjects, 
    reports,
    setSelectedFacility,
    setSelectedReport,
    setSelectedProject
  } = useTitik();

  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const matchedFacilities = facilities.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.address.toLowerCase().includes(q) || 
      f.sector.toLowerCase().includes(q) ||
      f.subdistrict.toLowerCase().includes(q)
    );

    const matchedProjects = budgetProjects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.contractorName.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );

    const matchedReports = reports.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.reporterHandle.toLowerCase().includes(q)
    );

    return {
      facilities: matchedFacilities,
      projects: matchedProjects,
      reports: matchedReports,
      total: matchedFacilities.length + matchedProjects.length + matchedReports.length
    };
  }, [query, facilities, budgetProjects, reports]);

  if (!isSearchOpen) return null;

  const handleSelectFacility = (fac: any) => {
    setSelectedFacility(fac);
    setSelectedReport(null);
    setSelectedProject(null);
    setIsSearchOpen(false);
    navigate(`/fasilitas/${fac.id}`);
  };

  const handleSelectReport = (rep: any) => {
    setSelectedReport(rep);
    setSelectedFacility(null);
    setSelectedProject(null);
    setIsSearchOpen(false);
    navigate(`/lapor/${rep.id}`);
  };

  const handleSelectProject = (prj: any) => {
    setSelectedProject(prj);
    setSelectedFacility(null);
    setSelectedReport(null);
    setIsSearchOpen(false);
    navigate('/anggaran');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20">
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-2xl max-w-2xl w-full overflow-hidden transition-all flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#243042] flex items-center gap-3 bg-[#F8F9FA] dark:bg-[#0B0F17]">
          <Search className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Cari fasilitas, proyek APBD, kode anggaran, atau kasus warga..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-[#111827] dark:text-[#F9FAFB] focus:outline-none placeholder-[#9CA3AF] dark:placeholder-[#64748B]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#1C2638] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {!results && (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1C2638] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">Pencarian Terpadu TITIK.</div>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] max-w-sm mx-auto">
                Ketik nama sekolah, saluran air, nomor kontrak APBD, atau kata kunci aduan warga. Tekan <kbd className="px-1.5 py-0.5 bg-[#F3F4F6] dark:bg-[#1C2638] border border-[#E5E7EB] dark:border-[#243042] rounded text-[10px] text-[#111827] dark:text-[#F9FAFB]">Esc</kbd> untuk menutup.
              </p>
            </div>
          )}

          {results && results.total === 0 && (
            <div className="py-8 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Tidak ditemukan hasil untuk pencarian "<strong className="text-[#111827] dark:text-[#F9FAFB]">{query}</strong>". Coba kata kunci lain atau pilih kecamatan di halaman Peta.
            </div>
          )}

          {results && results.total > 0 && (
            <div className="space-y-4">
              
              {/* Facilities Results */}
              {results.facilities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Fasilitas Publik ({results.facilities.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.facilities.map(fac => (
                      <div
                        key={fac.id}
                        onClick={() => handleSelectFacility(fac)}
                        className="p-3 bg-[#F8F9FA] dark:bg-[#101622] hover:bg-white dark:hover:bg-[#1C2638] hover:border-[#2563EB] dark:hover:border-[#2563EB] border border-[#E5E7EB] dark:border-[#243042] rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#2563EB]">
                            {fac.name}
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                            {fac.sector} • {fac.subdistrict} • Pagu: {formatRupiahShort(fac.budgetSummary.paguAnggaran)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {results.projects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Proyek APBD ({results.projects.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.projects.map(prj => (
                      <div
                        key={prj.id}
                        onClick={() => handleSelectProject(prj)}
                        className="p-3 bg-[#F8F9FA] dark:bg-[#101622] hover:bg-white dark:hover:bg-[#1C2638] hover:border-[#D97706] dark:hover:border-[#D97706] border border-[#E5E7EB] dark:border-[#243042] rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#D97706]">
                            {prj.title}
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                            Kode: <span className="font-mono-data font-semibold">{prj.code}</span> • Progres: {prj.progressPercent}%
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Results */}
              {results.reports.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Kasus Warga ({results.reports.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.reports.map(rep => (
                      <div
                        key={rep.id}
                        onClick={() => handleSelectReport(rep)}
                        className="p-3 bg-[#F8F9FA] dark:bg-[#101622] hover:bg-white dark:hover:bg-[#1C2638] hover:border-[#DC2626] dark:hover:border-[#DC2626] border border-[#E5E7EB] dark:border-[#243042] rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#DC2626]">
                            {rep.title}
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                            ID: <span className="font-mono-data">{rep.id}</span> • {rep.subdistrict} • Langkah {rep.currentStep}/6
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 bg-[#F8F9FA] dark:bg-[#0B0F17] border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
          <span>Gunakan panah untuk navigasi atau klik item langsung</span>
          <span>Tekan <kbd className="px-1 py-0.5 bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] rounded text-[#111827] dark:text-[#F9FAFB]">Esc</kbd> untuk keluar</span>
        </div>
      </div>
    </div>
  );
};

