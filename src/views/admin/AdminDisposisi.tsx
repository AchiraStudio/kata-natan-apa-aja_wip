import React, { useMemo, useState } from 'react';
import { Select } from '../../components/common/Select';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAdminWorkspace, useMessageReporter, ageLabel, daysSince, EmptyNote, Notice } from '../../components/admin';
import { StatusLabel } from '../../components/common/StatusLabel';
import { dataService } from '../../services/dataService';
import { formatRupiahShort } from '../../components/admin/ui';
import type { Report, ReportStatus, UserProfile } from '../../types/domain';

interface Props {
  profile: UserProfile;
}

const ROUTED = new Set<ReportStatus>(['accepted_for_routing', 'forwarded_to_institution', 'institution_responded']);
const SLA_DAYS = 14;

/** One click moves a routed report to the next stage, with the note a reviewer would otherwise type by hand. */
const ADVANCE: Partial<Record<ReportStatus, { to: ReportStatus; label: string; note: (r: Report) => string }>> = {
  accepted_for_routing: {
    to: 'forwarded_to_institution',
    label: 'Teruskan ke dinas',
    note: (r) => `Laporan diteruskan ke ${r.responsibleAgency || 'dinas berwenang'} untuk dijadwalkan survei lapangan.`,
  },
  forwarded_to_institution: {
    to: 'institution_responded',
    label: 'Catat respons dinas',
    note: (r) => `${r.responsibleAgency || 'Dinas'} telah menanggapi laporan ini.`,
  },
  institution_responded: {
    to: 'resolved',
    label: 'Tandai selesai',
    note: () => 'Pekerjaan perbaikan di lokasi sudah selesai dan diperiksa tim lapangan.',
  },
};

/** Routed reports grouped by the agency that owns them, with how long each has gone without news. */
export const AdminDisposisi: React.FC<Props> = () => {
  const { reports, isLoadingReports, fetchReports } = useAdminWorkspace();
  const messenger = useMessageReporter();
  const [agencyFilter, setAgencyFilter] = useState('Semua');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const routed = useMemo(() => reports.filter((r) => ROUTED.has(r.status)), [reports]);
  const agencies = useMemo(() => ['Semua', ...new Set(routed.map((r) => r.responsibleAgency || 'Belum ditentukan'))], [routed]);

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    routed
      .filter((r) => agencyFilter === 'Semua' || (r.responsibleAgency || 'Belum ditentukan') === agencyFilter)
      .forEach((r) => {
        const key = r.responsibleAgency || 'Belum ditentukan';
        map.set(key, [...(map.get(key) ?? []), r]);
      });
    map.forEach((list, key) =>
      map.set(
        key,
        [...list].sort((a, b) => daysSince(b.updatedAt || b.createdAt) - daysSince(a.updatedAt || a.createdAt))
      )
    );
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [routed, agencyFilter]);

  const stale = routed.filter((r) => daysSince(r.updatedAt || r.createdAt) > SLA_DAYS).length;

  const advance = async (report: Report) => {
    const step = ADVANCE[report.status];
    if (!step || busyId) return;
    setBusyId(report.id);
    setFeedback(null);
    try {
      const note = step.note(report);
      await dataService.transitionReportStatus(report.id, step.to, note, false, note);
      setFeedback({ kind: 'success', text: `${report.publicReference}: ${step.label.toLowerCase()} berhasil dicatat.` });
      await fetchReports();
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Status belum dapat diperbarui. Coba lagi.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Disposisi dinas</h2>
          <p className="mt-1 text-sm text-ink-2 tabular-nums">
            {routed.length} laporan di tangan {agencies.length - 1} dinas
            {stale > 0 ? `, ${stale} lewat ${SLA_DAYS} hari tanpa kabar` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="agency-filter" className="sr-only">
            Filter dinas
          </label>
          <Select id="agency-filter" value={agencyFilter} onChange={setAgencyFilter} className="max-w-[16rem]">
            {agencies.map((a) => (
              <option key={a} value={a}>
                {a === 'Semua' ? 'Semua dinas' : a}
              </option>
            ))}
          </Select>
          <button type="button" onClick={fetchReports} disabled={isLoadingReports} aria-label="Segarkan" className="w-10 h-10 rounded-lg bg-surface-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {feedback && <Notice kind={feedback.kind}>{feedback.text}</Notice>}
      {messenger.error && <Notice kind="error">{messenger.error}</Notice>}

      {isLoadingReports && routed.length === 0 ? (
        <p role="status" className="panel px-5 py-12 text-center text-sm text-ink-2">
          Memuat disposisi
        </p>
      ) : grouped.length === 0 ? (
        <div className="panel">
          <EmptyNote title="Belum ada laporan di dinas">Laporan yang disetujui di antrean validasi akan muncul di sini untuk diteruskan.</EmptyNote>
        </div>
      ) : (
        grouped.map(([agency, list]) => (
          <section key={agency} aria-label={agency} className="panel overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 px-5 py-3.5 border-b border-line-soft bg-surface-2/50">
              <h3 className="font-sans text-[15px] font-semibold text-ink">{agency}</h3>
              <span className="text-xs text-ink-3 tabular-nums">{list.length} laporan</span>
            </div>
            <ul className="divide-y divide-line-soft">
              {list.map((r) => {
                const idle = daysSince(r.updatedAt || r.createdAt);
                const step = ADVANCE[r.status];
                return (
                  <li key={r.id} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div className="min-w-0 flex-1 basis-64">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="titik-id text-[11px] text-ink-3">{r.publicReference}</span>
                        <StatusLabel status={r.status} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-ink leading-snug">{r.title}</p>
                      <p className="mt-0.5 text-xs text-ink-3 flex flex-wrap gap-x-3">
                        <span className="truncate max-w-[22rem]">{r.location?.address}</span>
                        {r.estimatedCost ? <span className="tabular-nums">{formatRupiahShort(r.estimatedCost)}</span> : null}
                      </p>
                    </div>
                    <p className={`text-xs tabular-nums shrink-0 ${idle > SLA_DAYS ? 'font-semibold text-st-baru' : 'text-ink-3'}`}>
                      {idle > SLA_DAYS ? `Tanpa kabar ${idle} hari` : `Diperbarui ${ageLabel(r.updatedAt || r.createdAt)}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {step && (
                        <button
                          type="button"
                          onClick={() => advance(r)}
                          disabled={busyId !== null}
                          className="h-9 px-3.5 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {busyId === r.id ? 'Memproses' : step.label}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => messenger.open(r)}
                        disabled={messenger.busyId === r.id || !r.reporterUserId}
                        title={r.reporterUserId ? 'Kirim pesan ke pelapor' : 'Laporan anonim, tidak bisa dikirimi pesan'}
                        className="h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Pesan
                      </button>
                      <Link to={`/admin/validasi?r=${encodeURIComponent(r.id)}`} className="h-9 px-3.5 inline-flex items-center rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors">
                        Buka
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};
