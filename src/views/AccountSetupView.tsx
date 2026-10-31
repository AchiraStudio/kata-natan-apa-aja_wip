import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Sparkles,
  MapPin,
  Globe,
  Palette,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
  UserCheck,
  AtSign,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { UserAvatar } from '../components/common/UserAvatar';
import { TitikLogo } from '../components/common/TitikLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { BOGOR_DISTRICTS, THEME_OPTIONS, BANNER_PRESETS } from '../components/profile/profileThemes';
import { stripExifAndCleanImage, uploadFileToSupabase } from '../components/composer/useMediaUpload';

type SetupStep = 1 | 2 | 3;

const SETUP_STEPS: Array<{
  step: SetupStep;
  shortLabel: string;
  fullTitle: string;
  subtitle: string;
}> = [
  {
    step: 1,
    shortLabel: '1. Identitas',
    fullTitle: '1. Identitas & Domisili Warga',
    subtitle: 'Atur nama tampilan, username unik, foto profil, dan kecamatan domisili Anda.',
  },
  {
    step: 2,
    shortLabel: '2. Detail & Bio',
    fullTitle: '2. Tentang Anda & Detail Profil',
    subtitle: 'Tambahkan bio singkat, slogan warga, serta tautan media sosial atau situs Anda.',
  },
  {
    step: 3,
    shortLabel: '3. Tema & Sampul',
    fullTitle: '3. Kustomisasi Tema & Sampul Profil',
    subtitle: 'Pilih nuansa warna kartu profil dan foto sampul khas Kota Bogor.',
  },
];

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

  const activeTheme =
    THEME_OPTIONS.find((t) => t.id === backgroundTheme) || THEME_OPTIONS[0];

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-[#101913] dark:text-[#F3F6F4]">
            Sesi Akun Belum Aktif
          </h2>
          <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
            Silakan masuk atau daftar akun terlebih dahulu untuk mengatur profil warga Anda.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold cursor-pointer"
          >
            Masuk ke Akun
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${activeTheme.pageBg} text-[#101913] dark:text-[#F3F6F4] transition-colors duration-300`}>
      {/* Compact Sticky Top Bar */}
      <header className="shrink-0 z-30 border-b border-[#E3E0D6] dark:border-[#26352E] bg-white/90 dark:bg-[#131916]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#1B4332] shadow-xs shrink-0">
              <TitikLogo className="w-5 h-5" pinColor="#FFFFFF" innerColor="#1B4332" dotColor="#34D399" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-[#101913] dark:text-[#F3F6F4]">
                TITIK<span className="text-[#10B981]">.</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF2EE] dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399]">
                Langkah Penyiapan Profil
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] px-3 py-1.5 rounded-xl hover:bg-stone-200/60 dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            >
              Lewati untuk sekarang
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Split-Screen Container (No excessive page overflow on desktop) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch min-h-0">
          {/* LEFT COLUMN: Welcome + Live Real-Time Profile Card Preview */}
          <section
            aria-label="Pratinjau Kartu Profil"
            className="lg:col-span-5 flex flex-col justify-between bg-white/70 dark:bg-[#131916]/70 border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4"
          >
            <div className="space-y-3">
              {/* Compact Welcome Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1B4332] dark:text-[#34D399]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pratinjau Kartu Profil Anda (Real-Time)</span>
                </div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-[#101913] dark:text-[#F3F6F4] line-clamp-1">
                  Halo, {displayName || profile.displayName}!
                </h1>
                <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed">
                  Kartu di bawah ini menampilkan wujud profil publik Anda saat warga lain mengklik akun Anda.
                </p>
              </div>

              {/* Live Profile Card */}
              <div className={`relative ${activeTheme.cardBg} border ${activeTheme.cardBorder} rounded-2xl shadow-sm overflow-hidden transition-colors duration-300`}>
                {/* Banner Preview */}
                <div className={`h-28 sm:h-32 relative overflow-hidden bg-gradient-to-r ${activeTheme.bannerGradient}`}>
                  {bannerUrl && (
                    <img
                      src={bannerUrl}
                      alt="Pratinjau Sampul"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-900/80 hover:bg-rose-900 text-white text-[10px] font-semibold backdrop-blur-md cursor-pointer border border-white/15"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingMedia}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold shadow-md transition-all cursor-pointer border border-white/20"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{isUploadingMedia ? 'Mengunggah...' : 'Unggah Sampul'}</span>
                    </button>
                  </div>
                </div>

                {/* Identity Content */}
                <div className="px-4 pb-4 pt-0 relative">
                  <div className="flex items-end justify-between gap-2 -mt-10 mb-2.5">
                    <div className="relative group">
                      <UserAvatar
                        src={avatarUrl}
                        alt={displayName || 'Warga'}
                        name={displayName || 'Warga'}
                        role={profile.role}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover ring-4 ring-white dark:ring-[#131916] shadow-lg bg-stone-100"
                      />
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#1B4332] hover:bg-[#14352A] border border-white/30 text-white shadow-md cursor-pointer"
                        title="Unggah Foto Profil"
                        aria-label="Unggah Foto Profil"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Pakai Inisial</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-black text-[#101913] dark:text-[#F3F6F4] truncate">
                        {displayName.trim() || 'Nama Warga'}
                      </h2>
                      {customStatus.trim() && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1B4332] dark:text-[#34D399] bg-[#EBF2EE] dark:bg-[#1E2E25] px-2 py-0.5 rounded-full border border-[#C5D9CE] dark:border-[#2D4537] max-w-full truncate">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">&ldquo;{customStatus.trim()}&rdquo;</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-mono font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
                      @{username.trim().toLowerCase().replace(/^@+/, '') || 'username'}
                    </p>

                    {bio.trim() ? (
                      <p className="text-[11px] text-[#101913] dark:text-[#D1DCD5] leading-relaxed pt-0.5 line-clamp-2">
                        {bio.trim()}
                      </p>
                    ) : (
                      <p className="text-[11px] italic text-[#4F5A52]/70 dark:text-[#9EACA3]/60 pt-0.5">
                        Belum ada bio singkat.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">
                      {district.trim() && (
                        <span className="inline-flex items-center gap-1 font-medium text-[#101913] dark:text-[#F3F6F4]">
                          <MapPin className="w-3 h-3 text-[#1B4332] dark:text-[#34D399]" />
                          <span>{district.trim()}</span>
                        </span>
                      )}
                      {websiteUrl.trim() && (
                        <span className="inline-flex items-center gap-1 font-medium text-[#1B4332] dark:text-[#34D399] truncate max-w-[180px]">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate">{websiteUrl.trim().replace(/^https?:\/\//, '')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Progress Summary Pill */}
            <div className="pt-2 border-t border-[#E3E0D6]/70 dark:border-[#26352E] flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
              <span className="font-semibold">
                 Progres Langkah {currentStep} dari 3
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentStep === s
                        ? 'w-6 bg-[#1B4332] dark:bg-[#10B981]'
                        : currentStep > s
                        ? 'w-3 bg-[#10B981]/60'
                        : 'w-3 bg-[#E3E0D6] dark:bg-[#26352E]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Step-by-Step Form Wizard */}
          <form
            onSubmit={(e) => handleSaveSetup(e, 'profile')}
            className="lg:col-span-7 bg-white dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[420px]"
          >
            <div className="space-y-5">
              {/* Stepper Navigation Pills */}
              <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E]">
                {SETUP_STEPS.map((item) => {
                  const isActive = currentStep === item.step;
                  const isCompleted = currentStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => handleSelectStep(item.step)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
                        isActive
                          ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
                          : isCompleted
                          ? 'text-[#1B4332] dark:text-[#34D399] hover:bg-white/60 dark:hover:bg-[#26352E]'
                          : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{item.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {errorMessage && (
                <div
                  className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: Identitas & Domisili Warga */}
              <div className={currentStep === 1 ? 'space-y-4' : 'hidden'}>
                <div className="border-b border-[#E3E0D6] dark:border-[#26352E] pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <h3 className="text-sm font-black text-[#101913] dark:text-[#F3F6F4]">
                      1. Identitas & Domisili Warga
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                    Pastikan nama tampilan dan username Anda mudah dikenali oleh warga sekitar.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-display-name"
                      className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] block"
                    >
                      Nama Tampilan
                    </label>
                    <input
                      id="setup-display-name"
                      type="text"
                      required
                      maxLength={40}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Contoh: Rina Wijaya"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-username"
                      className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] flex items-center gap-1"
                    >
                      <AtSign className="w-3.5 h-3.5 text-[#4F5A52]" />
                      <span>Username</span>
                    </label>
                    <input
                      id="setup-username"
                      type="text"
                      required
                      maxLength={30}
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.#]/g, ''))
                      }
                      placeholder="rinawijaya"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-district"
                      className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
                      <span>Kecamatan Domisili</span>
                    </label>
                    <select
                      id="setup-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    >
                      <option value="">Pilih Kecamatan (Opsional)...</option>
                      {BOGOR_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] block">
                      Foto Profil Warga
                    </span>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingMedia}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-dashed border-[#1B4332]/40 dark:border-[#34D399]/40 bg-[#EBF2EE]/40 dark:bg-[#1E2E25]/40 text-[#1B4332] dark:text-[#34D399] hover:bg-[#EBF2EE] dark:hover:bg-[#1E2E25] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? 'Ganti Foto Profil' : 'Unggah Foto Profil'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: Tentang Anda & Detail Profil */}
              <div className={currentStep === 2 ? 'space-y-4' : 'hidden'}>
                <div className="border-b border-[#E3E0D6] dark:border-[#26352E] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <h3 className="text-sm font-black text-[#101913] dark:text-[#F3F6F4]">
                      2. Tentang Anda & Detail Profil
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                    Ceritakan fokus atau kepedulian Anda terhadap lingkungan tempat tinggal.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="setup-bio"
                      className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]"
                    >
                      Bio Singkat
                    </label>
                    <span className="text-[10px] text-[#4F5A52]">{bio.length}/160</span>
                  </div>
                  <textarea
                    id="setup-bio"
                    rows={3}
                    maxLength={160}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan fokus atau kepedulian Anda di lingkungan tempat tinggal (mis: Pemantau drainase & ruang terbuka hijau)..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="setup-status"
                        className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
                        <span>Slogan / Status Singkat</span>
                      </label>
                      <span className="text-[10px] text-[#4F5A52]">{customStatus.length}/60</span>
                    </div>
                    <input
                      id="setup-status"
                      type="text"
                      maxLength={60}
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Contoh: Kawal Infrastruktur Lingkungan"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-website"
                      className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
                      <span>Tautan Situs / Media Sosial</span>
                    </label>
                    <input
                      id="setup-website"
                      type="url"
                      maxLength={120}
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/60 dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:ring-2 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: Kustomisasi Tema & Sampul Profil */}
              <div className={currentStep === 3 ? 'space-y-4' : 'hidden'}>
                <div className="border-b border-[#E3E0D6] dark:border-[#26352E] pb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <h3 className="text-sm font-black text-[#101913] dark:text-[#F3F6F4]">
                      3. Kustomisasi Tema & Sampul Profil
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                    Pilih warna aksen kartu profil dan gambar sampul Anda.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    Pilih Tema Warna Profil
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = backgroundTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setBackgroundTheme(theme.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#1B4332] dark:border-[#10B981] bg-[#EBF2EE] dark:bg-[#1E2E25] shadow-xs'
                              : 'border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF]/50 dark:bg-[#1A221E] hover:bg-stone-100 dark:hover:bg-[#26352E]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full shrink-0 border border-white/40 ${
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
                            <div className="text-[11px] font-bold text-[#101913] dark:text-[#F3F6F4] truncate">
                              {theme.name}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#10B981] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    Koleksi Foto Sampul Khas Bogor
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((preset) => {
                      const isPresetSelected = bannerUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBannerUrl(preset.url)}
                          className={`group relative h-14 rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                            isPresetSelected
                              ? 'border-2 border-[#1B4332] dark:border-[#10B981] ring-2 ring-[#1B4332]/20'
                              : 'border-[#E3E0D6] dark:border-[#26352E] opacity-85 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-bold text-white truncate">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Wizard Footer Navigation */}
            <div className="pt-4 mt-4 border-t border-[#E3E0D6] dark:border-[#26352E] flex flex-wrap items-center justify-between gap-2.5">
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSaving || isUploadingMedia}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSaveSetup(e, 'feed')}
                    disabled={isSaving || isUploadingMedia}
                    className="px-3.5 py-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
                  >
                    Simpan & Langsung ke Beranda
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {currentStep < 3 ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleSaveSetup(e, 'profile')}
                      disabled={isSaving || isUploadingMedia}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-[#1B4332] dark:text-[#34D399] hover:bg-[#EBF2EE] dark:hover:bg-[#1E2E25] transition-colors cursor-pointer"
                    >
                      Simpan & Lihat Profil Saya
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isSaving || isUploadingMedia}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] hover:bg-[#14352A] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Lanjut</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleSaveSetup(e, 'feed')}
                      disabled={isSaving || isUploadingMedia}
                      className="px-3.5 py-2.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
                    >
                      Simpan & ke Beranda
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isUploadingMedia}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] hover:bg-[#14352A] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <span>Simpan & Lihat Profil Saya</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
