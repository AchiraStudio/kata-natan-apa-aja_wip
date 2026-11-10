import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BudgetSectorContext, Report } from '../../types/domain';
import { StatusLabel } from '../common/StatusLabel';
import { getStatusMeta, type StatusTone } from '../../utils/reportStatus';

/* ------------------------------------------------------------------ shared */

const TONE_ORDER: StatusTone[] = ['baru', 'ditindak', 'tuntas', 'ditolak'];
const TONE_LABEL: Record<StatusTone, string> = {
  baru: 'Menunggu',
  ditindak: 'Ditindak',
  tuntas: 'Tuntas',
  ditolak: 'Ditolak',
};
const TONE_STROKE: Record<StatusTone, string> = {
  baru: 'stroke-st-baru',
  ditindak: 'stroke-st-ditindak',
  tuntas: 'stroke-st-tuntas',
  ditolak: 'stroke-st-ditolak',
};
const TONE_BG: Record<StatusTone, string> = {
  baru: 'bg-st-baru',
  ditindak: 'bg-st-ditindak',
  tuntas: 'bg-st-tuntas',
  ditolak: 'bg-st-ditolak',
};

interface TipState {
  x: number;
  y: number;
  text: string;
}

/** Tooltip that follows the pointer inside a `relative` chart wrapper. */
function useChartTip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (text: string) => (e: React.MouseEvent | React.FocusEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    if ('clientX' in e) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, text });
    else {
      const r = (e.currentTarget as Element).getBoundingClientRect();
      setTip({ x: r.left - box.left + r.width / 2, y: r.top - box.top, text });
    }
  };
  const hide = () => setTip(null);
  const node = tip ? (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-canvas tabular-nums"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.text}
    </div>
  ) : null;
  return { ref, show, hide, node };
}

const ChartPanel: React.FC<{ title: string; note?: string; className?: string; children: React.ReactNode }> = ({
  title,
  note,
  className = '',
  children,
}) => (
  <section className={`panel p-5 sm:p-6 ${className}`}>
    <header className="mb-4">
      <h2 className="font-sans text-[15px] font-semibold text-ink">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-ink-3">{note}</p>}
    </header>
    {children}
  </section>
);

