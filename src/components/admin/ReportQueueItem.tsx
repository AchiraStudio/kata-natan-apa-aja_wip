import React from 'react';
import { Report, ReportStatus } from '../../types/domain';
import { MapPin, BadgeCheck } from 'lucide-react';

interface ReportQueueItemProps {
  report: Report;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_BADGE_STYLES: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  submitted: {
    label: 'Baru Masuk',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-300',
    border: 'border-neutral-300 dark:border-neutral-700',
  },
  under_review: {
    label: 'Menunggu Verifikasi',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-[#92400E] dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/80',
  },
  needs_info: {
    label: 'Butuh Info',
    bg: 'bg-rose-100 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800/80',
  },
  accepted_for_routing: {
    label: 'Disetujui',
    bg: 'bg-[#E7EBDD] dark:bg-[#1A2E24]',
    text: 'text-[#1B4332] dark:text-[#34D399]',
    border: 'border-[#1B4332]/30 dark:border-[#10B981]/40',
  },
  forwarded_to_institution: {
    label: 'Diteruskan ke Dinas',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800/80',
  },
  institution_responded: {
    label: 'Dinas Merespon',
    bg: 'bg-indigo-100 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800/80',
  },
  resolved: {
    label: 'Tuntas',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800/80',
  },
  rejected: {
    label: 'Ditolak',
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
    border: 'border-neutral-300 dark:border-neutral-700',
  },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-rose-600 ring-2 ring-rose-200 dark:ring-rose-900',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-neutral-400',
};

export const ReportQueueItem: React.FC<ReportQueueItemProps> = ({
  report,
  isSelected,
  onSelect,
}) => {
  const statusConfig = STATUS_BADGE_STYLES[report.status] || {
    label: report.status.replace(/_/g, ' '),
    bg: 'bg-white/80 dark:bg-[#131916]',
    text: 'text-[#4F5A52] dark:text-[#9EACA3]',
    border: 'border-[#E3E0D6] dark:border-[#26352E]',
  };

  const dotClass = SEVERITY_DOT[report.severity] || 'bg-neutral-400';

  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={`w-full text-left py-3 px-3.5 rounded-2xl transition-all cursor-pointer ${
        isSelected
          ? 'bg-[#E7EBDD]/90 dark:bg-[#1A2E24] ring-1 ring-[#1B4332]/40 dark:ring-[#10B981]/50 shadow-2xs'
          : 'hover:bg-[#F7F5EF] dark:hover:bg-[#131916]'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} title={`Urgensi: ${report.severity}`} />
          <span className="font-mono font-bold text-[#101913] dark:text-[#F3F6F4]">
            {report.publicReference}
          </span>
          {(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified') && (
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate">
        {report.title}
      </div>

      <div className="flex items-center gap-1 text-[11px] text-[#4F5A52] dark:text-[#9EACA3] truncate mt-0.5">
        <MapPin className="w-3 h-3 text-[#4F5A52] dark:text-[#9EACA3] shrink-0" />
        <span className="truncate">{report.location?.address || 'Lokasi belum dicantumkan'}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-1 border-t border-[#E3E0D6]/40 dark:border-[#26352E]/40">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F7F5EF] dark:bg-[#131916] text-[#4F5A52] dark:text-[#9EACA3] border border-[#E3E0D6]/60 dark:border-[#26352E]/60">
          {report.category}
        </span>
        {report.facilityName && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[#101913] dark:text-[#F3F6F4] border border-[#E3E0D6]/60 dark:border-[#26352E]/60 truncate max-w-[150px]" title={report.facilityName}>
            🏛️ {report.facilityName}
          </span>
        )}
        {report.reporterDisplayName && (
          <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] truncate">
            Oleh: {report.reporterDisplayName}
          </span>
        )}
      </div>
    </button>
  );
};
