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
} from 'lucide-react';
import { Post } from '../../types/domain';
import { useTitik } from '../../context/TitikContext';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { formatEngagementMetric } from '../../utils/formatters';

interface FeedCardProps {
  post: Post;
  isActive: boolean;
  isNearActive?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({ post, isActive, isNearActive = true }) => {
  const { toggleSupport, openReportDetail } = useTitik();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(12);
  const [duration, setDuration] = useState(45);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSavedByMe ?? false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [commentsDelta, setCommentsDelta] = useState(0);
  const [prevPostId, setPrevPostId] = useState(post.id);

  if (post.id !== prevPostId) {
    setPrevPostId(post.id);
    setCommentsDelta(0);
  }

  const MAX_CAPTION_CHARS = 80;
  const isCaptionLong = (post.body || '').length > MAX_CAPTION_CHARS;
  const truncatedCaption = isCaptionLong
    ? post.body.slice(0, MAX_CAPTION_CHARS).replace(/\s+\S*$/, '')
    : post.body;

  // Reset overlays when swiping away from active card
  useEffect(() => {
    if (!isActive) {
      setIsCommentsOpen(false);
      setIsCaptionExpanded(false);
    }
  }, [isActive]);

  const media = post.media[0];
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
      setCurrentTime(Math.floor(videoRef.current.currentTime));
      if (videoRef.current.duration) {
        setDuration(Math.floor(videoRef.current.duration));
      }
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
      <div className="relative z-10 pt-16 lg:pt-4 px-4 pb-2 flex items-center justify-between">
        {/* Post Type Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#20221D] text-xs font-semibold shadow-xs">
          {post.postType === 'citizen_report' ? (
            <>
              <Megaphone className="w-3.5 h-3.5 text-[#263F35]" />
              <span>Warga melaporkan</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3.5 h-3.5 text-[#263F35]" />
              <span>Diskusi warga</span>
            </>
          )}
        </div>

        {/* Top Right Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Right Floating Social Action Bar (TikTok Style) */}
      <div className="absolute right-3.5 bottom-24 lg:bottom-20 z-20 flex flex-col items-center gap-3.5 sm:gap-4">
        {/* Author Avatar with Follow Badge */}
        <div className="relative">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-md"
          />
          <button
            type="button"
            onClick={() => setIsFollowed(!isFollowed)}
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 ${
              isFollowed ? 'bg-[#263F35]' : 'bg-[#263F35] hover:bg-[#1f332b]'
            }`}
          >
            {isFollowed ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 stroke-[3]" />}
          </button>
        </div>

        {/* "Saya terdampak juga / Dukung Laporan" Action */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => post.relatedReportId && toggleSupport(post.relatedReportId)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              post.isSupportedByMe
                ? 'bg-[#DC2626] text-white shadow-lg shadow-red-600/30'
                : 'bg-black/45 text-white hover:bg-black/65'
            }`}
            title="Dukung laporan ini / Saya terdampak juga"
          >
            <Heart className={`w-5 h-5 ${post.isSupportedByMe ? 'fill-current' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold mt-1 drop-shadow-md whitespace-nowrap tabular-nums select-none text-center">
            {formatEngagementMetric(post.supportCount)}
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/65 flex items-center justify-center transition-all active:scale-90"
            title="Bagikan laporan ini"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold mt-1 drop-shadow-md whitespace-nowrap tabular-nums select-none text-center">
            {formatEngagementMetric(post.sharesCount)}
          </span>
        </div>

        {/* Bookmark / Save Action */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
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
      <div className="relative z-10 p-4 sm:p-5 pb-24 lg:pb-5 pr-16 space-y-2">
        {/* Author Handle */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight drop-shadow-md">
            @{post.author.username}
          </span>
          <span className="text-xs text-white/70 font-mono">• {post.createdAt}</span>
        </div>

        {/* Body Caption with Max Characters & Toggle on Press/Click */}
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#263F35]/90 backdrop-blur-md text-[11px] font-medium text-white border border-[#E7EBDD]/30 hover:bg-[#263F35] transition-colors cursor-pointer"
            >
              <span>Lihat Laporan & APBD ({post.relatedReport.publicReference})</span>
            </button>
          )}
        </div>

        {/* Video Playback Bar if video */}
        {isVideo && (
          <div className="pt-2 flex items-center justify-between text-xs text-white/90">
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
              <button type="button" className="hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
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
      />
    </div>
  );
};
