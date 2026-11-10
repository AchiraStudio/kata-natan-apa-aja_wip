import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAdminWorkspace, useMessageReporter, SeverityMark, ageLabel, daysSince, EmptyNote, Notice } from '../../components/admin';
import { StatusLabel } from '../../components/common/StatusLabel';
import type { Report, ReportSeverity, UserProfile } from '../../types/domain';

interface Props {
  profile: UserProfile;
}

const SEVERITY_WEIGHT: Record<ReportSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const NEEDS_ACTION = new Set(['submitted', 'under_review']);
const WITH_AGENCY = new Set(['accepted_for_routing', 'forwarded_to_institution', 'institution_responded']);
const SLA_DAYS = 14;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'Petugas';

/** Landing page of the portal: what needs a decision today, and how the rest of the pipeline looks. */
export const AdminOverview: React.FC<Props> = ({ profile }) => {
  const { reports, isLoadingReports, refresh } = useAdminWorkspace();
  const messenger = useMessageReporter();

  const worklist = useMemo(() => {
    return reports
      .filter((r) => NEEDS_ACTION.has(r.status))
      .sort((a, b) => {
        const sev = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
        return sev !== 0 ? sev : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [reports]);

  const counts = useMemo(() => {
    const c = { review: 0, needsInfo: 0, agency: 0, resolved: 0, stale: 0 };
    reports.forEach((r) => {
      if (NEEDS_ACTION.has(r.status)) c.review += 1;
      else if (r.status === 'needs_info') c.needsInfo += 1;
      else if (WITH_AGENCY.has(r.status)) {
        c.agency += 1;
        if (daysSince(r.updatedAt || r.createdAt) > SLA_DAYS) c.stale += 1;
      } else if (r.status === 'resolved') c.resolved += 1;
    });
    return c;
  }, [reports]);

  const averageWait = worklist.length > 0 ? Math.round(worklist.reduce((sum, r) => sum + daysSince(r.createdAt), 0) / worklist.length) : 0;
  const rows = worklist.slice(0, 8);

  const rail: Array<{ label: string; value: number; to: string; note?: string }> = [
    { label: 'Menunggu verifikasi', value: counts.review, to: '/admin/validasi?status=under_review' },
    { label: 'Butuh info dari warga', value: counts.needsInfo, to: '/admin/validasi?status=needs_info', note: 'menunggu balasan pelapor' },
    { label: 'Di tangan dinas', value: counts.agency, to: '/admin/disposisi', note: counts.stale > 0 ? `${counts.stale} lewat ${SLA_DAYS} hari tanpa kabar` : undefined },
    { label: 'Tuntas', value: counts.resolved, to: '/admin/validasi?status=resolved' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Halo, {firstName(profile.displayName)}</h2>
          <p className="mt-1 text-sm text-ink-2">
            {isLoadingReports && reports.length === 0
              ? 'Memuat laporan'
              : worklist.length === 0
              ? 'Tidak ada laporan yang menunggu keputusan Anda.'
              : `${worklist.length} laporan menunggu keputusan, rata-rata sudah ${averageWait} hari.`}
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={isLoadingReports} aria-label="Segarkan" className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-60 transition-colors cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} aria-hidden="true" />
          Segarkan
        </button>
      </header>

      {messenger.error && <Notice kind="error">{messenger.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <section aria-label="Perlu keputusan" className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line-soft">
            <div>
              <h3 className="font-sans text-[15px] font-semibold text-ink">Perlu keputusan</h3>
              <p className="text-xs text-ink-3">Diurutkan dari yang paling parah, lalu yang paling lama menunggu.</p>
            </div>
            <Link to="/admin/validasi" className="text-sm font-semibold text-brand underline-offset-2 hover:underline shrink-0">
              Buka antrean
            </Link>
          </div>

          {isLoadingReports && reports.length === 0 ? (
            <p role="status" className="px-5 py-12 text-center text-sm text-ink-2">
              Memuat laporan
            </p>
          ) : rows.length === 0 ? (
            <EmptyNote title="Antrean bersih">Laporan baru yang butuh verifikasi akan muncul di sini.</EmptyNote>
          ) : (
            <ul className="divide-y divide-line-soft">
              {rows.map((r) => (
                <WorkRow key={r.id} report={r} busy={messenger.busyId === r.id} onMessage={() => messenger.open(r)} />
              ))}
            </ul>
          )}
        </section>

        <aside aria-label="Beban kerja" className="space-y-6">
          <section className="panel p-5">
            <h3 className="font-sans text-[15px] font-semibold text-ink">Beban kerja</h3>
            <dl className="mt-3 divide-y divide-line-soft">
              {rail.map((item) => (
                <div key={item.label}>
                  <Link to={item.to} className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-surface-2/60 transition-colors">
                    <span className="min-w-0">
                      <dt className="text-sm text-ink">{item.label}</dt>
                      {item.note && <p className="text-xs text-ink-3">{item.note}</p>}
                    </span>
                    <dd className="font-display text-2xl font-bold text-ink tabular-nums">{item.value}</dd>
                  </Link>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-3 tabular-nums">Total {reports.length} laporan tercatat.</p>
          </section>

          <nav aria-label="Pintasan" className="panel p-2">
            {[
              ['/admin/disposisi', 'Disposisi dinas', 'Pantau laporan yang sedang di dinas'],
              ['/admin/anggaran', 'Rekap APBD', 'Pagu, realisasi, dan estimasi kerusakan'],
              ['/admin/pengguna', 'Pengguna', 'Verifikasi warga dan atur peran'],
            ].map(([to, title, note]) => (
              <Link key={to} to={to} className="block px-3 py-2.5 rounded-lg hover:bg-surface-2/60 transition-colors">
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-ink-3">{note}</span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
};

const WorkRow: React.FC<{ report: Report; busy: boolean; onMessage: () => void }> = ({ report, busy, onMessage }) => (
  <li className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3">
    <div className="min-w-0 flex-1 basis-64">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="titik-id text-[11px] text-ink-3">{report.publicReference}</span>
        <StatusLabel status={report.status} />
        <SeverityMark severity={report.severity} />
      </div>
      <p className="mt-1 text-sm font-semibold text-ink leading-snug">{report.title}</p>
      <p className="mt-0.5 text-xs text-ink-3">
        masuk {ageLabel(report.createdAt)}
        {report.reporterDisplayName ? ` / ${report.reporterDisplayName}` : ''}
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onMessage}
        disabled={busy || !report.reporterUserId}
        title={report.reporterUserId ? 'Kirim pesan ke pelapor' : 'Laporan anonim, tidak bisa dikirimi pesan'}
        className="h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {busy ? 'Membuka' : 'Pesan'}
      </button>
      <Link to={`/admin/validasi?r=${encodeURIComponent(report.id)}`} className="h-9 px-4 inline-flex items-center rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover transition-colors">
        Tinjau
      </Link>
    </div>
  </li>
);
