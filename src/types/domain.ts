// =============================================================================
// TITIK. — Core Domain Types
// =============================================================================

export type PostType = 'citizen_report' | 'community_discussion' | 'official_update';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'citizen' | 'moderator' | 'admin';
  verifiedAgency?: string;
  bio?: string;
  email?: string;
  district?: string;
  isVerified?: boolean;
}

export type AspectRatio =
  | '9/16'
  | '9:16'
  | '1/1'
  | '1:1'
  | '3/4'
  | '3:4'
  | '4/3'
  | '4:3'
  | '16/9'
  | '16:9';

export interface PostMedia {
  id: string;
  type: 'video' | 'image';
  url: string;
  posterUrl?: string;
  aspectRatio?: AspectRatio;
  durationSeconds?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: UserProfile;
  body: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'needs_info'
  | 'accepted_for_routing'
  | 'forwarded_to_institution'
  | 'institution_responded'
  | 'resolved'
  | 'rejected';

export type PublicationStatus = 'pending' | 'published' | 'rejected';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

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
  previousStatus?: ReportStatus;
  newStatus?: ReportStatus;
  actorType: 'citizen' | 'moderator' | 'agency_officer';
  actorName: string;
  description: string;
  timestamp: string;
}

export interface BudgetSectorContext {
  sectorId: string;
  sectorName: string;
  subSectorName: string;
  paguAllocation: number; // e.g. Rp 45.000.000.000
  realizedSpending: number; // e.g. Rp 28.500.000.000
  executionRatePercent: number; // e.g. 63.3
  fiscalYear: number; // e.g. 2026
  responsibleAgency: string; // e.g. "Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor"
  agencyAcronym: string; // e.g. "Dinas PUPR"
  responsivenessScore: number; // e.g. 88 (scale 0-100)
  avgResolutionDays: number; // e.g. 14 days
  lastUpdated: string;
  dataSource: string; // e.g. "Simulasi SIKD Kemendagri / Portal Satu Data Kota Bogor 2026"
  isSampleData: boolean;
}

export interface Report {
  id: string;
  publicReference: string; // e.g. "TIK-2026-000123"
  secretFollowUpTokenHash?: string; // Hashed tracking secret
  title: string;
  description: string;
  category: string; // "Infrastruktur" | "Lingkungan" | "Pendidikan" | "Kesehatan" | "Lainnya"
  severity: ReportSeverity;
  status: ReportStatus;
  publicationStatus: PublicationStatus;
  location: ReportLocation;
  facilityName?: string;
  estimatedCost?: number;
  responsibleAgency: string;
  mediaUrls: string[];
  supportingDocuments?: ReportAttachment[];
  reporterType: 'anonymous' | 'verified_citizen';
  reporterDisplayName?: string;
  supportCount: number; // "Saya terdampak juga" civic support count
  isSupportedByMe?: boolean;
  budgetContext: BudgetSectorContext;
  events: ReportEvent[];
  createdAt: string;
  updatedAt: string;
  isSampleData: boolean;
}

export interface Post {
  id: string;
  author: UserProfile;
  body: string;
  postType: PostType;
  media: PostMedia[];
  locationTag: string; // e.g. "Bogor, Jawa Barat"
  relatedReportId?: string;
  relatedReport?: Report;
  supportCount: number; // Civic verification: "Saya terdampak juga"
  isSupportedByMe?: boolean;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isSavedByMe?: boolean;
  createdAt: string;
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
  activeReportsCount: number;
  resolvedReportsCount: number;
}

