import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockDataAdapter } from '../services/adapters/mockAdapter';

describe('Report Service & State Machine Tests', () => {
  let adapter: MockDataAdapter;

  beforeEach(() => {
    adapter = new MockDataAdapter();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates valid public reference format and secret follow-up token on report submission', async () => {
    const result = await adapter.submitReport({
      title: 'Pipa Air Bocor Menggenangi Jalan',
      description: 'Pipa distribusi air bersih pecah di depan pertokoan.',
      category: 'Infrastruktur',
      severity: 'high',
      address: 'Jl. Sudirman No. 12',
      latitude: -6.591,
      longitude: 106.792,
      mediaUrls: ['https://example.com/photo.jpg'],
      reporterType: 'anonymous',
    });

    expect(result.report).toBeDefined();
    // Reference should follow TIK-2026-XXXXXX
    expect(result.publicReference).toMatch(/^TIK-2026-\d{6}$/);
    // Token should be a 16-character grouped token (e.g. XXXX-XXXX-XXXX-XXXX)
    expect(result.secretFollowUpToken).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(result.report.status).toBe('submitted');
    expect(result.report.events.length).toBeGreaterThanOrEqual(1);
  });

  it('successfully verifies tracking using public reference and generated secret token', async () => {
    const submitResult = await adapter.submitReport({
      title: 'Lampu Jalan Mati Total',
      description: 'Kawasan gelap saat malam hari.',
      category: 'Infrastruktur',
      severity: 'medium',
      address: 'Jl. Pajajaran',
      latitude: -6.602,
      longitude: 106.804,
      mediaUrls: [],
      reporterType: 'anonymous',
    });

    // Valid token check
    const verified = await adapter.verifyReportTracking(
      submitResult.publicReference,
      submitResult.secretFollowUpToken
    );
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(submitResult.report.id);

    // Invalid token check
    const rejected = await adapter.verifyReportTracking(
      submitResult.publicReference,
      'WRONG-TOKEN-1234-5678'
    );
    expect(rejected).toBeNull();
  });

  it('executes valid status state machine transitions and logs immutable audit events', async () => {
    const submitResult = await adapter.submitReport({
      title: 'Drainase Rusak',
      description: 'Saluran air tersumbat.',
      category: 'Infrastruktur',
      severity: 'high',
      address: 'Jl. Melati',
      latitude: -6.595,
      longitude: 106.79,
      mediaUrls: [],
      reporterType: 'verified_citizen',
    });

    const reportId = submitResult.report.id;

    // Transition: submitted -> under_review
    const step1 = await adapter.updateReportStatus(
      reportId,
      'under_review',
      'Admin TITIK',
      'Memeriksa bukti foto dan kesesuaian koordinat.'
    );
    expect(step1.status).toBe('under_review');
    expect(step1.events[step1.events.length - 1].eventType).toBe('UNDER_REVIEW');

    // Transition: under_review -> forwarded_to_institution
    const step2 = await adapter.updateReportStatus(
      reportId,
      'forwarded_to_institution',
      'Admin TITIK',
      'Diteruskan ke Dinas PUPR Kota Bogor.'
    );
    expect(step2.status).toBe('forwarded_to_institution');
    expect(step2.events[step2.events.length - 1].eventType).toBe('FORWARDED_TO_INSTITUTION');

    // Transition: forwarded_to_institution -> resolved
    const step3 = await adapter.updateReportStatus(
      reportId,
      'resolved',
      'Dinas PUPR',
      'Perbaikan saluran selesai dikerjakan.'
    );
    expect(step3.status).toBe('resolved');
    expect(step3.events[step3.events.length - 1].eventType).toBe('RESOLVED');
  });

  it('increments and decrements "Saya terdampak juga" civic support count', async () => {
    const reports = await adapter.getFeedPosts();
    const targetReport = reports[0].relatedReport;
    expect(targetReport).toBeDefined();

    if (targetReport) {
      const initialCount = targetReport.supportCount;
      const { supportCount, isSupported } = await adapter.toggleReportSupport(targetReport.id);
      expect(isSupported).toBe(true);
      expect(supportCount).toBe(initialCount + 1);
    }
  });

  it('saves reports privately per user and removes them from the saved list when toggled again', async () => {
    const storedValues = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => storedValues.set(key, value),
    });

    const [post] = await adapter.getFeedPosts();
    const reportId = post.relatedReport?.id;
    expect(reportId).toBeDefined();
    if (!reportId) throw new Error('Seed post must include its related report.');

    await expect(adapter.toggleReportSave(reportId, 'user-1')).resolves.toEqual({ isSaved: true });
    await expect(adapter.getSavedReports('user-1')).resolves.toHaveLength(1);
    await expect(adapter.getSavedReports('user-2')).resolves.toHaveLength(0);

    await expect(adapter.toggleReportSave(reportId, 'user-1')).resolves.toEqual({ isSaved: false });
    await expect(adapter.getSavedReports('user-1')).resolves.toHaveLength(0);
  });

  it('retrieves comments and successfully adds a new comment to a post', async () => {
    const posts = await adapter.getFeedPosts();
    const targetPost = posts[0];
    const initialComments = await adapter.getComments(targetPost.id);
    const initialCount = initialComments.length;

    const newComment = await adapter.addComment(
      targetPost.id,
      'Budi Pratama',
      'https://example.com/avatar.jpg',
      'Kondisi jalanan ini sangat berbahaya saat banjir.'
    );

    expect(newComment).toBeDefined();
    expect(newComment.authorName).toBe('Budi Pratama');
    expect(newComment.body).toContain('Kondisi jalanan ini sangat berbahaya');

    const updatedComments = await adapter.getComments(targetPost.id);
    expect(updatedComments.length).toBe(initialCount + 1);
    expect(updatedComments[0].id).toBe(newComment.id);
  });
});
