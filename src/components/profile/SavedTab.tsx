import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { SaveReportButton } from '../reporting/SaveReportButton';
import type { ProfileController } from './useProfileController';

interface SavedTabProps {
  ctrl: ProfileController;
}

export const SavedTab: React.FC<SavedTabProps> = ({ ctrl }) => {
  const { navigate, savedPosts, savedReports, setSavedReports, openReportDetail, activeTab, isOwnProfile } = ctrl;
  return (
    <>
            {isOwnProfile && activeTab === 'saved' && (
              <div>
                {savedPosts.length === 0 && savedReports.length === 0 ? (
                  <div className="bg-surface dark:bg-surface-2 border border-line rounded-2xl p-8 text-center space-y-3">
                    <Bookmark className="w-8 h-8 text-ink-2 mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-ink">
                      Belum Ada yang Disimpan
                    </h4>
                    <p className="text-xs text-ink-2 max-w-xs mx-auto">
                      Simpan postingan atau laporan penting agar mudah ditemukan dan ditinjau kembali.
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
                    {savedPosts.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-sm font-bold text-ink">Postingan tersimpan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedPosts.map((post) => (
                            <Link
                              key={post.id}
                              to={`/post/${post.id}`}
                              className="group bg-surface dark:bg-surface-2 border border-line rounded-2xl overflow-hidden hover:border-brand/40 transition-all shadow-xs flex flex-col justify-between"
                            >
                              <div>
                                {post.media && post.media.length > 0 && (
                                  <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
                                    <img
                                      src={post.media[0].url}
                                      alt="Pratinjau"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                )}
                                <div className="p-4 space-y-2">
                                  <div className="flex items-center gap-2 text-[11px] text-ink-2">
                                    <span className="font-bold text-ink">
                                      @{post.author.username}
                                    </span>
                                    <span>•</span>
                                    <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-ink line-clamp-3">
                                    {post.body}
                                  </p>
                                </div>
                              </div>

                              <div className="px-4 py-3 bg-canvas/50 dark:bg-surface/50 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-2">
                                <span>{post.locationTag || 'Kota Bogor'}</span>
                                <span className="text-[10px] font-bold group-hover:text-brand">
                                  Lihat Postingan &rarr;
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

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
