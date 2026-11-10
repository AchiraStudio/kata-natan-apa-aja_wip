import type { ReportStatus } from '../types/domain';

export type StatusTone = 'baru' | 'ditindak' | 'tuntas' | 'ditolak';

interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** 1 to 4: Tercatat, Verifikasi, Ditindak, Tuntas. 0 for rejected. */
  stage: number;
}

const STATUS_META: Record<ReportStatus, StatusMeta> = {
  submitted: { label: 'Laporan diterima', tone: 'baru', stage: 1 },
  under_review: { label: 'Menunggu verifikasi', tone: 'baru', stage: 2 },
  needs_info: { label: 'Perlu info tambahan', tone: 'baru', stage: 2 },
  accepted_for_routing: { label: 'Disetujui, rute dinas', tone: 'ditindak', stage: 3 },
  forwarded_to_institution: { label: 'Diteruskan ke dinas', tone: 'ditindak', stage: 3 },
  institution_responded: { label: 'Dinas merespons', tone: 'ditindak', stage: 3 },
  resolved: { label: 'Selesai ditangani', tone: 'tuntas', stage: 4 },
  rejected: { label: 'Belum dapat diproses', tone: 'ditolak', stage: 0 },
};

export function getStatusMeta(status: ReportStatus | string): StatusMeta {
  return (
    STATUS_META[status as ReportStatus] || {
      label: String(status).replace(/_/g, ' '),
      tone: 'baru',
      stage: 1,
    }
  );
}

/** Tailwind classes for the small status dot. Tokens switch with the theme. */
export const STATUS_DOT_CLASS: Record<StatusTone, string> = {
  baru: 'bg-st-baru',
  ditindak: 'bg-st-ditindak',
  tuntas: 'bg-st-tuntas',
  ditolak: 'bg-st-ditolak',
};
