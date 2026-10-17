import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { 
  ACCOUNTABILITY_FUNNEL, 
  CURRENT_MONTHLY_DIGEST,
  formatRupiahShort,
  formatRupiahFull
} from '../data/titikRegionalData';
import { SectorType } from '../types';
import { 
  ChevronRight, 
  Search, 
  Plus,
  Compass,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Coins,
  FileCheck2,
  Building2
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    facilities, 
    setSelectedFacility, 
    setIsSearchOpen 
  } = useTitik();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<'Semua' | SectorType>('Semua');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fasilitas?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setIsSearchOpen(true);
    }
  };

  // Filter facilities for showcase
  const showcaseFacilities = facilities.filter(f => {
    if (selectedSectorFilter === 'Semua') return true;
    return f.sector === selectedSectorFilter;
  }).slice(0, 4);

  const previewSectors: Array<'Semua' | SectorType> = [
    'Semua',
    'Pendidikan',
    'Kesehatan',
    'Lingkungan & Drainase',
    'Infrastruktur Jalan'
  ];

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
          
          <div className="flex-1 flex items-center py-6 lg:py-10">
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
                    TOTAL PAGU APBD TERDATA (SIKD KEMENDAGRI):
                  </div>
                  <div className="landing-ledger-amount">
                    <span className="text-[#D97706] text-2xl sm:text-3xl">Rp</span>
                    <span>20,55 Miliar</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#4B5563] flex flex-wrap items-center gap-2">
                    <span>9 Sektor Layanan</span>
                    <span>•</span>
                    <span>Wilayah Jabodetabek</span>
                    <span>•</span>
                    <span className="font-semibold text-[#111827]">{facilities.length} Titik Fasilitas Terpetakan</span>
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
                    className="px-5 sm:px-6 py-3.5 bg-white hover:bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-[#DC2626]" />
                    <span>Laporkan Masalah</span>
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: SEARCH CONSOLE & QUICK TELEMETRY */}
              <div className="lg:col-span-5 relative z-10 w-full max-w-lg lg:ml-auto space-y-4">
                
                {/* Search Box */}
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative flex items-center bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-[#111827]/40 focus-within:border-[#111827] focus-within:shadow-md p-2 transition-all group">
                    <Search className="w-5 h-5 text-[#9CA3AF] ml-3 shrink-0 group-focus-within:text-[#111827] transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari fasilitas, dinas, atau kata kunci aduan..."
                      className="w-full px-3 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] bg-transparent border-none outline-none font-medium"
                    />
                    <button 
                      type="submit" 
                      className="px-5 sm:px-6 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shrink-0 active:scale-95"
                    >
                      Cari
                    </button>
                  </div>
                </form>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-[#6B7280]">
                  <span className="font-mono-data text-[11px] uppercase tracking-wider text-[#9CA3AF]">Coba:</span>
                  {[
                    { label: 'SDN Menteng 01', query: 'SDN Menteng' },
                    { label: 'Puskesmas Sempur', query: 'Puskesmas' },
                    { label: 'Drainase Pajajaran', query: 'Drainase' },
                    { label: 'Trotoar Kebun Raya', query: 'Trotoar' }
                  ].map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => navigate(`/fasilitas?q=${encodeURIComponent(chip.query)}`)}
                      className="px-2.5 py-1 bg-white hover:bg-[#111827] hover:text-white text-[#4B5563] border border-[#E5E7EB] rounded-lg text-xs font-medium transition-all shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Hero Telemetry Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E5E7EB] p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2 font-mono-data text-[#111827] font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                      <span>Transparansi SIKD & Kemendagri</span>
                    </div>
                    <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#0D9488] font-bold">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-data">
                    <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60">
                      <div className="text-[10px] text-[#6B7280]">SERAPAN</div>
                      <div className="text-sm font-extrabold text-[#111827] mt-0.5">78,4%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60">
                      <div className="text-[10px] text-[#6B7280]">TERIKAT SPK</div>
                      <div className="text-sm font-extrabold text-[#0D9488] mt-0.5">86,1%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60">
                      <div className="text-[10px] text-[#6B7280]">ANOMALI</div>
                      <div className="text-sm font-extrabold text-[#DC2626] mt-0.5">3 Titik</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>



        </div>
      </section>

      {/* REST OF PAGE CONTENT BELOW FOLD */}
      <div className="space-y-16 sm:space-y-20 pt-16 sm:pt-20">

        {/* ============================================================== */}
        {/* 2. PUBLIC FACILITY DIRECTORY SHOWCASE                          */}
        {/* ============================================================== */}
        <section id="direktori-fasilitas" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 scroll-mt-24">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#6B7280] font-semibold">
                <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Profil Fasilitas & Alokasi Pemeliharaan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
                Fasilitas Publik dalam Pemantauan Warga
              </h2>
            </div>

            {/* Quick Sector Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {previewSectors.map(sec => {
                const isSelected = selectedSectorFilter === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSectorFilter(sec)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                      isSelected 
                        ? 'bg-[#111827] text-white font-semibold shadow-xs' 
                        : 'bg-white hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => navigate('/fasilitas')}
                className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 ml-2 transition-colors py-1.5"
              >
                <span>Semua ({facilities.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4 TACTILE SHOWCASE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {showcaseFacilities.map(facility => {
              const contractPct = Math.min(100, Math.round((facility.budgetSummary.danaTerikatKontrak / facility.budgetSummary.paguAnggaran) * 100));

              return (
                <div
                  key={facility.id}
                  onClick={() => {
                    setSelectedFacility(facility);
                    navigate(`/fasilitas/${facility.id}`);
                  }}
                  className="landing-facility-card group"
                >
                  <div className="space-y-3">
                    {/* Facility Image with Daylight Badges */}
                    <div className="relative h-40 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                      <img 
                        src={facility.photoUrl} 
                        alt={facility.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-[#111827] px-2.5 py-1 rounded-lg border border-[#E5E7EB] shadow-2xs">
                          {facility.sector}
                        </span>

                        <span className="text-[10px] font-mono-data font-bold bg-[#111827] text-white px-2.5 py-1 rounded-lg shadow-xs">
                          {formatRupiahShort(facility.budgetSummary.paguAnggaran)}
                        </span>
                      </div>

                      {/* Bottom Subdistrict Pill */}
                      <div className="absolute bottom-2 left-2.5">
                        <span className="text-[10px] font-medium bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                          {facility.subdistrict}
                        </span>
                      </div>
                    </div>

                    {/* Facility Identity */}
                    <div>
                      <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#0D9488] transition-colors line-clamp-1 leading-snug">
                        {facility.name}
                      </h3>
                      <div className="text-xs text-[#6B7280] mt-1 line-clamp-1">
                        {facility.responsibleAgency}
                      </div>
                    </div>

                    {/* Budget Execution Progress Bar */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono-data text-[#4B5563]">
                        <span>Terikat Kontrak</span>
                        <span className="font-semibold text-[#111827]">{contractPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E5E7EB]/60">
                        <div 
                          className="h-full bg-[#0D9488] rounded-full transition-all duration-500" 
                          style={{ width: `${contractPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="text-[#4B5563] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        facility.condition === 'Baik' 
                          ? 'bg-[#0D9488]' 
                          : facility.condition === 'Perlu Intervensi Kritis' 
                            ? 'bg-[#DC2626]' 
                            : 'bg-[#D97706]'
                      }`} />
                      <span className="font-medium text-[11px]">{facility.condition}</span>
                    </span>

                    <span className="font-mono-data text-[11px] font-semibold text-[#111827] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>{facility.activeReportsCount} aduan</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. MONTHLY EDITORIAL DIGEST ("CATATAN OBSERVATORIUM")          */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="landing-card space-y-8">
            
            {/* Editorial Masthead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-mono-data font-bold uppercase tracking-wider">
                    Catatan Observatorium • {CURRENT_MONTHLY_DIGEST.monthYear}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">•</span>
                  <span className="text-xs font-mono-data text-[#6B7280]">
                    Audit Lapangan & SIKD
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
                  {CURRENT_MONTHLY_DIGEST.headline}
                </h2>
              </div>

              <div className="text-xs text-[#6B7280] font-mono-data self-start sm:self-auto whitespace-nowrap bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                Periode Jan - Okt 2026
              </div>
            </div>

            {/* Editorial Quote / Lead */}
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-4xl border-l-2 border-[#0D9488] pl-4">
              {CURRENT_MONTHLY_DIGEST.editorialSummary}
            </p>

            {/* 3 High-Impact Telemetry Metric Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tile 1: Selesai */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    <span>Verifikasi Lapangan</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#0D9488] font-bold">100% SELESAI</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono-data pt-1">
                  {CURRENT_MONTHLY_DIGEST.newCompletedProjects} Paket
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Termasuk perbaikan IGD Puskesmas Sempur dan jalur pedestrian Kebun Raya yang rampung diverifikasi warga.
                </p>
              </div>

              {/* Tile 2: Sisa Pagu */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>Potensi Alokasi</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#D97706] font-bold">BELUM DILELANG</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono-data pt-1">
                  Rp 2,87 Miliar
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Alokasi APBD yang belum dilelang dan dapat diusulkan warga melalui musrenbang untuk perbaikan darurat.
                </p>
              </div>

              {/* Tile 3: Selisih Temuan */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span>Audit Prioritas</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#DC2626] font-bold">DEVINASI FISIK</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#DC2626] font-mono-data pt-1">
                  {CURRENT_MONTHLY_DIGEST.activeDiscrepanciesCount} Lokasi
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Pencairan kas daerah di atas 50%, namun keluhan fisik warga masih aktif di SDN Menteng & Drainase Pajajaran.
                </p>
              </div>

            </div>

            {/* Bottom Insight Footer */}
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#6B7280]">
                Sumber Data: Sinkronisasi SIKD Kemendagri & Portal Satu Data Kota Bogor 2026.
              </span>
              <button
                type="button"
                onClick={() => navigate('/analisis')}
                className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 transition-colors"
              >
                <span>Buka Radar Selisih Serapan Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. CONNECTED CASE RESOLUTION PIPELINE                          */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6">
          
          <div className="border-b border-[#E5E7EB] pb-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#6B7280] font-semibold">
              <FileCheck2 className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Akuntabilitas & Alur Penanganan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
              Tahapan Penyelesaian Kasus Warga Jabodetabek
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-2xl">
              Alur 4 tahap transparan dari pengunggahan bukti lapangan berkoordinat hingga verifikasi tuntas perbaikan fisik.
            </p>
          </div>

          {/* Connected Stepper: Horizontal on desktop, Vertical on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {ACCOUNTABILITY_FUNNEL.map((item, idx) => (
              <div 
                key={item.step}
                className="landing-step-node"
              >
                {/* Node Step Header */}
                <div className="flex items-center justify-between text-xs text-[#6B7280] font-mono-data pb-2 border-b border-[#E5E7EB]">
                  <span className="font-bold text-[#0D9488]">TAHAP 0{item.step}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#111827] font-semibold text-[10px]">
                    {item.pct} dari total
                  </span>
                </div>
                
                {/* Number Callout */}
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] font-mono-data pt-3">
                  {item.count}
                </div>

                {/* Title */}
                <div className="font-bold text-sm text-[#111827] mt-1 flex items-center gap-1.5">
                  {idx === 0 && <Clock className="w-4 h-4 text-[#6B7280]" />}
                  {idx === 1 && <Search className="w-4 h-4 text-[#D97706]" />}
                  {idx === 2 && <Building2 className="w-4 h-4 text-[#2563EB]" />}
                  {idx === 3 && <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />}
                  <span>{item.label}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#4B5563] leading-relaxed mt-2">
                  {item.description}
                </p>

                {/* Visual Progress Bar */}
                <div className="mt-4 pt-3 border-t border-[#E5E7EB]/60">
                  <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#111827] rounded-full" 
                      style={{ width: item.pct }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. PROPORTIONAL FISCAL STACK & 4-TIER BUDGET CLASSIFICATION    */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="landing-card space-y-8">
            
            {/* Header */}
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#6B7280] font-semibold">
                <Coins className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Metodologi Standar SIKD & Akuntansi Publik</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Empat Kategori Anggaran pada Setiap Fasilitas Publik
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Selisih antara pagu anggaran dan realisasi kas tidak otomatis menjadi dana bebas. TITIK memisahkan data anggaran ke dalam empat status resmi sesuai Bagan Akun Standar (BAS) Permendagri No. 77/2020:
              </p>
            </div>

            {/* Proportional Fiscal Stack Gauge */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#111827]">
                  Distribusi Total Pagu Observatorium (Rp 20,55 Miliar)
                </span>
                <span className="text-[#6B7280] font-mono-data text-[11px]">
                  Berdasarkan SPK Kontrak & Kas Daerah 2026
                </span>
              </div>

              {/* Stacked Bar */}
              <div className="w-full h-4 sm:h-5 bg-[#E5E7EB] rounded-xl overflow-hidden flex shadow-inner">
                <div 
                  className="bg-[#0D9488] h-full" 
                  style={{ width: '78.4%' }} 
                  title="Realisasi Penyerapan: 78.4%"
                />
                <div 
                  className="bg-[#D97706] h-full" 
                  style={{ width: '7.7%' }} 
                  title="Dana Terikat Kontrak: 7.7%"
                />
                <div 
                  className="bg-[#6B7280] h-full" 
                  style={{ width: '13.9%' }} 
                  title="Sisa Pagu Belum Terikat: 13.9%"
                />
              </div>

              {/* Stack Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0D9488]" />
                  <span className="text-[#4B5563]">Realisasi Kas (78.4% • Rp 16,12 M)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                  <span className="text-[#4B5563]">Komitmen SPK (7.7% • Rp 1,56 M)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6B7280]" />
                  <span className="text-[#4B5563]">Sisa Belum Terikat (13.9% • Rp 2,87 M)</span>
                </div>
              </div>
            </div>

            {/* 4 Distinct Tier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tier 1 */}
              <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-2.5 hover:border-[#111827] transition-colors shadow-xs">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#6B7280]">
                  <span className="font-bold text-[#111827]">01 • ALOKASI</span>
                  <span className="w-2 h-2 rounded-full bg-[#111827]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827]">1. Pagu Anggaran</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Batas tertinggi anggaran yang disetujui DPRD dan Pemerintah Daerah dalam dokumen APBD tahun berjalan.
                </p>
                <div className="pt-2 border-t border-[#E5E7EB] text-[10px] font-mono-data text-[#6B7280]">
                  DPA-SKPD Resmi Pemda
                </div>
              </div>

              {/* Tier 2 */}
              <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-2.5 hover:border-[#D97706] transition-colors shadow-xs">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#D97706]">
                  <span className="font-bold">02 • KOMITMEN</span>
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827]">2. Dana Terikat Kontrak</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Nilai anggaran yang sudah tercantum dalam Surat Perjanjian Kerja (SPK) dengan kontraktor pelaksana proyek.
                </p>
                <div className="pt-2 border-t border-[#E5E7EB] text-[10px] font-mono-data text-[#D97706]">
                  SPK Mengikat Secara Hukum
                </div>
              </div>

              {/* Tier 3 */}
              <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-2.5 hover:border-[#0D9488] transition-colors shadow-xs">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#0D9488]">
                  <span className="font-bold">03 • PENCAIRAN</span>
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827]">3. Realisasi Penyerapan</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Dana yang telah dibayarkan Kas Daerah kepada kontraktor berdasarkan berita acara pemeriksaan kemajuan fisik.
                </p>
                <div className="pt-2 border-t border-[#E5E7EB] text-[10px] font-mono-data text-[#0D9488]">
                  SP2D Sah Kas Daerah
                </div>
              </div>

              {/* Tier 4 */}
              <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-2.5 hover:border-[#6B7280] transition-colors shadow-xs">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#6B7280]">
                  <span className="font-bold">04 • SELISIH PAGU</span>
                  <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827]">4. Sisa Belum Terikat</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Sisa pagu yang belum dikontrakkan. Penggunaan dana ini memerlukan prosedur lelang atau perubahan penjabaran APBD.
                </p>
                <div className="pt-2 border-t border-[#E5E7EB] text-[10px] font-mono-data text-[#6B7280]">
                  Bukan Dana Bebas
                </div>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
