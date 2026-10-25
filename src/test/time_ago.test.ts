import { describe, it, expect } from 'vitest';
import { formatIndonesianTimeAgo, generatePastTimestamp } from '../utils/timeAgo';

describe('formatIndonesianTimeAgo utility', () => {
  it('returns "Baru saja" for undefined, null, or recent dates', () => {
    expect(formatIndonesianTimeAgo(undefined)).toBe('Baru saja');
    expect(formatIndonesianTimeAgo(null)).toBe('Baru saja');
    expect(formatIndonesianTimeAgo(new Date())).toBe('Baru saja');
    expect(formatIndonesianTimeAgo('invalid-date')).toBe('Baru saja');
  });

  it('formats minutes ago correctly', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(fiveMinutesAgo)).toBe('5 menit yang lalu');

    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(fortyMinutesAgo)).toBe('40 menit yang lalu');
  });

  it('formats hours ago correctly', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(twoHoursAgo)).toBe('2 jam yang lalu');

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(twelveHoursAgo)).toBe('12 jam yang lalu');
  });

  it('formats days and weeks ago correctly', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(twoDaysAgo)).toBe('2 hari yang lalu');

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatIndonesianTimeAgo(twoWeeksAgo)).toBe('2 minggu yang lalu');
  });

  it('generates valid past ISO timestamps with jitter', () => {
    const iso = generatePastTimestamp(30, 15);
    const parsed = new Date(iso);
    expect(parsed.getTime()).toBeLessThan(Date.now());
    expect(formatIndonesianTimeAgo(iso)).toBe('30 menit yang lalu');
  });
});

