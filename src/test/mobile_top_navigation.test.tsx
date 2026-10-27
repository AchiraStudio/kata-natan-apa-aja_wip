import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { FeedContainer } from '../components/feed/FeedContainer';
import { FeedCard } from '../components/feed/FeedCard';
import * as AuthContextModule from '../context/AuthContext';
import * as TitikContextModule from '../context/TitikContext';
import { Post, UserProfile } from '../types/domain';

const mockCitizen: UserProfile = {
  id: 'usr-1',
  email: 'budi@warga.id',
  username: 'budi.santoso',
  displayName: 'Budi Santoso',
  role: 'citizen',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  district: 'Bogor Selatan',
};

const mockPost: Post = {
  id: 'post-test-1',
  author: mockCitizen,
  body: 'Jalan berlubang parah di depan halte Sukasari.',
  locationTag: 'Bogor Selatan',
  media: [{ id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', aspectRatio: '9:16' }],
  supportCount: 0,
  likesCount: 0,
  commentsCount: 0,
  savesCount: 0,
  sharesCount: 0,
  createdAt: new Date().toISOString(),
  postType: 'citizen_report',
  isSampleData: false,
};

describe('Mobile Top Navigation Optimization Suite', () => {
  it('renders streamlined segmented pill tab bar and safe-area insets in FeedContainer', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      user: null,
      session: null,
      isLiveMode: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(TitikContextModule, 'useTitik').mockReturnValue({
      posts: [mockPost],
      activeFeedTab: 'for_you',
      setActiveFeedTab: vi.fn(),
      activePost: mockPost,
      setActivePostId: vi.fn(),
      setSearchModalOpen: vi.fn(),
      openComposer: vi.fn(),
      updateReportStatus: vi.fn(),
      deleteReport: vi.fn(),
      refreshFeed: vi.fn(),
      allReports: [],
      myReports: [],
      selectedReport: null,
      setSelectedReport: vi.fn(),
      userComments: {},
      addComment: vi.fn(),
      toggleLike: vi.fn(),
      toggleSave: vi.fn(),
      bookmarkedPostIds: new Set(),
      likedPostIds: new Set(),
      isSearchModalOpen: false,
      composerOpen: false,
      closeComposer: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FeedContainer />
      </MemoryRouter>
    );

    // 1. Safe area top inset padding applied
    expect(html).toContain('pt-[max(0.75rem,env(safe-area-inset-top))]');

    // 2. Mobile segmented pill container applied
    expect(html).toContain('bg-black/40 backdrop-blur-xl border border-white/15 rounded-full p-0.5');

    // 3. Compact 32px circular buttons for logo and search
    expect(html).toContain('w-8 h-8 rounded-full');
    expect(html).toContain('aria-label="Cari"');

    // 4. Tab labels present inside segmented capsule
    expect(html).toContain('Untuk Anda');
    expect(html).toContain('Mengikuti');
    expect(html).toContain('Terdekat');
  });

  it('renders discreet frosted badge with safe-area spacing in FeedCard', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      user: null,
      session: null,
      isLiveMode: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FeedCard post={mockPost} isActive={true} />
      </MemoryRouter>
    );

    // 1. Clearanced top overlay padding below the segmented pill
    expect(html).toContain('pt-[calc(max(0.75rem,env(safe-area-inset-top))+2.75rem)]');

    // 2. Discreet frosted glass badge instead of bulky solid white rectangle
    expect(html).toContain('bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[11px]');
    expect(html).toContain('Warga melaporkan');

    // 3. More options action button has accessible label
    expect(html).toContain('aria-label="Menu opsi lainnya"');
  });
});

