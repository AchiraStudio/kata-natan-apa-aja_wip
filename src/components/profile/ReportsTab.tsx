import React from 'react';
import { FileText, MapPin, Trash2 } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { getReportMediaType } from '../../utils/reportEvidence';
import { SaveReportButton } from '../reporting/SaveReportButton';
import type { ProfileController } from './useProfileController';

interface ReportsTabProps {
  ctrl: ProfileController;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ ctrl }) => {
  const {
    openReportModal,
    openReportDetail,
    reports,
    savedReports,
    setReports,
    setSavedReports,
    reportsLoadError,
    activeTab,
    isOwnProfile,
    currentAuthProfile,
    deletingReportId,
    handleDeleteOwnReport,
  } = ctrl;
  return (
    <>
            {activeTab === 'reports' && (
              <div>
                {reportsLoadError ? (
                  <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
                    <p>Laporan profil gagal dimuat: {reportsLoadError}</p>
                    <button
                      type="button"
                      onClick={() => void ctrl.loadProfileData()}
                      className="mt-2 font-semibold underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-surface dark:bg-surface-2 border border-line rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-8 h-8 text-ink-2 mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-ink">
                      Belum Ada Laporan Publik
                    </h4>
                    <p className="text-xs text-ink-2 max-w-xs mx-auto">
                      {isOwnProfile
                        ? 'Kirimkan laporan kerusakan infrastruktur atau fasilitas publik untuk diproses dinas terkait.'
                        : 'Pengguna ini belum mengirimkan laporan publik.'}
                    </p>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={openReportModal}
                        className="px-4 py-2 bg-brand text-on-brand rounded-xl text-xs font-bold hover:bg-brand-hover cursor-pointer"
                      >
                        + Laporkan Masalah Fasilitas
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => openReportDetail(report)}
                        className="bg-surface dark:bg-surface-2 border border-line rounded-2xl p-4 hover:border-brand/40 transition-all shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-md">
                              {report.publicReference}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-surface text-ink-2">
                              {report.category}
                            </span>
                            <span className="text-[10px] font-semibold text-ink-2">
                              {formatIndonesianTimeAgo(report.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-ink group-hover:text-brand transition-colors truncate">
                            {report.title}
                          </h4>
                          <p className="text-xs text-ink-2 flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span>{report.location?.address || 'Jabodetabek'}</span>
                          </p>
                          {report.mediaUrls.length > 0 && (
                            <div className="flex gap-2 pt-2" onClick={(event) => event.stopPropagation()}>
                              {report.mediaUrls.slice(0, 2).map((url, index) => (
                                <div
                                  key={`${report.id}-media-${index}`}
                                  className="h-20 w-24 overflow-hidden rounded-lg border border-line bg-black"
                                >
                                  {getReportMediaType(url) === 'video' ? (
                                    <video
                                      src={url}
                                      controls
                                      playsInline
                                      aria-label={`Video bukti ${report.title}`}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <img
                                      src={url}
                                      alt={`Foto bukti ${report.title}`}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                          <span className="text-[11px] font-bold text-lime-700 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/40 px-2.5 py-1 rounded-xl border border-lime-200 dark:border-lime-800/40">
                            {report.status.replaceAll('_', ' ')}
                          </span>
                          <span className="text-[10px] text-ink-2">
                            {report.supportCount || 0} Dukungan Warga
                          </span>
                          <SaveReportButton
                            reportId={report.id}
                            isSavedByMe={report.isSavedByMe || savedReports.some((saved) => saved.id === report.id)}
                            onSavedChange={(isSaved) => {
                              setReports((current) =>
                                current.map((item) =>
                                  item.id === report.id ? { ...item, isSavedByMe: isSaved } : item
                                )
                              );
                              setSavedReports((current) => {
                                if (isSaved) {
                                  return current.some((item) => item.id === report.id)
                                    ? current
                                    : [{ ...report, isSavedByMe: true }, ...current];
                                }
                                return current.filter((item) => item.id !== report.id);
                              });
                            }}
                          />
                          {isOwnProfile &&
                            report.reporterUserId === currentAuthProfile.id &&
                            report.reporterType !== 'anonymous' && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDeleteOwnReport(report);
                                }}
                                disabled={Boolean(deletingReportId)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 hover:text-rose-800 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingReportId === report.id ? 'Menghapus...' : 'Hapus'}
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
    </>
  );
};
