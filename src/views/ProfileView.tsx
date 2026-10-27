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
  Settings,
  ChevronRight,
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

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
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
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Ukuran gambar maksimal 5MB.');
      return;
    }

    try {
      setIsSaving(true);
      const cleaned = await stripExifAndCleanImage(file);
      const uploadedUrl = await uploadFileToSupabase('avatars', cleaned.blob, profile?.id, `avatar-${Date.now()}`);
      setEditAvatarUrl(uploadedUrl);
      showToast('Foto profil berhasil diunggah.');
    } catch (err: unknown) {
      console.error('Avatar upload failed:', err);
      setEditError('Gagal memproses gambar foto profil.');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0A100D] text-[#20221D] dark:text-[#F3F6F4] flex flex-col lg:flex-row pb-24 lg:pb-0">
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
            {/* Profile Card Header */}
            <div className="relative bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl shadow-sm overflow-hidden">
              {/* Cover Banner */}
              <div className="h-32 sm:h-40 bg-gradient-to-r from-[#1E3A2F] via-[#2A4C3E] to-[#1E3A2F] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F6F1_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              {/* Identity Row */}
              <div className="px-5 sm:px-8 pb-6 pt-0 relative">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
                  {/* Avatar */}
                  <div className="relative group self-start">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-[#131916] shadow-md bg-stone-100"
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
                        className="absolute bottom-1 right-1 p-2 rounded-full bg-[#263F35] hover:bg-[#1d3129] text-white shadow-md transition-transform active:scale-90 cursor-pointer"
                        title="Ubah Foto Profil Langsung"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions (Owner vs Visitor) */}
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <>
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
                          onClick={handleLogout}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Keluar dari Akun"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Keluar</span>
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
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bergabung {formatIndonesianTimeAgo(profile.createdAt || '2026-01-01T00:00:00Z')}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Summary Bar */}
                <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-[#E4E2DA] dark:border-[#26352E]">
                  <div className="text-center p-3 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E]">
                    <div className="text-base sm:text-lg font-black text-[#20221D] dark:text-[#F3F6F4]">
                      {posts.length}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Postingan
                    </div>
                  </div>

                  <div className="text-center p-3 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E]">
                    <div className="text-base sm:text-lg font-black text-[#20221D] dark:text-[#F3F6F4]">
                      {reports.length}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Laporan
                    </div>
                  </div>

                  <div className="text-center p-3 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E]">
                    <div className="text-base sm:text-lg font-black text-[#20221D] dark:text-[#F3F6F4]">
                      {totalSupportAndLikes}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3] uppercase tracking-wider">
                      Dukungan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E4E2DA] dark:border-[#26352E] pb-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
                    : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Postingan ({posts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
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
