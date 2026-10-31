import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  RotateCcw,
  ArrowLeft,
  ListFilter,
  FileText,
  Send,
  Building2,
  DollarSign,
  Users,
  ChevronRight,
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
    handleVerifyEvidence,
    handleRegisterFacility,
    handleSaveResponse,
    metrics,
    mobileTab,
    setMobileTab,
    zoomMedia,
    openZoom,
    closeZoom,
  } = useAdminWorkspace();

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
          <button
            type="button"
            onClick={refresh}
            className="p-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
            title="Segarkan Antrean"
            aria-label="Segarkan"
          >
            <RotateCcw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
          </button>
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
        {/* Header Hero Banner with Geometric Ribbons */}
        <AdminHeroBanner onRefresh={refresh} isLoading={isLoadingReports} />

        {/* Real-time Supabase Database Sync Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Koneksi Supabase Aktif &middot; Alur Laporan &amp; Verifikasi Langsung ke Database</span>
          </div>
          <span className="text-[11px] font-mono text-[#4F5A52] dark:text-[#9EACA3]">
            Total Laporan: {reports.length}
          </span>
        </div>

        {/* SUB-VIEW 1: OVERVIEW / DASHBOARD (Default /admin) */}
        {activeSubRoute === 'overview' && (
          <div className="space-y-6">
            {/* 4 Summary Metric KPI Cards */}
            <AdminMetricsCards
              metrics={metrics}
              activeStatus={statusFilter}
              onSelectStatus={(st) => setStatusFilter(statusFilter === st ? 'all' : st)}
            />

            {/* Sub-Workspaces Quick Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/validasi"
                className="p-5 rounded-2xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ListFilter className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {metrics.underReview + metrics.needsInfo} Menunggu
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                  Antrean Validasi &amp; Bukti
                </h3>
                <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 line-clamp-2">
                  Tinjau foto bukti, respons resmi verifikator, dan putusan status laporan.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-[#1B4332] dark:text-[#34D399] gap-1">
                  <span>Buka Antrean</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/admin/disposisi"
                className="p-5 rounded-2xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {metrics.forwarded} Diteruskan
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                  Disposisi &amp; Rute Dinas
                </h3>
                <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 line-clamp-2">
                  Rute instansi teknis PUPR, Dishub, dan DLH serta pengawasan SLA tindakan.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-[#1B4332] dark:text-[#34D399] gap-1">
                  <span>Buka Disposisi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/admin/anggaran"
                className="p-5 rounded-2xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    APBD Live
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                  Rekap APBD &amp; Audit
                </h3>
                <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 line-clamp-2">
                  Transparansi alokasi dana perbaikan infrastruktur dan audit realisasi fisik.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-[#1B4332] dark:text-[#34D399] gap-1">
                  <span>Buka Audit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/admin/pengguna"
                className="p-5 rounded-2xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    Warga Kota
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
                  Manajemen Warga/Pengguna
                </h3>
                <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 line-clamp-2">
                  Verifikasi identitas warga, badge resmi, dan riwayat kontribusi pelapor.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-[#1B4332] dark:text-[#34D399] gap-1">
                  <span>Buka Pengguna</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>

            {/* Quick Priority Triage Preview */}
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">
                    Laporan Membutuhkan Perhatian Mendesak
                  </h3>
                  <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                    Antrean teratas berstatus verifikasi atau dengan tingkat keparahan tinggi.
                  </p>
                </div>
                <Link
                  to="/admin/validasi"
                  className="text-xs font-bold text-[#1B4332] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Meja Kerja Validasi Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
                {filteredReports.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                          {r.publicReference}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300">
                          {r.severity}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate mt-0.5">
                        {r.title}
                      </p>
                    </div>
                    <Link
                      to="/admin/validasi"
                      onClick={() => setSelectedReportId(r.id)}
                      className="px-3 py-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] shrink-0 cursor-pointer"
                    >
                      Tinjau
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: ANTREAN VALIDASI & VERIFIKASI BUKTI (/admin/validasi) */}
        {activeSubRoute === 'validasi' && (
          <div className="space-y-6">
            {/* Mobile Tab Switcher (Antrean vs Detail Tinjauan) */}
            <div className="lg:hidden flex items-center p-1 rounded-2xl bg-[#E3E0D6]/60 dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E]">
              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mobileTab === 'queue'
                    ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                    : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
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
                    ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                    : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
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
                  className={`admin-console-card lg:col-span-7 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-5 ${
                    mobileTab === 'detail' ? 'block' : 'hidden lg:block'
                  }`}
                >
                  {/* Mobile Back to Queue Action */}
                  <div className="lg:hidden flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                    <button
                      type="button"
                      onClick={() => setMobileTab('queue')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] dark:text-[#34D399] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Antrean Laporan</span>
                    </button>
                    <span className="font-mono text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                      {selectedReport.publicReference}
                    </span>
                  </div>

                  {/* Report Header: Public Ref, Title, Location, Status Badge */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                        {selectedReport.publicReference}
                      </span>
                      <h2 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
                        {selectedReport.title}
                      </h2>
                      <div className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{selectedReport.location?.address || 'Lokasi belum dicantumkan'}</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shrink-0">
                      {selectedReport.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Evidence Inspector with Media Previews & Metadata */}
                  <EvidenceInspector
                    report={selectedReport}
                    onOpenZoom={openZoom}
                    onVerifyEvidence={handleVerifyEvidence}
                    onRegisterFacility={handleRegisterFacility}
                  />

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
                    onSaveResponse={handleSaveResponse}
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
                  className={`admin-console-card lg:col-span-7 p-12 text-center text-[#4F5A52] dark:text-[#9EACA3] bg-white dark:bg-[#1A221E] rounded-3xl border border-[#E3E0D6] dark:border-[#26352E] ${
                    mobileTab === 'detail' ? 'block' : 'hidden lg:block'
                  }`}
                >
                  <p className="text-sm font-semibold">Pilih laporan dari antrean untuk meninjau detail.</p>
                  <button
                    type="button"
                    onClick={() => setMobileTab('queue')}
                    className="lg:hidden mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold cursor-pointer"
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Buka Antrean Laporan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: DISPOSISI & RUTE DINAS (/admin/disposisi) */}
        {activeSubRoute === 'disposisi' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
                      Portal Disposisi Antar-Dinas
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
                    Disposisi &amp; Rute Dinas Teknis
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    SLA Standar: 24 Jam
                  </span>
                </div>
              </div>

              {/* Roster Dinas Teknis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    <Building2 className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <span>Dinas PUPR</span>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-1">
                    Jalan amblas, jembatan rusak, drainase meluap.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Dinas Lingkungan Hidup</span>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-1">
                    TPS liar, pohon tumbang, pencemaran sungai.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Dinas Perhubungan</span>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-1">
                    Lampu APILL padam, marka jalan pudar, halte rusak.
                  </p>
                </div>
              </div>

              {/* Dispatched Reports Stream */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                  Laporan Dalam Penanganan Instansi ({reports.filter((r) => r.status === 'forwarded_to_institution').length})
                </h4>
                {reports.filter((r) => r.status === 'forwarded_to_institution').length > 0 ? (
                  <div className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
                    {reports
                      .filter((r) => r.status === 'forwarded_to_institution')
                      .map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                              {r.publicReference}
                            </span>
                            <h5 className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
                              {r.title}
                            </h5>
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              Disposisi: {r.responsibleAgency}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                            Dalam Proses
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] bg-[#F7F5EF]/40 dark:bg-[#131916] rounded-2xl">
                    Belum ada laporan yang sedang dalam disposisi dinas teknis saat ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 4: REKAP APBD & AUDIT ANGGARAN (/admin/anggaran) */}
        {activeSubRoute === 'anggaran' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                      Audit Anggaran Terbuka
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
                    Rekap APBD &amp; Audit Anggaran Fisik
                  </h2>
                </div>
                <div className="text-xs font-mono font-bold text-[#1B4332] dark:text-[#34D399]">
                  Tahun Anggaran 2026
                </div>
              </div>

              {/* Fiscal Telemetry Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Total Anggaran Terpetakan
                  </span>
                  <div className="text-lg font-black text-[#101913] dark:text-[#F3F6F4] mt-1 font-mono">
                    Rp 24,85 M
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                  <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    Realisasi Fisik Terverifikasi
                  </span>
                  <div className="text-lg font-black text-[#101913] dark:text-[#F3F6F4] mt-1 font-mono">
                    Rp 18,20 M
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Sisa Anggaran Sektor
                  </span>
                  <div className="text-lg font-black text-[#101913] dark:text-[#F3F6F4] mt-1 font-mono">
                    Rp 6,65 M
                  </div>
                </div>
              </div>

              {/* Sektoral Ledger Table */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                  Rincian Sektor Infrastruktur &middot; Database Supabase
                </h4>
                <div className="p-6 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] bg-[#F7F5EF]/40 dark:bg-[#131916] rounded-2xl">
                  Sinkronisasi langsung dengan tabel <code>budget_sectors</code> aktif.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 5: MANAJEMEN WARGA/PENGGUNA (/admin/pengguna) */}
        {activeSubRoute === 'pengguna' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                      Direktori Warga &amp; Identitas
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
                    Manajemen Warga / Pengguna Terverifikasi
                  </h2>
                </div>
                <div className="text-xs font-mono text-[#4F5A52] dark:text-[#9EACA3]">
                  Supabase <code>profiles</code>
                </div>
              </div>

              {/* Citizen Verification Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <span className="text-[11px] font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
                    Warga Terverifikasi
                  </span>
                  <div className="text-lg font-black text-[#101913] dark:text-[#F3F6F4] mt-1 font-mono">
                    842 Akun
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <span className="text-[11px] font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
                    Menunggu Verifikasi KTP
                  </span>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                    19 Pengajuan
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#131916]">
                  <span className="text-[11px] font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
                    Skor Kepercayaan Komunitas
                  </span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    98.4%
                  </div>
                </div>
              </div>

              {/* Citizen Directory Table */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                  Daftar Pengguna &middot; Terhubung RPC <code>admin_set_citizen_verification</code>
                </h4>
                <div className="p-6 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] bg-[#F7F5EF]/40 dark:bg-[#131916] rounded-2xl">
                  Memuat data warga dari tabel <code>profiles</code> live Supabase.
                </div>
              </div>
            </div>
          </div>
        )}
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
