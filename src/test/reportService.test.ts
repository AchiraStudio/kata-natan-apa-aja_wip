import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validateCoordinates, 
  generalizeCoordinates, 
  calculateDistanceMeters 
} from '../services/locationService';
import { validateImageFile } from '../services/reportMediaService';
import { 
  generateFollowUpSecret, 
  sha256Hash, 
  submitCitizenReport,
  findNearbySimilarReports
} from '../services/reportService';
import { PublicCivicReport } from '../types/database';

describe('Location Service', () => {
  it('validates coordinates accurately within geographic boundaries', () => {
    expect(validateCoordinates(-6.5971, 106.8060)).toBe(true);
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(-90, 180)).toBe(true);
    expect(validateCoordinates(90, -180)).toBe(true);

    // Invalid coordinates
    expect(validateCoordinates(91, 106)).toBe(false);
    expect(validateCoordinates(-91, 106)).toBe(false);
    expect(validateCoordinates(-6, 181)).toBe(false);
    expect(validateCoordinates(-6, -181)).toBe(false);
    expect(validateCoordinates(NaN, 106)).toBe(false);
    expect(validateCoordinates(-6, NaN)).toBe(false);
  });

  it('generalizes coordinates to 3 decimal places for public privacy (~110m)', () => {
    const [genLat, genLng] = generalizeCoordinates(-6.597184, 106.806042);
    expect(genLat).toBe(-6.597);
    expect(genLng).toBe(106.806);
  });

  it('calculates Haversine distance correctly in meters', () => {
    // Distance between identical points is 0
    const d0 = calculateDistanceMeters(-6.5971, 106.8060, -6.5971, 106.8060);
    expect(d0).toBe(0);

    // Distance between Bogor Station and Kebun Raya Bogor (~1.2 km)
    const dBogor = calculateDistanceMeters(-6.5950, 106.7900, -6.5976, 106.7995);
    expect(dBogor).toBeGreaterThan(1000);
    expect(dBogor).toBeLessThan(1400);
  });
});

