import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Heart,
  MapPin,
  MessageSquare,
  Share2,
  Edit3,
  Camera,
  Bookmark,
  LogOut,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  ShieldAlert,
  Settings,
  ChevronRight,
  Globe,
  ExternalLink,
  Sparkles,
  Palette,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/TitikContext';
import { dataService } from '../services/dataService';
import { UserProfile, Post, Report } from '../types/domain';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';
import { stripExifAndCleanImage, uploadFileToSupabase } from '../components/composer/useMediaUpload';

const BOGOR_DISTRICTS = [
  'Bogor Tengah',
  'Bogor Timur',
  'Bogor Barat',
  'Bogor Selatan',
  'Bogor Utara',
  'Tanah Sareal',
];

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  bannerGradient: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  statBg: string;
  swatchHex: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'editorial_forest',
    name: 'Hutan Hujan Bogor',
    description: 'Hijau cemara khas alam Kota Hujan',
    bannerGradient: 'from-[#1E3A2F] via-[#2A4C3E] to-[#1E3A2F]',
    pageBg: 'bg-[#F4F6F4] dark:bg-[#0A120E]',
    cardBg: 'bg-white dark:bg-[#131C17]',
    cardBorder: 'border-[#D5DDD7] dark:border-[#1E2D25]',
    statBg: 'bg-[#EFF4F0] dark:bg-[#16221C]',
    swatchHex: '#1E3A2F',
  },
  {
    id: 'bogor_slate',
    name: 'Batu Andesit Salak',
    description: 'Batu sungai dingin Gunung Salak',
    bannerGradient: 'from-[#1E252B] via-[#2D3740] to-[#1E252B]',
    pageBg: 'bg-[#F2F4F7] dark:bg-[#0D1115]',
    cardBg: 'bg-white dark:bg-[#151B21]',
    cardBorder: 'border-[#D2D8DF] dark:border-[#222C36]',
    statBg: 'bg-[#EAEEF3] dark:bg-[#1A222A]',
    swatchHex: '#252F38',
  },
  {
    id: 'warm_terracotta',
    name: 'Bata Klasik Suryakencana',
    description: 'Terakota hangat kawasan cagar budaya',
    bannerGradient: 'from-[#3E2723] via-[#4E342E] to-[#3E2723]',
    pageBg: 'bg-[#F8F5F2] dark:bg-[#140E0C]',
    cardBg: 'bg-white dark:bg-[#1C1513]',
    cardBorder: 'border-[#E0D7D0] dark:border-[#2C211D]',
    statBg: 'bg-[#F2ECE6] dark:bg-[#231A17]',
    swatchHex: '#4E342E',
  },
  {
    id: 'midnight_charcoal',
    name: 'Malam Kebun Raya',
    description: 'Gelap arang malam dengan aksen tajam',
    bannerGradient: 'from-[#111815] via-[#16201B] to-[#111815]',
    pageBg: 'bg-[#F5F5F4] dark:bg-[#0A0D0B]',
    cardBg: 'bg-white dark:bg-[#121614]',
    cardBorder: 'border-[#DEDDD9] dark:border-[#1E2521]',
    statBg: 'bg-[#EAEAE7] dark:bg-[#171D1A]',
    swatchHex: '#141B18',
  },
  {
    id: 'vintage_paper',
    name: 'Arsip Berita Cetak',
    description: 'Nuansa kertas koran dan arsip kota',
    bannerGradient: 'from-[#2B2922] via-[#38352C] to-[#2B2922]',
    pageBg: 'bg-[#F7F5EE] dark:bg-[#12110D]',
    cardBg: 'bg-white dark:bg-[#1B1914]',
    cardBorder: 'border-[#DDD8C8] dark:border-[#2A261D]',
    statBg: 'bg-[#EFECE0] dark:bg-[#221F18]',
    swatchHex: '#333027',
  },
];

const BANNER_PRESETS = [
  {
    id: 'kebun_raya',
    label: 'Kanopi Kebun Raya',
    url: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'salak_mist',
    label: 'Kabut Gunung Salak',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'green_valley',
    label: 'Lembah Hijau Puncak',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'night_sky',
    label: 'Langit Malam Salak',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  },
];


