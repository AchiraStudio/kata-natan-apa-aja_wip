import type { Report, ReportEvent, ReportSeverity } from '../../types/domain';
import { getStatusMeta } from '../../utils/reportStatus';

/** Jakarta time, always labelled, so a report reads the same wherever it is opened. */
export const formatWhen = (value?: string): string => {
  if (!value) return 'Waktu tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const text = date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
  return `${text} WIB`;
};

export const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
};

/** Event types arrive as status codes (SUBMITTED, UNDER_REVIEW); show them as words. */
export const eventLabel = (type: string): string => {
  const label = getStatusMeta(type.toLowerCase()).label;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Internal staff events never belong on a public page. */
export const getPublicEvents = (report: Report): ReportEvent[] =>
  (report.events ?? []).filter((event) => !(event.isInternal || event.is_internal));

export const getOfficialResponse = (report: Report): string =>
  (report.officialResponse ?? report.official_response ?? '').trim();

/** What the evidence check actually found, in plain words. */
export const getEvidenceNote = (report: Report): { label: string; verified: boolean } => {
  const status = report.evidenceVerificationStatus ?? report.evidence_verification_status;
  switch (status) {
    case 'verified':
      return { label: 'Bukti sudah diperiksa petugas', verified: true };
    case 'rejected':
      return { label: 'Bukti tidak lolos pemeriksaan', verified: false };
    case 'inconclusive':
      return { label: 'Bukti belum cukup untuk disimpulkan', verified: false };
    default:
      return { label: 'Bukti dari pelapor, belum diperiksa', verified: false };
  }
};
