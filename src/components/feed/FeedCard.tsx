import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Plus,
  Check,
  Megaphone,
  MessageSquare,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import { Post } from '../../types/domain';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/TitikContext';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { formatEngagementMetric } from '../../utils/formatters';

interface FeedCardProps {
  post: Post;
  isActive: boolean;
  isNearActive?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({ post, isActive, isNearActive = true }) => {
  const { isAuthenticated } = useAuth();
  const { toggleSupport, togglePostSave, togglePostLike, openReportDetail, updatePostCommentsCount } = useTitik();

  const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.href = '/login';
      }
    }
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSavedByMe ?? false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [commentsDelta, setCommentsDelta] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [prevPostId, setPrevPostId] = useState(post.id);
  const [prevIsActive, setPrevIsActive] = useState(isActive);

  if (post.id !== prevPostId) {
    setPrevPostId(post.id);
    setCommentsDelta(0);
    setActiveMediaIndex(0);
    setIsSaved(post.isSavedByMe ?? false);
    setIsFollowed(false);
    setShareCopied(false);
  }

  // Reset overlays when swiping away from active card
  if (prevIsActive !== isActive) {
    setPrevIsActive(isActive);
    if (!isActive) {
      setIsCommentsOpen(false);
      setIsCaptionExpanded(false);
    }
  }

  const MAX_CAPTION_CHARS = 80;
  const isCaptionLong = (post.body || '').length > MAX_CAPTION_CHARS;
  const truncatedCaption = isCaptionLong
    ? post.body.slice(0, MAX_CAPTION_CHARS).replace(/\s+\S*$/, '')
    : post.body;

  const media = post.media[activeMediaIndex] || post.media[0];
  const isVideo = media?.type === 'video';
  const aspectRatio = media?.aspectRatio || '9/16';
  const isNonVertical = !['9/16', '9:16'].includes(aspectRatio);

  // Compute container styling based on aspect ratio
  const getResponsiveClasses = (ratio: string) => {
    const normalized = ratio.replace(':', '/');
    const desktopRatio = (() => {
      switch (normalized) {
        case '1/1':
          return 'lg:aspect-square lg:max-h-[calc(100vh-5rem)] lg:w-full lg:max-w-[580px] xl:max-w-[640px]';
        case '3/4':
          return 'lg:aspect-[3/4] lg:max-h-[calc(100vh-4.5rem)] lg:w-full lg:max-w-[520px] xl:max-w-[580px]';
        case '4/5':
          return 'lg:aspect-[4/5] lg:max-h-[calc(100vh-4.5rem)] lg:w-full lg:max-w-[500px] xl:max-w-[540px]';
        case '4/3':
          return 'lg:aspect-[4/3] lg:max-h-[calc(100vh-5rem)] lg:w-full lg:max-w-[660px] xl:max-w-[740px]';
        case '16/9':
          return 'lg:aspect-video lg:max-h-[calc(100vh-5rem)] lg:w-full lg:max-w-[760px] xl:max-w-[840px]';
        case '9/16':
        default:
          return 'lg:aspect-[9/16] lg:max-h-[calc(100vh-4.5rem)] lg:min-h-[520px] lg:w-full lg:max-w-[480px] xl:max-w-[530px] 2xl:max-w-[560px]';
      }
    })();

    // Mobile: full-screen 100dvh slide; Desktop: custom aspect ratio centered in stream
    return `w-full h-[100dvh] lg:h-full ${desktopRatio}`;
  };

  // Autoplay / pause based on active state (IntersectionObserver)
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSaveToggle = () => {
    const next = !isSaved;
    setIsSaved(next);
    if (!togglePostSave) return;
    togglePostSave(post.id).catch(() => setIsSaved(!next));
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TITIK.', text: post.body || 'Lihat ini di TITIK.', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    videoRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.currentTarget.value);
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative w-full h-[100dvh] lg:h-full rounded-none lg:rounded-3xl overflow-hidden bg-black text-white flex flex-col justify-between select-none transition-all duration-300 mx-auto ${
        isActive
          ? 'opacity-100 scale-100 lg:shadow-2xl lg:ring-1 lg:ring-black/10'
          : 'opacity-35 scale-[0.98] transition-all duration-300 pointer-events-none hover:pointer-events-auto hover:opacity-60'
      } ${getResponsiveClasses(aspectRatio)}`}
    >
      {/* 1. Media Viewport & Ambient Background */}
      {!isNearActive ? (
        <div className="absolute inset-0 z-0 bg-neutral-900 flex flex-col items-center justify-center text-white/40 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
            <Play className="w-5 h-5 text-white/30" />
          </div>
          <span className="text-[11px] font-medium text-white/50 truncate max-w-[240px]">{post.body}</span>
        </div>
      ) : (
        <>
          {/* Ambient Blurred Background (for non-9:16 media on mobile) */}
          {isNonVertical && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none lg:hidden">
              <img
                src={media?.posterUrl || media?.url}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover blur-2xl opacity-45 scale-125 saturate-150"
              />
              <div className="absolute inset-0 bg-black/45"></div>
            </div>
          )}

          <div
            className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={togglePlay}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={media.url}
                poster={media.posterUrl}
                loop
                muted={isMuted}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onDurationChange={handleLoadedMetadata}
                className={`transition-all duration-300 ${
                  isNonVertical
                    ? 'object-contain max-h-[72%] max-w-[95%] lg:max-h-full lg:max-w-full lg:object-cover my-auto rounded-2xl lg:rounded-none shadow-2xl border border-white/10 lg:border-none'
                    : 'w-full h-full object-cover'
                }`}
              />
            ) : (
              <img
                src={media?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=1000&auto=format&fit=crop'}
                alt={post.body}
                className={`transition-all duration-300 ${
                  isNonVertical
                    ? 'object-contain max-h-[72%] max-w-[95%] lg:max-h-full lg:max-w-full lg:object-cover my-auto rounded-2xl lg:rounded-none shadow-2xl border border-white/10 lg:border-none'
                    : 'w-full h-full object-cover'
                }`}
              />
            )}
            {/* Soft Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/50 pointer-events-none"></div>
          </div>
        </>
      )}

      {/* 2. Top Header Overlay */}
      <div className="relative z-10 pt-[calc(max(0.75rem,env(safe-area-inset-top))+2.75rem)] lg:pt-4 px-3.5 sm:px-4 pb-2 flex items-center justify-between pointer-events-none">
        {/* Post Type Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium shadow-xs">
          {post.postType === 'citizen_report' ? (
            <>
              <Megaphone className="w-3 h-3 text-emerald-400" />
              <span>Warga melaporkan</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>Diskusi warga</span>
            </>
          )}
        </div>

        {/* Top Right Action Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Menu opsi lainnya"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/60 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* 3. Right Floating Social Action Bar (TikTok Style) */}
      <div className="absolute right-3.5 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-20 z-20 flex flex-col items-center gap-3.5 sm:gap-4">
        {/* Author Avatar with Follow Badge */}
        <div className="relative">
          <a
            href={`/u/${post.author.username}`}
            className="block cursor-pointer focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              if (window.history && typeof window.history.pushState === 'function') {
                e.preventDefault();
                window.history.pushState({}, '', `/u/${post.author.username}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            title={`Lihat profil @${post.author.username}`}
          >
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-md hover:scale-105 transition-transform"
            />
          </a>
          {post.isSampleData && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFollowed(!isFollowed);
              }}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 ${
                isFollowed
                  ? 'bg-[#263F35] dark:bg-[#10B981] dark:text-[#0A1610]'
                  : 'bg-[#263F35] dark:bg-[#10B981] dark:text-[#0A1610] hover:bg-[#1f332b] dark:hover:bg-[#34D399]'
              }`}
            >
              {isFollowed ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 stroke-[3]" />}
            </button>
          )}
        </div>

        {/* "Saya terdampak juga / Dukung Laporan / Sukai" Action */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                redirectToLogin();
                return;
              }
              if (post.relatedReportId) {
                toggleSupport(post.relatedReportId);
              } else if (togglePostLike) {
                togglePostLike(post.id);
              }
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
              (post.relatedReportId ? post.isSupportedByMe : post.isLikedByMe)
                ? 'bg-[#DC2626] text-white shadow-lg shadow-red-600/30'
                : 'bg-black/45 text-white hover:bg-black/65'
            }`}
            title={post.relatedReportId ? 'Dukung laporan ini / Saya terdampak juga' : 'Sukai postingan ini'}
          >
            <Heart className={`w-5 h-5 ${(post.relatedReportId ? post.isSupportedByMe : post.isLikedByMe) ? 'fill-current' : ''}`} />
          </button>
          {/* Civic support metric: formatEngagementMetric(post.supportCount) */}
          <span className="text-[11px] font-semibold mt-1 drop-shadow-md whitespace-nowrap tabular-nums select-none text-center">
            {formatEngagementMetric(post.relatedReportId ? post.supportCount : (post.likesCount || 0))}
          </span>
        </div>

        {/* Comments Count */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentsOpen(true);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/65 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Lihat komentar warga"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          {/* Synchronized action bar metric: formatEngagementMetric(post.commentsCount) */}
          <span className="text-[11px] font-semibold mt-1 drop-shadow-md whitespace-nowrap tabular-nums select-none text-center">
            {formatEngagementMetric(post.commentsCount + commentsDelta)}
          </span>
        </div>

        {/* Share Action */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            aria-label="Bagikan"
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              shareCopied ? 'bg-emerald-500 text-[#20221D]' : 'bg-black/45 text-white hover:bg-black/65'
            }`}
            title={shareCopied ? 'Tautan disalin!' : 'Bagikan'}
          >
            {shareCopied ? <Check className="w-5 h-5 stroke-[3]" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Bookmark / Save Action */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                redirectToLogin();
                return;
              }
              handleSaveToggle();
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
              isSaved ? 'bg-amber-400 text-[#20221D]' : 'bg-black/45 text-white hover:bg-black/65'
            }`}
            title="Simpan laporan"
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold mt-1 drop-shadow-md whitespace-nowrap tabular-nums select-none text-center">
            {formatEngagementMetric(post.savesCount)}
          </span>
        </div>
      </div>

      {/* 4. Bottom Information & Media Controls Overlay */}
      <div className="relative z-10 p-4 sm:p-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-5 pr-16 space-y-2">
        {/* Author Handle & Name */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/u/${post.author.username}`}
            onClick={(e) => {
              e.stopPropagation();
              if (window.history && typeof window.history.pushState === 'function') {
                e.preventDefault();
                window.history.pushState({}, '', `/u/${post.author.username}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="font-bold text-sm tracking-tight drop-shadow-md hover:underline hover:text-emerald-300 transition-colors cursor-pointer"
            title={`Lihat profil ${post.author.displayName}`}
          >
            {post.author.displayName}
          </a>
          <a
            href={`/u/${post.author.username}`}
            onClick={(e) => {
              e.stopPropagation();
              if (window.history && typeof window.history.pushState === 'function') {
                e.preventDefault();
                window.history.pushState({}, '', `/u/${post.author.username}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="text-xs text-white/80 font-mono hover:underline hover:text-emerald-300 transition-colors cursor-pointer"
          >
            @{post.author.username}
          </a>
          <span className="text-xs text-white/70 font-mono">• {post.createdAt}</span>
        </div>

        {/* Body Caption with Max Characters & Toggle on Press/Click */}
        {post.media.length > 1 && (
          <div className="flex items-center gap-2">
            {post.media.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveMediaIndex(index);
                  setIsPlaying(false);
                }}
                aria-pressed={activeMediaIndex === index}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  activeMediaIndex === index
                    ? 'border-white bg-white/25 text-white'
                    : 'border-white/30 bg-black/30 text-white/75 hover:bg-black/50'
                }`}
              >
                {item.type === 'video' ? <VideoIcon className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                {item.type === 'video' ? 'Video' : 'Foto'}
              </button>
            ))}
          </div>
        )}

        {isCaptionLong ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsCaptionExpanded(!isCaptionExpanded);
            }}
            data-scroll-isolated={isCaptionExpanded ? 'true' : undefined}
            className={`text-xs text-white/95 leading-relaxed drop-shadow-md cursor-pointer select-text transition-all duration-200 ${
              isCaptionExpanded ? 'max-h-48 overflow-y-auto pr-1 no-scrollbar overscroll-y-contain touch-pan-y' : ''
            }`}
            title={isCaptionExpanded ? 'Klik untuk menciutkan' : 'Klik untuk melihat selengkapnya'}
          >
            {isCaptionExpanded ? (
              <>
                <span>{post.body}</span>{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCaptionExpanded(false);
                  }}
                  className="inline font-bold text-white/70 hover:text-white underline underline-offset-2 ml-1 cursor-pointer transition-colors active:opacity-70"
                >
                  lebih sedikit
                </button>
              </>
            ) : (
              <>
                <span>{truncatedCaption}...</span>{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCaptionExpanded(true);
                  }}
                  className="inline font-bold text-white/90 hover:text-white underline underline-offset-2 ml-1 cursor-pointer transition-colors active:opacity-70"
                >
                  selengkapnya
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/95 leading-relaxed drop-shadow-md">
            {post.body}
          </p>
        )}

        {/* Location Tag & Report Button */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white border border-white/20">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>{post.locationTag}</span>
          </div>

          {post.relatedReport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (post.relatedReport) {
                  openReportDetail(post.relatedReport);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#263F35]/90 dark:bg-[#10B981]/90 dark:text-[#0A1610] dark:font-semibold backdrop-blur-md text-[11px] font-medium text-white border border-[#E7EBDD]/30 dark:border-[#10B981]/50 hover:bg-[#263F35] dark:hover:bg-[#34D399] transition-colors cursor-pointer"
            >
              <span>Lihat Laporan & APBD ({post.relatedReport.publicReference})</span>
            </button>
          )}
        </div>

        {/* Video Playback Bar if video */}
        {isVideo && (
          <div className="pt-2 space-y-1.5 text-xs text-white/90">
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(duration))}
              step={1}
              value={Math.min(Math.floor(currentTime), Math.max(1, Math.floor(duration)))}
              onChange={handleSeek}
              onClick={(event) => event.stopPropagation()}
              disabled={!Number.isFinite(duration) || duration <= 0}
              aria-label="Geser untuk memilih durasi video"
              aria-valuetext={`${formatTime(currentTime)} dari ${formatTime(duration)}`}
              className="h-1.5 w-full cursor-pointer touch-pan-x appearance-none rounded-full bg-white/35 accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <span className="font-mono text-[11px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  aria-label="Layar penuh"
                  className="hover:text-white transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Mobile Pop-up & Desktop Comments Bottom Sheet */}
      <CommentsBottomSheet
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        postId={post.id}
        commentsCount={post.commentsCount + commentsDelta}
        onCommentAdded={() => setCommentsDelta((prev) => prev + 1)}
        onCommentsCountChange={(count) => {
          setCommentsDelta(0);
          updatePostCommentsCount?.(post.id, count);
        }}
      />
    </div>
  );
};
