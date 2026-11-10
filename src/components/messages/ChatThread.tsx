import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Send,
  FileText,
  Paperclip,
  X,
  Users,
  Palette,
  Download,
  File as FileIcon,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import type { Conversation, Message, MessageAttachment } from '../../types/domain';
import { formatClock, groupByDay, SPECIAL_TYPE_LABEL } from './messageFormat';
import { GroupInfoModal } from './GroupInfoModal';
import { useCustomBackground } from '../../hooks/useCustomBackground';

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
  attachments?: MessageAttachment[];
  onAddAttachment?: (file: File) => Promise<void>;
  onRemoveAttachment?: (index: number) => void;
  isUploadingAttachment?: boolean;
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
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  isUploadingAttachment = false,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const { config: chatBg, inlineStyle: chatBgStyle } = useCustomBackground('chat');

  const groups = useMemo(() => groupByDay(messages), [messages]);
  const isGroup = Boolean(conversation?.is_group);
  const other = conversation?.other_participant;
  const name = isGroup
    ? conversation?.title || 'Komunitas'
    : other?.displayName || 'Pengguna';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isOtherTyping, attachments.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !onAddAttachment) return;
    for (let i = 0; i < files.length; i++) {
      await onAddAttachment(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section
      aria-label={`Percakapan dengan ${name}`}
      className="relative flex flex-col h-full min-h-0 overflow-hidden"
    >
      {/* Custom Chat Background Layer */}
      {chatBg && chatBg.mode !== 'default' && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
          style={{
            ...chatBgStyle,
            filter: chatBg.blurAmount > 0 ? `blur(${chatBg.blurAmount}px)` : undefined,
            transform: chatBg.blurAmount > 0 ? 'scale(1.03)' : undefined,
          }}
        >
          {chatBg.overlayDim > 0 && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0, 0, 0, ${chatBg.overlayDim})` }}
            />
          )}
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 shrink-0 flex items-center gap-3 px-3 sm:px-5 h-16 border-b border-line-soft bg-surface/80 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke daftar pesan"
          className="md:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {isGroup ? (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
            title="Buka info komunitas"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {conversation?.avatar_url ? (
                <img src={conversation.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-brand" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{name}</span>
              <span className="block truncate text-xs text-brand font-medium">
                {conversation?.participant_ids?.length || conversation?.member_count || 1} anggota • Info Komunitas
              </span>
            </div>
          </button>
        ) : other?.username ? (
          <Link
            to={`/u/${encodeURIComponent(other.username)}`}
            className="flex items-center gap-3 min-w-0 flex-1"
            title={`Lihat profil ${name}`}
          >
            <UserAvatar
              src={other.avatarUrl}
              alt={name}
              name={name}
              role={other.role}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{name}</span>
              <span className="block truncate text-xs text-ink-3">
                {isOtherTyping ? 'sedang mengetik...' : `@${other.username}`}
              </span>
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserAvatar alt={name} name={name} className="w-10 h-10 rounded-full shrink-0" />
            <span className="truncate text-sm font-semibold text-ink">{name}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('titik-open-custom-bg', { detail: { target: 'chat' } })
              )
            }
            title="Kustomisasi Latar Ruang Obrolan"
            aria-label="Kustomisasi Latar Chat"
            className="w-9 h-9 rounded-lg bg-surface-2 text-ink-2 flex items-center justify-center hover:bg-line hover:text-ink transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>

          {conversation?.report_id && (
            <Link
              to={`/laporan/${encodeURIComponent(conversation.report_id)}`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-2 text-ink text-xs font-semibold hover:bg-line transition-colors"
              title="Buka laporan terkait"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="titik-id">{conversation.report_reference || 'Laporan'}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Messages Thread */}
      <div
        className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4"
        role="log"
        aria-live="polite"
        aria-label="Isi percakapan"
      >
        {isLoading && messages.length === 0 ? (
          <p role="status" className="text-center text-sm text-ink-2 py-10">
            Memuat pesan...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink-2 py-10">
            Belum ada pesan. Sapa {name} lebih dulu.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="space-y-2">
              <p className="sticky top-0 z-10 mx-auto my-3 w-fit px-3 py-1 rounded-lg bg-surface-2/90 backdrop-blur-md text-[11px] font-medium text-ink-2 border border-line/40 shadow-xs">
                {group.heading}
              </p>
              {group.messages.map((m) => {
                const mine = m.sender_id === currentUserId;
                const special = SPECIAL_TYPE_LABEL[m.message_type];
                if (special) {
                  return (
                    <div key={m.id} className="mx-auto max-w-[88%] sm:max-w-md panel p-3.5 my-2 shadow-xs border border-line">
                      <p className="text-[11px] font-semibold text-brand flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{special}</span>
                      </p>
                      <p className="mt-1 text-sm text-ink whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="mt-1.5 text-[11px] text-ink-3 tabular-nums">
                        {mine ? 'Anda' : m.sender?.displayName || name} • {formatClock(m.created_at)}
                      </p>
                    </div>
                  );
                }

                const senderName = m.sender?.displayName || 'Warga';

                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!mine && isGroup && (
                      <UserAvatar
                        src={m.sender?.avatarUrl}
                        alt={senderName}
                        name={senderName}
                        role={m.sender?.role}
                        className="w-7 h-7 rounded-full mb-1 shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[72%] px-3.5 py-2.5 rounded-2xl shadow-xs transition-shadow ${
                        mine
                          ? 'bg-brand text-on-brand rounded-br-sm'
                          : 'bg-surface-2 text-ink border border-line-soft rounded-bl-sm backdrop-blur-sm'
                      }`}
                    >
                      {/* Sender name for group chats */}
                      {!mine && isGroup && (
                        <p className="text-[11px] font-bold text-brand mb-1">
                          {senderName}
                        </p>
                      )}

                      {/* Text content */}
                      {m.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {m.content}
                        </p>
                      )}

                      {/* Attachments rendering */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className={`space-y-1.5 ${m.content ? 'mt-2' : ''}`}>
                          {m.attachments.map((att, idx) => {
                            const isImg = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url);
                            if (isImg) {
                              return (
                                <div
                                  key={idx}
                                  onClick={() => setZoomImage(att.url)}
                                  className="rounded-xl overflow-hidden cursor-pointer border border-black/10 hover:opacity-95 transition-opacity max-w-xs"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name || 'Lampiran Gambar'}
                                    className="w-full max-h-64 object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              );
                            }
                            return (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                download={att.name}
                                className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-colors ${
                                  mine
                                    ? 'bg-black/20 text-on-brand hover:bg-black/30'
                                    : 'bg-surface text-ink hover:bg-line border border-line'
                                }`}
                              >
                                <FileIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate flex-1 min-w-0">{att.name || 'Berkas Lampiran'}</span>
                                <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Meta timestamp & read check */}
                      <p
                        className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] tabular-nums ${
                          mine ? 'text-on-brand/80' : 'text-ink-3'
                        }`}
                      >
                        {formatClock(m.created_at)}
                        {mine &&
                          (m.read_at ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-lime" aria-hidden="true" />
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
          <div
            className="flex justify-start mt-2"
            data-testid="chat-typing-indicator"
            role="status"
            aria-label={`${name} sedang mengetik`}
          >
            <div className="px-3.5 py-3 rounded-2xl rounded-bl-md bg-surface-2 border border-line-soft flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="relative z-10 shrink-0 border-t border-line-soft px-3 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface/90 backdrop-blur-md">
        {canUseQuickActions && conversation?.report_id && (
          <div
            className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar"
            role="group"
            aria-label="Balasan cepat untuk petugas"
          >
            {QUICK_ACTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onQuickAction(key)}
                className="shrink-0 h-8 px-3 rounded-lg bg-surface-2 text-[12.5px] font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {sendError && (
          <p role="alert" className="mb-2 text-xs text-rose-500 font-medium">
            {sendError}
          </p>
        )}

        {/* Pending attachments tray */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-surface-2/60 border border-line overflow-x-auto no-scrollbar">
            {attachments.map((att, idx) => {
              const isImg = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url);
              return (
                <div
                  key={idx}
                  className="relative group shrink-0 flex items-center gap-1.5 pl-2 pr-6 py-1 rounded-lg bg-surface border border-line text-xs text-ink"
                >
                  {isImg ? (
                    <img src={att.url} alt="" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-brand" />
                  )}
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(idx)}
                      className="absolute right-1 text-ink-3 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          {/* File attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAttachment}
            className="w-11 h-11 rounded-xl bg-surface-2 text-ink-2 hover:text-ink hover:bg-line flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Lampirkan foto atau berkas"
            aria-label="Lampirkan berkas"
          >
            {isUploadingAttachment ? (
              <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={
              attachments.length > 0 ? 'Tambahkan keterangan (opsional)...' : `Tulis pesan untuk ${name}...`
            }
            aria-label="Tulis pesan"
            autoComplete="off"
            maxLength={2000}
            className="titik-pill-input flex-1 px-3.5 min-h-11 text-sm"
          />

          <button
            type="submit"
            disabled={(!draft.trim() && attachments.length === 0) || isSending || isUploadingAttachment}
            aria-label="Kirim pesan"
            className="w-11 h-11 rounded-xl bg-brand text-on-brand flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        </form>
      </div>

      {/* Group Info Modal */}
      {conversation && isGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={conversation}
          currentUserId={currentUserId}
          onLeaveGroup={() => {
            setIsGroupInfoOpen(false);
            onBack();
          }}
        />
      )}

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <img
            src={zoomImage}
            alt="Perbesar Foto"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
};
