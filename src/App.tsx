import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitikProvider } from './context/TitikContext';
import { AuthProvider } from './context/AuthContext';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { MapView } from './views/MapView';
import { TrackReportView } from './views/TrackReportView';
import { AdminView } from './views/AdminView';
import { WorkflowView } from './views/WorkflowView';
import { ReportDetailView } from './views/ReportDetailView';
import { LoginView } from './views/LoginView';
import { MyReportsView } from './views/MyReportsView';
import { ReportModal } from './components/reporting/ReportModal';
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
            <Routes>
              {/* Public Routes: Civic feed, Map, Public Reports, Alur, and Anonymous Tracking */}
              <Route path="/" element={<HomeView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/masuk" element={<Navigate to="/login" replace />} />
              <Route path="/alur" element={<WorkflowView />} />
              <Route path="/workflow" element={<Navigate to="/alur" replace />} />
              <Route path="/report/:id" element={<ReportDetailView />} />
              <Route path="/laporan/:id" element={<ReportDetailView />} />
              <Route path="/explore" element={<ExploreView />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/track" element={<TrackReportView />} />

              {/* Protected Routes */}
              <Route path="/laporan-saya" element={<AuthenticatedRoute><MyReportsView /></AuthenticatedRoute>} />
              <Route path="/admin" element={<AdminOnlyRoute><AdminView /></AdminOnlyRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Overlays & Modals */}
            <ReportModal />
            <ReportDetailDrawer />
            <GlobalSearchModal />
          </BrowserRouter>
        </TitikProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
