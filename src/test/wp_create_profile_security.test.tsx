import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PostComposer } from '../components/composer/PostComposer';
import { CreateModal } from '../components/composer/CreateModal';
import { TitikContext, TitikContextType } from '../context/TitikContext';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { MOCK_POSTS_KN } from '../data/mockCivicData';
import { stripExifAndCleanImage } from '../components/composer/useMediaUpload';
import { getCivicTileConfig, OSM_FALLBACK_URL } from '../utils/mapTiles';
import { UserProfile } from '../types/domain';

function createMockTitikContext(overrides?: Partial<TitikContextType>): TitikContextType {
  return {
    posts: MOCK_POSTS_KN,
    activePost: MOCK_POSTS_KN[0],
    activeFeedTab: 'for_you' as const,
    selectedCategory: 'Semua',
    facilities: [],
    budgetSectors: [],
    reportModalOpen: false,
    composerOpen: true,
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
    togglePostSave: vi.fn(),
    togglePostLike: vi.fn(),
    addComment: vi.fn(),
    getComments: vi.fn().mockResolvedValue([]),
    refreshFeed: vi.fn(),
    submitReport: vi.fn(),
    updateReportStatus: vi.fn(),
    deleteReport: vi.fn(),
    ...overrides,
  };
}

function createMockAuthContext(overrides?: Partial<AuthContextType>): AuthContextType {
  const defaultProfile: UserProfile = {
    id: 'usr-test-owner',
    username: 'warga_bogor',
    displayName: 'Warga Bogor',
    avatarUrl: 'https://example.com/avatar.jpg',
    role: 'citizen',
    bio: 'Warga aktif pemerhati fasilitas.',
    district: 'Bogor Tengah',
    isVerified: true,
  };

  return {
    user: null,
    profile: defaultProfile,
    session: null,
    isLoading: false,
    isAuthenticated: true,
    isLiveMode: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  };
}

describe('Work Package 3, 4, 6 Hardening & Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unified Create Modal & Composer', () => {
    it('renders CreateModal shell with Postingan and Laporan Warga tabs', () => {
      const titikCtx = createMockTitikContext({ composerOpen: true, composerTab: 'post' });
      const authCtx = createMockAuthContext();

      const html = renderToStaticMarkup(
        <AuthContext.Provider value={authCtx}>
          <TitikContext.Provider value={titikCtx}>
            <MemoryRouter>
              <CreateModal />
            </MemoryRouter>
          </TitikContext.Provider>
        </AuthContext.Provider>
      );

      expect(html).toContain('Postingan');
      expect(html).toContain('Laporan Warga');
      expect(html).toContain('Terbitkan');
    });

    it('returns null when composerOpen is false', () => {
      const titikCtx = createMockTitikContext({ composerOpen: false });
      const authCtx = createMockAuthContext();

      const html = renderToStaticMarkup(
        <AuthContext.Provider value={authCtx}>
          <TitikContext.Provider value={titikCtx}>
            <MemoryRouter>
              <CreateModal />
            </MemoryRouter>
          </TitikContext.Provider>
        </AuthContext.Provider>
      );

      expect(html).toBe('');
    });

    it('enforces character limit on PostComposer textarea (max 2000 chars)', () => {
      const authCtx = createMockAuthContext();
      const titikCtx = createMockTitikContext();

      const html = renderToStaticMarkup(
        <AuthContext.Provider value={authCtx}>
          <TitikContext.Provider value={titikCtx}>
            <MemoryRouter>
              <PostComposer onSuccess={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>
          </TitikContext.Provider>
        </AuthContext.Provider>
      );

      expect(html).toContain('maxLength="2000"');
      expect(html).toContain('/2000');
    });
  });

  describe('Map Resilience & Tile Watermark Prevention', () => {
    it('unconditionally falls back to OpenStreetMap when VITE_MAP_PROVIDER is osm', () => {
      const prevProvider = import.meta.env.VITE_MAP_PROVIDER;
      const prevKey = import.meta.env.VITE_CARTO_API_KEY;

      import.meta.env.VITE_MAP_PROVIDER = 'osm';
      import.meta.env.VITE_CARTO_API_KEY = 'invalid_carto_key';

      const config = getCivicTileConfig();
      expect(config.url).toBe(OSM_FALLBACK_URL);
      expect(config.attribution).toContain('OpenStreetMap');
      expect(config.attribution).not.toContain('CARTO');

      import.meta.env.VITE_MAP_PROVIDER = prevProvider;
      import.meta.env.VITE_CARTO_API_KEY = prevKey;
    });
  });

  describe('Client-Side EXIF Stripping Utility', () => {
    it('exports stripExifAndCleanImage and rejects gracefully on invalid file', async () => {
      expect(typeof stripExifAndCleanImage).toBe('function');
      const fakeFile = new File(['fake content'], 'test.txt', { type: 'text/plain' });
      await expect(stripExifAndCleanImage(fakeFile)).rejects.toThrow();
    });
  });
});
