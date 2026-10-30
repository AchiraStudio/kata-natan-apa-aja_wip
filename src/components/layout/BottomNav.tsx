import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, MapPin, Plus, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openComposer, setActiveFeedTab } = useTitik();
  const { profile, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const lastScrollTop = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPath = location.pathname;

  // Listen to comments bottom sheet open/close to avoid overlaying input controls
  useEffect(() => {
    const handleCommentsToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open?: boolean }>;
      setIsCommentsSheetOpen(Boolean(customEvent.detail?.open));
    };

    window.addEventListener('titik-comments-toggle', handleCommentsToggle);
    return () => {
      window.removeEventListener('titik-comments-toggle', handleCommentsToggle);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;

      if (Math.abs(lastScrollTop.current - st) <= 10) return;

      if (st > lastScrollTop.current && st > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollTop.current = st <= 0 ? 0 : st;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom,16px))] left-1/2 -translate-x-1/2 z-40 lg:hidden grid grid-cols-5 items-center w-[92%] max-w-sm px-2 py-2 bg-[#20221D]/90 dark:bg-[#131916]/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 dark:border-[#26352E] text-white transition-all duration-300 ${
        isVisible && !isCommentsSheetOpen
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-28 opacity-0 pointer-events-none scale-95'
      }`}
    >
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          setActiveFeedTab('for_you');
          if (location.pathname !== '/') {
            navigate('/');
          } else {
            window.dispatchEvent(new CustomEvent('titik-scroll-top'));
          }
        }}
        className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </a>

      <a
        href="/explore"
        onClick={(e) => {
          e.preventDefault();
          if (location.pathname !== '/explore') navigate('/explore');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/explore' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </a>

      {/* Center Create Action (+) - strictly centered at column 3 */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => openComposer('post')}
          className="flex items-center justify-center -my-1 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#20221D] shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer"
          title="Buat Postingan atau Laporan"
          aria-label="Buat"
        >
          <Plus className="w-6 h-6 stroke-[2.8]" />
        </button>
      </div>

      <a
        href="/map"
        onClick={(e) => {
          e.preventDefault();
          if (location.pathname !== '/map') navigate('/map');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/map' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span>Peta</span>
      </a>

      {isAuthenticated ? (
        <a
          href={`/u/${profile.username}`}
          onClick={(e) => {
            e.preventDefault();
            const target = `/u/${profile.username}`;
            if (location.pathname !== target) navigate(target);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            currentPath === `/u/${profile.username}` || currentPath === '/me' || (profile.role === 'admin' && currentPath === '/admin')
              ? (currentPath === '/admin' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold')
              : 'text-white/70 hover:text-white'
          }`}
          title={
            profile.role === 'admin'
              ? (profile.verifiedAgency
                ? `Profil & Admin ${profile.verifiedAgency.toLowerCase().includes('pekerjaan umum') ? 'PUPR' : profile.verifiedAgency}`
                : 'Profil & Administrator')
              : 'Profil Saya'
          }
        >
          <div className="relative">
            <UserAvatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              name={profile.displayName}
              role={profile.role}
              className={`w-5 h-5 rounded-full object-cover border ${
                profile.role === 'admin' ? 'border-amber-400/80 ring-1 ring-amber-400/40' : 'border-white/30'
              }`}
            />
            {profile.role === 'admin' && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#20221D] dark:ring-[#131916]"
                title={
                  profile.verifiedAgency
                    ? `Akun Admin ${profile.verifiedAgency.toLowerCase().includes('pekerjaan umum') ? 'PUPR' : profile.verifiedAgency}`
                    : 'Akun Administrator'
                }
              />
            )}
          </div>
          <span className="truncate max-w-[50px] text-center">
            {currentPath === '/admin' ? 'Admin' : profile.displayName.split(' ')[0]}
          </span>
        </a>
      ) : (
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            if (location.pathname !== '/login') navigate('/login');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            currentPath === '/login' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
          }`}
          title="Masuk ke Akun"
        >
          <LogIn className="w-5 h-5" />
          <span>Masuk</span>
        </a>
      )}
    </nav>
  );
};
