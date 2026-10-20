import React from 'react';
import {
  Home,
  Users,
  Compass,
  MapPin,
  Bookmark,
  Plus,
  Droplets,
  Milestone,
  Lightbulb,
  TreePine,
  Building2,
  Sparkles,
  Search,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { TitikLogo } from '../common/TitikLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/' }) => {
  const { profile } = useAuth();
  const {
    openReportModal,
    selectedCategory,
    setSelectedCategory,
    activeFeedTab,
    setActiveFeedTab,
    setSearchModalOpen,
  } = useTitik();

  const navItems = [
    {
      label: 'Feed Utama',
      icon: Home,
      href: '/',
      active: currentPath === '/' && activeFeedTab === 'for_you',
      onClick: () => setActiveFeedTab('for_you'),
    },
    {
      label: 'Mengikuti',
      icon: Users,
      href: '#',
      active: activeFeedTab === 'following',
      onClick: () => setActiveFeedTab('following'),
    },
    {
      label: 'Eksplorasi Sektor',
      icon: Compass,
      href: '/explore',
      active: currentPath === '/explore',
    },
    {
      label: 'Peta Geospasial',
      icon: MapPin,
      href: '/map',
      active: currentPath === '/map',
    },
    {
      label: 'Laporan Tersimpan',
      icon: Bookmark,
      href: '#',
      active: false,
    },
  ];

  // Repurposed Civic Radar (Active civic monitoring filters)
  const civicSectors = [
    { name: 'Drainase & Banjir', icon: Droplets, color: 'text-sky-600', badge: '12 Aktif' },
    { name: 'Infrastruktur Jalan', icon: Milestone, color: 'text-amber-600', badge: '18 Aktif' },
    { name: 'Penerangan Umum', icon: Lightbulb, color: 'text-yellow-600', badge: '7 Aktif' },
    { name: 'Lingkungan Hidup', icon: TreePine, color: 'text-emerald-600', badge: '9 Aktif' },
    { name: 'Fasilitas Sosial', icon: Building2, color: 'text-violet-600', badge: '5 Aktif' },
  ];

  return (
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#E4E2DA] p-5 bg-[#F7F6F1] select-none z-30">
      {/* Top Section: Brand + Civic Radar + Navigation */}
      <div className="space-y-4 overflow-y-auto no-scrollbar pr-1">
        {/* Brand Logotype with Official SVG Logo Mark */}
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-[#20221D] group cursor-pointer"
          >
            <TitikLogo className="w-8 h-8 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center">
              <span>TITIK</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#263F35] ml-0.5"></span>
            </div>
          </a>
          <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#E7EBDD] text-[#263F35] w-fit text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Observatorium Sipil Kota Bogor</span>
          </div>
        </div>

        {/* Global Search Pill */}
        <div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-[#E4E2DA] text-xs text-[#686B65] hover:border-[#263F35]/40 hover:text-[#20221D] transition-colors shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#686B65] group-hover:text-[#20221D] transition-colors" />
              <span>Cari laporan, dinas...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#686B65] bg-[#F7F6F1] border border-[#E4E2DA] rounded">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#E7EBDD] text-[#263F35] shadow-xs'
                    : 'text-[#20221D] hover:bg-white hover:text-[#263F35]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#263F35]' : 'text-[#686B65]'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Primary CTA Button (Clean "+ Buat Laporan Warga") */}
        <div>
          <button
            type="button"
            onClick={openReportModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#263F35] text-white rounded-xl font-bold text-xs hover:bg-[#1d3129] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Buat Laporan Warga</span>
          </button>
        </div>

        {/* Repurposed Civic Radar (Live Issue Monitoring by Sector) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#686B65]">
              Radar Sektor Publik
            </h3>
            {selectedCategory !== 'Semua' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('Semua')}
                className="text-[10px] font-bold text-[#263F35] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="space-y-1">
            {civicSectors.map((sector) => {
              const Icon = sector.icon;
              const isSelected = selectedCategory === sector.name;
              return (
                <button
                  key={sector.name}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'Semua' : sector.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E7EBDD] text-[#263F35] shadow-xs ring-1 ring-[#263F35]/20'
                      : 'text-[#686B65] hover:text-[#20221D] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${sector.color}`} />
                    <span className="truncate">{sector.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white text-[#263F35]' : 'bg-[#E4E2DA]/50 text-[#686B65]'}`}>
                    {sector.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Civic Transparency Links */}
        <div className="pt-2 border-t border-[#E4E2DA]/60 space-y-1">
          <a
            href="/alur"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentPath === '/alur'
                ? 'bg-[#E7EBDD] text-[#263F35] font-semibold'
                : 'text-[#686B65] hover:text-[#20221D] hover:bg-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#263F35]" />
            <span>Alur Akuntabilitas 4 Tahap</span>
          </a>
          {profile.role === 'admin' && (
            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#686B65] hover:text-[#20221D] hover:bg-white transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Portal Tinjauan Admin</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Section: Citizen Profile Card & Theme Toggle */}
      <div className="pt-3 border-t border-[#E4E2DA] flex items-center gap-2">
        <a
          href="/login"
          className="flex min-w-0 flex-1 items-center justify-between p-2.5 bg-white border border-[#E4E2DA] rounded-xl shadow-xs hover:border-[#263F35]/40 transition-all group"
          title="Kelola Akun & Generator Warga"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#E4E2DA] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#20221D] truncate group-hover:text-[#263F35]">
                {profile.displayName}
              </div>
              <div className="text-[10px] text-[#263F35] font-semibold truncate">
                {profile.role === 'admin'
                  ? 'Admin Instansi PUPR'
                  : profile.role === 'moderator'
                  ? 'Moderator Verifikasi'
                  : profile.isVerified
                  ? 'Warga Terverifikasi'
                  : 'Warga Kota Bogor'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="p-1 rounded-lg text-[#686B65] group-hover:text-[#20221D] group-hover:bg-[#F7F6F1] transition-colors">
              <LogIn className="w-4 h-4" />
            </span>
          </div>
        </a>
        <ThemeToggle className="shrink-0" />
      </div>
    </aside>
  );
};
