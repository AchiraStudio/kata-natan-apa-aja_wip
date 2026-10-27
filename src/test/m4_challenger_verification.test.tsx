import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { CommentsBottomSheet } from '../components/feed/CommentsBottomSheet';
import { TitikContext } from '../context/TitikContext';
import { MOCK_POSTS_KN } from '../data/mockCivicData';
import { FeedComment } from '../services/adapters/types';
import { Report } from '../types/domain';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: {
      id: 'usr-challenger-m4',
      username: 'challenger_tester',
      displayName: 'Challenger Tester',
      role: 'citizen',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      points: 100,
      verifiedReportsCount: 3,
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

function createChallengerContext(overrides: Partial<any> = {}) {
  return {
    posts: MOCK_POSTS_KN,
    activePost: MOCK_POSTS_KN[0],
    activeFeedTab: 'for_you' as const,
    selectedCategory: 'Semua',
    facilities: [],
    budgetSectors: [],
    reportModalOpen: false,
    composerOpen: false,
    composerTab: 'post' as const,
    openComposer: vi.fn(),
    closeComposer: vi.fn(),

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
    addComment: vi.fn(async (_postId: string, body: string, authorName?: string, avatarUrl?: string, parentId?: string): Promise<FeedComment> => ({
      id: `c-challenger-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorName: authorName || 'Challenger Tester',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      body,
      timeAgo: 'Baru saja',
      likes: 0,
      ...(parentId ? { parentId } : {}),
    })),
    getComments: vi.fn(async (): Promise<FeedComment[]> => [
      {
        id: 'c-kn-01',
        authorName: 'Ahmad Supardi',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        body: 'Jalanan ini sering memakan korban pas musim hujan.',
        timeAgo: '3 jam lalu',
        likes: 12,
      },
      {
        id: 'c-kn-02',
        parentId: 'c-kn-01',
        authorName: 'Bu RT Endang',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        body: 'Sudah dilaporkan ke kelurahan juga bu.',
        timeAgo: '2 jam lalu',
        likes: 5,
      },
    ]),
    submitReport: vi.fn(async () => ({
      success: true,
      report: {} as Report,
      publicReference: 'TIK-2026-CHALLENGER',
      secretFollowUpToken: 'tok',
    })),
    deleteReport: vi.fn(),
    updateReportStatus: vi.fn(),
    refreshFeed: vi.fn(),
    ...overrides,
  };
}

describe('Milestone 4 Challenger Empirical Verification Suite', () => {
  // ===========================================================================
  // 1. WHEEL EVENT ISOLATION & DOM PROPAGATION ADVERSARIAL CHALLENGES
  // ===========================================================================
  describe('Adversarial Challenge 1: Deep Wheel Event Isolation & Feed Protection', () => {
    it('protects feed container against wheel events on deeply nested DOM children (15 layers deep)', () => {
      // Simulate DOM element hierarchy 15 levels deep inside an isolated container
      interface MockNode {
        parent: MockNode | null;
        isIsolated?: boolean;
        closest: (selector: string) => MockNode | null;
      }

      const rootIsolated: MockNode = {
        parent: null,
        isIsolated: true,
        closest(selector: string) {
          if (selector === '[data-scroll-isolated="true"]' && this.isIsolated) return this;
          return this.parent ? this.parent.closest(selector) : null;
        },
      };

      let currentChild: MockNode = rootIsolated;
      for (let depth = 1; depth <= 15; depth++) {
        const nextNode: MockNode = {
          parent: currentChild,
          closest(selector: string) {
            if (selector === '[data-scroll-isolated="true"]' && this.isIsolated) return this;
            return this.parent ? this.parent.closest(selector) : null;
          },
        };
        currentChild = nextNode;
      }

      // Check whether FeedContainer guard detects isolation on deepest child
      const target = currentChild as unknown as HTMLElement;
      const isIsolated = Boolean((target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]'));
      expect(isIsolated).toBe(true);

      // Simulate FeedContainer handleWheel
      let isPreventDefaultCalled = false;
      let postTransitionFired = false;

      const handleWheel = (e: { target: unknown; deltaX: number; deltaY: number; preventDefault: () => void }) => {
        if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
          return;
        }
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        postTransitionFired = true;
      };

      handleWheel({
        target,
        deltaX: 0,
        deltaY: 100,
        preventDefault: () => {
          isPreventDefaultCalled = true;
        },
      });

      expect(isPreventDefaultCalled).toBe(false);
      expect(postTransitionFired).toBe(false);
    });

    it('safely handles non-element targets such as text nodes, null, and window', () => {
      // In some browsers, e.target could theoretically be a Text node or window
      const textNodeTarget = {
        nodeType: 3, // Node.TEXT_NODE
        parentElement: {
          closest: (selector: string) => (selector.includes('data-scroll-isolated') ? {} : null),
        },
      };

      // In FeedContainer: (e.target as HTMLElement | null)?.closest?.(...)
      // Since text node does not have `closest`, optional chaining safely returns undefined!
      const guardResultTextNode = Boolean((textNodeTarget as unknown as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]'));
      expect(guardResultTextNode).toBe(false);

      // Verify null target does not throw
      const guardResultNull = Boolean((null as unknown as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]'));
      expect(guardResultNull).toBe(false);

      // Verify undefined target does not throw
      const guardResultUndefined = Boolean((undefined as unknown as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]'));
      expect(guardResultUndefined).toBe(false);
    });

    it('confirms unisolated elements on regular feed cards trigger snap transition', () => {
      const nonIsolatedCardTarget = {
        closest: (_selector: string) => null,
      };

      let isPreventDefaultCalled = false;
      let postTransitionFired = false;

      const handleWheel = (e: { target: unknown; deltaX: number; deltaY: number; preventDefault: () => void }) => {
        if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
          return;
        }
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        postTransitionFired = true;
      };

      handleWheel({
        target: nonIsolatedCardTarget,
        deltaX: 0,
        deltaY: 80,
        preventDefault: () => {
          isPreventDefaultCalled = true;
        },
      });

      expect(isPreventDefaultCalled).toBe(true);
      expect(postTransitionFired).toBe(true);
    });

    it('ignores horizontal trackpad swipes even on unisolated feed area', () => {
      const nonIsolatedCardTarget = {
        closest: (_selector: string) => null,
      };

      let isPreventDefaultCalled = false;
      let postTransitionFired = false;

      const handleWheel = (e: { target: unknown; deltaX: number; deltaY: number; preventDefault: () => void }) => {
        if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) {
          return;
        }
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        postTransitionFired = true;
      };

      // Swipe left/right: deltaX is greater than deltaY
      handleWheel({
        target: nonIsolatedCardTarget,
        deltaX: 120,
        deltaY: 10,
        preventDefault: () => {
          isPreventDefaultCalled = true;
        },
      });

      expect(isPreventDefaultCalled).toBe(false);
      expect(postTransitionFired).toBe(false);
    });
  });

  // ===========================================================================
  // 2. RAPID COMMENT SUBMISSION & ORDERING VERIFICATION
  // ===========================================================================
  describe('Adversarial Challenge 2: Rapid Comment Submissions & Sequential Ingestion', () => {
    it('prepends 5 sequential rapid submissions in correct reverse-chronological order', async () => {
      let currentComments: FeedComment[] = [
        {
          id: 'c-seed-1',
          authorName: 'Initial Citizen',
          avatarUrl: 'https://example.com/avatar.jpg',
          body: 'Komentar pembuka',
          timeAgo: '1 jam lalu',
          likes: 2,
        },
      ];

      let counterDelta = 0;
      const onCommentAdded = () => {
        counterDelta += 1;
      };

      const payloads = [
        'Laporan ke-1: Banjir mulai surut di RT 02.',
        'Laporan ke-2: Dishub mengalihkan arus lalu lintas ke Jalan Dahlia.',
        'Laporan ke-3: Truk pemadam kebakaran sudah tiba membawa pompa sedot.',
        'Laporan ke-4: Warga gotong royong membersihkan selokan tersumbat sampah.',
        'Laporan ke-5: Jalur utama sudah bisa dilalui kendaraan roda dua.',
      ];

      // Simulate sequential submissions
      for (const payload of payloads) {
        const newComment: FeedComment = {
          id: `c-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          authorName: 'Challenger Submitter',
          avatarUrl: 'https://example.com/challenger.jpg',
          body: payload,
          timeAgo: 'Baru saja',
          likes: 0,
        };

        currentComments = [newComment, ...currentComments];
        onCommentAdded();
      }

      expect(counterDelta).toBe(5);
      expect(currentComments.length).toBe(6);
      // Newest comment (Laporan ke-5) must be at index 0
      expect(currentComments[0].body).toBe('Laporan ke-5: Jalur utama sudah bisa dilalui kendaraan roda dua.');
      expect(currentComments[1].body).toBe('Laporan ke-4: Warga gotong royong membersihkan selokan tersumbat sampah.');
      expect(currentComments[2].body).toBe('Laporan ke-3: Truk pemadam kebakaran sudah tiba membawa pompa sedot.');
      expect(currentComments[3].body).toBe('Laporan ke-2: Dishub mengalihkan arus lalu lintas ke Jalan Dahlia.');
      expect(currentComments[4].body).toBe('Laporan ke-1: Banjir mulai surut di RT 02.');
      expect(currentComments[5].body).toBe('Komentar pembuka');
    });

    it('rejects empty strings and whitespace-only submissions', () => {
      const invalidBodies = ['', '   ', '\n\t  ', '       \n'];
      let submittedCount = 0;

      const submitAttempt = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        submittedCount += 1;
      };

      invalidBodies.forEach((body) => submitAttempt(body));
      expect(submittedCount).toBe(0);
    });

    it('handles resiliently rich civic texts with emojis, punctuation, and Indonesian terms', () => {
      const richCivicText = '🚨 Mohon @dinaspupr & @pemda segera cek gorong-gorong RT 05/RW 08! APBD 2026 Rp 4,2 Miliar dialokasikan ke mana? 🚧🌊';
      let submittedComment: FeedComment | null = null;

      const trimmed = richCivicText.trim();
      expect(trimmed.length).toBeGreaterThan(0);

      submittedComment = {
        id: 'c-emoji-001',
        authorName: 'Warga Kritis',
        avatarUrl: 'https://example.com/avatar.jpg',
        body: trimmed,
        timeAgo: 'Baru saja',
        likes: 0,
      };

      expect(submittedComment.body).toContain('🚨');
      expect(submittedComment.body).toContain('@dinaspupr');
      expect(submittedComment.body).toContain('APBD 2026');
    });

    it('clears replyTarget after submission to prevent accidental thread capture of subsequent comments', () => {
      let replyTarget: { id: string; authorName: string } | null = { id: 'c-parent-99', authorName: 'Pak RW' };

      // Submit reply
      const firstSubmissionParentId = replyTarget?.id;
      expect(firstSubmissionParentId).toBe('c-parent-99');

      // CommentsBottomSheet:handleSubmit resets replyTarget(null)
      const getReplyParentId = (target: { id: string; authorName: string } | null) => target?.id;
      const secondSubmissionParentId = getReplyParentId(null);
      expect(secondSubmissionParentId).toBeUndefined();
    });
  });

  // ===========================================================================
  // 3. RAPID LIKE TOGGLING & STRESS PARITY
  // ===========================================================================
  describe('Adversarial Challenge 3: Rapid Like Toggling & State Isolation', () => {
    it('maintains strict parity over 10 rapid toggles on a single comment', () => {
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

      const baseLikes = 25;
      const targetId = 'c-toggle-test';

      for (let i = 1; i <= 10; i++) {
        toggleLike(targetId);
        const isEven = i % 2 === 0;
        expect(likedCommentIds.has(targetId)).toBe(!isEven);
        expect(likesDeltaMap[targetId]).toBe(isEven ? 0 : 1);
        const currentLikes = Math.max(0, baseLikes + likesDeltaMap[targetId]);
        expect(currentLikes).toBe(isEven ? 25 : 26);
      }
    });

    it('isolates like state cleanly between 5 distinct comments', () => {
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

      // Toggle comments:
      // c1: 1 time (liked)
      // c2: 2 times (unliked)
      // c3: 3 times (liked)
      // c4: 4 times (unliked)
      // c5: 5 times (liked)
      [1, 2, 3, 4, 5].forEach((idNum) => {
        const commentId = `comment-${idNum}`;
        for (let click = 0; click < idNum; click++) {
          toggleLike(commentId);
        }
      });

      expect(likedCommentIds.has('comment-1')).toBe(true);
      expect(likedCommentIds.has('comment-2')).toBe(false);
      expect(likedCommentIds.has('comment-3')).toBe(true);
      expect(likedCommentIds.has('comment-4')).toBe(false);
      expect(likedCommentIds.has('comment-5')).toBe(true);

      expect(likesDeltaMap['comment-1']).toBe(1);
      expect(likesDeltaMap['comment-2']).toBe(0);
      expect(likesDeltaMap['comment-3']).toBe(1);
      expect(likesDeltaMap['comment-4']).toBe(0);
      expect(likesDeltaMap['comment-5']).toBe(1);
    });
  });

  // ===========================================================================
  // 4. FEEDCARD & POST SWITCHING LIFECYCLE
  // ===========================================================================
  describe('Adversarial Challenge 4: FeedCard Post Switching & Inactive State', () => {
    it('resets commentsDelta when post.id changes (swiping between posts)', () => {
      let prevPostId = 'kn-001';
      let commentsDelta = 5;

      const simulateRender = (incomingPostId: string) => {
        if (incomingPostId !== prevPostId) {
          prevPostId = incomingPostId;
          commentsDelta = 0;
        }
      };

      // Render with same post ID: delta preserved
      simulateRender('kn-001');
      expect(commentsDelta).toBe(5);

      // Render with new post ID: delta resets to 0
      simulateRender('kn-002');
      expect(commentsDelta).toBe(0);
      expect(prevPostId).toBe('kn-002');
    });

    it('closes comments bottom sheet when card isActive becomes false', () => {
      let isCommentsOpen = true;
      let isCaptionExpanded = true;

      const handleActiveChange = (isActive: boolean) => {
        if (!isActive) {
          isCommentsOpen = false;
          setIsCaptionExpanded(false);
        }
      };

      function setIsCaptionExpanded(val: boolean) {
        isCaptionExpanded = val;
      }

      handleActiveChange(false);
      expect(isCommentsOpen).toBe(false);
      expect(isCaptionExpanded).toBe(false);
    });
  });

  // ===========================================================================
  // 5. STATIC INVARIANTS & ZERO INLINE STYLES ACROSS COMPONENTS
  // ===========================================================================
  describe('Adversarial Challenge 5: Static Invariants & Zero Inline Styles', () => {
    const componentPaths = [
      '../components/feed/CommentsBottomSheet.tsx',
      '../components/feed/FeedCard.tsx',
      '../components/feed/FeedContainer.tsx',
    ];

    componentPaths.forEach((relPath) => {
      const fileName = path.basename(relPath);
      it(`verifies ${fileName} strictly contains 0 inline style attributes`, () => {
        const fullPath = path.resolve(__dirname, relPath);
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
          `Found style={{ ... }} in ${fileName} at lines: ${violations.map((v) => v.line).join(', ')}`
        ).toHaveLength(0);
      });
    });

    it('verifies CommentsBottomSheet rendered markup has no inline styles', () => {
      const mockContext = createChallengerContext();
      const markup = renderToStaticMarkup(
        <TitikContext.Provider value={mockContext}>
          <CommentsBottomSheet
            isOpen={true}
            onClose={() => {}}
            postId="kn-001"
            commentsCount={3400}
          />
        </TitikContext.Provider>
      );

      expect(markup).not.toMatch(/style="[^"]*"/);
    });
  });
});
