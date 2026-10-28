import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import type { ProfileController } from './useProfileController';

interface SavedTabProps {
  ctrl: ProfileController;
}

export const SavedTab: React.FC<SavedTabProps> = ({ ctrl }) => {
  const { navigate, savedPosts, activeTab, isOwnProfile } = ctrl;
  return (
    <>
            {isOwnProfile && activeTab === 'saved' && (
              <div>
                {savedPosts.length === 0 ? (
                  <div className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-8 text-center space-y-3">
                    <Bookmark className="w-8 h-8 text-[#686B65] dark:text-[#9EACA3] mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Belum Ada Postingan Disimpan
                    </h4>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] max-w-xs mx-auto">
                      Simpan postingan penting dari beranda agar mudah diakses kembali kapan saja.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
                    >
                      Jelajahi Beranda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="group bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl overflow-hidden hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all shadow-xs flex flex-col justify-between"
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
                            <div className="flex items-center gap-2 text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                              <span className="font-bold text-[#20221D] dark:text-[#F3F6F4]">
                                @{post.author.username}
                              </span>
                              <span>•</span>
                              <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[#20221D] dark:text-[#F3F6F4] line-clamp-3">
                              {post.body}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-[#F7F6F1]/50 dark:bg-[#1A221E]/50 border-t border-[#E4E2DA]/60 dark:border-[#26352E]/60 flex items-center justify-between text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                          <span>{post.locationTag || 'Kota Bogor'}</span>
                          <span className="text-[10px] font-bold group-hover:text-[#263F35] dark:group-hover:text-[#34D399]">
                            Lihat Postingan &rarr;
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
    </>
  );
};
