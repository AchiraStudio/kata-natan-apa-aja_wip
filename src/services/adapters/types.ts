import { Post, Report, ReportAttachment, ReportStatus, Facility, BudgetSectorContext } from '../../types/domain';

export interface NewReportInput {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  latitude: number;
  longitude: number;
  mediaUrls: string[];
  facilityName?: string;
  estimatedCost?: number;
  supportingDocuments?: ReportAttachment[];
  reporterType: 'anonymous' | 'verified_citizen';
  reporterDisplayName?: string;
}

export interface ReportSubmitResult {
  report: Report;
  publicReference: string;
  secretFollowUpToken: string; // Plaintext token shown once to reporter
}

export interface FeedComment {
  id: string;
  authorName: string;
  avatarUrl: string;
  body: string;
  timeAgo: string;
  likes: number;
  parentId?: string;
}

export interface IDataAdapter {
  getFeedPosts(tab?: 'for_you' | 'following' | 'nearby', category?: string): Promise<Post[]>;
  getReportByReference(reference: string): Promise<Report | null>;
  verifyReportTracking(reference: string, token: string): Promise<Report | null>;
  submitReport(input: NewReportInput): Promise<ReportSubmitResult>;
  updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report>;
  toggleReportSupport(reportId: string): Promise<{ supportCount: number; isSupported: boolean }>;
  addComment(postId: string, authorName: string, avatarUrl: string, body: string, parentId?: string): Promise<FeedComment>;
  getComments(postId: string): Promise<FeedComment[]>;
  getFacilities(query?: string, category?: string): Promise<Facility[]>;
  getBudgetSectors(): Promise<BudgetSectorContext[]>;
}

