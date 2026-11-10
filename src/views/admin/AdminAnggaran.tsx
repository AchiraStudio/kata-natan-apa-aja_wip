import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Copy, Check, Search } from 'lucide-react';
import type { UserProfile, BudgetSectorContext, Report } from '../../types/domain';
import { dataService } from '../../services/dataService';
import { Meter, EmptyNote, Notice, formatRupiahShort } from '../../components/admin';

interface Props {
  profile: UserProfile;
}

type SortKey = 'pagu' | 'realisasi' | 'serapan' | 'kerusakan';

const SORT_LABEL: Record<SortKey, string> = {
  pagu: 'Pagu terbesar',
  realisasi: 'Realisasi terbesar',
  serapan: 'Serapan tertinggi',
  kerusakan: 'Estimasi kerusakan terbesar',
};

const CATEGORY_KEYWORDS: Array<[string, string]> = [
  ['infrastruktur', 'Infrastruktur'],
  ['lingkungan', 'Lingkungan'],
  ['kesehatan', 'Kesehatan'],
  ['pendidikan', 'Pendidikan'],
];

/** Which reports belong to a sector: same agency, or same category as the sector name implies. */
function reportsForSector(sector: BudgetSectorContext, reports: Report[]): Report[] {
  const agencyKey = (sector.agencyAcronym || sector.responsibleAgency || '').toLowerCase();
  const name = sector.sectorName.toLowerCase();
  return reports.filter((r) => {
    if (agencyKey && (r.responsibleAgency || '').toLowerCase().includes(agencyKey)) return true;
    return CATEGORY_KEYWORDS.some(([keyword, category]) => name.includes(keyword) && r.category === category);
  });
}

