import { Post, Report, ReportAttachment, ReportStatus, Facility, BudgetSectorContext, UserProfile, EvidenceStatus } from '../../types/domain';

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
  authorId?: string;
}

export interface IDataAdapter {
  getFeedPosts(tab?: 'for_you' | 'following' | 'nearby', category?: string, userId?: string): Promise<Post[]>;
  getMyReports(reporterUserId: string): Promise<Report[]>;
  getReportByReference(reference: string, userId?: string): Promise<Report | null>;
  verifyReportTracking(reference: string, token: string): Promise<Report | null>;
  submitReport(input: NewReportInput): Promise<ReportSubmitResult>;
  resubmitRejectedReport(
    reportId: string,
    reporterUserId: string,
    edits: RejectedReportEdits
  ): Promise<Report>;
  submitAdditionalInfo(
    reportId: string,
    reporterUserId: string,
    additionalText: string,
    newMediaUrl?: string
  ): Promise<Report>;
  deleteReport(reportId: string): Promise<void>;
  updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report>;
  transitionReportStatus(
    reportId: string,
    targetStatus: ReportStatus,
    notes?: string,
    isInternal?: boolean,
    officialResponse?: string
  ): Promise<Report>;
  verifyReportEvidence(
    reportId: string,
    verificationStatus: EvidenceStatus,
    notes?: string
  ): Promise<Report>;
  saveOfficialResponse(
    reportId: string,
    officialResponse?: string,
    internalNotes?: string
  ): Promise<Report>;
  setCitizenVerification(
    userId: string,
    isVerified: boolean,
    notes?: string
  ): Promise<boolean>;
  getPrivateEvidenceSignedUrl(filePath: string): Promise<string>;
  toggleReportSupport(reportId: string, userId?: string): Promise<{ supportCount: number; isSupported: boolean }>;
  toggleReportSave(reportId: string, userId?: string): Promise<{ isSaved: boolean }>;
  togglePostSave(postId: string, userId?: string): Promise<{ savesCount: number; isSaved: boolean }>;
  togglePostLike(postId: string, userId?: string): Promise<{ likesCount: number; isLiked: boolean }>;
  getSavedPosts(userId: string): Promise<Post[]>;
  getSavedReports(userId: string): Promise<Report[]>;
  addComment(postId: string, authorName: string, avatarUrl: string, body: string, parentId?: string): Promise<FeedComment>;
  getComments(postId: string): Promise<FeedComment[]>;
  getFacilities(query?: string, category?: string): Promise<Facility[]>;
  createFacility(facility: Partial<Facility> & { name: string; category: string }): Promise<Facility>;
  getBudgetSectors(): Promise<BudgetSectorContext[]>;
  getAllReports(): Promise<Report[]>;
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  getUserPosts(userId: string): Promise<Post[]>;
  getUserReports(userId: string): Promise<Report[]>;
  getPostById(postId: string): Promise<Post | null>;
  updateProfile(payload: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    district?: string;
    bannerUrl?: string;
    backgroundTheme?: string;
    websiteUrl?: string;
    customStatus?: string;
  }): Promise<UserProfile>;
}
