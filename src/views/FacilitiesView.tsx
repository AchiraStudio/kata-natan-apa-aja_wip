import React, { useState } from 'react';
import { useTitik } from '../context/TitikContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  SECTOR_DEFINITIONS, 
  SUBDISTRICTS, 
  formatRupiahShort 
} from '../data/titikRegionalData';
import { SectorType, SubdistrictType, FacilityCondition } from '../types';
import { 
  Building2, 
  MapPin, 
  Search, 
  Bookmark, 
  Filter, 
  ArrowRight,
  ShieldAlert,
  Coins
} from 'lucide-react';

export const FacilitiesView: React.FC = () => {
  const { 
    facilities, 
    savedFacilityIds, 
    toggleSaveFacility, 
    setSelectedFacility 
  } = useTitik();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [sectorFilter, setSectorFilter] = useState<'Semua' | SectorType>(() => {
    const s = searchParams.get('sektor');
    return (s as SectorType) || 'Semua';
  });
  const [subdistrictFilter, setSubdistrictFilter] = useState<'Semua' | SubdistrictType>('Semua');
  const [conditionFilter, setConditionFilter] = useState<'Semua' | FacilityCondition>('Semua');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Sync state whenever URL search parameters change
  React.useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setSearch(qParam);
    }
    const sParam = searchParams.get('sektor');
    if (sParam) {
      setSectorFilter(sParam as SectorType);
    }
  }, [searchParams]);

  const filtered = facilities.filter(fac => {
    if (showSavedOnly && !savedFacilityIds.includes(fac.id)) return false;
    if (sectorFilter !== 'Semua' && fac.sector !== sectorFilter) return false;
    if (subdistrictFilter !== 'Semua' && fac.subdistrict !== subdistrictFilter) return false;
    if (conditionFilter !== 'Semua' && fac.condition !== conditionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return fac.name.toLowerCase().includes(q) || fac.address.toLowerCase().includes(q) || fac.responsibleAgency.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenDetail = (fac: any) => {
    setSelectedFacility(fac);
    navigate(`/fasilitas/${fac.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Editorial Masthead */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-[#E5E7EB]">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Inventaris Sarana Layanan Publik • Jabodetabek
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Direktori Fasilitas Publik & Alokasi Pemeliharaan
          </h1>
          <p className="text-sm text-[#4B5563] max-w-2xl">
            Memuat {facilities.length} fasilitas publik terdata di wilayah Jabodetabek beserta kondisi bangunan, instansi pengelola, dan pagu anggaran tahun berjalan.
          </p>
        </div>

        <button
          onClick={() => setShowSavedOnly(prev => !prev)}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors self-start md:self-auto whitespace-nowrap ${
            showSavedOnly 
              ? 'bg-[#111827] text-white border-[#111827]' 
              : 'bg-[#F8F9FA] text-[#111827] border-[#E5E7EB] hover:bg-[#E5E7EB]'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
          <span>Daftar Pantau ({savedFacilityIds.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-tactile flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:max-w-sm">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama fasilitas, alamat, dinas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:border-[#111827]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Sector */}
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value as any)}
            className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-medium text-[#111827] focus:outline-none"
          >
            <option value="Semua">Semua Sektor (9)</option>
            {SECTOR_DEFINITIONS.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.label}</option>
            ))}
          </select>

          {/* Subdistrict */}
          <select
            value={subdistrictFilter}
            onChange={e => setSubdistrictFilter(e.target.value as any)}
            className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-medium text-[#111827] focus:outline-none"
          >
            <option value="Semua">Semua Wilayah ({SUBDISTRICTS.length})</option>
            {SUBDISTRICTS.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Condition */}
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value as any)}
            className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-medium text-[#111827] focus:outline-none"
          >
            <option value="Semua">Semua Kondisi Fisik</option>
            <option value="Baik">Kondisi: Baik</option>
            <option value="Rusak Ringan">Kondisi: Rusak Ringan</option>
            <option value="Rusak Sedang">Kondisi: Rusak Sedang</option>
            <option value="Perlu Intervensi Kritis">Kondisi: Kritis</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(facility => {
          const isSaved = savedFacilityIds.includes(facility.id);

          return (
            <div
              key={facility.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#111827] p-5 shadow-tactile shadow-tactile-hover transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Photo & Badge */}
                <div 
                  onClick={() => handleOpenDetail(facility)}
                  className="relative h-44 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] cursor-pointer"
                >
                  <img 
                    src={facility.photoUrl} 
                    alt={facility.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold bg-[#111827]/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                      {facility.sector}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#111827] px-2 py-0.5 rounded border border-[#E5E7EB]">
                      {facility.subdistrict}
                    </span>
                    <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded font-mono-data">
                      Pagu: {formatRupiahShort(facility.budgetSummary.paguAnggaran)}
                    </span>
                  </div>
                </div>

                {/* Title & Address */}
                <div 
                  onClick={() => handleOpenDetail(facility)}
                  className="cursor-pointer space-y-1"
                >
                  <h3 className="font-extrabold text-base text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-1">
                    {facility.name}
                  </h3>
                  <div className="text-xs text-[#6B7280] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                    <span className="line-clamp-1">{facility.address}</span>
                  </div>
                </div>

                {/* Metadata Pill Box */}
                <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-xs space-y-1 text-[#4B5563]">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Kondisi Fisik:</span>
                    <span className="font-bold text-[#111827]">{facility.condition}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Kapasitas Layanan:</span>
                    <span className="font-medium text-[#111827]">{facility.serviceCapacity}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Pengelola:</span>
                    <span className="font-medium text-[#111827] truncate max-w-[170px]">{facility.responsibleAgency}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                <button
                  onClick={() => toggleSaveFacility(facility.id)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isSaved ? 'text-[#0D9488] bg-[#F0FDF4]' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                  title={isSaved ? 'Hapus dari daftar pantau' : 'Simpan fasilitas'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="text-[11px]">{isSaved ? 'Tersimpan' : 'Pantau'}</span>
                </button>

                <button
                  onClick={() => handleOpenDetail(facility)}
                  className="px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Lihat Profil</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

