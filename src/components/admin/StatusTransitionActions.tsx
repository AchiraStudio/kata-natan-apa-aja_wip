import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { ReportStatus } from '../../types/domain';
import { getStatusMeta } from '../../utils/reportStatus';
import { Notice, SectionHead } from './ui';

interface StatusTransitionActionsProps {
  currentStatus: ReportStatus;
  isUpdating: boolean;
  actionError: string;
  actionSuccess: string;
  onApplyTransition: (status: ReportStatus) => void;
  onDeleteReport: () => void;
  /** Opens the "minta info" dialog. Hidden when omitted. */
  onRequestInfo?: () => void;
}

const STAGES = ['Baru', 'Diverifikasi', 'Ditindak', 'Tuntas'] as const;

/** Which of the four public stages a status belongs to (0 for rejected, shown separately). */
const stageOf = (status: ReportStatus) => getStatusMeta(status).stage;

/** The one step a reviewer most likely takes next from each status. */
const NEXT_STEP: Partial<Record<ReportStatus, { to: ReportStatus; label: string; hint: string }>> = {
  submitted: { to: 'under_review', label: 'Mulai tinjau', hint: 'Tandai bahwa Anda sedang memeriksa bukti.' },
  under_review: { to: 'accepted_for_routing', label: 'Setujui laporan', hint: 'Bukti cukup. Laporan siap diteruskan ke dinas.' },
  needs_info: { to: 'under_review', label: 'Lanjutkan tinjau', hint: 'Pelapor sudah membalas. Kembali ke peninjauan.' },
  accepted_for_routing: { to: 'forwarded_to_institution', label: 'Teruskan ke dinas', hint: 'Kirim ke dinas yang berwenang.' },
  forwarded_to_institution: { to: 'institution_responded', label: 'Catat respons dinas', hint: 'Dinas sudah menanggapi laporan ini.' },
  institution_responded: { to: 'resolved', label: 'Tandai selesai', hint: 'Perbaikan di lokasi sudah diperiksa.' },
  rejected: { to: 'under_review', label: 'Buka kembali', hint: 'Tinjau ulang laporan yang ditolak.' },
};

const ALL_STATUSES: ReportStatus[] = [
  'submitted',
  'under_review',
  'needs_info',
  'accepted_for_routing',
  'forwarded_to_institution',
  'institution_responded',
  'resolved',
  'rejected',
];

export const StatusTransitionActions: React.FC<StatusTransitionActionsProps> = ({
  currentStatus,
  isUpdating,
  actionError,
  actionSuccess,
  onApplyTransition,
  onDeleteReport,
  onRequestInfo,
}) => {
  const [manualTarget, setManualTarget] = useState<ReportStatus>(currentStatus);
  const next = NEXT_STEP[currentStatus];
  const stage = stageOf(currentStatus);
  const isClosed = currentStatus === 'resolved' || currentStatus === 'rejected';
  const meta = getStatusMeta(currentStatus);

  return (
    <section aria-label="Keputusan" className="space-y-4">
      <SectionHead as="h3" title="Keputusan" note={`Status sekarang: ${meta.label}`} />

      <ol className="grid grid-cols-4 gap-1.5" aria-label="Tahap penanganan">
        {STAGES.map((label, i) => {
          const reached = stage >= i + 1;
          return (
            <li key={label} aria-current={stage === i + 1 ? 'step' : undefined} className={`rounded-lg px-2 py-2 text-center text-xs ${reached ? 'bg-brand text-on-brand font-semibold' : 'bg-surface-2 text-ink-3'}`}>
              <span className="block tabular-nums opacity-75">{i + 1}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {currentStatus === 'needs_info' && (
        <Notice kind="info">Menunggu pelapor melengkapi informasi. Laporan tetap di sini sampai Anda melanjutkan peninjauan.</Notice>
      )}
      {currentStatus === 'rejected' && <Notice kind="info">Laporan ini ditolak. Alasannya sudah tercatat pada riwayat audit.</Notice>}

      {actionError && <Notice kind="error">{actionError}</Notice>}
      {actionSuccess && <Notice kind="success">{actionSuccess}</Notice>}

      {next ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onApplyTransition(next.to)}
            className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isUpdating ? 'Memproses' : next.label}
          </button>
          <span className="text-xs text-ink-3 min-w-0 flex-1">{next.hint}</span>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-ink-2">
          <Check className="w-4 h-4 text-st-tuntas" aria-hidden="true" /> Laporan ini sudah tuntas. Tidak ada langkah berikutnya.
        </p>
      )}

      {!isClosed && (
        <div className="flex flex-wrap gap-2">
          {onRequestInfo && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={onRequestInfo}
              className="h-9 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-50 transition-colors cursor-pointer"
            >
              Minta info
            </button>
          )}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onApplyTransition('rejected')}
            className="h-9 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-50 transition-colors cursor-pointer"
          >
            Tolak laporan
          </button>
        </div>
      )}
      {!isClosed && <p className="-mt-2 text-xs text-ink-3">Menolak memerlukan alasan pada kolom tanggapan di atas.</p>}

      <details className="rounded-lg border border-line-soft">
        <summary className="px-3.5 py-2.5 text-sm font-medium text-ink-2 cursor-pointer select-none hover:text-ink">Lainnya</summary>
        <div className="px-3.5 pb-3.5 pt-1 space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[12rem]">
              <label htmlFor="manual-status" className="block text-xs text-ink-3 mb-1">
                Ubah status langsung
              </label>
              <select id="manual-status" value={manualTarget} onChange={(e) => setManualTarget(e.target.value as ReportStatus)} className="titik-pill-input px-3">
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {getStatusMeta(s).label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={isUpdating || manualTarget === currentStatus}
              onClick={() => onApplyTransition(manualTarget)}
              className="h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={onDeleteReport}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-st-ditolak/50 text-st-ditolak text-sm font-semibold hover:bg-st-ditolak/10 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> Hapus laporan permanen
          </button>
        </div>
      </details>
    </section>
  );
};
