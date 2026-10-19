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
import { ReportModal } from './components/reporting/ReportModal';
import { ReportDetailDrawer } from './components/reporting/ReportDetailDrawer';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';

export default function App() {
  return (
    <TitikProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
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
            <Route path="/admin" element={<AdminView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Overlays & Modals */}
          <ReportModal />
          <ReportDetailDrawer />
          <GlobalSearchModal />
        </BrowserRouter>
      </AuthProvider>
    </TitikProvider>
  );
}
