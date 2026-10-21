import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  generateSeedComments,
  generateContextualReply,
  CITIZEN_PERSONAS,
  normalizeCategory,
} from '../services/commentGenerator';
import { MOCK_COMMENTS } from '../data/mockCivicData';
import { runGeneratorCLI } from '../../scripts/generate-civic-comments';

describe('Milestone 3 Challenger Adversarial Empirical Verification Suite', () => {
  const KN_POST_IDS = [
    'kn-001',
    'kn-002',
    'kn-003',
    'kn-004',
    'kn-005',
    'kn-006',
    'kn-007',
    'kn-008',
    'kn-009',
    'kn-010',
  ];

  // ===========================================================================
  // 1. COMMENT COUNT BOUNDS EMPIRICAL VERIFICATION (15 <= count <= 30)
  // ===========================================================================
  describe('Comment Count Bounds Verification (kn-001 to kn-010)', () => {
    it('verifies every post kn-001 through kn-010 has comment count strictly between 15 and 30', () => {
      const auditLog: Record<string, number> = {};

      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        expect(comments, `MOCK_COMMENTS for ${postId} must be defined`).toBeDefined();
        expect(Array.isArray(comments), `${postId} comments must be an array`).toBe(true);

        const count = comments.length;
        auditLog[postId] = count;

        expect(
          count,
          `Post ${postId} comment count must be >= 15, got ${count}`
        ).toBeGreaterThanOrEqual(15);
        expect(
          count,
          `Post ${postId} comment count must be <= 30, got ${count}`
        ).toBeLessThanOrEqual(30);
      });

      // Verify exact counts match configured values in mockCivicData.ts
      expect(auditLog['kn-001']).toBe(22);
      expect(auditLog['kn-002']).toBe(20);
      expect(auditLog['kn-003']).toBe(24);
      expect(auditLog['kn-004']).toBe(18);
      expect(auditLog['kn-005']).toBe(21);
      expect(auditLog['kn-006']).toBe(26);
      expect(auditLog['kn-007']).toBe(20);
      expect(auditLog['kn-008']).toBe(25);
      expect(auditLog['kn-009']).toBe(19);
      expect(auditLog['kn-010']).toBe(22);
    });

    it('adversarial bounds: generateSeedComments clamps out-of-range counts to [15, 30]', () => {
      // Lower bound clamp tests
      expect(
        generateSeedComments({
          postId: 'kn-adv-1',
          category: 'road_infrastructure',
          city: 'Bekasi',
          count: -999,
        }).length
      ).toBe(15);

      expect(
        generateSeedComments({
          postId: 'kn-adv-2',
          category: 'road_infrastructure',
          city: 'Bekasi',
          count: 0,
        }).length
      ).toBe(15);

      expect(
        generateSeedComments({
          postId: 'kn-adv-3',
          category: 'road_infrastructure',
          city: 'Bekasi',
          count: 14,
        }).length
      ).toBe(15);

      // Upper bound clamp tests
      expect(
        generateSeedComments({
          postId: 'kn-adv-4',
          category: 'flooding_weather',
          city: 'Jakarta',
          count: 31,
        }).length
      ).toBe(30);

      expect(
        generateSeedComments({
          postId: 'kn-adv-5',
          category: 'flooding_weather',
          city: 'Jakarta',
          count: 10000,
        }).length
      ).toBe(30);

      // Default count test (undefined)
      expect(
        generateSeedComments({
          postId: 'kn-adv-6',
          category: 'road_infrastructure',
          city: 'Bogor',
        }).length
      ).toBe(20);
    });

    it('adversarial bounds: handles count: NaN safely clamping to default bounds [15, 30]', () => {
      const nanComments = generateSeedComments({
        postId: 'kn-test-nan',
        category: 'road_infrastructure',
        city: 'Bekasi',
        count: NaN,
      });
      expect(
        nanComments.length,
        'count: NaN must clamp safely to valid bound between 15 and 30, not produce 0 comments'
      ).toBeGreaterThanOrEqual(15);
      expect(nanComments.length).toBeLessThanOrEqual(30);
    });
  });

  // ===========================================================================
  // 2. VOCABULARY MATCHES (ROAD VS FLOOD KEYWORDS)
  // ===========================================================================
  describe('Vocabulary Matches (Road Keywords vs Flood Keywords)', () => {
    const roadPostIds = ['kn-001', 'kn-002', 'kn-003', 'kn-004', 'kn-005'];
    const floodPostIds = ['kn-006', 'kn-007', 'kn-008', 'kn-009', 'kn-010'];

    const roadKeywords = [
      'lubang',
      'aspal',
      'rebar',
      'shockbreaker',
      'velg',
      'peyang',
      'amblas',
      'blind spot',
      'keriting',
      'marka',
      'kabel',
      'pju',
      'dinaspupr',
      'motor terperosok',
      'jalur tengkorak',
    ];

    const floodKeywords = [
      'genangan',
      'banjir',
      'sedada',
      'sebetis',
      'kali',
      'meluap',
      'pompa',
      'rob',
      'lumpur',
      'tanggul',
      'perahu karet',
      'busi',
      'terpal',
      'dsda',
      'bpbd',
      'drainase',
      'limpasan',
    ];

    it('verifies road posts (kn-001 to kn-005) contain road keywords', () => {
      roadPostIds.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const allText = comments.map((c) => c.body.toLowerCase()).join(' ');

        const matchedRoadKeywords = roadKeywords.filter((kw) => allText.includes(kw));
        expect(
          matchedRoadKeywords.length,
          `Road post ${postId} must match at least 4 road keywords, found: ${matchedRoadKeywords.join(', ')}`
        ).toBeGreaterThanOrEqual(4);
      });
    });

    it('verifies flood posts (kn-006 to kn-010) contain flood keywords', () => {
      floodPostIds.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const allText = comments.map((c) => c.body.toLowerCase()).join(' ');

        const matchedFloodKeywords = floodKeywords.filter((kw) => allText.includes(kw));
        expect(
          matchedFloodKeywords.length,
          `Flood post ${postId} must match at least 4 flood keywords, found: ${matchedFloodKeywords.join(', ')}`
        ).toBeGreaterThanOrEqual(4);
      });
    });

    it('stress-tests normalizeCategory across diverse and malformed aliases', () => {
      expect(normalizeCategory('Road Damage & Infrastructure')).toBe('road_infrastructure');
      expect(normalizeCategory('jalan rusak berlubang')).toBe('road_infrastructure');
      expect(normalizeCategory('PJU padam malam hari')).toBe('road_infrastructure');
      expect(normalizeCategory('Flooding & Weather Alert')).toBe('flooding_weather');
      expect(normalizeCategory('cuaca ekstrem banjir rob')).toBe('flooding_weather');
      expect(normalizeCategory('Traffic Jam KRL')).toBe('traffic_transit');
      expect(normalizeCategory('Sampah liar DLH')).toBe('waste_environment');
      // Fallbacks
      expect(normalizeCategory('')).toBe('road_infrastructure');
      expect(normalizeCategory('unknown-future-sector')).toBe('road_infrastructure');
    });
  });

  // ===========================================================================
  // 3. DYNAMIC REPLY GENERATION ADVERSARIAL STRESS TEST
  // ===========================================================================
  describe('Dynamic Reply Generation Adversarial Stress Testing', () => {
    it('contextually responds to APBD/Anggaran/Audit triggers with budget_observer persona', async () => {
      const reply = await generateContextualReply(
        'kn-001',
        'Road Damage & Infrastructure',
        'Audit pagu APBD dinas PUPR! Ada indikasi mark up anggaran.'
      );

      expect(reply.authorName).toBe(CITIZEN_PERSONAS.budget_observer[0].authorName);
      expect(reply.body.toLowerCase()).toContain('anggaran');
      expect(reply.id).toMatch(/^c-dyn-kn-001-/);
      expect(reply.timeAgo).toBe('Baru saja');
      expect(reply.likes).toBeGreaterThanOrEqual(0);
    });

    it('contextually responds to vehicle/road hazard triggers with ojol persona', async () => {
      const reply = await generateContextualReply(
        'kn-002',
        'Road Damage & Infrastructure',
        'Hati-hati bro, lubang dalem banget motor gw shockbreaker kena'
      );

      expect(reply.authorName).toBe(CITIZEN_PERSONAS.ojol[0].authorName);
      expect(reply.body.toLowerCase()).toContain('ojol');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('contextually responds to flooding/rain puddle triggers with commuter persona', async () => {
      const reply = await generateContextualReply(
        'kn-006',
        'Flooding & Weather',
        'Hujan deres kali meluap genangan makin tinggi air masuk trotoar'
      );

      expect(reply.authorName).toBe(CITIZEN_PERSONAS.commuter[0].authorName);
      expect(reply.body.toLowerCase()).toContain('sepatu kerja');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('contextually responds to RT/RW/Lurah triggers with rt_rw persona', async () => {
      const reply = await generateContextualReply(
        'kn-005',
        'Road Damage & Infrastructure',
        'Tolong koordinasi pak RT dan lurah setempat untuk buat laporan resmi ke camat'
      );

      expect(
        reply.authorName,
        'Citizen reporting to RT/RW/Lurah should trigger rt_rw persona (Pak RT Sutrisno)'
      ).toBe(CITIZEN_PERSONAS.rt_rw[0].authorName);
      expect(reply.body.toLowerCase()).toContain('kelurahan');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('contextually responds to satirical comments with student satire persona', async () => {
      const reply = await generateContextualReply(
        'kn-003',
        'Road Damage & Infrastructure',
        'Wkwkwk jalanan udah kayak sirkuit motogp lucu banget'
      );

      expect(reply.authorName).toBe(CITIZEN_PERSONAS.student[2].authorName);
      expect(reply.body).toContain('😂');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('survives adversarial edge cases: empty strings, extreme lengths, symbols, and injections', async () => {
      // 1. Empty string
      const emptyReply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', '');
      expect(emptyReply).toBeDefined();
      expect(emptyReply.body.length).toBeGreaterThan(10);
      expect(emptyReply.authorName.length).toBeGreaterThan(3);

      // 2. Whitespace only
      const wsReply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', '   \t\n   ');
      expect(wsReply).toBeDefined();
      expect(wsReply.body.length).toBeGreaterThan(10);

      // 3. Extremely long text (50,000 characters)
      const longInput = 'jalan rusak '.repeat(5000);
      const longReply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', longInput);
      expect(longReply).toBeDefined();
      expect(longReply.body.length).toBeGreaterThan(10);

      // 4. XSS & SQL Injection attack payloads
      const injectionInput = '<script>alert("xss")</script><img src=x onerror=alert(1)> UNION SELECT * FROM users; --';
      const injReply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', injectionInput);
      expect(injReply).toBeDefined();
      expect(injReply.body.length).toBeGreaterThan(10);

      // 5. Unicode / Emojis only
      const emojiInput = '🛵💨🚧🕳️🌊🌧️⛈️';
      const emojiReply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', emojiInput);
      expect(emojiReply).toBeDefined();
      expect(emojiReply.body.length).toBeGreaterThan(10);

      // 6. Unknown category string
      const unknownCatReply = await generateContextualReply('kn-001', 'Unknown Alien Category', 'Halo semuanya');
      expect(unknownCatReply).toBeDefined();
      expect(unknownCatReply.body.length).toBeGreaterThan(10);
    });

    it('handles undefined or null userCommentBody gracefully without throwing TypeError', async () => {
      const reply = await generateContextualReply('kn-001', 'Road Damage & Infrastructure', undefined as any);
      expect(reply).toBeDefined();
      expect(reply.body.length).toBeGreaterThan(0);
    });

    it('guarantees unique IDs across concurrent dynamic reply invocations without collision', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        generateContextualReply('kn-001', 'Road Damage & Infrastructure', `Komentar warga ${i}`)
      );
      const replies = await Promise.all(promises);
      const ids = replies.map((r) => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size, 'All concurrently generated reply IDs must be strictly unique').toBe(50);
    });
  });

  // ===========================================================================
  // 4. THREADED SUB-REPLIES & PARENT ID INTEGRITY
  // ===========================================================================
  describe('Threaded Sub-Replies Structural Integrity', () => {
    it('verifies each seed post has between 2 and 4 threaded sub-replies pointing to valid parent IDs', () => {
      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const commentIdMap = new Map(comments.map((c) => [c.id, c]));

        const subReplies = comments.filter((c) => c.parentId !== undefined);
        expect(
          subReplies.length,
          `${postId} should have between 2 and 4 sub-replies, got ${subReplies.length}`
        ).toBeGreaterThanOrEqual(2);
        expect(subReplies.length).toBeLessThanOrEqual(4);

        subReplies.forEach((reply) => {
          // Parent ID exists
          expect(commentIdMap.has(reply.parentId!), `Parent ID ${reply.parentId} must exist in post ${postId}`).toBe(
            true
          );
          // Not self-referencing
          expect(reply.parentId).not.toBe(reply.id);
          // Sub-reply body contains @mention
          expect(reply.body).toMatch(/@[A-Za-z0-9_]+/);
          // Likes is non-negative
          expect(reply.likes).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  // ===========================================================================
  // 5. CLI SCRIPT EXECUTION & PROGRAMMATIC INTERFACE
  // ===========================================================================
  describe('CLI Comments Generator Script Verification', () => {
    it('executes runGeneratorCLI with custom count and validates output', () => {
      const customCount = 18;
      const cliResult = runGeneratorCLI(['--count', String(customCount)]);

      expect(Object.keys(cliResult).length).toBe(10);
      KN_POST_IDS.forEach((postId) => {
        const postComments = cliResult[postId];
        expect(postComments).toBeDefined();
        expect(postComments.length).toBe(customCount);
      });
    });
  });

  // ===========================================================================
  // 6. ARCHITECTURAL INVARIANT: ZERO INLINE STYLES
  // ===========================================================================
  describe('Architectural Invariants Safeguard', () => {
    it('verifies zero inline style definitions in commentGenerator.ts and CLI script', () => {
      const commentGenFile = path.resolve(__dirname, '../services/commentGenerator.ts');
      const cliScriptFile = path.resolve(__dirname, '../../scripts/generate-civic-comments.ts');

      const commentGenContent = fs.readFileSync(commentGenFile, 'utf-8');
      const cliScriptContent = fs.readFileSync(cliScriptFile, 'utf-8');

      const inlineStyleRegex = new RegExp(['style', '=\\{{'].join(''));
      expect(inlineStyleRegex.test(commentGenContent), 'commentGenerator.ts must not have inline styles').toBe(false);
      expect(inlineStyleRegex.test(cliScriptContent), 'generate-civic-comments.ts must not have inline styles').toBe(
        false
      );
    });
  });
});
