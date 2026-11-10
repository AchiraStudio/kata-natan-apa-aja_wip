import React from 'react';
import type { BudgetSectorContext } from '../../types/domain';
import { formatRupiahShort } from '../admin/ui';

const clampPercent = (value: number) => (Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);

/**
 * Budget of the sector this report falls under. It is context, not money set aside for the
 * report, and the panel says so. The sample-data note only shows when the data is flagged as sample.
 */
export const BudgetPanel: React.FC<{ budget?: BudgetSectorContext }> = ({ budget }) => {
  if (!budget) {
    return (
      <section aria-labelledby="budget-heading" className="panel p-5 sm:p-6">
        <h2 id="budget-heading" className="font-sans text-base font-semibold text-ink">
          Konteks anggaran
        </h2>
        <p className="mt-3 text-sm text-ink-2">Belum ada data anggaran yang terhubung dengan laporan ini.</p>
      </section>
    );
  }

  const spentPercent = clampPercent(budget.executionRatePercent);
  const remaining = Math.max(0, budget.paguAllocation - budget.realizedSpending);

  return (
    <section aria-labelledby="budget-heading" className="panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="budget-heading" className="font-sans text-base font-semibold text-ink">
          Konteks anggaran
        </h2>
        <span className="text-xs text-ink-3 tabular-nums">APBD {budget.fiscalYear}</span>
      </div>

      <p className="mt-3 text-sm font-semibold text-ink leading-snug">{budget.sectorName}</p>
      {budget.subSectorName && <p className="text-sm text-ink-2">{budget.subSectorName}</p>}

      <svg
        role="img"
        aria-label={`${spentPercent}% anggaran sektor sudah terserap`}
        className="mt-4 w-full h-2 block"
      >
        <rect width="100%" height="100%" rx="4" className="fill-surface-2" />
        <rect width={`${spentPercent}%`} height="100%" rx="4" className="fill-brand" />
      </svg>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2">Pagu</dt>
          <dd className="font-semibold text-ink tabular-nums">{formatRupiahShort(budget.paguAllocation)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2">Terserap</dt>
          <dd className="font-semibold text-ink tabular-nums">
            {formatRupiahShort(budget.realizedSpending)} <span className="font-normal text-ink-2">({spentPercent}%)</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2">Sisa</dt>
          <dd className="font-semibold text-ink tabular-nums">{formatRupiahShort(remaining)}</dd>
        </div>
      </dl>

      <dl className="mt-4 pt-4 border-t border-line-soft space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2 shrink-0">Dinas</dt>
          <dd className="text-right text-ink">{budget.responsibleAgency}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2">Skor responsif</dt>
          <dd className="font-semibold text-ink tabular-nums">{budget.responsivenessScore} dari 100</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-2">Rata-rata penyelesaian</dt>
          <dd className="font-semibold text-ink tabular-nums">{budget.avgResolutionDays} hari kerja</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-3 leading-relaxed">
        Angka ini menggambarkan sektor, bukan dana khusus untuk laporan ini. Sumber: {budget.dataSource}, diperbarui{' '}
        {budget.lastUpdated}.{budget.isSampleData && ' Data ini contoh, bukan angka resmi.'}
      </p>
    </section>
  );
};
