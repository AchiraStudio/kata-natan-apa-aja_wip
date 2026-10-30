import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/TitikContext';
import { dataService } from '../../services/dataService';
import { UserProfile, Post, Report } from '../../types/domain';
import { stripExifAndCleanImage, uploadFileToSupabase } from '../../components/composer/useMediaUpload';
import { THEME_OPTIONS } from './profileThemes';

export function useProfileController() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { profile: currentAuthProfile, isAuthenticated, refreshProfile, signOut, invalidateSession } = useAuth();
  const { openComposer, openReportDetail } = useTitik();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
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
      const rawParam = username ? decodeURIComponent(username).trim() : currentAuthProfile.username;
      const targetUsername = rawParam ? rawParam.replace(/^@+/, '') : '';

      const isOwnProfileLookup = Boolean(
        !username ||
        (currentAuthProfile.username &&
          targetUsername.toLowerCase() === currentAuthProfile.username.toLowerCase())
      );

      if (!targetUsername || (isOwnProfileLookup && targetUsername.toLowerCase() === 'warga.anonim')) {
        await invalidateSession?.({ redirect: true });
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }

      const fetchedProfile = await dataService.getProfileByUsername(targetUsername);
      if (!fetchedProfile) {
        if (isOwnProfileLookup && isAuthenticated) {
          await invalidateSession?.({ redirect: true });
          navigate('/login', { replace: true });
          setIsLoading(false);
          return;
        }
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
        const [saved, savedReportsList] = await Promise.all([
          dataService.getSavedPosts(currentAuthProfile.id).catch((err) => {
            console.warn('Could not load saved posts:', err);
            return [];
          }),
          dataService.getSavedReports(currentAuthProfile.id),
        ]);
        setSavedPosts(saved);
        setSavedReports(savedReportsList);
      } else {
        setSavedPosts([]);
        setSavedReports([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load profile data:', err);
      setError('Gagal memuat profil. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  }, [username, currentAuthProfile, isAuthenticated, invalidateSession, navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setEditDistrict(profile.district || '');
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


  return {
    username,
    navigate,
    currentAuthProfile,
    isAuthenticated,
    refreshProfile,
    signOut,
    openComposer,
    openReportDetail,
    profile,
    setProfile,
    posts,
    setPosts,
    reports,
    setReports,
    savedPosts,
    setSavedPosts,
    savedReports,
    setSavedReports,
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    error,
    setError,
    avatarInputRef,
    bannerInputRef,
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
    setIsSaving,
    editError,
    setEditError,
    toastMessage,
    setToastMessage,
    isOwnProfile,
    handleLogout,
    showToast,
    loadProfileData,
    handleOpenEdit,
    handleAvatarFileChange,
    handleBannerFileChange,
    handleModalBannerFileChange,
    handleSaveProfile,
    handleShareProfile,
    totalSupportAndLikes,
    currentTheme,
  };
}

export type ProfileController = ReturnType<typeof useProfileController>;