export const formatRupiahCompact = (value: number): string => {
  const abs = Math.abs(value);
  const fmt = (n: number, unit: string) => `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
  if (abs >= 1e12) return fmt(value / 1e12, 'T');
  if (abs >= 1e9) return fmt(value / 1e9, 'M');
  if (abs >= 1e6) return fmt(value / 1e6, 'jt');
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
};

/* ------------------------------------------------------------- KPI strip */

export const KpiStrip: React.FC<{ reports: Report[] }> = ({ reports }) => {
  const counts = useMemo(() => {
    const c: Record<StatusTone, number> = { baru: 0, ditindak: 0, tuntas: 0, ditolak: 0 };
    reports.forEach((r) => (c[getStatusMeta(r.status).tone] += 1));
    return c;
  }, [reports]);
  const supports = reports.reduce((sum, r) => sum + (r.supportCount || 0), 0);
  const total = reports.length;
  const resolvedShare = total > 0 ? Math.round((counts.tuntas / total) * 100) : 0;

  const items = [
    { label: 'Total laporan', value: total, sub: `${supports} dukungan warga` },
    { label: 'Menunggu', value: counts.baru, sub: 'belum ditindak' },
    { label: 'Ditindak', value: counts.ditindak, sub: 'dalam penanganan dinas' },
    { label: 'Tuntas', value: counts.tuntas, sub: `${resolvedShare}% dari total` },
  ];
  return (
    <dl className="panel grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line-soft overflow-hidden">
      {items.map((item) => (
        <div key={item.label} className="px-5 py-4 sm:px-6 sm:py-5">
          <dt className="text-xs text-ink-3">{item.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold text-ink tabular-nums">{item.value}</dd>
          <p className="mt-0.5 text-xs text-ink-3">{item.sub}</p>
        </div>
      ))}
    </dl>
  );
};

/* ---------------------------------------------------------- status donut */

interface DonutProps {
  reports: Report[];
  activeTone: StatusTone | 'all';
  onPick: (tone: StatusTone) => void;
}

export const StatusDonut: React.FC<DonutProps> = ({ reports, activeTone, onPick }) => {
  const { ref, show, hide, node } = useChartTip();
  const counts = useMemo(() => {
    const c: Record<StatusTone, number> = { baru: 0, ditindak: 0, tuntas: 0, ditolak: 0 };
    reports.forEach((r) => (c[getStatusMeta(r.status).tone] += 1));
    return c;
  }, [reports]);
  const total = reports.length;

  const R = 54;
  const C = 2 * Math.PI * R;
  const GAP = 2.5;
  let offset = 0;
  const arcs = TONE_ORDER.filter((t) => counts[t] > 0).map((tone) => {
    const len = (counts[tone] / total) * C;
    const arc = { tone, dash: Math.max(0, len - GAP), offset };
    offset += len;
    return arc;
  });

  return (
    <ChartPanel title="Status penanganan" note="Klik bagian diagram untuk menyaring daftar laporan." className="lg:col-span-4">
      <div ref={ref} className="relative flex items-center gap-6">
        <svg viewBox="0 0 140 140" className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 -rotate-90" role="img" aria-label={`Proporsi status dari ${total} laporan`}>
          <circle cx="70" cy="70" r={R} fill="none" className="stroke-surface-2" strokeWidth="20" />
          {arcs.map((a) => (
            <circle
              key={a.tone}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              strokeWidth={activeTone === a.tone ? 24 : 20}
              strokeDasharray={`${a.dash} ${C}`}
              strokeDashoffset={-a.offset}
              className={`${TONE_STROKE[a.tone]} cursor-pointer transition-[stroke-width] ${
                activeTone !== 'all' && activeTone !== a.tone ? 'opacity-35' : ''
              }`}
              onMouseMove={show(`${TONE_LABEL[a.tone]}: ${counts[a.tone]} laporan`)}
              onMouseLeave={hide}
              onClick={() => onPick(a.tone)}
            />
          ))}
          <g className="rotate-90 origin-center">
            <text x="70" y="70" textAnchor="middle" dominantBaseline="central" className="fill-ink font-display text-3xl font-bold">
              {total}
            </text>
          </g>
        </svg>
        <ul className="flex-1 min-w-0 space-y-1.5">
          {TONE_ORDER.filter((t) => t !== 'ditolak' || counts.ditolak > 0).map((tone) => (
            <li key={tone}>
              <button
                type="button"
                onClick={() => onPick(tone)}
                aria-pressed={activeTone === tone}
                className={`w-full flex items-center gap-2.5 h-8 px-2 -mx-2 rounded-md text-sm transition-colors cursor-pointer ${
                  activeTone === tone ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                }`}
              >
                <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full shrink-0 ${TONE_BG[tone]}`} />
                <span className="text-ink-2 truncate">{TONE_LABEL[tone]}</span>
                <span className="ml-auto font-semibold text-ink tabular-nums">{counts[tone]}</span>
              </button>
            </li>
          ))}
        </ul>
        {node}
      </div>
      <table className="sr-only">
        <caption>Jumlah laporan per status</caption>
        <tbody>
          {TONE_ORDER.map((t) => (
            <tr key={t}>
              <th scope="row">{TONE_LABEL[t]}</th>
              <td>{counts[t]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartPanel>
  );
};

/* ------------------------------------------------------- category bars */

interface CategoryBarsProps {
  reports: Report[];
  activeCategory: string;
  onPick: (category: string) => void;
}

export const CategoryBars: React.FC<CategoryBarsProps> = ({ reports, activeCategory, onPick }) => {
  const rows = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => r.category && map.set(r.category, (map.get(r.category) || 0) + 1));
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'id'));
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0);
    return { top, rest, max: top[0]?.[1] || 1 };
  }, [reports]);

  return (
    <ChartPanel title="Laporan per kategori" note="Klik kategori untuk menyaring daftar." className="lg:col-span-8">
      <ul className="space-y-1">
        {rows.top.map(([name, value]) => {
          const selected = activeCategory === name;
          const dimmed = activeCategory !== 'Semua' && !selected;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onPick(name)}
                aria-pressed={selected}
                className="group w-full grid grid-cols-[minmax(0,9rem)_1fr_2rem] sm:grid-cols-[minmax(0,12rem)_1fr_2.5rem] items-center gap-3 h-9 rounded-md hover:bg-surface-2/60 px-2 -mx-2 cursor-pointer text-left"
              >
                <span className={`truncate text-sm ${selected ? 'font-semibold text-ink' : 'text-ink-2'}`}>{name}</span>
                <span className="h-2 rounded-r-sm bg-surface-2 overflow-hidden" aria-hidden="true">
                  <span
                    className={`block h-full rounded-r-sm bg-brand transition-opacity ${dimmed ? 'opacity-30' : ''}`}
                    style={{ width: `${Math.max(4, (value / rows.max) * 100)}%` }}
                  />
                </span>
                <span className="text-sm font-semibold text-ink tabular-nums text-right">{value}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.rest > 0 && <p className="mt-2 text-xs text-ink-3">{rows.rest} laporan lain tersebar di kategori kecil.</p>}
    </ChartPanel>
  );
};

