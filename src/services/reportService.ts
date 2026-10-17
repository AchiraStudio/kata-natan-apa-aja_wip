// =============================================================================
// TITIK. — Citizen Report Service
// Centralized repository layer for report submission, retrieval, and voting
// =============================================================================

import { supabase, isSupabaseConfigured, getPublicStorageUrl } from '../lib/supabase';
import { 
  CreateReportDraft, 
  SubmissionResult, 
  PublicCivicReport,
  ReportStatus,
  LocationMethod,
  ReportEventType,
  RelationTargetType,
  RelationMatchStatus
} from '../types/database';
import { uploadEvidenceFiles } from './reportMediaService';
import { calculateDistanceMeters, validateCoordinates } from './locationService';
import { INITIAL_REPORTS } from '../data/titikRegionalData';

const STORAGE_KEY_FOLLOWUP_TOKENS = 'titik_reporter_tokens';
const STORAGE_KEY_VOTER_CREDENTIAL = 'titik_voter_credential';

/**
 * Generates a high-entropy 64-character hex secret token.
 */
export const generateFollowUpSecret = (): string => {
  const bytes = new Uint8Array(32);
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) || globalThis.crypto;
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Calculates SHA-256 hash of a string using Web Crypto API.
 */
export const sha256Hash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) || globalThis.crypto;
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Retrieves or initializes an anonymous voter credential token for abuse control.
 */
export const getOrCreateVoterCredential = (): string => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return generateFollowUpSecret();
  }
  let token = localStorage.getItem(STORAGE_KEY_VOTER_CREDENTIAL);
  if (!token) {
    token = generateFollowUpSecret();
    localStorage.setItem(STORAGE_KEY_VOTER_CREDENTIAL, token);
  }
  return token;
};

/**
 * Submits a new citizen report to Supabase via atomic RPC.
 */
export const submitCitizenReport = async (
  draft: CreateReportDraft,
  onProgress?: (stepText: string, progressPct: number) => void
): Promise<SubmissionResult> => {
  // 1. Validate mandatory fields
  if (!draft.title || draft.title.trim().length < 5) {
    throw new Error('Judul laporan minimal 5 karakter.');
  }

  if (!draft.description || draft.description.trim().length < 10) {
    throw new Error('Deskripsi laporan minimal 10 karakter.');
  }

  if (!validateCoordinates(draft.preciseCoordinates[0], draft.preciseCoordinates[1])) {
    throw new Error('Koordinat lokasi tidak valid.');
  }

  // 2. Generate secret follow-up token & hash
  const followUpToken = generateFollowUpSecret();
  const tokenHash = await sha256Hash(followUpToken);

  // 3. Strict verification: Require live Supabase connection
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase belum terkonfigurasi. Pelaporan warga membutuhkan koneksi Supabase aktif untuk menjamin auditabilitas publik.');
  }

  // 4. Upload evidence photos if any
  let mediaUploads: Array<{
    storage_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
  }> = [];

  if (draft.evidenceFiles.length > 0) {
    if (onProgress) onProgress('Mengunggah bukti foto ke penyimpanan aman...', 30);
    const submissionTempId = `draft-${Date.now()}`;
    mediaUploads = await uploadEvidenceFiles(draft.evidenceFiles, submissionTempId, (curr, total) => {
      if (onProgress) {
        onProgress(`Mengunggah foto ${curr} dari ${total}...`, 30 + Math.round((curr / total) * 40));
      }
    });
  }

  if (onProgress) onProgress('Memproses catatan audit di database Supabase...', 85);

  // 5. Submit via Atomic Stored Procedure (Direct PostgREST RPC)
  // Direct RPC avoids CORS preflight failures from un-deployed edge functions
  let result: any = null;

  // Optional Edge Function override if explicitly enabled in environment
  if (import.meta.env.VITE_USE_EDGE_FUNCTION === 'true') {
    try {
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('submit-report', {
        body: {
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category,
          severity: draft.severity,
          subdistrict: draft.subdistrict,
          facility_id: draft.facilityId || undefined,
          precise_latitude: draft.preciseCoordinates[0],
          precise_longitude: draft.preciseCoordinates[1],
          accuracy_meters: draft.accuracyMeters || undefined,
          acquisition_method: draft.acquisitionMethod,
          is_approximate: draft.isApproximate,
          address_text: draft.addressText || undefined,
          media_files: mediaUploads,
          follow_up_token_hash: tokenHash,
          reporter_user_id: undefined,
        },
      });

      if (!edgeErr && edgeData && (edgeData.public_reference || edgeData.report_id)) {
        result = edgeData;
      }
    } catch {
      // Fallback to RPC below
    }
  }

  // Atomic stored procedure (primary, zero-CORS-issue submission mechanism)
  if (!result) {
    const { data, error } = await supabase.rpc('submit_citizen_report', {
      p_title: draft.title.trim(),
      p_description: draft.description.trim(),
      p_category: draft.category,
      p_severity: draft.severity,
      p_subdistrict: draft.subdistrict,
      p_facility_id: draft.facilityId || null,
      p_precise_lat: draft.preciseCoordinates[0],
      p_precise_lng: draft.preciseCoordinates[1],
      p_accuracy_meters: draft.accuracyMeters || null,
      p_acquisition_method: draft.acquisitionMethod,
      p_is_approximate: draft.isApproximate,
      p_address_text: draft.addressText || null,
      p_media_files: mediaUploads,
      p_follow_up_token_hash: tokenHash,
      p_reporter_user_id: null,
    });

    if (error) {
      const hint = error.message.includes('schema cache') 
        ? ' (Jalankan Migration 04 di Supabase SQL Editor: NOTIFY pgrst, reload schema)' 
        : '';
      throw new Error(`Gagal mengirim laporan ke database: ${error.message}${hint}`);
    }

    result = data;
  }

  saveFollowUpToken(result.public_reference, followUpToken);

  return {
    success: true,
    reportId: result.report_id,
    publicReference: result.public_reference,
    followUpToken,
    status: 'submitted',
    publicationStatus: 'pending',
    message: result.message || 'Laporan berhasil dicatat.',
  };
};

