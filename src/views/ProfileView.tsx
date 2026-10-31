import { ArrowLeft, CheckCircle2, Share2, AlertCircle, Loader2 } from 'lucide-react';
import { useProfileController } from '../components/profile/useProfileController';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { PostsTab } from '../components/profile/PostsTab';
import { ReportsTab } from '../components/profile/ReportsTab';
import { SavedTab } from '../components/profile/SavedTab';
import { SettingsTab } from '../components/profile/SettingsTab';
import { EditProfileModal } from '../components/profile/EditProfileModal';

export const ProfileView: React.FC = () => {
  const ctrl = useProfileController();
  const { username, navigate, profile, isLoading, error, toastMessage, handleShareProfile, currentTheme } = ctrl;

  return (
    <div className={`min-h-screen flex-1 min-w-0 ${currentTheme.pageBg} text-[#101913] dark:text-[#F3F6F4] pb-24 lg:pb-0 transition-colors duration-300`}>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 lg:py-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          {profile && (
            <button
              type="button"
              onClick={handleShareProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#1B4332] dark:text-[#34D399] animate-spin mb-3" />
            <p className="text-xs font-medium text-[#4F5A52] dark:text-[#9EACA3]">
              Memuat profil warga...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && !profile && (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
              {error}
            </h3>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
              Profil yang Anda cari mungkin tidak ada atau sesi akun tidak valid. Silakan masuk kembali.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#14352A] transition-colors cursor-pointer"
              >
                Masuk ke Akun
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && profile && (
          <div className="space-y-6">
                        {/* Profile Card Header with Dynamic Theme & Banner */}
            <ProfileHeader ctrl={ctrl} />
            <ProfileTabs ctrl={ctrl} />
            <PostsTab ctrl={ctrl} />
            <ReportsTab ctrl={ctrl} />
            <SavedTab ctrl={ctrl} />
            <SettingsTab ctrl={ctrl} />
          </div>
        )}

        <EditProfileModal ctrl={ctrl} />
      </main>

    </div>
  );
};
