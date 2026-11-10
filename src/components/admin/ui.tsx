import React from 'react';
import type { ReportSeverity } from '../../types/domain';

/** Small shared pieces for the admin workspace. Solid surfaces, words next to every color. */

const SEVERITY: Record<ReportSeverity, { label: string; dot: string }> = {
  critical: { label: 'Kritis', dot: 'bg-st-ditolak' },
  high: { label: 'Tinggi', dot: 'bg-st-baru' },
  medium: { label: 'Sedang', dot: 'bg-ink-3' },
  low: { label: 'Rendah', dot: 'bg-line' },
};

export const SeverityMark: React.FC<{ severity: ReportSeverity | string; className?: string }> = ({ severity, className = '' }) => {
  const meta = SEVERITY[severity as ReportSeverity] ?? SEVERITY.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 ${className}`}>
      <span aria-hidden="true" className={`w-2 h-2 rounded-sm rotate-45 shrink-0 ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

/** Whole days since an ISO date, never negative, 0 when the date is unreadable. */
export function daysSince(value?: string | null): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function ageLabel(value?: string | null): string {
  const days = daysSince(value);
  if (days === 0) return 'hari ini';
  if (days === 1) return 'kemarin';
  return `${days} hari`;
}

/** Horizontal meter. Width is written through a ref so no inline style attribute is needed. */
export const Meter: React.FC<{ percent: number; label: string; className?: string; tone?: 'brand' | 'warn' }> = ({
  percent,
  label,
  className = '',
  tone = 'brand',
}) => {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
  return (
    <div role="img" aria-label={label} className={`h-2 rounded-full bg-surface-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${tone === 'warn' ? 'bg-st-baru' : 'bg-brand'}`}
        ref={(el) => {
          if (el) el.style.width = `${clamped}%`;
        }}
      />
    </div>
  );
};

interface SectionHeadProps {
  title: string;
  note?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'h2' | 'h3';
}

export const SectionHead: React.FC<SectionHeadProps> = ({ title, note, actions, as: Tag = 'h2' }) => (
  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
    <div className="min-w-0">
      <Tag className="font-sans text-[15px] font-semibold text-ink">{title}</Tag>
      {note && <p className="mt-0.5 text-xs text-ink-3">{note}</p>}
    </div>
    {actions}
  </div>
);

export const Notice: React.FC<{ kind: 'error' | 'success' | 'info'; children: React.ReactNode; className?: string }> = ({
  kind,
  children,
  className = '',
}) => (
  <p
    role={kind === 'error' ? 'alert' : 'status'}
    className={`rounded-lg border px-3.5 py-2.5 text-sm ${
      kind === 'error'
        ? 'border-st-ditolak/40 bg-st-ditolak/10 text-ink'
        : kind === 'success'
        ? 'border-st-tuntas/40 bg-st-tuntas/10 text-ink'
        : 'border-line-soft bg-surface-2 text-ink-2'
    } ${className}`}
  >
    {children}
  </p>
);

export const EmptyNote: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="px-6 py-12 text-center">
    <p className="font-display text-base font-semibold text-ink">{title}</p>
    {children && <p className="mt-1 text-sm text-ink-2">{children}</p>}
  </div>
);

export const formatRupiah = (value: number): string => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

/** Rp 14,5 M for billions, Rp 250 jt for millions. Keeps tables readable. */
export function formatRupiahShort(value: number): string {
  const abs = Math.abs(value);
  const fmt = (n: number, unit: string) => `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
  if (abs >= 1e12) return fmt(value / 1e12, 'T');
  if (abs >= 1e9) return fmt(value / 1e9, 'M');
  if (abs >= 1e6) return fmt(value / 1e6, 'jt');
  return formatRupiah(value);
}
