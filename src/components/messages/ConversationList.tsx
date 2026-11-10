import React from 'react';
import { Search, SquarePen } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { formatUnreadBadge } from '../../services/messagesService';
import type { Conversation } from '../../types/domain';
import { formatListTime, SPECIAL_TYPE_LABEL } from './messageFormat';

export type ListFilter = 'all' | 'unread' | 'reports';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId?: string;
  isLoading: boolean;
  hasAnyConversation: boolean;
  query: string;
  onQuery: (value: string) => void;
  filter: ListFilter;
  onFilter: (value: ListFilter) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

const FILTERS: Array<[ListFilter, string]> = [
  ['all', 'Semua'],
  ['unread', 'Belum Dibaca'],
  ['reports', 'Laporan'],
];

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  currentUserId,
  isLoading,
  hasAnyConversation,
  query,
  onQuery,
  filter,
  onFilter,
  onSelect,
  onNewChat,
}) => (
  <section aria-label="Daftar percakapan" className="flex flex-col h-full min-h-0">
    <div className="px-4 pt-5 pb-3 space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Pesan</h1>
        <button
          type="button"
          onClick={onNewChat}
          aria-label="Mulai Percakapan Baru"
          title="Mulai percakapan baru"
          className="w-10 h-10 rounded-lg bg-brand text-on-brand flex items-center justify-center hover:bg-brand-hover transition-colors cursor-pointer"
        >
          <SquarePen className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari nama atau kode laporan"
          aria-label="Cari percakapan"
          className="titik-pill-input pl-10 pr-3"
        />
      </div>

      <div role="group" aria-label="Filter percakapan" className="flex gap-1.5">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => onFilter(key)}
            className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === key ? 'bg-brand text-on-brand font-semibold' : 'bg-surface-2 text-ink-2 hover:text-ink hover:bg-brand-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto pb-28 md:pb-3 px-2">
      {isLoading && !hasAnyConversation ? (
        <p role="status" className="p-6 text-sm text-ink-2 text-center">
          Memuat percakapan
        </p>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="font-display text-base font-semibold text-ink">
            {hasAnyConversation ? 'Tidak ada percakapan yang cocok' : 'Belum ada percakapan'}
          </p>
          <p className="text-sm text-ink-2">
            {hasAnyConversation
              ? 'Ubah kata kunci atau filter.'
              : 'Mulai dengan mencari warga atau petugas, atau buka profil seseorang lalu pilih Kirim Pesan.'}
          </p>
          {!hasAnyConversation && (
            <button type="button" onClick={onNewChat} className="titik-pill-btn titik-pill-btn-primary">
              Mulai percakapan
            </button>
          )}
        </div>
      ) : (
        <ul className="titik-stagger space-y-0.5">
          {conversations.map((c) => {
            const other = c.other_participant;
            const last = c.last_message;
            const unread = c.unread_count ?? 0;
            const isActive = c.id === activeId;
            const special = last ? SPECIAL_TYPE_LABEL[last.message_type] : undefined;
            const preview = last
              ? `${last.sender_id === currentUserId ? 'Anda: ' : ''}${special ? `${special}. ` : ''}${last.content}`
              : 'Belum ada pesan';
            const name = other?.displayName || 'Pengguna';
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition-colors cursor-pointer ${
                    isActive ? 'bg-brand-soft shadow-[inset_0_1px_0_var(--glass-hi)]' : 'hover:bg-surface-2'
                  }`}
                >
                  <UserAvatar src={other?.avatarUrl} alt={name} name={name} role={other?.role} className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{name}</span>
                      <span className="shrink-0 text-[11px] text-ink-3 tabular-nums">{formatListTime(last?.created_at || c.updated_at)}</span>
                    </span>
                    {c.report_reference && <span className="titik-id block text-[11px] text-ink-3 mt-0.5">{c.report_reference}</span>}
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`truncate text-[13px] ${unread > 0 ? 'text-ink' : 'text-ink-2'}`}>{preview}</span>
                      {unread > 0 && (
                        <span
                          aria-label={`${unread} pesan belum dibaca`}
                          className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand text-on-brand text-[11px] font-bold flex items-center justify-center tabular-nums"
                        >
                          {formatUnreadBadge(unread)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </section>
);
