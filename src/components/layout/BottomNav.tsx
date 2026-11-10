import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, MapPin, Plus, LogIn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

/** The slot every destination shares: a rounded indicator that fills when its page is open. */
const INDICATOR =
  'flex items-center justify-center w-14 h-8 rounded-xl transition-[background-color,color,box-shadow] duration-200';
const INDICATOR_ACTIVE = 'bg-lime text-on-lime shadow-[0_6px_14px_-6px_rgba(0,0,0,0.45)]';
const INDICATOR_IDLE = 'text-ink-2 group-hover:bg-surface-2 group-hover:text-ink';

const TAB_BASE = 'group flex flex-col items-center justify-center gap-1 h-[3.75rem] rounded-2xl text-[11px] leading-none';

/**
 * Mobile navigation. Floats over the video feed and map, so it is one of the few
 * places that earns a glass surface. Hides while a sheet or a message thread is open.
 * The open page is marked three ways (filled lime indicator, heavier icon, bold label)
 * so it reads at a glance, even over a bright video frame.
 */
export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openReportModal, setActiveFeedTab } = useTitik();
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
      className={`${TAB_BASE} ${active ? 'text-ink font-bold' : 'text-ink-2 font-medium hover:text-ink'}`}
    >
      <span className={`${INDICATOR} ${active ? INDICATOR_ACTIVE : INDICATOR_IDLE}`}>
        <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.5 : 1.8} />
      </span>
      <span>{label}</span>
    </a>
  );

  const profileHref = `/u/${encodeURIComponent(profile.username)}`;
  const profileActive =
    currentPath === profileHref ||
    currentPath === `/u/${profile.username}` ||
    currentPath === '/me' ||
    (profile.role === 'admin' && currentPath.startsWith('/admin'));
  const isAdminArea = currentPath.startsWith('/admin');

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className={`glass-strong fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,12px))] left-3 right-3 mx-auto z-40 lg:hidden grid grid-cols-5 items-center max-w-md px-1.5 py-1.5 rounded-3xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] transition-all duration-300 ${
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

      {/* Create is an action, not a place: a raised key that breaks the bar's top edge */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={openReportModal}
          className="-translate-y-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-on-brand border border-white/25 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.6)] active:scale-95 transition-transform cursor-pointer"
          title="Buat laporan warga"
          aria-label="Buat"
        >
          <Plus className="w-6 h-6" strokeWidth={2.8} />
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
          aria-current={profileActive ? 'page' : undefined}
          className={`${TAB_BASE} ${
            profileActive
              ? isAdminArea
                ? 'text-amber-400 font-bold'
                : 'text-ink font-bold'
              : 'text-ink-2 font-medium hover:text-ink'
          }`}
          title={profile.role === 'admin' ? 'Profil & admin' : 'Profil Saya'}
        >
          <span
            className={`${INDICATOR} ${
              profileActive
                ? isAdminArea
                  ? 'bg-amber-400/25 ring-1 ring-amber-400/60'
                  : INDICATOR_ACTIVE
                : 'group-hover:bg-surface-2'
            }`}
          >
            <span className="relative">
              <UserAvatar
                src={profile.avatarUrl}
                alt={profile.displayName}
                name={profile.displayName}
                role={profile.role}
                className={`w-[22px] h-[22px] rounded-full object-cover ${
                  profile.role === 'admin' ? 'ring-1 ring-amber-400/70' : ''
                }`}
              />
              {profile.role === 'admin' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-surface" title="Akun admin" />
              )}
            </span>
          </span>
          <span className="truncate max-w-[60px] text-center">
            {isAdminArea ? 'admin' : profile.displayName.split(' ')[0]}
          </span>
        </a>
      ) : (
        tab('/login', 'Masuk', LogIn, currentPath === '/login')
      )}
    </nav>
  );
};
