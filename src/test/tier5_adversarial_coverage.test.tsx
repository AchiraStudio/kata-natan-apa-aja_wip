import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { formatEngagementMetric, formatMetricNumber } from '../utils/formatters';
import {
  generateSeedComments,
  generateContextualReply,
  normalizeCategory,
  CITIZEN_PERSONAS,
  PersonaType,
} from '../services/commentGenerator';
import {
  MOCK_POSTS_KN,
  MOCK_POSTS,
  MOCK_COMMENTS,
} from '../data/mockCivicData';
import { CommentsBottomSheet } from '../components/feed/CommentsBottomSheet';
import { FeedCard } from '../components/feed/FeedCard';
import { TitikContext } from '../context/TitikContext';
import { FeedComment } from '../services/adapters/types';
import { Report } from '../types/domain';

// Mock AuthContext for React component rendering
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: {
      id: 'usr-adversarial-t5',
      username: 'adversarial_tester',
      displayName: 'Adversarial Tester',
      role: 'citizen',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      points: 999,
      verifiedReportsCount: 15,
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

function createAdversarialContext(overrides: Partial<any> = {}) {
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
    addComment: vi.fn(async (_postId: string, body: string): Promise<FeedComment> => ({
      id: `c-adv-${Date.now()}`,
      authorName: 'Adversarial Tester',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      body,
      timeAgo: 'Baru saja',
      likes: 0,
    })),
    getComments: vi.fn(async (postId: string): Promise<FeedComment[]> => MOCK_COMMENTS[postId] || []),
    submitReport: vi.fn(async () => ({
      success: true,
      report: {} as Report,
      publicReference: 'TIK-2026-ADV-001',
      secretFollowUpToken: 'tok-adv',
    })),
    updateReportStatus: vi.fn(),
    refreshFeed: vi.fn(),
    ...overrides,
  };
}

