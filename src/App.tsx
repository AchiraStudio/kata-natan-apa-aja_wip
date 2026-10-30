import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { TitikProvider } from './context/TitikContext';
import { AuthProvider } from './context/AuthContext';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { AppLayout } from './components/layout/AppLayout';

const ExploreView = React.lazy(() => import('./views/ExploreView').then((m) => ({ default: m.ExploreView })));
const RegisterView = React.lazy(() => import('./views/RegisterView').then((m) => ({ default: m.RegisterView })));
const MapView = React.lazy(() => import('./views/MapView').then((m) => ({ default: m.MapView })));
const TrackReportView = React.lazy(() => import('./views/TrackReportView').then((m) => ({ default: m.TrackReportView })));
const AdminView = React.lazy(() => import('./views/AdminView').then((m) => ({ default: m.AdminView })));
const WorkflowView = React.lazy(() => import('./views/WorkflowView').then((m) => ({ default: m.WorkflowView })));
const ReportDetailView = React.lazy(() => import('./views/ReportDetailView').then((m) => ({ default: m.ReportDetailView })));
const MyReportsView = React.lazy(() => import('./views/MyReportsView').then((m) => ({ default: m.MyReportsView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then((m) => ({ default: m.ProfileView })));
const PostDetailView = React.lazy(() => import('./views/PostDetailView').then((m) => ({ default: m.PostDetailView })));

const PageFallback: React.FC = () => (
  <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0A100D] flex items-center justify-center text-xs font-semibold text-[#686B65] dark:text-[#9EACA3]">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[#263F35] dark:bg-[#34D399] animate-pulse" />
      <span>Memuat halaman...</span>
    </div>
  </div>
);
import { CreateModal } from './components/composer/CreateModal';
import { ReportDetailDrawer } from './components/reporting/ReportDetailDrawer';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from './context/AuthContext';

export const AuthenticatedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#686B65]">
        Memeriksa sesi...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const MeRedirect: React.FC = () => {
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#686B65]">
        Memeriksa sesi...
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to={`/u/${profile.username}`} replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

export const AdminOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0C100E] flex items-center justify-center text-xs font-semibold text-[#686B65] dark:text-[#9EACA3]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Memeriksa akses admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#20221D] dark:text-[#F3F6F4]">
            Akses Khusus Verifikator PUPR
          </h2>
          <p className="text-xs text-[#686B65] dark:text-[#9EACA3] leading-relaxed">
            Halaman ini khusus untuk verifikator resmi Dinas PUPR. Akun Anda saat ini terdaftar sebagai{' '}
            <strong className="text-[#20221D] dark:text-[#F3F6F4]">{profile.displayName}</strong> (@{profile.username}) dengan peran warga.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="/"
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] transition-colors text-center"
            >
              Kembali ke Beranda
            </a>
            <a
              href="/login"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs text-center"
            >
              Ganti Akun Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/daftar" element={<RegisterView />} />
        <Route path="/register" element={<Navigate to="/daftar" replace />} />
        <Route path="/masuk" element={<Navigate to="/login" replace />} />
        <Route path="/workflow" element={<Navigate to="/alur" replace />} />
        <Route path="/me" element={<MeRedirect />} />

        {/* Shared shell: Sidebar and BottomNav render once for every page below */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/alur" element={<WorkflowView />} />
          <Route path="/report/:id" element={<ReportDetailView />} />
          <Route path="/laporan/:id" element={<ReportDetailView />} />
          <Route path="/explore" element={<ExploreView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/track" element={<TrackReportView />} />
          <Route path="/u/:username" element={<ProfileView />} />
          <Route path="/profile/:username" element={<ProfileView />} />
          <Route path="/post/:id" element={<PostDetailView />} />
          <Route path="/postingan/:id" element={<PostDetailView />} />
          <Route
            path="/laporan-saya"
            element={
              <AuthenticatedRoute>
                <MyReportsView />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminOnlyRoute>
                <AdminView />
              </AdminOnlyRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TitikProvider>
          <BrowserRouter>
            <AppRoutes />
            {/* Global Overlays & Modals */}
            <CreateModal />
            <ReportDetailDrawer />
            <GlobalSearchModal />
          </BrowserRouter>
        </TitikProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
