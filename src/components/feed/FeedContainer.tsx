import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, MessageSquare, Plus } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { FeedCard } from './FeedCard';
import { TitikLogo } from '../common/TitikLogo';

const FEED_TABS = [
  { key: 'following', label: 'Mengikuti' },
  { key: 'for_you', label: 'Untuk Anda' },
  { key: 'nearby', label: 'Terdekat' },
] as const;

const ACTIVE_POST_STORAGE_KEY = 'titik_feed_active_post_id';

/** True when a key press belongs to a form control or an open dialog rather than the feed. */
const isTypingContext = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true;
  return Boolean(el.closest?.('[role="dialog"], [data-scroll-isolated="true"]'));
};

export const FeedContainer: React.FC = () => {
  const navigate = useNavigate();
  const {
    posts,
    isLoading,
    activeFeedTab,
    setActiveFeedTab,
    activePost,
    setActivePostId,
    setSearchModalOpen,
    openComposer,
    unreadMessagesCount,
  } = useTitik();

  // Sound preference is shared by every card: one tap on unmute carries to the next video
  const [isMuted, setIsMuted] = useState(true);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Wheel gesture lock: one physical swipe moves exactly one post
  const isLockedRef = useRef(false);
  const wheelIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedDeltaRef = useRef(0);
  const activePostIndexRef = useRef(0);
  const firstPostIdRef = useRef(posts[0]?.id);
  const isRestoringScrollRef = useRef(true);
  const hasRestoredInitialScrollRef = useRef(false);
  const initialTargetIdRef = useRef(
    (typeof window !== 'undefined' ? sessionStorage.getItem(ACTIVE_POST_STORAGE_KEY) : null) || activePost?.id
  );

  const forgetSavedPost = () => {
    try {
      sessionStorage.removeItem(ACTIVE_POST_STORAGE_KEY);
    } catch {
      // storage unavailable: nothing to forget
    }
  };

  // Restore the feed to the previously viewed post once, when returning from another view
  useEffect(() => {
    if (hasRestoredInitialScrollRef.current) return;
    if (!posts || posts.length === 0) {
      isRestoringScrollRef.current = false;
      return;
    }
    hasRestoredInitialScrollRef.current = true;

    const savedTargetId = initialTargetIdRef.current;
    const targetIdx = savedTargetId ? posts.findIndex((p) => p.id === savedTargetId) : -1;
    if (!savedTargetId || targetIdx <= 0) {
      isRestoringScrollRef.current = false;
      return;
    }

    activePostIndexRef.current = targetIdx;
    const timer = setTimeout(() => {
      const targetEl = cardRefs.current.get(savedTargetId);
      scrollContainerRef.current?.scrollTo({ top: targetEl?.offsetTop ?? 0, behavior: 'instant' as ScrollBehavior });
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 150);
    }, 25);
    return () => clearTimeout(timer);
  }, [posts]);

  // A new first post (tab switch, refresh) resets the stream to the top
  useEffect(() => {
    const firstPostId = posts[0]?.id;
    if (firstPostId && firstPostIdRef.current && firstPostId !== firstPostIdRef.current) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      activePostIndexRef.current = 0;
      setActivePostId(firstPostId);
    }
    firstPostIdRef.current = firstPostId;
  }, [posts, setActivePostId]);

  useEffect(() => {
    const idx = posts.findIndex((p) => p.id === activePost?.id);
    if (idx !== -1) activePostIndexRef.current = idx;
  }, [posts, activePost?.id]);

  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      const targetPost = posts[targetIndex];
      if (!targetPost) return;
      activePostIndexRef.current = targetIndex;
      setActivePostId(targetPost.id);
      const targetEl = cardRefs.current.get(targetPost.id);
      scrollContainerRef.current?.scrollTo({ top: targetEl?.offsetTop ?? 0, behavior: 'smooth' });
    },
    [posts, setActivePostId]
  );

  // Touch swipes and native scrolling: the card that is mostly visible becomes active
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isRestoringScrollRef.current) return;
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6 && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry;
          }
        }
        const id = best?.target.getAttribute('data-post-id');
        if (!id) return;
        setActivePostId(id);
        try {
          sessionStorage.setItem(ACTIVE_POST_STORAGE_KEY, id);
        } catch {
          // storage unavailable: restoration is a convenience only
        }
        const idx = posts.findIndex((p) => p.id === id);
        if (idx !== -1) activePostIndexRef.current = idx;
      },
      { root, threshold: [0.6] }
    );
    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [posts, setActivePostId]);

  // Home icon: jump back to the first post
  useEffect(() => {
    const handleScrollTop = () => {
      isRestoringScrollRef.current = false;
      forgetSavedPost();
      scrollToIndex(0);
    };
    window.addEventListener('titik-scroll-top', handleScrollTop);
    return () => window.removeEventListener('titik-scroll-top', handleScrollTop);
  }, [scrollToIndex]);

  // Keyboard: arrows and Page keys move between posts, but never while typing or in a dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) return;
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingContext(e.target)) return;
      if (document.body.dataset.commentsOpen === 'true') return;
      e.preventDefault();
      const isDown = e.key === 'ArrowDown' || e.key === 'PageDown';
      const nextIndex = activePostIndexRef.current + (isDown ? 1 : -1);
      if (nextIndex >= 0 && nextIndex < posts.length) scrollToIndex(nextIndex);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts, scrollToIndex]);

  // Desktop wheel and trackpad: single-post transitions with inertia absorbed
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();

      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = setTimeout(() => {
        isLockedRef.current = false;
        accumulatedDeltaRef.current = 0;
      }, 240);

      if (isLockedRef.current) return;
      accumulatedDeltaRef.current += e.deltaY;
      if (Math.abs(accumulatedDeltaRef.current) < 24) return;

      isLockedRef.current = true;
      const direction = accumulatedDeltaRef.current > 0 ? 1 : -1;
      const currentIndex = activePostIndexRef.current;
      const targetIndex = Math.max(0, Math.min(posts.length - 1, currentIndex + direction));
      if (targetIndex !== currentIndex) scrollToIndex(targetIndex);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
    };
  }, [posts, scrollToIndex]);

  const currentActiveIndex = posts.findIndex((p) => p.id === activePost?.id);
  const unread = (unreadMessagesCount ?? 0) > 0;

  const iconBtn =
    'relative w-9 h-9 rounded-xl glass-media flex items-center justify-center text-white/90 hover:bg-black/60 transition-colors cursor-pointer';

  return (
    <div className="relative w-full h-[100dvh] lg:h-screen flex flex-col items-center overflow-hidden">
      {/* Header: floats over the video on phones, sits on the canvas on desktop */}
      <header className="absolute top-0 inset-x-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 pb-6 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/55 to-transparent lg:static lg:h-14 lg:shrink-0 lg:bg-none lg:p-0 lg:justify-center">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToIndex(0);
          }}
          className="lg:hidden pointer-events-auto w-9 h-9 flex items-center justify-center"
          aria-label="Kembali ke laporan pertama"
          title="Kembali ke atas"
        >
          <TitikLogo className="w-7 h-7" />
        </a>

        <nav className="pointer-events-auto flex items-center gap-5 lg:gap-8" aria-label="Jenis feed">
          {FEED_TABS.map((tab) => {
            const isActive = activeFeedTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  forgetSavedPost();
                  isRestoringScrollRef.current = false;
                  setActiveFeedTab(tab.key);
                }}
                className={`relative py-1.5 text-[13px] font-semibold transition-colors cursor-pointer drop-shadow-sm lg:drop-shadow-none ${
                  isActive ? 'text-white lg:text-ink' : 'text-white/65 hover:text-white lg:text-ink-3 lg:hover:text-ink'
                }`}
              >
                {tab.label}
                {isActive && <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
              </button>
            );
          })}
        </nav>

        <div className="lg:hidden pointer-events-auto flex items-center gap-2">
          <button type="button" onClick={() => navigate('/pesan')} className={iconBtn} title="Pesan Langsung" aria-label="Pesan">
            <MessageSquare className="w-4 h-4" />
            {unread && (
              <span
                data-testid="messages-unread-dot"
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-black/60"
                title="Pesan belum dibaca"
              />
            )}
          </button>
          <button type="button" onClick={() => setSearchModalOpen(true)} className={iconBtn} title="Cari laporan atau fasilitas" aria-label="Cari">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stream */}
      <div
        ref={scrollContainerRef}
        data-feed-scroll="true"
        className="home-feed-stream w-full h-[100dvh] lg:h-[calc(100dvh-3.5rem)] overflow-y-scroll snap-y snap-mandatory lg:scroll-smooth no-scrollbar select-none"
      >
        {isLoading && posts.length === 0 ? (
          <div className="h-full flex items-center justify-center" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3 text-ink-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-brand titik-live" />
              Memuat laporan warga
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="panel max-w-sm p-6 text-center space-y-3">
              <h2 className="font-display text-lg font-bold text-ink">Belum ada laporan di tab ini</h2>
              <p className="text-sm text-ink-2">Jadilah yang pertama mendokumentasikan fasilitas di lingkungan Anda.</p>
              <button
                type="button"
                onClick={() => openComposer('post')}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.6} />
                Buat laporan
              </button>
            </div>
          </div>
        ) : (
          posts.map((post, postIdx) => {
            const isActive = activePost?.id === post.id;
            const isNearActive = currentActiveIndex < 0 ? postIdx <= 1 : Math.abs(postIdx - currentActiveIndex) <= 1;
            return (
              <div
                key={post.id}
                data-post-id={post.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(post.id, el);
                  else cardRefs.current.delete(post.id);
                }}
                className="home-feed-item snap-start snap-always w-full h-[100dvh] lg:h-[calc(100dvh-3.5rem)] shrink-0 flex justify-center items-center lg:pb-4"
              >
                <FeedCard
                  post={post}
                  isActive={isActive}
                  isNearActive={isNearActive}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted((m) => !m)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Desktop position and step controls */}
      {posts.length > 1 && (
        <div className="hidden lg:flex flex-col items-center gap-1.5 absolute right-4 xl:right-6 top-1/2 -translate-y-1/2 z-30">
          <button
            type="button"
            disabled={currentActiveIndex <= 0}
            onClick={() => scrollToIndex(currentActiveIndex - 1)}
            className="w-10 h-10 rounded-xl bg-surface border border-line-soft text-ink-2 hover:text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Laporan sebelumnya"
            title="Laporan sebelumnya (Panah atas)"
          >
            <ChevronUp className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <span className="text-[11px] font-medium text-ink-3 tabular-nums py-0.5">
            {Math.max(1, currentActiveIndex + 1)}/{posts.length}
          </span>
          <button
            type="button"
            disabled={currentActiveIndex >= posts.length - 1}
            onClick={() => scrollToIndex(currentActiveIndex + 1)}
            className="w-10 h-10 rounded-xl bg-surface border border-line-soft text-ink-2 hover:text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Laporan berikutnya"
            title="Laporan berikutnya (Panah bawah)"
          >
            <ChevronDown className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
};
