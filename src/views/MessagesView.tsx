import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/TitikContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markConversationRead,
  subscribeToMessages,
  subscribeToConversations,
  createTypingChannel,
  getProfileSummary,
  formatAdminReportMessage,
  isMessagingLocalOnly,
} from '../services/messagesService';
import { uploadChatAttachment } from '../services/chatMediaService';
import { ConversationList, type ListFilter } from '../components/messages/ConversationList';
import { ChatThread, type QuickAction } from '../components/messages/ChatThread';
import { NewChatDialog } from '../components/messages/NewChatDialog';
import { CreateGroupModal } from '../components/messages/CreateGroupModal';
import { useCustomBackground } from '../hooks/useCustomBackground';
import type { Conversation, Message, MessageAttachment, MessageType, Report, UserProfile } from '../types/domain';

const TYPING_VISIBLE_MS = 3000;
const TYPING_SEND_INTERVAL_MS = 1500;

const QUICK_ACTION_COPY: Record<QuickAction, { note: string; type: MessageType }> = {
  request_info: { note: 'Mohon kirimkan patokan nomor rumah terdekat atau foto kondisi terkini.', type: 'info_request' },
  disposition_update: { note: 'Tim lapangan telah diberangkatkan menuju lokasi laporan.', type: 'status_update' },
  resolution_notice: { note: 'Pekerjaan perbaikan di lokasi telah selesai.', type: 'resolution' },
};

