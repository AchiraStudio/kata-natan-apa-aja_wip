import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, MapPin, Plus, LogIn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

/**
 * Mobile navigation. Floats over the video feed and map, so it is one of the few
 * places that earns a glass surface. Hides while a sheet or a message thread is open.
 */
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
  // The inbox keeps the bar (so you can always leave); an open thread hides it to free the composer
  const params = new URLSearchParams(location.search);
  const isMessagesOnMobile =
    currentPath.startsWith('/pesan') && ['conversation_id', 'report_id', 'new_chat'].some((k) => params.has(k));

  // Comments sheet announces itself so the bar never covers the reply input
  useEffect(() => {
    const handleCommentsToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open?: boolean }>;
      setIsCommentsSheetOpen(Boolean(customEvent.detail?.open));
    };
    window.addEventListener('titik-comments-toggle', handleCommentsToggle);
    return () => window.removeEventListener('titik-comments-toggle', handleCommentsToggle);
  }, []);

  // On scrolling pages the bar tucks away while reading downward and returns on pause
  useEffect(() => {
    const handleScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(lastScrollTop.current - st) <= 10) return;
      setIsVisible(!(st > lastScrollTop.current && st > 60));
      lastScrollTop.current = st <= 0 ? 0 : st;
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setIsVisible(true), 1500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const go = (href: string) => {
    if (location.pathname !== href) navigate(href);
  };

  const tab = (href: string, label: string, Icon: LucideIcon, active: boolean, onClick?: () => void) => (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        else go(href);
      }}
      className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl text-[11px] font-medium transition-colors ${
        active ? 'text-brand font-semibold' : 'text-ink-2 hover:text-ink'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 2.3 : 1.8} />
      <span>{label}</span>
    </a>
  );

  const profileHref = `/u/${encodeURIComponent(profile.username)}`;
  const profileActive =
    currentPath === profileHref ||
    currentPath === `/u/${profile.username}` ||
    currentPath === '/me' ||
    (profile.role === 'admin' && currentPath.startsWith('/admin'));

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className={`glass-strong fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,12px))] left-3 right-3 mx-auto z-40 lg:hidden grid grid-cols-5 items-center max-w-md px-1.5 py-1.5 rounded-2xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] transition-all duration-300 ${
        isVisible && !isCommentsSheetOpen && !isMessagesOnMobile
          ? 'translate-y-0 opacity-100'
          : 'translate-y-28 opacity-0 pointer-events-none'
      }`}
    >
      {tab('/', 'Beranda', Home, currentPath === '/', () => {
        setActiveFeedTab('for_you');
        if (location.pathname !== '/') navigate('/');
        else window.dispatchEvent(new CustomEvent('titik-scroll-top'));
      })}

      {tab('/explore', 'Explore', Compass, currentPath === '/explore')}

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => openComposer('post')}
          className="flex items-center justify-center w-12 h-10 rounded-xl bg-brand text-on-brand active:scale-95 transition-transform cursor-pointer"
          title="Buat Postingan atau Laporan"
          aria-label="Buat"
        >
          <Plus className="w-5 h-5" strokeWidth={2.8} />
        </button>
      </div>

      {tab('/map', 'Peta', MapPin, currentPath === '/map')}

      {isAuthenticated ? (
        <a
          href={profileHref}
          onClick={(e) => {
            e.preventDefault();
            go(profileHref);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl text-[11px] font-medium transition-colors ${
            profileActive
              ? currentPath.startsWith('/admin')
                ? 'text-amber-400 font-bold'
                : 'text-brand font-semibold'
              : 'text-ink-2 hover:text-ink'
          }`}
          title={profile.role === 'admin' ? 'Profil & admin' : 'Profil Saya'}
        >
          <div className="relative">
            <UserAvatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              name={profile.displayName}
              role={profile.role}
              className={`w-5 h-5 rounded-full object-cover ${
                profile.role === 'admin' ? 'ring-1 ring-amber-400/70' : ''
              }`}
            />
            {profile.role === 'admin' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-surface" title="Akun admin" />
            )}
          </div>
          <span className="truncate max-w-[56px] text-center">
            {currentPath.startsWith('/admin') ? 'admin' : profile.displayName.split(' ')[0]}
          </span>
        </a>
      ) : (
        tab('/login', 'Masuk', LogIn, currentPath === '/login')
      )}
    </nav>
  );
};
