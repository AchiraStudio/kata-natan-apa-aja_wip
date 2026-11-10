import React from 'react';
import { Check } from 'lucide-react';
import type { ReportStatus } from '../../types/domain';
import { getStatusMeta } from '../../utils/reportStatus';

const STAGES = [
  { step: 1, label: 'Tercatat', detail: 'Laporan masuk dan mendapat nomor.' },
  { step: 2, label: 'Diverifikasi', detail: 'Petugas memeriksa bukti dan lokasi.' },
  { step: 3, label: 'Ditindak', detail: 'Diteruskan ke dinas terkait.' },
  { step: 4, label: 'Tuntas', detail: 'Penanganan dinyatakan selesai.' },
] as const;

/** Four stages from the status table. A rejected report has no stage, so it gets words instead. */
export const ProgressTracker: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const { stage } = getStatusMeta(status);

  return (
    <section aria-labelledby="progress-heading" className="panel p-5 sm:p-7">
      <h2 id="progress-heading" className="font-sans text-base font-semibold text-ink">
        Progres penanganan
      </h2>

      {stage === 0 ? (
        <p className="mt-3 text-sm text-ink-2 leading-relaxed">
          Laporan ini belum dapat diproses. Alasan dari petugas ada pada riwayat tindak lanjut.
        </p>
      ) : (
        <ol className="mt-5 grid grid-cols-4">
          {STAGES.map((item) => {
            const finished = stage === 4;
            const done = item.step < stage || finished;
            const current = item.step === stage && !finished;
            return (
              <li
                key={item.step}
                aria-current={current ? 'step' : undefined}
                className="relative flex flex-col items-center text-center px-1"
              >
                {item.step < STAGES.length && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-4 left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-0.5 rounded-full ${
                      item.step < stage ? 'bg-brand' : 'bg-line'
                    }`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold tabular-nums ${
                    done
                      ? 'bg-brand text-on-brand'
                      : current
                        ? 'bg-lime text-on-lime titik-live'
                        : 'bg-surface-2 text-ink-3'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" strokeWidth={3} /> : item.step}
                </span>
                <span
                  className={`mt-2 text-sm leading-tight ${
                    current ? 'font-semibold text-ink' : done ? 'font-medium text-ink' : 'text-ink-3'
                  }`}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 hidden sm:block text-xs text-ink-2 leading-snug">{item.detail}</span>
              </li>
            );
          })}
        </ol>
      )}

      {stage > 0 && stage < 4 && (
        <p className="mt-4 sm:hidden text-sm text-ink-2 leading-relaxed">{STAGES[stage - 1].detail}</p>
      )}
    </section>
  );
};