/** Direct messages: inbox on the left, thread on the right, one pane at a time on phones. */
export const MessagesView: React.FC = () => {
  const { profile } = useAuth();
  const { posts } = useTitik();
  const [searchParams, setSearchParams] = useSearchParams();
  const me = profile?.id;
  const activeId = searchParams.get('conversation_id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ListFilter>('all');
  const [draft, setDraft] = useState('');
  const [pendingType, setPendingType] = useState<MessageType>('text');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);

  const { config: pesanBg, inlineStyle: pesanBgStyle } = useCustomBackground('pesan');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const typingRef = useRef<{ sendTyping: () => void; unsubscribe: () => void } | null>(null);
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const handledDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const reports = useMemo<Report[]>(
    () => (posts ?? []).map((p) => p.relatedReport).filter((r): r is Report => Boolean(r)),
    [posts]
  );

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);

  const openConversation = useCallback(
    (id: string) => setSearchParams({ conversation_id: id }),
    [setSearchParams]
  );
  const closeConversation = useCallback(() => setSearchParams({}), [setSearchParams]);

  // Inbox: load once, then refresh whenever the server reports a change
  const loadConversations = useCallback(async () => {
    if (!me) {
      setIsLoadingList(false);
      return;
    }
    try {
      const data = await getConversations(me);
      setConversations(data);
      setLocalOnly(isMessagingLocalOnly());
    } finally {
      setIsLoadingList(false);
    }
  }, [me]);

  useEffect(() => {
    loadConversations();
    if (!me) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sub = subscribeToConversations(me, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(loadConversations, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [me, loadConversations]);

  // Deep links: ?report_id=... and ?new_chat=<userId> open (or create) a thread, then normalise the URL
  useEffect(() => {
    if (!me) return;
    const reportId = searchParams.get('report_id');
    const newChatUserId = searchParams.get('new_chat');
    const key = reportId ? `r:${reportId}` : newChatUserId ? `u:${newChatUserId}` : null;
    if (!key || handledDeepLinkRef.current === key) return;
    handledDeepLinkRef.current = key;

    (async () => {
      try {
        if (reportId) {
          const report = reports.find((r) => r.id === reportId);
          const otherId = report?.reporterUserId;
          if (!otherId) {
            setNotice('Pelapor laporan ini tidak tercatat, jadi percakapan tidak dapat dibuka.');
            setSearchParams({}, { replace: true });
            return;
          }
          const conv = await createConversation(reportId, me, otherId, report?.publicReference);
          const other = await getProfileSummary(otherId);
          setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [{ ...conv, other_participant: other, unread_count: 0 }, ...prev]));
          setSearchParams({ conversation_id: conv.id }, { replace: true });
        } else if (newChatUserId) {
          if (newChatUserId === me) {
            setSearchParams({}, { replace: true });
            return;
          }
          const conv = await createConversation(null, me, newChatUserId);
          const other = await getProfileSummary(newChatUserId);
          setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [{ ...conv, other_participant: other, unread_count: 0 }, ...prev]));
          setSearchParams({ conversation_id: conv.id }, { replace: true });
        }
        loadConversations();
      } catch {
        setNotice('Percakapan belum dapat dibuka. Coba lagi beberapa saat.');
        setSearchParams({}, { replace: true });
      }
    })();
  }, [searchParams, me, reports, setSearchParams, loadConversations]);

  const markRead = useCallback(
    (conversationId: string) => {
      if (!me) return;
      markConversationRead(conversationId, me)
        .catch(() => {})
        .finally(() => window.dispatchEvent(new Event('titik-unread-refresh')));
      setConversations((prev) =>
        prev.some((c) => c.id === conversationId && (c.unread_count ?? 0) > 0)
          ? prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
          : prev
      );
    },
    [me]
  );

  // Open thread: fetch messages, mark read, then listen for new messages, read receipts and typing
  useEffect(() => {
    setMessages([]);
    setSendError(null);
    setIsOtherTyping(false);
    if (!activeId || !me) return;

    let active = true;
    const participants = conversationsRef.current.find((c) => c.id === activeId)?.participant_ids;

    setIsLoadingThread(true);
    getMessages(activeId, participants)
      .then((msgs) => {
        if (!active) return;
        setMessages(msgs);
        markRead(activeId);
      })
      .catch(() => active && setSendError('Pesan belum dapat dimuat.'))
      .finally(() => active && setIsLoadingThread(false));

    const messageSub = subscribeToMessages(
      activeId,
      (incoming) => {
        if (!active) return;
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, last_message: incoming, updated_at: incoming.created_at } : c))
        );
        if (incoming.sender_id !== me) {
          setIsOtherTyping(false);
          markRead(activeId);
        }
      },
      participants,
      (update) => {
        if (active) setMessages((prev) => prev.map((m) => (m.id === update.id ? { ...m, read_at: update.read_at } : m)));
      }
    );

    const typing = createTypingChannel(activeId, me, () => {
      if (!active) return;
      setIsOtherTyping(true);
      if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
      typingHideTimerRef.current = setTimeout(() => setIsOtherTyping(false), TYPING_VISIBLE_MS);
    });
    typingRef.current = typing;

    return () => {
      active = false;
      messageSub.unsubscribe();
      typing.unsubscribe();
      typingRef.current = null;
      if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
    };
  }, [activeId, me, markRead]);

  const handleDraft = (value: string) => {
    setDraft(value);
    if (value && Date.now() - lastTypingSentRef.current > TYPING_SEND_INTERVAL_MS) {
      lastTypingSentRef.current = Date.now();
      typingRef.current?.sendTyping();
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if ((!content && pendingAttachments.length === 0) || !activeId || !me || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      const sent = await sendMessage(
        activeId,
        me,
        content,
        pendingType,
        activeConversation?.participant_ids,
        pendingAttachments
      );
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, last_message: sent, updated_at: sent.created_at } : c))
      );
      setDraft('');
      setPendingAttachments([]);
      setPendingType('text');
    } catch {
      setSendError('Pesan belum terkirim. Periksa koneksi, lalu coba lagi.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleAddAttachment = async (file: File) => {
    if (!me) return;
    setIsUploadingAttachment(true);
    try {
      const att = await uploadChatAttachment(file, me);
      setPendingAttachments((prev) => [...prev, att]);
    } catch {
      setSendError('Gagal mengunggah berkas. Coba lagi.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGroupCreated = (group: Conversation) => {
    setConversations((prev) => [group, ...prev]);
    openConversation(group.id);
  };

  const handleQuickAction = (action: QuickAction) => {
    const copy = QUICK_ACTION_COPY[action];
    const ref = activeConversation?.report_reference ?? '';
    const body = formatAdminReportMessage(activeConversation?.report_id ?? '', ref, action, copy.note).body;
    setDraft(body);
    setPendingType(copy.type);
    inputRef.current?.focus();
  };

  const startWithUser = async (user: UserProfile) => {
    if (!me) return;
    setIsNewChatOpen(false);
    try {
      const conv = await createConversation(null, me, user.id);
      setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [{ ...conv, other_participant: user, unread_count: 0 }, ...prev]));
      openConversation(conv.id);
    } catch {
      setNotice('Percakapan belum dapat dibuka. Coba lagi beberapa saat.');
    }
  };

  const startWithReport = async (report: Report) => {
    if (!me || !report.reporterUserId) return;
    setIsNewChatOpen(false);
    try {
      const conv = await createConversation(report.id, me, report.reporterUserId, report.publicReference);
      const other = await getProfileSummary(report.reporterUserId);
      setConversations((prev) =>
        prev.some((c) => c.id === conv.id)
          ? prev
          : [{ ...conv, other_participant: other, report_reference: report.publicReference, unread_count: 0 }, ...prev]
      );
      openConversation(conv.id);
    } catch {
      setNotice('Percakapan belum dapat dibuka. Coba lagi beberapa saat.');
    }
  };

  const visibleConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'unread' && !(c.unread_count && c.unread_count > 0)) return false;
      if (filter === 'reports' && !c.report_id) return false;
      if (filter === 'direct' && c.is_group) return false;
      if (filter === 'groups' && !c.is_group) return false;
      if (!q) return true;
      const targetName = c.is_group ? c.title : c.other_participant?.displayName;
      return [
        targetName,
        c.other_participant?.username,
        c.report_reference,
        c.last_message?.content,
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [conversations, filter, query]);

  const hasThread = Boolean(activeId);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Custom Pesan Inbox Background Layer */}
      {pesanBg && pesanBg.mode !== 'default' && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
          style={{
            ...pesanBgStyle,
            filter: pesanBg.blurAmount > 0 ? `blur(${pesanBg.blurAmount}px)` : undefined,
            transform: pesanBg.blurAmount > 0 ? 'scale(1.03)' : undefined,
          }}
        >
          {pesanBg.overlayDim > 0 && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0, 0, 0, ${pesanBg.overlayDim})` }}
            />
          )}
        </div>
      )}

      {localOnly && (
        <p role="note" className="relative z-10 shrink-0 md:mx-3 md:mt-3 md:rounded-2xl px-4 py-2 text-xs text-ink-2 bg-brand-soft border-b md:border border-line-soft">
          Server pesan belum aktif. Percakapan disimpan di perangkat ini dan tetap ada setelah halaman dimuat ulang.
        </p>
      )}
      {/* Two floating glass panels on desktop (gap + radius), full-bleed single pane on phones */}
      <div className="relative z-10 flex-1 min-h-0 flex md:gap-3 md:p-3">
      <div
        className={`${hasThread ? 'hidden md:block' : 'block'} w-full md:w-[340px] lg:w-[360px] titik-pop shrink-0 min-h-0 bg-surface md:rounded-3xl md:overflow-hidden md:border md:border-line md:shadow-[var(--glass-shadow)]`}
      >
        <ConversationList
          conversations={visibleConversations}
          activeId={activeId}
          currentUserId={me}
          isLoading={isLoadingList}
          hasAnyConversation={conversations.length > 0}
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          onSelect={openConversation}
          onNewChat={() => setIsNewChatOpen(true)}
          onNewGroup={() => setIsCreateGroupOpen(true)}
        />
      </div>

      <div className={`${hasThread ? 'block' : 'hidden md:flex'} titik-pop flex-1 min-w-0 min-h-0 bg-surface md:rounded-3xl md:overflow-hidden md:border md:border-line md:shadow-[var(--glass-shadow)]`}>
        {hasThread && me ? (
          <div className="h-full w-full">
            <ChatThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={me}
              isLoading={isLoadingThread}
              isOtherTyping={isOtherTyping}
              draft={draft}
              onDraft={handleDraft}
              onSend={handleSend}
              isSending={isSending}
              sendError={sendError}
              onBack={closeConversation}
              canUseQuickActions={profile?.role === 'admin'}
              onQuickAction={handleQuickAction}
              inputRef={inputRef}
              attachments={pendingAttachments}
              onAddAttachment={handleAddAttachment}
              onRemoveAttachment={handleRemoveAttachment}
              isUploadingAttachment={isUploadingAttachment}
            />
          </div>
        ) : (
          <div className="m-auto text-center px-6 max-w-sm space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-ink-3" />
            <p className="font-display text-lg font-semibold text-ink">Pilih percakapan</p>
            <p className="text-sm text-ink-2">Pilih percakapan di daftar, buat komunitas baru, atau mulai dengan tombol di kiri atas.</p>
          </div>
        )}
      </div>

      </div>

      {notice && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-28 md:bottom-8 z-50 glass-strong rounded-xl px-4 py-3 text-sm text-ink flex items-center gap-3">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="text-ink-2 hover:text-ink underline underline-offset-2 text-xs cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {isNewChatOpen && (
        <NewChatDialog
          currentUserId={me}
          reports={profile?.role === 'admin' ? reports : []}
          onPickUser={startWithUser}
          onPickReport={startWithReport}
          onClose={() => setIsNewChatOpen(false)}
        />
      )}

      {isCreateGroupOpen && me && (
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          currentUserId={me}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
};

export default MessagesView;
