import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { 
  ACCOUNTABILITY_FUNNEL, 
  CURRENT_MONTHLY_DIGEST,
  formatRupiahShort 
} from '../data/titikRegionalData';
import { 
  ChevronRight, 
  Search, 
  Plus,
  Compass
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    facilities, 
    setSelectedFacility, 
    reports,
    setIsSearchOpen 
  } = useTitik();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fasilitas?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setIsSearchOpen(true);
    }
  };

  return (
    <div className="landing-page-wrap">
      
      {/* ============================================================== */}
      {/* 1. FULL-SCREEN EDITORIAL HERO SECTION                          */}
      {/* ============================================================== */}
      <section className="landing-hero-section">
        
        {/* Subtle Ambient Radial Glow for Depth */}
        <div className="landing-glow-amber" aria-hidden="true" />
        <div className="landing-glow-teal" aria-hidden="true" />

        {/* Hero Content Container */}
        <div className="landing-hero-container">
          
          <div className="flex-1 flex items-center py-4 lg:py-8">
            <div className="landing-hero-grid">
              
              {/* LEFT COLUMN: CONDENSED EDITORIAL HEADLINE & STAT LEDGER */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 z-10">
                
                {/* Editorial Headline */}
                <div>
                  <h1 className="landing-headline">
                    Lihat masalah.<br />
                    Telusuri anggaran.<br />
                    <span className="text-[#0D9488]">Kawal dampaknya.</span>
                  </h1>
                </div>

                {/* Concise Mission Copy */}
                <p className="landing-description">
                  Setiap fasilitas umum memiliki nomor anggaran dan titik koordinat. Telusuri realisasi APBD di wilayah Jabodetabek, laporkan kerusakan fisik di lingkungan Anda, dan pantau penyelesaian oleh dinas terkait.
                </p>

                {/* High-Impact Stat Ledger */}
                <div className="landing-ledger-box">
                  <div className="landing-ledger-label">
                    TOTAL PAGU APBD TERDATA (SIKD):
                  </div>
                  <div className="landing-ledger-amount">
                    <span className="text-[#D97706] text-2xl sm:text-3xl">Rp</span>
                    <span>20,5 Miliar</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#4B5563]">
                    9 Sektor Layanan · Wilayah Jabodetabek · {facilities.length} Titik Fasilitas
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/peta')}
                    className="px-6 sm:px-7 py-3.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-tactile active:scale-95"
                  >
                    <Compass className="w-4 h-4 text-[#0D9488]" />
                    <span>Jelajahi Peta Spasial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/lapor')}
                    className="px-5 sm:px-6 py-3.5 bg-white hover:bg-[#F4F3EF] text-[#111827] border border-[#E5E4DF] text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-[#DC2626]" />
                    <span>Laporkan Masalah</span>
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: SIMPLE CLEAN SEARCH */}
              <div className="lg:col-span-5 relative z-10 w-full max-w-lg lg:ml-auto">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative flex items-center bg-white rounded-2xl border border-[#E5E4DF] shadow-xs hover:border-[#111827]/40 focus-within:border-[#111827] focus-within:shadow-md p-2 transition-all group">
                    <Search className="w-5 h-5 text-[#9CA3AF] ml-3 shrink-0 group-focus-within:text-[#111827] transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari fasilitas, proyek, atau dinas..."
                      className="w-full px-3 py-3 text-sm sm:text-base text-[#111827] placeholder-[#9CA3AF] bg-transparent border-none outline-none font-medium"
                    />
                    <button 
                      type="submit"
                      className="px-5 sm:px-6 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shrink-0 active:scale-95"
                    >
                      Cari
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          {/* DOCKED HERO FOOTER */}
          <div className="pt-4 pb-1 border-t border-[#E5E4DF]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2 font-mono-data text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
              <span>OBSERVATORIUM RESMI DATA TERBUKA JABODETABEK · APBD TAHUN 2026</span>
            </div>
            <a 
              href="#direktori-fasilitas" 
              className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-all group"
            >
              <span>Eksplorasi direktori fasilitas & anggaran</span>
              <span className="w-5 h-5 rounded-full bg-white border border-[#E5E4DF] flex items-center justify-center text-[10px] group-hover:border-[#111827] group-hover:translate-y-0.5 transition-all shadow-2xs">
                ↓
              </span>
            </a>
          </div>

        </div>
      </section>

      {/* REST OF PAGE CONTENT BELOW FOLD */}
      <div className="space-y-16 pt-16">

        {/* ============================================================== */}
        {/* 2. PUBLIC FACILITY DIRECTORY PREVIEW                          */}
        {/* ============================================================== */}
        <section id="direktori-fasilitas" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-5 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D3E1D1] pb-4">
            <div>
              <div className="text-xs font-mono-data uppercase tracking-wider text-[#6B7280]">
                Profil Fasilitas & Alokasi Pemeliharaan
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
                Fasilitas Publik dalam Pemantauan Warga
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/fasilitas')}
              className="text-xs font-semibold text-[#111827] hover:text-[#0D9488] flex items-center gap-1 self-start sm:self-auto transition-colors"
            >
              <span>Lihat Semua Fasilitas ({facilities.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {facilities.slice(0, 4).map(facility => (
              <div
                key={facility.id}
                onClick={() => {
                  setSelectedFacility(facility);
                  navigate(`/fasilitas/${facility.id}`);
                }}
                className="bg-[#F5FAF3] rounded-xl border border-[#D3E1D1] hover:border-[#111827] p-4 transition-colors cursor-pointer flex flex-col justify-between group shadow-tactile"
              >
                <div className="space-y-3">
                  <div className="relative h-36 rounded-lg overflow-hidden border border-[#D3E1D1] bg-[#E5EFE3]">
                    <img 
                      src={facility.photoUrl} 
                      alt={facility.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold bg-[#F5FAF3]/95 text-[#111827] px-2 py-0.5 rounded border border-[#D3E1D1]">
                        {facility.sector}
                      </span>
                      <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded font-mono-data">
                        {formatRupiahShort(facility.budgetSummary.paguAnggaran)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#0D9488] transition-colors line-clamp-1">
                      {facility.name}
                    </h3>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {facility.subdistrict} • {facility.responsibleAgency}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D3E1D1] flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      facility.condition === 'Baik' ? 'bg-[#0D9488]' : facility.condition === 'Perlu Intervensi Kritis' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                    }`}></span>
                    <span>{facility.condition}</span>
                  </span>
                  <span className="font-mono-data font-semibold text-[#111827]">
                    {facility.activeReportsCount} laporan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. MONTHLY REPORT ("CATATAN BULANAN")                         */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-[#F5FAF3] rounded-xl border border-[#D3E1D1] p-6 sm:p-8 space-y-6 shadow-tactile">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D3E1D1] pb-4">
              <div className="space-y-1">
                <div className="text-xs font-mono-data uppercase tracking-wider text-[#6B7280]">
                  Ringkasan Bulanan • {CURRENT_MONTHLY_DIGEST.monthYear}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  {CURRENT_MONTHLY_DIGEST.headline}
                </h2>
              </div>

              <div className="text-xs text-[#6B7280] font-mono-data self-start sm:self-auto whitespace-nowrap">
                Periode Jan - Okt 2026
              </div>
            </div>

            <p className="text-sm text-[#4B5563] leading-relaxed max-w-4xl">
              {CURRENT_MONTHLY_DIGEST.editorialSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D3E1D1] bg-[#E5EFE3] rounded-xl border border-[#D3E1D1]">
              <div className="p-4 space-y-1">
                <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                  <span>Proyek Selesai & Diverifikasi</span>
                </div>
                <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                  {CURRENT_MONTHLY_DIGEST.newCompletedProjects} Paket
                </div>
                <p className="text-xs text-[#6B7280]">
                  Termasuk perbaikan IGD Puskesmas Sempur dan jalur pedestrian Kebun Raya.
                </p>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                  <span>Sisa Pagu Belum Terikat Kontrak</span>
                </div>
                <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                  Rp 2,87 Miliar
                </div>
                <p className="text-xs text-[#6B7280]">
                  Alokasi APBD yang belum dilelang dan dapat diusulkan untuk perbaikan mendesak.
                </p>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  <span>Proyek dengan Selisih Temuan</span>
                </div>
                <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                  {CURRENT_MONTHLY_DIGEST.activeDiscrepanciesCount} Lokasi
                </div>
                <p className="text-xs text-[#6B7280]">
                  Pencairan kas daerah di atas 50%, tetapi keluhan kerusakan fisik masih berlanjut.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. CASE RESOLUTION STAGES                                     */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-5">
          <div className="border-b border-[#D3E1D1] pb-4">
            <div className="text-xs font-mono-data uppercase tracking-wider text-[#6B7280]">
              Alur Penanganan Laporan
            </div>
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Tahapan Penyelesaian Kasus Warga Jabodetabek
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D3E1D1] bg-[#F5FAF3] rounded-xl border border-[#D3E1D1] shadow-tactile">
            {ACCOUNTABILITY_FUNNEL.map(item => (
              <div 
                key={item.step}
                className="p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-[#6B7280] font-mono-data">
                  <span>TAHAP 0{item.step}</span>
                  <span className="text-[#111827] font-semibold">{item.pct} dari total</span>
                </div>
                
                <div className="text-3xl font-extrabold text-[#111827] font-mono-data pt-1">
                  {item.count}
                </div>

                <div className="font-bold text-sm text-[#111827]">
                  {item.label}
                </div>

                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. 4-TIER BUDGET CLASSIFICATION                               */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-[#F5FAF3] border border-[#D3E1D1] rounded-xl p-6 sm:p-8 space-y-6 shadow-tactile">
            <div className="max-w-3xl space-y-2">
              <div className="text-xs font-mono-data uppercase tracking-wider text-[#6B7280]">
                Struktur Data Keuangan Daerah
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Empat Kategori Anggaran pada Setiap Fasilitas Publik
              </h2>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Selisih antara pagu anggaran dan realisasi kas tidak otomatis menjadi dana bebas. TITIK memisahkan data anggaran ke dalam empat status sesuai Bagan Akun Standar (BAS) Permendagri No. 77/2020:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#E5EFE3] border border-[#D3E1D1] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#111827]"></span>
                  <span>01 • ALOKASI</span>
                </div>
                <h4 className="font-bold text-sm text-[#111827]">1. Pagu Anggaran</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Batas tertinggi anggaran yang disetujui DPRD dan Pemerintah Daerah dalam dokumen APBD tahun berjalan.
                </p>
              </div>

              <div className="p-4 bg-[#E5EFE3] border border-[#D3E1D1] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                  <span>02 • KOMITMEN</span>
                </div>
                <h4 className="font-bold text-sm text-[#111827]">2. Dana Terikat Kontrak</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Nilai anggaran yang sudah tercantum dalam Surat Perjanjian Kerja (SPK) dengan kontraktor pelaksana proyek.
                </p>
              </div>

              <div className="p-4 bg-[#E5EFE3] border border-[#D3E1D1] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                  <span>03 • PENCAIRAN</span>
                </div>
                <h4 className="font-bold text-sm text-[#111827]">3. Realisasi Penyerapan</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Dana yang telah dibayarkan Kas Daerah kepada kontraktor berdasarkan berita acara pemeriksaan kemajuan fisik.
                </p>
              </div>

              <div className="p-4 bg-[#E5EFE3] border border-[#D3E1D1] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#6B7280]"></span>
                  <span>04 • SELISIH PAGU</span>
                </div>
                <h4 className="font-bold text-sm text-[#111827]">4. Sisa Belum Terikat</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Sisa pagu yang belum dikontrakkan. Penggunaan dana ini memerlukan prosedur lelang atau perubahan penjabaran APBD.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
