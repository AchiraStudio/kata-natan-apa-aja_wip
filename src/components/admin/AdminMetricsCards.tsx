import React from 'react';
import { AdminMetricsSummary } from './types';
import { ReportStatus } from '../../types/domain';

interface AdminMetricsCardsProps {
  metrics: AdminMetricsSummary;
  activeStatus?: string;
  onSelectStatus?: (status: ReportStatus) => void;
}

export const AdminMetricsCards: React.FC<AdminMetricsCardsProps> = ({
  metrics,
  activeStatus,
  onSelectStatus,
}) => {
  const cards = [
    {
      status: 'under_review' as ReportStatus,
      label: 'Menunggu Verifikasi',
      count: metrics.underReview,
      colorText: 'text-[#92400E] dark:text-amber-400',
      activeRing: 'ring-2 ring-amber-500/50',
    },
    {
      status: 'needs_info' as ReportStatus,
      label: 'Butuh Info Warga',
      count: metrics.needsInfo,
      colorText: 'text-rose-700 dark:text-rose-400',
      activeRing: 'ring-2 ring-rose-500/50',
    },
    {
      status: 'forwarded_to_institution' as ReportStatus,
      label: 'Diteruskan ke Dinas',
      count: metrics.forwarded,
      colorText: 'text-blue-700 dark:text-blue-400',
      activeRing: 'ring-2 ring-blue-500/50',
    },
    {
      status: 'resolved' as ReportStatus,
      label: 'Tuntas Ditangani',
      count: metrics.resolved,
      colorText: 'text-[#1B4332] dark:text-[#34D399]',
      activeRing: 'ring-2 ring-emerald-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isActive = activeStatus === card.status;
        return (
          <button
            key={card.status}
            type="button"
            onClick={() => onSelectStatus?.(card.status)}
            className={`admin-metric-card text-left bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#1B4332]/30 dark:hover:border-[#10B981]/40 transition-all cursor-pointer ${
              isActive ? card.activeRing : ''
            }`}
          >
            <span className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] font-medium block">
              {card.label}
            </span>
            <div
              className={`text-2xl font-extrabold tracking-tight tabular-nums mt-1 ${card.colorText}`}
            >
              {card.count}
            </div>
          </button>
        );
      })}
    </div>
  );
};
