import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
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

export const Sidebar: React.FC<SidebarProps> = ({ currentPath: propPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = propPath || location.pathname;

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
      onClick: () => {
        setActiveFeedTab('for_you');
        if (location.pathname !== '/') {
          navigate('/');
        }
      },
    },
    {
      label: 'Eksplorasi Sektor',
      icon: Compass,
      href: '/explore',
      active: currentPath === '/explore',
      onClick: () => {
        if (location.pathname !== '/explore') {
          navigate('/explore');
        }
      },
    },
    {
      label: 'Peta Geospasial',
      icon: MapPin,
      href: '/map',
      active: currentPath === '/map',
      onClick: () => {
        if (location.pathname !== '/map') {
          navigate('/map');
        }
      },
    },
    {
      label: 'Laporan Tersimpan',
      icon: Bookmark,
      href: '#',
      active: false,
      onClick: () => {
        // Reserved for saved bookmark collection
      },
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
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#E4E2DA] dark:border-[#26352E] p-5 bg-[#F7F6F1] dark:bg-[#131916] select-none z-30 print:hidden">
      {/* Top Section: Brand + Civic Radar + Navigation */}
      <div className="space-y-4 overflow-y-auto no-scrollbar pr-1">
        {/* Brand Logotype with Official SVG Logo Mark */}
        <div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveFeedTab('for_you');
              if (location.pathname !== '/') {
                navigate('/');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-[#20221D] dark:text-[#F3F6F4] group cursor-pointer"
          >
            <TitikLogo className="w-8 h-8 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center">
              <span>TITIK</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#263F35] dark:bg-[#10B981] ml-0.5"></span>
            </div>
          </a>
        </div>

        {/* Global Search Pill */}
        <div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#1A221E] rounded-xl border border-[#E4E2DA] dark:border-[#26352E] text-xs text-[#686B65] dark:text-[#9EACA3] hover:border-[#263F35]/40 dark:hover:border-[#10B981]/50 hover:text-[#20221D] dark:hover:text-[#F3F6F4] transition-colors shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#686B65] dark:text-[#9EACA3] group-hover:text-[#20221D] dark:group-hover:text-[#F3F6F4] transition-colors" />
              <span>Cari laporan, dinas...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#686B65] dark:text-[#9EACA3] bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded">
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
                  e.preventDefault();
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.href && item.href !== '#') {
                    navigate(item.href);
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] shadow-xs'
                    : 'text-[#20221D] dark:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A221E] hover:text-[#263F35] dark:hover:text-[#34D399]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#263F35] dark:text-[#34D399]' : 'text-[#686B65] dark:text-[#9EACA3]'}`} />
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl font-bold text-xs hover:bg-[#1d3129] dark:hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-sm dark:shadow-md dark:shadow-emerald-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Buat Laporan Warga</span>
          </button>
        </div>

        {/* Repurposed Civic Radar (Live Issue Monitoring by Sector) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3]">
              Radar Sektor Publik
            </h3>
            {selectedCategory !== 'Semua' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Semua');
                  if (location.pathname !== '/') {
                    navigate('/');
                  }
                }}
                className="text-[10px] font-bold text-[#263F35] dark:text-[#34D399] hover:underline cursor-pointer"
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
                  onClick={() => {
                    const next = isSelected ? 'Semua' : sector.name;
                    setSelectedCategory(next);
                    if (location.pathname !== '/') {
                      navigate('/');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] shadow-xs ring-1 ring-[#263F35]/20 dark:ring-[#10B981]/30'
                      : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A221E]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${sector.color}`} />
                    <span className="truncate">{sector.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white dark:bg-[#131916] text-[#263F35] dark:text-[#34D399]' : 'bg-[#E4E2DA]/50 dark:bg-[#26352E] text-[#686B65] dark:text-[#9EACA3]'}`}>
                    {sector.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Civic Transparency Links */}
        <div className="pt-2 border-t border-[#E4E2DA]/60 dark:border-[#26352E] space-y-1">
          <a
            href="/alur"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname !== '/alur') {
                navigate('/alur');
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentPath === '/alur'
                ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold'
                : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A221E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399]" />
            <span>Alur Akuntabilitas 4 Tahap</span>
          </a>
          <a
            href="/track"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname !== '/track') {
                navigate('/track');
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentPath === '/track'
                ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold'
                : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A221E]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399]" />
            <span>Lacak Status Laporan</span>
          </a>
          {profile.role === 'admin' && (
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname !== '/admin') {
                  navigate('/admin');
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentPath === '/admin'
                  ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold'
                  : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A221E]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" />
              <span>Portal Tinjauan Admin</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Section: Citizen Profile Card & Theme Toggle */}
      <div className="pt-3 border-t border-[#E4E2DA] dark:border-[#26352E] flex items-center gap-2">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            if (location.pathname !== '/login') {
              navigate('/login');
            }
          }}
          className="flex min-w-0 flex-1 items-center justify-between p-2.5 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl shadow-xs hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all group"
          title="Kelola Akun & Generator Warga"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#E4E2DA] dark:border-[#26352E] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] truncate group-hover:text-[#263F35] dark:group-hover:text-[#34D399]">
                {profile.displayName}
              </div>
              <div className="text-[10px] text-[#263F35] dark:text-[#34D399] font-semibold truncate">
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
            <span className="p-1 rounded-lg text-[#686B65] dark:text-[#9EACA3] group-hover:text-[#20221D] dark:group-hover:text-[#F3F6F4] group-hover:bg-[#F7F6F1] dark:group-hover:bg-[#131916] transition-colors">
              <LogIn className="w-4 h-4" />
            </span>
          </div>
        </a>
        <ThemeToggle className="shrink-0" />
      </div>
    </aside>
  );
};