/**
 * Saves follow-up capability token in local browser storage so the citizen
 * can revisit their private draft/moderation progress without exposing it publicly.
 */
export const saveFollowUpToken = (publicReference: string, token: string): void => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWUP_TOKENS);
    const tokens = raw ? JSON.parse(raw) : {};
    tokens[publicReference] = token;
    localStorage.setItem(STORAGE_KEY_FOLLOWUP_TOKENS, JSON.stringify(tokens));
  } catch (err) {
    console.warn('Could not persist follow-up token to localStorage:', err);
  }
};

/**
 * Gets saved follow-up capability token for a report reference.
 */
export const getFollowUpToken = (publicReference: string): string | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_FOLLOWUP_TOKENS);
    if (!raw) return null;
    const tokens = JSON.parse(raw);
    return tokens[publicReference] || null;
  } catch {
    return null;
  }
};

/**
 * Fetches published reports from Supabase.
 * If Supabase is unconfigured, falls back cleanly to the initial seed dataset.
 */
export const fetchPublishedReports = async (filters?: {
  category?: string;
  subdistrict?: string;
  search?: string;
}): Promise<PublicCivicReport[]> => {
  if (!isSupabaseConfigured || !supabase) {
    // Return mapped initial demo records
    return INITIAL_REPORTS.map((r) => ({
      id: r.id,
      publicReference: r.id,
      title: r.title,
      description: r.description,
      category: r.sector,
      severity: r.severity,
      observedAt: r.reportedAt,
      status: 'published' as ReportStatus,
      subdistrict: r.subdistrict,
      coordinates: r.coordinates,
      isApproximateLocation: false,
      locationMethod: 'gps' as LocationMethod,
      approvedMedia: [
        {
          id: `media-${r.id}`,
          url: r.photoUrl,
          fileName: 'bukti_lapangan.jpg',
        },
      ],
      events: r.timeline.map((t) => ({
        id: `evt-${t.stepNumber}`,
        eventType: 'SUBMITTED' as ReportEventType,
        description: t.description,
        actorType: (t.actor === 'Warga Pelapor' ? 'citizen' : 'agency') as 'citizen' | 'agency',
        date: t.date,
        statusBadge: t.status,
      })),
      relations: [
        {
          targetType: 'agency' as RelationTargetType,
          targetId: r.responsibleAgency,
          matchStatus: (r.isBudgetLinkConfirmed ? 'confirmed' : 'suggested') as RelationMatchStatus,
          rationale: 'Instansi pengampu sarana publik.',
        },
      ],
      votesCount: r.priorityVotes,
      hasUserVoted: Boolean(r.userHasVoted),
      createdAt: r.reportedAt,
      facilityId: r.facilityId,
      facilityName: r.facilityName,
    })).filter((rep) => {
      if (filters?.category && filters.category !== 'Semua' && rep.category !== filters.category) return false;
      if (filters?.subdistrict && filters.subdistrict !== 'Semua' && rep.subdistrict !== filters.subdistrict) return false;
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        return rep.title.toLowerCase().includes(q) || rep.description.toLowerCase().includes(q);
      }
      return true;
    });
  }

  // Real Supabase Query
  let query = supabase
    .from('reports')
    .select(`
      id,
      public_reference,
      title,
      description,
      category,
      severity,
      observed_at,
      status,
      subdistrict,
      facility_id,
      created_at,
      report_locations (
        public_latitude,
        public_longitude,
        accuracy_meters,
        acquisition_method,
        is_approximate,
        address_text
      ),
      report_media (
        id,
        storage_path,
        file_name,
        moderation_status,
        is_public
      ),
      report_events (
        id,
        event_type,
        description,
        actor_type,
        created_at
      ),
      report_relations (
        target_type,
        target_id,
        match_status,
        match_rationale,
        confidence_score
      ),
      report_votes (
        id,
        credential_token_hash
      )
    `)
    .eq('publication_status', 'published')
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category !== 'Semua') {
    query = query.eq('category', filters.category);
  }

  if (filters?.subdistrict && filters.subdistrict !== 'Semua') {
    query = query.eq('subdistrict', filters.subdistrict);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching published reports:', error);
    // Graceful fallback if schema cache is reloading or tables are not yet indexed by PostgREST
    if (error.message.includes('schema cache') || error.code === 'PGRST205' || error.code === 'PGRST200') {
      console.warn(
        'PostgREST schema cache needs reload in Supabase. Run Migration 04 in SQL Editor. Falling back to local reference reports.'
      );
      return INITIAL_REPORTS.map((r) => ({
        id: r.id,
        publicReference: r.id,
        title: r.title,
        description: r.description,
        category: r.sector,
        severity: r.severity,
        observedAt: r.reportedAt,
        status: 'published' as ReportStatus,
        subdistrict: r.subdistrict,
        coordinates: r.coordinates,
        isApproximateLocation: false,
        locationMethod: 'gps' as LocationMethod,
        approvedMedia: [
          {
            id: `media-${r.id}`,
            url: r.photoUrl,
            fileName: 'bukti_lapangan.jpg',
          },
        ],
        events: r.timeline.map((t) => ({
          id: `evt-${t.stepNumber}`,
          eventType: 'SUBMITTED' as ReportEventType,
          description: t.description,
          actorType: (t.actor === 'Warga Pelapor' ? 'citizen' : 'agency') as 'citizen' | 'agency',
          date: t.date,
          statusBadge: t.status,
        })),
        relations: [
          {
            targetType: 'agency' as RelationTargetType,
            targetId: r.responsibleAgency,
            matchStatus: (r.isBudgetLinkConfirmed ? 'confirmed' : 'suggested') as RelationMatchStatus,
            rationale: 'Instansi pengampu sarana publik.',
          },
        ],
        votesCount: r.priorityVotes,
        hasUserVoted: Boolean(r.userHasVoted),
        createdAt: r.reportedAt,
        facilityId: r.facilityId,
        facilityName: r.facilityName,
      })).filter((rep) => {
        if (filters?.category && filters.category !== 'Semua' && rep.category !== filters.category) return false;
        if (filters?.subdistrict && filters.subdistrict !== 'Semua' && rep.subdistrict !== filters.subdistrict) return false;
        if (filters?.search && filters.search.trim()) {
          const q = filters.search.toLowerCase();
          return rep.title.toLowerCase().includes(q) || rep.description.toLowerCase().includes(q);
        }
        return true;
      });
    }
    throw new Error(`Gagal memuat laporan publik: ${error.message}`);
  }

  const voterToken = getOrCreateVoterCredential();
  const voterTokenHash = await sha256Hash(voterToken);

  return (data || []).map((row: any) => {
    const loc = row.report_locations?.[0] || {
      public_latitude: -6.5971,
      public_longitude: 106.806,
      accuracy_meters: null,
      acquisition_method: 'map_pin',
      is_approximate: false,
    };

    const media = (row.report_media || [])
      .filter((m: any) => m.is_public && m.moderation_status === 'approved')
      .map((m: any) => ({
        id: m.id,
        url: getPublicStorageUrl('report-evidence-public', m.storage_path),
        fileName: m.file_name,
      }));

    const events = (row.report_events || []).map((e: any) => ({
      id: e.id,
      eventType: e.event_type,
      description: e.description,
      actorType: e.actor_type,
      date: new Date(e.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      statusBadge: e.event_type,
    }));

    const relations = (row.report_relations || []).map((r: any) => ({
      targetType: r.target_type,
      targetId: r.target_id,
      matchStatus: r.match_status,
      rationale: r.match_rationale,
      confidenceScore: r.confidence_score,
    }));

    const votesCount = row.report_votes?.length || 0;

    return {
      id: row.id,
      publicReference: row.public_reference,
      title: row.title,
      description: row.description,
      category: row.category,
      severity: row.severity,
      observedAt: new Date(row.observed_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: row.status,
      subdistrict: row.subdistrict,
      coordinates: [Number(loc.public_latitude), Number(loc.public_longitude)],
      isApproximateLocation: loc.is_approximate,
      locationAccuracyMeters: loc.accuracy_meters,
      locationMethod: (loc.acquisition_method as LocationMethod) || 'map_pin',
      addressText: loc.address_text,
      approvedMedia: media,
      events,
      relations,
      votesCount,
      hasUserVoted: (row.report_votes || []).some(
        (v: any) => v.credential_token_hash === voterTokenHash
      ),
      createdAt: row.created_at,
      facilityId: row.facility_id,
    };
  });
};

/**
 * Fetches single report detail by public reference or UUID.
 */
export const fetchReportDetail = async (
  refOrId: string
): Promise<PublicCivicReport | null> => {
  const all = await fetchPublishedReports();
  const matched = all.find(
    (r) => r.publicReference.toLowerCase() === refOrId.toLowerCase() || r.id === refOrId
  );

  if (matched) return matched;

  // If not found in published, check if client holds a private follow-up token for it
  const followUpToken = getFollowUpToken(refOrId);
  if (followUpToken && isSupabaseConfigured && supabase) {
    const tokenHash = await sha256Hash(followUpToken);
    const { data, error } = await supabase.rpc('get_report_by_follow_up_token', {
      p_public_ref: refOrId,
      p_token_hash: tokenHash,
    });

    if (!error && data && data.report) {
      const rep = data.report;
      const loc = data.location || {};
      return {
        id: rep.id,
        publicReference: rep.public_reference,
        title: rep.title,
        description: rep.description,
        category: rep.category,
        severity: rep.severity,
        observedAt: new Date(rep.observed_at).toLocaleDateString('id-ID'),
        status: rep.status,
        subdistrict: rep.subdistrict,
        coordinates: [Number(loc.public_latitude || 0), Number(loc.public_longitude || 0)],
        isApproximateLocation: loc.is_approximate || false,
        locationMethod: (loc.acquisition_method as LocationMethod) || 'map_pin',
        approvedMedia: (data.media || []).map((m: any) => ({
          id: m.id,
          url: getPublicStorageUrl('report-evidence-private', m.storage_path),
          fileName: m.file_name,
        })),
        events: (data.events || []).map((e: any) => ({
          id: e.id,
          eventType: e.event_type,
          description: e.description,
          actorType: e.actor_type,
          date: new Date(e.created_at).toLocaleDateString('id-ID'),
          statusBadge: e.event_type,
        })),
        relations: data.relations || [],
        votesCount: 0,
        hasUserVoted: false,
        createdAt: rep.created_at,
        facilityId: rep.facility_id,
      };
    }
  }

  return null;
};

/**
 * Casts community priority vote with abuse control.
 */
export const voteReportPriority = async (
  reportId: string
): Promise<{ success: boolean; newCount: number }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, newCount: 1 };
  }

  const credential = getOrCreateVoterCredential();
  const tokenHash = await sha256Hash(credential);

  const { error } = await supabase.from('report_votes').insert({
    report_id: reportId,
    credential_token_hash: tokenHash,
  });

  if (error) {
    if (error.code === '23505') {
      // Duplicate vote
      throw new Error('Anda sudah memberikan suara dukungan pada laporan ini.');
    }
    throw new Error(`Gagal mencatat suara: ${error.message}`);
  }

  // Count updated votes
  const { count } = await supabase
    .from('report_votes')
    .select('id', { count: 'exact', head: true })
    .eq('report_id', reportId);

  return { success: true, newCount: count || 1 };
};

