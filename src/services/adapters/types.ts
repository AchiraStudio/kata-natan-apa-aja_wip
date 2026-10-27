import { Post, Report, ReportAttachment, ReportStatus, Facility, BudgetSectorContext, UserProfile } from '../../types/domain';

export interface NewReportInput {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  latitude: number;
  longitude: number;
  mediaUrls: string[];
  reporterUserId?: string;
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

export interface RejectedReportEdits {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
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
  getFeedPosts(tab?: 'for_you' | 'following' | 'nearby', category?: string, userId?: string): Promise<Post[]>;
  getMyReports(reporterUserId: string): Promise<Report[]>;
  getReportByReference(reference: string): Promise<Report | null>;
  verifyReportTracking(reference: string, token: string): Promise<Report | null>;
  submitReport(input: NewReportInput): Promise<ReportSubmitResult>;
  resubmitRejectedReport(
    reportId: string,
    reporterUserId: string,
    edits: RejectedReportEdits
  ): Promise<Report>;
  deleteReport(reportId: string): Promise<void>;
  updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report>;
  toggleReportSupport(reportId: string, userId?: string): Promise<{ supportCount: number; isSupported: boolean }>;
  togglePostSave(postId: string, userId?: string): Promise<{ savesCount: number; isSaved: boolean }>;
  togglePostLike(postId: string, userId?: string): Promise<{ likesCount: number; isLiked: boolean }>;
  getSavedPosts(userId: string): Promise<Post[]>;
  addComment(postId: string, authorName: string, avatarUrl: string, body: string, parentId?: string): Promise<FeedComment>;
  getComments(postId: string): Promise<FeedComment[]>;
  getFacilities(query?: string, category?: string): Promise<Facility[]>;
  getBudgetSectors(): Promise<BudgetSectorContext[]>;
  getAllReports(): Promise<Report[]>;
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  getUserPosts(userId: string): Promise<Post[]>;
  getUserReports(userId: string): Promise<Report[]>;
  getPostById(postId: string): Promise<Post | null>;
  updateProfile(payload: { displayName?: string; username?: string; avatarUrl?: string; bio?: string; district?: string }): Promise<UserProfile>;
}