/* --------------------------------------------------------- weekly trend */

const WEEKS = 8;
const DAY_MS = 86400000;
const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/** Monday 00:00 (local time) of the week that contains `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const shortDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const longDate = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

/** "3 - 9 Nov" or "27 Okt - 2 Nov": the Monday-to-Sunday span of a week. */
const rangeLabel = (start: Date) => {
  const end = addDays(start, 6);
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} - ${shortDate(end)}`
    : `${shortDate(start)} - ${shortDate(end)}`;
};

interface WeekBucket {
  start: Date;
  reports: Report[];
  /** Report count per weekday, Monday first. */
  days: number[];
}

export const WeeklyTrend: React.FC<{ reports: Report[]; wide?: boolean }> = ({ reports, wide = false }) => {
  const { ref, show, hide, node } = useChartTip();
  const [weekIdx, setWeekIdx] = useState<number | null>(null);
  const [dayIdx, setDayIdx] = useState<number | null>(null);

  const weeks = useMemo<WeekBucket[]>(() => {
    const thisWeek = startOfWeek(new Date());
    const buckets: WeekBucket[] = Array.from({ length: WEEKS }, (_, i) => ({
      start: addDays(thisWeek, -(WEEKS - 1 - i) * 7),
      reports: [],
      days: [0, 0, 0, 0, 0, 0, 0],
    }));
    reports.forEach((r) => {
      const created = new Date(r.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const idx = Math.round((startOfWeek(created).getTime() - buckets[0].start.getTime()) / (7 * DAY_MS));
      if (idx < 0 || idx >= WEEKS) return;
      buckets[idx].reports.push(r);
      buckets[idx].days[(created.getDay() + 6) % 7] += 1;
    });
    buckets.forEach((b) => b.reports.sort((a, c) => (c.createdAt || '').localeCompare(a.createdAt || '')));
    return buckets;
  }, [reports]);

  const max = Math.max(1, ...weeks.map((w) => w.reports.length));
  const inRange = weeks.reduce((sum, w) => sum + w.reports.length, 0);
  const selected = weekIdx === null ? null : weeks[weekIdx];

  const shown = useMemo(() => {
    if (!selected) return [];
    if (dayIdx === null) return selected.reports;
    const day = addDays(selected.start, dayIdx);
    return selected.reports.filter((r) => {
      const c = new Date(r.createdAt);
      return c.getFullYear() === day.getFullYear() && c.getMonth() === day.getMonth() && c.getDate() === day.getDate();
    });
  }, [selected, dayIdx]);

  const pickWeek = (i: number) => {
    setDayIdx(null);
    setWeekIdx((current) => (current === i ? null : i));
  };

  return (
    <ChartPanel
      title="Laporan masuk per minggu"
      note={`${inRange} laporan dalam ${WEEKS} minggu terakhir. Minggu dihitung Senin sampai Minggu; klik batang untuk melihat laporannya.`}
      className={wide ? 'lg:col-span-12' : 'lg:col-span-7'}
    >
      <div ref={ref} className="relative">
        <div className="relative h-44 pl-8">
          {/* Grid: the top of the plot is the busiest week */}
          <div className="absolute inset-y-0 left-0 right-0 pt-6" aria-hidden="true">
            <div className="relative h-full">
              {[1, 0.5, 0].map((f) => (
                <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 100}%` }}>
                  <span className="w-6 text-right text-[10px] text-ink-3 tabular-nums">
                    {f === 0 ? 0 : Math.round(max * f * 10) / 10}
                  </span>
                  <span className={`flex-1 h-px ${f === 0 ? 'bg-line' : 'bg-line-soft'}`} />
                </div>
              ))}
            </div>
          </div>

          <ul className="absolute inset-y-0 left-8 right-0 pt-6 flex gap-2 sm:gap-3" aria-label="Laporan per minggu">
            {weeks.map((w, i) => {
              const count = w.reports.length;
              const isSelected = weekIdx === i;
              const dimmed = weekIdx !== null && !isSelected;
              const tip = `${rangeLabel(w.start)}: ${count} laporan`;
              return (
                <li key={w.start.toISOString()} className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => pickWeek(i)}
                    aria-pressed={isSelected}
                    aria-label={`Minggu ${rangeLabel(w.start)}, ${count} laporan`}
                    onMouseMove={show(tip)}
                    onFocus={show(tip)}
                    onMouseLeave={hide}
                    onBlur={hide}
                    className="group absolute inset-0 cursor-pointer rounded-t-md focus-visible:outline-offset-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 inset-x-0 mx-auto w-full max-w-12 rounded-t-md transition-[opacity,background-color] ${
                        count === 0 ? 'bg-line-soft' : isSelected ? 'bg-brand' : 'bg-brand group-hover:bg-brand-hover'
                      } ${dimmed ? 'opacity-35' : ''}`}
                      style={{ height: count === 0 ? '3px' : `${Math.max(5, (count / max) * 100)}%` }}
                    >
                      {count > 0 && (
                        <span className="absolute -top-5 inset-x-0 text-center text-xs font-semibold text-ink tabular-nums">{count}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Week labels: the Monday each bar starts on */}
        <div className="mt-2 pl-8 flex gap-2 sm:gap-3" aria-hidden="true">
          {weeks.map((w, i) => (
            <div key={w.start.toISOString()} className="flex-1 min-w-0 text-center">
              <div className={`text-[11px] tabular-nums truncate ${weekIdx === i ? 'font-semibold text-ink' : 'text-ink-3'}`}>
                {shortDate(w.start)}
              </div>
              {i === WEEKS - 1 && <div className="text-[10px] text-ink-3">minggu ini</div>}
            </div>
          ))}
        </div>
        {node}
      </div>

      {selected && (
        <div className="mt-5 pt-5 border-t border-line-soft" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold text-ink">
              {dayIdx === null ? `Minggu ${rangeLabel(selected.start)}` : longDate(addDays(selected.start, dayIdx))}
              <span className="ml-2 font-normal text-ink-3 tabular-nums">{shown.length} laporan</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setWeekIdx(null);
                setDayIdx(null);
              }}
              className="text-xs text-ink-2 hover:text-ink underline underline-offset-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Saring menurut hari">
            {selected.days.map((n, d) => (
              <button
                key={DAY_SHORT[d]}
                type="button"
                disabled={n === 0}
                aria-pressed={dayIdx === d}
                onClick={() => setDayIdx((current) => (current === d ? null : d))}
                className={`rounded-lg px-1 py-1.5 text-center transition-colors cursor-pointer disabled:cursor-default disabled:opacity-45 ${
                  dayIdx === d ? 'bg-brand text-on-brand' : 'bg-surface-2 text-ink-2 enabled:hover:text-ink'
                }`}
              >
                <span className="block text-[11px] leading-tight">{DAY_SHORT[d]}</span>
                <span className="block text-[11px] leading-tight tabular-nums opacity-75">{addDays(selected.start, d).getDate()}</span>
                <span className="block font-display text-base font-bold leading-tight tabular-nums">{n}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-4 text-sm text-ink-2">Tidak ada laporan pada rentang ini.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line-soft">
              {shown.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/laporan/${encodeURIComponent(r.id)}`}
                    className="flex items-start justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-surface-2/60 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="titik-id text-[11px] text-ink-3">{r.publicReference}</span>
                        <StatusLabel status={r.status} />
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink leading-snug">{r.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-3 tabular-nums pt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <table className="sr-only">
        <caption>Laporan masuk per minggu</caption>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start.toISOString()}>
              <th scope="row">Minggu {rangeLabel(w.start)}</th>
              <td>{w.reports.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartPanel>
  );
};

