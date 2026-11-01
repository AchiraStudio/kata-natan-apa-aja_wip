import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../../components/layout/BottomNav';
import { FeedContainer } from '../../components/feed/FeedContainer';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { MessagesView } from '../../views/MessagesView';
import * as AuthContextModule from '../../context/AuthContext';
import * as TitikContextModule from '../../context/TitikContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { getMessages, markConversationRead, sendMessage } from '../../services/messagesService';

const mockCitizen = {
  id: 'usr-cit-10',
  username: 'citizentest',
  displayName: 'Warga Mandiri',
  avatarUrl: 'https://example.com/avatar.jpg',
  role: 'citizen' as const,
};

const otherCitizen = {
  id: 'usr-cit-20',
  username: 'wargabaru',
  displayName: 'Budi Santoso',
  avatarUrl: 'https://example.com/budi.jpg',
  role: 'citizen' as const,
};

describe('Mobile Messages Navigation & E2EE Safety Invariants', () => {
  it('BottomNav renders 5-column layout with centered "+" button and removes redundant Pesan button', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      loginWithPassword: vi.fn(),
      registerCitizen: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <ThemeProvider>
        <TitikContextModule.TitikProvider>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    // Strict 5-column grid for symmetry & centering
    expect(html).toContain('grid-cols-5');
    expect(html).toContain('aria-label="Buat"');
    expect(html).toContain('href="/map"');
    expect(html).toContain('Peta');
    expect(html).toContain('href="/explore"');
    expect(html).toContain('Explore');

    // Message button has been cleanly removed from BottomNav to avoid redundancy
    expect(html).not.toContain('href="/pesan"');
  });

  it('FeedContainer header displays the top-right Messages button with unread notification dot', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      loginWithPassword: vi.fn(),
      registerCitizen: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <ThemeProvider>
        <TitikContextModule.TitikProvider>
          <MemoryRouter initialEntries={['/']}>
            <FeedContainer />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    expect(html).toContain('title="Pesan Langsung"');
    expect(html).toContain('data-testid="messages-unread-dot"');
    expect(html).toContain('bg-amber-500');
  });

  it('BottomNav translates down when inside active mobile chat on "/pesan?conversation_id=conv-demo-01"', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      loginWithPassword: vi.fn(),
      registerCitizen: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <ThemeProvider>
        <TitikContextModule.TitikProvider>
          <MemoryRouter initialEntries={['/pesan?conversation_id=conv-demo-01']}>
            <BottomNav />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    expect(html).toContain('translate-y-28 opacity-0 pointer-events-none');
  });

  it('ProfileHeader renders "Kirim Pesan" button when viewing another citizen profile', () => {
    const mockCtrl: any = {
      profile: otherCitizen,
      posts: [],
      reports: [],
      setActiveTab: vi.fn(),
      avatarInputRef: { current: null },
      bannerInputRef: { current: null },
      isOwnProfile: false,
      handleOpenEdit: vi.fn(),
      handleAvatarFileChange: vi.fn(),
      handleBannerFileChange: vi.fn(),
      handleShareProfile: vi.fn(),
      handleStartChat: vi.fn(),
      isStartingChat: false,
      totalSupportAndLikes: 10,
      currentTheme: {
        cardBg: 'bg-white',
        cardBorder: 'border-slate-200',
        bannerGradient: 'from-emerald-900 to-slate-900',
      },
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProfileHeader ctrl={mockCtrl} />
      </MemoryRouter>
    );

    expect(html).toContain('Kirim Pesan');
    expect(html).toContain('Bagikan Profil');
  });

  it('MessagesView renders "Halo," greeting, filter pills, FAB button, and E2EE active status', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      loginWithPassword: vi.fn(),
      registerCitizen: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <ThemeProvider>
        <TitikContextModule.TitikProvider>
          <MemoryRouter initialEntries={['/pesan?conversation_id=conv-demo-01']}>
            <MessagesView />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    // Inspiration styling elements
    expect(html).toContain('Halo,');
    expect(html).toContain('Online &amp; E2EE Aktif (AES-GCM-256)');
    expect(html).toContain('Semua');
    expect(html).toContain('Belum Dibaca');
    expect(html).toContain('aria-label="Mulai Percakapan Baru"');
  });

  it('MessagesView on direct navigation to "/pesan" shows the conversation list first without auto-opening Budi Santoso', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizen,
      isAuthenticated: true,
      isLoading: false,
      loginWithPassword: vi.fn(),
      registerCitizen: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(
      <ThemeProvider>
        <TitikContextModule.TitikProvider>
          <MemoryRouter initialEntries={['/pesan']}>
            <MessagesView />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    // Conversation list must remain visible (flex, not hidden on mobile)
    expect(html).toContain('w-full md:w-[280px]');
    expect(html).toContain('Halo,');
    expect(html).toContain('Pesan Masuk');
    expect(html).toContain('Kontak Terkini');
    expect(html).toContain('Pilih percakapan di bilah kiri');
  });

  it('demo conversations return cleanly without throwing or spamming Supabase', async () => {
    const msgs = await getMessages('conv-demo-01');
    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs).toHaveLength(0);

    // markConversationRead on demo conversation should execute safely
    await expect(markConversationRead('conv-demo-01', 'usr-test')).resolves.toBeUndefined();

    // sendMessage on demo conversation should return local Message
    const sent = await sendMessage('conv-demo-01', 'usr-test', 'Halo demo pesan');
    expect(sent.content).toBe('Halo demo pesan');
    expect(sent.conversation_id).toBe('conv-demo-01');
  });
});
