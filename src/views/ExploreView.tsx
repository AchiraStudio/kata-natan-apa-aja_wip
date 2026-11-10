import React, { useMemo, useState } from 'react';
import { Select } from '../components/common/Select';
import { Link } from 'react-router-dom';
import { Search, X, MapPin, ThumbsUp, Plus, ArrowRight } from 'lucide-react';
import { useTitik } from '../context/TitikContext';
import { Report, Facility } from '../types/domain';
import { PageShell, PageHeader } from '../components/layout/PageShell';
import { StatusLabel } from '../components/common/StatusLabel';
import { getStatusMeta, type StatusTone } from '../utils/reportStatus';
import { KpiStrip, StatusDonut, CategoryBars, WeeklyTrend, BudgetBars } from '../components/explore/ExploreCharts';
import { getReportMediaType } from '../utils/reportEvidence';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';

type Tab = 'facilities' | 'reports';
type StatusFilter = 'all' | 'baru' | 'ditindak' | 'tuntas' | 'ditolak';

const ALL = 'Semua';

const matches = (query: string, ...fields: Array<string | undefined>) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
};

/** Count of values in a list, most frequent first. */
const tally = (values: string[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

export const ExploreView: React.FC = () => {
  const { facilities, posts, isLoading, openReportModal, budgetSectors } = useTitik();

  const [tab, setTab] = useState<Tab>('reports');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<StatusFilter>('all');

  // Reports come from the feed: one entry per report, newest first
  const reports = useMemo<Report[]>(() => {
    const seen = new Map<string, Report>();
    posts.forEach((p) => {
      if (p.relatedReport && !seen.has(p.relatedReport.id)) seen.set(p.relatedReport.id, p.relatedReport);
    });
    return [...seen.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [posts]);

  const categories = useMemo(
    () => tally(tab === 'reports' ? reports.map((r) => r.category) : facilities.map((f) => f.category)),
    [tab, reports, facilities]
  );

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          (category === ALL || r.category === category) &&
          (status === 'all' || getStatusMeta(r.status).tone === status) &&
          matches(query, r.title, r.publicReference, r.location?.address, r.responsibleAgency, r.facilityName)
      ),
    [reports, category, status, query]
  );

  const filteredFacilities = useMemo(
    () =>
      facilities.filter(
        (f) =>
          (category === ALL || f.category === category) && matches(query, f.name, f.address, f.responsibleAgency, f.category)
      ),
    [facilities, category, query]
  );

  const hasFilters = query !== '' || category !== ALL || status !== 'all';
  const resetFilters = () => {
    setQuery('');
    setCategory(ALL);
    setStatus('all');
  };
  // Chart clicks filter the report list and bring it into view
  const pickStatus = (tone: StatusTone) => {
    setTab('reports');
    setStatus((current) => (current === tone ? 'all' : (tone as StatusFilter)));
  };
  const pickCategory = (name: string) => {
    setTab('reports');
    setCategory((current) => (current === name ? ALL : name));
  };
  const switchTab = (next: Tab) => {
    setTab(next);
    setCategory(ALL);
    setStatus('all');
  };

  const resultCount = tab === 'reports' ? filteredReports.length : filteredFacilities.length;

  return (
    <PageShell width="wide">
      <PageHeader
        title="Jelajah"
        description="Fasilitas publik dan laporan warga di Kota Bogor, lengkap dengan status penanganannya."
        actions={
          <button
            type="button"
            onClick={openReportModal}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.6} />
            Buat laporan
          </button>
        }
      />

      {reports.length > 0 && (
        <div className="mb-8 space-y-4">
          <KpiStrip reports={reports} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <StatusDonut reports={reports} activeTone={status} onPick={pickStatus} />
            <CategoryBars reports={reports} activeCategory={category} onPick={pickCategory} />
            <WeeklyTrend reports={reports} wide={budgetSectors.length === 0} />
            <BudgetBars sectors={budgetSectors} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div role="tablist" aria-label="Jenis data" className="titik-pill-track shrink-0 self-start">
            {([
              ['reports', `Laporan (${reports.length})`],
              ['facilities', `Fasilitas (${facilities.length})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => switchTab(key)}
                className={`titik-pill-tab ${tab === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'reports' ? 'Cari judul, kode TIK, atau alamat' : 'Cari nama fasilitas, alamat, atau dinas'}
              aria-label="Cari"
              className="titik-pill-input pl-10 pr-3"
            />
          </div>

          {tab === 'reports' && (
            <div className="sm:w-44 shrink-0">
              <Select
                value={status}
                onChange={setStatus}
                aria-label="Filter status"
              >
                <option value="all">Semua status</option>
                <option value="baru">Menunggu</option>
                <option value="ditindak">Ditindak</option>
                <option value="tuntas">Tuntas</option>
                <option value="ditolak">Ditolak</option>
              </Select>
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Kategori">
            {[[ALL, tab === 'reports' ? reports.length : facilities.length] as [string, number], ...categories].map(([name, count]) => (
              <button
                key={name}
                type="button"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
                className={`shrink-0 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  category === name ? 'bg-ink text-on-ink' : 'bg-surface-2 text-ink-2 hover:text-ink'
                }`}
              >
                {name} <span className="opacity-60 tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-3 text-xs text-ink-3" role="status" aria-live="polite">
        {resultCount} {tab === 'reports' ? 'laporan' : 'fasilitas'}
        {hasFilters && (
          <button type="button" onClick={resetFilters} className="ml-3 inline-flex items-center gap-1 text-ink-2 hover:text-ink underline underline-offset-2">
            <X className="w-3 h-3" /> Hapus filter
          </button>
        )}
      </p>

      {/* Results */}
      {isLoading && reports.length === 0 && facilities.length === 0 ? (
        <div className="panel py-16 text-center text-sm text-ink-2" role="status">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand titik-live mb-3" />
          <p>Memuat data</p>
        </div>
      ) : resultCount === 0 ? (
        <div className="panel py-14 px-6 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-ink">
            {hasFilters ? 'Tidak ada hasil yang cocok' : tab === 'reports' ? 'Belum ada laporan' : 'Belum ada data fasilitas'}
          </p>
          <p className="text-sm text-ink-2">
            {hasFilters ? 'Ubah kata kunci atau filter untuk melihat lebih banyak.' : 'Data akan muncul di sini setelah warga mengirim laporan.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="titik-pill-btn titik-pill-btn-secondary">
              Hapus filter
            </button>
          )}
        </div>
      ) : tab === 'reports' ? (
        <ul className="panel divide-y divide-line-soft overflow-hidden">
          {filteredReports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </ul>
      ) : (
        <ul className="panel divide-y divide-line-soft overflow-hidden">
          {filteredFacilities.map((f) => (
            <FacilityRow key={f.id} facility={f} />
          ))}
        </ul>
      )}
    </PageShell>
  );
};

const ReportRow: React.FC<{ report: Report }> = ({ report }) => (
  <li>
    <Link
      to={`/laporan/${encodeURIComponent(report.publicReference || report.id)}`}
      className="flex items-start gap-4 p-4 sm:p-5 hover:bg-surface-2/60 transition-colors"
    >
      {report.mediaUrls?.[0] && getReportMediaType(report.mediaUrls[0]) !== 'video' ? (
        <img src={report.mediaUrls[0]} alt="" loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 bg-surface-2" />
      ) : (
        <span aria-hidden="true" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0 bg-surface-2" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="titik-id text-[11px] text-ink-3">{report.publicReference}</span>
          <StatusLabel status={report.status} />
        </div>
        <h3 className="mt-1 font-sans text-[15px] font-semibold text-ink leading-snug line-clamp-2">{report.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{report.location?.address || 'Lokasi tidak dicantumkan'}</span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
          <span>{report.category}</span>
          <span className="inline-flex items-center gap-1 tabular-nums whitespace-nowrap">
            <ThumbsUp className="w-3 h-3" /> {report.supportCount} terdampak
          </span>
          <span className="whitespace-nowrap">{formatIndonesianTimeAgo(report.createdAt)}</span>
        </p>
      </div>
      <ArrowRight className="hidden sm:block w-4 h-4 text-ink-3 mt-1 shrink-0" aria-hidden="true" />
    </Link>
  </li>
);

const FacilityRow: React.FC<{ facility: Facility }> = ({ facility }) => (
  <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-5">
    <div className="min-w-0 flex-1">
      <h3 className="font-sans text-[15px] font-semibold text-ink leading-snug">{facility.name}</h3>
      <p className="mt-1 text-xs text-ink-2">{facility.address}</p>
      <p className="mt-1.5 text-xs text-ink-3">
        {facility.category} / {facility.responsibleAgency}
      </p>
    </div>
    <div className="flex items-center gap-6 text-sm tabular-nums shrink-0">
      <div>
        <div className="font-display text-xl font-bold text-ink">{facility.activeReportsCount}</div>
        <div className="text-[11px] text-ink-3">aktif</div>
      </div>
      <div>
        <div className="font-display text-xl font-bold text-ink">{facility.resolvedReportsCount}</div>
        <div className="text-[11px] text-ink-3">tuntas</div>
      </div>
      <Link
        to="/map"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-2 text-ink text-[13px] font-semibold hover:bg-line transition-colors"
      >
        <MapPin className="w-3.5 h-3.5" /> Lihat peta
      </Link>
    </div>
  </li>
);
