import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  Bookmark,
  FileText,
  Plus,
  Search,
  ShieldAlert,
  LogIn,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  Building2,
  Landmark,
  Users,
  MessageSquare,
  Route as RouteIcon,
  ScanSearch,
  Palette,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { TitikLogo } from '../common/TitikLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserAvatar } from '../common/UserAvatar';
import { getStatusMeta } from '../../utils/reportStatus';

interface SidebarProps {
  currentPath?: string;
}

interface NavEntry {
  label: string;
  /** One-line explanation shown under the label or in the sidebar tooltip. */
  hint?: string;
  title?: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
  unread?: boolean;
  onSelect?: () => void;
}

/** Pages that show the wide sidebar: the feed, Jelajah, Laporan Saya, Tersimpan and every profile. */
const WIDE_EXACT = ['/', '/explore', '/laporan-saya', '/tersimpan', '/me'];
const WIDE_PREFIXES = ['/u/', '/profile/'];
export const isWideSidebarPath = (path: string) => WIDE_EXACT.includes(path) || WIDE_PREFIXES.some((prefix) => path.startsWith(prefix));

/**
 * Persistent navigation on a deep forest surface, the brand anchor in both themes.
 * Icon rail from `lg`, labelled column from `xl`. On the wide pages the column doubles
 * at 2xl and uses the room for a hint under each destination plus a live city summary.
 */