export const ProfileView: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { profile: currentAuthProfile, isAuthenticated, refreshProfile, signOut } = useAuth();
  const { openComposer, openReportDetail } = useTitik();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reports' | 'saved' | 'settings'>('posts');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerModalInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editBackgroundTheme, setEditBackgroundTheme] = useState('editorial_forest');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editCustomStatus, setEditCustomStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwnProfile = Boolean(
    isAuthenticated &&
      profile &&
      (currentAuthProfile.id === profile.id ||
        currentAuthProfile.username.toLowerCase() === profile.username.toLowerCase())
  );

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari akun?');
    if (!confirmed) return;
    await signOut();
    navigate('/login');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetUsername = username || currentAuthProfile.username;
      if (!targetUsername) {
        setError('Pengguna tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      let fetchedProfile = await dataService.getProfileByUsername(targetUsername);
      if (
        !fetchedProfile &&
        isAuthenticated &&
        currentAuthProfile.username &&
        targetUsername.toLowerCase() === currentAuthProfile.username.toLowerCase()
      ) {
        fetchedProfile = currentAuthProfile;
      }

      if (!fetchedProfile) {
        setError('Profil tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      setProfile(fetchedProfile);

      // Load posts and reports for this user
      const [userPosts, userReports] = await Promise.all([
        dataService.getUserPosts(fetchedProfile.id).catch(() => []),
        dataService.getUserReports(fetchedProfile.id).catch(() => []),
      ]);

      setPosts(userPosts);
      setReports(userReports);

      // If viewing own profile, load saved posts
      const isViewerOwner =
        isAuthenticated &&
        (currentAuthProfile.id === fetchedProfile.id ||
          currentAuthProfile.username.toLowerCase() === fetchedProfile.username.toLowerCase());

      if (isViewerOwner) {
        try {
          const saved = await dataService.getSavedPosts(currentAuthProfile.id);
          setSavedPosts(saved);
        } catch {
          setSavedPosts([]);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load profile data:', err);
      setError('Gagal memuat profil. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  }, [username, currentAuthProfile, isAuthenticated]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setEditDistrict(profile.district || 'Bogor Tengah');
    setEditAvatarUrl(profile.avatarUrl || '');
    setEditBannerUrl(profile.bannerUrl || '');
    setEditBackgroundTheme(profile.backgroundTheme || 'editorial_forest');
    setEditWebsiteUrl(profile.websiteUrl || '');
    setEditCustomStatus(profile.customStatus || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const msg = 'Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan.';
      if (isEditOpen) setEditError(msg); else showToast(msg);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Ukuran gambar maksimal 5MB.';
      if (isEditOpen) setEditError(msg); else showToast(msg);
      return;
    }

    try {
      setIsSaving(true);
      if (!isEditOpen) showToast('Sedang memproses foto profil...');
      const cleaned = await stripExifAndCleanImage(file, 1600, 600, 0.85);
      const uploadedUrl = await uploadFileToSupabase('avatars', cleaned.blob, profile?.id, `avatar-${Date.now()}`);
      setEditAvatarUrl(uploadedUrl);

      if (!isEditOpen) {
        const updated = await dataService.updateProfile({
          avatarUrl: uploadedUrl,
        });
        setProfile(updated);
        await refreshProfile();
        showToast('Foto profil berhasil diperbarui!');
      } else {
        showToast('Foto profil siap disimpan.');
      }
    } catch (err: unknown) {
      console.error('Avatar upload failed:', err);
      const msg = 'Gagal memproses gambar foto profil.';
      if (isEditOpen) setEditError(msg); else showToast(msg);
    } finally {
      setIsSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan untuk sampul.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('Ukuran gambar sampul maksimal 8MB.');
      return;
    }

    try {
      setIsSaving(true);
      showToast('Sedang memproses & mengunggah sampul profil...');
      const cleaned = await stripExifAndCleanImage(file, 1600, 600, 0.85);
      const uploadedUrl = await uploadFileToSupabase('avatars', cleaned.blob, profile?.id, `banner-${Date.now()}`);
      
      const updated = await dataService.updateProfile({
        bannerUrl: uploadedUrl,
      });
      setProfile(updated);
      setEditBannerUrl(uploadedUrl);
      await refreshProfile();
      showToast('Foto sampul berhasil diperbarui!');
    } catch (err: unknown) {
      console.error('Banner upload failed:', err);
      showToast('Gagal memproses gambar sampul.');
    } finally {
      setIsSaving(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleModalBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan untuk sampul.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setEditError('Ukuran gambar sampul maksimal 8MB.');
      return;
    }

    try {
      setIsSaving(true);
      const cleaned = await stripExifAndCleanImage(file);
      const uploadedUrl = await uploadFileToSupabase('avatars', cleaned.blob, profile?.id, `banner-${Date.now()}`);
      setEditBannerUrl(uploadedUrl);
      showToast('Foto sampul siap disimpan.');
    } catch (err: unknown) {
      console.error('Modal banner upload failed:', err);
      setEditError('Gagal memproses gambar sampul.');
    } finally {
      setIsSaving(false);
      if (bannerModalInputRef.current) bannerModalInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const cleanUsername = editUsername.trim().toLowerCase().replace(/^@/, '');
    if (!/^[a-z0-9_.]{3,24}$/.test(cleanUsername)) {
      setEditError('Username hanya boleh 3-24 karakter huruf kecil, angka, garis bawah (_), atau titik (.).');
      return;
    }

    if (!editDisplayName.trim()) {
      setEditError('Nama tampilan tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const updated = await dataService.updateProfile({
        displayName: editDisplayName.trim(),
        username: cleanUsername,
        bio: editBio.trim(),
        district: editDistrict.trim(),
        avatarUrl: editAvatarUrl || undefined,
        bannerUrl: editBannerUrl,
        backgroundTheme: editBackgroundTheme,
        websiteUrl: editWebsiteUrl.trim(),
        customStatus: editCustomStatus.trim(),
      });

      setProfile(updated);
      await refreshProfile();
      setIsEditOpen(false);
      showToast('Profil Anda berhasil diperbarui.');

      if (cleanUsername !== profile.username) {
        navigate(`/u/${cleanUsername}`, { replace: true });
      }
    } catch (err: unknown) {
      console.error('Update profile error:', err);
      setEditError((err as Error).message || 'Gagal menyimpan pembaruan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareProfile = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${profile?.displayName} (@${profile?.username}) di TITIK.`,
      text: `Lihat kontribusi warga ${profile?.displayName} untuk keterbukaan publik Kota Bogor.`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share dialog
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Tautan profil disalin ke papan klip.');
    }
  };

  const totalSupportAndLikes = posts.reduce(
    (acc, p) => acc + (p.likesCount || 0) + (p.supportCount || 0),
    0
  );

  const currentTheme =
    THEME_OPTIONS.find((t) => t.id === profile?.backgroundTheme) || THEME_OPTIONS[0];

  return (
    <div className={`min-h-screen ${currentTheme.pageBg} text-[#20221D] dark:text-[#F3F6F4] flex flex-col lg:flex-row pb-24 lg:pb-0 transition-colors duration-300`}>
      <Sidebar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 lg:py-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#686B65] dark:text-[#9EACA3] hover:text-[#263F35] dark:hover:text-[#34D399] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          {profile && (
            <button
              type="button"
              onClick={handleShareProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#263F35] dark:bg-[#10B981] text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#263F35] dark:text-[#34D399] animate-spin mb-3" />
            <p className="text-xs font-medium text-[#686B65] dark:text-[#9EACA3]">
              Memuat profil warga...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">
              {error}
            </h3>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
              Profil yang Anda cari mungkin tidak ada atau telah berganti username.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && profile && (
          <div className="space-y-6">
                        {/* Profile Card Header with Dynamic Theme & Banner */}
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

            {/* Profile Navigation Tabs (Segmented Pill Bar) */}
            <div className="p-1 bg-[#EBE9DF]/70 dark:bg-[#131916] rounded-2xl border border-[#E4E2DA] dark:border-[#26352E] flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-white dark:bg-[#1E2E25] text-[#263F35] dark:text-[#34D399] shadow-xs border border-[#E4E2DA]/80 dark:border-[#2D4537]'
                    : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Postingan ({posts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-[#1E2E25] text-[#263F35] dark:text-[#34D399] shadow-xs border border-[#E4E2DA]/80 dark:border-[#2D4537]'
                    : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Laporan Warga ({reports.length})</span>
              </button>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-white dark:bg-[#1E2E25] text-[#263F35] dark:text-[#34D399] shadow-xs border border-[#E4E2DA]/80 dark:border-[#2D4537]'
                      : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Disimpan ({savedPosts.length})</span>
                </button>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-white dark:bg-[#1E2E25] text-[#263F35] dark:text-[#34D399] shadow-xs border border-[#E4E2DA]/80 dark:border-[#2D4537]'
                      : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan & Akun</span>
                </button>
              )}
            </div>

            {/* Tab 1: Postingan */}
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

            {/* Tab 2: Laporan Warga */}
            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <div className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-8 h-8 text-[#686B65] dark:text-[#9EACA3] mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Belum Ada Laporan Publik
                    </h4>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] max-w-xs mx-auto">
                      {isOwnProfile
                        ? 'Kirimkan laporan kerusakan infrastruktur atau fasilitas publik untuk diproses dinas terkait.'
                        : 'Pengguna ini belum mengirimkan laporan publik terverifikasi.'}
                    </p>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => openComposer('report')}
                        className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
                      >
                        + Laporkan Masalah Fasilitas
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => openReportDetail(report)}
                        className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-4 hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#263F35] dark:text-[#34D399] bg-[#E7EBDD] dark:bg-[#1A2E24] px-2 py-0.5 rounded-md">
                              {report.publicReference}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#1A221E] text-[#686B65] dark:text-[#9EACA3]">
                              {report.category}
                            </span>
                            <span className="text-[10px] font-semibold text-[#686B65] dark:text-[#9EACA3]">
                              {formatIndonesianTimeAgo(report.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4] group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors truncate">
                            {report.title}
                          </h4>
                          <p className="text-xs text-[#686B65] dark:text-[#9EACA3] flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
                            <span>{report.location?.address || 'Kota Bogor'}</span>
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                            {report.status}
                          </span>
                          <span className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                            {report.supportCount || 0} Dukungan Warga
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Disimpan (Owner Only) */}
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

            {/* Tab 4: Pengaturan & Akun (Owner Only) */}
            {isOwnProfile && activeTab === 'settings' && (
              <div className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Pengaturan & Preferensi Warga
                  </h3>
                  <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
                    Kelola identitas publik, wilayah domisili, dan keamanan sesi akun Anda.
                  </p>
                </div>

                {/* Account Summary Card */}
                <div className="p-4 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#686B65] dark:text-[#9EACA3]">Peran & Akses</span>
                    <span className="font-bold text-[#263F35] dark:text-[#34D399] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {profile.role === 'admin' ? 'Administrator Dinas PUPR' : 'Warga Terdaftar'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#686B65] dark:text-[#9EACA3]">Nama Lengkap</span>
                    <span className="font-bold text-[#20221D] dark:text-[#F3F6F4]">{profile.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#686B65] dark:text-[#9EACA3]">Handle Publik</span>
                    <span className="font-mono font-bold text-[#20221D] dark:text-[#F3F6F4]">@{profile.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#686B65] dark:text-[#9EACA3]">Wilayah Domisili</span>
                    <span className="font-bold text-[#20221D] dark:text-[#F3F6F4]">{profile.district || 'Kota Bogor'}</span>
                  </div>
                </div>

                {/* Quick Actions List (Modeled after Mobile Profile specs) */}
                <div className="divide-y divide-[#E4E2DA] dark:divide-[#26352E] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F6F1] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#263F35] dark:text-[#34D399] flex items-center justify-center">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">Edit Informasi Profil</div>
                        <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">Perbarui nama tampilan, bio, atau kecamatan domisili</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#686B65]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F6F1] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">Ganti Foto Profil</div>
                        <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">Unggah berkas foto baru (metadata EXIF dibersihkan otomatis)</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#686B65]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F6F1] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">Postingan Tersimpan</div>
                        <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">{savedPosts.length} postingan diarsipkan untuk ditinjau nanti</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#686B65]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#131916] hover:bg-[#F7F6F1] dark:hover:bg-[#1A221E] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#263F35] dark:text-[#34D399] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">Laporan Warga Saya</div>
                        <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">{reports.length} laporan diajukan ke dinas terkait</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#686B65]" />
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
                        <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">Akhiri sesi autentikasi perangkat ini</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="text-center pt-2 text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                  TITIK. Platform Partisipasi Sipil Kota Bogor • Versi 2.0 (Supabase RLS Protected)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Profile Modal Dialog */}
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
      </main>

      <BottomNav />
    </div>
  );
};
