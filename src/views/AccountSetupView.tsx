import React, { useState, useRef, useEffect } from 'react';
import { Select } from '../components/common/Select';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  Sparkles,
  MapPin,
  Globe,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { UserAvatar } from '../components/common/UserAvatar';
import { TitikLogo } from '../components/common/TitikLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { METRO_JABODETABEK_DISTRICTS } from '../data/metroDistricts';
import { THEME_OPTIONS, BANNER_PRESETS, getProfileTheme } from '../components/profile/profileThemes';
import { stripExifAndCleanImage, uploadFileToSupabase } from '../components/composer/useMediaUpload';

type SetupStep = 1 | 2 | 3;

const SETUP_STEPS: Array<{
  step: SetupStep;
  label: string;
  title: string;
  subtitle: string;
}> = [
  {
    step: 1,
    label: 'Identitas',
    title: 'Kenalkan diri Anda',
    subtitle: 'Nama tampilan dan username adalah cara warga lain mengenali Anda.',
  },
  {
    step: 2,
    label: 'Tentang Anda',
    title: 'Ceritakan kepedulian Anda',
    subtitle: 'Bio singkat dan tautan membantu warga memahami fokus Anda. Semuanya boleh dikosongkan.',
  },
  {
    step: 3,
    label: 'Tampilan',
    title: 'Pilih nuansa profil',
    subtitle: 'Warna dan foto sampul tampil di bagian atas profil publik Anda.',
  },
];

const labelClass = 'block text-sm font-medium text-ink mb-1.5';
const inputClass = 'titik-pill-input px-3.5 min-h-11';
const btnPrimary = 'titik-pill-btn titik-pill-btn-primary min-h-11 px-5 text-sm';
const btnSecondary = 'titik-pill-btn titik-pill-btn-secondary min-h-11 px-4 text-sm';
const btnGhost = 'titik-pill-btn min-h-11 px-3 text-sm text-ink-2 hover:text-ink';

