import React from 'react';
import type { ReportEvent } from '../../types/domain';
import { SectionHead } from './ui';

interface ReportAuditTrailProps {
  events: ReportEvent[];
}

function formatTimestamp(value: string): string {
  if (!value) return '-';
  if (value.includes('WIB')) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)} WIB`;
}

/** Every change on the report, newest first. Internal entries are marked and never shown to citizens. */
export const ReportAuditTrail: React.FC<ReportAuditTrailProps> = ({ events }) => {
  const sorted = [...events].reverse();

  return (
    <section aria-label="Riwayat audit" className="space-y-3">
      <SectionHead as="h3" title="Riwayat audit" note={`${events.length} peristiwa tercatat`} />
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-2">Belum ada peristiwa pada laporan ini.</p>
      ) : (
        <ol className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {sorted.map((ev) => {
            const internal = Boolean(ev.isInternal || ev.is_internal);
            return (
              <li key={ev.id} className="grid grid-cols-[10px_1fr] gap-x-3">
                <span aria-hidden="true" className={`mt-1.5 w-2.5 h-2.5 rounded-full ${internal ? 'bg-st-baru' : 'bg-brand'}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-semibold text-ink">
                      {ev.eventType}
                      {internal && <span className="ml-2 text-xs font-medium text-st-baru">internal</span>}
                    </p>
                    <p className="text-xs text-ink-3 tabular-nums">{formatTimestamp(ev.timestamp)}</p>
                  </div>
                  <p className="text-xs text-ink-2">{ev.actorName || (ev.actorType === 'agency_officer' ? 'Petugas dinas' : 'Warga pelapor')}</p>
                  {ev.description && <p className="mt-0.5 text-sm text-ink-2 leading-relaxed break-words">{ev.description}</p>}
                  {ev.notes && ev.notes !== ev.description && <p className="mt-0.5 text-xs text-ink-3 leading-relaxed break-words">Catatan: {ev.notes}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
