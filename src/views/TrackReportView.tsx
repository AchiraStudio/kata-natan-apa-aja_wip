import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Check, X, ArrowUpRight, MapPin, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/useTitik';
import { dataService } from '../services/dataService';
import type { Report } from '../types/domain';
import { PageShell, PageHeader } from '../components/layout/PageShell';
import { getStatusMeta, STATUS_DOT_CLASS } from '../utils/reportStatus';

const TRACKING_STEPS = [
  { key: 0, label: 'Laporan diterima', detail: 'Nomor laporan tercatat.' },
  { key: 1, label: 'Pemeriksaan awal', detail: 'Petugas meninjau bukti dan lokasi.' },
  { key: 2, label: 'Disetujui', detail: 'Siap diteruskan ke dinas.' },
  { key: 3, label: 'Dikirim ke dinas', detail: 'Dinas terkait menerima laporan.' },
  { key: 4, label: 'Dinas merespons', detail: 'Tindak lanjut disiapkan.' },
  { key: 5, label: 'Selesai', detail: 'Penanganan dinyatakan selesai.' },
] as const;

const STATUS_STEP_INDEX: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  needs_info: 1,
  accepted_for_routing: 2,
  forwarded_to_institution: 3,
  institution_responded: 4,
  resolved: 5,
};

const FULL_ID = /^TIK-\d{4}-\d{6}$/;

/**
 * Turns what people type into the canonical TIK-YYYY-NNNNNN, or null while it is still incomplete.
 * Strict mode (used while typing) only accepts a complete number, so half-typed input never triggers a lookup.
 * Lenient mode (Enter pressed) also pads short forms: "tik 2026 123" or "2026-123".
 */
export function normalizeReference(raw: string, lenient = false): string | null {
  const text = raw.trim().toUpperCase();
  if (!text) return null;

  const full = text.match(/^(?:TIK)?[\s-]*(\d{4})[\s-]+(\d{6})$/);
  if (full) return `TIK-${full[1]}-${full[2]}`;
  if (/^\d{6}$/.test(text)) return `TIK-${new Date().getFullYear()}-${text}`;
  if (!lenient) return null;

  const short = text.match(/^(?:TIK)?[\s-]*(\d{4})[\s-]+(\d{1,5})$/);
  if (short) return `TIK-${short[1]}-${short[2].padStart(6, '0')}`;
  if (/^\d{2,5}$/.test(text)) return `TIK-${new Date().getFullYear()}-${text.padStart(6, '0')}`;
  return null;
}

