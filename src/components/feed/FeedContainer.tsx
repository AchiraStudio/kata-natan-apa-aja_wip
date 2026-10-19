import React, { useEffect, useRef } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { FeedCard } from './FeedCard';
import { TitikLogo } from '../common/TitikLogo';

export const FeedContainer: React.FC = () => {
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
  const isScrollingRef = useRef(false);

  // Setup IntersectionObserver to sync active card with right panel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute('data-post-id');
            if (id) {
              setActivePostId(id);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    cardRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [posts, setActivePostId]);

  // Snappy Keyboard Navigation (ArrowUp & ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = posts.findIndex((p) => p.id === activePost?.id);
        if (currentIndex === -1) return;

        const isDown = e.key === 'ArrowDown' || e.key === 'PageDown';
        const nextIndex = isDown ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < posts.length) {
          const nextPost = posts[nextIndex];
          const el = cardRefs.current.get(nextPost.id);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActivePostId(nextPost.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts, activePost, setActivePostId]);

  // Desktop Mouse Wheel & Trackpad Interceptor: Single-Post Snappy Transition (Zero Free Gliding)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let wheelDeltaY = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Ignore tiny unintentional jitter
      if (Math.abs(e.deltaY) < 12) return;

      // Prevent continuous un-snapped gliding
      e.preventDefault();

      if (isScrollingRef.current) return;

      wheelDeltaY += e.deltaY;

      // Accumulator threshold to trigger snappy single-post transition
      if (Math.abs(wheelDeltaY) < 28) {
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          wheelDeltaY = 0;
        }, 120);
        return;
      }

      const currentIndex = posts.findIndex((p) => p.id === activePost?.id);
      if (currentIndex === -1) return;

      const direction = wheelDeltaY > 0 ? 1 : -1;
      const targetIndex = currentIndex + direction;

      if (targetIndex >= 0 && targetIndex < posts.length) {
        isScrollingRef.current = true;
        const targetPost = posts[targetIndex];
        const el = cardRefs.current.get(targetPost.id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActivePostId(targetPost.id);

        wheelDeltaY = 0;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 420);
      } else {
        wheelDeltaY = 0;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [posts, activePost, setActivePostId]);

  const tabs = [
    { key: 'following', label: 'Mengikuti' },
    { key: 'for_you', label: 'Untuk Anda' },
    { key: 'nearby', label: 'Terdekat' },
  ] as const;

  return (
    <div className="relative w-full h-[100dvh] lg:h-screen flex flex-col items-center max-w-none lg:max-w-3xl mx-auto p-0 overflow-hidden">
      {/* 1. TikTok-Style Centered Feed Tabs Header */}
      <div className="absolute top-0 inset-x-0 z-30 pt-3 sm:pt-4 pb-2 px-4 flex items-center justify-between pointer-events-none lg:static lg:h-12 lg:shrink-0 lg:bg-[#F7F6F1] lg:pt-2 lg:pb-1 lg:border-b lg:border-[#E4E2DA]/60 lg:max-w-xl lg:pointer-events-auto">
        {/* Left: Mobile Brand Mark (SVG Titik Logo) */}
        <div className="lg:hidden pointer-events-auto flex items-center">
          <a
            href="/"
            className="flex items-center gap-1.5 p-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 hover:bg-black/50 transition-colors cursor-pointer"
            title="TITIK."
          >
            <TitikLogo className="w-6 h-6" />
          </a>
        </div>

        {/* Center: Centered Tabs (Mengikuti | Untuk Anda | Terdekat) */}
        <div className="pointer-events-auto flex items-center justify-center gap-4 sm:gap-6 mx-auto">
          {tabs.map((tab) => {
            const isActive = activeFeedTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFeedTab(tab.key)}
                className={`text-sm font-bold relative pb-1 transition-all cursor-pointer ${
                  isActive
                    ? 'text-white lg:text-[#20221D] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] lg:drop-shadow-none'
                    : 'text-white/70 lg:text-[#686B65] hover:text-white lg:hover:text-[#20221D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] lg:drop-shadow-none'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-400 lg:bg-[#20221D] rounded-full shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search Action on mobile & desktop */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-full bg-black/30 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border border-white/15 lg:border-transparent text-white lg:text-[#686B65] hover:text-white lg:hover:text-[#20221D] hover:bg-black/50 lg:hover:bg-white transition-colors cursor-pointer"
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
          <div className="p-12 text-center text-[#686B65] bg-white rounded-2xl border border-[#E4E2DA] max-w-md my-auto">
            <Sparkles className="w-8 h-8 text-[#263F35] mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#20221D]">Belum ada laporan di tab ini</h4>
            <p className="text-xs text-[#686B65] mt-1">
              Jadilah yang pertama mendokumentasikan fasilitas di lingkungan Anda!
            </p>
          </div>
        ) : (
          (() => {
            const activeIndex = posts.findIndex((p) => p.id === activePost?.id);
            return posts.map((post, index) => {
              const isActive = activePost?.id === post.id;
              const isNearActive = activeIndex === -1 || Math.abs(index - activeIndex) <= 1;

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
            });
          })()
        )}
      </div>
    </div>
  );
};
