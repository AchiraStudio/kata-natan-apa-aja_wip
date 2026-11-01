import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/domain';
import { UserAvatar } from '../components/common/UserAvatar';
import {
  AdminOverview,
  AdminValidasi,
  AdminDisposisi,
  AdminAnggaran,
  AdminPengguna,
} from './admin';
import './AdminView.css';

type AdminSubRoute = 'overview' | 'validasi' | 'disposisi' | 'anggaran' | 'pengguna';

function getAdminSubroute(pathname: string): AdminSubRoute {
  if (pathname.startsWith('/admin/validasi')) return 'validasi';
  if (pathname.startsWith('/admin/disposisi')) return 'disposisi';
  if (pathname.startsWith('/admin/anggaran')) return 'anggaran';
  if (pathname.startsWith('/admin/pengguna')) return 'pengguna';
  return 'overview';
}

interface AdminConsoleInnerProps {
  profile: UserProfile;
}

const AdminConsoleInner: React.FC<AdminConsoleInnerProps> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSubRoute = getAdminSubroute(location.pathname);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#F7F5EF] dark:bg-[#131916] border-b border-[#E3E0D6] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 -ml-1 rounded-xl text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-[#E3E0D6]/60 dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            title="Kembali ke Beranda"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-[#101913] dark:text-[#F3F6F4]">
              admin
            </span>
            <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
              {activeSubRoute}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={'/u/' + encodeURIComponent(profile.username)}
            className="flex items-center"
            title={'Profil ' + profile.displayName}
          >
            <UserAvatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              name={profile.displayName}
              role={profile.role}
              className="w-7 h-7 rounded-full object-cover border border-[#1B4332]/30 dark:border-[#10B981]/40"
            />
          </Link>
        </div>
      </header>

      {/* Main Admin Console - 100vh Viewport Containment */}
      <main className="flex-1 h-screen min-h-0 overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-7xl space-y-6 pb-24 lg:pb-12 min-w-0">
        {activeSubRoute === 'overview' && <AdminOverview profile={profile} />}
        {activeSubRoute === 'validasi' && <AdminValidasi profile={profile} />}
        {activeSubRoute === 'disposisi' && <AdminDisposisi profile={profile} />}
        {activeSubRoute === 'anggaran' && <AdminAnggaran profile={profile} />}
        {activeSubRoute === 'pengguna' && <AdminPengguna profile={profile} />}
      </main>
    </>
  );
};

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0C100E] flex items-center justify-center text-xs font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Memeriksa hak akses admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#101913] dark:text-[#F3F6F4]">
            Akses Khusus Verifikator PUPR
          </h2>
          <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed">
            Portal Tinjauan admin memerlukan akun berwenang verifikator dinas.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              title="Masuk Akun Admin"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Masuk Akun admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminConsoleInner profile={profile} />;
};
