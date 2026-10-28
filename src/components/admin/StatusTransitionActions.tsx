import React from 'react';
import { ReportStatus } from '../../types/domain';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface StatusTransitionActionsProps {
  currentStatus: ReportStatus;
  isUpdating: boolean;
  actionError: string;
  actionSuccess: string;
  onApplyTransition: (status: ReportStatus) => void;
  onDeleteReport: () => void;
}

export const StatusTransitionActions: React.FC<StatusTransitionActionsProps> = ({
  currentStatus,
  isUpdating,
  actionError,
  actionSuccess,
  onApplyTransition,
  onDeleteReport,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-[#E4E2DA] dark:border-[#26352E]">
      {/* Feedback Messages */}
      {actionError && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{actionSuccess}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3]">
          Aksi Transisi Status:
        </span>
        <span className="text-[10px] font-mono text-[#686B65] dark:text-[#9EACA3]">
          Status aktif: <span className="font-bold uppercase">{currentStatus.replace(/_/g, ' ')}</span>
        </span>
      </div>

      {/* 8-Button State Transition Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {/* Row 1 */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('under_review')}
          className="admin-transition-btn px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded-full font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Mulai Review
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('needs_info')}
          className="admin-transition-btn px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-full font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Minta Info Tambahan
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('accepted_for_routing')}
          className="admin-transition-btn px-4 py-2 bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] border border-[#263F35]/30 dark:border-[#10B981]/40 rounded-full font-semibold hover:bg-[#d8e0cc] dark:hover:bg-[#243f31] disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Setujui Laporan
        </button>

        {/* Row 2 */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('forwarded_to_institution')}
          className="admin-transition-btn px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-full font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Teruskan ke Dinas
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('institution_responded')}
          className="admin-transition-btn px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-full font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Catat Respon Dinas
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('resolved')}
          className="admin-transition-btn px-4 py-2 bg-emerald-700 dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-full font-semibold hover:bg-emerald-800 dark:hover:bg-[#34D399] disabled:opacity-50 transition-all shadow-xs text-xs cursor-pointer"
        >
          ✓ Tandai Selesai
        </button>

        {/* Row 3 */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onApplyTransition('rejected')}
          className="admin-transition-btn px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-full font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          Tolak Laporan
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={onDeleteReport}
          className="admin-transition-btn px-4 py-2 bg-rose-700 dark:bg-rose-800 text-white border border-rose-800 dark:border-rose-700 rounded-full font-semibold hover:bg-rose-800 dark:hover:bg-rose-700 disabled:opacity-50 transition-all text-xs cursor-pointer"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Permanen
          </span>
        </button>
      </div>
    </div>
  );
};
