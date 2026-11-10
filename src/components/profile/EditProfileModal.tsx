import React, { useEffect, useRef } from 'react';
import { Select } from '../common/Select';
import { Camera, Check, Loader2, X, Trash2 } from 'lucide-react';
import type { ProfileController } from './useProfileController';
import { METRO_JABODETABEK_DISTRICTS } from '../../data/metroDistricts';
import { THEME_OPTIONS, BANNER_PRESETS, getProfileTheme } from './profileThemes';
import { UserAvatar } from '../common/UserAvatar';

interface EditProfileModalProps {
  ctrl: ProfileController;
}

const fieldClass =
  'w-full h-11 px-3.5 text-sm rounded-[10px] border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors';
const labelClass = 'block text-[13px] font-semibold text-ink mb-1.5';
const hintClass = 'mt-1.5 text-xs text-ink-3';

/** Preset covers are stored at 1200px wide; the picker only needs a thumbnail. */
const thumb = (url: string) => url.replace(/w=\d+/, 'w=320');

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ ctrl }) => {
  const {
    profile,
    bannerModalInputRef,
    isEditOpen,
    setIsEditOpen,
    editDisplayName,
    setEditDisplayName,
    editUsername,
    setEditUsername,
    editBio,
    setEditBio,
    editDistrict,
    setEditDistrict,
    editAvatarUrl,
    setEditAvatarUrl,
    editBannerUrl,
    setEditBannerUrl,
    editBackgroundTheme,
    setEditBackgroundTheme,
    editWebsiteUrl,
    setEditWebsiteUrl,
    editCustomStatus,
    setEditCustomStatus,
    isSaving,
    editError,
    handleAvatarFileChange,
    handleModalBannerFileChange,
    handleSaveProfile,
  } = ctrl;

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) setIsEditOpen(false);
    };
    document.addEventListener('keydown', onKey);
    nameInputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isEditOpen, isSaving, setIsEditOpen]);

  if (!isEditOpen) return null;

  const theme = getProfileTheme(editBackgroundTheme);
  const previewName = editDisplayName.trim() || profile?.displayName || 'Nama Anda';
  const previewHandle = editUsername || profile?.username || 'username';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) setIsEditOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="relative flex flex-col w-full sm:max-w-2xl max-h-[100dvh] sm:max-h-[90vh] bg-surface sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
      >
        <header className="flex items-center justify-between gap-3 px-5 h-14 shrink-0 border-b border-line">
          <h2 id="edit-profile-title" className="text-base font-bold text-ink">
            Ubah profil
          </h2>
          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            aria-label="Tutup"
            className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center text-ink-2 hover:bg-surface-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSaveProfile} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Live preview: the same cover + avatar arrangement as the profile page */}
            <div className="relative">
              <div
                className="relative h-32 sm:h-40"
                style={{ backgroundImage: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
              >
                {editBannerUrl && (
                  <img src={editBannerUrl} alt="Pratinjau sampul" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              <div className="px-5 pb-1">
                <div className="flex items-end justify-between gap-3 -mt-10">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={editAvatarUrl}
                      alt={previewName}
                      name={previewName}
                      role={profile?.role}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-surface"
                    />
                    <label
                      htmlFor="avatar-file-input"
                      title="Ganti foto profil"
                      className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center ring-2 ring-surface cursor-pointer hover:bg-brand-hover focus-within:ring-brand"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="sr-only">Ganti foto profil</span>
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl('')}
                        className="h-8 px-3 rounded-lg text-xs font-semibold text-ink-2 hover:bg-surface-2 cursor-pointer"
                      >
                        Hapus foto
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-base font-bold text-ink truncate">{previewName}</p>
                <p className="text-sm text-ink-3 truncate">@{previewHandle}</p>
              </div>
            </div>

            <div className="px-5 py-5 space-y-7">
              {editError && (
                <p role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
                  {editError}
                </p>
              )}

              {/* Cover + theme */}
              <section aria-labelledby="cover-heading" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="cover-heading" className="text-sm font-bold text-ink">
                    Sampul dan warna
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      ref={bannerModalInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleModalBannerFileChange}
                    />
                    {editBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setEditBannerUrl('')}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus sampul
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => bannerModalInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-2 hover:bg-line text-ink text-xs font-semibold cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Unggah foto
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-ink-3 mb-2">Atau pilih foto Bogor</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((preset) => {
                      const selected = editBannerUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditBannerUrl(preset.url)}
                          aria-pressed={selected}
                          title={preset.label}
                          className={`group relative h-16 rounded-[10px] overflow-hidden bg-surface-2 cursor-pointer outline-offset-2 ${
                            selected ? 'ring-2 ring-brand' : 'ring-1 ring-line hover:ring-ink-3'
                          }`}
                        >
                          <img src={thumb(preset.url)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black/60 text-white text-[11px] font-medium text-left truncate">
                            {preset.label}
                          </span>
                          {selected && (
                            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand text-on-brand flex items-center justify-center">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-ink-3 mb-2">Warna sampul bila tanpa foto</p>
                  <div role="radiogroup" aria-label="Warna sampul" className="flex flex-wrap gap-2">
                    {THEME_OPTIONS.map((t) => {
                      const selected = editBackgroundTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setEditBackgroundTheme(t.id)}
                          title={`${t.name}: ${t.description}`}
                          className={`flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full text-xs font-semibold cursor-pointer ${
                            selected ? 'bg-surface-2 text-ink ring-2 ring-brand' : 'text-ink-2 ring-1 ring-line hover:bg-surface-2'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="w-7 h-7 rounded-full shrink-0"
                            style={{ backgroundImage: `linear-gradient(135deg, ${t.bannerFrom}, ${t.bannerTo})` }}
                          />
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Identity */}
              <section aria-labelledby="identity-heading" className="space-y-4">
                <h3 id="identity-heading" className="text-sm font-bold text-ink">
                  Identitas
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="edit-display-name" className={labelClass}>Nama tampilan</label>
                    <input
                      ref={nameInputRef}
                      id="edit-display-name"
                      type="text"
                      required
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      maxLength={50}
                      autoComplete="name"
                      className="min-h-11"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-username" className={labelClass}>Username</label>
                    <div className="relative">
                      <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3">@</span>
                      <input
                        id="edit-username"
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        maxLength={24}
                        autoComplete="username"
                        aria-describedby="edit-username-hint"
                        className={`${fieldClass} pl-8 font-mono`}
                      />
                    </div>
                    <p id="edit-username-hint" className={hintClass}>3 sampai 24 karakter: huruf kecil, angka, _ atau titik.</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="edit-status" className={labelClass}>Status singkat</label>
                    <span className="text-xs text-ink-3 tabular-nums">{editCustomStatus.length}/60</span>
                  </div>
                  <input
                    id="edit-status"
                    type="text"
                    value={editCustomStatus}
                    onChange={(e) => setEditCustomStatus(e.target.value)}
                    maxLength={60}
                    placeholder="Tampil di bawah nama Anda"
                    className="min-h-11"
                  />
                </div>
              </section>

              {/* About */}
              <section aria-labelledby="about-heading" className="space-y-4">
                <h3 id="about-heading" className="text-sm font-bold text-ink">
                  Tentang Anda
                </h3>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="edit-bio" className={labelClass}>Bio</label>
                    <span className="text-xs text-ink-3 tabular-nums">{editBio.length}/250</span>
                  </div>
                  <textarea
                    id="edit-bio"
                    rows={3}
                    maxLength={250}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[10px] border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 resize-none transition-colors"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="edit-district" className={labelClass}>Kecamatan</label>
                    <Select
                      id="edit-district"
                      value={editDistrict}
                      onChange={setEditDistrict}
                      className="min-h-11"
                    >
                      <option value="">Tidak ditampilkan</option>
                      {METRO_JABODETABEK_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="edit-website" className={labelClass}>Tautan</label>
                    <input
                      id="edit-website"
                      type="url"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                      maxLength={120}
                      inputMode="url"
                      placeholder="https://"
                      className="min-h-11"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 px-5 py-3 shrink-0 border-t border-line bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
              className="h-10 px-4 text-sm font-semibold rounded-[10px] text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-[10px] bg-brand text-on-brand hover:bg-brand-hover cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan
                </>
              ) : (
                'Simpan perubahan'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
