import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  Bookmark,
  FileText,
  Plus,
  Sparkles,
  Search,
  ShieldAlert,
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

  const { profile, isAuthenticated } = useAuth();
  const {
    openComposer,
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
    ...(isAuthenticated
      ? [{
          label: 'Laporan Saya',
          icon: FileText,
          href: '/laporan-saya',
          active: currentPath === '/laporan-saya',
          onClick: () => {
            if (location.pathname !== '/laporan-saya') navigate('/laporan-saya');
          },
        }]
      : []),
  ];

  const utilityLinks = [
    {
      label: 'Lacak Status Laporan',
      icon: Search,
      href: '/track',
      active: currentPath === '/track',
    },
    {
      label: 'Alur Akuntabilitas',
      icon: Sparkles,
      href: '/alur',
      active: currentPath === '/alur',
    },
  ];

  return (
    <aside className="w-60 xl:w-64 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#E4E2DA] dark:border-[#222E28] px-4 py-5 bg-[#F7F6F1] dark:bg-[#0F1512] select-none z-30 print:hidden">
      {/* Top Section: Brand + Search + Primary Navigation */}
      <div className="space-y-5 overflow-y-auto no-scrollbar pr-0.5">
        {/* Brand Logotype */}
        <div className="px-1.5">
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
            className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-[#20221D] dark:text-[#F3F6F4] group cursor-pointer"
          >
            <TitikLogo className="w-7 h-7 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center">
              <span>TITIK</span>
              <span className="w-2 h-2 rounded-full bg-[#263F35] dark:bg-[#10B981] ml-0.5"></span>
            </div>
          </a>
        </div>

        {/* Global Search Trigger */}
        <div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-[#161F1B] rounded-xl border border-[#E4E2DA] dark:border-[#24322B] text-xs text-[#686B65] dark:text-[#9EACA3] hover:border-[#263F35]/40 dark:hover:border-[#10B981]/50 hover:text-[#20221D] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#686B65] dark:text-[#9EACA3] group-hover:text-[#20221D] dark:group-hover:text-[#F3F6F4] transition-colors shrink-0" />
              <span className="truncate">Cari laporan, dinas...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#686B65] dark:text-[#9EACA3] bg-[#F7F6F1] dark:bg-[#0F1512] border border-[#E4E2DA] dark:border-[#24322B] rounded shrink-0">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1" aria-label="Navigasi Utama">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  item.active
                    ? 'bg-[#E7EBDD] dark:bg-[#192B22] text-[#263F35] dark:text-[#34D399] font-bold'
                    : 'text-[#20221D]/85 dark:text-[#D5DFD9] font-medium hover:bg-white/70 dark:hover:bg-[#161F1B] hover:text-[#20221D] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#263F35] dark:text-[#34D399]' : 'text-[#686B65] dark:text-[#8FA096]'}`} />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Primary CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => openComposer('post')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#08130E] rounded-xl font-bold text-xs hover:bg-[#1d3129] dark:hover:bg-[#34D399] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.6]" />
            <span>Buat Laporan</span>
          </button>
        </div>

        {/* Secondary Accountability Links */}
        <div className="pt-3 border-t border-[#E4E2DA]/70 dark:border-[#222E28] space-y-0.5">
          {utilityLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (location.pathname !== link.href) {
                    navigate(link.href);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  link.active
                    ? 'bg-[#E7EBDD]/80 dark:bg-[#192B22] text-[#263F35] dark:text-[#34D399] font-semibold'
                    : 'text-[#686B65] dark:text-[#8FA096] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white/50 dark:hover:bg-[#161F1B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </a>
            );
          })}

          {profile.role === 'admin' && (
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname !== '/admin') {
                  navigate('/admin');
                }
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                currentPath === '/admin'
                  ? 'bg-[#E7EBDD]/80 dark:bg-[#192B22] text-[#263F35] dark:text-[#34D399] font-semibold'
                  : 'text-[#686B65] dark:text-[#8FA096] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white/50 dark:hover:bg-[#161F1B]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400 shrink-0" />
              <span className="truncate">Portal Tinjauan Admin</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Section: Quiet Citizen Profile & Theme Toggle */}
      <div className="pt-3 border-t border-[#E4E2DA] dark:border-[#222E28] flex items-center gap-2">
        <a
          href={`/u/${profile.username}`}
          onClick={(e) => {
            e.preventDefault();
            const target = `/u/${profile.username}`;
            if (location.pathname !== target) {
              navigate(target);
            }
          }}
          className={`flex min-w-0 flex-1 items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer group ${
            currentPath === `/u/${profile.username}` || currentPath === '/me'
              ? 'bg-[#E7EBDD] dark:bg-[#192B22]'
              : 'hover:bg-white/80 dark:hover:bg-[#161F1B]'
          }`}
          title="Profil Saya"
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
              <div className="text-[10px] text-[#686B65] dark:text-[#8FA096] font-medium truncate">
                {profile.role === 'admin'
                  ? 'Admin Instansi PUPR'
                  : profile.isVerified
                  ? 'Warga Terverifikasi'
                  : 'Warga Kota Bogor'}
              </div>
            </div>
          </div>
        </a>
        <ThemeToggle className="shrink-0" />
      </div>
    </aside>
  );
};
