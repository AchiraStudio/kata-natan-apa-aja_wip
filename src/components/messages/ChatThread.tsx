import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, Send, FileText } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, Message } from '../../types/domain';
import { formatClock, groupByDay, SPECIAL_TYPE_LABEL } from './messageFormat';

export type QuickAction = 'request_info' | 'disposition_update' | 'resolution_notice';

interface ChatThreadProps {
  conversation?: Conversation;
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  isOtherTyping: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  sendError: string | null;
  onBack: () => void;
  canUseQuickActions: boolean;
  onQuickAction: (action: QuickAction) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const QUICK_ACTIONS: Array<[QuickAction, string]> = [
  ['request_info', 'Minta info'],
  ['disposition_update', 'Update status'],
  ['resolution_notice', 'Tandai tuntas'],
];

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  isLoading,
  isOtherTyping,
  draft,
  onDraft,
  onSend,
  isSending,
  sendError,
  onBack,
  canUseQuickActions,
  onQuickAction,
  inputRef,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByDay(messages), [messages]);
  const other = conversation?.other_participant;
  const name = other?.displayName || 'Pengguna';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isOtherTyping]);

  return (
    <section aria-label={`Percakapan dengan ${name}`} className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-3 sm:px-5 h-16 border-b border-line-soft">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke daftar pesan"
          className="md:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {other?.username ? (
          <Link to={`/u/${encodeURIComponent(other.username)}`} className="flex items-center gap-3 min-w-0 flex-1" title={`Lihat profil ${name}`}>
            <UserAvatar src={other.avatarUrl} alt={name} name={name} role={other.role} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{name}</span>
              <span className="block truncate text-xs text-ink-3">
                {isOtherTyping ? 'sedang mengetik' : `@${other.username}`}
              </span>
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserAvatar alt={name} name={name} className="w-10 h-10 rounded-full shrink-0" />
            <span className="truncate text-sm font-semibold text-ink">{name}</span>
          </div>
        )}
        {conversation?.report_id && (
          <Link
            to={`/laporan/${encodeURIComponent(conversation.report_id)}`}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-2 text-ink text-xs font-semibold hover:bg-line transition-colors"
            title="Buka laporan terkait"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="titik-id">{conversation.report_reference || 'Laporan'}</span>
          </Link>
        )}
      </header>

      {/* Thread */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4" role="log" aria-live="polite" aria-label="Isi percakapan">
        {isLoading && messages.length === 0 ? (
          <p role="status" className="text-center text-sm text-ink-2 py-10">
            Memuat pesan
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink-2 py-10">Belum ada pesan. Sapa {name} lebih dulu.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="space-y-1.5">
              <p className="sticky top-0 z-10 mx-auto my-3 w-fit px-3 py-1 rounded-lg bg-surface-2 text-[11px] font-medium text-ink-2">
                {group.heading}
              </p>
              {group.messages.map((m) => {
                const mine = m.sender_id === currentUserId;
                const special = SPECIAL_TYPE_LABEL[m.message_type];
                if (special) {
                  return (
                    <div key={m.id} className="mx-auto max-w-[88%] sm:max-w-md panel p-3 my-2">
                      <p className="text-[11px] font-semibold text-ink-3">{special}</p>
                      <p className="mt-1 text-sm text-ink whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="mt-1.5 text-[11px] text-ink-3 tabular-nums">
                        {mine ? 'Anda' : name} / {formatClock(m.created_at)}
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl ${
                        mine ? 'bg-brand text-on-brand rounded-br-md' : 'bg-surface-2 text-ink border border-line-soft rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] tabular-nums ${mine ? 'text-on-brand/75' : 'text-ink-3'}`}>
                        {formatClock(m.created_at)}
                        {mine &&
                          (m.read_at ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">Dibaca</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">Terkirim</span>
                            </>
                          ))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isOtherTyping && (
          <div className="flex justify-start mt-2" data-testid="chat-typing-indicator" role="status" aria-label={`${name} sedang mengetik`}>
            <div className="px-3.5 py-3 rounded-2xl rounded-bl-md bg-surface-2 border border-line-soft flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line-soft px-3 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {canUseQuickActions && conversation?.report_id && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar" role="group" aria-label="Balasan cepat untuk petugas">
            {QUICK_ACTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onQuickAction(key)}
                className="shrink-0 h-8 px-3 rounded-lg bg-surface-2 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {sendError && (
          <p role="alert" className="mb-2 text-xs text-st-ditolak">
            {sendError}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={`Tulis pesan untuk ${name}`}
            aria-label="Tulis pesan"
            autoComplete="off"
            maxLength={2000}
            className="titik-pill-input flex-1 px-3.5 min-h-11"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            aria-label="Kirim pesan"
            className="w-11 h-11 rounded-lg bg-brand text-on-brand flex items-center justify-center hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        </form>
      </div>
    </section>
  );
};
