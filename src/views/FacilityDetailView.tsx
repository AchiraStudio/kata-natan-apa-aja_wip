import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Bookmark, 
  Plus, 
  AlertCircle, 
  Coins, 
  CheckCircle2, 
  ThumbsUp,
  ShieldCheck 
} from 'lucide-react';
import { formatRupiahShort } from '../data/titikRegionalData';

export const FacilityDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    facilities, 
    budgetProjects, 
    reports, 
    savedFacilityIds, 
    toggleSaveFacility, 
    setSelectedReport 
  } = useTitik();

  const facility = facilities.find(f => f.id === id);

  if (!facility) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#111827]">Fasilitas Tidak Ditemukan</h2>
        <p className="text-xs text-[#6B7280]">
          ID Fasilitas "{id}" tidak terdaftar dalam basis data simulasi SIKD Kota Bogor.
        </p>
        <button
          onClick={() => navigate('/fasilitas')}
          className="px-4 py-2 bg-[#111827] text-white text-xs font-semibold rounded-lg"
        >
          Kembali ke Direktori Fasilitas
        </button>
      </div>
    );
  }

  const isSaved = savedFacilityIds.includes(facility.id);

  // Matched projects
  const linkedProjects = budgetProjects.filter(p => p.facilityId === facility.id);

  // Matched reports
  const linkedReports = reports.filter(r => r.facilityId === facility.id || r.facilityName === facility.name);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button & Action Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSaveFacility(facility.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isSaved 
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#0D9488]' 
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Dipantau' : 'Pantau Fasilitas'}</span>
          </button>

          <button
            onClick={() => navigate(`/lapor?facilityId=${facility.id}`)}
            className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#0D9488]" />
            <span>Laporkan Masalah</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Cover */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-tactile">
        <div className="relative h-64 sm:h-80 w-full bg-[#F3F4F6]">
          <img 
            src={facility.photoUrl} 
            alt={facility.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded">
                {facility.sector}
              </span>
              <span className="text-xs font-semibold bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded">
                Kecamatan {facility.subdistrict}
              </span>
              <span className="text-xs font-mono-data bg-[#111827] px-2.5 py-0.5 rounded border border-white/20">
                ID: {facility.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {facility.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-white/90">
              <MapPin className="w-4 h-4 shrink-0 text-[#93C5FD]" />
              <span>{facility.address}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:p-6 bg-[#F8F9FA] border-t border-[#E5E7EB]">
          <div>
            <div className="text-[10px] text-[#6B7280] font-bold uppercase">Kondisi Fisik</div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] mt-0.5">
              {facility.condition}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#6B7280] font-bold uppercase">Kapasitas Pelayanan</div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] mt-0.5">
              {facility.serviceCapacity}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#6B7280] font-bold uppercase">Instansi Pengelola</div>
            <div className="text-xs sm:text-sm font-bold text-[#111827] mt-0.5 truncate">
              {facility.responsibleAgency}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#6B7280] font-bold uppercase">Aduan Komunitas</div>
            <div className="text-sm sm:text-base font-extrabold text-[#DC2626] font-mono-data mt-0.5">
              {facility.activeReportsCount} Aktif / {facility.resolvedReportsCount} Tuntas
            </div>
          </div>
        </div>
      </div>

      {/* 4-Tier Budget Breakdown Card for this Facility */}
      <BudgetBreakdownCard
        budget={facility.budgetSummary}
        title={`Pembedahan Anggaran Pemeliharaan: ${facility.name}`}
        subtitle={`Rincian alokasi APBD Murni TA 2026 yang terikat pada koordinat fasilitas ini`}
      />

      {/* Active Projects and Citizen Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Related APBD Projects */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="font-extrabold text-base text-[#111827] flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D97706]" />
              Paket Pekerjaan APBD ({linkedProjects.length})
            </h3>
            <span className="text-xs text-[#6B7280]">SIKD Kota Bogor</span>
          </div>

          {linkedProjects.length === 0 ? (
            <div className="p-4 bg-[#F8F9FA] rounded-xl text-xs text-[#6B7280] text-center">
              Tidak ada paket lelang konstruksi besar aktif. Pemeliharaan berjalan dengan pos swakelola rutin dinas.
            </div>
          ) : (
            <div className="space-y-3">
              {linkedProjects.map(prj => (
                <div key={prj.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-data font-bold text-[#D97706]">{prj.code}</span>
                    <span className="text-[11px] font-semibold text-[#0D9488] bg-[#F0FDF4] px-2 py-0.5 rounded">
                      Progres: {prj.progressPercent}%
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#111827]">{prj.title}</h4>
                  <p className="text-xs text-[#4B5563] leading-relaxed">{prj.description}</p>

                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Vendor: <strong>{prj.contractorName}</strong></span>
                    <span className="font-mono-data font-bold text-[#111827]">
                      {formatRupiahShort(prj.budget.paguAnggaran)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Linked Citizen Reports */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-tactile space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="font-extrabold text-base text-[#111827] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
              Aduan Warga di Fasilitas Ini ({linkedReports.length})
            </h3>
            <span className="text-xs text-[#6B7280]">Geotag Komunitas</span>
          </div>

          {linkedReports.length === 0 ? (
            <div className="p-6 bg-[#F8F9FA] rounded-xl text-xs text-[#6B7280] text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-[#0D9488] mx-auto" />
              <div>Belum ada aduan warga aktif untuk fasilitas ini.</div>
              <button
                onClick={() => navigate(`/lapor?facilityId=${facility.id}`)}
                className="px-3 py-1.5 bg-[#111827] text-white rounded text-xs font-semibold mt-1"
              >
                + Laporkan Masalah Baru
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedReports.map(rep => (
                <div 
                  key={rep.id}
                  onClick={() => {
                    setSelectedReport(rep);
                    navigate(`/lapor/${rep.id}`);
                  }}
                  className="p-3.5 bg-[#F8F9FA] hover:bg-white hover:border-[#DC2626] border border-[#E5E7EB] rounded-xl transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-data font-bold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded">
                      {rep.id}
                    </span>
                    <span className="text-[10px] text-[#0D9488] font-semibold">
                      Langkah {rep.currentStep}/6
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors line-clamp-1">
                    {rep.title}
                  </h4>

                  <p className="text-xs text-[#4B5563] line-clamp-2">
                    {rep.description}
                  </p>

                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>@{rep.reporterHandle} • {rep.reportedAt}</span>
                    <span className="font-bold text-[#111827] flex items-center gap-1 font-mono-data">
                      <ThumbsUp className="w-3 h-3 text-[#D97706]" />
                      {rep.priorityVotes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

