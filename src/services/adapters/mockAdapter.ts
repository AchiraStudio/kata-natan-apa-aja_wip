import {
  MOCK_POSTS,
  MOCK_REPORTS,
  MOCK_COMMENTS,
  MOCK_FACILITIES,
  MOCK_BUDGET_SECTORS,
} from '../../data/mockCivicData';
import {
  Post,
  Report,
  ReportStatus,
  ReportEvent,
  Facility,
  BudgetSectorContext,
  UserProfile,
  EvidenceStatus,
} from '../../types/domain';
import { FeedComment, IDataAdapter, NewReportInput, RejectedReportEdits, ReportSubmitResult } from './types';
import { DataError } from '../errors/DataError';
import { getReportMediaType } from '../../utils/reportEvidence';
import { loadPersistedReports, savePersistedReports } from '../reportPersistence';
import { generatePostId, generateReportId, generateCommentId } from '../../utils/idGenerator';

// Simple client-safe hashing representation for mock/offline mode
function simpleHash(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `hash_${Math.abs(hash).toString(16)}`;
}

function generateSecretToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
}

function loadStoredArray<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : (JSON.parse(JSON.stringify(fallback)) as T[]);
  } catch {
    return JSON.parse(JSON.stringify(fallback)) as T[];
  }
}

const MOCK_REPORTS_STORAGE_KEY = 'titik_mock_reports_v3';
const MOCK_POSTS_STORAGE_KEY = 'titik_mock_posts_v3';
const DELETED_REPORTS_STORAGE_KEY = 'titik_deleted_reports_v1';
const SAVED_REPORTS_STORAGE_KEY = 'titik_mock_saved_reports_v1';

const isTestEnv =
  typeof process !== 'undefined' &&
  (Boolean(process.env?.VITEST) || process.env?.NODE_ENV === 'test');

function sanitizeSeedMetrics<T extends Post | Report>(items: T[]): T[] {
  if (isTestEnv) return items;
  return items.map((item) => {
    if ('supportCount' in item && 'likesCount' in item) {
      const p = item as unknown as Post;
      return {
        ...p,
        supportCount: 0,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        isSupportedByMe: false,
        isLikedByMe: false,
        isSavedByMe: false,
        relatedReport: p.relatedReport
          ? { ...p.relatedReport, supportCount: 0, isSupportedByMe: false }
          : undefined,
      } as unknown as T;
    }
    if ('supportCount' in item) {
      const r = item as unknown as Report;
      return {
        ...r,
        supportCount: 0,
        isSupportedByMe: false,
      } as unknown as T;
    }
    return item;
  });
}

export class MockDataAdapter implements IDataAdapter {
  private deletedReportIds = new Set(loadStoredArray<string>(DELETED_REPORTS_STORAGE_KEY, []));
  private reports: Report[] = sanitizeSeedMetrics(
    loadStoredArray(MOCK_REPORTS_STORAGE_KEY, MOCK_REPORTS)
  ).filter((report) => !this.deletedReportIds.has(report.id));
  private posts: Post[] = sanitizeSeedMetrics(
    loadStoredArray(MOCK_POSTS_STORAGE_KEY, MOCK_POSTS)
  ).filter((post) => !post.relatedReportId || !this.deletedReportIds.has(post.relatedReportId));
  private submittedPostIds = new Set(
    this.posts.filter((post) => !MOCK_POSTS.some((seedPost) => seedPost.id === post.id)).map((post) => post.id)
  );
  private submittedReportIds = new Set(
    this.reports.filter((report) => !MOCK_REPORTS.some((seedReport) => seedReport.id === report.id)).map((report) => report.id)
  );
  private persistenceLoad: Promise<void> | null = null;
  private comments: Record<string, FeedComment[]> = isTestEnv ? { ...MOCK_COMMENTS } : {};
  private facilities: Facility[] = [...MOCK_FACILITIES];
  private budgetSectors: BudgetSectorContext[] = Object.values(MOCK_BUDGET_SECTORS);
  private referenceCounter = this.getNextReferenceCounter();

