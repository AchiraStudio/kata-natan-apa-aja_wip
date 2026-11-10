import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MapPin,
  Plus,
  Search,
  Share2,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Select } from '../components/common/Select';
import { StatusLabel } from '../components/common/StatusLabel';
import { useTitik } from '../context/TitikContext';
import type { Facility, Report } from '../types/domain';
import { getStatusMeta, type StatusTone } from '../utils/reportStatus';
import {
  BudgetBars,
  CategoryBars,
  KpiStrip,
  StatusDonut,
  WeeklyTrend,
} from '../components/explore/ExploreCharts';
import { getReportMediaType } from '../utils/reportEvidence';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';
import './ExploreView.css';

type Tab = 'reports' | 'facilities';
type StatusFilter = 'all' | StatusTone;

const ALL = 'Semua';
const STATUS_FILTERS: Array<[StatusFilter, string]> = [
  ['all', 'Semua status'],
  ['baru', 'Menunggu'],
  ['ditindak', 'Ditindak'],
  ['tuntas', 'Tuntas'],
  ['ditolak', 'Ditolak'],
];

const matches = (query: string, ...fields: Array<string | undefined>) => {
  const q = query.trim().toLocaleLowerCase('id');
  if (!q) return true;
  return fields.some((field) => field?.toLocaleLowerCase('id').includes(q));
};

const tally = (values: string[]) => {
  const countByValue = new Map<string, number>();
  values.filter(Boolean).forEach((value) => countByValue.set(value, (countByValue.get(value) ?? 0) + 1));
  return [...countByValue.entries()].sort((a, b) => b[1] - a[1]);
};

const reportUrl = (report: Report) => `/laporan/${encodeURIComponent(report.publicReference || report.id)}`;