/* --------------------------------------------------------- budget bars */

export const BudgetBars: React.FC<{ sectors: BudgetSectorContext[] }> = ({ sectors }) => {
  const rows = useMemo(() => [...sectors].sort((a, b) => b.paguAllocation - a.paguAllocation).slice(0, 6), [sectors]);
  if (rows.length === 0) return null;
  const year = rows[0].fiscalYear;
  const source = rows[0].dataSource;

  return (
    <ChartPanel title={`Serapan APBD ${year}`} note="Realisasi belanja terhadap pagu anggaran per sektor." className="lg:col-span-5">
      <ul className="space-y-4">
        {rows.map((s) => {
          const pct = Math.max(0, Math.min(100, s.executionRatePercent));
          return (
            <li key={s.sectorId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink">{s.sectorName}</span>
                <span className="font-semibold text-ink tabular-nums shrink-0">{pct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-r-sm bg-surface-2 overflow-hidden" role="img" aria-label={`${s.sectorName}: serapan ${pct}%`}>
                <div className="h-full rounded-r-sm bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-3 tabular-nums">
                {formatRupiahCompact(s.realizedSpending)} dari {formatRupiahCompact(s.paguAllocation)}
              </p>
            </li>
          );
        })}
      </ul>
      {source && <p className="mt-4 text-[11px] text-ink-3">Sumber: {source}</p>}
    </ChartPanel>
  );
};
