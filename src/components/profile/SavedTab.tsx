import React from 'react';
import { Bookmark } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { SaveReportButton } from '../reporting/SaveReportButton';
import type { ProfileController } from './useProfileController';

interface SavedTabProps {
  ctrl: ProfileController;
}

export const SavedTab: React.FC<SavedTabProps> = ({ ctrl }) => {
  const { navigate, savedReports, setSavedReports, openReportDetail, activeTab, isOwnProfile } = ctrl;
  return (
    <>
            {isOwnProfile && activeTab === 'saved' && (
              <div>
                {savedReports.length === 0 ? (
                  <div className="bg-surface dark:bg-surface-2 border border-line rounded-2xl p-8 text-center space-y-3">
                    <Bookmark className="w-8 h-8 text-ink-2 mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-ink">
                      Belum Ada Laporan Tersimpan
                    </h4>
                    <p className="text-xs text-ink-2 max-w-xs mx-auto">
                      Simpan laporan penting agar mudah ditemukan dan ditinjau kembali.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/explore')}
                      className="px-4 py-2 bg-brand text-on-brand rounded-xl text-xs font-bold hover:bg-brand-hover cursor-pointer"
                    >
                      Jelajahi Laporan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {savedReports.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-sm font-bold text-ink">Laporan tersimpan</h3>
                        <div className="space-y-3">
                          {savedReports.map((report) => (
                            <article
                              key={report.id}
                              onClick={() => openReportDetail(report)}
                              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-colors hover:border-brand/40 dark:bg-surface-2 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                            >
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-bold text-brand">
                                    {report.publicReference}
                                  </span>
                                  <span className="text-[10px] font-bold text-ink-2">
                                    {report.category}
                                  </span>
                                  <span className="text-[10px] text-ink-2">
                                    {formatIndonesianTimeAgo(report.createdAt)}
                                  </span>
                                </div>
                                <h4 className="truncate text-sm font-bold text-ink">
                                  {report.title}
                                </h4>
                                <p className="truncate text-xs text-ink-2">
                                  {report.location.address}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                                <span className="rounded-xl border border-lime-200 bg-lime-50 px-2.5 py-1 text-[11px] font-bold text-lime-700 dark:border-lime-800/40 dark:bg-lime-950/40 dark:text-lime-400">
                                  {report.status.replaceAll('_', ' ')}
                                </span>
                                <SaveReportButton
                                  reportId={report.id}
                                  isSavedByMe
                                  onSavedChange={(isSaved) => {
                                    if (!isSaved) {
                                      setSavedReports((current) => current.filter((item) => item.id !== report.id));
                                    }
                                  }}
                                />
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}
    </>
  );
};
