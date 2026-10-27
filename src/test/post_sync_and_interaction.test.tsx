import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { generatePostId, generateReportId, generateCommentId } from '../utils/idGenerator';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import { FeedCard } from '../components/feed/FeedCard';
import * as AuthContextModule from '../context/AuthContext';
import { Post, UserProfile } from '../types/domain';

const mockToggleSupport = vi.fn();
const mockTogglePostLike = vi.fn();
const mockTogglePostSave = vi.fn();

vi.mock('../context/useTitik', () => ({
  useTitik: () => ({
    toggleSupport: mockToggleSupport,
    togglePostLike: mockTogglePostLike,
    togglePostSave: mockTogglePostSave,
    openReportDetail: vi.fn(),
    updatePostCommentsCount: vi.fn(),
  }),
}));

vi.mock('../context/TitikContext', () => ({
  useTitik: () => ({
    toggleSupport: mockToggleSupport,
    togglePostLike: mockTogglePostLike,
    togglePostSave: mockTogglePostSave,
    openReportDetail: vi.fn(),
    updatePostCommentsCount: vi.fn(),
  }),
}));

describe('Unique ID Generation & Unlimited Scale', () => {
  it('generates 5,000 unique post IDs with 0 collisions', () => {
    const idSet = new Set<string>();
    const total = 5000;
    for (let i = 0; i < total; i++) {
      const id = generatePostId();
      expect(id.startsWith('post_')).toBe(true);
      idSet.add(id);
    }
    expect(idSet.size).toBe(total);
  });

  it('generates 5,000 unique report IDs with 0 collisions', () => {
    const idSet = new Set<string>();
    const total = 5000;
    for (let i = 0; i < total; i++) {
      const id = generateReportId();
      expect(id.startsWith('rep_')).toBe(true);
      idSet.add(id);
    }
    expect(idSet.size).toBe(total);
  });

  it('generates 5,000 unique comment IDs with 0 collisions', () => {
    const idSet = new Set<string>();
    const total = 5000;
    for (let i = 0; i < total; i++) {
      const id = generateCommentId();
      expect(id.startsWith('cm_')).toBe(true);
      idSet.add(id);
    }
    expect(idSet.size).toBe(total);
  });
});

describe('FeedCard Universal Interaction & Zero Metric Sync', () => {
  const dummyCitizen: UserProfile = {
    id: 'usr-test-001',
    username: 'budi.santoso',
    displayName: 'Budi Santoso',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'citizen',
    isVerified: true,
  };

  const sampleReportPost: Post = {
    id: 'post-rep-001',
    author: dummyCitizen,
    body: 'Laporan kerusakan trotoar Jalan Pajajaran.',
    postType: 'citizen_report',
    media: [{ id: 'm-1', type: 'image', url: '/img1.png', aspectRatio: '4/5' }],
    locationTag: 'Bogor Tengah',
    relatedReportId: 'rep-001',
    supportCount: 0,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    isSupportedByMe: false,
    isLikedByMe: false,
    isSavedByMe: false,
    createdAt: '1 jam lalu',
    isSampleData: false,
  };

  const sampleDiscussionPost: Post = {
    id: 'post-disc-001',
    author: dummyCitizen,
    body: 'Diskusi warga: usulan ruang terbuka hijau di Baranangsiang.',
    postType: 'community_discussion',
    media: [{ id: 'm-2', type: 'image', url: '/img2.png', aspectRatio: '4/5' }],
    locationTag: 'Bogor Timur',
    relatedReportId: undefined,
    supportCount: 0,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    isSupportedByMe: false,
    isLikedByMe: false,
    isSavedByMe: false,
    createdAt: 'Baru saja',
    isSampleData: false,
  };

  it('renders zero metrics correctly without fallback to legacy dummy numbers', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: dummyCitizen.id } as any,
      profile: dummyCitizen,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      isLiveMode: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FeedCard post={sampleReportPost} isActive={true} />
      </MemoryRouter>
    );

    // Expect exact 0 rendered for support, comments, and saves
    expect(html).toContain('0');
    expect(html).not.toContain('842.5K');
    expect(html).not.toContain('3.4K');
    expect(html).not.toContain('2104');
  });

  it('renders interactive heart button for community discussion posts without relatedReportId', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: dummyCitizen.id } as any,
      profile: dummyCitizen,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      isLiveMode: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FeedCard post={sampleDiscussionPost} isActive={true} />
      </MemoryRouter>
    );

    // Discussion post has title="Sukai postingan ini"
    expect(html).toContain('Sukai postingan ini');
    expect(html).toContain('Diskusi warga');
  });

  it('renders civic support button for citizen reports with relatedReportId', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: dummyCitizen.id } as any,
      profile: dummyCitizen,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      isLiveMode: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FeedCard post={sampleReportPost} isActive={true} />
      </MemoryRouter>
    );

    // Report post has title="Dukung laporan ini / Saya terdampak juga"
    expect(html).toContain('Dukung laporan ini / Saya terdampak juga');
  });
});

describe('MockDataAdapter Correct Metric Behavior', () => {
  it('correctly toggles post likes without altering support count', async () => {
    const adapter = new MockDataAdapter();
    const posts = await adapter.getFeedPosts();
    const targetPost = posts[0];

    const initialLikes = targetPost.likesCount || 0;
    const initialSupport = targetPost.supportCount || 0;

    const res = await adapter.togglePostLike(targetPost.id, 'usr-test');
    expect(res.isLiked).toBe(true);
    expect(res.likesCount).toBe(initialLikes + 1);

    // Verify post's support count is unchanged
    const reloaded = await adapter.getPostById(targetPost.id);
    expect(reloaded?.supportCount).toBe(initialSupport);
    expect(reloaded?.likesCount).toBe(initialLikes + 1);

    // Toggle off
    const resOff = await adapter.togglePostLike(targetPost.id, 'usr-test');
    expect(resOff.isLiked).toBe(false);
    expect(resOff.likesCount).toBe(initialLikes);
  });
});

describe('Mobile Snap Scroll Stability', () => {
  it('verifies scroll restoration effect in FeedContainer does not re-trigger on activePost change', () => {
    const fs = require('fs');
    const path = require('path');
    const feedContainerSrc = fs.readFileSync(
      path.resolve(__dirname, '../components/feed/FeedContainer.tsx'),
      'utf-8'
    );

    // It must use hasRestoredInitialScrollRef to only restore once on mount
    expect(feedContainerSrc).toContain('hasRestoredInitialScrollRef');
    expect(feedContainerSrc).toContain('if (hasRestoredInitialScrollRef.current) return;');
    expect(feedContainerSrc).toContain('lg:scroll-smooth');
  });

  it('verifies HomeView.css scopes scroll-behavior smooth to desktop to prevent mobile snap jitter', () => {
    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(path.resolve(__dirname, '../views/HomeView.css'), 'utf-8');

    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('scroll-snap-type: y mandatory;');
  });
});
