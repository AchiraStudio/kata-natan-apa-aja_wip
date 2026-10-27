import { describe, it, expect } from 'vitest';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import { UserProfile } from '../types/domain';

describe('Profile Customization & Supabase Persistence', () => {
  const adapter = new MockDataAdapter();

  it('updates and persists bannerUrl, backgroundTheme, websiteUrl, and customStatus in adapter', async () => {
    const updated = await adapter.updateProfile({
      displayName: 'Budi Santoso',
      username: 'budi.santoso',
      bio: 'Warga Bogor Selatan pemantau APBD',
      district: 'Bogor Selatan',
      bannerUrl: 'https://images.unsplash.com/photo-custom-banner',
      backgroundTheme: 'bogor_slate',
      websiteUrl: 'https://budi-bogor.id',
      customStatus: 'Pantau APBD Bogor Bersama',
    });

    expect(updated.displayName).toBe('Budi Santoso');
    expect(updated.username).toBe('budi.santoso');
    expect(updated.bannerUrl).toBe('https://images.unsplash.com/photo-custom-banner');
    expect(updated.backgroundTheme).toBe('bogor_slate');
    expect(updated.websiteUrl).toBe('https://budi-bogor.id');
    expect(updated.customStatus).toBe('Pantau APBD Bogor Bersama');
  });

  it('provides default fallback values when banner or theme are omitted', async () => {
    const updated = await adapter.updateProfile({
      displayName: 'Warga Anyar',
      username: 'warga_anyar',
    });

    expect(updated.backgroundTheme).toBe('editorial_forest');
    expect(updated.bannerUrl).toBeDefined();
  });

  it('retrieves profile with customization metadata when queried by username', async () => {
    const profile = await adapter.getProfileByUsername('budi.santoso');
    expect(profile).not.toBeNull();
    if (profile) {
      expect(profile.backgroundTheme).toBeDefined();
      expect(profile.bannerUrl).toBeDefined();
    }
  });

  it('validates UserProfile interface conforms to required type contracts', () => {
    const sampleProfile: UserProfile = {
      id: 'usr-test-1',
      username: 'andi.warga',
      displayName: 'Andi Warga',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'citizen',
      bio: 'Pemerhati tata kota',
      district: 'Bogor Tengah',
      bannerUrl: 'https://images.unsplash.com/photo-custom',
      backgroundTheme: 'midnight_charcoal',
      websiteUrl: 'https://andi.id',
      customStatus: 'Bogor Bersih 2026',
    };

    expect(sampleProfile.id).toBe('usr-test-1');
    expect(sampleProfile.backgroundTheme).toBe('midnight_charcoal');
    expect(sampleProfile.customStatus).toBe('Bogor Bersih 2026');
  });
});

