import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitikProvider } from './context/TitikContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Views
import { LandingView } from './views/LandingView';
import { ObservatoryView } from './views/ObservatoryView';
import { BudgetView } from './views/BudgetView';
import { FacilitiesView } from './views/FacilitiesView';
import { FacilityDetailView } from './views/FacilityDetailView';
import { DiscrepancyView } from './views/DiscrepancyView';
import { ReportView } from './views/ReportView';
import { ReportDetailView } from './views/ReportDetailView';
import { NotFoundView } from './views/NotFoundView';

// Modals & Overlays
import { DetailDrawer } from './components/DetailDrawer';
import { ReportModal } from './components/ReportModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DataSourceModal } from './components/DataSourceModal';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      {/* Top Daylight Editorial Navbar */}
      <Navbar />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/peta" element={<ObservatoryView />} />
          <Route path="/anggaran" element={<BudgetView />} />
          <Route path="/fasilitas" element={<FacilitiesView />} />
          <Route path="/fasilitas/:id" element={<FacilityDetailView />} />
          <Route path="/analisis" element={<DiscrepancyView />} />
          <Route path="/lapor" element={<ReportView />} />
          <Route path="/lapor/:id" element={<ReportDetailView />} />
          
          {/* Legacy redirects */}
          <Route path="/reports" element={<Navigate to="/lapor" replace />} />
          <Route path="/kasus" element={<Navigate to="/lapor" replace />} />

          {/* 404 Not Found fallback */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer />

      {/* Quick Report Modal */}
      <ReportModal />

      {/* Global Cmd+K Instant Search Modal */}
      <GlobalSearchModal />

      {/* SIKD Data Provenance & Methodology Modal */}
      <DataSourceModal />

      {/* Daylight Editorial Footer */}
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <TitikProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TitikProvider>
  );
}

export default App;
