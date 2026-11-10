import React, { useMemo } from 'react';
import { Select } from '../common/Select';
import { Search } from 'lucide-react';
import type { Report, ReportStatus } from '../../types/domain';
import { StatusLabel } from '../common/StatusLabel';
import { getStatusMeta } from '../../utils/reportStatus';
import type { AdminSortOption } from './types';
import { SeverityMark, ageLabel, EmptyNote } from './ui';

const STATUS_ORDER: ReportStatus[] = [
  'submitted',
  'under_review',
  'needs_info',
  'accepted_for_routing',
  'forwarded_to_institution',
  'institution_responded',
  'resolved',
  'rejected',
];

interface ReportQueueListProps {
  reports: Report[];
  totalReportsCount: number;
  selectedReportId: string;
  onSelectReport: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: AdminSortOption;
  onSortByChange: (value: AdminSortOption) => void;
  isLoading?: boolean;
  className?: string;
}

export const ReportQueueList: React.FC<ReportQueueListProps> = ({
  reports,
  totalReportsCount,
  selectedReportId,
  onSelectReport,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  isLoading = false,
  className = '',
}) => {
  const categories = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => r.category && set.add(r.category));
    if (categoryFilter !== 'Semua') set.add(categoryFilter);
    return [...set].sort((a, b) => a.localeCompare(b, 'id'));
  }, [reports, categoryFilter]);

  const hasFilter = statusFilter !== 'all' || categoryFilter !== 'Semua' || searchQuery.trim() !== '';

  return (
    <section aria-label="Antrean laporan" className={`panel flex flex-col min-h-0 overflow-hidden ${className}`}>
      <div className="p-3 sm:p-4 space-y-2.5 border-b border-line-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari kode, judul, alamat, pelapor"
            aria-label="Cari laporan"
            className="titik-pill-input pl-9 pr-3"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={statusFilter} onChange={onStatusFilterChange} aria-label="Filter status" className="col-span-2 text-[13px]">
            <option value="all">Semua status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {getStatusMeta(s).label}
              </option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={onCategoryFilterChange} aria-label="Filter kategori" className="text-[13px]">
            <option value="Semua">Semua kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={sortBy} onChange={onSortByChange} aria-label="Urutan" className="text-[13px]">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="severity">Paling parah</option>
          </Select>
        </div>
        <p className="text-xs text-ink-3" role="status" aria-live="polite">
          {reports.length} dari {totalReportsCount} laporan
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                onStatusFilterChange('all');
                onCategoryFilterChange('Semua');
                onSearchQueryChange('');
              }}
              className="ml-2 underline underline-offset-2 text-ink-2 hover:text-ink cursor-pointer"
            >
              Hapus filter
            </button>
          )}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading && reports.length === 0 ? (
          <p role="status" className="px-4 py-10 text-center text-sm text-ink-2">
            Memuat antrean
          </p>
        ) : reports.length === 0 ? (
          <EmptyNote title={hasFilter ? 'Tidak ada yang cocok' : 'Antrean kosong'}>
            {hasFilter ? 'Ubah kata kunci atau filter.' : 'Laporan baru dari warga akan muncul di sini.'}
          </EmptyNote>
        ) : (
          <ul className="divide-y divide-line-soft">
            {reports.map((r) => {
              const selected = r.id === selectedReportId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelectReport(r.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${selected ? 'bg-brand-soft' : 'hover:bg-surface-2/60'}`}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <span className="titik-id text-[11px] text-ink-3">{r.publicReference}</span>
                      <StatusLabel status={r.status} />
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-ink leading-snug line-clamp-2">{r.title}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-3">
                      <SeverityMark severity={r.severity} />
                      <span>masuk {ageLabel(r.createdAt)}</span>
                      {r.reporterDisplayName && <span className="truncate max-w-[10rem]">{r.reporterDisplayName}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