  private getNextReferenceCounter(): number {
    return this.reports.reduce((nextReference, report) => {
      const suffix = Number(report.publicReference.slice(-6));
      return Number.isFinite(suffix) ? Math.max(nextReference, suffix + 1) : nextReference;
    }, 126);
  }

  private async ensurePersistedReportsLoaded(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.persistenceLoad) {
      this.persistenceLoad = loadPersistedReports()
        .then((persisted) => {
          if (!persisted) return;
          const existingReportIds = new Set(this.reports.map((report) => report.id));
          const existingPostIds = new Set(this.posts.map((post) => post.id));
          const addedReports = persisted.reports.filter((report) => (
            !existingReportIds.has(report.id) && !this.deletedReportIds.has(report.id)
          ));
          const addedPosts = persisted.posts.filter((post) => (
            !existingPostIds.has(post.id)
            && (!post.relatedReportId || !this.deletedReportIds.has(post.relatedReportId))
          ));
          this.reports = [...addedReports, ...this.reports];
          this.posts = [...addedPosts, ...this.posts];
          addedReports.forEach((report) => this.submittedReportIds.add(report.id));
          addedPosts.forEach((post) => this.submittedPostIds.add(post.id));
          this.referenceCounter = this.getNextReferenceCounter();
        })
        .catch((error: unknown) => {
          this.persistenceLoad = null;
          throw error;
        });
    }
    await this.persistenceLoad;
  }

  private async persistReportsAndPosts(): Promise<void> {
    if (typeof window === 'undefined') return;
    const reports = this.reports.filter((report) => this.submittedReportIds.has(report.id));
    const posts = this.posts.filter((post) => this.submittedPostIds.has(post.id));
    await savePersistedReports(reports, posts);
  }

  async getFeedPosts(tab: 'for_you' | 'following' | 'nearby' = 'for_you', category?: string, userId?: string): Promise<Post[]> {
    await this.ensurePersistedReportsLoaded();
    let result = [...this.posts];

    if (category && category !== 'Semua') {
      result = result.filter(
        (p) => p.relatedReport?.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tab === 'following') {
      result = result.filter((p) => p.author.username === 'sariwulan');
    }

    // Ensure related reports and dynamic comment counts are up to date
    const savedReportIds = new Set(
      userId ? loadStoredArray<string>(`${SAVED_REPORTS_STORAGE_KEY}_${userId}`, []) : []
    );
    return result.map((post) => {
      const dynamicCount = isTestEnv
        ? post.commentsCount
        : (this.comments[post.id] || []).length;
      let matched = post.relatedReport;
      if (post.relatedReportId) {
        matched = this.reports.find((r) => r.id === post.relatedReportId) || matched;
      }
      return {
        ...post,
        commentsCount: dynamicCount,
        relatedReport: matched
          ? { ...matched, isSavedByMe: savedReportIds.has(matched.id) }
          : undefined,
      };
    });
  }

  async getSubmittedFeedPosts(
    tab: 'for_you' | 'following' | 'nearby' = 'for_you',
    category?: string,
    userId?: string
  ): Promise<Post[]> {
    await this.ensurePersistedReportsLoaded();
    const feed = await this.getFeedPosts(tab, category, userId);
    return feed.filter((post) => this.submittedPostIds.has(post.id));
  }

  async getMyReports(reporterUserId: string): Promise<Report[]> {
    await this.ensurePersistedReportsLoaded();
    return this.reports
      .filter((report) => report.reporterUserId === reporterUserId)
      .map((report) => ({ ...report }));
  }

  async getReportByReference(reference: string, userId?: string): Promise<Report | null> {
    await this.ensurePersistedReportsLoaded();
    const term = reference.trim().toLowerCase();
    const report = this.reports.find(
      (r) => r.publicReference.toLowerCase() === term || r.id.toLowerCase() === term
    );
    return report
      ? {
          ...report,
          isSavedByMe: userId
            ? loadStoredArray<string>(`${SAVED_REPORTS_STORAGE_KEY}_${userId}`, []).includes(report.id)
            : false,
        }
      : null;
  }

  async verifyReportTracking(reference: string, token: string): Promise<Report | null> {
    await this.ensurePersistedReportsLoaded();
    const report = await this.getReportByReference(reference);
    if (!report || !report.secretFollowUpTokenHash) {
      return null;
    }

    const hashedInput = simpleHash(token.trim().toUpperCase());
    if (report.secretFollowUpTokenHash === hashedInput) {
      return { ...report };
    }
    return null;
  }

  async submitReport(input: NewReportInput): Promise<ReportSubmitResult> {
    await this.ensurePersistedReportsLoaded();
    const nextRefId = `TIK-2026-${String(this.referenceCounter++).padStart(6, '0')}`;
    const rawSecretToken = generateSecretToken();
    const tokenHash = simpleHash(rawSecretToken);

    // Resolve sector budget matching category
    let matchedSector = MOCK_BUDGET_SECTORS.drainase;
    if (input.category === 'Lingkungan') matchedSector = MOCK_BUDGET_SECTORS.persampahan;
    if (input.category === 'Infrastruktur' && input.title.toLowerCase().includes('pju'))
      matchedSector = MOCK_BUDGET_SECTORS.pju;
    if (input.category === 'Infrastruktur' && input.title.toLowerCase().includes('jalan'))
      matchedSector = MOCK_BUDGET_SECTORS.jalan;

    const newReportId = generateReportId();
    const newPostId = generatePostId();

    const newReport: Report = {
      id: newReportId,
      publicReference: nextRefId,
      reporterUserId: input.reporterUserId,
      secretFollowUpTokenHash: tokenHash,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      status: 'submitted',
      publicationStatus: 'published',
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        district: 'Bogor Tengah',
        city: 'Kota Bogor',
        province: 'Jawa Barat',
      },
      facilityName: input.facilityName || 'Fasilitas Wilayah Kota Bogor',
      estimatedCost: input.estimatedCost,
      responsibleAgency: matchedSector.responsibleAgency,
      mediaUrls: input.mediaUrls.length > 0 ? input.mediaUrls : ['https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=1000&auto=format&fit=crop'],
      supportingDocuments: input.supportingDocuments || [],
      reporterType: input.reporterType,
      reporterDisplayName: input.reporterType === 'anonymous' ? undefined : (input.reporterDisplayName || 'Warga Terverifikasi'),
      supportCount: 1,
      isSupportedByMe: true,
      budgetContext: matchedSector,
      events: [
        {
          id: `ev-${newReportId}-1`,
          reportId: newReportId,
          eventType: 'SUBMITTED',
          newStatus: 'submitted',
          actorType: 'citizen',
          actorName: input.reporterType === 'anonymous' ? 'Warga Anonim' : (input.reporterDisplayName || 'Warga'),
          description: 'Laporan resmi dikirimkan dan tercatat dalam sistem audit publik.',
          timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSampleData: true,
    };

    this.reports.unshift(newReport);
    this.submittedReportIds.add(newReport.id);

    // Also create a linked community post in the feed
    const newPost: Post = {
      id: newPostId,
      author: {
        id: `usr-${Date.now()}`,
        username: input.reporterType === 'anonymous' ? 'warga_anonim' : 'warga_bogor',
        displayName: input.reporterType === 'anonymous' ? 'Warga Anonim' : (input.reporterDisplayName || 'Warga Bogor'),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'citizen',
      },
      body: input.description.length > 140 ? `${input.description.slice(0, 140)}...` : input.description,
      postType: 'citizen_report',
      media: newReport.mediaUrls.map((url, index) => ({
        id: `med-${Date.now()}-${index}`,
        type: getReportMediaType(url),
        url,
        aspectRatio: '9/16',
      })),
      locationTag: input.address,
      relatedReportId: newReport.id,
      relatedReport: newReport,
      supportCount: 1,
      isSupportedByMe: true,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      createdAt: 'Baru saja',
      isSampleData: true,
    };

    this.posts.unshift(newPost);
    this.submittedPostIds.add(newPost.id);
    await this.persistReportsAndPosts();

    return {
      report: newReport,
      publicReference: nextRefId,
      secretFollowUpToken: rawSecretToken,
    };
  }

  async resubmitRejectedReport(
    reportId: string,
    reporterUserId: string,
    edits: RejectedReportEdits
  ): Promise<Report> {
    await this.ensurePersistedReportsLoaded();
    const reportIndex = this.reports.findIndex((report) => report.id === reportId);
    const current = this.reports[reportIndex];
    if (!current || current.reporterUserId !== reporterUserId) {
      throw new Error('Laporan tidak ditemukan di akun Anda.');
    }
    if (current.status !== 'rejected') {
      throw new Error('Hanya laporan yang ditolak yang dapat diperbaiki dan dikirim ulang.');
    }
    if (!edits.title.trim() || !edits.description.trim() || !edits.category.trim() || !edits.address.trim()) {
      throw new Error('Judul, deskripsi, kategori, dan alamat wajib diisi.');
    }

    let matchedSector = MOCK_BUDGET_SECTORS.drainase;
    if (edits.category === 'Lingkungan') matchedSector = MOCK_BUDGET_SECTORS.persampahan;
    if (edits.category === 'Infrastruktur' && edits.title.toLowerCase().includes('pju')) {
      matchedSector = MOCK_BUDGET_SECTORS.pju;
    }
    if (edits.category === 'Infrastruktur' && edits.title.toLowerCase().includes('jalan')) {
      matchedSector = MOCK_BUDGET_SECTORS.jalan;
    }

    const updated: Report = {
      ...current,
      title: edits.title.trim(),
      description: edits.description.trim(),
      category: edits.category,
      severity: edits.severity,
      location: { ...current.location, address: edits.address.trim() },
      responsibleAgency: matchedSector.responsibleAgency,
      budgetContext: matchedSector,
      status: 'submitted',
      updatedAt: new Date().toISOString(),
      events: [
        ...current.events,
        {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          reportId: current.id,
          eventType: 'RESUBMITTED',
          previousStatus: current.status,
          newStatus: 'submitted',
          actorType: 'citizen',
          actorName: current.reporterDisplayName || 'Pelapor',
          description: 'Pelapor memperbaiki laporan dan mengirimkannya kembali untuk ditinjau.',
          timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
        },
      ],
    };

    this.reports[reportIndex] = updated;
    this.posts = this.posts.map((post) => (
      post.relatedReportId === reportId
        ? {
            ...post,
            body: updated.description.length > 140
              ? `${updated.description.slice(0, 140)}...`
              : updated.description,
            locationTag: updated.location.address,
            relatedReport: updated,
          }
        : post
    ));
    await this.persistReportsAndPosts();
    return updated;
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.ensurePersistedReportsLoaded();
    if (!this.reports.some((report) => report.id === reportId)) {
      throw new Error(`Laporan ${reportId} tidak ditemukan.`);
    }

    const previousReports = this.reports;
    const previousPosts = this.posts;
    const wasSubmittedReport = this.submittedReportIds.has(reportId);
    const removedPosts = this.posts.filter((post) => post.relatedReportId === reportId);
    this.reports = this.reports.filter((report) => report.id !== reportId);
    this.posts = this.posts.filter((post) => post.relatedReportId !== reportId);
    this.submittedReportIds.delete(reportId);
    removedPosts.forEach((post) => this.submittedPostIds.delete(post.id));
    this.deletedReportIds.add(reportId);

    try {
      if (typeof globalThis.localStorage?.setItem === 'function') {
        globalThis.localStorage.setItem(
          DELETED_REPORTS_STORAGE_KEY,
          JSON.stringify([...this.deletedReportIds])
        );
      }
      await this.persistReportsAndPosts();
    } catch (error) {
      this.reports = previousReports;
      this.posts = previousPosts;
      if (wasSubmittedReport) this.submittedReportIds.add(reportId);
      removedPosts.forEach((post) => this.submittedPostIds.add(post.id));
      this.deletedReportIds.delete(reportId);
      try {
        if (typeof globalThis.localStorage?.setItem === 'function') {
          globalThis.localStorage.setItem(
            DELETED_REPORTS_STORAGE_KEY,
            JSON.stringify([...this.deletedReportIds])
          );
        }
      } catch (storageError) {
        console.error('Failed to restore deleted report marker after deletion failure:', storageError);
      }
      throw error;
    }
  }

  async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report> {
    await this.ensurePersistedReportsLoaded();
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    const current = this.reports[reportIndex];
    const previousStatus = current.status;

    const newEvent: ReportEvent = {
      id: `ev-${Date.now()}`,
      reportId: current.id,
      eventType: newStatus.toUpperCase(),
      previousStatus,
      newStatus,
      actorType: 'agency_officer',
      actorName,
      description,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
    };

    const updated: Report = {
      ...current,
      status: newStatus,
      events: [...current.events, newEvent],
      updatedAt: new Date().toISOString(),
    };

    this.reports[reportIndex] = updated;

    // Synchronize posts
    this.posts = this.posts.map((p) => {
      if (p.relatedReportId === reportId) {
        return { ...p, relatedReport: updated };
      }
      return p;
    });
    await this.persistReportsAndPosts();

    return updated;
  }

  async transitionReportStatus(
    reportId: string,
    targetStatus: ReportStatus,
    notes?: string,
    isInternal = false,
    officialResponse?: string
  ): Promise<Report> {
    await this.ensurePersistedReportsLoaded();
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) {
      throw new DataError('not_found', `Report with ID ${reportId} not found.`);
    }

    if (targetStatus === 'rejected' && (!notes || !notes.trim()) && (!officialResponse || !officialResponse.trim())) {
      throw new DataError('validation', 'Tuliskan saran perbaikan yang jelas sebelum menolak laporan.');
    }
    if (targetStatus === 'needs_info' && (!notes || !notes.trim()) && (!officialResponse || !officialResponse.trim())) {
      throw new DataError('validation', 'Catatan klarifikasi wajib diisi untuk status Butuh Info.');
    }

    const current = this.reports[reportIndex];
    const previousStatus = current.status;

    const newEvents: ReportEvent[] = [
      ...current.events,
      {
        id: `ev-${Date.now()}`,
        reportId: current.id,
        eventType: targetStatus.toUpperCase(),
        previousStatus,
        newStatus: targetStatus,
        actorType: 'agency_officer',
        actorName: 'Admin TITIK',
        description: officialResponse?.trim() || notes?.trim() || `Status diperbarui menjadi ${targetStatus}`,
        notes: notes?.trim() || undefined,
        isInternal: false,
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      },
    ];

    if (isInternal && notes?.trim()) {
      newEvents.push({
        id: `ev-${Date.now()}-internal`,
        reportId: current.id,
        eventType: 'INTERNAL_REVIEW_NOTE',
        previousStatus,
        newStatus: targetStatus,
        actorType: 'agency_officer',
        actorName: 'Admin TITIK',
        description: notes.trim(),
        notes: notes.trim(),
        isInternal: true,
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      });
    }

    const updated: Report = {
      ...current,
      status: targetStatus,
      officialResponse: officialResponse?.trim() || current.officialResponse,
      official_response: officialResponse?.trim() || current.official_response,
      internalNotes: isInternal && notes?.trim() ? notes.trim() : current.internalNotes,
      internal_notes: isInternal && notes?.trim() ? notes.trim() : current.internal_notes,
      events: newEvents,
      updatedAt: new Date().toISOString(),
    };

    this.reports[reportIndex] = updated;

    this.posts = this.posts.map((p) => {
      if (p.relatedReportId === reportId) {
        return { ...p, relatedReport: updated };
      }
      return p;
    });
    await this.persistReportsAndPosts();

    return updated;
  }

  async verifyReportEvidence(
    reportId: string,
    verificationStatus: EvidenceStatus,
    notes?: string
  ): Promise<Report> {
    await this.ensurePersistedReportsLoaded();
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) {
      throw new DataError('not_found', `Report with ID ${reportId} not found.`);
    }

    const current = this.reports[reportIndex];
    const newEvent: ReportEvent = {
      id: `ev-${Date.now()}-evidence`,
      reportId: current.id,
      eventType: 'EVIDENCE_VERIFICATION',
      actorType: 'agency_officer',
      actorName: 'Admin TITIK',
      description: notes?.trim() || `Bukti fisik diverifikasi sebagai ${verificationStatus}`,
      notes: notes?.trim() || undefined,
      isInternal: false,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
    };

    const updated: Report = {
      ...current,
      evidenceVerificationStatus: verificationStatus,
      evidence_verification_status: verificationStatus,
      events: [...current.events, newEvent],
      updatedAt: new Date().toISOString(),
    };

    this.reports[reportIndex] = updated;
    await this.persistReportsAndPosts();
    return updated;
  }

  async setCitizenVerification(
    _userId: string,
    _isVerified: boolean,
    _notes?: string
  ): Promise<boolean> {
    return true;
  }

  async getPrivateEvidenceSignedUrl(filePath: string): Promise<string> {
    return `https://supabase.local/storage/v1/object/sign/report-evidence-private/${filePath}?token=exp_${Date.now() + 3600000}`;
  }

  async toggleReportSupport(reportId: string, _userId?: string): Promise<{ supportCount: number; isSupported: boolean }> {
    await this.ensurePersistedReportsLoaded();
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const wasSupported = report.isSupportedByMe ?? false;
    const isSupported = !wasSupported;
    const supportCount = isSupported ? report.supportCount + 1 : Math.max(0, report.supportCount - 1);

    report.isSupportedByMe = isSupported;
    report.supportCount = supportCount;

    // Sync matching post
    this.posts.forEach((p) => {
      if (p.relatedReportId === reportId) {
        p.isSupportedByMe = isSupported;
        p.supportCount = supportCount;
      }
    });
    await this.persistReportsAndPosts();

    return { supportCount, isSupported };
  }

  async toggleReportSave(reportId: string, userId?: string): Promise<{ isSaved: boolean }> {
    if (!userId) {
      throw new DataError('auth', 'Autentikasi diperlukan untuk menyimpan laporan.');
    }
    await this.ensurePersistedReportsLoaded();
    const report = this.reports.find((item) => item.id === reportId);
    if (!report) throw new DataError('not_found', 'Laporan tidak ditemukan.');

    const storageKey = `${SAVED_REPORTS_STORAGE_KEY}_${userId}`;
    const savedIds = new Set(loadStoredArray<string>(storageKey, []));
    const isSaved = !savedIds.has(reportId);
    if (isSaved) savedIds.add(reportId);
    else savedIds.delete(reportId);

    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify([...savedIds]));
    } catch (err) {
      throw new DataError('network', 'Gagal menyimpan laporan di perangkat ini.', err);
    }
    return { isSaved };
  }

  async togglePostSave(postId: string, _userId: string): Promise<{ savesCount: number; isSaved: boolean }> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }
    const wasSaved = post.isSavedByMe ?? false;
    const isSaved = !wasSaved;
    const savesCount = isSaved ? post.savesCount + 1 : Math.max(0, post.savesCount - 1);
    post.isSavedByMe = isSaved;
    post.savesCount = savesCount;
    await this.persistReportsAndPosts();
    return { savesCount, isSaved };
  }

  async togglePostLike(postId: string, _userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }
    const wasLiked = post.isLikedByMe ?? false;
    const isLiked = !wasLiked;
    const likesCount = isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1);
    post.isLikedByMe = isLiked;
    post.likesCount = likesCount;
    await this.persistReportsAndPosts();
    return { likesCount, isLiked };
  }

  async getSavedPosts(_userId: string): Promise<Post[]> {
    return this.posts.filter((p) => p.isSavedByMe);
  }

  async getSavedReports(userId: string): Promise<Report[]> {
    await this.ensurePersistedReportsLoaded();
    const savedIds = new Set(
      loadStoredArray<string>(`${SAVED_REPORTS_STORAGE_KEY}_${userId}`, [])
    );
    return this.reports
      .filter((report) => savedIds.has(report.id))
      .map((report) => ({ ...report, isSavedByMe: true }));
  }

  async addComment(
    postId: string,
    authorName: string,
    avatarUrl: string,
    body: string,
    parentId?: string
  ): Promise<FeedComment> {
    const newComment = {
      id: generateCommentId(),
      authorName,
      avatarUrl,
      body,
      timeAgo: 'Baru saja',
      likes: 0,
      ...(parentId ? { parentId } : {}),
    };

    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }
    this.comments[postId].unshift(newComment);

    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount += 1;
    }

    return newComment;
  }

  async getComments(postId: string): Promise<FeedComment[]> {
    return this.comments[postId] || [];
  }

  async getFacilities(query?: string, category?: string): Promise<Facility[]> {
    let result = [...this.facilities];
    if (category && category !== 'Semua') {
      result = result.filter((f) => f.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getBudgetSectors(): Promise<BudgetSectorContext[]> {
    return [...this.budgetSectors];
  }

  async getAllReports(): Promise<Report[]> {
    return [...this.reports];
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const foundPost = this.posts.find((p) => p.author.username.toLowerCase() === clean);
    if (foundPost) {
      return {
        id: foundPost.author.id,
        username: foundPost.author.username,
        displayName: foundPost.author.displayName,
        avatarUrl: foundPost.author.avatarUrl,
        role: foundPost.author.role,
        bio: undefined,
        district: undefined,
        isVerified: foundPost.author.isVerified ?? false,
        createdAt: '2026-01-15T08:00:00Z',
        bannerUrl: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
        backgroundTheme: 'editorial_forest',
        websiteUrl: undefined,
        customStatus: undefined,
      };
    }
    return {
      id: 'usr-' + clean,
      username: clean,
      displayName: clean.charAt(0).toUpperCase() + clean.slice(1),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'citizen',
      bio: undefined,
      district: undefined,
      isVerified: false,
      createdAt: new Date().toISOString(),
      bannerUrl: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
      backgroundTheme: 'editorial_forest',
      websiteUrl: undefined,
      customStatus: undefined,
    };
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.posts.filter((p) => p.author.id === userId || p.author.username === userId);
  }

  async getUserReports(userId: string): Promise<Report[]> {
    const savedIds = new Set(
      loadStoredArray<string>(`${SAVED_REPORTS_STORAGE_KEY}_${userId}`, [])
    );
    return this.reports
      .filter((r) => r.reporterUserId === userId && r.reporterType !== 'anonymous')
      .map((report) => ({ ...report, isSavedByMe: savedIds.has(report.id) }));
  }

  async getPostById(postId: string): Promise<Post | null> {
    const found = this.posts.find((p) => p.id === postId);
    if (!found) return null;
    return {
      ...found,
      commentsCount: isTestEnv ? found.commentsCount : (this.comments[found.id] || []).length,
    };
  }

  async updateProfile(payload: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    district?: string;
    bannerUrl?: string;
    backgroundTheme?: string;
    websiteUrl?: string;
    customStatus?: string;
  }): Promise<UserProfile> {
    return {
      id: 'usr-current',
      username: payload.username || 'warga_bogor',
      displayName: payload.displayName || 'Warga Bogor',
      avatarUrl: payload.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'citizen',
      bio: payload.bio || undefined,
      district: payload.district || undefined,
      isVerified: false,
      createdAt: new Date().toISOString(),
      bannerUrl: payload.bannerUrl !== undefined ? (payload.bannerUrl || undefined) : 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
      backgroundTheme: payload.backgroundTheme || 'editorial_forest',
      websiteUrl: payload.websiteUrl || undefined,
      customStatus: payload.customStatus || undefined,
    };
  }
}
