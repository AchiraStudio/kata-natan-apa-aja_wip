import { describe, expect, it } from 'vitest';
import {
  getReportMediaType,
  hasExplicitAIGenerationMarker,
  hasRequiredReportEvidence,
  registerReportMediaType,
} from '../utils/reportEvidence';
import { MockDataAdapter } from '../services/adapters/mockAdapter';

describe('report evidence requirements', () => {
  it('requires both a photo and a video', () => {
    expect(hasRequiredReportEvidence(['data:image/jpeg;base64,photo', 'data:video/mp4;base64,video'])).toBe(true);
    expect(hasRequiredReportEvidence(['data:image/jpeg;base64,photo'])).toBe(false);
    expect(hasRequiredReportEvidence(['data:video/mp4;base64,video'])).toBe(false);
    expect(hasRequiredReportEvidence([])).toBe(false);
  });

  it('identifies uploaded video media from its URL type', () => {
    expect(getReportMediaType('data:video/webm;base64,video')).toBe('video');
    expect(getReportMediaType('/evidence/clip.mp4')).toBe('video');
    expect(getReportMediaType('data:image/png;base64,photo')).toBe('image');
  });

  it('preserves the media type of evidence restored from persistent blob URLs', () => {
    const videoUrl = 'blob:http://localhost/restored-video';
    const photoUrl = 'blob:http://localhost/restored-photo';
    registerReportMediaType(videoUrl, 'video/mp4');
    registerReportMediaType(photoUrl, 'image/jpeg');

    expect(getReportMediaType(videoUrl)).toBe('video');
    expect(getReportMediaType(photoUrl)).toBe('image');
  });

  it('detects explicit generative AI metadata markers without labeling ordinary files', () => {
    expect(hasExplicitAIGenerationMarker(new TextEncoder().encode('Software: Stable Diffusion'))).toBe(true);
    expect(hasExplicitAIGenerationMarker(new TextEncoder().encode('camera: Pixel 8'))).toBe(false);
  });

  it('adds both uploaded evidence types to the citizen report feed post', async () => {
    const adapter = new MockDataAdapter();
    await adapter.submitReport({
      title: 'Trotoar rusak dekat halte',
      description: 'Permukaan trotoar retak dan membahayakan pejalan kaki.',
      category: 'Infrastruktur',
      severity: 'high',
      address: 'Jl. Pajajaran, Bogor',
      latitude: -6.595,
      longitude: 106.79,
      mediaUrls: ['data:image/jpeg;base64,photo', 'data:video/mp4;base64,video'],
      reporterType: 'anonymous',
    });

    const [newPost] = await adapter.getFeedPosts();
    expect(newPost.media.map((media) => media.type)).toEqual(['image', 'video']);
    expect(newPost.relatedReport?.title).toBe('Trotoar rusak dekat halte');
    expect(await adapter.getSubmittedFeedPosts('for_you', 'Semua')).toContainEqual(newPost);
    expect(await adapter.getSubmittedFeedPosts('following', 'Semua')).toEqual([]);
  });

  it('returns only reports created by the requested signed-in account', async () => {
    const adapter = new MockDataAdapter();
    await adapter.submitReport({
      title: 'Lampu jalan mati',
      description: 'Lampu penerangan jalan sudah mati selama beberapa malam.',
      category: 'Infrastruktur',
      severity: 'medium',
      address: 'Jl. Merdeka, Bogor',
      latitude: -6.59,
      longitude: 106.8,
      mediaUrls: ['data:image/jpeg;base64,photo', 'data:video/mp4;base64,video'],
      reporterType: 'anonymous',
      reporterUserId: 'citizen-account-1',
    });
    await adapter.submitReport({
      title: 'Saluran air tersumbat',
      description: 'Saluran air tersumbat dan air meluap saat hujan.',
      category: 'Lingkungan',
      severity: 'high',
      address: 'Jl. Mawar, Bogor',
      latitude: -6.591,
      longitude: 106.801,
      mediaUrls: ['data:image/jpeg;base64,photo2', 'data:video/mp4;base64,video2'],
      reporterType: 'anonymous',
      reporterUserId: 'citizen-account-2',
    });

    const [myReport] = await adapter.getMyReports('citizen-account-1');
    expect(myReport.title).toBe('Lampu jalan mati');
    expect(await adapter.getMyReports('citizen-account-2')).toHaveLength(1);
    expect(await adapter.getMyReports('unknown-account')).toEqual([]);
  });

  it('shows admin status changes and notes in the reporter report history', async () => {
    const adapter = new MockDataAdapter();
    const { report } = await adapter.submitReport({
      title: 'Lampu jalan mati',
      description: 'Lampu penerangan jalan sudah mati selama beberapa malam.',
      category: 'Infrastruktur',
      severity: 'medium',
      address: 'Jl. Merdeka, Bogor',
      latitude: -6.59,
      longitude: 106.8,
      mediaUrls: ['data:image/jpeg;base64,photo', 'data:video/mp4;base64,video'],
      reporterType: 'anonymous',
      reporterUserId: 'citizen-account-1',
    });

    await adapter.updateReportStatus(report.id, 'under_review', 'Admin TITIK', 'Bukti laporan sedang diperiksa.');
    await adapter.updateReportStatus(report.id, 'rejected', 'Admin TITIK', 'Foto lokasi tidak sesuai.');

    const [reporterReport] = await adapter.getMyReports('citizen-account-1');
    expect(reporterReport.status).toBe('rejected');
    expect(reporterReport.events.slice(-2).map((event) => ({
      status: event.newStatus,
      description: event.description,
      actor: event.actorName,
    }))).toEqual([
      { status: 'under_review', description: 'Bukti laporan sedang diperiksa.', actor: 'Admin TITIK' },
      { status: 'rejected', description: 'Foto lokasi tidak sesuai.', actor: 'Admin TITIK' },
    ]);
  });
});
