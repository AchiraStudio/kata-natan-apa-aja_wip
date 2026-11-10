import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Globe, BadgeCheck, MessageSquare, Share2, Pencil, ShieldAlert, Camera, UserCheck, UserPlus } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { getProfileTheme } from './profileThemes';
import type { ProfileController } from './useProfileController';

interface ProfileHeaderProps {
  ctrl: ProfileController;
}

const formatJoined = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const stripProtocol = (url: string) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ ctrl }) => {
  const {
    profile,
    reports,
    isOwnProfile,
    bannerInputRef,
    handleBannerFileChange,
    handleOpenEdit,
    handleShareProfile,
    handleStartChat,
    isStartingChat,
    totalSupportAndLikes,
    followStats,
    followStatsError,
    isTogglingFollow,
    handleToggleFollow,
  } = ctrl;
  if (!profile) return null;

  const joined = formatJoined(profile.createdAt);
  const theme = getProfileTheme(profile.backgroundTheme);
  const isAdmin = profile.role === 'admin';
  const isFollowing = followStats?.isFollowing ?? false;
  const followerCount = followStats?.followerCount ?? 0;
  const followingCount = followStats?.followingCount ?? 0;
  const actionBtn =
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60';

  return (
    <section aria-label="Profil" className="panel overflow-hidden">
      {/* Cover: the chosen photo, or the gradient of the profile theme the user picked */}
      <div
        className="relative h-32 sm:h-44"
        style={{ backgroundImage: `linear-gradient(135deg, ${theme.bannerFrom}, ${theme.bannerTo})` }}
      >
        {profile.bannerUrl && (
          <img src={profile.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )}
        {isOwnProfile && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBannerFileChange}
              aria-label="Unggah foto sampul"
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black/55 hover:bg-black/70 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Ganti sampul
            </button>
          </>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="relative z-10 flex items-end gap-4 -mt-10 sm:-mt-12">
          <UserAvatar
            src={profile.avatarUrl}
            alt={`Foto profil ${profile.displayName}`}
            name={profile.displayName}
            role={profile.role}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shrink-0 ring-4 ring-surface"
          />
        </div>

        <div className="mt-3 min-w-0">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-ink leading-tight">
            <span className="truncate">{profile.displayName}</span>
            {profile.isVerified && <BadgeCheck className="w-5 h-5 text-brand shrink-0" aria-label="Terverifikasi" />}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-3">
            <span>@{profile.username}</span>
            {isAdmin && (
              <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                admin
              </span>
            )}
          </p>
        </div>

        {profile.customStatus && <p className="mt-4 text-sm text-ink">{profile.customStatus}</p>}
        {profile.bio && <p className="mt-2 text-sm text-ink-2 whitespace-pre-wrap break-words max-w-prose">{profile.bio}</p>}

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-2">
          {profile.district && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {profile.district}
            </li>
          )}
          {joined && (
            <li className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Bergabung {joined}
            </li>
          )}
          {profile.websiteUrl && (
            <li className="inline-flex items-center gap-1.5 min-w-0">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <a
                href={/^https?:\/\//i.test(profile.websiteUrl) ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate underline underline-offset-2 hover:text-ink"
              >
                {stripProtocol(profile.websiteUrl)}
              </a>
            </li>
          )}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          {isOwnProfile ? (
            <button type="button" onClick={handleOpenEdit} className={`${actionBtn} bg-brand text-on-brand hover:bg-brand-hover`}>
              <Pencil className="w-4 h-4" /> Ubah Profil
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
                aria-pressed={isFollowing}
                className={`${actionBtn} ${
                  isFollowing
                    ? 'bg-surface-2 text-ink hover:bg-line'
                    : 'bg-brand text-on-brand hover:bg-brand-hover'
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isTogglingFollow ? 'Memproses' : isFollowing ? 'Mengikuti' : 'Ikuti'}</span>
              </button>
              <button
                type="button"
                onClick={handleStartChat}
                disabled={isStartingChat}
                aria-label="Kirim Pesan"
                title={`Kirim pesan langsung ke ${profile.displayName}`}
                className={`${actionBtn} bg-surface-2 text-ink hover:bg-line`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isStartingChat ? 'Menghubungkan' : 'Kirim Pesan'}</span>
              </button>
            </>
          )}
          <button type="button" onClick={handleShareProfile} className={`${actionBtn} bg-surface-2 text-ink hover:bg-line`}>
            <Share2 className="w-4 h-4" /> Bagikan Profil
          </button>
          {isOwnProfile && isAdmin && (
            <Link to="/admin" title="Buka Portal Tinjauan admin" className={`${actionBtn} bg-surface-2 text-ink hover:bg-line`}>
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Portal admin
            </Link>
          )}
        </div>

        <dl className="mt-6 pt-5 border-t border-line-soft grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          <div className="text-left">
            <dd className="font-display text-xl font-bold text-ink tabular-nums">{reports.length}</dd>
            <dt className="text-xs text-ink-3">Laporan</dt>
          </div>
          <div>
            <dd className="font-display text-xl font-bold text-ink tabular-nums">{totalSupportAndLikes}</dd>
            <dt className="text-xs text-ink-3">Dukungan diterima</dt>
          </div>
          <div>
            <dd className="font-display text-xl font-bold text-ink tabular-nums">{followerCount}</dd>
            <dt className="text-xs text-ink-3">Pengikut</dt>
          </div>
          <div>
            <dd className="font-display text-xl font-bold text-ink tabular-nums">{followingCount}</dd>
            <dt className="text-xs text-ink-3">Mengikuti</dt>
          </div>
        </dl>
        {followStatsError && <p role="status" className="mt-3 text-xs text-st-ditolak">{followStatsError}</p>}
      </div>
    </section>
  );
};
