import React from 'react';
import { ArrowLeft, ListFilter, FileText, MessageSquare } from 'lucide-react';
import {
  useAdminWorkspace,
  ReportQueueList,
  EvidenceInspector,
  EvidenceZoomModal,
  OfficialResponseComposer,
  StatusTransitionActions,
  ReportAuditTrail,
} from '../../components/admin';
import { UserProfile } from '../../types/domain';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/messagesService';

interface Props {
  profile: UserProfile;
}

export const AdminValidasi: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();
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
    handleSaveResponse,
    mobileTab,
    setMobileTab,
    zoomMedia,
    openZoom,
    closeZoom,
    refresh,
  } = useAdminWorkspace();

  const handleMessageReporter = async () => {
    if (!selectedReport?.reporterUserId || !authProfile) return;
    try {
      const conv = await createConversation(
        selectedReport.id,
        authProfile.id,
        selectedReport.reporterUserId
      );
      navigate(`/pesan?conversation_id=${conv.id}`);
    } catch {
      navigate(`/pesan?report_id=${selectedReport.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-[#E3E0D6]/60 dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E]">
        <button
          type="button"
          onClick={() => setMobileTab('queue')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileTab === 'queue'
              ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
              : 'text-[#4F5A52] dark:text-[#9EACA3]'
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
              : 'text-[#4F5A52] dark:text-[#9EACA3]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Detail {selectedReport ? `(${selectedReport.publicReference})` : ''}</span>
        </button>
      </div>

      {/* 2-column triage layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
          className={`lg:col-span-5 ${mobileTab === 'queue' ? 'block' : 'hidden lg:block'}`}
        />

        {selectedReport ? (
          <div
            className={`admin-console-card lg:col-span-7 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-5 ${
              mobileTab === 'detail' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Mobile back + report ref */}
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] dark:text-[#34D399] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Antrean</span>
              </button>
              <span className="font-mono text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                {selectedReport.publicReference}
              </span>
            </div>

            {/* Send message to reporter button */}
            {selectedReport.reporterUserId && (
              <button
                type="button"
                onClick={handleMessageReporter}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1B4332] hover:bg-[#15362A] text-white text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Pesan ke Pelapor</span>
              </button>
            )}

            <EvidenceInspector
              report={selectedReport}
              onOpenZoom={openZoom}
              onVerifyEvidence={handleVerifyEvidence}
              onRegisterFacility={handleRegisterFacility}
            />

            <OfficialResponseComposer
              reportId={selectedReport.id}
              publicResponse={currentDraft.publicResponse}
              internalNote={currentDraft.internalNote}
              onChangePublicResponse={(val: string) =>
                updateDraft(selectedReport.id, 'publicResponse', val)
              }
              onChangeInternalNote={(val: string) =>
                updateDraft(selectedReport.id, 'internalNote', val)
              }
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
            />

            <ReportAuditTrail events={selectedReport.events || []} />
          </div>
        ) : (
          <div
            className={`lg:col-span-7 flex items-center justify-center rounded-3xl border border-dashed border-[#E3E0D6] dark:border-[#26352E] p-12 text-center ${
              mobileTab === 'detail' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="space-y-2">
              <FileText className="w-8 h-8 text-[#9EACA3] mx-auto" />
              <p className="text-sm font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                Pilih laporan dari antrean
              </p>
              <p className="text-xs text-[#9EACA3]">
                {isLoadingReports ? 'Memuat antrean...' : `${reports.length} laporan tersedia`}
              </p>
            </div>
          </div>
        )}
      </div>

      {zoomMedia && (
        <EvidenceZoomModal
          media={zoomMedia}
          onClose={closeZoom}
        />
      )}
    </div>
  );
};

