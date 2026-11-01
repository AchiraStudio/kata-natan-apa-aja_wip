import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../../components/layout/BottomNav';
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

describe('Mobile Messages Navigation & E2EE Safety Invariants', () => {
  it('BottomNav renders the "Pesan" tab linking to "/pesan"', () => {
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

    expect(html).toContain('href="/pesan"');
    expect(html).toContain('Pesan');
    expect(html).toContain('href="/map"');
    expect(html).toContain('Peta');
  });

  it('BottomNav highlights the "Pesan" tab when route is "/pesan"', () => {
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
            <BottomNav />
          </MemoryRouter>
        </TitikContextModule.TitikProvider>
      </ThemeProvider>
    );

    expect(html).toContain('text-emerald-400 font-bold');
    expect(html).toContain('translate-y-0 opacity-100');
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

