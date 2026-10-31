import React from 'react';
import { FileText, Edit3, Camera, Bookmark, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import type { ProfileController } from './useProfileController';

interface SettingsTabProps {
  ctrl: ProfileController;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ ctrl }) => {
  const { profile, reports, savedPosts, activeTab, setActiveTab, avatarInputRef, isOwnProfile, handleLogout, handleOpenEdit } = ctrl;
  if (!profile) return null;
  return (
    <>
            {isOwnProfile && activeTab === 'settings' && (
              <div className="bg-white dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
                    Pengaturan & Preferensi Warga
                  </h3>
                  <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                    Kelola identitas publik, wilayah domisili, dan keamanan sesi akun Anda.
                  </p>
                </div>

                {/* Account Summary Card */}
                <div className="p-4 rounded-2xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#4F5A52] dark:text-[#9EACA3]">Peran & Akses</span>
                    <span className="font-bold text-[#1B4332] dark:text-[#34D399] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {profile.role === 'admin' ? 'admin' : (profile.isVerified ? 'Warga Terverifikasi' : 'Warga Terdaftar')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#4F5A52] dark:text-[#9EACA3]">Nama Lengkap</span>
                    <span className="font-bold text-[#101913] dark:text-[#F3F6F4]">{profile.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#4F5A52] dark:text-[#9EACA3]">Handle Publik</span>
                    <span className="font-mono font-bold text-[#101913] dark:text-[#F3F6F4]">@{profile.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#4F5A52] dark:text-[#9EACA3]">Wilayah Domisili</span>
                    <span className="font-bold text-[#101913] dark:text-[#F3F6F4]">{profile.district || '-'}</span>
                  </div>
                </div>

                {/* Quick Actions List (Modeled after Mobile Profile specs) */}
                <div className="divide-y divide-[#E3E0D6] dark:divide-[#26352E] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1B4332] dark:text-[#34D399] flex items-center justify-center">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">Edit Informasi Profil</div>
                        <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">Perbarui nama tampilan, bio, atau kecamatan domisili</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4F5A52]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">Ganti Foto Profil</div>
                        <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">Unggah berkas foto baru (metadata EXIF dibersihkan otomatis)</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4F5A52]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">Postingan & Laporan Tersimpan</div>
                        <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">{(savedPosts || []).length} postingan diarsipkan untuk ditinjau nanti</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4F5A52]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1B4332] dark:text-[#34D399] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">Laporan Warga Saya</div>
                        <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">{reports.length} laporan diajukan ke dinas terkait</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4F5A52]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Keluar dari Akun</div>
                        <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">Akhiri sesi autentikasi perangkat ini</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="text-center pt-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                  TITIK. Platform Partisipasi Sipil Kota Bogor • Versi 2.0 (Supabase RLS Protected)
                </div>
              </div>
            )}
    </>
  );
};
