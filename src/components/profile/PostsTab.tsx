import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, MapPin, Building, CheckCircle2, ArrowRight, Sparkles, Plus } from 'lucide-react';
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
            isOwnProfile ? (
              <div className="bg-surface dark:bg-surface-2 border border-line rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                {/* Milestone Journey Header */}
                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 dark:bg-brand-soft text-brand text-[11px] font-bold tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inisiasi Perjalanan Warga</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-ink">
                    Perjalanan titikmu dimulai di sini.
                  </h4>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    Setiap laporan warga adalah satu titik yang hidup: tercatat, diverifikasi oleh dinas, dan dipantau bersama hingga tuntas.
                  </p>
                </div>

                {/* 3 Milestone Steps Connected with Dotted Line */}
                <div className="relative max-w-xl mx-auto py-2">
                  {/* Desktop Dotted Connecting Line */}
                  <div className="hidden sm:block absolute top-7 left-12 right-12 h-0.5 border-t-2 border-dashed border-ink-2 dark:border-line z-0" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                    {/* Step 1 */}
                    <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:text-center group">
                      <div className="w-12 h-12 rounded-2xl bg-brand text-on-brand flex items-center justify-center shrink-0 shadow-md ring-4 ring-surface-2 dark:ring-line">
                        <MapPin className="w-5 h-5 text-brand" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-ink">
                          1. Buat Titik Laporan
                        </div>
                        <p className="text-[11px] text-ink-2 leading-snug">
                          Foto jalan berlubang, drainase tersumbat, atau fasilitas umum di sekitarmu.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:text-center group">
                      <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-surface border border-line text-brand flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-surface-2">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-ink">
                          2. Respons Resmi Dinas
                        </div>
                        <p className="text-[11px] text-ink-2 leading-snug">
                          PUPR, Dishub, atau DLH Pemkot Bogor memberikan disposisi dan jadwal tindak lanjut.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:text-center group">
                      <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-surface border border-line text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-surface-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-ink">
                          3. Kawal Hingga Tuntas
                        </div>
                        <p className="text-[11px] text-ink-2 leading-snug">
                          Verifikasi bukti penyelesaian fisik dan serapan alokasi anggaran APBD.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openComposer('report')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-xl text-xs font-bold hover:bg-brand-hover dark:hover:bg-brand transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Laporkan Masalah Fasilitas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openComposer('post')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-line bg-surface text-ink rounded-xl text-xs font-bold hover:bg-canvas dark:hover:bg-line transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-ink-2" />
                    <span>Mulai Diskusi Warga</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface dark:bg-surface-2 border border-line rounded-2xl p-8 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-ink-2 mx-auto opacity-40" />
                <h4 className="text-sm font-bold text-ink">
                  Belum Ada Postingan
                </h4>
                <p className="text-xs text-ink-2 max-w-xs mx-auto">
                  Pengguna ini belum membagikan postingan publik.
                </p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="group bg-surface dark:bg-surface-2 border border-line rounded-2xl overflow-hidden hover:border-brand/40 transition-all shadow-xs flex flex-col justify-between"
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
                      <div className="flex items-center justify-between text-[11px] text-ink-2">
                        <span className="font-semibold text-brand">
                          {post.locationTag || 'Kota Bogor'}
                        </span>
                        <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                      </div>
                      <p className="text-xs text-ink line-clamp-3 leading-relaxed">
                        {post.body}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-canvas/50 dark:bg-surface/50 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-2">
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
                    <span className="text-[10px] font-bold group-hover:text-brand transition-colors flex items-center gap-1">
                      <span>Buka Selengkapnya</span>
                      <ArrowRight className="w-3 h-3" />
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
