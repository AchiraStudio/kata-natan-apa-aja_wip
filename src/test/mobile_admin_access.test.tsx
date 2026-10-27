import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { AdminView } from '../views/AdminView';
import * as AuthContextModule from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProfile, Report } from '../types/domain';

// Mock useTitik
vi.mock('../context/useTitik', () => ({
  useTitik: () => ({
    openComposer: vi.fn(),
    setActiveFeedTab: vi.fn(),
    updateReportStatus: vi.fn(),
    deleteReport: vi.fn(),
    refreshFeed: vi.fn(),
  }),
}));

vi.mock('../context/TitikContext', () => ({
  useTitik: () => ({
    openComposer: vi.fn(),
    setActiveFeedTab: vi.fn(),
    updateReportStatus: vi.fn(),
    deleteReport: vi.fn(),
    refreshFeed: vi.fn(),
  }),
}));

vi.mock('../services/dataService', () => ({
  dataService: {
    getAllReports: vi.fn().mockResolvedValue([
      {
        id: 'rep-test-1',
        publicReference: 'BOGOR-2026-001',
        title: 'Jalan Rusak Parah di Sukasari',
        description: 'Aspal berlubang sedalam 15cm membahayakan pengendara motor.',
        category: 'Infrastruktur Jalan',
        status: 'under_review',
        location: { address: 'Jl. Pajajaran No. 12, Bogor' },
        mediaUrls: [],
        events: [],
        reporterDisplayName: 'Budi',
        responsibleAgency: 'Dinas PUPR Kota Bogor',
        budgetContext: { paguAllocation: 500000000 },
      } as unknown as Report,
    ]),
  },
}));

// Mock contexts
const mockAdminProfile: UserProfile = {
  id: 'admin-1',
  email: 'admin@titik.id',
  username: 'admin.pupr',
  displayName: 'Admin PUPR Bogor',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  bio: 'Verifikator Dinas PUPR Kota Bogor',
  district: 'Bogor Tengah',
  isVerified: true,
  verifiedAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang',
};

const mockCitizenProfile: UserProfile = {
  id: 'citizen-1',
  email: 'budi@warga.id',
  username: 'budi.santoso',
  displayName: 'Budi Santoso',
  role: 'citizen',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  bio: 'Warga Bogor Selatan',
  district: 'Bogor Selatan',
  isVerified: false,
};

describe('Mobile Admin Access & Navigation Suite', () => {
  it('renders admin badge indicator on BottomNav for admin profile', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockAdminProfile,
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
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );

    expect(html).toContain('title="Akun Admin PUPR"');
    expect(html).toContain('title="Profil &amp; Admin PUPR"');
    expect(html).toContain('Admin');
  });

  it('labels active tab as Admin on BottomNav when on /admin path', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockAdminProfile,
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
      <MemoryRouter initialEntries={['/admin']}>
        <BottomNav />
      </MemoryRouter>
    );

    expect(html).toContain('text-amber-400 font-bold');
    expect(html).toContain('Admin');
  });

  it('renders citizen name without admin badge for citizen profile', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizenProfile,
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
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );

    expect(html).not.toContain('title="Akun Admin PUPR"');
    expect(html).toContain('Budi');
  });

  it('renders AdminView mobile header and tab switcher for authenticated admin', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockAdminProfile,
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
      <ThemeProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminView />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Mobile header checks
    expect(html).toContain('ADMIN PUPR');
    expect(html).toContain('Konsol');
    expect(html).toContain('aria-label="Kembali"');
    expect(html).toContain('aria-label="Segarkan"');

    // Mobile segmented control checks
    expect(html).toContain('Antrean (');
    expect(html).toContain('Detail');
  });

  it('renders Access Restriction screen if citizen attempts to view AdminView', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      profile: mockCitizenProfile,
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
      <ThemeProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminView />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(html).toContain('Akses Khusus Verifikator PUPR');
    expect(html).toContain('Portal Tinjauan Admin memerlukan akun berwenang verifikator dinas.');
    expect(html).toContain('Kembali ke Beranda');
    expect(html).toContain('Masuk Akun Admin');
  });
});

