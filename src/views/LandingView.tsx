import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { 
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
  Building2,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  Link as LinkIcon,
  Info
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    facilities, 
    reports,
    discrepancies,
    setSelectedFacility, 
    setIsSearchOpen,
    syncStatus,
    lastSyncedAt,
    isOfflineSimulated,
    latestTelemetryEvent,
    triggerManualSync,
    toggleOfflineSimulation,
    simulateIncomingEvent,
    clearLatestEvent
  } = useTitik();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<'Semua' | SectorType>('Semua');

  // Dynamic Proportional Fiscal Calculations
  const totalPagu = facilities.reduce((sum, f) => sum + f.budgetSummary.paguAnggaran, 0);
  const totalKontrak = facilities.reduce((sum, f) => sum + f.budgetSummary.danaTerikatKontrak, 0);
  const totalRealisasi = facilities.reduce((sum, f) => sum + f.budgetSummary.realisasiPenyerapan, 0);
  const totalSisa = facilities.reduce((sum, f) => sum + f.budgetSummary.sisaPaguBelumTerikat, 0);

  const pctRealisasi = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 78.4;
  const pctKontrak = totalPagu > 0 ? (totalKontrak / totalPagu) * 100 : 7.7;
  const pctSisa = totalPagu > 0 ? (totalSisa / totalPagu) * 100 : 13.9;

  // Dynamic Accountability Funnel Metrics
  const baseReportsDelta = reports.length - 3;
  const funnelStage1 = 120 + Math.max(0, baseReportsDelta);
  const funnelStage2 = Math.round(funnelStage1 * 0.70);
  const funnelStage3 = Math.round(funnelStage1 * 0.50);
  const funnelStage4 = Math.round(funnelStage1 * 0.27);

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
                    className="px-6 sm:px-7 py-3.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-tactile active:scale-95"
                  >
                    <Compass className="w-4 h-4 text-[#0D9488] dark:text-white" />
                    <span>Jelajahi Peta Spasial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/lapor')}
                    className="px-5 sm:px-6 py-3.5 bg-white dark:bg-[#151D2A] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 active:scale-95"
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
                  <div className="relative flex items-center bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#111827]/40 dark:hover:border-[#0D9488]/40 focus-within:border-[#111827] dark:focus-within:border-[#0D9488] focus-within:shadow-md p-2 transition-all group">
                    <Search className="w-5 h-5 text-[#9CA3AF] dark:text-[#64748B] ml-3 shrink-0 group-focus-within:text-[#111827] dark:group-focus-within:text-[#0D9488] transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari fasilitas, dinas, atau kata kunci aduan..."
                      className="w-full px-3 py-3 text-sm text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] dark:placeholder-[#64748B] bg-transparent border-none outline-none font-medium"
                    />
                    <button 
                      type="submit" 
                      className="px-5 sm:px-6 py-3 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shrink-0 active:scale-95"
                    >
                      Cari
                    </button>
                  </div>
                </form>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  <span className="font-mono-data text-[11px] uppercase tracking-wider text-[#9CA3AF] dark:text-[#64748B]">Coba:</span>
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
                      className="px-2.5 py-1 bg-white dark:bg-[#151D2A] hover:bg-[#111827] dark:hover:bg-[#0D9488] hover:text-white dark:hover:text-white text-[#4B5563] dark:text-[#CBD5E1] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-xs font-medium transition-all shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Hero Telemetry Card */}
                <div className="bg-white/80 dark:bg-[#151D2A]/80 backdrop-blur-md rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E7EB] dark:border-[#243042]">
                    <div className="flex items-center gap-2 font-mono-data text-[#111827] dark:text-[#F9FAFB] font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                      <span>Transparansi SIKD & Kemendagri</span>
                    </div>
                    <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-[#0D9488]/10 dark:bg-[#0D9488]/20 text-[#0D9488] dark:text-[#2DD4BF] font-bold">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-data">
                    <div className="p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#101622] border border-[#E5E7EB]/60 dark:border-[#243042]">
                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">SERAPAN</div>
                      <div className="text-sm font-extrabold text-[#111827] dark:text-[#F9FAFB] mt-0.5">
                        {pctRealisasi.toFixed(1).replace('.', ',')}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#101622] border border-[#E5E7EB]/60 dark:border-[#243042]">
                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">TERIKAT SPK</div>
                      <div className="text-sm font-extrabold text-[#0D9488] dark:text-[#2DD4BF] mt-0.5">
                        {(pctRealisasi + pctKontrak).toFixed(1).replace('.', ',')}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#101622] border border-[#E5E7EB]/60 dark:border-[#243042]">
                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">ANOMALI</div>
                      <div className="text-sm font-extrabold text-[#DC2626] dark:text-[#F87171] mt-0.5">
                        {discrepancies.length} Titik
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* REALTIME & OFFLINE TELEMETRY CONTROL BAR                       */}
      {/* ============================================================== */}
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 -mt-6 sm:-mt-8 relative z-20">
        <div className="landing-telemetry-bar">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pill */}
            <div className={`landing-telemetry-live-pill ${
              syncStatus === 'LIVE' ? 'landing-telemetry-live-pill-live' :
              syncStatus === 'SYNCING' ? 'landing-telemetry-live-pill-syncing' :
              syncStatus === 'OFFLINE' ? 'landing-telemetry-live-pill-offline' :
              'landing-telemetry-live-pill-cached'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                syncStatus === 'LIVE' ? 'bg-[#0D9488] animate-pulse' :
                syncStatus === 'SYNCING' ? 'bg-[#D97706] animate-ping' :
                syncStatus === 'OFFLINE' ? 'bg-[#DC2626]' :
                'bg-[#6B7280]'
              }`} />
              <span>
                {syncStatus === 'LIVE' && 'REALTIME CONNECTED (Supabase Channel: titik_public)'}
                {syncStatus === 'SYNCING' && 'SINKRONISASI SIKD KEMENDAGRI...'}
                {syncStatus === 'OFFLINE' && 'MODE OFFLINE: FALLBACK CACHE LOKAL'}
                {syncStatus === 'CACHED' && 'DATA CACHE TERAKHIR'}
              </span>
            </div>

            {/* Sync Timestamp & Integrity Info */}
            <div className="text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-center gap-2">
              <span className="hidden sm:inline text-[#9CA3AF] dark:text-[#64748B]">•</span>
              <span className="font-mono-data text-[11px]">
                {isOfflineSimulated 
                  ? 'Sumber SIKD terputus. Menampilkan cache lokal terverifikasi.' 
                  : `Data terakhir sinkron: ${lastSyncedAt}`}
              </span>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerManualSync()}
              disabled={syncStatus === 'SYNCING'}
              className="landing-telemetry-btn bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] border-[#E5E7EB] dark:border-[#243042] hover:bg-[#F9FAFB] dark:hover:bg-[#253248]"
              title="Perbarui data dari SIKD Kemendagri"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0D9488] ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'SYNCING' ? 'Menyinkronkan...' : 'Sinkronkan SIKD'}</span>
            </button>

            <button
              type="button"
              onClick={() => simulateIncomingEvent()}
              disabled={isOfflineSimulated}
              className="landing-telemetry-btn bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] border-[#E5E7EB] dark:border-[#243042] hover:bg-[#F9FAFB] dark:hover:bg-[#253248] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Simulasikan suara warga atau pembaruan laporan via Realtime"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Simulasi Event</span>
            </button>

            <button
              type="button"
              onClick={() => toggleOfflineSimulation()}
              className={`landing-telemetry-btn ${
                isOfflineSimulated 
                  ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 dark:bg-[#DC2626]/20 dark:text-[#F87171]' 
                  : 'bg-white dark:bg-[#1C2638] text-[#4B5563] dark:text-[#CBD5E1] border-[#E5E7EB] dark:border-[#243042] hover:bg-[#F9FAFB]'
              }`}
              title="Uji toleransi offline & validitas cache lokal"
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (Aktif)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Uji Offline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Event Notification Pill / Toast */}
        {latestTelemetryEvent && (
          <div className="mt-2.5">
            <div className={`landing-telemetry-toast ${
              latestTelemetryEvent.type === 'VOTE'
                ? 'bg-[#0D9488]/10 border-[#0D9488]/30 text-[#0D9488] dark:bg-[#0D9488]/20 dark:text-[#2DD4BF]'
                : latestTelemetryEvent.type === 'REPORT'
                  ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA]'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#D97706] dark:bg-[#F59E0B]/20 dark:text-[#FBBF24]'
            }`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-ping" />
                <span className="font-bold shrink-0">[{latestTelemetryEvent.timestamp}]</span>
                <span className="truncate">{latestTelemetryEvent.message}</span>
              </div>
              <button 
                type="button"
                onClick={clearLatestEvent}
                className="p-1 hover:opacity-70 transition-opacity shrink-0 cursor-pointer"
                title="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REST OF PAGE CONTENT BELOW FOLD */}
      <div className="space-y-16 sm:space-y-20 pt-16 sm:pt-20">

        {/* ============================================================== */}
        {/* 2. PUBLIC FACILITY DIRECTORY SHOWCASE                          */}
        {/* ============================================================== */}
        <section id="direktori-fasilitas" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 scroll-mt-24">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#243042] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Profil Fasilitas & Alokasi Pemeliharaan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight mt-1">
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
                        ? 'bg-[#111827] dark:bg-[#0D9488] text-white font-semibold shadow-xs' 
                        : 'bg-white dark:bg-[#151D2A] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2638] text-[#4B5563] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#243042]'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => navigate('/fasilitas')}
                className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:text-[#0F766E] dark:hover:text-[#5EEAD4] flex items-center gap-1 ml-2 transition-colors py-1.5"
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
                    <div className="relative h-40 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F3F4F6] dark:bg-[#101622]">
                      <img 
                        src={facility.photoUrl} 
                        alt={facility.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-semibold bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-xs text-[#111827] dark:text-[#F9FAFB] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#243042] shadow-2xs">
                          {facility.sector}
                        </span>

                        <span className="text-[10px] font-mono-data font-bold bg-[#111827] dark:bg-[#0B0F17] text-white dark:text-[#F9FAFB] px-2.5 py-1 rounded-lg border dark:border-[#243042] shadow-xs">
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
                      <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF] transition-colors line-clamp-1 leading-snug">
                        {facility.name}
                      </h3>
                      <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1 line-clamp-1">
                        {facility.responsibleAgency}
                      </div>
                    </div>

                    {/* Budget Execution Progress Bar */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono-data text-[#4B5563] dark:text-[#94A3B8]">
                        <span>Terikat Kontrak</span>
                        <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">{contractPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F3F4F6] dark:bg-[#1C2638] rounded-full overflow-hidden border border-[#E5E7EB]/60 dark:border-[#243042]">
                        <div 
                          className="h-full bg-[#0D9488] rounded-full transition-all duration-500" 
                          style={{ width: `${contractPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between text-xs">
                    <span className="text-[#4B5563] dark:text-[#94A3B8] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        facility.condition === 'Baik' 
                          ? 'bg-[#0D9488]' 
                          : facility.condition === 'Perlu Intervensi Kritis' 
                            ? 'bg-[#DC2626]' 
                            : 'bg-[#D97706]'
                      }`} />
                      <span className="font-medium text-[11px]">{facility.condition}</span>
                    </span>

                    <span className="font-mono-data text-[11px] font-semibold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-mono-data font-bold uppercase tracking-wider">
                    Catatan Observatorium • {CURRENT_MONTHLY_DIGEST.monthYear}
                  </span>
                  <span className="text-xs text-[#9CA3AF] dark:text-[#64748B]">•</span>
                  <span className="text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                    Audit Lapangan & SIKD
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight leading-snug">
                  {CURRENT_MONTHLY_DIGEST.headline}
                </h2>
              </div>

              <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-mono-data self-start sm:self-auto whitespace-nowrap bg-[#F9FAFB] dark:bg-[#101622] px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042]">
                Periode Jan - Okt 2026
              </div>
            </div>

            {/* High-Signal Key Finding Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488]/10 text-[#0D9488] dark:text-[#2DD4BF] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 8 Paket Lapangan Tuntas
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626] dark:text-[#F87171] text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> 3 Lokasi Deviasi Fisik
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97706]/10 text-[#D97706] dark:text-[#FBBF24] text-xs font-semibold">
                <Coins className="w-3.5 h-3.5" /> {formatRupiahShort(totalSisa)} Pagu Belum Dilelang
              </span>
            </div>

            {/* 3 High-Impact Telemetry Metric Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tile 1: Selesai */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    <span>Verifikasi Lapangan</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#0D9488] font-bold">100% SELESAI</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-1">
                  {CURRENT_MONTHLY_DIGEST.newCompletedProjects} Paket
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#0D9488]" /> IGD Puskesmas Sempur
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#0D9488]" /> Pedestrian Kebun Raya
                  </span>
                </div>
              </div>

              {/* Tile 2: Sisa Pagu */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>Potensi Alokasi</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#D97706] font-bold">BELUM DILELANG</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-1">
                  {formatRupiahShort(totalSisa)}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#111827] dark:text-[#F9FAFB]">
                    Cadangan DPA Pemda
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#111827] dark:text-[#F9FAFB]">
                    Siap Usulan Musrenbang
                  </span>
                </div>
              </div>

              {/* Tile 3: Selisih Temuan */}
              <div className="landing-telemetry-tile">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span>Audit Prioritas</span>
                  </span>
                  <span className="text-[10px] font-mono-data text-[#DC2626] dark:text-[#F87171] font-bold">DEVIASI FISIK</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#DC2626] dark:text-[#F87171] font-mono-data pt-1">
                  {discrepancies.length} Lokasi
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#DC2626] dark:text-[#F87171] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Drainase Pajajaran
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] text-[11px] font-medium text-[#DC2626] dark:text-[#F87171] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> SDN Menteng 01
                  </span>
                </div>
              </div>

            </div>

            {/* Crisp Methodology Badge */}
            <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#94A3B8] font-mono-data pt-1 border-t border-[#E5E7EB]/60 dark:border-[#243042]/60">
              <Info className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span>Metodologi: Deviasi serapan kas vs fisik adalah indikasi review audit lapangan, bukan vonis hukum.</span>
            </div>

            {/* Bottom Insight Footer */}
            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#6B7280] dark:text-[#94A3B8]">
                Sinkronisasi SIKD Kemendagri & Portal Satu Data Jabodetabek 2026.
              </span>
              <button
                type="button"
                onClick={() => navigate('/analisis')}
                className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] dark:hover:text-[#2DD4BF] flex items-center gap-1 transition-colors cursor-pointer"
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
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                <FileCheck2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Akuntabilitas & Alur Penanganan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight mt-1">
                Tahapan Penyelesaian Kasus Warga Jabodetabek
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/lapor')}
              className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              <span>Pantau Semua Laporan ({funnelStage1})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Connected 4 Funnel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* TAHAP 01 */}
            <div 
              onClick={() => navigate('/lapor')}
              className="landing-funnel-card cursor-pointer active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono-data pb-3 border-b border-[#E5E7EB] dark:border-[#243042]">
                  <span className="font-bold text-[#0D9488]">TAHAP 01</span>
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">100% dari total</span>
                </div>
                
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-3">
                  {funnelStage1}
                </div>

                <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                  <span>Laporan Masuk</span>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1E293B] text-[11px] font-medium text-[#4B5563] dark:text-[#CBD5E1]">
                    Geotag & foto lapangan warga
                  </span>
                </div>
              </div>

              <div className="landing-funnel-bar">
                <div className="landing-funnel-bar-fill" style={{ width: '100%' }} />
              </div>
            </div>

            {/* TAHAP 02 */}
            <div 
              onClick={() => navigate('/lapor')}
              className="landing-funnel-card cursor-pointer active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono-data pb-3 border-b border-[#E5E7EB] dark:border-[#243042]">
                  <span className="font-bold text-[#0D9488]">TAHAP 02</span>
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">70% dari total</span>
                </div>
                
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-3">
                  {funnelStage2}
                </div>

                <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] mt-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#D97706]" />
                  <span>Bukti Diperiksa</span>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#D97706]/10 text-[11px] font-medium text-[#D97706] dark:text-[#FBBF24]">
                    Validasi kurator relawan peta
                  </span>
                </div>
              </div>

              <div className="landing-funnel-bar">
                <div className="landing-funnel-bar-fill" style={{ width: '70%' }} />
              </div>
            </div>

            {/* TAHAP 03 */}
            <div 
              onClick={() => navigate('/lapor')}
              className="landing-funnel-card cursor-pointer active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono-data pb-3 border-b border-[#E5E7EB] dark:border-[#243042]">
                  <span className="font-bold text-[#0D9488]">TAHAP 03</span>
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">50% dari total</span>
                </div>
                
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-3">
                  {funnelStage3}
                </div>

                <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] mt-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>Respon Dinas</span>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#2563EB]/10 text-[11px] font-medium text-[#2563EB] dark:text-[#60A5FA]">
                    Jadwal & SPK dinas terkait
                  </span>
                </div>
              </div>

              <div className="landing-funnel-bar">
                <div className="landing-funnel-bar-fill" style={{ width: '50%' }} />
              </div>
            </div>

            {/* TAHAP 04 */}
            <div 
              onClick={() => navigate('/lapor')}
              className="landing-funnel-card cursor-pointer active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono-data pb-3 border-b border-[#E5E7EB] dark:border-[#243042]">
                  <span className="font-bold text-[#0D9488]">TAHAP 04</span>
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">27% dari total</span>
                </div>
                
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#F9FAFB] font-mono-data pt-3">
                  {funnelStage4}
                </div>

                <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] mt-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Selesai Diperbaiki</span>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#0D9488]/10 text-[11px] font-medium text-[#0D9488] dark:text-[#2DD4BF]">
                    Verifikasi fisik tuntas warga
                  </span>
                </div>
              </div>

              <div className="landing-funnel-bar">
                <div className="landing-funnel-bar-fill" style={{ width: '27%' }} />
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. PROPORTIONAL FISCAL STACK & 4-TIER BUDGET CLASSIFICATION    */}
        {/* ============================================================== */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="landing-card space-y-6">
            
            {/* Header without prose */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono-data uppercase tracking-wider text-[#0D9488] font-semibold">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>STANDAR BAS PERMENDAGRI NO. 77/2020</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight mt-0.5">
                  Empat Kategori Anggaran Fasilitas Publik
                </h2>
              </div>

              <span className="text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                APBD 2026 Terdata: {formatRupiahShort(totalPagu)}
              </span>
            </div>

            {/* Proportional Fiscal Stack Gauge */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">
                  Distribusi Total Pagu Observatorium ({formatRupiahShort(totalPagu)})
                </span>
                <span className="text-[#6B7280] dark:text-[#94A3B8] font-mono-data text-[11px]">
                  Berdasarkan SPK Kontrak & Kas Daerah 2026
                </span>
              </div>

              {/* Stacked Bar */}
              <div className="landing-budget-stacked-bar">
                <div 
                  className="bg-[#0D9488] h-full transition-all duration-500" 
                  style={{ width: `${pctRealisasi}%` }} 
                  title={`Realisasi Penyerapan: ${pctRealisasi.toFixed(1)}%`}
                />
                <div 
                  className="bg-[#D97706] h-full transition-all duration-500" 
                  style={{ width: `${pctKontrak}%` }} 
                  title={`Dana Terikat Kontrak: ${pctKontrak.toFixed(1)}%`}
                />
                <div 
                  className="bg-[#6B7280] dark:bg-[#475569] h-full transition-all duration-500" 
                  style={{ width: `${pctSisa}%` }} 
                  title={`Sisa Pagu Belum Terikat: ${pctSisa.toFixed(1)}%`}
                />
              </div>

              {/* Stack Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-medium">
                    Realisasi Kas ({pctRealisasi.toFixed(1)}% • {formatRupiahShort(totalRealisasi)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-medium">
                    Komitmen SPK ({pctKontrak.toFixed(1)}% • {formatRupiahShort(totalKontrak)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280] dark:bg-[#475569]" />
                  <span className="text-[#4B5563] dark:text-[#94A3B8] font-medium">
                    Sisa Belum Terikat ({pctSisa.toFixed(1)}% • {formatRupiahShort(totalSisa)})
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Distinct Tier Cards - Visual Metric Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tier 1 */}
              <div className="landing-budget-tier-card">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                  <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">01 • ALOKASI</span>
                  <span className="w-2 h-2 rounded-full bg-[#111827] dark:bg-[#F9FAFB]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">1. Pagu Anggaran</h4>
                <div className="flex flex-wrap gap-1.5 py-1">
                  <span className="px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1E293B] text-[11px] font-medium text-[#4B5563] dark:text-[#CBD5E1]">Batas Tertinggi APBD</span>
                  <span className="px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1E293B] text-[11px] font-medium text-[#4B5563] dark:text-[#CBD5E1]">Persetujuan DPRD</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
                  <span>DOKUMEN DASAR</span>
                  <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">DPA-SKPD</span>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="landing-budget-tier-card hover:border-[#D97706]">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#D97706]">
                  <span className="font-bold">02 • KOMITMEN</span>
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">2. Dana Terikat Kontrak</h4>
                <div className="flex flex-wrap gap-1.5 py-1">
                  <span className="px-2 py-0.5 rounded bg-[#D97706]/10 text-[11px] font-medium text-[#D97706] dark:text-[#FBBF24]">Ikatan Hukum Rekanan</span>
                  <span className="px-2 py-0.5 rounded bg-[#D97706]/10 text-[11px] font-medium text-[#D97706] dark:text-[#FBBF24]">Sedang Berjalan</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-[10px] font-mono-data text-[#D97706] flex items-center justify-between">
                  <span>STATUS HUKUM</span>
                  <span className="font-semibold">SPK Resmi</span>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="landing-budget-tier-card hover:border-[#0D9488]">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#0D9488]">
                  <span className="font-bold">03 • PENCAIRAN</span>
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">3. Realisasi Penyerapan</h4>
                <div className="flex flex-wrap gap-1.5 py-1">
                  <span className="px-2 py-0.5 rounded bg-[#0D9488]/10 text-[11px] font-medium text-[#0D9488] dark:text-[#2DD4BF]">BAP Fisik Lapangan</span>
                  <span className="px-2 py-0.5 rounded bg-[#0D9488]/10 text-[11px] font-medium text-[#0D9488] dark:text-[#2DD4BF]">Kas Daerah Cair</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-[10px] font-mono-data text-[#0D9488] flex items-center justify-between">
                  <span>BUKTI BAYAR</span>
                  <span className="font-semibold">SP2D Sah</span>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="landing-budget-tier-card hover:border-[#6B7280] dark:hover:border-[#94A3B8]">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                  <span className="font-bold">04 • SISA PAGU</span>
                  <span className="w-2 h-2 rounded-full bg-[#6B7280] dark:bg-[#94A3B8]" />
                </div>
                <h4 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">4. Sisa Belum Terikat</h4>
                <div className="flex flex-wrap gap-1.5 py-1">
                  <span className="px-2 py-0.5 rounded bg-[#6B7280]/10 text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Siap Usulan Baru</span>
                  <span className="px-2 py-0.5 rounded bg-[#6B7280]/10 text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Menunggu Lelang</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-between">
                  <span>KONDISI KAS</span>
                  <span className="font-semibold">Bukan Kas Bebas</span>
                </div>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
