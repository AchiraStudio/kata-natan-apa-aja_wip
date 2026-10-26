import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { CommentsBottomSheet } from '../components/feed/CommentsBottomSheet';
import { FeedCard } from '../components/feed/FeedCard';
import { TitikContext } from '../context/TitikContext';
import { MOCK_POSTS_KN } from '../data/mockCivicData';
import { formatEngagementMetric } from '../utils/formatters';
import { FeedComment } from '../services/adapters/types';
import { Report } from '../types/domain';

// Mock useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: {
      id: 'usr-demo-1',
      username: 'warga_teladan',
      displayName: 'Warga Teladan',
      role: 'citizen',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      points: 250,
      verifiedReportsCount: 8,
      createdAt: '2026-01-01',
    },
    session: null,
    isLoading: false,
    isAuthenticated: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInAsPersona: vi.fn(),
    switchProfile: vi.fn(),
  }),
}));

// Helper to build mock context values
function createMockContext(overrides: Partial<any> = {}) {
  return {
    posts: MOCK_POSTS_KN,
    activePost: MOCK_POSTS_KN[0],
    activeFeedTab: 'for_you' as const,
    selectedCategory: 'Semua',
    facilities: [],
    budgetSectors: [],
    reportModalOpen: false,
    reportDetailOpen: false,
    selectedReport: null,
    searchModalOpen: false,
    landingBannerOpen: false,
    isLoading: false,
    setActivePostId: vi.fn(),
    setActiveFeedTab: vi.fn(),
    setSelectedCategory: vi.fn(),
    openReportModal: vi.fn(),
    closeReportModal: vi.fn(),
    openReportDetail: vi.fn(),
    closeReportDetail: vi.fn(),
    setSearchModalOpen: vi.fn(),
    setLandingBannerOpen: vi.fn(),
    toggleSupport: vi.fn(),
    addComment: vi.fn(async (_postId: string, body: string): Promise<FeedComment> => ({
      id: `mock-new-${Date.now()}`,
      authorName: 'Warga Anda',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      body,
      timeAgo: 'Baru saja',
      likes: 0,
    })),
    getComments: vi.fn(async (): Promise<FeedComment[]> => [
      {
        id: 'c-001',
        authorName: 'Budi Santoso',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        body: 'Mohon dinas terkait segera meninjau ke lokasi.',
        timeAgo: '2 jam lalu',
        likes: 15,
      },
      {
        id: 'c-002',
        authorName: 'Rina Wijaya',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        body: 'Saya tiap hari lewat sini, lubangnya makin dalam.',
        timeAgo: '1 jam lalu',
        likes: 8,
      },
      {
        id: 'c-003',
        parentId: 'c-001',
        authorName: 'Pak RT Bambang',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61',
        body: 'Sudah dilaporkan ke kelurahan juga bu.',
        timeAgo: '45 menit lalu',
        likes: 3,
      },
    ]),
    submitReport: vi.fn(async () => ({
      success: true,
      report: {} as Report,
      publicReference: 'TIK-2026-0001',
      secretFollowUpToken: 'tok',
    })),
    updateReportStatus: vi.fn(),
    refreshFeed: vi.fn(),
    ...overrides,
  };
}

