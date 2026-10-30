import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  RotateCcw,
  ArrowLeft,
  ListFilter,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/domain';
import { UserAvatar } from '../components/common/UserAvatar';
import {
  useAdminWorkspace,
  AdminHeroBanner,
  AdminMetricsCards,
  ReportQueueList,
  EvidenceInspector,
  EvidenceZoomModal,
  OfficialResponseComposer,
  StatusTransitionActions,
  ReportAuditTrail,
} from '../components/admin';
import './AdminView.css';

interface AdminConsoleInnerProps {
  profile: UserProfile;
}

const AdminConsoleInner: React.FC<AdminConsoleInnerProps> = ({ profile }) => {
  const navigate = useNavigate();

  const {
    reports,
    isLoadingReports,
    refresh,
    setSelectedReportId,
    selectedReport,
    filteredReports,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    currentDraft,
    updateDraft,
    composerTab,
    setComposerTab,
    isUpdating,
    actionError,
    actionSuccess,
    handleApplyTransition,
    handleDeleteReport,
    metrics,
    mobileTab,
    setMobileTab,
    zoomMedia,
    openZoom,
    closeZoom,
  } = useAdminWorkspace();

  return (
    <>
      {/* Mobile Top Header (Preserving ARIA labels and test contracts) */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] dark:bg-[#131916] border-b border-[#E4E2DA] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 -ml-1 rounded-xl text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#E4E2DA]/60 dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            title="Kembali ke Beranda"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-[#20221D] dark:text-[#F3F6F4]">
              ADMIN PUPR
            </span>
            <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
              Konsol
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="p-1.5 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#686B65] dark:text-[#9EACA3] hover:text-[#263F35] dark:hover:text-[#34D399] transition-colors cursor-pointer"
            title="Segarkan Antrean"
            aria-label="Segarkan"
          >
            <RotateCcw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to={'/u/' + profile.username}
            className="flex items-center"
            title={'Profil ' + profile.displayName}
          >
            <UserAvatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              name={profile.displayName}
              role={profile.role}
              className="w-7 h-7 rounded-full object-cover border border-[#263F35]/30 dark:border-[#10B981]/40"
            />
          </Link>
        </div>
      </header>


      {/* Main Admin Console */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-7xl space-y-6 pb-24 lg:pb-12 min-w-0">
        {/* Header Hero Banner with Geometric Ribbons */}
        <AdminHeroBanner onRefresh={refresh} isLoading={isLoadingReports} />

        {/* 4 Summary Metric KPI Cards */}
        <AdminMetricsCards
          metrics={metrics}
          activeStatus={statusFilter}
          onSelectStatus={(st) => setStatusFilter(statusFilter === st ? 'all' : st)}
        />

        {/* Mobile Tab Switcher (Antrean vs Detail Tinjauan) */}
        <div className="lg:hidden flex items-center p-1 rounded-2xl bg-[#E4E2DA]/60 dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E]">
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-white dark:bg-[#26352E] text-[#20221D] dark:text-[#F3F6F4] shadow-xs'
                : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Antrean ({filteredReports.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('detail')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'detail'
                ? 'bg-white dark:bg-[#26352E] text-[#20221D] dark:text-[#F3F6F4] shadow-xs'
                : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Detail {selectedReport ? '(' + selectedReport.publicReference + ')' : ''}</span>
          </button>
        </div>

        {/* Main 2-Column Triage Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Queue Pane (5 Cols on LG) */}
          <ReportQueueList
            reports={filteredReports}
            totalReportsCount={reports.length}
            selectedReportId={selectedReport?.id || ''}
            onSelectReport={(id) => {
              setSelectedReportId(id);
              setMobileTab('detail');
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            className={`lg:col-span-5 ${mobileTab === 'queue' ? 'block' : 'hidden lg:block'}`}
          />

          {/* Right Review Workspace (7 Cols on LG) */}
          {selectedReport ? (
            <div
              className={`admin-console-card lg:col-span-7 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-5 ${
                mobileTab === 'detail' ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Mobile Back to Queue Action */}
              <div className="lg:hidden flex items-center justify-between pb-3 border-b border-[#E4E2DA] dark:border-[#26352E]">
                <button
                  type="button"
                  onClick={() => setMobileTab('queue')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#263F35] dark:text-[#34D399] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Antrean Laporan</span>
                </button>
                <span className="font-mono text-[11px] font-bold text-[#686B65] dark:text-[#9EACA3]">
                  {selectedReport.publicReference}
                </span>
              </div>

              {/* Report Header: Public Ref, Title, Location, Status Badge */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E4E2DA] dark:border-[#26352E]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#686B65] dark:text-[#9EACA3]">
                    {selectedReport.publicReference}
                  </span>
                  <h2 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4] mt-0.5">
                    {selectedReport.title}
                  </h2>
                  <div className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{selectedReport.location?.address || 'Lokasi belum dicantumkan'}</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shrink-0">
                  {selectedReport.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Evidence Inspector with Media Previews & Metadata */}
              <EvidenceInspector report={selectedReport} onOpenZoom={openZoom} />

              {/* Dual-Tab Official Response Composer */}
              <OfficialResponseComposer
                reportId={selectedReport.id}
                publicResponse={currentDraft.publicResponse}
                internalNote={currentDraft.internalNote}
                onChangePublicResponse={(val) =>
                  updateDraft(selectedReport.id, 'publicResponse', val)
                }
                onChangeInternalNote={(val) =>
                  updateDraft(selectedReport.id, 'internalNote', val)
                }
                activeTab={composerTab}
                onTabChange={setComposerTab}
                isUpdating={isUpdating}
              />

              {/* State Transition Matrix */}
              <StatusTransitionActions
                currentStatus={selectedReport.status}
                isUpdating={isUpdating}
                actionError={actionError}
                actionSuccess={actionSuccess}
                onApplyTransition={handleApplyTransition}
                onDeleteReport={handleDeleteReport}
              />

              {/* Chronological Audit Trail */}
              <ReportAuditTrail events={selectedReport.events || []} />
            </div>
          ) : (
            <div
              className={`admin-console-card lg:col-span-7 p-12 text-center text-[#686B65] dark:text-[#9EACA3] bg-white dark:bg-[#1A221E] rounded-3xl border border-[#E4E2DA] dark:border-[#26352E] ${
                mobileTab === 'detail' ? 'block' : 'hidden lg:block'
              }`}
            >
              <p className="text-sm font-semibold">Pilih laporan dari antrean untuk meninjau detail.</p>
              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className="lg:hidden mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Buka Antrean Laporan</span>
              </button>
            </div>
          )}
        </div>
      </main>


      {/* High-Resolution Evidence Zoom Lightbox Modal */}
      <EvidenceZoomModal media={zoomMedia} onClose={closeZoom} />
    </>
  );
};

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0C100E] flex items-center justify-center text-xs font-semibold text-[#686B65] dark:text-[#9EACA3]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Memeriksa hak akses admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || profile.role !== 'admin') {
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
            Portal Tinjauan Admin memerlukan akun berwenang verifikator dinas.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Masuk Akun Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminConsoleInner profile={profile} />;
};
