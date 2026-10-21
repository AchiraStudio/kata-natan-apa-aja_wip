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
} from '../../types/domain';
import { FeedComment, IDataAdapter, NewReportInput, ReportSubmitResult } from './types';

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

const MOCK_REPORTS_STORAGE_KEY = 'titik_mock_reports_v2';
const MOCK_POSTS_STORAGE_KEY = 'titik_mock_posts_v2';

export class MockDataAdapter implements IDataAdapter {
  private reports: Report[] = loadStoredArray(MOCK_REPORTS_STORAGE_KEY, MOCK_REPORTS);
  private posts: Post[] = loadStoredArray(MOCK_POSTS_STORAGE_KEY, MOCK_POSTS);
  private comments: Record<string, FeedComment[]> = { ...MOCK_COMMENTS };
  private facilities: Facility[] = [...MOCK_FACILITIES];
  private budgetSectors: BudgetSectorContext[] = Object.values(MOCK_BUDGET_SECTORS);
  private referenceCounter = this.reports.reduce((nextReference, report) => {
    const suffix = Number(report.publicReference.slice(-6));
    return Number.isFinite(suffix) ? Math.max(nextReference, suffix + 1) : nextReference;
  }, 126);

  private persistReportsAndPosts(): void {
    try {
      localStorage.setItem(MOCK_REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
      localStorage.setItem(MOCK_POSTS_STORAGE_KEY, JSON.stringify(this.posts));
    } catch (err) {
      console.warn('Could not persist demo reports in this browser:', err);
    }
  }

  async getFeedPosts(tab: 'for_you' | 'following' | 'nearby' = 'for_you', category?: string): Promise<Post[]> {
    let result = [...this.posts];

    if (category && category !== 'Semua') {
      result = result.filter(
        (p) => p.relatedReport?.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tab === 'following') {
      result = result.filter((p) => p.author.username === 'sariwulan');
    }

    // Ensure related reports are up to date
    return result.map((post) => {
      if (post.relatedReportId) {
        const matched = this.reports.find((r) => r.id === post.relatedReportId);
        if (matched) {
          return { ...post, relatedReport: matched };
        }
      }
      return post;
    });
  }

  async getReportByReference(reference: string): Promise<Report | null> {
    const term = reference.trim().toLowerCase();
    const report = this.reports.find(
      (r) => r.publicReference.toLowerCase() === term || r.id.toLowerCase() === term
    );
    return report ? { ...report } : null;
  }

  async verifyReportTracking(reference: string, token: string): Promise<Report | null> {
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

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      publicReference: nextRefId,
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
          id: `ev-${Date.now()}-1`,
          reportId: `rep-${Date.now()}`,
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

    // Also create a linked community post in the feed
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: {
        id: `usr-${Date.now()}`,
        username: input.reporterType === 'anonymous' ? 'warga_anonim' : 'warga_bogor',
        displayName: input.reporterType === 'anonymous' ? 'Warga Anonim' : (input.reporterDisplayName || 'Warga Bogor'),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'citizen',
      },
      body: input.description.length > 140 ? `${input.description.slice(0, 140)}...` : input.description,
      postType: 'citizen_report',
      media: [
        {
          id: `med-${Date.now()}`,
          type: 'image',
          url: newReport.mediaUrls[0],
          aspectRatio: '9/16',
        },
      ],
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
    this.persistReportsAndPosts();

    return {
      report: newReport,
      publicReference: nextRefId,
      secretFollowUpToken: rawSecretToken,
    };
  }

  async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report> {
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
      actorType: 'moderator',
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
    this.persistReportsAndPosts();

    return updated;
  }

  async toggleReportSupport(reportId: string): Promise<{ supportCount: number; isSupported: boolean }> {
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
    this.persistReportsAndPosts();

    return { supportCount, isSupported };
  }

  async addComment(
    postId: string,
    authorName: string,
    avatarUrl: string,
    body: string,
    parentId?: string
  ): Promise<FeedComment> {
    const newComment = {
      id: `c-${Date.now()}`,
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
}

