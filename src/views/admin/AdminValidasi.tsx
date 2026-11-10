import React, { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  useAdminWorkspace,
  useMessageReporter,
  ReportQueueList,
  EvidenceInspector,
  EvidenceZoomModal,
  OfficialResponseComposer,
  StatusTransitionActions,
  ReportAuditTrail,
  RequestInfoDialog,
  SeverityMark,
  ageLabel,
  Notice,
} from '../../components/admin';
import { StatusLabel } from '../../components/common/StatusLabel';
import type { UserProfile } from '../../types/domain';

interface Props {
  profile: UserProfile;
}

/** Review workspace: the queue on the left, the open report on the right. The open report is ?r=<id>. */
export const AdminValidasi: React.FC<Props> = () => {
  const messenger = useMessageReporter();
  const [requestOpen, setRequestOpen] = useState(false);
  const {
    reports,
    isLoadingReports,
    selectedReport,
    setSelectedReportId,
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
    handleRequestInfo,
    handleSaveResponse,
    mobileTab,
    setMobileTab,
    zoomMedia,
    openZoom,
    closeZoom,
  } = useAdminWorkspace();

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <div role="tablist" aria-label="Bagian layar" className="titik-pill-track w-full">
        <button type="button" role="tab" aria-selected={mobileTab === 'queue'} onClick={() => setMobileTab('queue')} className={`flex-1 titik-pill-tab ${mobileTab === 'queue' ? 'active' : ''}`}>
          Antrean ({filteredReports.length})
        </button>
        <button type="button" role="tab" aria-selected={mobileTab === 'detail'} onClick={() => setMobileTab('detail')} className={`flex-1 titik-pill-tab ${mobileTab === 'detail' ? 'active' : ''}`}>
          Detail{selectedReport ? ` ${selectedReport.publicReference}` : ''}
        </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <ReportQueueList
          reports={filteredReports}
          totalReportsCount={reports.length}
          selectedReportId={selectedReport?.id ?? ''}
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
          isLoading={isLoadingReports}
          className={`lg:sticky lg:top-0 lg:max-h-[calc(100dvh-9rem)] ${mobileTab === 'queue' ? 'flex' : 'hidden lg:flex'}`}
        />

        {selectedReport ? (
          <article aria-label={`Laporan ${selectedReport.publicReference}`} className={`panel p-5 sm:p-7 space-y-8 min-w-0 ${mobileTab === 'detail' ? 'block' : 'hidden lg:block'}`}>
            <header className="space-y-3">
              <button type="button" onClick={() => setMobileTab('queue')} className="lg:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-brand cursor-pointer">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali ke antrean
              </button>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="titik-id text-sm font-semibold text-ink-2">{selectedReport.publicReference}</span>
                <StatusLabel status={selectedReport.status} className="text-sm" />
                <SeverityMark severity={selectedReport.severity} />
                <span className="text-xs text-ink-3">masuk {ageLabel(selectedReport.createdAt)}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-snug">{selectedReport.title}</h2>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => messenger.open(selectedReport)}
                  disabled={messenger.busyId === selectedReport.id || !selectedReport.reporterUserId}
                  title={selectedReport.reporterUserId ? undefined : 'Laporan anonim, tidak bisa dikirimi pesan'}
                  className="h-10 px-4 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {messenger.busyId === selectedReport.id ? 'Membuka percakapan' : 'Kirim pesan ke pelapor'}
                </button>
                {!['resolved', 'rejected'].includes(selectedReport.status) && (
                  <button type="button" onClick={() => setRequestOpen(true)} className="h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors cursor-pointer">
                    Minta info
                  </button>
                )}
              </div>
              {!selectedReport.reporterUserId && <p className="text-xs text-ink-3">Pelapor anonim: pesan tidak tersedia, tetapi tanggapan publik tetap tampil di halaman pelacakan.</p>}
              {messenger.error && <Notice kind="error">{messenger.error}</Notice>}
            </header>

            <EvidenceInspector report={selectedReport} onOpenZoom={openZoom} onVerifyEvidence={handleVerifyEvidence} onRegisterFacility={handleRegisterFacility} />

            <OfficialResponseComposer
              reportId={selectedReport.id}
              publicResponse={currentDraft.publicResponse}
              internalNote={currentDraft.internalNote}
              onChangePublicResponse={(val: string) => updateDraft(selectedReport.id, 'publicResponse', val)}
              onChangeInternalNote={(val: string) => updateDraft(selectedReport.id, 'internalNote', val)}
              activeTab={composerTab}
              onTabChange={setComposerTab}
              isUpdating={isUpdating}
              onSaveResponse={handleSaveResponse}
            />

            <StatusTransitionActions
              currentStatus={selectedReport.status}
              isUpdating={isUpdating}
              actionError={actionError}
              actionSuccess={actionSuccess}
              onApplyTransition={handleApplyTransition}
              onDeleteReport={handleDeleteReport}
              onRequestInfo={() => setRequestOpen(true)}
            />

            <ReportAuditTrail events={selectedReport.events || []} />
          </article>
        ) : (
          <div className={`panel px-6 py-16 text-center ${mobileTab === 'detail' ? 'block' : 'hidden lg:block'}`}>
            <FileText className="w-8 h-8 mx-auto text-ink-3" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">Pilih laporan dari antrean</p>
            <p className="mt-1 text-sm text-ink-2">{isLoadingReports ? 'Memuat antrean' : `${reports.length} laporan tersedia`}</p>
          </div>
        )}
      </div>

      {requestOpen && selectedReport && (
        <RequestInfoDialog report={selectedReport} isSending={isUpdating} onSubmit={handleRequestInfo} onClose={() => setRequestOpen(false)} />
      )}
      {zoomMedia && <EvidenceZoomModal media={zoomMedia} onClose={closeZoom} />}
    </div>
  );
};
