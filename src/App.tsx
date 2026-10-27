import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitikProvider } from './context/TitikContext';
import { AuthProvider } from './context/AuthContext';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';

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

const AuthenticatedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
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

const MeRedirect: React.FC = () => {
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

const AdminOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#686B65]">
        Memeriksa akses...
      </div>
    );
  }

  return isAuthenticated && profile.role === 'admin'
    ? children
    : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TitikProvider>
          <BrowserRouter>
            <React.Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomeView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/daftar" element={<RegisterView />} />
              <Route path="/register" element={<Navigate to="/daftar" replace />} />
              <Route path="/masuk" element={<Navigate to="/login" replace />} />
              <Route path="/alur" element={<WorkflowView />} />
              <Route path="/workflow" element={<Navigate to="/alur" replace />} />
              <Route path="/report/:id" element={<ReportDetailView />} />
              <Route path="/laporan/:id" element={<ReportDetailView />} />
              <Route path="/explore" element={<ExploreView />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/track" element={<TrackReportView />} />
              <Route path="/u/:username" element={<ProfileView />} />
              <Route path="/me" element={<MeRedirect />} />
              <Route path="/post/:id" element={<PostDetailView />} />
              <Route path="/postingan/:id" element={<PostDetailView />} />

              {/* Protected Routes */}
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </React.Suspense>

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
