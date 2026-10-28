import React from 'react';
import { Report } from '../../types/domain';
import { ReportQueueItem } from './ReportQueueItem';
import { AdminSortOption } from './types';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

interface ReportQueueListProps {
  reports: Report[];
  totalReportsCount: number;
  selectedReportId: string;
  onSelectReport: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: AdminSortOption;
  onSortByChange: (sort: AdminSortOption) => void;
  className?: string;
}

const CATEGORIES = [
  'Semua',
  'Infrastruktur',
  'Lingkungan',
  'Pendidikan',
  'Kesehatan',
  'Lainnya',
];

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
  className = '',
}) => {
  return (
    <div
      className={`admin-queue-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Top Header: Title and Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E2DA] dark:border-[#26352E]">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#20221D] dark:text-[#F3F6F4]">
            Antrean Laporan ({reports.length}
            {reports.length !== totalReportsCount ? ` / ${totalReportsCount}` : ''})
          </h3>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#686B65] dark:text-[#9EACA3] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="text-xs bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-full px-3 py-1.5 text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981] cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="submitted">Baru Masuk</option>
            <option value="under_review">Menunggu Verifikasi</option>
            <option value="needs_info">Butuh Info</option>
            <option value="accepted_for_routing">Disetujui untuk Rute</option>
            <option value="forwarded_to_institution">Diteruskan ke Dinas</option>
            <option value="institution_responded">Dinas Merespon</option>
            <option value="resolved">Tuntas Ditangani</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Search Input & Sort Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#686B65] dark:text-[#9EACA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari ID ref (TIK-...) atau judul..."
            className="w-full pl-8 pr-8 py-2 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686B65] hover:text-[#20221D] dark:text-[#9EACA3] dark:hover:text-[#F3F6F4]"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#686B65] dark:text-[#9EACA3]" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as AdminSortOption)}
            className="text-xs bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl px-2.5 py-2 text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981] cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="severity">Urgensi</option>
          </select>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryFilterChange(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610]'
                  : 'bg-[#F7F6F1] dark:bg-[#131916] text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] border border-[#E4E2DA]/80 dark:border-[#26352E]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Queue Items List */}
      <div className="divide-y divide-[#E4E2DA]/60 dark:divide-[#26352E] max-h-[520px] overflow-y-auto no-scrollbar space-y-1">
        {reports.length > 0 ? (
          reports.map((report) => (
            <ReportQueueItem
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onSelect={onSelectReport}
            />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[#686B65] dark:text-[#9EACA3] space-y-2">
            <p className="font-semibold text-[#20221D] dark:text-[#F3F6F4]">
              Tidak ada laporan yang cocok.
            </p>
            <p>Cobalah mengganti filter status, kategori, atau kata kunci pencarian.</p>
            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  onSearchQueryChange('');
                  onStatusFilterChange('all');
                  onCategoryFilterChange('Semua');
                }}
                className="mt-2 text-xs font-bold text-[#263F35] dark:text-[#34D399] underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
