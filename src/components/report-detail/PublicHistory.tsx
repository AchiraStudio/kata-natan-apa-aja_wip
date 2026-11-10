import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Report } from '../../types/domain';
import { eventLabel, formatWhen, getPublicEvents } from './format';

/** Every recorded step, newest first. Internal staff notes are filtered out before anything renders. */
export const PublicHistory: React.FC<{ report: Report }> = ({ report }) => {
  const events = [...getPublicEvents(report)].reverse();

  return (
    <section aria-labelledby="history-heading" className="panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="history-heading" className="font-sans text-base font-semibold text-ink">
          Riwayat tindak lanjut
        </h2>
        <span className="text-xs text-ink-3 tabular-nums">{events.length} catatan</span>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Belum ada tindak lanjut yang dicatat.</p>
      ) : (
        <ol className="mt-4 space-y-5">
          {events.map((event, i) => (
            <li key={event.id} className="grid grid-cols-[10px_1fr] gap-x-3.5">
              <span
                aria-hidden="true"
                className={`mt-1.5 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-brand' : 'bg-ink-3'}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{eventLabel(event.eventType)}</p>
                <p className="text-xs text-ink-3">
                  <span className="tabular-nums">{formatWhen(event.timestamp)}</span> · oleh {event.actorName}
                </p>
                {event.description && <p className="mt-1 text-sm text-ink-2 leading-relaxed">{event.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Link
        to={`/track?ref=${encodeURIComponent(report.publicReference)}`}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-2 hover:underline print:hidden"
      >
        Buka halaman pelacakan <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </section>
  );
};
