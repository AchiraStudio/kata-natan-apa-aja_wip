import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { ThemeProvider } from '../context/ThemeContext';
import * as AuthContextModule from '../context/AuthContext';
import * as TitikContextModule from '../context/TitikContext';
import { UserProfile } from '../types/domain';

const mockCitizen: UserProfile = {
  id: 'usr-1',
  email: 'budi@warga.id',
  username: 'budi.santoso',
  displayName: 'Budi Santoso',
  role: 'citizen',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  district: 'Bogor Selatan',
};

describe('Sidebar Profile Navigation Suite', () => {
  it('renders account card linking directly to user profile when authenticated', () => {
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
      posts: [],
      activeFeedTab: 'for_you',
      setActiveFeedTab: vi.fn(),
      activePost: null,
      setActivePostId: vi.fn(),
      setSearchModalOpen: vi.fn(),
      openComposer: vi.fn(),
      updateReportStatus: vi.fn(),
      deleteReport: vi.fn(),
      refreshFeed: vi.fn(),
      selectedCategory: null,
      setSelectedCategory: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <Sidebar currentPath="/" />
        </ThemeProvider>
      </MemoryRouter>
    );

    // 1. Links to user profile
    expect(html).toContain('href="/u/budi.santoso"');
    expect(html).toContain('title="Profil Saya"');
    expect(html).toContain('Budi Santoso');
    expect(html).toContain('href="/tersimpan"');
    expect(html).toContain('Laporan Tersimpan');

    // 2. Does NOT link to login when authenticated
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain('Masuk / Daftar Akun');
  });

  it('renders login action instead of fake profile card when unauthenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      isLiveMode: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(TitikContextModule, 'useTitik').mockReturnValue({
      posts: [],
      activeFeedTab: 'for_you',
      setActiveFeedTab: vi.fn(),
      activePost: null,
      setActivePostId: vi.fn(),
      setSearchModalOpen: vi.fn(),
      openComposer: vi.fn(),
      updateReportStatus: vi.fn(),
      deleteReport: vi.fn(),
      refreshFeed: vi.fn(),
      selectedCategory: null,
      setSelectedCategory: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <Sidebar currentPath="/" />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Must render login button and NEVER render a fake logged-in profile card
    expect(html).toContain('href="/login"');
    expect(html).toContain('Masuk / Daftar Akun');
    expect(html).not.toContain('href="/u/budi.santoso"');
    expect(html).not.toContain('Budi Santoso');
  });
});
