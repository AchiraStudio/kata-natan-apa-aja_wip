import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { TitikLogo } from '../common/TitikLogo';
import { ThemeToggle } from '../common/ThemeToggle';

/**
 * One brand bar for every phone-sized page except the video feed and the full-height
 * workspaces (/pesan, /admin), which draw their own headers. Glass is justified here:
 * page content scrolls underneath it.
 */
export const MobileTopBar: React.FC = () => {
  const { pathname } = useLocation();
  const { setSearchModalOpen } = useTitik();

  if (pathname === '/' || pathname.startsWith('/pesan') || pathname.startsWith('/admin')) return null;

  return (
    <header className="glass-strong lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between border-x-0 border-t-0 rounded-none print:hidden">
      <Link to="/" aria-label="TITIK. Beranda" className="flex items-center gap-2">
        <TitikLogo className="w-7 h-7" />
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">
          TITIK<span className="text-brand">.</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          aria-label="Cari laporan atau fasilitas"
          className="w-10 h-10 rounded-lg bg-surface-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
};
