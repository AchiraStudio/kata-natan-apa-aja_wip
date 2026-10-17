// =============================================================================
// TITIK. — Database Type Definitions (Supabase & PostgreSQL Schema)
// Matches versioned migrations 20261017000001_civic_reporting_schema.sql
// =============================================================================

export type ReportStatus = 
  | 'submitted'
  | 'under_review'
  | 'published'
  | 'needs_info'
  | 'rejected'
  | 'resolved'
  | 'closed';

export type PublicationStatus = 'pending' | 'published' | 'rejected';

export type ReportSeverity = 'Rendah' | 'Sedang' | 'Kritis';

export type LocationMethod = 'gps' | 'map_pin' | 'address_search' | 'approximate';

export type ReportEventType = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MORE_INFO_REQUESTED'
  | 'APPROVED_PUBLISHED'
  | 'REJECTED'
  | 'FACILITY_LINK_SUGGESTED'
  | 'FACILITY_LINK_CONFIRMED'
  | 'BUDGET_LINK_SUGGESTED'
  | 'BUDGET_LINK_CONFIRMED'
  | 'AGENCY_DISPATCHED'
  | 'AGENCY_ACKNOWLEDGED'
  | 'WORK_SCHEDULED'
  | 'INSPECTION_COMPLETED'
  | 'RESOLVED'
  | 'CLOSED';

export type RelationTargetType = 'facility' | 'budget_project' | 'agency';
export type RelationMatchStatus = 'suggested' | 'under_review' | 'confirmed' | 'rejected';

export interface DatabaseReportRow {
  id: string;
  public_reference: string;
  title: string;
  description: string;
  category: string;
  severity: ReportSeverity;
  observed_at: string;
  status: ReportStatus;
  publication_status: PublicationStatus;
  facility_id: string | null;
  subdistrict: string;
  reporter_user_id: string | null;
  anonymous_submission: boolean;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  published_at: string | null;
}

export interface DatabaseReportLocationRow {
  id: string;
  report_id: string;
  precise_latitude: number;
  precise_longitude: number;
  public_latitude: number;
  public_longitude: number;
  accuracy_meters: number | null;
  acquisition_method: LocationMethod;
  is_approximate: boolean;
  address_text: string | null;
  created_at: string;
}

export interface DatabaseReportMediaRow {
  id: string;
  report_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  upload_status: 'pending' | 'uploaded' | 'failed';
  moderation_status: 'pending' | 'approved' | 'rejected';
  is_public: boolean;
  created_at: string;
}

export interface DatabaseReportEventRow {
  id: string;
  report_id: string;
  event_type: ReportEventType;
  previous_status: string | null;
  new_status: string | null;
  description: string;
  actor_type: 'citizen' | 'system' | 'moderator' | 'agency';
  actor_id: string | null;
  created_at: string;
}

export interface DatabaseReportRelationRow {
  id: string;
  report_id: string;
  target_type: RelationTargetType;
  target_id: string;
  match_status: RelationMatchStatus;
  match_rationale: string;
  confidence_score: number | null;
  source_reference: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DatabaseReportVoteRow {
  id: string;
  report_id: string;
  user_id: string | null;
  credential_token_hash: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Public View Model (Only safe fields exposed to public browsers)
// -----------------------------------------------------------------------------

export interface PublicCivicReport {
  id: string;
  publicReference: string;
  title: string;
  description: string;
  category: string;
  severity: ReportSeverity;
  observedAt: string;
  status: ReportStatus;
  subdistrict: string;
  coordinates: [number, number]; // Public privacy-generalized coordinates
  isApproximateLocation: boolean;
  locationAccuracyMeters?: number;
  locationMethod: LocationMethod;
  addressText?: string;
  approvedMedia: Array<{
    id: string;
    url: string;
    fileName: string;
  }>;
  events: Array<{
    id: string;
    eventType: ReportEventType;
    description: string;
    actorType: 'citizen' | 'system' | 'moderator' | 'agency';
    date: string;
    statusBadge: string;
  }>;
  relations: Array<{
    targetType: RelationTargetType;
    targetId: string;
    matchStatus: RelationMatchStatus;
    rationale: string;
    confidenceScore?: number;
    sourceReference?: string;
  }>;
  votesCount: number;
  hasUserVoted: boolean;
  createdAt: string;
  facilityId?: string;
  facilityName?: string;
}

// -----------------------------------------------------------------------------
// Report Draft Submission Payload
// -----------------------------------------------------------------------------

export interface CreateReportDraft {
  title: string;
  description: string;
  category: string;
  severity: ReportSeverity;
  observedAt?: string;
  subdistrict: string;
  facilityId?: string;
  facilityName?: string;
  preciseCoordinates: [number, number];
  accuracyMeters?: number;
  acquisitionMethod: LocationMethod;
  isApproximate: boolean;
  addressText?: string;
  evidenceFiles: File[];
  isAnonymous: boolean;
  reporterHandle?: string;
}

export interface SubmissionResult {
  success: boolean;
  reportId: string;
  publicReference: string;
  followUpToken: string; // Kept in memory / client storage for capability-based follow up
  status: 'submitted';
  publicationStatus: 'pending';
  message: string;
}

