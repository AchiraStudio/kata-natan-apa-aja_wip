import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { Modal } from './Modal';
import { 
  Home, 
  Compass, 
  Coins, 
  Building2, 
  BarChart3, 
  AlertCircle, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  RotateCcw,
  ArrowRight,
  Database,
  Sun,
  Moon
} from 'lucide-react';

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  description: string;
  badge?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeCount?: number;
  subItems: SubNavItem[];
}

export const Navbar: React.FC = () => {
  const { 
    setIsSearchOpen,
    setIsDataSourceModalOpen,
    resetDemoData,
    reports,
    facilities,
    theme,
    toggleTheme
  } = useTitik();

  const navigate = useNavigate();
  const location = useLocation();

  // Navigation Items Definition with Submenus
  const navItems: NavItem[] = [
    {
      id: 'beranda',
      label: 'Beranda',
      path: '/',
      icon: Home,
      description: 'Observatorium publik & ringkasan data APBD wilayah Jabodetabek',
      subItems: [
        { id: 'ringkasan', label: 'Ringkasan Observatorium', path: '/', description: 'Dashboard utama data keterbukaan & statistik' },
        { id: 'pencarian-cepat', label: 'Penelusuran Prioritas', path: '/#direktori-fasilitas', description: 'Cari fasilitas dan pagu anggaran APBD' },
        { id: 'integritas-data', label: 'Integritas SIKD & Audit', path: '/#status', description: 'Standar pelaporan Permendagri No. 77/2020' }
      ]
    },
    {
      id: 'peta',
      label: 'Peta Spasial',
      path: '/peta',
      icon: Compass,
      description: 'Sebaran geospasial fasilitas publik & aduan warga',
      subItems: [
        { id: 'semua-peta', label: 'Observatorium Peta Lengkap', path: '/peta', description: 'Visualisasi titik geospasial Jabodetabek' },
        { id: 'titik-kritis', label: 'Fasilitas Rusak & Kritis', path: '/peta', description: 'Intervensi prioritas infrastruktur darurat' },
        { id: 'aduan-spasial', label: 'Sebaran Aduan Warga', path: '/peta', description: 'Titik laporan lapangan terverifikasi' }
      ]
    },
    {
      id: 'anggaran',
      label: 'Anggaran APBD',
      path: '/anggaran',
      icon: Coins,
      description: 'Pagu alokasi, realisasi SIKD, dan serapan belanja',
      subItems: [
        { id: 'ringkasan-apbd', label: 'Pagu APBD Tahun 2026', path: '/anggaran', description: 'Total pagu anggaran di 9 sektor layanan' },
        { id: 'realisasi-sikd', label: 'Sinkronisasi SIKD Kemenkeu', path: '/anggaran', description: 'Kompilasi serapan riil vs kontrak fisik' },
        { id: 'distribusi-skpd', label: 'Alokasi per SKPD Dinas', path: '/anggaran', description: 'Disdik, Dinkes, PUPR, dan Dinas Teknis' }
      ]
    },
    {
      id: 'fasilitas',
      label: 'Fasilitas Publik',
      path: '/fasilitas',
      icon: Building2,
      description: 'Katalog sarana pendidikan, kesehatan, jalan & drainase',
      subItems: [
        { id: 'semua-fasilitas', label: `Semua Fasilitas (${facilities.length})`, path: '/fasilitas', description: 'Direktori lengkap fasilitas terdata se-Jabodetabek' },
        { id: 'pendidikan', label: 'Pendidikan & Sekolah', path: '/fasilitas?sektor=Pendidikan', description: 'SDN, SMPN, SMAN di wilayah Jabodetabek' },
        { id: 'kesehatan', label: 'Kesehatan & Puskesmas', path: '/fasilitas?sektor=Kesehatan', description: 'Puskesmas kecamatan & RSUD daerah' },
        { id: 'drainase', label: 'Drainase & Lingkungan', path: '/fasilitas?sektor=Lingkungan+%26+Drainase', description: 'Saluran air pencegah banjir lokal' },
        { id: 'jalan', label: 'Infrastruktur Jalan', path: '/fasilitas?sektor=Infrastruktur+Jalan', description: 'Ruas jalan arteri & trotoar pejalan kaki' }
      ]
    },
    {
      id: 'analisis',
      label: 'Selisih Serapan',
      path: '/analisis',
      icon: BarChart3,
      description: 'Deteksi selisih pelaporan fisik vs realisasi belanja',
      subItems: [
        { id: 'anomali-utama', label: 'Anomali Fisik vs Anggaran', path: '/analisis', description: '4 temuan deviasi serapan prioritas inspektorat' },
        { id: 'indeks-skpd', label: 'Indeks Transparansi Dinas', path: '/analisis', description: 'Peringkat kepatuhan pelaporan instansi' }
      ]
    },
    {
      id: 'lapor',
      label: 'Laporan Warga',
      path: '/lapor',
      icon: AlertCircle,
      badgeCount: reports.length,
      description: 'Partisipasi publik & pemantauan tindak lanjut laporan',
      subItems: [
        { id: 'daftar-laporan', label: `Daftar Aduan Terkini (${reports.length})`, path: '/lapor', description: 'Laporan warga terverifikasi & statusnya' },
        { id: 'buat-laporan', label: 'Tandai Titik Masalah Baru', path: '/lapor', description: 'Unggah bukti foto & koordinat GPS' }
      ]
    }
  ];

  // Drawer & Popover State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerCategory, setActiveDrawerCategory] = useState<string>('beranda');
  const [activeHoverDropdown, setActiveHoverDropdown] = useState<string | null>(null);
  const [mobileDrawerStep, setMobileDrawerStep] = useState<'categories' | 'subitems'>('categories');

  // Smart Auto-Hide State
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync active category with current route on location change
  useEffect(() => {
    const matchingItem = navItems.find(item => 
      item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    if (matchingItem) {
      setActiveDrawerCategory(matchingItem.id);
    }
    setIsDrawerOpen(false);
    setActiveHoverDropdown(null);
    setMobileDrawerStep('categories');
    setIsVisible(true);
    lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
  }, [location.pathname]);

  // Handle ESC key to close open menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setActiveHoverDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smart Auto-Hide Scroll Listener with Hysteresis
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollYRef.current;

          // Always visible near top of page
          if (currentScrollY <= 40) {
            setIsVisible(true);
          } else if (Math.abs(delta) > 8) {
            if (delta > 0 && currentScrollY > 80) {
              // Scrolling down: hide unless drawer or dropdown is open
              if (!isDrawerOpen && !activeHoverDropdown) {
                setIsVisible(false);
              }
            } else if (delta < 0) {
              // Scrolling up: reveal immediately
              setIsVisible(true);
            }
            lastScrollYRef.current = currentScrollY;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDrawerOpen, activeHoverDropdown]);

  // Dropdown hover timing helper
  const handleMouseEnterDropdown = (itemId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveHoverDropdown(itemId);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveHoverDropdown(null);
    }, 150);
  };

  const currentCategory = navItems.find(item => item.id === activeDrawerCategory) || navItems[0];

  return (
    <>
      {/* ==================================================================== */}
      {/* 1. DESKTOP UNIFIED FLOATING ISLAND HEADER (≥ 1024px)                 */}
      {/* ==================================================================== */}
      <header 
        className={`navbar-floating-wrapper ${
          isVisible || isDrawerOpen || activeHoverDropdown ? 'navbar-visible' : 'navbar-hidden-top'
        }`}
      >
        <div className="navbar-floating-island">
          
          {/* LEFT: CIRCULAR HAMBURGER BUTTON & BRAND WORDMARK */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(prev => !prev);
                setMobileDrawerStep('categories');
              }}
              className={`navbar-menu-btn ${
                isDrawerOpen ? 'navbar-menu-btn-active' : 'navbar-menu-btn-idle'
              }`}
              aria-label={isDrawerOpen ? "Tutup menu samping" : "Buka menu navigasi observatorium"}
              title="Pusat Menu & Direktori Sektoral"
            >
              {isDrawerOpen ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Menu className="w-4 h-4 text-[#0D9488]" />
              )}
            </button>

            {/* Brand Logo & Typographic Anchor */}
            <Link 
              to="/"
              className="flex items-center gap-2 focus:outline-none group select-none"
            >
              <div className="navbar-brand-logo group-hover:scale-105">
                T<span className="text-[#0D9488]">.</span>
              </div>
              <div className="flex flex-col">
                <span className="navbar-brand-title">
                  TITIK<span className="text-[#0D9488]">.</span>
                </span>
                <span className="navbar-brand-badge">
                  Jabodetabek 2026
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: DESKTOP FLOATING PILL BAR WITH ACTIVE INDICATOR */}
          <nav className="navbar-pill-bar">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              const hasSub = item.subItems && item.subItems.length > 0;
              const isDropdownOpen = activeHoverDropdown === item.id;

              return (
                <div 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterDropdown(item.id)}
                  onMouseLeave={handleMouseLeaveDropdown}
                >
                  <Link
                    to={item.path}
                    onClick={() => setActiveHoverDropdown(null)}
                    className={`relative px-3 sm:px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 transition-all select-none ${
                      isActive 
                        ? 'text-[#0D9488] dark:text-[#2DD4BF] font-bold bg-[#0D9488]/5 dark:bg-[#0D9488]/15' 
                        : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-[#FAF9F6] dark:hover:bg-[#1C2638] font-medium'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-[#0D9488] dark:text-[#2DD4BF]' : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`} />
                    
                    <span>{item.label}</span>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className={`text-[10px] font-mono-data px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-[#0D9488] text-white' : 'bg-[#E5E4DF] dark:bg-[#243042] text-[#4B5563] dark:text-[#CBD5E1]'
                      }`}>
                        {item.badgeCount}
                      </span>
                    )}

                    {hasSub && (
                      <ChevronDown className={`w-3 h-3 text-[#9CA3AF] dark:text-[#64748B] transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-[#0D9488] dark:text-[#2DD4BF]' : ''
                      }`} />
                    )}

                    {/* Active Underline Pill Glow */}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-3.5 right-3.5 h-[2.5px] bg-[#0D9488] dark:bg-[#2DD4BF] rounded-full shadow-[0_1px_4px_rgba(13,148,136,0.35)]" />
                    )}
                  </Link>

                  {/* Desktop Dropdown Popover */}
                  {hasSub && isDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E4DF] dark:border-[#243042] shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onMouseEnter={() => handleMouseEnterDropdown(item.id)}
                      onMouseLeave={handleMouseLeaveDropdown}
                    >
                      <div className="px-3 py-1.5 border-b border-[#E5E4DF]/60 dark:border-[#243042] mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                          {item.label}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                      </div>

                      <div className="space-y-1">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.id}
                            to={sub.path}
                            onClick={() => setActiveHoverDropdown(null)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAF9F6] dark:hover:bg-[#1C2638] border border-transparent hover:border-[#E5E4DF] dark:hover:border-[#243042] transition-all flex items-start justify-between group"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF] transition-colors flex items-center gap-1.5">
                                <span>{sub.label}</span>
                              </div>
                              <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] line-clamp-1">
                                {sub.description}
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#64748B] group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                          </Link>
                        ))}
                      </div>

                      <div className="pt-2 mt-1 border-t border-[#E5E4DF]/60 dark:border-[#243042] px-1">
                        <Link
                          to={item.path}
                          onClick={() => setActiveHoverDropdown(null)}
                          className="text-[11px] font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:text-[#0F766E] dark:hover:text-[#5EEAD4] flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[#0D9488]/5 dark:hover:bg-[#0D9488]/15 transition-colors"
                        >
                          <span>Buka halaman {item.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: UTILITY & ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? "Beralih ke tema terang (Daylight)" : "Beralih ke tema gelap (Midnight)"}
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] bg-white dark:bg-[#151D2A] hover:bg-[#FAF9F6] dark:hover:bg-[#1C2638] border border-[#E5E4DF] dark:border-[#243042] rounded-xl transition-all shadow-2xs flex items-center justify-center active:scale-95"
              aria-label="Ganti mode tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#6B7280]" />
              )}
            </button>

            {/* Cmd+K Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] bg-white dark:bg-[#151D2A] hover:bg-[#FAF9F6] dark:hover:bg-[#1C2638] border border-[#E5E4DF] dark:border-[#243042] rounded-xl transition-all shadow-2xs hover:border-[#D1D5DB] dark:hover:border-[#334155]"
              title="Cari fasilitas, proyek, atau aduan (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
              <span className="hidden sm:inline font-medium">Cari</span>
              <kbd className="hidden md:inline-flex items-center text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] bg-[#FAF9F6] dark:bg-[#101622] px-1.5 py-0.5 rounded border border-[#E5E4DF] dark:border-[#243042]">
                ⌘K
              </kbd>
            </button>

            {/* Data Source Trigger */}
            <button
              type="button"
              onClick={() => setIsDataSourceModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#151D2A] border border-transparent hover:border-[#E5E4DF] dark:hover:border-[#243042] rounded-xl transition-all hidden xl:inline-block whitespace-nowrap"
            >
              Sumber Data
            </button>

            {/* Reset Demo Button */}
            <button
              type="button"
              onClick={resetDemoData}
              title="Kembalikan data simulasi ke kondisi awal"
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#151D2A] border border-transparent hover:border-[#E5E4DF] dark:hover:border-[#243042] rounded-xl transition-all hidden sm:flex items-center"
              aria-label="Kembalikan data simulasi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => navigate('/lapor')}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl transition-all shadow-tactile active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#0D9488] dark:text-white" />
              <span>Tandai Masalah</span>
            </button>
          </div>

        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MOBILE FLOATING TOP BRAND CAPSULE (< lg)                          */}
      {/* ==================================================================== */}
      <header 
        className={`navbar-mobile-top-wrapper ${
          isVisible || isDrawerOpen ? 'navbar-visible' : 'navbar-hidden-top'
        }`}
      >
        <div className="navbar-mobile-top-island">
          {/* Brand Logo & Monogram */}
          <Link to="/" className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-lg bg-[#111827] dark:bg-[#1C2638] flex items-center justify-center text-white font-bold text-xs tracking-tighter shadow-xs">
              T<span className="text-[#0D9488]">.</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[#111827] dark:text-[#F9FAFB] leading-none">
                TITIK<span className="text-[#0D9488]">.</span>
              </span>
              <span className="text-[9px] font-mono-data text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider leading-none mt-0.5">
                Jabodetabek 2026
              </span>
            </div>
          </Link>

          {/* Quick Search & Fast Action */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] bg-white dark:bg-[#151D2A] border border-[#E5E4DF] dark:border-[#243042] rounded-xl transition-all shadow-2xs active:scale-95"
              aria-label={theme === 'dark' ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
              title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#6B7280]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] bg-white dark:bg-[#151D2A] border border-[#E5E4DF] dark:border-[#243042] rounded-xl transition-all shadow-2xs"
              aria-label="Cari fasilitas atau laporan"
            >
              <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/lapor')}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl transition-all shadow-tactile active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#0D9488] dark:text-white" />
              <span>Lapor</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. MOBILE FLOATING BOTTOM DOCK (< lg)                                */}
      {/* ==================================================================== */}
      <nav 
        className={`navbar-mobile-bottom-dock ${
          isVisible || isDrawerOpen ? 'navbar-visible-bottom' : 'navbar-hidden-bottom'
        }`}
        aria-label="Navigasi Bawah Mobile"
      >
        <div className="navbar-mobile-dock-inner">
          {/* Beranda */}
          <Link
            to="/"
            className={`navbar-dock-item ${
              location.pathname === '/' ? 'navbar-dock-item-active' : 'navbar-dock-item-idle'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-[10px] leading-tight mt-0.5">Beranda</span>
          </Link>

          {/* Peta Spasial */}
          <Link
            to="/peta"
            className={`navbar-dock-item ${
              location.pathname.startsWith('/peta') ? 'navbar-dock-item-active' : 'navbar-dock-item-idle'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="text-[10px] leading-tight mt-0.5">Peta</span>
          </Link>

          {/* Anggaran APBD */}
          <Link
            to="/anggaran"
            className={`navbar-dock-item ${
              location.pathname.startsWith('/anggaran') ? 'navbar-dock-item-active' : 'navbar-dock-item-idle'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span className="text-[10px] leading-tight mt-0.5">Anggaran</span>
          </Link>

          {/* Laporan Warga */}
          <Link
            to="/lapor"
            className={`navbar-dock-item relative ${
              location.pathname.startsWith('/lapor') ? 'navbar-dock-item-active' : 'navbar-dock-item-idle'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {reports.length > 0 && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            )}
            <span className="text-[10px] leading-tight mt-0.5">Lapor</span>
          </Link>

          {/* Direktori & Menu Modal Drawer */}
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(true);
              setMobileDrawerStep('categories');
            }}
            className={`navbar-dock-item ${
              isDrawerOpen || location.pathname.startsWith('/fasilitas') || location.pathname.startsWith('/analisis')
                ? 'navbar-dock-item-active'
                : 'navbar-dock-item-idle'
            }`}
            aria-label="Buka menu lengkap observatorium"
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="text-[10px] leading-tight mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* 4. CASCADING NAVIGATION MODAL (Rail & Flyout Directory)             */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        maxWidth="4xl"
        title="Pusat Navigasi Observatorium"
        subtitle="Jelajahi modul pemantauan, peta titik prioritas, dan transparansi anggaran Jabodetabek"
        icon={<Compass className="w-5 h-5 text-[#0D9488]" />}
        badge={
          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#0D9488]/15 text-[#0D9488] font-bold uppercase tracking-wider">
            Menu Navigasi
          </span>
        }
        bodyClassName="p-0 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row h-[520px] max-h-[70vh]">
          {/* COLUMN 1: VERTICAL ICON RAIL */}
          <div className="w-full sm:w-16 bg-[#FAF9F6] dark:bg-[#0B0F17] border-b sm:border-b-0 sm:border-r border-[#E5E4DF] dark:border-[#243042] flex sm:flex-col items-center py-2.5 sm:py-4 px-2 sm:px-0 justify-between shrink-0 overflow-x-auto sm:overflow-x-visible">
            <div className="flex sm:flex-col items-center gap-2 sm:gap-2.5 w-full">
              {navItems.map(item => {
                const isSelected = activeDrawerCategory === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveDrawerCategory(item.id);
                      setMobileDrawerStep('subitems');
                    }}
                    onMouseEnter={() => setActiveDrawerCategory(item.id)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all relative shrink-0 ${
                      isSelected 
                        ? 'bg-[#0D9488]/15 text-[#0D9488] dark:text-[#2DD4BF] shadow-2xs font-semibold' 
                        : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#151D2A]'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {isSelected && (
                      <span className="hidden sm:block absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#0D9488] dark:bg-[#2DD4BF] rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rail Bottom Utility */}
            <div className="hidden sm:flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#151D2A] flex items-center justify-center transition-colors"
                title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#6B7280]" />
                )}
              </button>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsDataSourceModalOpen(true);
                }}
                className="w-10 h-10 rounded-xl text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#151D2A] flex items-center justify-center transition-colors"
                title="Sumber Data & Metodologi SIKD"
              >
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* COLUMN 2: CATEGORY FLYOUT LIST */}
          <div className={`w-full sm:w-60 bg-white dark:bg-[#101622] border-b sm:border-b-0 sm:border-r border-[#E5E4DF] dark:border-[#243042] flex flex-col py-3.5 shrink-0 ${
            mobileDrawerStep === 'subitems' ? 'hidden sm:flex' : 'flex'
          }`}>
            <div className="px-4 pb-2.5 border-b border-[#E5E4DF]/60 dark:border-[#243042] flex items-center justify-between">
              <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                Kategori Utama
              </div>
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            </div>

            <div className="flex-1 py-1.5 overflow-y-auto space-y-1 px-2">
              {navItems.map(item => {
                const isSelected = activeDrawerCategory === item.id;
                const Icon = item.icon;
                const hasSub = item.subItems && item.subItems.length > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveDrawerCategory(item.id);
                      setMobileDrawerStep('subitems');
                    }}
                    onMouseEnter={() => setActiveDrawerCategory(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                      isSelected 
                        ? 'bg-[#0D9488]/10 dark:bg-[#0D9488]/20 text-[#0D9488] dark:text-[#2DD4BF] font-bold' 
                        : 'text-[#374151] dark:text-[#CBD5E1] hover:bg-[#FAF9F6] dark:hover:bg-[#151D2A] hover:text-[#111827] dark:hover:text-[#F9FAFB] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isSelected ? 'text-[#0D9488] dark:text-[#2DD4BF]' : 'text-[#6B7280] dark:text-[#94A3B8] group-hover:text-[#111827] dark:group-hover:text-[#F9FAFB]'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? 'bg-[#0D9488] text-white' : 'bg-[#E5E4DF] dark:bg-[#243042] text-[#4B5563] dark:text-[#CBD5E1]'
                        }`}>
                          {item.badgeCount}
                        </span>
                      )}
                      {hasSub && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-[#0D9488] dark:text-[#2DD4BF] translate-x-0.5' : 'text-[#9CA3AF] dark:text-[#64748B] group-hover:text-[#4B5563] dark:group-hover:text-[#94A3B8]'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Direct Open Button for Currently Highlighted Category */}
            <div className="p-3 border-t border-[#E5E4DF]/60 dark:border-[#243042] mt-auto">
              <button
                onClick={() => {
                  if (currentCategory) {
                    navigate(currentCategory.path);
                    setIsDrawerOpen(false);
                  }
                }}
                className="w-full py-2.5 px-3 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <span>Buka {currentCategory.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0D9488] dark:text-white" />
              </button>
            </div>
          </div>

          {/* COLUMN 3: CASCADING SUBMENU PANEL */}
          {currentCategory && currentCategory.subItems && currentCategory.subItems.length > 0 && (
            <div className={`flex-1 bg-white dark:bg-[#151D2A] flex flex-col py-3.5 min-w-0 overflow-y-auto ${
              mobileDrawerStep === 'subitems' ? 'flex' : 'hidden sm:flex'
            }`}>
              {/* Mobile Back Header */}
              <div className="sm:hidden px-3 pb-2 border-b border-[#E5E4DF] dark:border-[#243042] mb-2 flex items-center justify-between">
                <button
                  onClick={() => setMobileDrawerStep('categories')}
                  className="text-xs text-[#0D9488] dark:text-[#2DD4BF] font-bold flex items-center gap-1 hover:underline py-1"
                >
                  <span>← Kembali ke Kategori</span>
                </button>
                <span className="text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                  {currentCategory.label}
                </span>
              </div>

              {/* Submenu Header */}
              <div className="px-5 pb-3 border-b border-[#E5E4DF]/60 dark:border-[#243042]">
                <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                  Sub-Seksi & Pilihan Cepat
                </div>
                <div className="text-base font-bold text-[#111827] dark:text-[#F9FAFB] mt-0.5">
                  {currentCategory.label}
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                  {currentCategory.description}
                </div>
              </div>

              {/* Sub-Items List */}
              <div className="flex-1 py-2 px-3 space-y-1.5 overflow-y-auto">
                {currentCategory.subItems.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      navigate(sub.path);
                      setIsDrawerOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-xl hover:bg-[#FAF9F6] dark:hover:bg-[#1C2638] border border-transparent hover:border-[#E5E4DF] dark:hover:border-[#243042] transition-all group"
                  >
                    <div className="text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF] flex items-center justify-between">
                      <span className="font-semibold">{sub.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#64748B] group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                    </div>
                    {sub.description && (
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-1 leading-relaxed">
                        {sub.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Direct Action Link */}
              <div className="p-3.5 border-t border-[#E5E4DF]/60 dark:border-[#243042] bg-[#FAF9F6]/60 dark:bg-[#101622]/60 mt-auto">
                <button
                  onClick={() => {
                    navigate(currentCategory.path);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full text-center text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:text-[#0F766E] dark:hover:text-[#5EEAD4] transition-colors py-1 flex items-center justify-center gap-1.5"
                >
                  <span>Eksplorasi Seluruh {currentCategory.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
