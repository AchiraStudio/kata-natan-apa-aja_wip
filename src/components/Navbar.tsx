import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { Plus, RotateCcw, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    setIsSearchOpen,
    setIsDataSourceModalOpen,
    resetDemoData,
    reports 
  } = useTitik();

  const navigate = useNavigate();

  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `h-16 px-3 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${
      isActive
        ? 'border-[#111827] text-[#111827] font-semibold'
        : 'border-transparent text-[#4B5563] hover:text-[#111827]'
    }`;

  const mobileNavLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
      isActive
        ? 'border-[#111827] text-[#111827] font-semibold'
        : 'border-transparent text-[#6B7280] hover:text-[#111827]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9FA]/95 backdrop-blur-xs border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              to="/"
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-7 h-7 rounded bg-[#111827] flex items-center justify-center text-white font-bold text-sm tracking-tighter">
                T<span className="text-[#0D9488]">.</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#111827]">
                TITIK<span className="text-[#0D9488]">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links (Clean Editorial Text, No Rainbow Icons) */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" className={navLinkStyle} end>
              Beranda
            </NavLink>

            <NavLink to="/peta" className={navLinkStyle}>
              Peta & Masalah
            </NavLink>

            <NavLink to="/anggaran" className={navLinkStyle}>
              Anggaran APBD
            </NavLink>

            <NavLink to="/fasilitas" className={navLinkStyle}>
              Fasilitas Publik
            </NavLink>

            <NavLink to="/analisis" className={navLinkStyle}>
              Selisih Serapan
            </NavLink>

            <NavLink to="/lapor" className={navLinkStyle}>
              <span>Laporan Warga</span>
              <span className="font-mono-data text-[11px] text-[#6B7280]">
                ({reports.length})
              </span>
            </NavLink>
          </nav>

          {/* Right Utility & Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/60 rounded-lg transition-colors"
              title="Cari fasilitas, proyek, atau aduan (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDataSourceModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors hidden xl:inline-block whitespace-nowrap"
            >
              Sumber Data
            </button>

            <button
              onClick={resetDemoData}
              title="Kembalikan data simulasi ke kondisi awal"
              className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/60 rounded-lg transition-colors hidden sm:flex items-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate('/lapor')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Tandai Titik Masalah</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="lg:hidden flex items-center justify-start overflow-x-auto border-t border-[#E5E7EB] bg-white px-4 gap-2">
        <NavLink to="/" className={mobileNavLinkStyle} end>
          Beranda
        </NavLink>
        <NavLink to="/peta" className={mobileNavLinkStyle}>
          Peta
        </NavLink>
        <NavLink to="/anggaran" className={mobileNavLinkStyle}>
          Anggaran
        </NavLink>
        <NavLink to="/fasilitas" className={mobileNavLinkStyle}>
          Fasilitas
        </NavLink>
        <NavLink to="/analisis" className={mobileNavLinkStyle}>
          Selisih
        </NavLink>
        <NavLink to="/lapor" className={mobileNavLinkStyle}>
          Laporan ({reports.length})
        </NavLink>
      </div>
    </header>
  );
};
