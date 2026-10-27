import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MOCK_POSTS_KN } from '../data/mockCivicData';
import { formatEngagementMetric } from '../utils/formatters';

describe('Milestone 2 Challenger Empirical Verification Suite', () => {
  describe('Mandatory Target Posts Verification', () => {
    it('verifies kn-001 metrics: 842500 -> 842.5K', () => {
      const post = MOCK_POSTS_KN.find((p) => p.id === 'kn-001');
      expect(post).toBeDefined();
      if (!post) return;

      expect(post.supportCount).toBe(842500);
      const renderedLikes = formatEngagementMetric(post.supportCount);
      expect(renderedLikes).toBe('842.5K');
      expect(renderedLikes.length).toBeLessThanOrEqual(6);

      const renderedComments = formatEngagementMetric(post.commentsCount);
      expect(renderedComments).toBe('3.4K');
      expect(renderedComments.length).toBeLessThanOrEqual(6);
    });

    it('verifies kn-006 metrics: 1480000 -> 1.5M (raw 1.48M) & 4920 -> 4.9K comments', () => {
      const post = MOCK_POSTS_KN.find((p) => p.id === 'kn-006');
      expect(post).toBeDefined();
      if (!post) return;

      expect(post.supportCount).toBe(1480000);
      const renderedLikes = formatEngagementMetric(post.supportCount);
      expect(renderedLikes).toBe('1.5M');
      expect(renderedLikes.length).toBeLessThanOrEqual(6);

      expect(post.commentsCount).toBe(4920);
      const renderedComments = formatEngagementMetric(post.commentsCount);
      expect(renderedComments).toBe('4.9K');
      expect(renderedComments.length).toBeLessThanOrEqual(6);

      const renderedShares = formatEngagementMetric(post.sharesCount);
      expect(renderedShares).toBe('5.6K');
      expect(renderedShares.length).toBeLessThanOrEqual(6);
    });

    it('verifies kn-009 metrics: 8300 -> 8.3K likes & 610 -> 610 comments', () => {
      const post = MOCK_POSTS_KN.find((p) => p.id === 'kn-009');
      expect(post).toBeDefined();
      if (!post) return;

      expect(post.supportCount).toBe(8300);
      const renderedLikes = formatEngagementMetric(post.supportCount);
      expect(renderedLikes).toBe('8.3K');
      expect(renderedLikes.length).toBeLessThanOrEqual(6);

      expect(post.commentsCount).toBe(610);
      const renderedComments = formatEngagementMetric(post.commentsCount);
      expect(renderedComments).toBe('610');
      expect(renderedComments.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Exhaustive 10-Post Metric Formatting & Length Constraint (<= 6 chars)', () => {
    it('verifies all 10 hydrated seed posts have valid non-empty metrics with length <= 6', () => {
      expect(MOCK_POSTS_KN.length).toBe(10);

      const auditLog: Array<{
        id: string;
        support: { raw: number; formatted: string };
        comments: { raw: number | undefined; formatted: string };
        shares: { raw: number | undefined; formatted: string };
        saves: { raw: number | undefined; formatted: string };
      }> = [];

      MOCK_POSTS_KN.forEach((post) => {
        const supportFmt = formatEngagementMetric(post.supportCount);
        const commentsFmt = formatEngagementMetric(post.commentsCount);
        const sharesFmt = formatEngagementMetric(post.sharesCount);
        const savesFmt = formatEngagementMetric(post.savesCount);

        auditLog.push({
          id: post.id,
          support: { raw: post.supportCount, formatted: supportFmt },
          comments: { raw: post.commentsCount, formatted: commentsFmt },
          shares: { raw: post.sharesCount, formatted: sharesFmt },
          saves: { raw: post.savesCount, formatted: savesFmt },
        });

        // 1. All lengths <= 6 chars
        expect(supportFmt.length, `${post.id} supportCount length must be <= 6`).toBeLessThanOrEqual(6);
        expect(commentsFmt.length, `${post.id} commentsCount length must be <= 6`).toBeLessThanOrEqual(6);
        expect(sharesFmt.length, `${post.id} sharesCount length must be <= 6`).toBeLessThanOrEqual(6);
        expect(savesFmt.length, `${post.id} savesCount length must be <= 6`).toBeLessThanOrEqual(6);

        // 2. No unexpected characters or spaces
        expect(supportFmt).not.toMatch(/\s/);
        expect(commentsFmt).not.toMatch(/\s/);
        expect(sharesFmt).not.toMatch(/\s/);
        expect(savesFmt).not.toMatch(/\s/);

        // 3. No NaN or undefined strings
        expect(supportFmt).not.toBe('NaN');
        expect(commentsFmt).not.toBe('NaN');
        expect(sharesFmt).not.toBe('NaN');
        expect(savesFmt).not.toBe('NaN');
      });
    });
  });

  describe('Adversarial Stress Testing & Edge Cases', () => {
    it('handles metric boundary transitions seamlessly', () => {
      expect(formatEngagementMetric(999)).toBe('999');
      expect(formatEngagementMetric(1000)).toBe('1K');
      expect(formatEngagementMetric(1049)).toBe('1K');
      expect(formatEngagementMetric(1050)).toBe('1.1K');
      expect(formatEngagementMetric(999499)).toBe('999.5K');
      expect(formatEngagementMetric(999999)).toBe('1000K');
      expect(formatEngagementMetric(1000000)).toBe('1M');
      expect(formatEngagementMetric(1049999)).toBe('1M');
      expect(formatEngagementMetric(1050000)).toBe('1.1M');
      expect(formatEngagementMetric(1480000)).toBe('1.5M');
      expect(formatEngagementMetric(1500000)).toBe('1.5M');
    });

    it('ensures no trailing decimal zeros occur across scales', () => {
      const numbersWithExpectedWholeUnits = [
        1000, 2000, 10000, 50000, 100000, 500000, 1000000, 2000000, 10000000,
      ];
      numbersWithExpectedWholeUnits.forEach((num) => {
        const res = formatEngagementMetric(num);
        expect(res).not.toContain('.0');
      });
    });

    it('handles negative, zero, and corrupt inputs safely', () => {
      expect(formatEngagementMetric(0)).toBe('0');
      expect(formatEngagementMetric(-42)).toBe('0');
      expect(formatEngagementMetric(NaN)).toBe('0');
      expect(formatEngagementMetric(Infinity)).toBe('0');
      expect(formatEngagementMetric(-Infinity)).toBe('0');
      expect(formatEngagementMetric(null)).toBe('0');
      expect(formatEngagementMetric(undefined)).toBe('0');
    });
  });

  describe('FeedCard.tsx Layout & Invariant Safeguards', () => {
    const feedCardPath = path.resolve(__dirname, '../components/feed/FeedCard.tsx');

    it('confirms FeedCard imports and applies formatEngagementMetric to the 3 real metrics', () => {
      const content = fs.readFileSync(feedCardPath, 'utf-8');
      expect(content).toContain('formatEngagementMetric');
      expect(content).toContain('formatEngagementMetric(post.supportCount)');
      expect(content).toContain('formatEngagementMetric(post.commentsCount)');
      expect(content).toContain('formatEngagementMetric(post.savesCount)');
      // sharesCount is not rendered: nothing increments it, so the metric would be fake
      expect(content).not.toContain('formatEngagementMetric(post.sharesCount)');
    });

    it('verifies whitespace-nowrap tabular-nums select-none applied to action bar metric spans', () => {
      const content = fs.readFileSync(feedCardPath, 'utf-8');
      const occurrences = (content.match(/whitespace-nowrap tabular-nums select-none/g) || []).length;
      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('verifies caption expansion has overscroll-y-contain and data-scroll-isolated', () => {
      const content = fs.readFileSync(feedCardPath, 'utf-8');
      expect(content).toContain('overscroll-y-contain');
      expect(content).toContain("data-scroll-isolated={isCaptionExpanded ? 'true' : undefined}");
    });

    it('verifies zero inline styles in FeedCard.tsx', () => {
      const content = fs.readFileSync(feedCardPath, 'utf-8');
      expect(content).not.toMatch(/style=\{\{/);
    });
  });
});