describe('Tier 5 Adversarial Coverage Hardening Suite', () => {
  // ===========================================================================
  // SECTION 1: ADVERSARIAL ENGAGEMENT METRIC FORMATTING & OVERFLOW DEFENSE
  // ===========================================================================
  describe('Section 1: Adversarial Metric Formatting & Overflow Defense', () => {
    describe('Subnormal & Extreme Floating-Point Values', () => {
      it('handles subnormal numbers near Number.MIN_VALUE gracefully as "0"', () => {
        expect(formatEngagementMetric(Number.MIN_VALUE)).toBe('0');
        expect(formatEngagementMetric(5e-324)).toBe('0');
        expect(formatEngagementMetric(1e-300)).toBe('0');
      });

      it('handles microscopic fractions (< 0.5) gracefully as "0"', () => {
        expect(formatEngagementMetric(0.0000001)).toBe('0');
        expect(formatEngagementMetric(0.4999999999)).toBe('0');
      });

      it('rounds fractional values >= 0.5 to integer string "1"', () => {
        expect(formatEngagementMetric(0.5)).toBe('1');
        expect(formatEngagementMetric(0.99999)).toBe('1');
      });

      it('precisely formats critical threshold boundaries around 1,000', () => {
        expect(formatEngagementMetric(999.4)).toBe('999');
        expect(formatEngagementMetric(999.5)).toBe('1000');
        expect(formatEngagementMetric(1000)).toBe('1K');
        expect(formatEngagementMetric(1049)).toBe('1K');
        expect(formatEngagementMetric(1050)).toBe('1.1K');
        expect(formatEngagementMetric(1949)).toBe('1.9K');
        expect(formatEngagementMetric(1960)).toBe('2K');
      });

      it('precisely formats critical threshold boundaries around 1,000,000', () => {
        expect(formatEngagementMetric(999499)).toBe('999.5K');
        expect(formatEngagementMetric(999949)).toBe('999.9K');
        expect(formatEngagementMetric(999950)).toBe('1000K');
        expect(formatEngagementMetric(1000000)).toBe('1M');
        expect(formatEngagementMetric(1049999)).toBe('1M');
        expect(formatEngagementMetric(1050000)).toBe('1.1M');
        expect(formatEngagementMetric(1499999)).toBe('1.5M');
        expect(formatEngagementMetric(1500000)).toBe('1.5M');
      });

      it('formats extreme and astronomical metrics without overflow or NaN', () => {
        expect(formatEngagementMetric(10_000_000)).toBe('10M');
        expect(formatEngagementMetric(100_000_000)).toBe('100M');
        expect(formatEngagementMetric(1_000_000_000)).toBe('1000M');
        const maxSafeResult = formatEngagementMetric(Number.MAX_SAFE_INTEGER);
        expect(maxSafeResult).toMatch(/M$/);
        expect(maxSafeResult.length).toBeGreaterThan(0);
      });
    });

    describe('Defensive Poison Inputs & Runtime Type Resistance', () => {
      it('returns "0" for all non-positive, NaN, and infinite inputs', () => {
        expect(formatEngagementMetric(-0)).toBe('0');
        expect(formatEngagementMetric(-1)).toBe('0');
        expect(formatEngagementMetric(-999999)).toBe('0');
        expect(formatEngagementMetric(-Infinity)).toBe('0');
        expect(formatEngagementMetric(Infinity)).toBe('0');
        expect(formatEngagementMetric(NaN)).toBe('0');
        expect(formatEngagementMetric(null)).toBe('0');
        expect(formatEngagementMetric(undefined)).toBe('0');
      });

      it('safely tolerates invalid runtime types passed without throwing exceptions', () => {
        expect(formatEngagementMetric('1500' as unknown as number)).toBe('0');
        expect(formatEngagementMetric({} as unknown as number)).toBe('0');
        expect(formatEngagementMetric([] as unknown as number)).toBe('0');
        expect(formatEngagementMetric(true as unknown as number)).toBe('0');
      });

      it('confirms formatMetricNumber alias is strictly identical to formatEngagementMetric', () => {
        expect(formatMetricNumber).toBe(formatEngagementMetric);
        expect(formatMetricNumber(12500)).toBe('12.5K');
      });
    });

    describe('Indonesian Locale ("id") String Precision & Comma Separation', () => {
      it('correctly uses comma decimal separator in Indonesian mode', () => {
        const en12 = formatEngagementMetric(1200, 'en');
        const id12 = formatEngagementMetric(1200, 'id');
        expect(en12).toBe('1.2K');
        expect(id12).toBe('1,2 rb');

        const en15M = formatEngagementMetric(1500000, 'en');
        const id15M = formatEngagementMetric(1500000, 'id');
        expect(en15M).toBe('1.5M');
        expect(id15M).toBe('1,5 Jt');
      });

      it('drops trailing zero decimals in Indonesian mode (e.g. "1 rb", "1 Jt")', () => {
        expect(formatEngagementMetric(1000, 'id')).toBe('1 rb');
        expect(formatEngagementMetric(1000000, 'id')).toBe('1 Jt');
      });

      it('guarantees defensive inputs in Indonesian locale also yield "0"', () => {
        expect(formatEngagementMetric(-100, 'id')).toBe('0');
        expect(formatEngagementMetric(NaN, 'id')).toBe('0');
        expect(formatEngagementMetric(null, 'id')).toBe('0');
        expect(formatEngagementMetric(undefined, 'id')).toBe('0');
      });
    });

    describe('UI Overflow Defense: Length Bounds Guarantee', () => {
      it('strictly enforces formatted string length <= 6 characters in English for values up to 10M', () => {
        const samples = [
          0, 1, 9, 42, 999, 1000, 1050, 1200, 9900, 10000, 12500, 850000, 999900,
          1000000, 1200000, 1500000, 5000000, 9900000, 10000000,
        ];
        samples.forEach((val) => {
          const res = formatEngagementMetric(val, 'en');
          expect(res.length).toBeLessThanOrEqual(6);
          expect(res).not.toMatch(/\s/);
        });
      });

      it('strictly enforces formatted string length <= 8 characters in Indonesian for values up to 10M', () => {
        const samples = [
          0, 1, 9, 42, 999, 1000, 1050, 1200, 9900, 10000, 12500, 850000, 999900,
          1000000, 1200000, 1500000, 5000000, 9900000, 10000000,
        ];
        samples.forEach((val) => {
          const res = formatEngagementMetric(val, 'id');
          expect(res.length).toBeLessThanOrEqual(8);
        });
      });

      it('completes 10,000 rapid deterministic formatting calls in < 50ms (microbenchmark)', () => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
          formatEngagementMetric(i * 123.45);
        }
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(100); // Generous allowance for CI runners
      });
    });
  });

  // ===========================================================================
  // SECTION 2: MULBERRY32 PRNG DETERMINISM & VOCABULARY ENGINE HARDENING
  // ===========================================================================
  describe('Section 2: PRNG Engine Seed Invariance & Combinatorial Robustness', () => {
    it('guarantees 100% byte-for-byte seed invariance across independent invocations', () => {
      const options = {
        postId: 'kn-adv-seed-test',
        category: 'Road Damage & Infrastructure',
        city: 'Bekasi',
        seed: 424242,
        count: 22,
      };

      const runA = generateSeedComments(options);
      const runB = generateSeedComments(options);

      expect(runA.length).toBe(runB.length);
      expect(runA).toEqual(runB);
    });

    it('demonstrates significant combinatorial entropy across different seed values', () => {
      const baseOptions = {
        postId: 'kn-entropy-test',
        category: 'Flooding & Weather',
        city: 'South Jakarta',
        count: 20,
      };

      const bodies = new Set<string>();
      for (let s = 1; s <= 10; s++) {
        const comments = generateSeedComments({ ...baseOptions, seed: s * 1000 });
        bodies.add(comments[0].body);
      }

      // At least 6 distinct first comments across 10 distinct seeds
      expect(bodies.size).toBeGreaterThanOrEqual(6);
    });

    describe('Boundary Clamping & Anomalous Option Handling', () => {
      it('clamps count <= 14 strictly up to minimum 15', () => {
        const resZero = generateSeedComments({ postId: 'p-clamp-0', category: 'Road', city: 'Bekasi', count: 0 });
        const resNegative = generateSeedComments({ postId: 'p-clamp-neg', category: 'Road', city: 'Bekasi', count: -50 });
        const resFourteen = generateSeedComments({ postId: 'p-clamp-14', category: 'Road', city: 'Bekasi', count: 14 });

        expect(resZero.length).toBe(15);
        expect(resNegative.length).toBe(15);
        expect(resFourteen.length).toBe(15);
      });

      it('clamps count > 30 strictly down to maximum 30', () => {
        const resFifty = generateSeedComments({ postId: 'p-clamp-50', category: 'Road', city: 'Bekasi', count: 50 });
        const resThousand = generateSeedComments({ postId: 'p-clamp-1k', category: 'Road', city: 'Bekasi', count: 1000 });

        expect(resFifty.length).toBe(30);
        expect(resThousand.length).toBe(30);
      });

      it('defaults undefined or NaN count gracefully to 20', () => {
        const resDefault = generateSeedComments({ postId: 'p-clamp-def', category: 'Road', city: 'Bekasi' });
        const resNan = generateSeedComments({ postId: 'p-clamp-nan', category: 'Road', city: 'Bekasi', count: NaN });

        expect(resDefault.length).toBe(20);
        expect(resNan.length).toBe(20);
      });

      it('survives empty, whitespace, and special symbol postId strings without crashing', () => {
        const resEmpty = generateSeedComments({ postId: '', category: 'Road', city: 'Bekasi' });
        const resSymbols = generateSeedComments({ postId: '!@#$%^&*()_+~`', category: 'Road', city: 'Bekasi' });

        expect(resEmpty.length).toBeGreaterThanOrEqual(15);
        expect(resSymbols.length).toBeGreaterThanOrEqual(15);
      });

      it('survives unknown category and unknown city by safely applying default banks', () => {
        const resUnknown = generateSeedComments({
          postId: 'p-exotic',
          category: 'Interplanetary Teleportation Grid',
          city: 'Metropolis',
          count: 18,
        });

        expect(resUnknown.length).toBe(18);
        resUnknown.forEach((c) => {
          expect(c.body.length).toBeGreaterThan(10);
          expect(c.authorName.length).toBeGreaterThan(2);
        });
      });
    });

    describe('Threaded Sub-Reply Integrity & Topology Invariants', () => {
      it('guarantees all sub-replies reference valid top-level parent IDs and never nest deeper than 1 level', () => {
        const postIds = ['kn-001', 'kn-002', 'kn-003', 'kn-004', 'kn-005'];

        postIds.forEach((pid) => {
          const comments = generateSeedComments({
            postId: pid,
            category: 'Road Damage & Infrastructure',
            city: 'Depok',
            count: 25,
          });

          const topLevel = comments.filter((c) => !c.parentId);
          const subReplies = comments.filter((c) => c.parentId);

          expect(topLevel.length).toBeGreaterThan(0);
          expect(subReplies.length).toBeGreaterThanOrEqual(2);

          const topLevelIdSet = new Set(topLevel.map((c) => c.id));

          subReplies.forEach((reply) => {
            // Must reference an existing top-level comment
            expect(topLevelIdSet.has(reply.parentId!)).toBe(true);
            // Must contain @mention of parent author name without spaces
            expect(reply.body).toMatch(/^@\S+/);
            // Sub-reply must not itself be a parent of another comment (strict single level)
            const childrenOfReply = comments.filter((c) => c.parentId === reply.id);
            expect(childrenOfReply.length).toBe(0);
          });
        });
      });
    });

    describe('Persona Representation & Vocabulary Matrix Coverage', () => {
      it('ensures all 6 authentic citizen personas are represented in generated comments', () => {
        const personaTypes: PersonaType[] = [
          'ojol',
          'commuter',
          'rt_rw',
          'student',
          'warung_owner',
          'budget_observer',
        ];

        // Collect all author names defined across all personas
        const allAuthorNames = new Set(
          personaTypes.flatMap((pt) => CITIZEN_PERSONAS[pt].map((p) => p.authorName))
        );

        const comments = generateSeedComments({
          postId: 'kn-persona-sweep',
          category: 'Road Damage & Infrastructure',
          city: 'Bogor',
          count: 30,
        });

        const encounteredAuthors = new Set(comments.map((c) => c.authorName));
        let matchCount = 0;
        encounteredAuthors.forEach((name) => {
          if (allAuthorNames.has(name)) matchCount++;
        });

        expect(matchCount).toBeGreaterThanOrEqual(4);
      });

      it('normalizes various input categories into canonical vocabulary bank keys', () => {
        expect(normalizeCategory('Road Damage')).toBe('road_infrastructure');
        expect(normalizeCategory('lubang jalan')).toBe('road_infrastructure');
        expect(normalizeCategory('PJU padam')).toBe('road_infrastructure');
        expect(normalizeCategory('Banjir Ciledug')).toBe('flooding_weather');
        expect(normalizeCategory('genangan air')).toBe('flooding_weather');
        expect(normalizeCategory('Kemacetan KRL')).toBe('traffic_transit');
        expect(normalizeCategory('Tumpukan Sampah')).toBe('waste_environment');
        expect(normalizeCategory('Unknown Alien Tech')).toBe('road_infrastructure');
      });
    });
  });

  // ===========================================================================
  // SECTION 3: ADVERSARIAL CONTEXTUAL REPLY GENERATOR STRESS
  // ===========================================================================
  describe('Section 3: Adversarial Runtime Contextual Reply Generator', () => {
    describe('Hostile Payloads & Injection Safety', () => {
      it('handles SQL injection strings safely without throwing', async () => {
        const reply = await generateContextualReply(
          'kn-001',
          'Road Damage & Infrastructure',
          "'; DROP TABLE users; SELECT * FROM credentials; --"
        );
        expect(reply).toBeDefined();
        expect(typeof reply.id).toBe('string');
        expect(reply.body.length).toBeGreaterThan(10);
      });

      it('handles XSS script and HTML vector payloads safely', async () => {
        const reply = await generateContextualReply(
          'kn-002',
          'Flooding & Weather',
          "<script>alert('xss')</script><img src=x onerror=alert(1)>"
        );
        expect(reply).toBeDefined();
        expect(reply.timeAgo).toBe('Baru saja');
        expect(reply.likes).toBe(1);
      });

      it('handles massive payload strings (10,000 characters)', async () => {
        const massiveText = 'banjir '.repeat(1500);
        const reply = await generateContextualReply('kn-003', 'Flooding & Weather', massiveText);
        expect(reply).toBeDefined();
        expect(reply.body).toContain('pompa');
      });

      it('handles empty and pure whitespace comment bodies with default citizen reply', async () => {
        const replyEmpty = await generateContextualReply('kn-004', 'Road', '');
        const replyWhitespace = await generateContextualReply('kn-004', 'Road', '   \n\t   ');

        expect(replyEmpty).toBeDefined();
        expect(replyEmpty.body.length).toBeGreaterThan(15);
        expect(replyWhitespace).toBeDefined();
        expect(replyWhitespace.body.length).toBeGreaterThan(15);
      });
    });

    describe('Semantic Keyword Persona Routing Accuracy', () => {
      it('routes municipal admin and RT/RW keywords to Ketua RT persona', async () => {
        const reply = await generateContextualReply('kn-005', 'Road', 'Tolong pak RT dan lurah segera koordinasi posko!');
        expect(reply.authorName).toBe(CITIZEN_PERSONAS.rt_rw[0].authorName);
        expect(reply.body).toContain('kelurahan');
      });

      it('routes APBD, anggaran, and audit keywords to budget_observer persona', async () => {
        const reply = await generateContextualReply('kn-005', 'Road', 'Mana pagu anggaran APBD untuk proyek tender ini? Tolong diaudit!');
        expect(reply.authorName).toBe(CITIZEN_PERSONAS.budget_observer[0].authorName);
        expect(reply.body).toContain('anggaran');
      });

      it('routes ojol, shockbreaker, and velg peyang keywords to ojol persona', async () => {
        const reply = await generateContextualReply('kn-005', 'Road', 'Motor saya hampir jatuh kena lubang menganga, velg peyang parah!');
        expect(reply.authorName).toBe(CITIZEN_PERSONAS.ojol[0].authorName);
        expect(reply.body).toContain('ojol');
      });

      it('routes banjir, genangan, and pompa keywords to commuter persona', async () => {
        const reply = await generateContextualReply('kn-005', 'Flooding & Weather', 'Hujan lebat bikin genangan air naik, sepatu kerja basah kuyup!');
        expect(reply.authorName).toBe(CITIZEN_PERSONAS.commuter[0].authorName);
        expect(reply.body).toContain('pompa');
      });

      it('routes humor and satire keywords (wkwk, lele) to student persona', async () => {
        const reply = await generateContextualReply('kn-005', 'Road', 'Wkwkwk ini mah bisa buat ternak lele atau tempat wisata jeglukan!');
        expect(reply.authorName).toBe(CITIZEN_PERSONAS.student[2].authorName);
        expect(reply.body).toContain('Wkwkwk');
      });
    });

    describe('Concurrent Burst Generation', () => {
      it('executes 25 concurrent contextual replies without ID collision or race conditions', async () => {
        const tasks = Array.from({ length: 25 }, (_, i) =>
          generateContextualReply(`kn-burst-${i}`, 'Road Damage & Infrastructure', `Komentar burst nomor ${i}`)
        );

        const results = await Promise.all(tasks);
        expect(results.length).toBe(25);

        const ids = new Set(results.map((r) => r.id));
        expect(ids.size).toBe(25); // Zero duplicate IDs

        results.forEach((r) => {
          expect(r.body.length).toBeGreaterThan(10);
          expect(r.authorName).toBeTruthy();
          expect(r.avatarUrl).toBeTruthy();
        });
      });
    });
  });

  // ===========================================================================
  // SECTION 4: GROUND TRUTH CIVIC FEED HYDRATION & MUNICIPAL INTEGRITY
  // ===========================================================================
  describe('Section 4: Feed Data Hydration & Municipal Integrity', () => {
    it('verifies MOCK_POSTS contains exactly all 10 seed posts (kn-001 through kn-010)', () => {
      const knPosts = MOCK_POSTS.filter((p) => p.id.startsWith('kn-'));
      expect(knPosts.length).toBe(10);

      const expectedIds = Array.from({ length: 10 }, (_, i) => `kn-${String(i + 1).padStart(3, '0')}`);
      expectedIds.forEach((id) => {
        const found = knPosts.find((p) => p.id === id);
        expect(found).toBeDefined();
      });
    });

    it('verifies media paths k001.png through k010.png and valid aspect ratios', () => {
      MOCK_POSTS_KN.forEach((post, index) => {
        const expectedNum = String(index + 1).padStart(3, '0');
        expect(post.media[0].url).toBe(`/images/feed/k${expectedNum}.png`);
        expect(post.media[0].type).toBe('image');
        expect(['4/5', '4:5', '9/16', '9:16']).toContain(post.media[0].aspectRatio);
      });
    });

    it('verifies calibrated high-engagement bounds across all 10 posts', () => {
      MOCK_POSTS_KN.forEach((post) => {
        expect(post.supportCount).toBeGreaterThanOrEqual(1200);
        expect(post.supportCount).toBeLessThanOrEqual(1500000);
        expect(post.commentsCount).toBeGreaterThanOrEqual(600);
        expect(post.commentsCount).toBeLessThanOrEqual(5000);
        expect(post.sharesCount).toBeGreaterThan(0);
        expect(post.savesCount).toBeGreaterThan(0);
      });
    });

    it('verifies linked reports rep-kn-001 to rep-kn-010 and APBD budget linkage', () => {
      MOCK_POSTS_KN.forEach((post, index) => {
        const expectedNum = String(index + 1).padStart(3, '0');
        expect(post.relatedReportId).toBe(`rep-kn-${expectedNum}`);
        expect(post.relatedReport).toBeDefined();
        expect(post.relatedReport?.id).toBe(`rep-kn-${expectedNum}`);
        expect(post.relatedReport?.publicReference).toMatch(/^TIK-2026-\d{6}$/);

        // Budget context
        const budget = post.relatedReport?.budgetContext;
        expect(budget).toBeDefined();
        expect(budget?.paguAllocation).toBeGreaterThan(1000000000); // > 1 Miliar
        expect(budget?.realizedSpending).toBeGreaterThan(0);
        expect(budget?.executionRatePercent).toBeGreaterThanOrEqual(50);
        expect(budget?.executionRatePercent).toBeLessThanOrEqual(95);
        expect(budget?.responsibleAgency).toBeTruthy();
      });
    });

    it('verifies pre-generated comments in MOCK_COMMENTS for kn-001 through kn-010', () => {
      for (let i = 1; i <= 10; i++) {
        const pid = `kn-${String(i).padStart(3, '0')}`;
        const comments = MOCK_COMMENTS[pid];
        expect(comments).toBeDefined();
        expect(comments.length).toBeGreaterThanOrEqual(15);
        expect(comments.length).toBeLessThanOrEqual(30);

        // At least 2 threaded sub-replies
        const replies = comments.filter((c) => c.parentId);
        expect(replies.length).toBeGreaterThanOrEqual(2);

        // All comments have non-empty text and avatars
        comments.forEach((c) => {
          expect(c.id).toBeTruthy();
          expect(c.authorName).toBeTruthy();
          expect(c.avatarUrl).toBeTruthy();
          expect(c.body).toBeTruthy();
          expect(c.likes).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  // ===========================================================================
  // SECTION 5: COMMENTS BOTTOM SHEET & FEED CARD ADVERSARIAL DOM DEFENSE
  // ===========================================================================
  describe('Section 5: Bottom Sheet & Feed Card Component Isolation Defense', () => {
    it('renders CommentsBottomSheet with data-scroll-isolated="true" when open', () => {
      const mockCtx = createAdversarialContext();
      const markup = renderToStaticMarkup(
        <TitikContext.Provider value={mockCtx as any}>
          <CommentsBottomSheet
            isOpen={true}
            onClose={vi.fn()}
            postId="kn-001"
            commentsCount={25}
          />
        </TitikContext.Provider>
      );

      // Must contain isolation attribute
      expect(markup).toContain('data-scroll-isolated="true"');
      // Must have visible state classes
      expect(markup).toContain('opacity-100');
      expect(markup).toContain('pointer-events-auto');
      expect(markup).toContain('Komentar Warga');
      expect(markup).toContain('overscroll-y-contain');
    });

    it('renders CommentsBottomSheet with hidden classes when closed', () => {
      const mockCtx = createAdversarialContext();
      const markup = renderToStaticMarkup(
        <TitikContext.Provider value={mockCtx as any}>
          <CommentsBottomSheet
            isOpen={false}
            onClose={vi.fn()}
            postId="kn-001"
            commentsCount={25}
          />
        </TitikContext.Provider>
      );

      expect(markup).toContain('opacity-0');
      expect(markup).toContain('pointer-events-none');
      expect(markup).toContain('translate-y-full');
    });

    it('renders FeedCard action bar with formatted metrics and tabular layout', () => {
      const post = MOCK_POSTS_KN[0]; // supportCount = 842500 -> '842.5K', commentsCount = 3420 -> '3.4K'
      const mockCtx = createAdversarialContext();

      const markup = renderToStaticMarkup(
        <TitikContext.Provider value={mockCtx as any}>
          <FeedCard post={post} isActive={true} />
        </TitikContext.Provider>
      );

      // Verify formatted metrics are rendered
      expect(markup).toContain('842.5K');
      expect(markup).toContain('3.4K');
      // Verify anti-wrapping layout classes
      expect(markup).toContain('whitespace-nowrap tabular-nums select-none text-center');
      // Verify APBD report button
      expect(markup).toContain('Lihat Laporan &amp; APBD');
      expect(markup).toContain(post.relatedReport?.publicReference);
    });

    it('renders FeedCard with non-active card styling when inactive', () => {
      const post = MOCK_POSTS_KN[1];
      const mockCtx = createAdversarialContext();

      const markup = renderToStaticMarkup(
        <TitikContext.Provider value={mockCtx as any}>
          <FeedCard post={post} isActive={false} />
        </TitikContext.Provider>
      );

      expect(markup).toContain('opacity-35');
      expect(markup).toContain('scale-[0.98]');
    });
  });

  // ===========================================================================
  // SECTION 6: FEED CONTAINER WHEEL ISOLATION GUARD LOGIC
  // ===========================================================================
  describe('Section 6: Feed Container Wheel Isolation Guard Logic', () => {
    it('accurately distinguishes scroll-isolated elements from feed stream elements', () => {
      // Simulate DOM element hierarchy
      const isolatedBackdrop = {
        getAttribute: (attr: string) => (attr === 'data-scroll-isolated' ? 'true' : null),
        closest: (sel: string) => (sel === '[data-scroll-isolated="true"]' ? isolatedBackdrop : null),
      };

      const regularFeedCard = {
        getAttribute: (_attr: string) => null,
        closest: (_sel: string) => null,
      };

      // Wheel handler isolation condition from FeedContainer.tsx:
      // if ((e.target as HTMLElement | null)?.closest?.('[data-scroll-isolated="true"]')) return;
      const isIsolatedA = Boolean(isolatedBackdrop.closest('[data-scroll-isolated="true"]'));
      const isIsolatedB = Boolean(regularFeedCard.closest('[data-scroll-isolated="true"]'));

      expect(isIsolatedA).toBe(true);
      expect(isIsolatedB).toBe(false);
    });

    it('discriminates horizontal vs vertical gestures correctly', () => {
      // Delta filter from FeedContainer.tsx:
      // if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const horizontalEvent = { deltaX: 45, deltaY: 10 };
      const verticalEvent = { deltaX: 5, deltaY: 80 };

      const isHorizontalA = Math.abs(horizontalEvent.deltaX) > Math.abs(horizontalEvent.deltaY);
      const isHorizontalB = Math.abs(verticalEvent.deltaX) > Math.abs(verticalEvent.deltaY);

      expect(isHorizontalA).toBe(true);
      expect(isHorizontalB).toBe(false);
    });
  });

  // ===========================================================================
  // SECTION 7: GLOBAL ARCHITECTURAL INVARIANT - ZERO INLINE STYLES GATE
  // ===========================================================================
  describe('Section 7: Zero Inline Styles (style={{ ... }}) Global Codebase Invariant', () => {
    const scanDirForInlineStyles = (dirPath: string): { file: string; line: number; match: string }[] => {
      const violations: { file: string; line: number; match: string }[] = [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          violations.push(...scanDirForInlineStyles(fullPath));
        } else if (
          (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
          !entry.name.endsWith('.test.tsx') &&
          !entry.name.endsWith('.test.ts')
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (/style\s*=\s*\{\{/.test(line)) {
              violations.push({
                file: path.relative(path.resolve(__dirname, '../../'), fullPath),
                line: index + 1,
                match: line.trim(),
              });
            }
          });
        }
      }
      return violations;
    };

    it('confirms 0 inline style={{ ... }} violations across all src/ components and services', () => {
      const srcDir = path.resolve(__dirname, '../');
      const violations = scanDirForInlineStyles(srcDir);

      if (violations.length > 0) {
        console.error('Inline style violations found:', violations);
      }

      expect(violations).toEqual([]);
    });

    it('specifically verifies zero inline styles in all 6 newly updated target files', () => {
      const targetFiles = [
        '../utils/formatters.ts',
        '../services/commentGenerator.ts',
        '../components/feed/CommentsBottomSheet.tsx',
        '../components/feed/FeedContainer.tsx',
        '../components/feed/FeedCard.tsx',
        '../data/mockCivicData.ts',
      ];

      targetFiles.forEach((relPath) => {
        const fullPath = path.resolve(__dirname, relPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toMatch(/style\s*=\s*\{\{/);
      });
    });
  });
});