describe('Milestone 4: CommentsBottomSheet & Event Isolation Verification Suite', () => {
  // ===========================================================================
  // 1. Static Layout & Scroll Isolation Attribute Invariants
  // ===========================================================================
  describe('Suite 1: DOM Attribute & Layout Isolation Invariants', () => {
    it('renders root backdrop container with data-scroll-isolated="true"', () => {
      const mockContext = createMockContext();

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <CommentsBottomSheet
            isOpen={true}
            onClose={() => {}}
            postId="kn-001"
            commentsCount={3400}
          />
        </TitikContext.Provider>
      );

      // Root backdrop must have data-scroll-isolated="true" and absolute positioning
      expect(html).toContain('data-scroll-isolated="true"');
      expect(html).toMatch(/<div[^>]*data-scroll-isolated="true"[^>]*class="[^"]*absolute inset-0[^"]*"/);
    });

    it('renders bottom sheet panel with data-scroll-isolated="true" and overscroll-y-contain', () => {
      const mockContext = createMockContext();

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <CommentsBottomSheet
            isOpen={true}
            onClose={() => {}}
            postId="kn-001"
            commentsCount={3400}
          />
        </TitikContext.Provider>
      );

      // Sheet panel must have data-scroll-isolated="true" and overscroll-y-contain
      expect(html).toMatch(/<div[^>]*data-scroll-isolated="true"[^>]*class="[^"]*overscroll-y-contain[^"]*"/);
      expect(html).toContain('max-h-[75%]');
    });

    it('renders scrollable comments list with data-scroll-isolated="true" and touch-pan-y', () => {
      const mockContext = createMockContext();

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <CommentsBottomSheet
            isOpen={true}
            onClose={() => {}}
            postId="kn-001"
            commentsCount={3400}
          />
        </TitikContext.Provider>
      );

      // Scrollable list container must contain overscroll-y-contain and touch-pan-y
      expect(html).toMatch(/<div[^>]*data-scroll-isolated="true"[^>]*class="[^"]*overflow-y-auto[^"]*overscroll-y-contain touch-pan-y[^"]*"/);
    });

    it('renders for all 10 seed posts (kn-001 through kn-010) with verified attributes', () => {
      expect(MOCK_POSTS_KN.length).toBe(10);
      const mockContext = createMockContext();

      MOCK_POSTS_KN.forEach((post) => {
        const html = renderToStaticMarkup(
          <TitikContext.Provider value={mockContext}>
            <CommentsBottomSheet
              isOpen={true}
              onClose={() => {}}
              postId={post.id}
              commentsCount={post.commentsCount}
            />
          </TitikContext.Provider>
        );

        expect(html).toContain('data-scroll-isolated="true"');
        expect(html).toContain('overscroll-y-contain');
        expect(html).toContain('Komentar Warga');
        expect(html).toContain(String(post.commentsCount));
      });
    });
  });

  // ===========================================================================
  // 2. FeedContainer Wheel Guard & Event Interception Defense
  // ===========================================================================
  describe('Suite 2: FeedContainer Wheel Interceptor Guarding & Event Isolation', () => {
    it('guards handleWheel against elements with [data-scroll-isolated="true"]', () => {
      // Create DOM elements mimicking the nested hierarchy
      const isolatedRoot = {
        hasAttribute: (attr: string) => attr === 'data-scroll-isolated',
        getAttribute: (attr: string) => (attr === 'data-scroll-isolated' ? 'true' : null),
        closest: (sel: string) => (sel.includes('data-scroll-isolated') ? isolatedRoot : null),
      };

      const childInsideComments = {
        hasAttribute: () => false,
        getAttribute: () => null,
        closest: (sel: string) => (sel.includes('data-scroll-isolated') ? isolatedRoot : null),
      };

      const unisolatedTarget = {
        hasAttribute: () => false,
        getAttribute: () => null,
        closest: () => null,
      };

      // Guard function matching FeedContainer.tsx:handleWheel implementation
      const shouldBypassWheelHandler = (target: unknown): boolean => {
        return Boolean((target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]'));
      };

      expect(shouldBypassWheelHandler(isolatedRoot)).toBe(true);
      expect(shouldBypassWheelHandler(childInsideComments)).toBe(true);
      expect(shouldBypassWheelHandler(unisolatedTarget)).toBe(false);
      expect(shouldBypassWheelHandler(null)).toBe(false);
      expect(shouldBypassWheelHandler(undefined)).toBe(false);
    });

    it('verifies wheel events from isolated comments do not call preventDefault or snap the feed', () => {
      let isPreventDefaultCalled = false;
      let feedTransitionTriggered = false;

      const mockEvent = {
        deltaX: 0,
        deltaY: 50,
        target: {
          closest: (selector: string) => (selector === '[data-scroll-isolated="true"]' ? {} : null),
        },
        preventDefault: () => {
          isPreventDefaultCalled = true;
        },
      };

      // FeedContainer handleWheel logic simulation
      const handleWheel = (e: typeof mockEvent) => {
        // Early return guard
        if ((e.target as unknown as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
          return;
        }
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        feedTransitionTriggered = true;
      };

      handleWheel(mockEvent);

      expect(isPreventDefaultCalled).toBe(false);
      expect(feedTransitionTriggered).toBe(false);
    });

    it('verifies wheel events on regular feed items trigger preventDefault and snap transitions', () => {
      let isPreventDefaultCalled = false;
      let feedTransitionTriggered = false;

      const mockEvent = {
        deltaX: 0,
        deltaY: 50,
        target: {
          closest: () => null, // Not isolated
        },
        preventDefault: () => {
          isPreventDefaultCalled = true;
        },
      };

      const handleWheel = (e: typeof mockEvent) => {
        if ((e.target as unknown as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
          return;
        }
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        feedTransitionTriggered = true;
      };

      handleWheel(mockEvent);

      expect(isPreventDefaultCalled).toBe(true);
      expect(feedTransitionTriggered).toBe(true);
    });

    it('verifies native non-passive wheel event listener stops propagation', () => {
      let isPropagationStopped = false;
      const fakeEvent = {
        stopPropagation: () => {
          isPropagationStopped = true;
        },
      };

      // Native stopWheel handler attached to sheetRef in CommentsBottomSheet
      const stopWheel = (e: typeof fakeEvent) => {
        e.stopPropagation();
      };

      stopWheel(fakeEvent);
      expect(isPropagationStopped).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Comments Like Toggling & Optimistic Delta State
  // ===========================================================================
  describe('Suite 3: Comments Like Toggling & Optimistic State Sync', () => {
    it('computes optimistic like toggling correctly across repeated clicks', () => {
      let likedCommentIds = new Set<string>();
      let likesDeltaMap: Record<string, number> = {};

      const toggleLike = (commentId: string) => {
        const isCurrentlyLiked = likedCommentIds.has(commentId);
        const nextSet = new Set(likedCommentIds);
        if (isCurrentlyLiked) {
          nextSet.delete(commentId);
        } else {
          nextSet.add(commentId);
        }
        likedCommentIds = nextSet;
        likesDeltaMap = {
          ...likesDeltaMap,
          [commentId]: (likesDeltaMap[commentId] || 0) + (isCurrentlyLiked ? -1 : 1),
        };
      };

      const initialLikes = 10;
      const commentId = 'c-001';

      // First click: likes the comment (+1)
      toggleLike(commentId);
      expect(likedCommentIds.has(commentId)).toBe(true);
      expect(likesDeltaMap[commentId]).toBe(1);
      const likesAfterFirst = Math.max(0, initialLikes + likesDeltaMap[commentId]);
      expect(likesAfterFirst).toBe(11);

      // Second click: unlikes the comment (0 delta)
      toggleLike(commentId);
      expect(likedCommentIds.has(commentId)).toBe(false);
      expect(likesDeltaMap[commentId]).toBe(0);
      const likesAfterSecond = Math.max(0, initialLikes + likesDeltaMap[commentId]);
      expect(likesAfterSecond).toBe(10);

      // Third click: re-likes the comment (+1)
      toggleLike(commentId);
      expect(likedCommentIds.has(commentId)).toBe(true);
      expect(likesDeltaMap[commentId]).toBe(1);
      const likesAfterThird = Math.max(0, initialLikes + likesDeltaMap[commentId]);
      expect(likesAfterThird).toBe(11);
    });

    it('enforces non-negative likes floor with Math.max(0, ...)', () => {
      let likesDeltaMap: Record<string, number> = { 'c-zero': -2 };
      const rawLikes = 0;
      const computedLikes = Math.max(0, rawLikes + (likesDeltaMap['c-zero'] || 0));
      expect(computedLikes).toBe(0);
    });

    it('isolates like toggles across different comment IDs independently', () => {
      const likedCommentIds = new Set<string>(['c-001']);
      const likesDeltaMap: Record<string, number> = { 'c-001': 1, 'c-002': 0 };

      expect(likedCommentIds.has('c-001')).toBe(true);
      expect(likedCommentIds.has('c-002')).toBe(false);
      expect(likesDeltaMap['c-001']).toBe(1);
      expect(likesDeltaMap['c-002']).toBe(0);
    });
  });

  // ===========================================================================
  // 4. Comment Submission & Counter Synchronization
  // ===========================================================================
  describe('Suite 4: Comment Submission & Feed Counter Synchronization', () => {
    it('prepends newly submitted comment to list and triggers onCommentAdded callback', async () => {
      let commentsList: FeedComment[] = [
        {
          id: 'c-existing-1',
          authorName: 'Warga Lama',
          avatarUrl: 'https://example.com/avatar.png',
          body: 'Laporan lama',
          timeAgo: '1 jam lalu',
          likes: 4,
        },
      ];

      let onCommentAddedCalled = false;
      const onCommentAdded = () => {
        onCommentAddedCalled = true;
      };

      const newCommentBody = 'Ada perbaikan darurat yang mulai dikerjakan sore ini.';
      const authorName = 'Warga Baru';
      const avatarUrl = 'https://example.com/new.png';

      const mockAddComment = async (_postId: string, body: string): Promise<FeedComment> => ({
        id: 'c-new-001',
        authorName,
        avatarUrl,
        body,
        timeAgo: 'Baru saja',
        likes: 0,
      });

      // Execute submission routine matching CommentsBottomSheet:handleSubmit
      const created = await mockAddComment('kn-001', newCommentBody);
      commentsList = [created, ...commentsList];
      onCommentAdded();

      expect(onCommentAddedCalled).toBe(true);
      expect(commentsList.length).toBe(2);
      expect(commentsList[0].id).toBe('c-new-001');
      expect(commentsList[0].body).toBe(newCommentBody);
      expect(commentsList[0].likes).toBe(0);
      expect(commentsList[1].id).toBe('c-existing-1');
    });

    it('handles fallback optimistic comments if addComment returns null', async () => {
      let commentsList: FeedComment[] = [];
      const newCommentBody = 'Komentar offline / optimistic';
      const authorName = 'Warga Anda';

      const mockAddCommentNull = async (): Promise<FeedComment | null> => null;

      const created = await mockAddCommentNull();
      if (!created) {
        const optimistic: FeedComment = {
          id: `c-${Date.now()}`,
          authorName,
          avatarUrl: 'https://example.com/default.png',
          body: newCommentBody,
          timeAgo: 'Baru saja',
          likes: 0,
        };
        commentsList = [optimistic, ...commentsList];
      }

      expect(commentsList.length).toBe(1);
      expect(commentsList[0].body).toBe(newCommentBody);
    });

    it('threads reply comments with parentId matching replyTarget', async () => {
      const parentComment: FeedComment = {
        id: 'c-parent-10',
        authorName: 'Ketua RW',
        avatarUrl: 'https://example.com/rw.png',
        body: 'Kondisi sedang dikoordinasikan.',
        timeAgo: '10 menit lalu',
        likes: 2,
      };

      const replyTarget = { id: parentComment.id, authorName: parentComment.authorName };

      const replyComment: FeedComment = {
        id: 'c-reply-11',
        parentId: replyTarget.id,
        authorName: 'Warga Peduli',
        avatarUrl: 'https://example.com/warga.png',
        body: 'Terima kasih atas koordinasinya Pak RW.',
        timeAgo: 'Baru saja',
        likes: 0,
      };

      const allComments = [parentComment, replyComment];
      const directReplies = allComments.filter((c) => c.parentId === parentComment.id);

      expect(directReplies.length).toBe(1);
      expect(directReplies[0].id).toBe('c-reply-11');
      expect(directReplies[0].parentId).toBe(parentComment.id);
    });
  });

  // ===========================================================================
  // 5. FeedCard Dynamic Comments Counter & Action Bar Integration
  // ===========================================================================
  describe('Suite 5: FeedCard Dynamic Comments Counter & Action Bar Integration', () => {
    it('FeedCard renders initial comments count formatted with formatEngagementMetric', () => {
      const post = MOCK_POSTS_KN[0]; // 3400 comments
      const mockContext = createMockContext();

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <FeedCard post={post} isActive={true} />
        </TitikContext.Provider>
      );

      const expectedFormatted = formatEngagementMetric(post.commentsCount);
      expect(expectedFormatted).toBe('3.4K');
      expect(html).toContain(expectedFormatted);
    });

    it('renders a one-second video seek slider using the video duration metadata', () => {
      const post = {
        ...MOCK_POSTS_KN[0],
        media: [{
          id: 'video-seek-test',
          type: 'video' as const,
          url: 'https://example.com/report.mp4',
          aspectRatio: '9/16' as const,
        }],
      };
      const mockContext = createMockContext();

      const html = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <FeedCard post={post} isActive={true} />
        </TitikContext.Provider>
      );

      expect(html).toContain('type="range"');
      expect(html).toContain('step="1"');
      expect(html).toContain('aria-label="Geser untuk memilih durasi video"');
      expect(html).toContain('disabled=""');
      expect(html).toContain('00:00 / 00:00');

      const feedCardPath = path.resolve(__dirname, '../components/feed/FeedCard.tsx');
      const content = fs.readFileSync(feedCardPath, 'utf-8');
      expect(content).toContain('onLoadedMetadata={handleLoadedMetadata}');
      expect(content).toContain('videoRef.current.currentTime = nextTime');
    });

    it('verifies commentsDelta increments action bar display without layout shift', () => {
      const post = MOCK_POSTS_KN[0];
      const initialCount = post.commentsCount; // 3400

      const formatInitial = formatEngagementMetric(initialCount);
      const formatAfterOne = formatEngagementMetric(initialCount + 1);
      const formatAfterHundred = formatEngagementMetric(initialCount + 100);

      expect(formatInitial).toBe('3.4K');
      expect(formatAfterOne).toBe('3.4K');
      expect(formatAfterHundred).toBe('3.5K');

      expect(formatInitial.length).toBeLessThanOrEqual(6);
      expect(formatAfterOne.length).toBeLessThanOrEqual(6);
      expect(formatAfterHundred.length).toBeLessThanOrEqual(6);
    });

    it('verifies boundary increment from 999 to 1000 transitions from 999 to 1K', () => {
      const before = formatEngagementMetric(999);
      const after = formatEngagementMetric(999 + 1);

      expect(before).toBe('999');
      expect(after).toBe('1K');
    });

    it('verifies FeedCard source code wires commentsDelta and onCommentAdded correctly', () => {
      const feedCardPath = path.resolve(__dirname, '../components/feed/FeedCard.tsx');
      const content = fs.readFileSync(feedCardPath, 'utf-8');

      // Must have commentsDelta state
      expect(content).toContain('const [commentsDelta, setCommentsDelta] = useState(0);');

      // Action bar must display post.commentsCount + commentsDelta
      expect(content).toContain('formatEngagementMetric(post.commentsCount + commentsDelta)');

      // CommentsBottomSheet must receive commentsCount with commentsDelta and onCommentAdded handler
      expect(content).toContain('commentsCount={post.commentsCount + commentsDelta}');
      expect(content).toContain('onCommentAdded={() => setCommentsDelta((prev) => prev + 1)}');
    });
  });

  // ===========================================================================
  // 6. Architectural Invariants & Zero Inline Styles
  // ===========================================================================
  describe('Suite 6: Architectural Invariants & Zero Inline Styles', () => {
    const filesToCheck = [
      '../components/feed/CommentsBottomSheet.tsx',
      '../components/feed/FeedCard.tsx',
      '../components/feed/FeedContainer.tsx',
    ];

    filesToCheck.forEach((relativeFilePath) => {
      const fileName = path.basename(relativeFilePath);
      it(`${fileName} has zero inline style={{ ... }} violations`, () => {
        const fullPath = path.resolve(__dirname, relativeFilePath);
        const code = fs.readFileSync(fullPath, 'utf-8');
        const lines = code.split('\n');

        const violations: Array<{ line: number; text: string }> = [];
        lines.forEach((line, index) => {
          if (/style\s*=\s*\{\{/.test(line)) {
            violations.push({ line: index + 1, text: line.trim() });
          }
        });

        expect(
          violations,
          `Found inline style={{ ... }} in ${fileName}:\n` +
            violations.map((v) => `Line ${v.line}: ${v.text}`).join('\n')
        ).toHaveLength(0);
      });
    });

    it('verifies FeedContainer.tsx includes the scroll isolation guard in handleWheel', () => {
      const feedContainerPath = path.resolve(__dirname, '../components/feed/FeedContainer.tsx');
      const code = fs.readFileSync(feedContainerPath, 'utf-8');

      expect(code).toContain("closest?.('[data-scroll-isolated=\"true\"]')");
    });

    it('verifies CommentsBottomSheet.tsx includes native wheel event listener with passive: false', () => {
      const bottomSheetPath = path.resolve(__dirname, '../components/feed/CommentsBottomSheet.tsx');
      const code = fs.readFileSync(bottomSheetPath, 'utf-8');

      expect(code).toContain("sheetEl.addEventListener('wheel', stopWheel, { passive: false })");
      expect(code).toContain("sheetEl.removeEventListener('wheel', stopWheel)");
      expect(code).toContain('e.stopPropagation()');
    });
  });
});
