import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, MapPin, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openComposer, setActiveFeedTab } = useTitik();
  const { profile, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPath = location.pathname;

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
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom,16px))] left-1/2 -translate-x-1/2 z-40 lg:hidden flex items-center justify-around w-[92%] max-w-sm px-4 py-2 bg-[#20221D]/90 dark:bg-[#131916]/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 dark:border-[#26352E] text-white transition-all duration-300 ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-24 opacity-0 pointer-events-none scale-95'
      }`}
    >
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          setActiveFeedTab('for_you');
          if (location.pathname !== '/') navigate('/');
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
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
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/explore' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </a>

      {/* Center Create Action (+) */}
      <button
        type="button"
        onClick={() => openComposer('post')}
        className="flex items-center justify-center -my-1 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#20221D] shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer"
        title="Buat Postingan atau Laporan"
        aria-label="Buat"
      >
        <Plus className="w-6 h-6 stroke-[2.8]" />
      </button>

      <a
        href="/map"
        onClick={(e) => {
          e.preventDefault();
          if (location.pathname !== '/map') navigate('/map');
        }}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/map' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span>Peta</span>
      </a>

      <a
        href={isAuthenticated ? `/u/${profile.username}` : '/login'}
        onClick={(e) => {
          e.preventDefault();
          const target = isAuthenticated ? `/u/${profile.username}` : '/login';
          if (location.pathname !== target) navigate(target);
        }}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          (isAuthenticated && (currentPath === `/u/${profile.username}` || currentPath === '/me')) ||
          (!isAuthenticated && currentPath === '/login')
            ? 'text-emerald-400 font-bold'
            : 'text-white/70 hover:text-white'
        }`}
        title={isAuthenticated ? 'Profil Saya' : 'Masuk'}
      >
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="w-5 h-5 rounded-full object-cover border border-white/30"
        />
        <span className="truncate max-w-[46px]">{profile.displayName.split(' ')[0]}</span>
      </a>
    </nav>
  );
};
