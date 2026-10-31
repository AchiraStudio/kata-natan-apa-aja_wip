import { SupabaseDataAdapter } from './adapters/supabaseAdapter';
import { IDataAdapter } from './adapters/types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { Report, ReportStatus, EvidenceStatus, Facility } from '../types/domain';

// Zero mock data architecture: live mode is always active.
export const isDemoMode = false;
export const isConfigured = isSupabaseConfigured;
export const isLiveMode = true;

export type ConnectionStatusKind = 'connected' | 'unconfigured' | 'disconnected' | 'error';

export interface ConnectionStatusInfo {
  status: ConnectionStatusKind;
  isConfigured: boolean;
  isLiveMode: boolean;
  message?: string;
  actionableHint?: string;
}

/**
 * Synchronous configuration check for zero-flicker UI rendering.
 */
export function getConnectionStatus(): ConnectionStatusInfo {
  if (!isSupabaseConfigured) {
    return {
      status: 'unconfigured',
      isConfigured: false,
      isLiveMode: true,
      message: 'Koneksi Supabase belum terkonfigurasi. Variabel lingkungan tidak ditemukan.',
      actionableHint: 'Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY telah diatur di .env atau pengaturan Cloudflare Pages.',
    };
  }

  return {
    status: 'connected',
    isConfigured: true,
    isLiveMode: true,
    message: 'Terhubung ke server Supabase Kota Bogor.',
  };
}

/**
 * Asynchronous live connection test probe.
 * Queries a lightweight public table to verify actual network roundtrip and measure latency.
 */
export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  status: ConnectionStatusKind;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      latencyMs: 0,
      status: 'unconfigured',
      message: 'Variabel lingkungan Supabase belum terkonfigurasi.',
    };
  }

  const start = performance.now();
  try {
    const { error, status } = await supabase
      .from('budget_sectors')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error && status !== 200 && status !== 204 && status !== 206) {
      return {
        ok: false,
        latencyMs,
        status: 'error',
        message: `Gagal menjangkau basis data Supabase: ${error.message}`,
        error: error.message,
      };
    }

    return {
      ok: true,
      latencyMs,
      status: 'connected',
      message: `Koneksi basis data Supabase aktif (${latencyMs}ms).`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs,
      status: 'disconnected',
      message: 'Gagal terhubung ke jaringan Supabase.',
      error: errMsg,
    };
  }
}

// Global singleton data service: strictly instantiate pure SupabaseDataAdapter.
export const dataService: IDataAdapter = new SupabaseDataAdapter();

// Administrative & Verification helper methods
export async function transitionReportStatus(
  reportId: string,
  targetStatus: ReportStatus,
  notes?: string,
  isInternal?: boolean,
  officialResponse?: string
): Promise<Report> {
  return dataService.transitionReportStatus(reportId, targetStatus, notes, isInternal, officialResponse);
}

export async function verifyReportEvidence(
  reportId: string,
  verificationStatus: EvidenceStatus,
  notes?: string
): Promise<Report> {
  return dataService.verifyReportEvidence(reportId, verificationStatus, notes);
}

export async function setCitizenVerification(
  userId: string,
  isVerified: boolean,
  notes?: string
): Promise<boolean> {
  return dataService.setCitizenVerification(userId, isVerified, notes);
}

export async function getPrivateEvidenceSignedUrl(filePath: string): Promise<string> {
  return dataService.getPrivateEvidenceSignedUrl(filePath);
}

export async function createFacility(
  facility: Partial<Facility> & { name: string; category: string }
): Promise<Facility> {
  return dataService.createFacility(facility);
}

export async function saveOfficialResponse(
  reportId: string,
  officialResponse?: string,
  internalNotes?: string
): Promise<Report> {
  return dataService.saveOfficialResponse(reportId, officialResponse, internalNotes);
}

export async function submitAdditionalInfo(
  reportId: string,
  reporterUserId: string,
  additionalText: string,
  newMediaUrl?: string
): Promise<Report> {
  return dataService.submitAdditionalInfo(reportId, reporterUserId, additionalText, newMediaUrl);
}
