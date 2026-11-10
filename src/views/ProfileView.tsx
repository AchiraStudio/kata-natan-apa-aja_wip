import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useProfileController } from '../components/profile/useProfileController';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { PostsTab } from '../components/profile/PostsTab';
import { ReportsTab } from '../components/profile/ReportsTab';
import { SavedTab } from '../components/profile/SavedTab';
import { SettingsTab } from '../components/profile/SettingsTab';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { PageShell } from '../components/layout/PageShell';

export const ProfileView: React.FC = () => {
  const ctrl = useProfileController();
  const { navigate, profile, isLoading, error, toastMessage } = ctrl;

  return (
    <PageShell width="narrow">
      {toastMessage && (
        <div
          role="status"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-ink text-canvas text-sm font-medium flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isLoading && (
        <div role="status" className="py-24 text-center text-sm text-ink-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand titik-live mb-3" />
          <p>Memuat profil</p>
        </div>
      )}

      {!isLoading && error && !profile && (
        <div role="alert" className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-8 h-8 mx-auto text-st-ditolak" />
          <h1 className="text-lg font-bold text-ink">{error}</h1>
          <p className="text-sm text-ink-2">Profil yang Anda cari mungkin tidak ada, atau sesi akun sudah berakhir.</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button type="button" onClick={() => navigate('/login')} className="titik-pill-btn titik-pill-btn-primary">
              Masuk ke akun
            </button>
            <button type="button" onClick={() => navigate('/')} className="titik-pill-btn titik-pill-btn-secondary">
              Ke beranda
            </button>
          </div>
        </div>
      )}

      {!isLoading && profile && (
        <div className="space-y-5">
          <ProfileHeader ctrl={ctrl} />
          <ProfileTabs ctrl={ctrl} />
          <div role="tabpanel">
            <PostsTab ctrl={ctrl} />
            <ReportsTab ctrl={ctrl} />
            <SavedTab ctrl={ctrl} />
            <SettingsTab ctrl={ctrl} />
          </div>
        </div>
      )}

      <EditProfileModal ctrl={ctrl} />
    </PageShell>
  );
};
