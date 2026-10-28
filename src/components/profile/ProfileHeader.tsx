import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Share2, Edit3, Camera, ShieldCheck, ShieldAlert, Settings, ChevronRight, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import type { ProfileController } from './useProfileController';

interface ProfileHeaderProps {
  ctrl: ProfileController;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ ctrl }) => {
  const { profile, posts, reports, setActiveTab, avatarInputRef, bannerInputRef, isOwnProfile, handleOpenEdit, handleAvatarFileChange, handleBannerFileChange, handleShareProfile, totalSupportAndLikes, currentTheme } = ctrl;
  if (!profile) return null;
  return (
    <>
            <div className={`relative ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl shadow-sm overflow-hidden transition-colors duration-300`}>
              {/* Cover Banner (Expanded Proportions for Panoramic View) */}
              <div
                className={`h-48 sm:h-64 relative overflow-hidden bg-gradient-to-r ${currentTheme.bannerGradient}`}
              >
                {profile.bannerUrl && (
                  <img
                    src={profile.bannerUrl}
                    alt="Sampul Profil"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Visual Depth Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F7F6F1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {isOwnProfile && (
                  <>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleBannerFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold shadow-md transition-all active:scale-95 cursor-pointer border border-white/20"
                      title="Ubah Foto Sampul Langsung"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ubah Sampul</span>
                    </button>
                  </>
                )}
              </div>

              {/* Identity Row */}
              <div className="px-5 sm:px-8 pb-6 pt-0 relative">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-18 mb-5">
                  {/* Avatar with Refined Ring & Floating Action */}
                  <div className="relative group self-start">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-[#131916] shadow-xl bg-stone-100"
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-md transition-transform active:scale-90 cursor-pointer"
                        title="Ubah Foto Profil Langsung"
                        aria-label="Ubah Foto Profil"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions (Owner vs Visitor - Clean & Focused) */}
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <>
                        {profile.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Buka Portal Tinjauan Admin PUPR"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Portal Admin</span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenEdit}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1d3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Profil</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('settings')}
                          className="inline-flex items-center justify-center p-2 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Pengaturan Akun"
                          aria-label="Pengaturan Akun"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleShareProfile}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] transition-all shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan Profil</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Name & Handles */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[#20221D] dark:text-[#F3F6F4] tracking-tight">
                      {profile.displayName}
                    </h1>
                    {profile.isVerified && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40"
                        title="Warga Terverifikasi"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Terverifikasi</span>
                      </span>
                    )}
                    {profile.role === 'admin' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                        PUPR Admin
                      </span>
                    )}
                    {profile.customStatus && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#263F35] dark:text-[#34D399] bg-[#EBF2EE] dark:bg-[#1E2E25] px-2.5 py-0.5 rounded-full border border-[#C5D9CE] dark:border-[#2D4537]">
                        <Sparkles className="w-3 h-3" />
                        <span>&ldquo;{profile.customStatus}&rdquo;</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-[#686B65] dark:text-[#9EACA3]">
                    @{profile.username}
                  </p>

                  {/* Bio */}
                  <p className="text-xs text-[#20221D] dark:text-[#D1DCD5] leading-relaxed pt-1 max-w-2xl">
                    {profile.bio || 'Warga aktif Kota Bogor peduli transparansi dan kenyamanan fasilitas publik.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399]" />
                      <span>{profile.district || 'Kota Bogor'}</span>
                    </div>
                    {profile.websiteUrl && (
                      <a
                        href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#263F35] dark:text-[#34D399] hover:underline font-medium"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bergabung {formatIndonesianTimeAgo(profile.createdAt || '2026-01-01T00:00:00Z')}</span>
                    </div>
                  </div>

                  {/* Admin Direct Launchpad Banner (Mobile & Desktop) */}
                  {isOwnProfile && profile.role === 'admin' && (
                    <div className="pt-3">
                      <Link
                        to="/admin"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Portal Tinjauan Admin PUPR
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                              Verifikasi bukti laporan warga dan perbarui disposisi dinas
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Buka</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Stats Summary Bar (Editorial Civic Ribbon) */}
                <div className={`grid grid-cols-3 divide-x divide-[#E4E2DA]/80 dark:divide-[#26352E] pt-3 pb-3 mt-5 rounded-2xl border ${currentTheme.cardBorder} ${currentTheme.statBg} transition-colors duration-300`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('posts')}
                    className="flex flex-col items-center py-1 px-2 text-center group cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <span className="text-lg sm:text-xl font-black text-[#20221D] dark:text-[#F3F6F4] tracking-tight group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors">
                      {posts.length}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Postingan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="flex flex-col items-center py-1 px-2 text-center group cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <span className="text-lg sm:text-xl font-black text-[#20221D] dark:text-[#F3F6F4] tracking-tight group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors">
                      {reports.length}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Laporan
                    </span>
                  </button>

                  <div className="flex flex-col items-center py-1 px-2 text-center">
                    <span className="text-lg sm:text-xl font-black text-[#20221D] dark:text-[#F3F6F4] tracking-tight">
                      {totalSupportAndLikes}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Dukungan
                    </span>
                  </div>
                </div>
              </div>
            </div>
    </>
  );
};