export const ExploreView: React.FC = () => {
  const { facilities, posts, isLoading, openReportModal, budgetSectors } = useTitik();
  const [tab, setTab] = useState<Tab>('reports');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const reports = useMemo<Report[]>(() => {
    const uniqueReports = new Map<string, Report>();
    posts.forEach((post) => {
      if (post.relatedReport && !uniqueReports.has(post.relatedReport.id)) {
        uniqueReports.set(post.relatedReport.id, post.relatedReport);
      }
    });
    return [...uniqueReports.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [posts]);

  const categories = useMemo(
    () => tally(tab === 'reports' ? reports.map((report) => report.category) : facilities.map((facility) => facility.category)),
    [tab, reports, facilities]
  );

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          (category === ALL || report.category === category) &&
          (status === 'all' || getStatusMeta(report.status).tone === status) &&
          matches(
            query,
            report.title,
            report.description,
            report.publicReference,
            report.location?.address,
            report.location?.district,
            report.location?.city,
            report.responsibleAgency,
            report.facilityName
          )
      ),
    [reports, category, status, query]
  );

  const filteredFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) =>
          (category === ALL || facility.category === category) &&
          matches(query, facility.name, facility.address, facility.responsibleAgency, facility.category)
      ),
    [facilities, category, query]
  );

  const hasFilters = Boolean(query.trim()) || category !== ALL || status !== 'all';
  const resultCount = tab === 'reports' ? filteredReports.length : filteredFacilities.length;
  const featuredReport = filteredReports[0];
  const relatedReports = filteredReports.slice(1, 7);
  const featuredFacility = filteredFacilities[0];
  const relatedFacilities = filteredFacilities.slice(1, 7);

  const resetFilters = () => {
    setQuery('');
    setCategory(ALL);
    setStatus('all');
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setCategory(ALL);
    setStatus('all');
  };

  const pickStatus = (tone: StatusTone) => {
    setTab('reports');
    setStatus((current) => (current === tone ? 'all' : tone));
  };

  const pickCategory = (name: string) => {
    setTab('reports');
    setCategory((current) => (current === name ? ALL : name));
  };

  const shareFeaturedReport = async () => {
    if (!featuredReport) return;
    const url = `${window.location.origin}${reportUrl(featuredReport)}`;
    setShareError(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: featuredReport.title,
          text: featuredReport.description,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Could not share featured report:', error);
        setShareError('Laporan belum dapat dibagikan.');
      }
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">Temukan kabar warga</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Jelajah</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-2">
            Telusuri laporan terbaru, fasilitas publik, dan perkembangan penanganan dari warga.
          </p>
        </div>
        <button
          type="button"
          onClick={openReportModal}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Buat laporan
        </button>
      </header>

      <section className="mt-5 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_180px]">
        <div role="tablist" aria-label="Jenis data" className="titik-pill-track w-fit self-start">
          {([
            ['reports', `Laporan (${reports.length})`],
            ['facilities', `Fasilitas (${facilities.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={`titik-pill-tab ${tab === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === 'reports' ? 'Cari judul, kode laporan, atau lokasi' : 'Cari fasilitas, lokasi, atau dinas'}
            aria-label="Cari"
            className="titik-pill-input pl-10 pr-3"
          />
        </label>
        {tab === 'reports' && (
          <Select value={status} onChange={setStatus} aria-label="Filter status">
            {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        )}
      </section>

      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Kategori">
          {[[ALL, tab === 'reports' ? reports.length : facilities.length] as [string, number], ...categories].map(([name, count]) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === name ? 'bg-brand text-on-brand' : 'bg-surface-2 text-ink-2 hover:text-ink'
              }`}
            >
              {name} <span className="ml-1 opacity-70 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="explore-content-grid mt-5">
        <section className="min-w-0" aria-label={tab === 'reports' ? 'Laporan warga' : 'Fasilitas publik'}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-3" role="status" aria-live="polite">
              {resultCount} {tab === 'reports' ? 'laporan' : 'fasilitas'}
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-3 inline-flex items-center gap-1 text-ink-2 underline underline-offset-2 hover:text-ink"
                >
                  <X className="h-3 w-3" /> Hapus filter
                </button>
              )}
            </p>
          </div>

          {isLoading && reports.length === 0 && facilities.length === 0 ? (
            <div className="panel flex min-h-64 items-center justify-center gap-2 text-sm text-ink-2" role="status">
              <span className="h-2.5 w-2.5 rounded-full bg-brand titik-live" /> Memuat kabar warga...
            </div>
          ) : resultCount === 0 ? (
            <div className="panel flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                {hasFilters ? 'Tidak ada hasil yang cocok' : tab === 'reports' ? 'Belum ada laporan' : 'Belum ada data fasilitas'}
              </p>
              <p className="max-w-md text-sm text-ink-2">
                {hasFilters ? 'Coba ubah kata kunci atau filter.' : 'Kabar dan data baru akan muncul di sini.'}
              </p>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="titik-pill-btn titik-pill-btn-secondary">
                  Hapus filter
                </button>
              )}
            </div>
          ) : tab === 'reports' && featuredReport ? (
            <div className="space-y-5">
              <FeaturedReport report={featuredReport} />
              {filteredReports.length > 1 && (
                <section aria-label="Semua hasil laporan">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-ink">Laporan terbaru</h2>
                    <span className="text-xs text-ink-3">{filteredReports.length - 1} lainnya</span>
                  </div>
                  <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line-soft bg-surface">
                    {filteredReports.slice(1).map((report) => <ReportRow key={report.id} report={report} />)}
                  </ul>
                </section>
              )}
            </div>
          ) : tab === 'facilities' ? (
            <div className="space-y-4">
              {featuredFacility && <FeaturedFacility facility={featuredFacility} />}
              <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line-soft bg-surface">
                {filteredFacilities.slice(featuredFacility ? 1 : 0).map((facility) => (
                  <FacilityRow key={facility.id} facility={facility} />
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="explore-sidebar">
          {tab === 'reports' && featuredReport ? (
            <>
              <section className="panel flex items-center justify-between gap-3 p-4">
                <div>
                  <h2 className="text-sm font-bold text-ink">Bagikan laporan</h2>
                  <p className="mt-1 text-xs text-ink-3">Sebarkan informasi ini ke warga lain.</p>
                  {shareError && <p role="alert" className="mt-2 text-xs text-st-ditolak">{shareError}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void shareFeaturedReport()}
                  aria-label="Bagikan laporan"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand hover:bg-brand-soft"
                >
                  {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </button>
              </section>
              <section className="panel p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">Temukan</p>
                    <h2 className="mt-0.5 font-display text-lg font-bold text-ink">Laporan terkait</h2>
                  </div>
                  <span className="text-xs text-ink-3">{relatedReports.length}</span>
                </div>
                {relatedReports.length ? (
                  <ul className="divide-y divide-line-soft">
                    {relatedReports.map((report) => <RelatedReport key={report.id} report={report} />)}
                  </ul>
                ) : (
                  <p className="py-3 text-xs leading-relaxed text-ink-3">Laporan lain akan muncul di sini saat tersedia.</p>
                )}
              </section>
            </>
          ) : (
            <section className="panel p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">Fasilitas publik</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink">Jelajahi sekitar</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">Lihat fasilitas publik dan laporan terkait lokasinya.</p>
              <Link to="/map" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                Buka peta <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}
          {tab === 'facilities' && relatedFacilities.length > 0 && (
            <section className="panel p-4">
              <h2 className="font-display text-lg font-bold text-ink">Fasilitas lainnya</h2>
              <ul className="mt-2 divide-y divide-line-soft">
                {relatedFacilities.slice(0, 4).map((facility) => (
                  <li key={facility.id} className="py-2">
                    <p className="text-xs font-semibold text-ink">{facility.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-3">{facility.category}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="panel p-4">
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">Transparansi</p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-ink">Ringkasan warga</h2>
            </div>
            {tab === 'reports' && reports.length > 0 ? (
              <div className="space-y-3">
                <MiniStatusCounts reports={reports} />
                <Link to="/map" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                  Jelajahi peta <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-ink-3">Jumlah laporan dan tindak lanjut akan tampil setelah laporan tersedia.</p>
            )}
          </section>
        </aside>
      </div>

      {tab === 'reports' && reports.length > 0 && (
        <section className="mt-10 border-t border-line-soft pt-6" aria-label="Statistik laporan">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">Data terbuka</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-ink">Perkembangan laporan</h2>
          </div>
          <div className="mb-4"><KpiStrip reports={reports} /></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <StatusDonut reports={reports} activeTone={status} onPick={pickStatus} />
            <CategoryBars reports={reports} activeCategory={category} onPick={pickCategory} />
            <WeeklyTrend reports={reports} wide={budgetSectors.length === 0} />
            <BudgetBars sectors={budgetSectors} />
          </div>
        </section>
      )}
    </main>
  );
};

const FeaturedReport: React.FC<{ report: Report }> = ({ report }) => {
  const thumbnail = report.mediaUrls?.find((url) => getReportMediaType(url) !== 'video');
  const location = [report.location?.district, report.location?.city].filter(Boolean).join(', ');
  return (
    <article className="overflow-hidden rounded-2xl border border-line-soft bg-surface">
      <div className="px-4 pb-4 pt-5 sm:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 font-semibold text-brand">{report.category}</span>
          <span className="titik-id">{report.publicReference}</span>
          <StatusLabel status={report.status} />
        </div>
        <Link to={reportUrl(report)} className="group">
          <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-ink group-hover:text-brand sm:text-3xl">
            {report.title}
          </h2>
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-3">
          {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{location}</span>}
          {report.createdAt && <span>{formatIndonesianTimeAgo(report.createdAt)}</span>}
          {report.responsibleAgency && <span>{report.responsibleAgency}</span>}
        </div>
      </div>
      {thumbnail && (
        <Link to={reportUrl(report)} className="block bg-surface-2">
          <img src={thumbnail} alt="" className="aspect-[16/9] max-h-[440px] w-full object-cover" loading="lazy" />
        </Link>
      )}
      <div className="px-4 py-4 sm:px-6">
        <p className="break-words text-sm leading-7 text-ink-2">{report.description || 'Belum ada keterangan tambahan untuk laporan ini.'}</p>
        {report.facilityName && <p className="mt-3 text-xs text-ink-3">Fasilitas: {report.facilityName}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
            <ThumbsUp className="h-3.5 w-3.5" /> {report.supportCount} dukungan warga
          </span>
          <Link to={reportUrl(report)} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
            Buka detail laporan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

const RelatedReport: React.FC<{ report: Report }> = ({ report }) => {
  const thumbnail = report.mediaUrls?.find((url) => getReportMediaType(url) !== 'video');
  return (
    <li>
      <Link to={reportUrl(report)} className="group flex min-w-0 items-center gap-3 py-3">
        <span className="explore-related-thumbnail grid h-14 place-items-center overflow-hidden rounded-xl bg-surface-2 text-brand">
          {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" /> : <MapPin className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-xs font-bold leading-snug text-ink group-hover:text-brand">{report.title}</span>
          <span className="mt-1 block truncate text-[10px] text-ink-3">{report.category} · {formatIndonesianTimeAgo(report.createdAt)}</span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
      </Link>
    </li>
  );
};

const ReportRow: React.FC<{ report: Report }> = ({ report }) => {
  const thumbnail = report.mediaUrls?.find((url) => getReportMediaType(url) !== 'video');
  const location = [report.location?.district, report.location?.city].filter(Boolean).join(', ');
  return (
    <li>
      <Link to={reportUrl(report)} className="group flex items-start gap-3 p-4 transition-colors hover:bg-surface-2/60 sm:gap-4 sm:p-5">
        <span className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-brand">
          {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" /> : <MapPin className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="titik-id text-[10px] text-ink-3">{report.publicReference}</span>
            <StatusLabel status={report.status} />
          </span>
          <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand">{report.title}</span>
          <span className="mt-1 flex items-center gap-1 truncate text-xs text-ink-3"><MapPin className="h-3 w-3 shrink-0" />{location || report.location?.address || 'Lokasi tidak dicantumkan'}</span>
          <span className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-ink-3">
            <span>{report.category}</span><span>{report.supportCount} dukungan</span><span>{formatIndonesianTimeAgo(report.createdAt)}</span>
          </span>
        </span>
        <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 text-ink-3 sm:block" />
      </Link>
    </li>
  );
};

const FeaturedFacility: React.FC<{ facility: Facility }> = ({ facility }) => (
  <article className="rounded-2xl border border-line-soft bg-surface p-5 sm:p-6">
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
      <MapPin className="h-3.5 w-3.5" /> {facility.category}
    </span>
    <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">{facility.name}</h2>
    <p className="mt-2 text-sm leading-6 text-ink-2">{facility.address}</p>
    <p className="mt-2 text-xs text-ink-3">{facility.responsibleAgency}</p>
    <div className="mt-5 flex items-center gap-8 border-t border-line-soft pt-4">
      <div><p className="font-display text-2xl font-bold text-ink">{facility.activeReportsCount}</p><p className="text-xs text-ink-3">laporan aktif</p></div>
      <div><p className="font-display text-2xl font-bold text-ink">{facility.resolvedReportsCount}</p><p className="text-xs text-ink-3">tuntas</p></div>
      <Link to="/map" className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand">Lihat peta <ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </div>
  </article>
);

const FacilityRow: React.FC<{ facility: Facility }> = ({ facility }) => (
  <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-semibold text-ink">{facility.name}</h3>
      <p className="mt-1 text-xs text-ink-2">{facility.address}</p>
      <p className="mt-1 text-xs text-ink-3">{facility.category} · {facility.responsibleAgency}</p>
    </div>
    <Link to="/map" className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-surface-2 px-3 text-xs font-semibold text-ink hover:bg-brand-soft sm:self-center">
      <MapPin className="h-3.5 w-3.5" /> Lihat peta
    </Link>
  </li>
);

const MiniStatusCounts: React.FC<{ reports: Report[] }> = ({ reports }) => {
  const counts = useMemo(() => {
    const result: Record<StatusTone, number> = { baru: 0, ditindak: 0, tuntas: 0, ditolak: 0 };
    reports.forEach((report) => { result[getStatusMeta(report.status).tone] += 1; });
    return result;
  }, [reports]);
  const rows: Array<[StatusTone, string]> = [
    ['baru', 'Menunggu'],
    ['ditindak', 'Ditindak'],
    ['tuntas', 'Tuntas'],
    ['ditolak', 'Ditolak'],
  ];
  return (
    <dl className="space-y-2">
      {rows.filter(([tone]) => tone !== 'ditolak' || counts.ditolak > 0).map(([tone, label]) => (
        <div key={tone} className="flex items-center justify-between gap-3 text-xs">
          <dt className="flex items-center gap-2 text-ink-2">
            <span className={`h-2 w-2 rounded-full ${tone === 'baru' ? 'bg-st-baru' : tone === 'ditindak' ? 'bg-st-ditindak' : tone === 'tuntas' ? 'bg-st-tuntas' : 'bg-st-ditolak'}`} />
            {label}
          </dt>
          <dd className="font-bold tabular-nums text-ink">{counts[tone]}</dd>
        </div>
      ))}
    </dl>
  );
};

export default ExploreView;
