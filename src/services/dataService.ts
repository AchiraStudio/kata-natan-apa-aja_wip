import { SupabaseDataAdapter } from './adapters/supabaseAdapter';
import { MockDataAdapter } from './adapters/mockAdapter';
import { IDataAdapter } from './adapters/types';
import { isSupabaseConfigured } from './supabaseClient';
import { Report, ReportStatus, EvidenceStatus } from '../types/domain';

export const isDemoMode = import.meta.env.VITE_DATA_MODE === 'demo';
export const isConfigured = isSupabaseConfigured;
// Live mode is active whenever demo mode is not explicitly requested.
// We strictly enforce Supabase as the primary data source without silent mock fallback.
export const isLiveMode = !isDemoMode;

export type ConnectionStatusKind = 'connected' | 'unconfigured' | 'demo';

export interface ConnectionStatusInfo {
  status: ConnectionStatusKind;
  isConfigured: boolean;
  isLiveMode: boolean;
  message?: string;
  actionableHint?: string;
}

export function getConnectionStatus(): ConnectionStatusInfo {
  if (isDemoMode) {
    return {
      status: 'demo',
      isConfigured: false,
      isLiveMode: false,
      message: 'Aplikasi berjalan dalam mode demo simulasi (Mock Data).',
      actionableHint: 'Untuk beralih ke database Supabase nyata, hapus VITE_DATA_MODE=demo.',
    };
  }

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

// Global singleton data service:
// Strictly instantiate SupabaseDataAdapter when in live mode (do NOT silently fall back to MockDataAdapter).
export const dataService: IDataAdapter = isDemoMode
  ? new MockDataAdapter()
  : new SupabaseDataAdapter();

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
