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
  LogIn,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { TitikLogo } from '../common/TitikLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserAvatar } from '../common/UserAvatar';

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
      href: '/tersimpan',
      active: currentPath === '/tersimpan',
      onClick: () => {
        if (location.pathname !== '/tersimpan') {
          navigate('/tersimpan');
        }
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
    <aside className="w-60 xl:w-64 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#E3E0D6] dark:border-[#222E28] px-4 py-5 bg-[#F7F5EF] dark:bg-[#0F1512] select-none z-30 print:hidden">
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
            className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-[#101913] dark:text-[#F3F6F4] group cursor-pointer"
          >
            <TitikLogo className="w-7 h-7 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center">
              <span>TITIK</span>
              <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981] ml-0.5"></span>
            </div>
          </a>
        </div>

        {/* Global Search Trigger */}
        <div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-[#161F1B] rounded-xl border border-[#E3E0D6] dark:border-[#24322B] text-xs text-[#4F5A52] dark:text-[#9EACA3] hover:border-[#1B4332]/40 dark:hover:border-[#10B981]/50 hover:text-[#101913] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#4F5A52] dark:text-[#9EACA3] group-hover:text-[#101913] dark:group-hover:text-[#F3F6F4] transition-colors shrink-0" />
              <span className="truncate">Cari laporan, dinas...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#4F5A52] dark:text-[#9EACA3] bg-[#F7F5EF] dark:bg-[#0F1512] border border-[#E3E0D6] dark:border-[#24322B] rounded shrink-0">
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#E7EBDD] dark:bg-[#192B22] text-[#1B4332] dark:text-[#34D399] font-bold shadow-xs'
                    : 'text-[#101913]/85 dark:text-[#D5DFD9] font-medium hover:bg-white/70 dark:hover:bg-[#161F1B] hover:text-[#101913] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#1B4332] dark:text-[#34D399]' : 'text-[#4F5A52] dark:text-[#8FA096]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] dark:bg-[#34D399] titik-live shrink-0 ml-2" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Primary CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => openComposer('post')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#08130E] rounded-xl font-bold text-xs hover:bg-[#14352A] dark:hover:bg-[#34D399] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.6]" />
            <span>Buat Laporan</span>
          </button>
        </div>

        {/* Secondary Accountability Links */}
        <div className="pt-3 border-t border-[#E3E0D6]/70 dark:border-[#222E28] space-y-0.5">
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
                    ? 'bg-[#E7EBDD]/80 dark:bg-[#192B22] text-[#1B4332] dark:text-[#34D399] font-semibold'
                    : 'text-[#4F5A52] dark:text-[#8FA096] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-white/50 dark:hover:bg-[#161F1B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </a>
            );
          })}

          {isAuthenticated && profile.role === 'admin' && (
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
                  ? 'bg-[#E7EBDD]/80 dark:bg-[#192B22] text-[#1B4332] dark:text-[#34D399] font-semibold'
                  : 'text-[#4F5A52] dark:text-[#8FA096] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-white/50 dark:hover:bg-[#161F1B]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400 shrink-0" />
              <span className="truncate">Portal Tinjauan Admin</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Section: Quiet Citizen Profile & Theme Toggle */}
      <div className="pt-3 border-t border-[#E3E0D6] dark:border-[#222E28] flex items-center gap-2">
        {isAuthenticated && profile.id !== 'usr-anon-00' ? (
          <a
            href={`/u/${encodeURIComponent(profile.username)}`}
            onClick={(e) => {
              e.preventDefault();
              const target = `/u/${encodeURIComponent(profile.username)}`;
              if (location.pathname !== target) {
                navigate(target);
              }
            }}
            className={`flex min-w-0 flex-1 items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer group ${
              currentPath === `/u/${encodeURIComponent(profile.username)}` || currentPath === `/u/${profile.username}` || currentPath === '/me'
                ? 'bg-[#E7EBDD] dark:bg-[#192B22]'
                : 'hover:bg-white/80 dark:hover:bg-[#161F1B]'
            }`}
            title="Profil Saya"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar
                src={profile.avatarUrl}
                alt={profile.displayName}
                name={profile.displayName}
                role={profile.role}
                className="w-8 h-8 rounded-full object-cover border border-[#E3E0D6] dark:border-[#26352E] shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                  {profile.displayName}
                </div>
                <div className="text-[10px] text-[#4F5A52] dark:text-[#8FA096] font-medium truncate">
                  {profile.role === 'admin'
                    ? (profile.verifiedAgency || 'Administrator')
                    : profile.isVerified
                    ? 'Warga Terverifikasi'
                    : (profile.district ? `Warga ${profile.district}` : 'Warga')}
                </div>
              </div>
            </div>
          </a>
        ) : (
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname !== '/login') {
                navigate('/login');
              }
            }}
            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-[#161F1B] border border-[#E3E0D6] dark:border-[#24322B] hover:border-[#1B4332]/40 dark:hover:border-[#10B981]/50 text-[#101913] dark:text-[#F3F6F4] transition-colors cursor-pointer group"
            title="Masuk ke Akun"
          >
            <div className="w-7 h-7 rounded-full bg-[#E7EBDD] dark:bg-[#192B22] text-[#1B4332] dark:text-[#34D399] flex items-center justify-center shrink-0">
              <LogIn className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                Masuk / Daftar Akun
              </div>
              <div className="text-[10px] text-[#4F5A52] dark:text-[#8FA096] font-medium truncate">
                Belum masuk sesi
              </div>
            </div>
          </a>
        )}
        <ThemeToggle className="shrink-0" />
      </div>
    </aside>
  );
};
