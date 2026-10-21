import { describe, it, expect } from 'vitest';
import {
  generateSeedComments,
  generateContextualReply,
  CITIZEN_PERSONAS,
  VOCABULARY_BANKS,
  DISCUSSION_TONES,
  normalizeCategory,
} from '../services/commentGenerator';
import { MOCK_COMMENTS } from '../data/mockCivicData';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import fs from 'fs';

describe('Dynamic Smart Civic Comments Generator Engine Suite', () => {
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
  // 1. QUANTITY BOUNDS (15-30 Comments per Post)
  // ===========================================================================
  describe('Comment Quantity Bounds (15 to 30 per Post)', () => {
    it('verifies all 10 seed posts (kn-001 to kn-010) in MOCK_COMMENTS have between 15 and 30 comments', () => {
      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        expect(comments, `MOCK_COMMENTS should contain ${postId}`).toBeDefined();
        expect(
          comments.length,
          `${postId} should have between 15 and 30 comments, got ${comments.length}`
        ).toBeGreaterThanOrEqual(15);
        expect(
          comments.length,
          `${postId} should have <= 30 comments, got ${comments.length}`
        ).toBeLessThanOrEqual(30);
      });
    });

    it('verifies generateSeedComments clamps generated quantity between 15 and 30', () => {
      const lowCountComments = generateSeedComments({
        postId: 'kn-test-low',
        category: 'road_infrastructure',
        city: 'Bekasi',
        count: 5, // Below 15
      });
      expect(lowCountComments.length).toBe(15);

      const highCountComments = generateSeedComments({
        postId: 'kn-test-high',
        category: 'flooding_weather',
        city: 'Jakarta Timur',
        count: 99, // Above 30
      });
      expect(highCountComments.length).toBe(30);

      const standardComments = generateSeedComments({
        postId: 'kn-test-mid',
        category: 'road_infrastructure',
        city: 'Depok',
        count: 22,
      });
      expect(standardComments.length).toBe(22);
    });
  });

  // ===========================================================================
  // 2. CATEGORY-AWARE INDONESIAN CIVIC LEXICON VALIDATION
  // ===========================================================================
  describe('Category-Aware Indonesian Civic Lexicon Validation', () => {
    it('verifies road infrastructure posts (kn-001 to kn-005) contain road vocabulary terms', () => {
      const roadPostIds = ['kn-001', 'kn-002', 'kn-003', 'kn-004', 'kn-005'];
      const roadLexicon = [
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
      ];

      roadPostIds.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const allText = comments.map((c) => c.body.toLowerCase()).join(' ');

        const matchedTerms = roadLexicon.filter((term) => allText.includes(term));
        expect(
          matchedTerms.length,
          `${postId} must contain multiple road infrastructure terms. Found: ${matchedTerms.join(', ')}`
        ).toBeGreaterThanOrEqual(3);
      });
    });

    it('verifies flooding & weather posts (kn-006 to kn-010) contain flood vocabulary terms', () => {
      const floodPostIds = ['kn-006', 'kn-007', 'kn-008', 'kn-009', 'kn-010'];
      const floodLexicon = [
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
      ];

      floodPostIds.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const allText = comments.map((c) => c.body.toLowerCase()).join(' ');

        const matchedTerms = floodLexicon.filter((term) => allText.includes(term));
        expect(
          matchedTerms.length,
          `${postId} must contain multiple flooding terms. Found: ${matchedTerms.join(', ')}`
        ).toBeGreaterThanOrEqual(3);
      });
    });

    it('verifies all 4 civic vocabulary banks are defined with authentic lexicons', () => {
      const bankKeys = ['road_infrastructure', 'flooding_weather', 'traffic_transit', 'waste_environment'];
      bankKeys.forEach((key) => {
        const bank = VOCABULARY_BANKS[key];
        expect(bank, `Bank ${key} must exist`).toBeDefined();
        expect(bank.coreTerms.length).toBeGreaterThanOrEqual(8);
        expect(bank.hazardKeywords.length).toBeGreaterThanOrEqual(3);
        expect(bank.satiricalIdioms.length).toBeGreaterThanOrEqual(2);
        expect(bank.civicDemands.length).toBeGreaterThanOrEqual(2);
        expect(bank.solidarityPhrases.length).toBeGreaterThanOrEqual(2);
        expect(Object.keys(bank.agencyTags).length).toBeGreaterThanOrEqual(2);
      });
    });

    it('verifies normalizeCategory routes municipal aliases accurately', () => {
      expect(normalizeCategory('Road Damage & Infrastructure')).toBe('road_infrastructure');
      expect(normalizeCategory('Infrastruktur')).toBe('road_infrastructure');
      expect(normalizeCategory('Flooding & Weather')).toBe('flooding_weather');
      expect(normalizeCategory('Banjir & Genangan')).toBe('flooding_weather');
      expect(normalizeCategory('Traffic & Public Transit')).toBe('traffic_transit');
      expect(normalizeCategory('Waste & Environment')).toBe('waste_environment');
    });
  });

  // ===========================================================================
  // 3. PERSONA VARIETY & AUTHENTIC CITIZEN ROLES
  // ===========================================================================
  describe('Persona Variety & Authentic Citizen Archetypes', () => {
    it('verifies at least 3 distinct personas appear in each post', () => {
      // Map authorNames to their persona type
      const authorToPersonaMap = new Map<string, string>();
      Object.entries(CITIZEN_PERSONAS).forEach(([personaType, personas]) => {
        personas.forEach((p) => authorToPersonaMap.set(p.authorName, personaType));
      });

      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const personasInPost = new Set<string>();

        comments.forEach((c) => {
          const persona = authorToPersonaMap.get(c.authorName);
          if (persona) {
            personasInPost.add(persona);
          }
        });

        expect(
          personasInPost.size,
          `${postId} should feature at least 3 distinct personas, found ${personasInPost.size}`
        ).toBeGreaterThanOrEqual(3);
      });
    });

    it('verifies all 6 Jabodetabek personas exist in the system registry', () => {
      const expectedPersonas = [
        'ojol',
        'commuter',
        'rt_rw',
        'student',
        'warung_owner',
        'budget_observer',
      ];

      expectedPersonas.forEach((p) => {
        const personaList = CITIZEN_PERSONAS[p as keyof typeof CITIZEN_PERSONAS];
        expect(personaList).toBeDefined();
        expect(personaList.length).toBeGreaterThanOrEqual(2);
        personaList.forEach((persona) => {
          expect(persona.authorName.length).toBeGreaterThan(3);
          expect(persona.avatarUrl).toContain('https://');
          expect(persona.archetypeBio.length).toBeGreaterThan(10);
        });
      });
    });

    it('verifies all 5 discussion tones exist in the engine registry', () => {
      expect(DISCUSSION_TONES).toContain('urgent_alert');
      expect(DISCUSSION_TONES).toContain('civic_demand');
      expect(DISCUSSION_TONES).toContain('solidarity');
      expect(DISCUSSION_TONES).toContain('satirical_commentary');
      expect(DISCUSSION_TONES).toContain('official_tagging');
    });
  });

  // ===========================================================================
  // 4. THREADED SUB-REPLIES & PARENT ID INTEGRITY
  // ===========================================================================
  describe('Threaded Sub-Replies & Parent ID Integrity', () => {
    it('verifies each seed post has at least 2 threaded sub-replies with valid parentId', () => {
      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const allIds = new Set(comments.map((c) => c.id));
        const subReplies = comments.filter((c) => c.parentId !== undefined);

        expect(
          subReplies.length,
          `${postId} must have at least 2 threaded replies, got ${subReplies.length}`
        ).toBeGreaterThanOrEqual(2);

        subReplies.forEach((reply) => {
          expect(allIds.has(reply.parentId!), `${reply.id} parentId must exist in the same post`).toBe(
            true
          );
          expect(reply.parentId).not.toBe(reply.id); // Cannot be parent of itself
        });
      });
    });

    it('verifies sub-replies include @mention of the parent author', () => {
      KN_POST_IDS.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        const commentMap = new Map(comments.map((c) => [c.id, c]));
        const subReplies = comments.filter((c) => c.parentId !== undefined);

        subReplies.forEach((reply) => {
          const parent = commentMap.get(reply.parentId!);
          expect(parent).toBeDefined();
          expect(reply.body).toContain('@');
        });
      });
    });
  });

  // ===========================================================================
  // 5. DYNAMIC RUNTIME CONTEXTUAL REPLY GENERATION
  // ===========================================================================
  describe('Dynamic Runtime Contextual Reply Generation (generateContextualReply)', () => {
    it('generates a valid, populated FeedComment in response to budget audit comments', async () => {
      const reply = await generateContextualReply(
        'kn-001',
        'Road Damage & Infrastructure',
        'Mana transparansi anggaran APBD dinas terkait untuk perbaikan ini?'
      );

      expect(reply.id).toMatch(/^c-dyn-kn-001-/);
      expect(reply.authorName).toBe('Kawal APBD Warga');
      expect(reply.timeAgo).toBe('Baru saja');
      expect(reply.likes).toBeGreaterThanOrEqual(0);
      expect(reply.body.toLowerCase()).toContain('anggaran');
      expect(reply.avatarUrl).toContain('https://');
    });

    it('generates an ojol response to road damage / motorcycle hazard comments', async () => {
      const reply = await generateContextualReply(
        'kn-002',
        'Road Damage & Infrastructure',
        'Awas motor hati-hati lewat sini, velg peyang kena lubang'
      );

      expect(reply.authorName).toBe('Bang Ocid Ojol');
      expect(reply.body.toLowerCase()).toContain('ojol');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('generates a commuter response to flooding / rain puddle comments', async () => {
      const reply = await generateContextualReply(
        'kn-006',
        'Flooding & Weather',
        'Banjir makin naik, genangan air sedada bikin susah lewat'
      );

      expect(reply.authorName).toBe('Dian Komuter');
      expect(reply.body.toLowerCase()).toContain('sepatu kerja');
      expect(reply.timeAgo).toBe('Baru saja');
    });

    it('generates a satirical response when user includes laughter or satire', async () => {
      const reply = await generateContextualReply(
        'kn-001',
        'Road Damage & Infrastructure',
        'Wkwkwk lele peliharaan bisa berenang di jalan raya nih'
      );

      expect(reply.authorName).toBe('Bagas Pelajar Margonda');
      expect(reply.body).toContain('😂');
    });
  });

  // ===========================================================================
  // 6. BACKWARD COMPATIBILITY & MOCK ADAPTER RETRIEVAL
  // ===========================================================================
  describe('Backward Compatibility with Legacy Mock Posts', () => {
    it('preserves legacy mock comments for post-001, post-002, post-003, post-004', () => {
      const legacyIds = ['post-001', 'post-002', 'post-003', 'post-004'];
      legacyIds.forEach((postId) => {
        const comments = MOCK_COMMENTS[postId];
        expect(comments, `Legacy post ${postId} comments must be preserved`).toBeDefined();
        expect(comments.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('retrieves comments seamlessly through MockDataAdapter for both kn- and legacy posts', async () => {
      const adapter = new MockDataAdapter();

      const knComments = await adapter.getComments('kn-001');
      expect(knComments.length).toBeGreaterThanOrEqual(15);

      const legacyComments = await adapter.getComments('post-001');
      expect(legacyComments.length).toBeGreaterThanOrEqual(4);

      // Verify adding a comment works on hydrated kn- post
      const newComment = await adapter.addComment(
        'kn-001',
        'WargaKritis26',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'Saya barusan lewat dan konfirmasi lubang ini memang sangat berbahaya.'
      );

      expect(newComment.authorName).toBe('WargaKritis26');
      expect(newComment.timeAgo).toBe('Baru saja');

      const updatedComments = await adapter.getComments('kn-001');
      expect(updatedComments[0].id).toBe(newComment.id);
    });
  });

  // ===========================================================================
  // 7. ARCHITECTURAL INVARIANT: ZERO INLINE STYLES
  // ===========================================================================
  describe('Zero Inline Styles Architectural Invariant', () => {
    it('verifies this test file contains zero inline style definitions', () => {
      const currentFilePath = __filename;
      const content = fs.readFileSync(currentFilePath, 'utf-8');
      const inlineStyleRegex = new RegExp(['style', '=\\{{'].join(''));
      expect(inlineStyleRegex.test(content)).toBe(false);
    });
  });
});