const gradientOf = (from: string, to: string) => ({ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` });

export const AccountSetupView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated, refreshProfile, updateProfileState } = useAuth();

  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [district, setDistrict] = useState(profile.district || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [customStatus, setCustomStatus] = useState(profile.customStatus || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '');
  const [backgroundTheme, setBackgroundTheme] = useState(
    profile.backgroundTheme || 'editorial_forest'
  );

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && profile.id !== 'usr-anon') {
      setDisplayName((prev) => prev || profile.displayName || '');
      setUsername((prev) => prev || profile.username || '');
      setDistrict((prev) => prev || profile.district || '');
      setBio((prev) => prev || profile.bio || '');
      setCustomStatus((prev) => prev || profile.customStatus || '');
      setWebsiteUrl((prev) => prev || profile.websiteUrl || '');
      setAvatarUrl((prev) => prev || profile.avatarUrl || '');
      setBannerUrl((prev) => prev || profile.bannerUrl || '');
      setBackgroundTheme((prev) => prev || profile.backgroundTheme || 'editorial_forest');
    }
  }, [profile]);

  const activeTheme = getProfileTheme(backgroundTheme);
  const step = SETUP_STEPS[currentStep - 1];
  const previewHandle = username.trim().toLowerCase().replace(/^@+/, '');
  const isBusy = isSaving || isUploadingMedia;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const validateIdentityFields = (): boolean => {
    const cleanName = displayName.trim();
    const cleanHandle = username.trim().toLowerCase().replace(/^@+/, '');

    if (cleanName.length < 2 || cleanName.length > 40) {
      setErrorMessage('Nama tampilan wajib diisi (2 sampai 40 karakter).');
      setCurrentStep(1);
      return false;
    }
    if (!/^[a-z0-9_.#]{3,30}$/.test(cleanHandle)) {
      setErrorMessage(
        'Username hanya boleh 3-30 karakter huruf kecil, angka, garis bawah (_), titik (.), atau tag (#).'
      );
      setCurrentStep(1);
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateIdentityFields()) {
      return;
    }
    setErrorMessage(null);
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as SetupStep);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SetupStep);
    }
  };

  const handleSelectStep = (targetStep: SetupStep) => {
    if (targetStep > 1 && !validateIdentityFields()) {
      return;
    }
    setErrorMessage(null);
    setCurrentStep(targetStep);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran foto profil maksimal 5MB.');
      return;
    }

    try {
      setIsUploadingMedia(true);
      setErrorMessage(null);
      const cleaned = await stripExifAndCleanImage(file, 1600, 600, 0.85);
      const uploadedUrl = await uploadFileToSupabase(
        'avatars',
        cleaned.blob,
        profile?.id,
        `avatar-${Date.now()}`
      );
      setAvatarUrl(uploadedUrl);
      showToast('Foto profil berhasil diunggah.');
    } catch (err) {
      console.error('Setup avatar upload failed:', err);
      setErrorMessage('Gagal mengunggah foto profil. Silakan coba gambar lain.');
    } finally {
      setIsUploadingMedia(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan untuk sampul.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Ukuran foto sampul maksimal 8MB.');
      return;
    }

    try {
      setIsUploadingMedia(true);
      setErrorMessage(null);
      const cleaned = await stripExifAndCleanImage(file, 1600, 600, 0.85);
      const uploadedUrl = await uploadFileToSupabase(
        'avatars',
        cleaned.blob,
        profile?.id,
        `banner-${Date.now()}`
      );
      setBannerUrl(uploadedUrl);
      showToast('Foto sampul berhasil diunggah.');
    } catch (err) {
      console.error('Setup banner upload failed:', err);
      setErrorMessage('Gagal mengunggah foto sampul. Silakan coba gambar lain.');
    } finally {
      setIsUploadingMedia(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleSaveSetup = async (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    destination: 'feed' | 'profile' = 'profile'
  ) => {
    event.preventDefault();
    if (!validateIdentityFields()) {
      return;
    }

    const cleanName = displayName.trim();
    const cleanHandle = username.trim().toLowerCase().replace(/^@+/, '');

    setIsSaving(true);

    const profilePatch = {
      displayName: cleanName,
      username: cleanHandle,
      district: district.trim() || undefined,
      bio: bio.trim() || undefined,
      customStatus: customStatus.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      avatarUrl: avatarUrl || '',
      bannerUrl: bannerUrl || undefined,
      backgroundTheme,
    };

    try {
      const updated = await dataService.updateProfile({
        displayName: cleanName,
        username: cleanHandle,
        district: district.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
        websiteUrl: websiteUrl.trim(),
        avatarUrl: avatarUrl || undefined,
        bannerUrl,
        backgroundTheme,
      });

      updateProfileState?.(updated);
      await refreshProfile();
    } catch (err) {
      console.warn('Could not persist setup to remote DB, applying to session state:', err);
      updateProfileState?.(profilePatch);
    } finally {
      setIsSaving(false);
    }

    if (destination === 'profile') {
      navigate(`/u/${encodeURIComponent(cleanHandle)}`);
    } else {
      navigate('/');
    }
  };

  // Enter inside a field moves forward; it only saves from the last step
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStep < 3) handleNextStep();
    else void handleSaveSetup(event, 'profile');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 text-ink">
        <div className="panel max-w-md w-full p-7 sm:p-9 text-center space-y-5">
          <TitikLogo className="w-12 h-12 mx-auto" />
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold">Sesi akun belum aktif</h1>
            <p className="text-sm text-ink-2">
              Masuk atau daftar terlebih dahulu untuk menyiapkan profil warga Anda.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/login')} className={`${btnPrimary} w-full`}>
            Masuk ke akun
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col text-ink">
      {/* Floating glass bar */}
      <div className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
        <header className="glass-strong mx-auto max-w-6xl h-14 px-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <TitikLogo className="w-8 h-8 shrink-0" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              TITIK<span className="text-brand">.</span>
            </span>
            <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-soft text-ink">
              Penyiapan profil
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => navigate('/')} className={btnGhost}>
              Lewati dulu
            </button>
            <ThemeToggle />
          </div>
        </header>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-strong px-4 py-2.5 rounded-xl text-sm font-semibold text-ink flex items-center gap-2 titik-pop"
        >
          <Check className="w-4 h-4 text-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-6 pb-16">
        <div className="titik-stagger grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 lg:gap-8 items-start">
          {/* LEFT: what the public profile will look like, updating as the user types */}
          <section aria-label="Pratinjau profil" className="space-y-4 lg:sticky lg:top-24">
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                Pratinjau langsung
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                Halo, {displayName.trim() || profile.displayName}
              </h1>
              <p className="text-sm text-ink-2 max-w-md">
                Begini profil Anda tampil bagi warga lain. Ubah isian di samping dan kartu ini ikut berubah.
              </p>
            </div>

            <div className="panel overflow-hidden">
              <div
                className="relative h-28 sm:h-36"
                style={gradientOf(activeTheme.bannerFrom, activeTheme.bannerTo)}
              >
                {bannerUrl && (
                  <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                  aria-label="Unggah foto sampul"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="glass-media inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer hover:bg-black/60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="glass-media inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer hover:bg-black/60 disabled:opacity-60"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isUploadingMedia ? 'Mengunggah...' : 'Ganti sampul'}
                  </button>
                </div>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                {/* Opaque backing: the initials avatar is translucent, so without it the cover edge cuts through the letters */}
                <div className="relative z-10 -mt-10 sm:-mt-12 w-fit rounded-full bg-surface-solid ring-4 ring-surface-solid">
                  <UserAvatar
                    src={avatarUrl}
                    alt={displayName || 'Warga'}
                    name={displayName || 'Warga'}
                    role={profile.role}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    aria-label="Unggah foto profil"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="absolute -bottom-0.5 -right-0.5 w-9 h-9 rounded-full bg-brand text-on-brand ring-4 ring-surface flex items-center justify-center cursor-pointer hover:bg-brand-hover disabled:opacity-60"
                    title="Unggah foto profil"
                    aria-label="Unggah foto profil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 min-w-0">
                  <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight truncate">
                    {displayName.trim() || <span className="text-ink-3">Nama Anda</span>}
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-3">
                    @{previewHandle || 'username'}
                  </p>
                </div>

                {customStatus.trim() && <p className="mt-4 text-sm text-ink break-words">{customStatus.trim()}</p>}
                {bio.trim() ? (
                  <p className="mt-2 text-sm text-ink-2 whitespace-pre-wrap break-words max-w-prose">{bio.trim()}</p>
                ) : (
                  <p className="mt-3 text-sm text-ink-3 italic">Bio belum diisi.</p>
                )}

                {(district.trim() || websiteUrl.trim()) && (
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-2">
                    {district.trim() && (
                      <li className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {district.trim()}
                      </li>
                    )}
                    {websiteUrl.trim() && (
                      <li className="inline-flex items-center gap-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{websiteUrl.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')}</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: three short steps */}
          <form onSubmit={handleFormSubmit} noValidate className="panel p-5 sm:p-8 flex flex-col gap-7">
            <ol aria-label="Langkah penyiapan profil" className="flex items-center">
              {SETUP_STEPS.map((item, index) => {
                const state = currentStep === item.step ? 'current' : currentStep > item.step ? 'done' : 'todo';
                return (
                  <li key={item.step} className={`flex items-center ${index < SETUP_STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectStep(item.step)}
                      aria-current={state === 'current' ? 'step' : undefined}
                      className="flex items-center gap-2.5 rounded-lg cursor-pointer"
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                          state === 'current'
                            ? 'bg-brand text-on-brand shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]'
                            : state === 'done'
                            ? 'bg-brand-soft text-ink'
                            : 'bg-surface-2 text-ink-3'
                        }`}
                      >
                        {state === 'done' ? <Check className="w-4 h-4" strokeWidth={2.6} /> : item.step}
                      </span>
                      <span
                        className={`hidden sm:block text-sm ${
                          state === 'current' ? 'font-semibold text-ink' : 'font-medium text-ink-2'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                    {index < SETUP_STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`mx-3 sm:mx-4 h-0.5 flex-1 rounded-full transition-colors ${
                          currentStep > item.step ? 'bg-brand' : 'bg-line'
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            <div key={currentStep} className="titik-rise space-y-6">
              <div>
                <p className="text-xs font-semibold text-ink-3">
                  Langkah {currentStep} dari 3 · {step.label}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{step.title}</h2>
                <p className="mt-1.5 text-sm text-ink-2">{step.subtitle}</p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl px-3.5 py-3 text-sm border border-st-ditolak/40 text-st-ditolak bg-st-ditolak/10 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
                    <UserAvatar
                      src={avatarUrl}
                      alt={displayName || 'Warga'}
                      name={displayName || 'Warga'}
                      role={profile.role}
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">Foto profil</p>
                      <p className="text-xs text-ink-3">JPG, PNG, atau WebP, maksimal 5 MB. Tanpa foto, inisial Anda yang tampil.</p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingMedia}
                          className="titik-pill-btn titik-pill-btn-secondary min-h-9 px-3 text-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {avatarUrl ? 'Ganti foto' : 'Unggah foto'}
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="titik-pill-btn min-h-9 px-3 text-xs text-ink-2 hover:text-ink"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Pakai inisial
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="setup-display-name" className={labelClass}>Nama tampilan</label>
                      <input
                        id="setup-display-name"
                        type="text"
                        maxLength={40}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Contoh: Rina Wijaya"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="setup-username" className={labelClass}>Username</label>
                      <div className="relative">
                        <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 text-sm">@</span>
                        <input
                          id="setup-username"
                          type="text"
                          maxLength={30}
                          value={username}
                          onChange={(e) =>
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.#]/g, ''))
                          }
                          placeholder="rinawijaya"
                          autoComplete="username"
                          className={`${inputClass} pl-8 font-mono`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="setup-district" className={labelClass}>
                      Kecamatan domisili <span className="font-normal text-ink-3">(opsional)</span>
                    </label>
                    <Select
                      id="setup-district"
                      value={district}
                      onChange={setDistrict}
                      className="min-h-11"
                    >
                      <option value="">Pilih kecamatan</option>
                      {METRO_JABODETABEK_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="setup-bio" className={labelClass}>Bio singkat</label>
                      <span className="text-xs text-ink-3 tabular-nums">{bio.length}/160</span>
                    </div>
                    <textarea
                      id="setup-bio"
                      rows={4}
                      maxLength={160}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Mis. pemantau drainase dan ruang terbuka hijau di lingkungan saya"
                      className={`${inputClass} py-2.5 resize-none`}
                    />
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="setup-status" className={labelClass}>Slogan</label>
                      <span className="text-xs text-ink-3 tabular-nums">{customStatus.length}/60</span>
                    </div>
                    <input
                      id="setup-status"
                      type="text"
                      maxLength={60}
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Contoh: Kawal infrastruktur lingkungan"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="setup-website" className={labelClass}>Situs atau media sosial</label>
                    <input
                      id="setup-website"
                      type="url"
                      maxLength={120}
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-7">
                  <fieldset>
                    <legend className={labelClass}>Warna sampul</legend>
                    <div role="radiogroup" aria-label="Warna sampul" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {THEME_OPTIONS.map((theme) => {
                        const isSelected = backgroundTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setBackgroundTheme(theme.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                              isSelected ? 'bg-surface-2 ring-2 ring-brand' : 'bg-canvas ring-1 ring-line hover:bg-surface-2'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className="w-12 h-12 rounded-lg shrink-0"
                              style={gradientOf(theme.bannerFrom, theme.bannerTo)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-ink leading-snug">{theme.name}</span>
                              <span className="block text-xs text-ink-3 truncate">{theme.description}</span>
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-brand shrink-0" strokeWidth={2.6} />}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="text-sm font-medium text-ink">Foto sampul</p>
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="titik-pill-btn titik-pill-btn-secondary min-h-9 px-3 text-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isUploadingMedia ? 'Mengunggah...' : 'Unggah sendiri'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BANNER_PRESETS.map((preset) => {
                        const isPresetSelected = bannerUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            aria-pressed={isPresetSelected}
                            onClick={() => setBannerUrl(isPresetSelected ? '' : preset.url)}
                            className={`group relative h-16 rounded-xl overflow-hidden text-left cursor-pointer ${
                              isPresetSelected ? 'ring-2 ring-brand' : 'ring-1 ring-line'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                            <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-semibold text-white truncate">
                              {preset.label}
                            </span>
                            {isPresetSelected && (
                              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand text-on-brand flex items-center justify-center">
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-ink-3">Ketuk foto yang sama sekali lagi untuk melepasnya.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: the forward action is always the strongest thing here */}
            <div className="pt-6 border-t border-line-soft flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-1">
                {currentStep > 1 && (
                  <button type="button" onClick={handlePrevStep} disabled={isBusy} className={btnGhost}>
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveSetup(e, 'feed')}
                    disabled={isBusy}
                    className={btnGhost}
                  >
                    Simpan, lanjut nanti
                  </button>
                )}
              </div>

              {currentStep < 3 ? (
                <button type="submit" disabled={isBusy} className={`${btnPrimary} sm:min-w-36`}>
                  Lanjut
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveSetup(e, 'feed')}
                    disabled={isBusy}
                    className={btnSecondary}
                  >
                    Simpan & ke beranda
                  </button>
                  <button type="submit" disabled={isBusy} className={btnPrimary}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        Simpan & lihat profil
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
