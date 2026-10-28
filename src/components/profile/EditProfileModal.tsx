import React from 'react';
import { CheckCircle2, Camera, Loader2, X, Globe, Sparkles, Palette, Trash2 } from 'lucide-react';
import type { ProfileController } from './useProfileController';
import { BOGOR_DISTRICTS, THEME_OPTIONS, BANNER_PRESETS } from './profileThemes';

interface EditProfileModalProps {
  ctrl: ProfileController;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ ctrl }) => {
  const { username, profile, bannerModalInputRef, isEditOpen, setIsEditOpen, editDisplayName, setEditDisplayName, editUsername, setEditUsername, editBio, setEditBio, editDistrict, setEditDistrict, editAvatarUrl, editBannerUrl, setEditBannerUrl, editBackgroundTheme, setEditBackgroundTheme, editWebsiteUrl, setEditWebsiteUrl, editCustomStatus, setEditCustomStatus, isSaving, editError, handleAvatarFileChange, handleModalBannerFileChange, handleSaveProfile } = ctrl;
  return (
    <>
        {isEditOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <div className="relative w-full max-w-lg bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl shadow-2xl overflow-hidden my-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#E4E2DA] dark:border-[#26352E] bg-white/70 dark:bg-[#1A221E]/70">
                <h3 id="edit-profile-title" className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                  Edit Profil Warga
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 rounded-lg text-[#686B65] hover:bg-stone-200 dark:hover:bg-[#26352E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    {editError}
                  </div>
                )}

                                {/* Avatar Uploader Preview */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={editAvatarUrl || profile?.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#263F35] dark:border-[#10B981]"
                    />
                    <label
                      htmlFor="avatar-file-input"
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#263F35] hover:bg-[#1d3129] text-white shadow-md cursor-pointer"
                      title="Ganti Foto"
                    >
                      <Camera className="w-3 h-3" />
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Foto Profil
                    </div>
                    <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                      JPG, PNG, atau WebP. Maks 5MB. EXIF lokasi dihapus otomatis demi privasi.
                    </div>
                  </div>
                </div>

                {/* Banner / Cover Customizer */}
                <div className="space-y-2 pt-2 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Foto Sampul (Banner)
                    </label>
                    {editBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setEditBannerUrl('')}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Foto Sampul</span>
                      </button>
                    )}
                  </div>

                  {/* Banner Preview */}
                  <div
                    className={`h-24 w-full rounded-xl overflow-hidden relative border border-[#E4E2DA] dark:border-[#26352E] bg-gradient-to-r ${
                      THEME_OPTIONS.find((t) => t.id === editBackgroundTheme)?.bannerGradient ||
                      THEME_OPTIONS[0].bannerGradient
                    }`}
                  >
                    {editBannerUrl ? (
                      <img
                        src={editBannerUrl}
                        alt="Preview Sampul"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs font-medium">
                        (Menggunakan tema gradien default)
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    
                    <input
                      ref={bannerModalInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleModalBannerFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => bannerModalInputRef.current?.click()}
                      className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Unggah Foto Sendiri</span>
                    </button>
                  </div>

                  {/* Curated Presets */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-[#686B65] dark:text-[#9EACA3]">
                      Atau pilih foto khas Bogor:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {BANNER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditBannerUrl(preset.url)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold truncate border transition-all text-left cursor-pointer ${
                            editBannerUrl === preset.url
                              ? 'border-[#263F35] dark:border-[#10B981] bg-[#EBF2EE] dark:bg-[#1E2E25] text-[#263F35] dark:text-[#34D399]'
                              : 'border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#686B65] hover:bg-stone-100 dark:hover:bg-[#26352E]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2 pt-2 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#263F35] dark:text-[#10B981]" />
                    <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Tema Latar & Warna Profil
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = editBackgroundTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setEditBackgroundTheme(theme.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#263F35] dark:border-[#10B981] bg-[#EBF2EE] dark:bg-[#1E2E25]'
                              : 'border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] hover:bg-stone-100 dark:hover:bg-[#26352E]'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full shrink-0 shadow-xs border border-white/40 ${
                              theme.id === 'editorial_forest'
                                ? 'bg-[#1E3A2F]'
                                : theme.id === 'bogor_slate'
                                ? 'bg-[#252F38]'
                                : theme.id === 'warm_terracotta'
                                ? 'bg-[#4E342E]'
                                : theme.id === 'midnight_charcoal'
                                ? 'bg-[#141B18]'
                                : 'bg-[#333027]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] truncate">
                              {theme.name}
                            </div>
                            <div className="text-[10px] text-[#686B65] dark:text-[#9EACA3] truncate">
                              {theme.description}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#263F35] dark:text-[#10B981] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Status Motto */}
                <div className="space-y-1 pt-2 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#263F35] dark:text-[#10B981]" />
                      <span>Slogan / Status Singkat</span>
                    </label>
                    <span className="text-[10px] text-[#686B65]">
                      {editCustomStatus.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editCustomStatus}
                    onChange={(e) => setEditCustomStatus(e.target.value)}
                    maxLength={60}
                    placeholder="Contoh: Jaga Kebersihan & Pantau APBD"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                  />
                </div>

                {/* Website / Media URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#263F35] dark:text-[#10B981]" />
                    <span>Tautan Situs / Media Warga</span>
                  </label>
                  <input
                    type="url"
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    maxLength={120}
                    placeholder="https://instagram.com/username atau https://blog.id"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Nama Tampilan / Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    maxLength={50}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Username (@)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#686B65]">@</span>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                      maxLength={24}
                      placeholder="budi_santoso"
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                    />
                  </div>
                  <p className="text-[10px] text-[#686B65]">
                    3-24 karakter huruf kecil, angka, garis bawah, atau titik.
                  </p>
                </div>

                {/* Domisili / Wilayah */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Kecamatan Domisili (Kota Bogor)
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                  >
                    {BOGOR_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Tentang Saya / Bio
                    </label>
                    <span className="text-[10px] text-[#686B65]">
                      {editBio.length}/250
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tuliskan peran atau kepedulian Anda terhadap tata kelola Kota Bogor..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35] resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E4E2DA] dark:border-[#26352E] text-[#20221D] dark:text-[#F3F6F4] hover:bg-stone-200 dark:hover:bg-[#26352E] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] hover:bg-[#1d3129] cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};
