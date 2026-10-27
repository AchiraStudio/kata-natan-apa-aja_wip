import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { FeedCard } from './FeedCard';
import { TitikLogo } from '../common/TitikLogo';

export const FeedContainer: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    posts,
    activeFeedTab,
    setActiveFeedTab,
    activePost,
    setActivePostId,
    setSearchModalOpen,
  } = useTitik();

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Gesture Lock Refs: prevents trackpad momentum from jumping multiple posts
  const isLockedRef = useRef(false);
  const wheelIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedDeltaRef = useRef(0);
  const activePostIndexRef = useRef(0);
  const firstPostIdRef = useRef(posts[0]?.id);
  const isRestoringScrollRef = useRef(true);

  // Scroll Restoration: Restore feed to activePost or saved post when returning from other views
  useEffect(() => {
    if (!posts || posts.length === 0) {
      isRestoringScrollRef.current = false;
      return;
    }

    const savedTargetId =
      activePost?.id ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('titik_feed_active_post_id') : null);

    if (!savedTargetId) {
      isRestoringScrollRef.current = false;
      return;
    }

    const targetIdx = posts.findIndex((p) => p.id === savedTargetId);
    if (targetIdx <= 0) {
      isRestoringScrollRef.current = false;
      return;
    }

    activePostIndexRef.current = targetIdx;

    const restoreScroll = () => {
      const targetEl = cardRefs.current.get(savedTargetId);
      const container = scrollContainerRef.current;
      if (targetEl && container) {
        container.scrollTo({ top: targetEl.offsetTop, behavior: 'instant' as ScrollBehavior });
      }
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 150);
    };

    const timer = setTimeout(restoreScroll, 25);
    return () => clearTimeout(timer);
  }, [posts, activePost?.id]);

  useEffect(() => {
    const firstPostId = posts[0]?.id;
    if (firstPostId && firstPostIdRef.current && firstPostId !== firstPostIdRef.current) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      activePostIndexRef.current = 0;
      setActivePostId(firstPostId);
    }
    firstPostIdRef.current = firstPostId;
  }, [posts, setActivePostId]);

  // Keep active index ref in sync with active post
  useEffect(() => {
    const idx = posts.findIndex((p) => p.id === activePost?.id);
    if (idx !== -1) {
      activePostIndexRef.current = idx;
    }
  }, [posts, activePost?.id]);

  // Smooth scroll to a target post index with pixel precision
  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= posts.length) return;
      const targetPost = posts[targetIndex];
      if (!targetPost) return;

      activePostIndexRef.current = targetIndex;
      setActivePostId(targetPost.id);

      const targetEl = cardRefs.current.get(targetPost.id);
      const container = scrollContainerRef.current;
      if (targetEl && container) {
        const targetTop = targetEl.offsetTop;
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    },
    [posts, setActivePostId]
  );

  // Setup IntersectionObserver to sync active card when user swipes on mobile touch
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isRestoringScrollRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute('data-post-id');
            if (id) {
              setActivePostId(id);
              try {
                sessionStorage.setItem('titik_feed_active_post_id', id);
              } catch {
                // ignore
              }
              const idx = posts.findIndex((p) => p.id === id);
              if (idx !== -1) {
                activePostIndexRef.current = idx;
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [posts, setActivePostId]);

  // Support intentional tap-to-top on home icon
  useEffect(() => {
    const handleScrollTop = () => {
      isRestoringScrollRef.current = false;
      try {
        sessionStorage.removeItem('titik_feed_active_post_id');
      } catch {
        // ignore
      }
      scrollToIndex(0);
    };

    window.addEventListener('titik-scroll-top', handleScrollTop);
    return () => window.removeEventListener('titik-scroll-top', handleScrollTop);
  }, [scrollToIndex]);

  // Keyboard navigation: ArrowUp, ArrowDown, PageUp, PageDown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = activePostIndexRef.current;
        const isDown = e.key === 'ArrowDown' || e.key === 'PageDown';
        const nextIndex = isDown ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < posts.length) {
          scrollToIndex(nextIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts, scrollToIndex]);

  // Desktop Mouse Wheel & Trackpad Interceptor: Single-Post Snappy Transition (Guaranteed Zero Runaway)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Early return guard: ignore wheel events from scroll-isolated sub-containers (e.g. comments, caption expansions)
      if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
        return;
      }

      // Ignore horizontal trackpad gestures
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Always prevent default to eliminate loose browser free gliding
      e.preventDefault();

      // Reset idle timer on every incoming event packet (absorbs trackpad deceleration curve)
      if (wheelIdleTimerRef.current) {
        clearTimeout(wheelIdleTimerRef.current);
      }

      // Unlock 240ms after user stops physically scrolling
      wheelIdleTimerRef.current = setTimeout(() => {
        isLockedRef.current = false;
        accumulatedDeltaRef.current = 0;
      }, 240);

      // If a transition has already been triggered for this physical swipe, drop all inertial packets!
      if (isLockedRef.current) {
        return;
      }

      accumulatedDeltaRef.current += e.deltaY;

      // Require intentional flick threshold (24px)
      if (Math.abs(accumulatedDeltaRef.current) >= 24) {
        isLockedRef.current = true;
        const direction = accumulatedDeltaRef.current > 0 ? 1 : -1;
        const currentIndex = activePostIndexRef.current;
        const targetIndex = Math.max(0, Math.min(posts.length - 1, currentIndex + direction));

        if (targetIndex !== currentIndex) {
          scrollToIndex(targetIndex);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
    };
  }, [posts, scrollToIndex]);

  const tabs = [
    { key: 'following', label: 'Mengikuti' },
    { key: 'for_you', label: 'Untuk Anda' },
    { key: 'nearby', label: 'Terdekat' },
  ] as const;

  const currentActiveIndex = posts.findIndex((p) => p.id === activePost?.id);

  return (
    <div className="relative w-full h-[100dvh] lg:h-screen flex flex-col items-center max-w-none lg:max-w-4xl xl:max-w-5xl mx-auto p-0 overflow-hidden">
      {/* 1. Centered Feed Tabs Header */}
      <div className="absolute top-0 inset-x-0 z-30 pt-3 sm:pt-4 pb-2 px-4 flex items-center justify-between pointer-events-none lg:static lg:w-full lg:max-w-none lg:h-12 lg:shrink-0 lg:bg-[#F7F6F1] dark:lg:bg-[#0C100E] lg:pt-2 lg:pb-1 lg:border-b lg:border-[#E4E2DA]/60 dark:lg:border-[#26352E] lg:pointer-events-auto">
        {/* Left: Mobile Brand Mark (SVG Titik Logo) */}
        <div className="lg:hidden pointer-events-auto flex items-center">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToIndex(0);
            }}
            className="flex items-center gap-1.5 p-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 hover:bg-black/50 transition-colors cursor-pointer"
            title="TITIK."
          >
            <TitikLogo className="w-6 h-6" />
          </a>
        </div>

        {/* Center: Centered Tabs (Mengikuti | Untuk Anda | Terdekat) */}
        <div className="pointer-events-auto flex items-center justify-center gap-5 sm:gap-7 mx-auto">
          {tabs.map((tab) => {
            const isActive = activeFeedTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('titik_feed_active_post_id');
                  } catch {
                    // ignore
                  }
                  isRestoringScrollRef.current = false;
                  setActiveFeedTab(tab.key);
                }}
                className={`text-sm font-bold relative pb-1 transition-all cursor-pointer ${
                  isActive
                    ? 'text-white lg:text-[#20221D] dark:lg:text-[#F3F6F4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] lg:drop-shadow-none'
                    : 'text-white/70 lg:text-[#686B65] dark:lg:text-[#9EACA3] hover:text-white lg:hover:text-[#20221D] dark:lg:hover:text-[#F3F6F4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] lg:drop-shadow-none'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 lg:bg-[#20221D] dark:lg:bg-[#10B981] rounded-full shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search Action and Admin Mobile Shortcut */}
        <div className="pointer-events-auto flex items-center gap-2">
          {profile?.role === 'admin' && (
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigate('/admin');
              }}
              className="lg:hidden p-1.5 sm:p-2 rounded-full bg-amber-600/90 hover:bg-amber-600 border border-white/20 backdrop-blur-md text-amber-100 hover:text-white transition-colors cursor-pointer flex items-center justify-center shadow-xs"
              title="Portal Tinjauan Admin PUPR"
              aria-label="Portal Admin"
            >
              <ShieldAlert className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-full bg-black/30 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border border-white/15 lg:border-transparent text-white lg:text-[#686B65] dark:lg:text-[#9EACA3] hover:text-white lg:hover:text-[#20221D] dark:lg:hover:text-[#F3F6F4] hover:bg-black/50 lg:hover:bg-white dark:lg:hover:bg-[#1A221E] transition-colors cursor-pointer"
            title="Cari laporan atau fasilitas"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Scroll-Snapped Feed Stream (Full Height Viewport on Both Desktop & Mobile) */}
      <div
        ref={scrollContainerRef}
        data-feed-scroll="true"
        className="home-feed-stream w-full h-[100dvh] lg:h-[calc(100vh-3rem)] flex-1 flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar select-none"
      >
        {posts.length === 0 ? (
          <div className="p-12 text-center text-[#686B65] dark:text-[#9EACA3] bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E4E2DA] dark:border-[#26352E] max-w-md my-auto">
            <Sparkles className="w-8 h-8 text-[#263F35] dark:text-[#10B981] mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#20221D] dark:text-[#F3F6F4]">Belum ada laporan di tab ini</h4>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
              Jadilah yang pertama mendokumentasikan fasilitas di lingkungan Anda!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const isActive = activePost?.id === post.id;
            const postIdx = posts.findIndex((p) => p.id === post.id);
            const isNearActive = Math.abs(postIdx - currentActiveIndex) <= 1;

            return (
              <div
                key={post.id}
                data-post-id={post.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(post.id, el);
                  else cardRefs.current.delete(post.id);
                }}
                className="home-feed-item snap-start snap-always w-full h-[100dvh] lg:h-[calc(100vh-3rem)] shrink-0 flex justify-center items-center py-0 lg:py-2"
              >
                <FeedCard
                  post={post}
                  isActive={isActive}
                  isNearActive={isNearActive}
                />
              </div>
            );
          })
        )}
      </div>

      {/* 3. Desktop Floating Tactical Up/Down Navigation Chevrons */}
      <div className="hidden lg:flex flex-col gap-2.5 absolute right-3 xl:right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          disabled={currentActiveIndex <= 0}
          onClick={() => scrollToIndex(currentActiveIndex - 1)}
          className="p-3 rounded-full bg-white/90 dark:bg-[#1A221E]/90 backdrop-blur-md border border-[#E4E2DA] dark:border-[#26352E] shadow-md text-[#263F35] dark:text-[#34D399] hover:bg-white dark:hover:bg-[#24302A] hover:border-[#263F35]/40 dark:hover:border-[#10B981]/50 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          title="Laporan Sebelumnya (ArrowUp)"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          disabled={currentActiveIndex >= posts.length - 1}
          onClick={() => scrollToIndex(currentActiveIndex + 1)}
          className="p-3 rounded-full bg-white/90 dark:bg-[#1A221E]/90 backdrop-blur-md border border-[#E4E2DA] dark:border-[#26352E] shadow-md text-[#263F35] dark:text-[#34D399] hover:bg-white dark:hover:bg-[#24302A] hover:border-[#263F35]/40 dark:hover:border-[#10B981]/50 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          title="Laporan Berikutnya (ArrowDown)"
        >
          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
