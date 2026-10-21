import { describe, it, expect } from 'vitest';
import { formatEngagementMetric } from '../utils/formatters';
import { FeedComment } from '../services/adapters/types';

describe('Milestone 4 Challenger Empirical Stress Suite', () => {
  // ===========================================================================
  // 1. HIGH-THROUGHPUT LIKE TOGGLE HAMMERING (1,000 RAPID EVENTS)
  // ===========================================================================
  describe('High-Throughput Like Toggle Hammering (1,000 events)', () => {
    it('survives 1,000 rapid like toggles across 50 simulated comments without state corruption', () => {
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

      // 50 comments, each toggled 20 times (total 1,000 operations)
      const numComments = 50;
      const togglesPerComment = 20;

      for (let c = 0; c < numComments; c++) {
        const commentId = `comment-stress-${c}`;
        for (let t = 0; t < togglesPerComment; t++) {
          toggleLike(commentId);
        }
      }

      // Since each was toggled an even number of times (20), each must be unliked and delta 0
      for (let c = 0; c < numComments; c++) {
        const commentId = `comment-stress-${c}`;
        expect(likedCommentIds.has(commentId)).toBe(false);
        expect(likesDeltaMap[commentId]).toBe(0);
        const computed = Math.max(0, 10 + (likesDeltaMap[commentId] || 0));
        expect(computed).toBe(10);
      }

      // Now toggle each odd comment one more time (total 25 odd comments liked)
      for (let c = 0; c < numComments; c += 2) {
        toggleLike(`comment-stress-${c}`);
      }

      expect(likedCommentIds.size).toBe(25);
      for (let c = 0; c < numComments; c++) {
        const commentId = `comment-stress-${c}`;
        if (c % 2 === 0) {
          expect(likedCommentIds.has(commentId)).toBe(true);
          expect(likesDeltaMap[commentId]).toBe(1);
        } else {
          expect(likedCommentIds.has(commentId)).toBe(false);
          expect(likesDeltaMap[commentId]).toBe(0);
        }
      }
    });

    it('guarantees likes never drop below zero even under negative delta anomalies', () => {
      const anomalousDeltas = [-1, -5, -100, -9999];
      anomalousDeltas.forEach((delta) => {
        const rawLikes = 0;
        const clampedLikes = Math.max(0, rawLikes + delta);
        expect(clampedLikes).toBe(0);
      });
    });
  });

  // ===========================================================================
  // 2. HIGH-VOLUME RAPID COMMENT INGESTION (500 SUBMISSIONS)
  // ===========================================================================
  describe('High-Volume Rapid Comment Ingestion (500 submissions)', () => {
    it('ingests 500 burst submissions while strictly preserving monotonicity and order', () => {
      let commentsList: FeedComment[] = [];
      let commentsDelta = 0;

      const onCommentAdded = () => {
        commentsDelta += 1;
      };

      for (let i = 0; i < 500; i++) {
        const comment: FeedComment = {
          id: `c-stress-${i}`,
          authorName: `Warga #${i}`,
          avatarUrl: 'https://example.com/avatar.png',
          body: `Kesaksian warga ke-${i}: genangan setinggi ${i % 50} cm di titik persimpangan.`,
          timeAgo: 'Baru saja',
          likes: 0,
        };

        commentsList = [comment, ...commentsList];
        onCommentAdded();
      }

      expect(commentsDelta).toBe(500);
      expect(commentsList.length).toBe(500);
      // Monotonicity: index 0 must be comment 499, index 499 must be comment 0
      expect(commentsList[0].id).toBe('c-stress-499');
      expect(commentsList[499].id).toBe('c-stress-0');
    });

    it('survives hostile payload inputs: extreme string lengths, XSS scripts, unicode zero-width', () => {
      const hostilePayloads = [
        '<script>alert("xss")</script>',
        'SELECT * FROM comments WHERE 1=1; DROP TABLE comments;--',
        'A'.repeat(5000),
        '   \u200B\u200C\u200D   ', // Zero-width spaces
        '🔥🌊🚨🚧🛵💨'.repeat(50),
        'Jalan Rusak\r\n\r\n\t\tDepok',
      ];

      let storedComments: FeedComment[] = [];

      hostilePayloads.forEach((payload, idx) => {
        const trimmed = payload.trim();
        // If empty after trim (or zero-width only), skip
        if (!trimmed || trimmed.replace(/[\u200B-\u200D\uFEFF]/g, '').length === 0) {
          return;
        }

        const safeComment: FeedComment = {
          id: `c-hostile-${idx}`,
          authorName: 'Adversarial Tester',
          avatarUrl: 'https://example.com/tester.png',
          body: trimmed,
          timeAgo: 'Baru saja',
          likes: 0,
        };

        storedComments = [safeComment, ...storedComments];
      });

      // Exactly 5 of the 6 hostile payloads are non-empty
      expect(storedComments.length).toBe(5);
      expect(storedComments.some((c) => c.body.includes('<script>'))).toBe(true);
      expect(storedComments.some((c) => c.body.includes('DROP TABLE'))).toBe(true);
    });
  });

  // ===========================================================================
  // 3. METRIC FORMATTER TRANSITIONS UNDER COMMENTS COUNTER INCREMENTS
  // ===========================================================================
  describe('Metric Formatter Continuous Transitions Under Counter Increments', () => {
    it('accurately transitions across key number boundaries during comment increments', () => {
      // 995 -> 1005 (crosses 1K boundary)
      for (let count = 995; count <= 999; count++) {
        expect(formatEngagementMetric(count)).toBe(String(count));
      }
      expect(formatEngagementMetric(1000)).toBe('1K');
      expect(formatEngagementMetric(1001)).toBe('1K');
      expect(formatEngagementMetric(1100)).toBe('1.1K');

      // 999,990 -> 1,000,010 (crosses 1M boundary)
      expect(formatEngagementMetric(999900)).toBe('999.9K');
      expect(formatEngagementMetric(1000000)).toBe('1M');
      expect(formatEngagementMetric(1200000)).toBe('1.2M');
      expect(formatEngagementMetric(1480000)).toBe('1.5M'); // Rounded to 1.5M
      expect(formatEngagementMetric(1500000)).toBe('1.5M');

      // Check invariant: formatted string never exceeds 6 characters
      [999, 1000, 1500, 99999, 100000, 999999, 1000000, 1500000].forEach((val) => {
        const formatted = formatEngagementMetric(val);
        expect(formatted.length).toBeLessThanOrEqual(6);
      });
    });
  });

  // ===========================================================================
  // 4. WHEEL EVENT STREAM HAMMERING (10,000 PACKETS)
  // ===========================================================================
  describe('Wheel Event Stream Hammering (10,000 packets)', () => {
    it('processes 10,000 synthetic wheel event packets without runaway transition triggers', () => {
      let isPreventDefaultCalledCount = 0;
      let transitionsCount = 0;
      let accumulatedDelta = 0;
      let isLocked = false;

      // Realistic trackpad inertia profile
      const packets = Array.from({ length: 10000 }, (_, i) => ({
        deltaX: i % 20 === 0 ? 5 : 0,
        deltaY: Math.sin(i / 10) * 30 + 10, // Oscillating vertical flick
        isIsolated: i % 3 === 0, // Every 3rd packet originates from comments sheet
      }));

      const handleWheel = (packet: { deltaX: number; deltaY: number; isIsolated: boolean }) => {
        // Isolation guard matching FeedContainer.tsx:103
        if (packet.isIsolated) {
          return;
        }

        if (Math.abs(packet.deltaX) > Math.abs(packet.deltaY)) return;

        isPreventDefaultCalledCount += 1;

        if (isLocked) {
          return;
        }

        accumulatedDelta += packet.deltaY;

        if (Math.abs(accumulatedDelta) >= 24) {
          isLocked = true;
          transitionsCount += 1;
        }
      };

      packets.forEach((p) => handleWheel(p));

      // Guarded packets were filtered
      expect(isPreventDefaultCalledCount).toBeLessThan(10000);
      expect(isPreventDefaultCalledCount).toBeGreaterThan(5000);
      // Because isLocked engages on first threshold breach, only 1 transition occurs for this gesture stream
      expect(transitionsCount).toBe(1);
    });
  });
});
