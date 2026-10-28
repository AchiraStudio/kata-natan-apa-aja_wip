import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import type { ProfileController } from './useProfileController';

interface PostsTabProps {
  ctrl: ProfileController;
}

export const PostsTab: React.FC<PostsTabProps> = ({ ctrl }) => {
  const { openComposer, posts, activeTab, isOwnProfile } = ctrl;
  return (
    <>
            {activeTab === 'posts' && (
              <div>
                {posts.length === 0 ? (
                  <div className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-8 text-center space-y-3">
                    <MessageSquare className="w-8 h-8 text-[#686B65] dark:text-[#9EACA3] mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Belum Ada Postingan
                    </h4>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] max-w-xs mx-auto">
                      {isOwnProfile
                        ? 'Bagikan pembaruan warga, foto fasilitas publik, atau diskusi bersama komunitas.'
                        : 'Pengguna ini belum membagikan postingan publik.'}
                    </p>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => openComposer('post')}
                        className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
                      >
                        + Buat Postingan Baru
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="group bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl overflow-hidden hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          {/* Media Preview if available */}
                          {post.media && post.media.length > 0 && (
                            <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
                              <img
                                src={post.media[0].url}
                                alt="Pratinjau Postingan"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {post.media.length > 1 && (
                                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                                  +{post.media.length - 1}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                              <span className="font-semibold text-[#263F35] dark:text-[#34D399]">
                                {post.locationTag || 'Kota Bogor'}
                              </span>
                              <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[#20221D] dark:text-[#F3F6F4] line-clamp-3 leading-relaxed">
                              {post.body}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-4 py-3 bg-[#F7F6F1]/50 dark:bg-[#1A221E]/50 border-t border-[#E4E2DA]/60 dark:border-[#26352E]/60 flex items-center justify-between text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                              <span>{post.likesCount || 0}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                              <span>{post.commentsCount || 0}</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-bold group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors">
                            Buka Selengkapnya &rarr;
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