const formatWhen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Event types arrive as status codes (SUBMITTED, UNDER_REVIEW); show them as words. */
const eventLabel = (type: string) => {
  const label = getStatusMeta(type.toLowerCase()).label;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

type Phase = 'idle' | 'searching' | 'found' | 'missing' | 'error';

export const TrackReportView: React.FC = () => {
  const { profile, isAuthenticated } = useAuth();
  const { posts } = useTitik();
  const [searchParams, setSearchParams] = useSearchParams();

  const [input, setInput] = useState(searchParams.get('ref') ?? '');
  const [lenient, setLenient] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [report, setReport] = useState<Report | null>(null);
  const requestRef = useRef(0);
  // setSearchParams changes identity with every URL change, so keep it out of the effect deps
  const setParamsRef = useRef(setSearchParams);
  setParamsRef.current = setSearchParams;

  const reference = useMemo(() => normalizeReference(input, lenient), [input, lenient]);

  // Look the report up as soon as the number is complete. Late answers for an older input are ignored.
  useEffect(() => {
    if (!reference) {
      requestRef.current += 1;
      setPhase('idle');
      setReport(null);
      return;
    }
    const ticket = ++requestRef.current;
    setPhase('searching');
    const timer = window.setTimeout(async () => {
      try {
        const result = await dataService.getReportByReference(reference);
        if (ticket !== requestRef.current) return;
        setReport(result);
        setPhase(result ? 'found' : 'missing');
        setParamsRef.current(result ? { ref: reference } : {}, { replace: true });
      } catch {
        if (ticket !== requestRef.current) return;
        setReport(null);
        setPhase('error');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [reference]);

  // The signed-in user's own report numbers, so nobody has to remember them
  const myReports = useMemo(() => {
    if (!isAuthenticated) return [];
    const seen = new Map<string, Report>();
    (posts ?? []).forEach((p) => {
      const r = p.relatedReport;
      if (r && r.reporterUserId === profile.id && !seen.has(r.id)) seen.set(r.id, r);
    });
    return [...seen.values()].slice(0, 4);
  }, [posts, isAuthenticated, profile.id]);

  const clear = () => {
    setInput('');
    setLenient(false);
    setSearchParams({}, { replace: true });
  };

  const meta = report ? getStatusMeta(report.status) : null;
  const currentStep = report ? STATUS_STEP_INDEX[report.status] ?? 0 : 0;
  const visibleEvents = report ? report.events.filter((ev) => !(ev.isInternal || ev.is_internal)) : [];

  return (
    <PageShell width="default">
      <PageHeader
        title="Lacak laporan"
        description="Ketik nomor laporan, hasilnya muncul sendiri. Tidak perlu tombol atau token."
      />

      <section aria-label="Nomor laporan" className="panel p-5 sm:p-7">
        <label htmlFor="track-ref" className="block text-sm font-semibold text-ink">
          Nomor laporan
        </label>
        <form
          className="mt-2 relative"
          onSubmit={(e) => {
            e.preventDefault();
            setLenient(true);
          }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3 pointer-events-none" aria-hidden="true" />
          <input
            id="track-ref"
            type="text"
            inputMode="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setLenient(false);
            }}
            placeholder="TIK-2026-000123"
            aria-describedby="track-help"
            className="titik-pill-input titik-id pl-12 pr-24 min-h-14 text-lg tracking-wide"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-ink-2" aria-live="polite">
            {phase === 'searching' && (
              <span className="inline-flex items-center gap-1.5">
                <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden="true" /> Mencari
              </span>
            )}
            {phase === 'found' && (
              <span className="inline-flex items-center gap-1 text-st-tuntas font-semibold">
                <Check className="w-4 h-4" aria-hidden="true" /> Ditemukan
              </span>
            )}
            {input && (
              <button
                type="button"
                onClick={clear}
                aria-label="Hapus nomor"
                className="w-8 h-8 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <p id="track-help" className="mt-2 text-xs text-ink-3">
          Nomor ada di kartu laporan dan di halaman Laporan Saya, bentuknya TIK-2026-000123. Hasil muncul begitu nomornya lengkap; untuk bentuk singkat seperti 2026-123, tekan Enter.
        </p>

        {myReports.length > 0 && phase !== 'found' && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-ink-2">Laporan Anda</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {myReports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setInput(r.publicReference)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-surface-2 text-ink hover:bg-brand-soft transition-colors cursor-pointer"
                  >
                    <span className="titik-id text-xs">{r.publicReference}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div aria-live="polite">
        {phase === 'missing' && (
          <p className="mt-6 panel p-5 text-sm text-ink" role="status">
            <strong className="font-semibold">{reference}</strong> belum terdaftar. Periksa kembali angkanya, atau buka{' '}
            <Link to="/laporan-saya" className="text-brand underline underline-offset-2">
              Laporan Saya
            </Link>{' '}
            untuk melihat nomor yang benar.
          </p>
        )}
        {phase === 'error' && (
          <p className="mt-6 panel p-5 text-sm text-st-ditolak" role="alert">
            Laporan belum dapat diperiksa. Periksa koneksi, lalu ubah angka terakhir untuk mencoba lagi.
          </p>
        )}
      </div>

      {report && meta && phase !== 'searching' && (
        <article className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start" aria-label={`Status laporan ${report.publicReference}`}>
          <div className="space-y-6 min-w-0">
            <section className="panel p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="titik-id text-sm font-semibold text-ink-2">{report.publicReference}</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_CLASS[meta.tone]}`} />
                  {meta.label}
                </span>
              </div>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold text-ink leading-snug">{report.title}</h2>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{report.location?.address || 'Lokasi tidak dicantumkan'}</span>
              </p>
              {report.description && <p className="mt-4 text-sm text-ink leading-relaxed whitespace-pre-line">{report.description}</p>}
              {report.status === 'needs_info' && (
                <p className="mt-4 rounded-lg bg-st-baru/12 border border-st-baru/30 px-3.5 py-3 text-sm text-ink">
                  Petugas meminta informasi tambahan. Cek{' '}
                  <Link to="/pesan" className="underline underline-offset-2 font-semibold">
                    Pesan
                  </Link>{' '}
                  untuk membalas.
                </p>
              )}
            </section>

            <section className="panel p-5 sm:p-7">
              <h3 className="font-sans text-base font-semibold text-ink">Riwayat tindak lanjut</h3>
              {visibleEvents.length === 0 ? (
                <p className="mt-3 text-sm text-ink-2">Belum ada tindak lanjut yang dicatat.</p>
              ) : (
                <ol className="mt-4 space-y-5">
                  {[...visibleEvents].reverse().map((ev) => (
                    <li key={ev.id} className="grid grid-cols-[10px_1fr] gap-x-4">
                      <span aria-hidden="true" className="mt-1.5 w-2.5 h-2.5 rounded-full bg-brand" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <p className="text-sm font-semibold text-ink">{eventLabel(ev.eventType)}</p>
                          <p className="text-xs text-ink-3 tabular-nums">{formatWhen(ev.timestamp)}</p>
                        </div>
                        <p className="text-xs text-ink-2">oleh {ev.actorName}</p>
                        {ev.description && <p className="mt-1 text-sm text-ink-2 leading-relaxed">{ev.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="panel p-5">
              <h3 className="font-sans text-sm font-semibold text-ink">Progres penanganan</h3>
              {report.status === 'rejected' ? (
                <p className="mt-3 text-sm text-ink-2">Laporan belum dapat diproses. Alasan petugas ada pada riwayat tindak lanjut.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {TRACKING_STEPS.map((step) => {
                    const done = step.key < currentStep;
                    const current = step.key === currentStep;
                    return (
                      <li key={step.key} className="flex items-start gap-3" aria-current={current ? 'step' : undefined}>
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${
                            done ? 'bg-brand text-on-brand' : current ? 'bg-lime text-on-lime titik-live' : 'bg-surface-2 text-ink-3'
                          }`}
                        >
                          {done ? <Check className="w-3 h-3" strokeWidth={3} /> : step.key + 1}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm ${current ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-3'}`}>{step.label}</span>
                          {current && <span className="block text-xs text-ink-2">{step.detail}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="panel p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-2">Dukungan warga</span>
                <span className="font-display text-lg font-bold text-ink tabular-nums">{report.supportCount}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-ink-2 shrink-0">Dinas</span>
                <span className="text-right text-ink">{report.responsibleAgency}</span>
              </div>
              {report.budgetContext && (
                <div className="pt-3 border-t border-line-soft">
                  <p className="text-ink-2">Anggaran {report.budgetContext.subSectorName}</p>
                  <p className="mt-1 text-ink tabular-nums">
                    {Number.isFinite(report.budgetContext.executionRatePercent) ? `${report.budgetContext.executionRatePercent}% terserap dari pagu ` : 'Pagu '}
                    Rp {(report.budgetContext.paguAllocation / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M
                  </p>
                </div>
              )}
              <Link
                to={`/laporan/${encodeURIComponent(report.publicReference || report.id)}`}
                className="mt-1 inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                Buka halaman laporan <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </section>
          </aside>
        </article>
      )}
    </PageShell>
  );
};
