import React from 'react';
import { useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types/domain';
import { AdminOverview, AdminValidasi, AdminDisposisi, AdminAnggaran, AdminPengguna } from './admin';

type AdminSubRoute = 'overview' | 'validasi' | 'disposisi' | 'anggaran' | 'pengguna';

const SECTIONS: Array<{ key: AdminSubRoute; to: string; label: string }> = [
  { key: 'overview', to: '/admin', label: 'Ringkasan' },
  { key: 'validasi', to: '/admin/validasi', label: 'Validasi' },
  { key: 'disposisi', to: '/admin/disposisi', label: 'Disposisi' },
  { key: 'anggaran', to: '/admin/anggaran', label: 'Rekap APBD' },
  { key: 'pengguna', to: '/admin/pengguna', label: 'Pengguna' },
];

function getAdminSubroute(pathname: string): AdminSubRoute {
  if (pathname.startsWith('/admin/validasi')) return 'validasi';
  if (pathname.startsWith('/admin/disposisi')) return 'disposisi';
  if (pathname.startsWith('/admin/anggaran')) return 'anggaran';
  if (pathname.startsWith('/admin/pengguna')) return 'pengguna';
  return 'overview';
}

const AdminConsoleInner: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = getAdminSubroute(location.pathname);

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <header className="shrink-0 bg-surface border-b md:border border-line-soft md:mx-3 md:mt-3 md:rounded-3xl md:overflow-hidden md:shadow-[var(--glass-shadow)]">
        <div className="flex items-center gap-3 px-4 lg:px-8 h-14">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="lg:hidden w-9 h-9 -ml-2 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer"
            title="Kembali ke beranda"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-ink">Portal admin</h1>
          <Link to={`/u/${encodeURIComponent(profile.username)}`} className="ml-auto text-xs text-ink-3 hover:text-ink truncate max-w-[50%]" title={`Profil ${profile.displayName}`}>
            {profile.displayName}
          </Link>
        </div>
        <nav aria-label="Bagian portal admin" className="flex gap-1 overflow-x-auto no-scrollbar px-3 lg:px-7">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.key}
              to={s.to}
              end={s.key === 'overview'}
              aria-current={active === s.key ? 'page' : undefined}
              className={`shrink-0 px-3.5 h-11 inline-flex items-center text-sm border-b-2 transition-colors ${
                active === s.key ? 'border-brand text-ink font-semibold' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="titik-rise flex-1 h-screen min-h-0 overflow-y-auto p-4 lg:p-8 w-full max-w-[1560px] min-w-0 pb-28 lg:pb-12">
        {active === 'overview' && <AdminOverview profile={profile} />}
        {active === 'validasi' && <AdminValidasi profile={profile} />}
        {active === 'disposisi' && <AdminDisposisi profile={profile} />}
        {active === 'anggaran' && <AdminAnggaran profile={profile} />}
        {active === 'pengguna' && <AdminPengguna profile={profile} />}
      </main>
    </div>
  );
};

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-sm text-ink-2" role="status">
        <span className="inline-block w-2 h-2 mr-2 rounded-full bg-brand titik-live" />
        Memeriksa hak akses admin
      </div>
    );
  }

  if (!isAuthenticated || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full panel p-6 sm:p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">Akses Khusus Verifikator PUPR</h2>
          <p className="text-sm text-ink-2 leading-relaxed">Portal admin memerlukan akun petugas yang berwenang.</p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={() => navigate('/')} className="flex-1 h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors cursor-pointer">
              Kembali ke beranda
            </button>
            <button type="button" onClick={() => navigate('/login')} title="Masuk akun admin" className="flex-1 h-10 px-4 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover transition-colors cursor-pointer">
              Masuk akun admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminConsoleInner profile={profile} />;
};