/**
 * Finds suggested duplicate / related reports nearby (< 600m) in same sector.
 */
export const findNearbySimilarReports = (
  reports: PublicCivicReport[],
  lat: number,
  lng: number,
  category: string,
  maxDistanceMeters = 600
): PublicCivicReport[] => {
  if (!validateCoordinates(lat, lng)) return [];

  return reports.filter((r) => {
    if (r.category !== category) return false;
    const dist = calculateDistanceMeters(lat, lng, r.coordinates[0], r.coordinates[1]);
    return dist <= maxDistanceMeters;
  });
};

/**
 * Fetches pending reports for moderation (moderators/reviewers).
 */
export const fetchPendingReports = async (): Promise<PublicCivicReport[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  // 1. Try secure RPC function (from Migration 04)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_reports_for_moderation');
    if (!rpcError && Array.isArray(rpcData)) {
      return rpcData.map((r: any) => {
        const loc = Array.isArray(r.report_locations) ? r.report_locations[0] : r.report_locations;
        const media = Array.isArray(r.report_media) ? r.report_media : [];

        return {
          id: r.id,
          publicReference: r.public_reference,
          title: r.title,
          description: r.description,
          category: r.category,
          severity: r.severity,
          observedAt: r.observed_at,
          status: r.status,
          subdistrict: r.subdistrict,
          coordinates: [loc?.public_latitude || -6.5971, loc?.public_longitude || 106.8060] as [number, number],
          isApproximateLocation: Boolean(loc?.is_approximate),
          locationMethod: loc?.acquisition_method || 'map_pin',
          addressText: loc?.address_text,
          approvedMedia: media.map((m: any) => ({
            id: m.id,
            url: getPublicStorageUrl('report-evidence-private', m.storage_path),
            fileName: m.file_name,
          })),
          events: [
            {
              id: 'initial',
              eventType: 'SUBMITTED',
              description: 'Laporan warga menunggu tinjauan bukti fisik.',
              actorType: 'citizen',
              date: r.created_at,
              statusBadge: 'Menunggu Kurasi',
            },
          ],
          relations: [],
          votesCount: 0,
          hasUserVoted: false,
          createdAt: r.created_at,
          facilityId: r.facility_id,
        };
      });
    }
  } catch {
    // Continue to standard select fallback
  }

  // 2. Standard table select fallback
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        public_reference,
        title,
        description,
        category,
        severity,
        observed_at,
        status,
        publication_status,
        subdistrict,
        facility_id,
        created_at,
        report_locations (
          precise_latitude,
          precise_longitude,
          public_latitude,
          public_longitude,
          accuracy_meters,
          acquisition_method,
          is_approximate,
          address_text
        ),
        report_media (
          id,
          storage_path,
          file_name,
          mime_type,
          file_size_bytes,
          upload_status,
          moderation_status,
          is_public
        )
      `)
      .eq('publication_status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => {
      const loc = Array.isArray(r.report_locations) ? r.report_locations[0] : r.report_locations;
      const media = Array.isArray(r.report_media) ? r.report_media : [];

      return {
        id: r.id,
        publicReference: r.public_reference,
        title: r.title,
        description: r.description,
        category: r.category,
        severity: r.severity,
        observedAt: r.observed_at,
        status: r.status,
        subdistrict: r.subdistrict,
        coordinates: [loc?.public_latitude || -6.5971, loc?.public_longitude || 106.8060] as [number, number],
        isApproximateLocation: Boolean(loc?.is_approximate),
        locationMethod: loc?.acquisition_method || 'map_pin',
        addressText: loc?.address_text,
        approvedMedia: media.map((m: any) => ({
          id: m.id,
          url: getPublicStorageUrl('report-evidence-private', m.storage_path),
          fileName: m.file_name,
        })),
        events: [
          {
            id: 'initial',
            eventType: 'SUBMITTED',
            description: 'Laporan warga menunggu tinjauan bukti fisik.',
            actorType: 'citizen',
            date: r.created_at,
            statusBadge: 'Menunggu Kurasi',
          },
        ],
        relations: [],
        votesCount: 0,
        hasUserVoted: false,
        createdAt: r.created_at,
        facilityId: r.facility_id,
      };
    });
  } catch {
    return [];
  }
};

/**
 * Moderates a report: updates publication status and appends authentic audit event.
 */
export const moderateReport = async (
  reportId: string,
  newStatus: ReportStatus,
  publicationStatus: 'pending' | 'published' | 'rejected',
  notes: string,
  moderatorId = 'moderator_komunitas'
): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.rpc('moderate_report', {
    p_report_id: reportId,
    p_new_status: newStatus,
    p_publication_status: publicationStatus,
    p_notes: notes,
    p_moderator_id: moderatorId,
  });

  if (error) {
    throw new Error(`Gagal memoderasi laporan: ${error.message}`);
  }

  return true;
};
