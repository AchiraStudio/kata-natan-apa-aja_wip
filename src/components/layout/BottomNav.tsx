import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, Plus, MapPin } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { openReportModal } = useTitik();
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = (scrollTop: number) => {
      const delta = scrollTop - lastScrollTop.current;

      // Scrolling down by more than 10px -> hide floating nav
      if (delta > 10 && scrollTop > 30) {
        setIsVisible(false);
      } else if (delta < -10 || scrollTop <= 15) {
        // Scrolling up or near top -> reveal floating nav
        setIsVisible(true);
      }

      lastScrollTop.current = scrollTop;

      // Auto-reveal after scrolling stops
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
    };

    const onWindowScroll = () => handleScroll(window.scrollY);

    const onElementScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.scrollTop === 'number') {
        handleScroll(target.scrollTop);
      }
    };

    const onScreenTap = () => {
      setIsVisible(true);
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('scroll', onElementScroll, { capture: true, passive: true });
    window.addEventListener('touchstart', onScreenTap, { passive: true });

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener('scroll', onElementScroll, { capture: true });
      window.removeEventListener('touchstart', onScreenTap);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <nav
      className={`lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[340px] rounded-full bg-[#20221D]/85 backdrop-blur-xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.35)] px-4 py-2 flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto scale-100'
          : 'translate-y-24 opacity-0 pointer-events-none scale-95'
      }`}
    >
      <a
        href="/"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </a>

      <a
        href="/explore"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/explore' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </a>

      {/* Center Report Action (+) */}
      <button
        type="button"
        onClick={openReportModal}
        className="flex items-center justify-center -my-1 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#20221D] shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer"
        title="Laporkan Masalah"
      >
        <Plus className="w-6 h-6 stroke-[2.8]" />
      </button>

      <a
        href="/map"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/map' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span>Peta</span>
      </a>

      <a
        href="/login"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentPath === '/login' ? 'text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
        }`}
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
