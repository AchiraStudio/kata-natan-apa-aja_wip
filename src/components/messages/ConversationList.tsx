import React from 'react';
import { Search, SquarePen, Users, Palette, User } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { formatUnreadBadge } from '../../services/messagesService';
import type { Conversation } from '../../types/domain';
import { formatListTime, SPECIAL_TYPE_LABEL } from './messageFormat';

export type ListFilter = 'all' | 'direct' | 'groups' | 'unread' | 'reports';

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
  onNewGroup?: () => void;
}

const FILTERS: Array<[ListFilter, string]> = [
  ['all', 'Semua'],
  ['direct', 'Pribadi'],
  ['groups', 'Komunitas'],
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
  onNewGroup,
}) => (
  <section aria-label="Daftar percakapan" className="flex flex-col h-full min-h-0">
    <div className="px-4 pt-5 pb-3 space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Pesan</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('titik-open-custom-bg', { detail: { target: 'pesan' } })
              )
            }
            title="Kustomisasi Latar Pesan"
            aria-label="Kustomisasi Latar Pesan"
            className="w-9 h-9 rounded-lg bg-surface-2 text-ink-2 flex items-center justify-center hover:bg-line hover:text-ink transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>
          {onNewGroup && (
            <button
              type="button"
              onClick={onNewGroup}
              title="Buat Komunitas / Grup Baru"
              aria-label="Buat Komunitas Baru"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-2 text-ink text-xs font-semibold hover:bg-line transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Grup</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Mulai Percakapan Baru"
            title="Mulai percakapan baru"
            className="w-9 h-9 rounded-lg bg-brand text-on-brand flex items-center justify-center hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari nama, grup, atau kode laporan"
          aria-label="Cari percakapan"
          className="titik-pill-input pl-10 pr-3"
        />
      </div>

      <div role="group" aria-label="Filter percakapan" className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => onFilter(key)}
            className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filter === key
                ? 'bg-brand text-on-brand shadow-xs'
                : 'bg-surface-2 text-ink-2 hover:text-ink hover:bg-brand-soft'
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
              : 'Mulai dengan mencari warga, buat komunitas baru, atau buka profil seseorang lalu pilih Kirim Pesan.'}
          </p>
          {!hasAnyConversation && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button type="button" onClick={onNewChat} className="titik-pill-btn titik-pill-btn-primary">
                Mulai percakapan
              </button>
              {onNewGroup && (
                <button type="button" onClick={onNewGroup} className="titik-pill-btn bg-surface-2 text-ink hover:bg-line">
                  Buat Komunitas
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <ul className="titik-stagger space-y-0.5">
          {conversations.map((c) => {
            const isGroup = Boolean(c.is_group);
            const other = c.other_participant;
            const last = c.last_message;
            const unread = c.unread_count ?? 0;
            const isActive = c.id === activeId;
            const special = last ? SPECIAL_TYPE_LABEL[last.message_type] : undefined;
            const preview = last
              ? `${last.sender_id === currentUserId ? 'Anda: ' : isGroup && last.sender ? `${last.sender.displayName.split(' ')[0]}: ` : ''}${special ? `${special}. ` : ''}${last.content || (last.attachments?.length ? '📎 Lampiran file' : '')}`
              : 'Belum ada pesan';
            const name = isGroup ? c.title || 'Komunitas' : other?.displayName || 'Pengguna';
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
                  {isGroup ? (
                    <div className="relative w-11 h-11 rounded-2xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-brand" />
                      )}
                    </div>
                  ) : (
                    <UserAvatar
                      src={other?.avatarUrl}
                      alt={name}
                      name={name}
                      role={other?.role}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm flex items-center gap-1.5">
                        <span className={`${unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'} truncate`}>
                          {name}
                        </span>
                        {isGroup && (
                          <span className="shrink-0 text-[10px] font-bold text-brand bg-brand/15 px-1.5 py-0.5 rounded-md">
                            Grup
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-3 tabular-nums">
                        {formatListTime(last?.created_at || c.updated_at)}
                      </span>
                    </span>
                    {c.report_reference && (
                      <span className="titik-id block text-[11px] text-ink-3 mt-0.5">
                        {c.report_reference}
                      </span>
                    )}
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`truncate text-[13px] ${unread > 0 ? 'text-ink font-medium' : 'text-ink-2'}`}>
                        {preview}
                      </span>
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