export const AdminAnggaran: React.FC<Props> = () => {
  const [sectors, setSectors] = useState<BudgetSectorContext[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('Semua');
  const [sortBy, setSortBy] = useState<SortKey>('pagu');
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [fetchedSectors, fetchedReports] = await Promise.all([dataService.getBudgetSectors(), dataService.getAllReports()]);
      setSectors(fetchedSectors ?? []);
      setReports(fetchedReports ?? []);
    } catch {
      setLoadError('Data anggaran belum dapat dimuat. Periksa koneksi lalu segarkan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(
    () =>
      sectors.map((sector) => {
        const matched = reportsForSector(sector, reports);
        const damage = matched.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
        const absorption = sector.paguAllocation > 0 ? (sector.realizedSpending / sector.paguAllocation) * 100 : 0;
        const remaining = Math.max(0, sector.paguAllocation - sector.realizedSpending);
        return {
          sector,
          reportCount: matched.length,
          resolvedCount: matched.filter((r) => r.status === 'resolved').length,
          damage,
          absorption,
          remaining,
          shortfall: damage > remaining,
        };
      }),
    [sectors, reports]
  );

  const agencies = useMemo(() => ['Semua', ...new Set(sectors.map((s) => s.agencyAcronym || s.responsibleAgency).filter(Boolean))], [sectors]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ sector }) => {
        if (agency !== 'Semua' && (sector.agencyAcronym || sector.responsibleAgency) !== agency) return false;
        return !q || [sector.responsibleAgency, sector.sectorName, sector.subSectorName].some((v) => v?.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'realisasi') return b.sector.realizedSpending - a.sector.realizedSpending;
        if (sortBy === 'serapan') return b.absorption - a.absorption;
        if (sortBy === 'kerusakan') return b.damage - a.damage;
        return b.sector.paguAllocation - a.sector.paguAllocation;
      });
  }, [rows, query, agency, sortBy]);

  const totals = useMemo(() => {
    const pagu = rows.reduce((s, r) => s + r.sector.paguAllocation, 0);
    const realized = rows.reduce((s, r) => s + r.sector.realizedSpending, 0);
    const damage = rows.reduce((s, r) => s + r.damage, 0);
    return {
      pagu,
      realized,
      damage,
      remaining: Math.max(0, pagu - realized),
      absorption: pagu > 0 ? (realized / pagu) * 100 : 0,
      withCost: reports.filter((r) => (r.estimatedCost || 0) > 0).length,
    };
  }, [rows, reports]);

  const year = sectors[0]?.fiscalYear;

  const copySummary = async () => {
    const lines = [
      `Rekap APBD Kota Bogor${year ? ` TA ${year}` : ''}`,
      `Pagu: ${formatRupiahShort(totals.pagu)}`,
      `Realisasi: ${formatRupiahShort(totals.realized)} (${totals.absorption.toFixed(1)}%)`,
      `Estimasi kerusakan dari laporan warga: ${formatRupiahShort(totals.damage)}`,
      `Sisa pagu: ${formatRupiahShort(totals.remaining)}`,
      '',
      ...rows.map(
        (r) =>
          `${r.sector.agencyAcronym || r.sector.responsibleAgency} / ${r.sector.sectorName}: pagu ${formatRupiahShort(r.sector.paguAllocation)}, realisasi ${formatRupiahShort(r.sector.realizedSpending)} (${r.absorption.toFixed(1)}%), kerusakan ${formatRupiahShort(r.damage)}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setLoadError('Ringkasan belum dapat disalin. Izinkan akses papan klip di peramban.');
    }
  };

  const figures: Array<[string, string, string]> = [
    ['Pagu', formatRupiahShort(totals.pagu), `${sectors.length} sektor`],
    ['Realisasi', formatRupiahShort(totals.realized), `${totals.absorption.toFixed(1)}% terserap`],
    ['Estimasi kerusakan', formatRupiahShort(totals.damage), `dari ${totals.withCost} laporan yang mencantumkan biaya`],
    ['Sisa pagu', formatRupiahShort(totals.remaining), totals.remaining >= totals.damage ? 'cukup untuk estimasi kerusakan' : 'kurang dari estimasi kerusakan'],
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Rekap APBD{year ? ` ${year}` : ''}</h2>
          <p className="mt-1 text-sm text-ink-2 max-w-2xl">Pagu dan realisasi belanja per sektor, dibandingkan dengan estimasi kerusakan yang dilaporkan warga.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={copySummary} disabled={rows.length === 0} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 transition-colors cursor-pointer">
            {copied ? <Check className="w-4 h-4 text-st-tuntas" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin' : 'Salin ringkasan'}
          </button>
          <button type="button" onClick={loadData} disabled={isLoading} aria-label="Segarkan" className="w-9 h-9 rounded-lg bg-surface-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {loadError && <Notice kind="error">{loadError}</Notice>}

      {isLoading && sectors.length === 0 ? (
        <p role="status" className="panel px-5 py-12 text-center text-sm text-ink-2">
          Memuat data anggaran
        </p>
      ) : sectors.length === 0 ? (
        <div className="panel">
          <EmptyNote title="Data anggaran belum tersedia">Sektor APBD belum diisi di database, jadi belum ada yang bisa direkap.</EmptyNote>
        </div>
      ) : (
        <>
          <dl className="panel grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line-soft overflow-hidden">
            {figures.map(([label, value, note]) => (
              <div key={label} className="px-5 py-4">
                <dt className="text-xs text-ink-3">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{value}</dd>
                <p className="mt-0.5 text-xs text-ink-3">{note}</p>
              </div>
            ))}
          </dl>

          <section aria-label="Rincian per sektor" className="panel overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-line-soft">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" aria-hidden="true" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari dinas atau sektor" aria-label="Cari dinas atau sektor" className="titik-pill-input pl-9 pr-3" />
              </div>
              <select value={agency} onChange={(e) => setAgency(e.target.value)} aria-label="Filter dinas" className="titik-pill-input px-3 sm:w-44">
                {agencies.map((a) => (
                  <option key={a} value={a}>
                    {a === 'Semua' ? 'Semua dinas' : a}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} aria-label="Urutan" className="titik-pill-input px-3 sm:w-56">
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[780px]">
                <thead>
                  <tr className="text-left text-xs text-ink-3 border-b border-line-soft">
                    <th scope="col" className="px-5 py-3 font-medium">Dinas dan sektor</th>
                    <th scope="col" className="px-3 py-3 font-medium text-right">Pagu</th>
                    <th scope="col" className="px-3 py-3 font-medium w-48">Realisasi</th>
                    <th scope="col" className="px-3 py-3 font-medium text-right">Laporan</th>
                    <th scope="col" className="px-5 py-3 font-medium text-right">Estimasi kerusakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-ink-2">
                        Tidak ada sektor yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    visible.map(({ sector, reportCount, resolvedCount, damage, absorption, shortfall }) => (
                      <tr key={sector.sectorId} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink">{sector.agencyAcronym || sector.responsibleAgency}</p>
                          <p className="text-ink-2">{sector.sectorName}</p>
                          <p className="text-xs text-ink-3">{sector.subSectorName}</p>
                        </td>
                        <td className="px-3 py-4 text-right tabular-nums text-ink">{formatRupiahShort(sector.paguAllocation)}</td>
                        <td className="px-3 py-4">
                          <p className="tabular-nums text-ink">
                            {formatRupiahShort(sector.realizedSpending)} <span className="text-ink-3">({absorption.toFixed(1)}%)</span>
                          </p>
                          <Meter percent={absorption} label={`${sector.sectorName}: serapan ${absorption.toFixed(1)}%`} className="mt-1.5" />
                        </td>
                        <td className="px-3 py-4 text-right tabular-nums text-ink">
                          {reportCount}
                          <span className="block text-xs text-ink-3">{resolvedCount} tuntas</span>
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          <span className="text-ink">{damage > 0 ? formatRupiahShort(damage) : 'Rp 0'}</span>
                          {shortfall && <span className="block text-xs font-semibold text-st-baru">melebihi sisa pagu</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
