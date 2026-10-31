import React from 'react';
import { ReportEvent } from '../../types/domain';
import { History, Lock, Globe } from 'lucide-react';

interface ReportAuditTrailProps {
  events: ReportEvent[];
}

function formatIndonesianTimestamp(timestampStr: string): string {
  if (!timestampStr) return '-';
  if (timestampStr.includes('WIB')) return timestampStr;
  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      const formatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
      return `${formatted} WIB`;
    }
  } catch {
    // fallback
  }
  return timestampStr;
}

export const ReportAuditTrail: React.FC<ReportAuditTrailProps> = ({ events }) => {
  // Sort events chronologically (newest first or chronological flow)
  const sortedEvents = [...events].reverse();

  return (
    <div className="pt-3 border-t border-[#E3E0D6] dark:border-[#26352E] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3] flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
          Riwayat Audit Terakhir ({events.length} Peristiwa)
        </span>
      </div>

      <div className="divide-y divide-[#E3E0D6]/60 dark:divide-[#26352E] max-h-48 overflow-y-auto no-scrollbar text-xs">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((ev: ReportEvent) => {
            const isInternal = Boolean(ev.isInternal || ev.is_internal);

            return (
              <div key={ev.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                <div className="flex items-center justify-between font-semibold text-[#101913] dark:text-[#F3F6F4]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#F7F5EF] dark:bg-[#131916] text-[#1B4332] dark:text-[#34D399] border border-[#E3E0D6] dark:border-[#26352E]">
                      {ev.eventType}
                    </span>
                    <span className="text-[11px] text-[#101913] dark:text-[#F3F6F4]">
                      {ev.actorName || (ev.actorType === 'agency_officer' ? 'Verifikator Dinas' : 'Warga Pelapor')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInternal ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        <Lock className="w-2.5 h-2.5" />
                        Internal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <Globe className="w-2.5 h-2.5" />
                        Publik
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#4F5A52] dark:text-[#9EACA3]">
                      {formatIndonesianTimestamp(ev.timestamp)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed break-words">
                  {ev.description}
                </p>

                {ev.notes && ev.notes !== ev.description && (
                  <div className="text-[10px] p-2 rounded-xl bg-[#F7F5EF] dark:bg-[#131916] text-[#101913] dark:text-[#F3F6F4] border border-[#E3E0D6]/60 dark:border-[#26352E]/60">
                    <span className="font-semibold text-[#4F5A52] dark:text-[#9EACA3]">Catatan verifikator: </span>
                    {ev.notes}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-4 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3]">
            Belum ada catatan riwayat audit.
          </div>
        )}
      </div>
    </div>
  );
};
