import type { Message, MessageType } from '../../types/domain';

export const SPECIAL_TYPE_LABEL: Partial<Record<MessageType, string>> = {
  status_update: 'Pembaruan status',
  info_request: 'Permintaan informasi',
  resolution: 'Laporan tuntas',
};

/** 14:05 for today, "9 Nov" for earlier dates. */
export function formatListTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function formatClock(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayHeading(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

export interface MessageGroup {
  key: string;
  heading: string;
  messages: Message[];
}

/** Splits a thread into calendar-day groups, oldest first. */
export function groupByDay(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const key = new Date(m.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.messages.push(m);
    else groups.push({ key, heading: formatDayHeading(m.created_at), messages: [m] });
  }
  return groups;
}
