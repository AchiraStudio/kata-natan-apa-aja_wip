import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  MapPin,
  Check,
  ChevronRight,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { Post } from '../../types/domain';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/TitikContext';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { formatEngagementMetric } from '../../utils/formatters';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { UserAvatar } from '../common/UserAvatar';

interface FeedCardProps {
  post: Post;
  isActive: boolean;
  isNearActive?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const CAPTION_COLLAPSE_CHARS = 90;

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * One full-height post. Structure, top to bottom of importance:
 * media, caption + author, one action rail, one optional report link, thin progress line.
 * Everything that floats over the media uses the fixed-tint `glass-media` surface.
 */
export const FeedCard: React.FC<FeedCardProps> = ({ post, isActive, isNearActive = true, isMuted, onToggleMute }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleSupport, toggleReportSave, openReportDetail, updatePostCommentsCount } = useTitik();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaved, setIsSaved] = useState(post.relatedReport?.isSavedByMe ?? false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [prevPostId, setPrevPostId] = useState(post.id);
  const [prevIsActive, setPrevIsActive] = useState(isActive);

  const authorHandle = (post.author?.username || '').replace(/^@+/, '');
  const profileHref = `/u/${authorHandle}`;

  // Derived-state resets (render-phase, React 19 pattern)
  if (post.id !== prevPostId) {
    setPrevPostId(post.id);
    setActiveMediaIndex(0);
    setIsSaved(post.relatedReport?.isSavedByMe ?? false);
    setShareCopied(false);
    setHasMediaError(false);
  }
  if (prevIsActive !== isActive) {
    setPrevIsActive(isActive);
    if (!isActive) {
      setIsCommentsOpen(false);
      setIsCaptionExpanded(false);
    }
  }

  const media = post.media[activeMediaIndex] || post.media[0];
  const isVideo = media?.type === 'video';
  const hasLongCaption = (post.body || '').length > CAPTION_COLLAPSE_CHARS;

  const isSupportPost = Boolean(post.relatedReportId);
  const isEngaged = isSupportPost ? Boolean(post.isSupportedByMe) : Boolean(post.isLikedByMe);
  const engagementCount = isSupportPost ? post.supportCount : post.likesCount || 0;

  const mediaSrc = media?.url;
  // Autoplay when active, pause otherwise; the effect depends on the source so switching media restarts correctly
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (isActive && !hasMediaError) {
      video.play().catch(() => {
        // Browsers can block autoplay; the tap target stays available.
      });
    } else {
      video.pause();
    }
  }, [isActive, isVideo, mediaSrc, hasMediaError]);

  // Sound state is owned by the feed so it carries from video to video
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, mediaSrc]);

  // Never keep playing in a hidden tab
  useEffect(() => {
    if (!isActive || !isVideo) return;
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isActive, isVideo]);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    []
  );

  const showFlash = useCallback((kind: 'play' | 'pause') => {
    setFlash(kind);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 650);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      showFlash('play');
    } else {
      video.pause();
      showFlash('pause');
    }
  };

  const retryVideo = () => {
    setHasMediaError(false);
    setIsBuffering(true);
    videoRef.current?.load();
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    action();
  };

  const handleEngage = () =>
    requireAuth(() => {
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 600);
      if (post.relatedReportId) toggleSupport(post.relatedReportId);
    });

  const handleSave = () =>
    requireAuth(() => {
      if (!post.relatedReportId) return;
      const next = !isSaved;
      setIsSaved(next);
      toggleReportSave?.(post.relatedReportId).then((result) => setIsSaved(result.isSaved)).catch(() => setIsSaved(!next));
    });

  const handleShare = async () => {
    const shareUrl = post.relatedReport
      ? `${window.location.origin}/laporan/${encodeURIComponent(post.relatedReport.publicReference)}`
      : window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TITIK.', text: post.body || 'Lihat ini di TITIK.', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // The share sheet was dismissed or the clipboard is unavailable.
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
    const next = Number(event.currentTarget.value);
    setCurrentTime(next);
    if (videoRef.current) videoRef.current.currentTime = next;
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const railBtn = (active: boolean) =>
    `w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
      active ? 'bg-brand text-on-brand border border-transparent' : 'glass-media hover:bg-black/60'
    }`;
  const railCount = 'mt-1 text-[11px] font-semibold tabular-nums leading-none [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]';

  // Keep the full original image/video visible inside the full-screen feed frame.
  const mediaFit = 'object-contain';
  const backdropUrl = media?.posterUrl || (!isVideo ? media?.url : undefined);

  return (
    <article
      aria-label={`Laporan oleh ${post.author.displayName}`}
      className="relative w-full h-[100dvh] lg:h-full lg:w-auto lg:aspect-[9/16] lg:max-w-[min(100%,460px)] overflow-hidden bg-black text-white select-none lg:rounded-2xl lg:ring-1 lg:ring-white/10 lg:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
    >
      {/* Media */}
      {!isNearActive ? (
        <div className="absolute inset-0 bg-neutral-950" aria-hidden="true">
          {(media?.posterUrl || (!isVideo && media?.url)) && (
            <img src={media.posterUrl || media.url} alt="" className="w-full h-full object-cover opacity-40" loading="lazy" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-neutral-950 cursor-pointer" onClick={isVideo ? togglePlay : undefined}>
          {backdropUrl && (
            <img src={backdropUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-125" />
          )}

          {isVideo ? (
            <video
              ref={videoRef}
              src={media.url}
              poster={media.posterUrl}
              loop
              muted={isMuted}
              playsInline
              preload={isActive ? 'auto' : 'metadata'}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onCanPlay={() => setIsBuffering(false)}
              onError={() => {
                setIsBuffering(false);
                setHasMediaError(true);
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
              onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
              className={`relative w-full h-full ${mediaFit}`}
            />
          ) : (
            <img
              src={media?.url}
              alt={post.body.slice(0, 140)}
              className={`relative w-full h-full ${mediaFit}`}
              onError={() => setHasMediaError(true)}
            />
          )}

          {/* Legibility scrims: one at the top for the header, one at the bottom for the caption */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent pointer-events-none lg:hidden" />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Transient state: play/pause echo, buffering, error */}
      {flash && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="glass-media w-16 h-16 rounded-2xl flex items-center justify-center titik-rise">
            {flash === 'play' ? <Play className="w-7 h-7 fill-current" /> : <Pause className="w-7 h-7 fill-current" />}
          </span>
        </div>
      )}
      {isVideo && isBuffering && !hasMediaError && isActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" role="status" aria-label="Memuat video">
          <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
        </div>
      )}
      {hasMediaError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-neutral-950/85 px-8 text-center">
          <p className="text-sm text-white/85">{isVideo ? 'Video tidak dapat dimuat.' : 'Gambar tidak dapat dimuat.'}</p>
          {isVideo && (
            <button
              type="button"
              onClick={retryVideo}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Coba lagi
            </button>
          )}
        </div>
      )}

      {/* Video utilities, top right below the phone header */}
      {isVideo && (
        <div className="absolute z-20 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+6.5rem)] lg:top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={!isMuted}
            aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
            title={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
            className="glass-media w-10 h-10 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Layar penuh"
            title="Layar penuh"
            className="hidden lg:flex glass-media w-9 h-9 rounded-xl items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action rail */}
      <div className="absolute z-20 right-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-7 flex flex-col items-center gap-4">
        <div className="relative flex flex-col items-center">
          {burstActive && (
            <div className="absolute top-[22px] left-[22px] pointer-events-none z-20">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                return (
                  <span
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-brand animate-burst-particle"
                    style={{ '--tx': `${Math.round(Math.cos(angle) * 30)}px`, '--ty': `${Math.round(Math.sin(angle) * 30)}px` } as React.CSSProperties}
                  />
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={handleEngage}
            aria-pressed={isEngaged}
            aria-label="Dukung laporan ini, saya terdampak juga"
            title="Dukung laporan ini (saya terdampak juga)"
            className={railBtn(isEngaged)}
          >
            <Heart className={`w-5 h-5 ${isEngaged ? 'fill-current' : ''}`} />
          </button>
          <span className={railCount}>{formatEngagementMetric(engagementCount)}</span>
        </div>

        <div className="flex flex-col items-center">
          <button type="button" onClick={() => setIsCommentsOpen(true)} aria-label="Buka komentar warga" title="Komentar warga" className={railBtn(false)}>
            <MessageCircle className="w-5 h-5" />
          </button>
          <span className={railCount}>{formatEngagementMetric(post.commentsCount)}</span>
        </div>

        <div className="flex flex-col items-center">
          <button type="button" onClick={handleSave} aria-pressed={isSaved} aria-label="Simpan laporan" title="Simpan laporan" className={railBtn(isSaved)}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <span className={railCount}>{formatEngagementMetric(post.savesCount)}</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Bagikan"
          title={shareCopied ? 'Tautan disalin' : 'Bagikan'}
          className={railBtn(shareCopied)}
        >
          {shareCopied ? <Check className="w-5 h-5" strokeWidth={3} /> : <Share2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Caption block */}
      <div className="absolute z-10 left-0 right-0 bottom-0 pl-4 pr-[4.5rem] pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] lg:pb-6 space-y-2.5">
        {post.media.length > 1 && (
          <div className="flex items-center" role="group" aria-label="Media dalam laporan ini">
            {post.media.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMediaIndex(index)}
                aria-pressed={activeMediaIndex === index}
                aria-label={`Media ${index + 1} dari ${post.media.length}: ${item.type === 'video' ? 'video' : 'foto'}`}
                className="h-6 px-1 flex items-center cursor-pointer"
              >
                <span className={`block h-1 rounded-full transition-all ${activeMediaIndex === index ? 'w-6 bg-white' : 'w-3 bg-white/40'}`} />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <Link to={profileHref} aria-label={`Profil ${post.author.displayName}`} className="shrink-0">
            <UserAvatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              name={post.author.displayName}
              role={post.author.role}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/40"
            />
          </Link>
          <div className="min-w-0 leading-tight">
            <Link to={profileHref} title={`@${authorHandle}`} className="block truncate text-sm font-semibold hover:underline [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              {post.author.displayName}
            </Link>
            <span className="block text-[11px] text-white/75">{formatIndonesianTimeAgo(post.createdAt)}</span>
          </div>
        </div>

        <div
          data-scroll-isolated={isCaptionExpanded ? 'true' : undefined}
          className={`text-[13px] leading-relaxed text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] select-text ${
            isCaptionExpanded ? 'max-h-40 overflow-y-auto no-scrollbar overscroll-y-contain touch-pan-y' : hasLongCaption ? 'line-clamp-2' : ''
          }`}
        >
          {post.body}
        </div>
        {hasLongCaption && (
          <button
            type="button"
            onClick={() => setIsCaptionExpanded((v) => !v)}
            aria-expanded={isCaptionExpanded}
            className="-mt-1 text-xs font-semibold text-white/80 hover:text-white underline underline-offset-2 cursor-pointer"
          >
            {isCaptionExpanded ? 'Lebih sedikit' : 'Selengkapnya'}
          </button>
        )}

        <p className="flex items-center gap-1.5 text-xs text-white/80 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{post.locationTag}</span>
          <span aria-hidden="true" className="text-white/40">/</span>
          <span className="shrink-0">Laporan warga</span>
        </p>

        {post.relatedReport && (
          <button
            type="button"
            onClick={() => {
              if (post.relatedReport) {
                openReportDetail(post.relatedReport);
                navigate(`/laporan/${encodeURIComponent(post.relatedReport.publicReference || post.relatedReport.id)}`);
              }
            }}
            className="glass-media w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left hover:bg-black/60 transition-colors cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Buka laporan dan APBD</span>
              <span className="block titik-id text-[11px] text-white/70 truncate">{post.relatedReport.publicReference}</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

      {/* Progress: a thin line that grows on hover and doubles as the seek control */}
      {isVideo && isNearActive && (
        <div className="absolute z-30 left-4 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:left-0 lg:right-0 lg:bottom-0 h-5 group flex items-end">
          <div className="relative w-full h-[3px] group-hover:h-[6px] group-focus-within:h-[6px] bg-white/25 transition-[height] lg:rounded-none rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={Math.min(currentTime, duration || 1)}
            onChange={handleSeek}
            disabled={!Number.isFinite(duration) || duration <= 0}
            aria-label="Geser untuk memilih posisi video"
            aria-valuetext={`${formatTime(currentTime)} dari ${formatTime(duration)}`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-pan-x disabled:cursor-not-allowed"
          />
          <span className="pointer-events-none absolute right-2 bottom-3 text-[11px] tabular-nums text-white/85 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="sr-only">{isPlaying ? 'Sedang diputar' : 'Dijeda'}</span>
        </div>
      )}

      <CommentsBottomSheet
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        postId={post.id}
        commentsCount={post.commentsCount}
        onCommentsCountChange={(count) => {
                updatePostCommentsCount?.(post.id, count);
        }}
      />
    </article>
  );
};