describe('Report Media Service', () => {
  it('accepts valid JPG, PNG, and WebP images within 10MB limit', () => {
    const validJpg = new File(['dummy-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const validPng = new File(['dummy-bytes'], 'photo.png', { type: 'image/png' });
    const validWebp = new File(['dummy-bytes'], 'photo.webp', { type: 'image/webp' });

    expect(validateImageFile(validJpg).valid).toBe(true);
    expect(validateImageFile(validPng).valid).toBe(true);
    expect(validateImageFile(validWebp).valid).toBe(true);
  });

  it('rejects unsupported file formats like GIF, PDF, or SVG', () => {
    const gifFile = new File(['dummy-bytes'], 'anim.gif', { type: 'image/gif' });
    const pdfFile = new File(['dummy-bytes'], 'doc.pdf', { type: 'application/pdf' });

    const resGif = validateImageFile(gifFile);
    expect(resGif.valid).toBe(false);
    expect(resGif.error).toMatch(/tidak didukung/i);

    const resPdf = validateImageFile(pdfFile);
    expect(resPdf.valid).toBe(false);
    expect(resPdf.error).toMatch(/tidak didukung/i);
  });

  it('rejects files exceeding the 10MB size limit', () => {
    // 11 MB dummy file
    const oversizedFile = new File([''], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    const res = validateImageFile(oversizedFile);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/melebihi batas maksimum 10 MB/i);
  });
});

describe('Report Service & Anonymity Protocol', () => {
  it('generates a 64-character hexadecimal follow-up secret token', () => {
    const secret = generateFollowUpSecret();
    expect(typeof secret).toBe('string');
    expect(secret).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(secret)).toBe(true);
  });

  it('computes SHA-256 hashes deterministically with Web Crypto API', async () => {
    const token = 'test-token-value-12345';
    const hash1 = await sha256Hash(token);
    const hash2 = await sha256Hash(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);

    const hashOther = await sha256Hash('different-token');
    expect(hash1).not.toBe(hashOther);
  });

  it('validates report title and description length before submission', async () => {
    await expect(submitCitizenReport({
      title: 'abc', // too short (< 5 chars)
      description: 'Laporan kerusakan jalan yang cukup panjang',
      category: 'Infrastruktur Jalan',
      severity: 'Sedang',
      subdistrict: 'Bogor Tengah',
      preciseCoordinates: [-6.5971, 106.8060],
      isApproximate: false,
      acquisitionMethod: 'map_pin',
      evidenceFiles: [],
      isAnonymous: true,
    })).rejects.toThrow(/Judul laporan minimal 5 karakter/);

    await expect(submitCitizenReport({
      title: 'Jalan Rusak Berlubang Parah',
      description: 'Pendek', // too short (< 10 chars)
      category: 'Infrastruktur Jalan',
      severity: 'Sedang',
      subdistrict: 'Bogor Tengah',
      preciseCoordinates: [-6.5971, 106.8060],
      isApproximate: false,
      acquisitionMethod: 'map_pin',
      evidenceFiles: [],
      isAnonymous: true,
    })).rejects.toThrow(/Deskripsi laporan minimal 10 karakter/);
  });

  it('falls back to truthful demo submission when Supabase is not configured', async () => {
    const result = await submitCitizenReport({
      title: 'Tanggul Drainase Ambruk Dekat Pemukiman',
      description: 'Air meluap menggenangi jalan lingkungan setinggi 30 cm setiap hujan lebat.',
      category: 'Lingkungan & Drainase',
      severity: 'Kritis',
      subdistrict: 'Bogor Utara',
      preciseCoordinates: [-6.5800, 106.8100],
      isApproximate: false,
      acquisitionMethod: 'gps',
      evidenceFiles: [],
      isAnonymous: true,
    });

    expect(result.success).toBe(true);
    expect(result.publicReference).toMatch(/^TITIK-DEMO-\d{4}$/);
    expect(result.followUpToken).toHaveLength(64);
    expect(result.message).toContain('Mode Simulasi');
  });

  it('filters nearby similar reports within 600m in the same sector', () => {
    const mockReports: PublicCivicReport[] = [
      {
        id: 'rep-1',
        publicReference: 'TITIK-2026-0001',
        title: 'Banjir Drainase',
        description: 'Genangan saluran air',
        category: 'Lingkungan & Drainase',
        severity: 'Sedang',
        observedAt: '2026-10-17',
        status: 'published',
        subdistrict: 'Bogor Tengah',
        coordinates: [-6.5971, 106.8060],
        isApproximateLocation: false,
        locationMethod: 'gps',
        approvedMedia: [],
        events: [],
        relations: [],
        votesCount: 3,
        hasUserVoted: false,
        createdAt: '2026-10-17T00:00:00Z',
      },
      {
        id: 'rep-2',
        publicReference: 'TITIK-2026-0002',
        title: 'Jalan Rusak Jauh',
        description: 'Jalan berlubang',
        category: 'Infrastruktur Jalan',
        severity: 'Kritis',
        observedAt: '2026-10-17',
        status: 'published',
        subdistrict: 'Bogor Barat',
        coordinates: [-6.5500, 106.7500], // Far away
        isApproximateLocation: false,
        locationMethod: 'map_pin',
        approvedMedia: [],
        events: [],
        relations: [],
        votesCount: 1,
        hasUserVoted: false,
        createdAt: '2026-10-17T00:00:00Z',
      },
    ];

    // Search near rep-1 in Lingkungan & Drainase
    const near = findNearbySimilarReports(
      mockReports,
      -6.5973, // ~20 meters away
      106.8061,
      'Lingkungan & Drainase',
      600
    );

    expect(near).toHaveLength(1);
    expect(near[0].id).toBe('rep-1');

    // Search in different sector
    const wrongSector = findNearbySimilarReports(
      mockReports,
      -6.5973,
      106.8061,
      'Pendidikan',
      600
    );
    expect(wrongSector).toHaveLength(0);
  });
});
