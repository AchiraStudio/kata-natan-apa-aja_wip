// =============================================================================
// Seed Fixtures Self-Contained Type Definitions (CLI / Seed Pipeline)
// Isolated from src/ to ensure zero mock coupling in application bundle
// =============================================================================

export interface FeedComment {
  id: string;
  authorName: string;
  avatarUrl: string;
  body: string;
  timeAgo?: string;
  likes?: number;
  parentId?: string;
}

export interface BudgetSectorContext {
  sectorId: string;
  sectorName: string;
  subSectorName: string;
  paguAllocation: number;
  realizedSpending: number;
  executionRatePercent: number;
  fiscalYear: number;
  responsibleAgency: string;
  agencyAcronym: string;
  responsivenessScore: number;
  avgResolutionDays: number;
  lastUpdated: string;
  dataSource: string;
  isSampleData: boolean;
}

export interface Facility {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  responsibleAgency: string;
  activeReportsCount?: number;
  resolvedReportsCount?: number;
}

export interface ReportLocation {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  city: string;
  province: string;
  isApproximate?: boolean;
}

export interface ReportAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface ReportEvent {
  id: string;
  reportId: string;
  eventType: string;
  previousStatus?: string;
  newStatus?: string;
  actorType: 'citizen' | 'agency_officer';
  actorName: string;
  description: string;
  notes?: string;
  isInternal?: boolean;
  is_internal?: boolean;
  timestamp: string;
}

export interface Report {
  id: string;
  publicReference: string;
  reporterUserId?: string;
  secretFollowUpTokenHash?: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  publicationStatus: string;
  location: ReportLocation;
  facilityName?: string;
  estimatedCost?: number;
  responsibleAgency: string;
  mediaUrls: string[];
  supportingDocuments?: ReportAttachment[];
  reporterType: 'anonymous' | 'verified_citizen' | 'registered_citizen';
  reporterDisplayName?: string;
  supportCount: number;
  isSupportedByMe?: boolean;
  isSavedByMe?: boolean;
  budgetContext?: BudgetSectorContext;
  events: ReportEvent[];
  evidence_verification_status?: string;
  evidenceVerificationStatus?: string;
  official_response?: string | null;
  officialResponse?: string | null;
  internal_notes?: string | null;
  internalNotes?: string | null;
  last_reviewed_by?: string | null;
  lastReviewedBy?: string | null;
  last_reviewed_at?: string | null;
  lastReviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isSampleData: boolean;
}

export interface PostMedia {
  id: string;
  type: 'video' | 'image';
  url: string;
  posterUrl?: string;
  aspectRatio?: string;
  durationSeconds?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'citizen' | 'admin';
  verifiedAgency?: string;
  bio?: string;
  email?: string;
  district?: string;
  isVerified?: boolean;
  createdAt?: string;
  bannerUrl?: string;
  backgroundTheme?: string;
  websiteUrl?: string;
  customStatus?: string;
}

export interface Post {
  id: string;
  author: UserProfile;
  body: string;
  postType: string;
  media: PostMedia[];
  locationTag: string;
  relatedReportId?: string;
  relatedReport?: Report;
  supportCount: number;
  isSupportedByMe?: boolean;
  likesCount?: number;
  isLikedByMe?: boolean;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isSavedByMe?: boolean;
  createdAt: string;
  isSampleData: boolean;
}
