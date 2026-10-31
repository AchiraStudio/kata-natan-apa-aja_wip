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
                  <div className="bg-white dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl p-8 text-center space-y-3">
                    <Bookmark className="w-8 h-8 text-[#4F5A52] dark:text-[#9EACA3] mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">
                      Belum Ada yang Disimpan
                    </h4>
                    <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] max-w-xs mx-auto">
                      Simpan postingan atau laporan penting agar mudah ditemukan dan ditinjau kembali.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/explore')}
                      className="px-4 py-2 bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#14352A] cursor-pointer"
                    >
                      Jelajahi Laporan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {savedPosts.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">Postingan tersimpan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedPosts.map((post) => (
                            <Link
                              key={post.id}
                              to={`/post/${post.id}`}
                              className="group bg-white dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl overflow-hidden hover:border-[#1B4332]/40 dark:hover:border-[#10B981]/40 transition-all shadow-xs flex flex-col justify-between"
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
                                  <div className="flex items-center gap-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                                    <span className="font-bold text-[#101913] dark:text-[#F3F6F4]">
                                      @{post.author.username}
                                    </span>
                                    <span>•</span>
                                    <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-[#101913] dark:text-[#F3F6F4] line-clamp-3">
                                    {post.body}
                                  </p>
                                </div>
                              </div>

                              <div className="px-4 py-3 bg-[#F7F5EF]/50 dark:bg-[#1A221E]/50 border-t border-[#E3E0D6]/60 dark:border-[#26352E]/60 flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                                <span>{post.locationTag || 'Kota Bogor'}</span>
                                <span className="text-[10px] font-bold group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
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
                        <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">Laporan tersimpan</h3>
                        <div className="space-y-3">
                          {savedReports.map((report) => (
                            <article
                              key={report.id}
                              onClick={() => openReportDetail(report)}
                              className="flex flex-col gap-3 rounded-2xl border border-[#E3E0D6] bg-white p-4 shadow-xs transition-colors hover:border-[#1B4332]/40 dark:border-[#26352E] dark:bg-[#131916] dark:hover:border-[#10B981]/40 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                            >
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-md bg-[#E7EBDD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1B4332] dark:bg-[#1A2E24] dark:text-[#34D399]">
                                    {report.publicReference}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                                    {report.category}
                                  </span>
                                  <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">
                                    {formatIndonesianTimeAgo(report.createdAt)}
                                  </span>
                                </div>
                                <h4 className="truncate text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">
                                  {report.title}
                                </h4>
                                <p className="truncate text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                                  {report.location.address}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
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