export const Sidebar: React.FC<SidebarProps> = ({ currentPath: propPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = propPath || location.pathname;
  const isWide = isWideSidebarPath(currentPath);

  const { profile, isAuthenticated } = useAuth();
  const { openReportModal, setActiveFeedTab, setSearchModalOpen, unreadMessagesCount, posts } = useTitik();

  const isAdminRoute = currentPath.startsWith('/admin');
  const [sidebarTooltip, setSidebarTooltip] = React.useState<{
    label: string;
    hint: string;
    top: number;
    left: number;
  } | null>(null);
  const [manualOpen, setManualOpen] = React.useState<boolean | null>(null);
  const [lastAdminRoute, setLastAdminRoute] = React.useState(isAdminRoute);

  // Synchronize state during render when entering/leaving admin routes (React 19 pattern)
  if (lastAdminRoute !== isAdminRoute) {
    setLastAdminRoute(isAdminRoute);
    setManualOpen(null);
  }
  const isAdminOpen = manualOpen ?? isAdminRoute;

  const go = (href: string) => {
    if (location.pathname !== href) navigate(href);
  };

  // Real numbers only: counted from the reports already loaded for the feed
  const summary = useMemo(() => {
    const seen = new Map<string, string>();
    (posts ?? []).forEach((p) => {
      if (p.relatedReport && !seen.has(p.relatedReport.id)) seen.set(p.relatedReport.id, p.relatedReport.status);
    });
    const counts = { baru: 0, ditindak: 0, tuntas: 0, ditolak: 0 };
    seen.forEach((status) => {
      counts[getStatusMeta(status).tone] += 1;
    });
    return { total: seen.size, ...counts };
  }, [posts]);

  const navItems: NavEntry[] = [
    {
      label: 'Beranda',
      hint: 'Linimasa laporan warga',
      icon: Home,
      href: '/',
      active: currentPath === '/',
      onSelect: () => {
        setActiveFeedTab('for_you');
        if (location.pathname !== '/') navigate('/');
        else window.dispatchEvent(new CustomEvent('titik-scroll-top'));
      },
    },
    { label: 'Jelajah', hint: 'Statistik dan daftar laporan', title: 'Jelajah sektor', icon: Compass, href: '/explore', active: currentPath === '/explore' },
    { label: 'Peta', hint: 'Sebaran laporan dari pengguna', title: 'Peta laporan', icon: MapPin, href: '/map', active: currentPath === '/map' },
    {
      label: 'Pesan',
      hint: 'Percakapan dengan warga dan petugas',
      icon: MessageSquare,
      href: '/pesan',
      unread: (unreadMessagesCount ?? 0) > 0,
      active: currentPath.startsWith('/pesan'),
    },
    { label: 'Tersimpan', hint: 'Laporan yang Anda tandai', title: 'Laporan tersimpan', icon: Bookmark, href: '/tersimpan', active: currentPath === '/tersimpan' },
    ...(isAuthenticated
      ? [{ label: 'Laporan Saya', hint: 'Pantau status laporan Anda', icon: FileText, href: '/laporan-saya', active: currentPath === '/laporan-saya' }]
      : []),
  ];

  const utilityLinks: NavEntry[] = [
    { label: 'Lacak Laporan', hint: 'Cari laporan dan pantau statusnya', title: 'Lacak status laporan', icon: ScanSearch, href: '/track', active: currentPath === '/track' },
    { label: 'Alur Penanganan', hint: 'Pelajari proses tindak lanjut laporan', title: 'Alur penanganan laporan', icon: RouteIcon, href: '/alur', active: currentPath === '/alur' },
  ];

  const adminSubRoutes: NavEntry[] = [
    {
      label: 'Ringkasan',
      title: 'Ringkasan dan metrik kerja',
      href: '/admin',
      icon: LayoutDashboard,
      active: currentPath === '/admin' || currentPath === '/admin/overview',
    },
    { label: 'Antrean Validasi', title: 'Antrean validasi dan verifikasi bukti', href: '/admin/validasi', icon: CheckCircle2, active: currentPath === '/admin/validasi' },
    { label: 'Disposisi Dinas', title: 'Disposisi dan rute dinas', href: '/admin/disposisi', icon: Building2, active: currentPath === '/admin/disposisi' },
    { label: 'Rekap APBD', title: 'Rekap APBD dan audit anggaran', href: '/admin/anggaran', icon: Landmark, active: currentPath === '/admin/anggaran' },
    { label: 'Pengguna', title: 'Manajemen warga dan hak akses', href: '/admin/pengguna', icon: Users, active: currentPath === '/admin/pengguna' },
  ];

  const linkClass = (active: boolean, size: 'md' | 'sm') =>
    `group relative flex items-center gap-3 rounded-lg transition-colors duration-150 justify-center xl:justify-start ${
      size === 'md' ? (isWide ? 'h-11 2xl:h-[58px] px-3.5 2xl:px-4' : 'h-11 px-3.5') : 'h-9 px-3.5'
    } ${
      active
        ? 'bg-white/14 text-side-ink font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
        : 'text-side-ink-2 font-medium hover:bg-white/8 hover:text-side-ink'
    }`;

  const renderLink = (item: NavEntry, size: 'md' | 'sm' = 'md') => {
    const Icon = item.icon;
    const showHint = isWide && size === 'md' && item.hint;
    const tooltipHint = item.hint || item.title;
    const showTooltip = (element: HTMLAnchorElement) => {
      if (!tooltipHint) return;
      const bounds = element.getBoundingClientRect();
      setSidebarTooltip({
        label: item.label,
        hint: tooltipHint,
        top: Math.max(48, Math.min(bounds.top + bounds.height / 2, window.innerHeight - 48)),
        left: Math.max(12, Math.min(bounds.right + 12, window.innerWidth - 260)),
      });
    };
    return (
      <a
        key={item.href}
        href={item.href}
        aria-label={tooltipHint ? `${item.label}. ${tooltipHint}` : item.label}
        aria-current={item.active ? 'page' : undefined}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setSidebarTooltip(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setSidebarTooltip(null)}
        onClick={(e) => {
          e.preventDefault();
          if (item.onSelect) item.onSelect();
          else go(item.href);
        }}
        className={`${linkClass(item.active, size)} cursor-pointer text-sm`}
      >
        <span className="relative shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95">
          <Icon
            className={`${isWide && size === 'md' ? 'w-[18px] h-[18px] 2xl:w-5 2xl:h-5' : 'w-[18px] h-[18px]'} ${item.active ? 'text-lime' : ''}`}
            strokeWidth={item.active ? 2.2 : 1.8}
          />
          {item.unread && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-lime ring-2 ring-side" />}
        </span>
        <span className="hidden xl:flex flex-col min-w-0 leading-tight">
          <span className={`truncate ${isWide && size === 'md' ? '2xl:text-[15px]' : ''}`}>{item.label}</span>
          {showHint && <span className="hidden 2xl:block truncate text-xs font-normal text-side-ink-2">{item.hint}</span>}
        </span>
      </a>
    );
  };

  const isOwnProfile =
    currentPath === `/u/${encodeURIComponent(profile.username)}` ||
    currentPath === `/u/${profile.username}` ||
    currentPath === '/me';

  const widthClass = isWide ? 'w-[76px] xl:w-[320px] 2xl:w-[496px]' : 'w-[76px] xl:w-[248px]';
  const padClass = isWide ? 'px-3 xl:px-6 2xl:px-12' : 'px-3 xl:px-4';

  return (
    <aside
      aria-label="Sidebar"
      className={`${widthClass} ${padClass} shrink-0 hidden lg:flex flex-col justify-between sticky top-3 h-[calc(100dvh-1.5rem)] m-3 mr-0 py-5 rounded-3xl bg-side text-side-ink border border-side-line backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_48px_-24px_rgba(0,0,0,0.6)] select-none z-30 print:hidden transition-[width] duration-200`}
    >
      <div className="space-y-6 overflow-y-auto no-scrollbar min-h-0">
        {/* Brand */}
        <a
          href="/"
          title="TITIK. Beranda"
          onClick={(e) => {
            e.preventDefault();
            setActiveFeedTab('for_you');
            if (location.pathname !== '/') navigate('/');
            else window.dispatchEvent(new CustomEvent('titik-scroll-top'));
          }}
          className="flex items-center justify-center xl:justify-start gap-2.5 h-10 xl:px-1.5 cursor-pointer"
        >
          <TitikLogo className="w-8 h-8 shrink-0" pinColor="#5fc785" innerColor="#0f2a1b" dotColor="#eaf3e2" />
          <span className={`hidden xl:flex items-baseline font-display font-extrabold tracking-tight text-side-ink ${isWide ? 'text-[22px] 2xl:text-[28px]' : 'text-[22px]'}`}>
            TITIK<span className="text-brand">.</span>
          </span>
        </a>

        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          aria-label="Cari laporan atau dinas"
          title="Cari laporan atau dinas (Ctrl K)"
          className="w-full h-10 flex items-center justify-center xl:justify-between gap-2 px-3 rounded-lg bg-white/8 text-side-ink-2 hover:text-side-ink hover:bg-white/12 border border-side-line transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline text-sm truncate">Cari</span>
          </span>
          <kbd className="hidden xl:inline shrink-0 whitespace-nowrap px-1.5 py-0.5 text-[10px] font-mono text-side-ink-2 border border-side-line rounded">Ctrl K</kbd>
        </button>

        {/* Primary navigation */}
        <nav className="space-y-1" aria-label="Navigasi utama">
          {navItems.map((item) => renderLink(item))}
        </nav>

        {/* Primary action */}
        <button
          type="button"
          onClick={openReportModal}
          aria-label="Buat laporan warga"
          title="Buat laporan warga"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-lime text-on-lime text-sm font-bold hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={2.6} />
          <span className="hidden xl:inline">Buat Laporan</span>
        </button>

        {/* Live city summary: only on the wide pages, only when real reports are loaded */}
        {isWide && summary.total > 0 && (
          <section aria-label="Ringkasan status laporan" className="hidden 2xl:block rounded-2xl bg-white/6 border border-side-line p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-side-ink-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-lime titik-live" />
                langsung
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  ['Menunggu', summary.baru],
                  ['Ditindak', summary.ditindak],
                  ['Tuntas', summary.tuntas],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dd className="font-display text-2xl font-bold text-side-ink tabular-nums">{value}</dd>
                  <dt className="text-[11px] text-side-ink-2">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${summary.tuntas} dari ${summary.total} laporan tuntas`}>
              <span className="bg-lime" style={{ width: `${(summary.tuntas / summary.total) * 100}%` }} />
              <span className="bg-lime/45" style={{ width: `${(summary.ditindak / summary.total) * 100}%` }} />
            </div>
          </section>
        )}

        {/* Secondary */}
        <div className="pt-4 border-t border-side-line space-y-1">
          {utilityLinks.map((item) => renderLink(item, 'sm'))}

          {isAuthenticated && profile.role === 'admin' && (
            <div className="pt-1 space-y-1">
              <div className={`flex items-center rounded-lg ${isAdminRoute ? 'bg-white/12 text-side-ink font-semibold' : 'text-side-ink-2 hover:bg-white/7 hover:text-side-ink'}`}>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    setManualOpen(true);
                    go('/admin');
                  }}
                  className="flex items-center justify-center xl:justify-start gap-3 flex-1 min-w-0 h-9 px-3.5 text-sm cursor-pointer"
                  title="Portal admin Dinas PUPR"
                >
                  <ShieldAlert className="w-[18px] h-[18px] text-lime shrink-0" strokeWidth={1.9} />
                  <span className="hidden xl:inline truncate">Portal admin</span>
                </a>
                <div className="hidden xl:flex items-center gap-1.5 shrink-0 pr-1.5">
                  <button
                    type="button"
                    onClick={() => setManualOpen(!isAdminOpen)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-inherit cursor-pointer"
                    aria-label={isAdminOpen ? 'Tutup sub-menu admin' : 'Buka sub-menu admin'}
                    aria-expanded={isAdminOpen}
                    aria-controls="admin-subroutes-panel"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {isAdminOpen && (
                <div id="admin-subroutes-panel" role="group" aria-label="Sub-menu Portal admin" className="space-y-0.5 xl:ml-4 xl:pl-2 xl:border-l xl:border-side-line">
                  {adminSubRoutes.map((item) => renderLink(item, 'sm'))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="pt-3 mt-3 border-t border-side-line flex flex-col xl:flex-row items-center gap-2">
        {isAuthenticated && profile.id !== 'usr-anon-00' ? (
          <a
            href={`/u/${encodeURIComponent(profile.username)}`}
            onClick={(e) => {
              e.preventDefault();
              go(`/u/${encodeURIComponent(profile.username)}`);
            }}
            className={`flex min-w-0 xl:flex-1 items-center justify-center xl:justify-start gap-2.5 p-1.5 xl:px-2 rounded-lg transition-colors cursor-pointer ${isOwnProfile ? 'bg-white/12' : 'hover:bg-white/7'}`}
            title="Profil Saya"
          >
            <UserAvatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              name={profile.displayName}
              role={profile.role}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <span className="hidden xl:block min-w-0">
              <span className="block text-[13px] font-semibold text-side-ink truncate">{profile.displayName}</span>
              <span className="block text-[11px] text-side-ink-2 truncate">
                {profile.role === 'admin'
                  ? 'admin'
                  : profile.isVerified
                  ? 'Warga Terverifikasi'
                  : profile.district
                  ? `Warga ${profile.district}`
                  : 'Warga'}
              </span>
            </span>
          </a>
        ) : (
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              go('/login');
            }}
            className="flex min-w-0 xl:flex-1 items-center justify-center xl:justify-start gap-2.5 h-10 px-2.5 rounded-lg bg-lime text-on-lime font-bold text-sm hover:brightness-105 transition cursor-pointer"
            title="Masuk ke akun"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline truncate">Masuk atau Daftar</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('titik-open-custom-bg', { detail: { target: 'global' } }))}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-side-ink-2 hover:text-side-ink hover:bg-side-2 transition-colors cursor-pointer shrink-0"
          title="Kustomisasi Latar Belakang"
          aria-label="Kustomisasi Latar Belakang"
        >
          <Palette className="w-[18px] h-[18px]" />
        </button>
        <ThemeToggle variant="side" className="shrink-0" />
      </div>
      {sidebarTooltip && (
        <div
          role="tooltip"
          className="fixed z-[100] w-60 -translate-y-1/2 rounded-xl border border-side-line bg-side px-3.5 py-2.5 text-side-ink shadow-xl backdrop-blur-xl pointer-events-none"
          style={{ top: sidebarTooltip.top, left: sidebarTooltip.left }}
        >
          <span className="block text-sm font-semibold">{sidebarTooltip.label}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-side-ink-2">{sidebarTooltip.hint}</span>
        </div>
      )}
    </aside>
  );
};
