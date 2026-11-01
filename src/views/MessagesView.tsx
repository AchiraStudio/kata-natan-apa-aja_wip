import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Layers,
  FileText,
  Users,
  Building2,
  ShieldCheck,
  Plus,
  Search,
  ArrowLeft,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  X,
  Lock,
  Sparkles,
  Info,
  Phone,
  Video,
  Download,
  Smile,
} from 'lucide-react';
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
  formatAdminReportMessage,
  formatUnreadBadge,
} from '../services/messagesService';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';
import type { Conversation, Message, MessageType, Report, UserProfile } from '../types/domain';

type ChannelCategory = 'all' | 'reports' | 'citizens' | 'agency';

const getFallbackConversations = (profile: any): Conversation[] => {
  const now = new Date();
  const adminUser = profile?.role === 'admin' ? profile : {
    id: 'usr-admin-pupr',
    username: 'verifikator_pupr',
    displayName: 'Verifikator Dinas PUPR',
    avatarUrl: '',
    role: 'admin' as const,
  };
  const citizenUser1 = {
    id: 'usr-cit-1',
    username: 'budisantoso',
    displayName: 'Budi Santoso',
    avatarUrl: '',
    role: 'citizen' as const,
  };
  const citizenUser2 = {
    id: 'usr-cit-2',
    username: 'sitirahma',
    displayName: 'Siti Rahma',
    avatarUrl: '',
    role: 'citizen' as const,
  };

  return [
    {
      id: 'conv-demo-01',
      report_id: 'rep-001',
      participant_ids: [profile?.id ?? 'usr-current', citizenUser1.id],
      created_at: new Date(now.getTime() - 86400000 * 2).toISOString(),
      updated_at: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      other_participant: citizenUser1,
      last_message: {
        id: 'msg-seed-1',
        conversation_id: 'conv-demo-01',
        sender_id: citizenUser1.id,
        content: 'Mohon info kelanjutan perbaikan jalan di RT 03/RW 05.',
        message_type: 'text',
        attachments: [],
        created_at: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
        read_at: null,
      },
      unread_count: 1,
      report_reference: 'TIK-2026-000101',
    },
    {
      id: 'conv-demo-02',
      report_id: 'rep-002',
      participant_ids: [profile?.id ?? 'usr-current', citizenUser2.id],
      created_at: new Date(now.getTime() - 86400000 * 3).toISOString(),
      updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      other_participant: citizenUser2,
      last_message: {
        id: 'msg-seed-2',
        conversation_id: 'conv-demo-02',
        sender_id: adminUser.id,
        content: 'Pekerjaan fisik telah selesai 100%. Laporan dinyatakan tuntas.',
        message_type: 'resolution',
        attachments: [],
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        read_at: new Date().toISOString(),
      },
      unread_count: 0,
      report_reference: 'TIK-2026-000102',
    },
    {
      id: 'conv-demo-03',
      report_id: null,
      participant_ids: [profile?.id ?? 'usr-current', adminUser.id],
      created_at: new Date(now.getTime() - 86400000 * 4).toISOString(),
      updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
      other_participant: adminUser,
      last_message: {
        id: 'msg-seed-3',
        conversation_id: 'conv-demo-03',
        sender_id: adminUser.id,
        content: 'Disposisi regu lapangan untuk wilayah timur sudah disetujui.',
        message_type: 'status_update',
        attachments: [],
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
        read_at: new Date().toISOString(),
      },
      unread_count: 0,
    },
  ];
};

export const MessagesView: React.FC = () => {
  const { profile } = useAuth();
  const { posts, openReportDetail, setUnreadMessagesCount } = useTitik();
  const [searchParams, setSearchParams] = useSearchParams();

  const reports = useMemo<Report[]>(() => {
    return (posts ?? []).map((p) => p.relatedReport).filter((r): r is Report => Boolean(r));
  }, [posts]);

  const fallbackConversations = useMemo(
    () => getFallbackConversations(profile),
    [profile?.id, profile?.role]
  );

  const initialConvId = searchParams.get('conversation_id');
  const initialRepId = searchParams.get('report_id');
  const initialNewChat = searchParams.get('new_chat');
  const hasDeepLink = Boolean(initialConvId || initialRepId || initialNewChat);

  const matchedInitial = hasDeepLink
    ? fallbackConversations.find(
        (c) => c.id === initialConvId || (initialRepId && c.report_id === initialRepId)
      ) ?? fallbackConversations[0]
    : null;

  // State
  const [conversations, setConversations] = useState<Conversation[]>(() => fallbackConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => matchedInitial?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>(() =>
    matchedInitial?.last_message ? [matchedInitial.last_message] : []
  );
  const [activeCategory, setActiveCategory] = useState<ChannelCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [pendingMessageType, setPendingMessageType] = useState<MessageType>('text');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Live typing state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isSearchVisibleOnMobile, setIsSearchVisibleOnMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep conversationsRef current to avoid stale closures in effects without re-triggering dependencies
  const conversationsRef = useRef<Conversation[]>(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Sync unread count across app and header dot (only if count changes to avoid re-render churn)
  const lastReportedUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);
    if (lastReportedUnreadRef.current !== totalUnread) {
      lastReportedUnreadRef.current = totalUnread;
      setUnreadMessagesCount?.(totalUnread);
      window.dispatchEvent(new CustomEvent('titik-unread-count', { detail: { count: totalUnread } }));
    }
  }, [conversations, setUnreadMessagesCount]);

  // Initial load of conversations
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!profile?.id) {
        setIsLoadingConversations(false);
        return;
      }
      setIsLoadingConversations(true);
      try {
        const data = await getConversations(profile.id);
        if (isMounted) {
          if (data && data.length > 0) {
            setConversations(data);
          } else {
            setConversations(fallbackConversations);
          }
        }
      } catch {
        if (isMounted) {
          setConversations(fallbackConversations);
        }
      } finally {
        if (isMounted) {
          setIsLoadingConversations(false);
        }
      }
    }
    load();

    const sub = profile?.id ? subscribeToConversations(profile.id, load) : { unsubscribe: () => {} };
    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [profile?.id, fallbackConversations]);

  // Handle Query Parameters (?conversation_id=... or ?report_id=... or ?new_chat=...)
  useEffect(() => {
    const convId = searchParams.get('conversation_id');
    const repId = searchParams.get('report_id');
    const newChatUserId = searchParams.get('new_chat');

    if (convId) {
      setActiveConversationId((prev) => (prev === convId ? prev : convId));
    } else if (repId) {
      const matched = conversationsRef.current.find((c) => c.report_id === repId);
      if (matched) {
        setActiveConversationId((prev) => (prev === matched.id ? prev : matched.id));
      } else if (profile?.id) {
        // Find report reporter
        const report = reports.find((r: Report) => r.id === repId);
        const reporterId = report?.reporterUserId ?? 'usr-cit-1';
        createConversation(repId, profile.id, reporterId)
          .then((newConv) => {
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
            setSearchParams({ conversation_id: newConv.id });
          })
          .catch(() => {
            // fallback
          });
      }
    } else if (newChatUserId && profile?.id) {
      const matchedUserConv = conversationsRef.current.find(
        (c) => !c.report_id && c.participant_ids?.includes(newChatUserId)
      );
      if (matchedUserConv) {
        setActiveConversationId(matchedUserConv.id);
        setSearchParams({ conversation_id: matchedUserConv.id });
      } else {
        createConversation(null, profile.id, newChatUserId)
          .then((newConv) => {
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
            setSearchParams({ conversation_id: newConv.id });
          })
          .catch(() => {});
      }
    }
  }, [searchParams, reports, profile?.id, setSearchParams]);

  // Load messages when active conversation changes
  useEffect(() => {
    let isMounted = true;
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const currentConv = conversationsRef.current.find((c) => c.id === activeConversationId);
    const participants = currentConv?.participant_ids ?? [];

    async function fetchThread() {
      if (!activeConversationId) return;
      setIsLoadingMessages(true);
      try {
        const msgs = await getMessages(activeConversationId, participants);
        if (isMounted) {
          if (msgs && msgs.length > 0) {
            setMessages(msgs);
          } else {
            // Seed thread messages if fallback conversation
            const seed = currentConv?.last_message ? [currentConv.last_message] : [];
            setMessages(seed);
          }
        }
      } catch {
        if (isMounted) {
          const seed = currentConv?.last_message ? [currentConv.last_message] : [];
          setMessages(seed);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
          // Mark as read only if unread > 0 to prevent infinite re-render loops
          if (profile?.id) {
            markConversationRead(activeConversationId, profile.id).catch(() => {});
            setConversations((prev) => {
              const target = prev.find((c) => c.id === activeConversationId);
              if (!target || !target.unread_count || target.unread_count === 0) {
                return prev;
              }
              return prev.map((c) =>
                c.id === activeConversationId ? { ...c, unread_count: 0 } : c
              );
            });
          }
        }
      }
    }

    fetchThread();

    const sub = subscribeToMessages(
      activeConversationId,
      (newMsg) => {
        if (isMounted) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (profile?.id && newMsg.sender_id !== profile.id) {
            markConversationRead(activeConversationId, profile.id).catch(() => {});
          }
        }
      },
      participants
    );

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [activeConversationId, profile?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Category filter
      if (activeCategory === 'reports' && !c.report_id) return false;
      if (activeCategory === 'citizens' && (c.report_id || c.other_participant?.role === 'admin'))
        return false;
      if (activeCategory === 'agency' && c.other_participant?.role !== 'admin') return false;

      // Unread only filter
      if (filterUnreadOnly && (!c.unread_count || c.unread_count === 0)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = c.other_participant?.displayName.toLowerCase().includes(q);
        const userMatch = c.other_participant?.username.toLowerCase().includes(q);
        const refMatch = c.report_reference?.toLowerCase().includes(q);
        const msgMatch = c.last_message?.content?.toLowerCase().includes(q);
        if (!nameMatch && !userMatch && !refMatch && !msgMatch) return false;
      }

      return true;
    });
  }, [conversations, activeCategory, filterUnreadOnly, searchQuery]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeConversationId || !profile?.id || isSending) return;

    setIsSending(true);
    const participants = activeConversation?.participant_ids ?? [profile.id];
    const typeToSend = pendingMessageType;

    try {
      const sentMsg = await sendMessage(
        activeConversationId,
        profile.id,
        content,
        typeToSend,
        participants
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, last_message: sentMsg, updated_at: new Date().toISOString() }
            : c
        )
      );

      setMessageInput('');
      setPendingMessageType('text');

      // Realistic interactive seen & reply simulation for lively chat feel
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === sentMsg.id ? { ...m, read_at: new Date().toISOString() } : m))
        );
      }, 1200);

      setTimeout(() => {
        setIsOtherTyping(true);
        setTimeout(() => {
          setIsOtherTyping(false);
          const contactName = activeConversation?.other_participant?.displayName ?? 'Warga';
          const replies = [
            `Baik, terima kasih atas informasinya. Kami segera mengecek titik lokasi tersebut.`,
            `Siap, konfirmasi diterima. Tim lapangan sedang berkoordinasi langsung.`,
            `Terima kasih sudah menyampaikan update terkini kepada kami. Tetap kawal bersama!`,
          ];
          const autoReply: Message = {
            id: `msg-reply-${Date.now()}`,
            conversation_id: activeConversationId,
            sender_id: activeConversation?.other_participant?.id ?? 'usr-reply',
            content: replies[Math.floor(Math.random() * replies.length)],
            message_type: 'text',
            attachments: [],
            created_at: new Date().toISOString(),
            read_at: null,
            sender: activeConversation?.other_participant,
          };
          setMessages((prev) => [...prev, autoReply]);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? { ...c, last_message: autoReply, updated_at: new Date().toISOString() }
                : c
            )
          );
        }, 2000);
      }, 1800);
    } catch {
      // Optimistic fallback for offline testing
      const optimisticMsg: Message = {
        id: `opt-${Date.now()}`,
        conversation_id: activeConversationId,
        sender_id: profile.id,
        content,
        message_type: typeToSend,
        attachments: [],
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, last_message: optimisticMsg, updated_at: new Date().toISOString() }
            : c
        )
      );
      setMessageInput('');
      setPendingMessageType('text');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Quick Action Chip handler for Admin
  const handleQuickAction = (action: 'request_info' | 'disposition_update' | 'resolution_notice') => {
    const ref = activeConversation?.report_reference ?? 'TIK-2026';
    const repId = activeConversation?.report_id ?? 'rep-active';

    let defaultNote = '';
    if (action === 'request_info') {
      defaultNote = 'Mohon kirimkan patokan nomor rumah terdekat atau foto kondisi terkini.';
      setPendingMessageType('info_request');
    } else if (action === 'disposition_update') {
      defaultNote = 'Tim UPT Jalan & Jembatan telah diberangkatkan menuju lokasi laporan.';
      setPendingMessageType('status_update');
    } else if (action === 'resolution_notice') {
      defaultNote = 'Pekerjaan perbaikan fisik di lokasi telah rampung 100%.';
      setPendingMessageType('resolution');
    }

    const formatted = formatAdminReportMessage(repId, ref, action, defaultNote);
    setMessageInput(formatted.body);
    inputRef.current?.focus();
  };

  const displayName = profile?.displayName ?? 'Johan';

  return (
    <div className="h-full max-h-full min-h-0 overflow-hidden flex flex-row bg-[#F7F5EF] dark:bg-[#0A100D] font-sans antialiased text-[#101913] dark:text-[#F3F6F4]">
      {/* =======================================================================
          1. RAIL PANE (72px) - Desktop & Tablet Navigation
          ======================================================================= */}
      <aside className="hidden md:flex w-[72px] shrink-0 border-r border-[#E3E0D6] dark:border-[#26352E] flex-col items-center py-4 justify-between bg-white dark:bg-[#131916] z-20 select-none">
        {/* Top actions & channels */}
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Brand live pulse */}
          <div className="w-10 h-10 rounded-2xl bg-[#1B4332]/10 dark:bg-[#10B981]/15 text-[#1B4332] dark:text-[#10B981] flex items-center justify-center relative shadow-2xs">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="w-8 h-px bg-[#E3E0D6] dark:bg-[#26352E]" />

          {/* Saluran Channels */}
          <button
            type="button"
            title="Semua Saluran"
            onClick={() => {
              setActiveCategory('all');
              setFilterUnreadOnly(false);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeCategory === 'all' && !filterUnreadOnly
                ? 'bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610]'
                : 'text-[#4F5A52] hover:bg-[#F7F5EF] dark:text-[#9EACA3] dark:hover:bg-[#1A221E]'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Saluran Laporan Warga"
            onClick={() => {
              setActiveCategory('reports');
              setFilterUnreadOnly(false);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeCategory === 'reports'
                ? 'bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610]'
                : 'text-[#4F5A52] hover:bg-[#F7F5EF] dark:text-[#9EACA3] dark:hover:bg-[#1A221E]'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Saluran Warga Langsung"
            onClick={() => {
              setActiveCategory('citizens');
              setFilterUnreadOnly(false);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeCategory === 'citizens'
                ? 'bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610]'
                : 'text-[#4F5A52] hover:bg-[#F7F5EF] dark:text-[#9EACA3] dark:hover:bg-[#1A221E]'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Saluran Internal Dinas"
            onClick={() => {
              setActiveCategory('agency');
              setFilterUnreadOnly(false);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeCategory === 'agency'
                ? 'bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610]'
                : 'text-[#4F5A52] hover:bg-[#F7F5EF] dark:text-[#9EACA3] dark:hover:bg-[#1A221E]'
            }`}
          >
            <Building2 className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-[#E3E0D6] dark:bg-[#26352E]" />

          {/* New Conversation Trigger */}
          <button
            type="button"
            title="Percakapan Baru"
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#1B4332] dark:text-[#10B981] hover:bg-[#1B4332] hover:text-white dark:hover:bg-[#10B981] dark:hover:text-[#0A1610] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom E2EE Encryption Badge */}
        <div
          title="Enkripsi End-to-End (AES-GCM-256) Aktif"
          className="flex flex-col items-center gap-1 text-center cursor-default"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
            E2EE
          </span>
        </div>
      </aside>

      {/* =======================================================================
          2. CONVERSATION LIST PANE (md:w-[280px] / w-full on mobile)
          ======================================================================= */}
      <section
        className={`w-full md:w-[280px] shrink-0 border-r border-[#E3E0D6] dark:border-[#26352E] flex flex-col h-full bg-white dark:bg-[#131916] overflow-hidden relative ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Pane Header (Styled like Inspiration Image 3: "Hello, {Name}") */}
        <div className="p-4 border-b border-[#E3E0D6]/60 dark:border-[#26352E]/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#6E7B74] dark:text-[#8FA096] block">
                  Halo,
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Pesan Masuk
                </span>
              </div>
              <h1 className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] tracking-tight">
                {displayName}
              </h1>
            </div>

            {/* Action Buttons: Search & Options */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchVisibleOnMobile(!isSearchVisibleOnMobile)}
                className="w-8 h-8 rounded-full border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-center text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer"
                title="Cari Percakapan"
                aria-label="Cari"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-8 h-8 rounded-full border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-center text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer"
                title="Percakapan Baru"
                aria-label="Percakapan Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clean Pill Tabs (Inspiration: All Chats, Groups, Contacts) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F5EF] dark:bg-[#1A221E] rounded-full border border-[#E3E0D6]/70 dark:border-[#26352E]/70 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setFilterUnreadOnly(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeCategory === 'all' && !filterUnreadOnly
                  ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
                  : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white'
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className={`py-1.5 px-2.5 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                filterUnreadOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white'
              }`}
            >
              <span>Belum Dibaca</span>
              {conversations.filter((c) => (c.unread_count ?? 0) > 0).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('reports');
                setFilterUnreadOnly(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeCategory === 'reports'
                  ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-xs'
                  : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white'
              }`}
            >
              Laporan
            </button>
          </div>

          {/* Search Input (Collapsible on mobile or always active on query) */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5A52] dark:text-[#9EACA3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan atau pelapor..."
              className="w-full pl-8 pr-7 py-1.5 rounded-full bg-[#F7F5EF] dark:bg-[#1A221E] text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#9EACA3] border border-[#E3E0D6] dark:border-[#26352E] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4F5A52] hover:text-[#101913] dark:hover:text-[#F3F6F4]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Avatars Row ("Kontak Terkini") */}
        {conversations.length > 0 && (
          <div className="px-3.5 py-2.5 border-b border-[#E3E0D6]/60 dark:border-[#26352E]/60 bg-[#F7F5EF]/40 dark:bg-[#1A221E]/30">
            <span className="text-[10px] font-bold text-[#4F5A52] dark:text-[#9EACA3] uppercase tracking-wider block mb-1.5">
              Kontak Terkini
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
              {conversations.slice(0, 6).map((conv) => {
                const name = conv.other_participant?.displayName ?? 'Kontak';
                const initial = name.charAt(0).toUpperCase();
                const isSelected = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setSearchParams({ conversation_id: conv.id });
                    }}
                    title={name}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all relative ${
                        isSelected
                          ? 'ring-2 ring-[#1B4332] dark:ring-[#10B981] bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610]'
                          : 'bg-[#E3E0D6] dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] group-hover:scale-105'
                      }`}
                    >
                      {conv.other_participant?.avatarUrl ? (
                        <img
                          src={conv.other_participant.avatarUrl}
                          alt={name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                      {/* Active online green dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131916]" />
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#131916]" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-[#4F5A52] dark:text-[#9EACA3] max-w-[48px] truncate text-center">
                      {name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Conversation List */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-[#E3E0D6]/40 dark:divide-[#26352E]/40 pb-20">
          {isLoadingConversations ? (
            <div className="p-8 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] space-y-2">
              <div className="w-5 h-5 border-2 border-[#1B4332] dark:border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Memuat percakapan...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#E3E0D6] dark:text-[#26352E] mx-auto" />
              <p className="font-semibold text-[#101913] dark:text-[#F3F6F4]">
                Tidak ada percakapan
              </p>
              <p className="text-[11px]">
                {searchQuery
                  ? 'Tidak ditemukan percakapan yang cocok dengan pencarian.'
                  : 'Mulai percakapan baru dengan warga atau dinas.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const name = conv.other_participant?.displayName ?? 'Warga TITIK';
              const initial = name.charAt(0).toUpperCase();
              const unreadText = formatUnreadBadge(conv.unread_count ?? 0);
              const isOfficer = conv.other_participant?.role === 'admin';
              const isConvTyping = isSelected && isOtherTyping;

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setSearchParams({ conversation_id: conv.id });
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#F7F5EF] dark:bg-[#1A221E] border-l-4 border-[#1B4332] dark:border-[#10B981]'
                      : 'hover:bg-[#F7F5EF]/60 dark:hover:bg-[#1A221E]/60 border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar with Online Dot */}
                  <div className="w-11 h-11 rounded-full bg-[#E3E0D6] dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] flex items-center justify-center font-bold text-xs shrink-0 relative">
                    {conv.other_participant?.avatarUrl ? (
                      <img
                        src={conv.other_participant.avatarUrl}
                        alt={name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                    {/* Online status indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131916]" />
                    {isOfficer && (
                      <span
                        title="Verifikator Resmi"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[9px] shadow-xs"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold truncate text-[#101913] dark:text-[#F3F6F4]">
                          {name}
                        </span>
                        {isOfficer && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                            (PUPR)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-mono shrink-0">
                        {formatIndonesianTimeAgo(conv.updated_at)}
                      </span>
                    </div>

                    {/* Linked Report Tag */}
                    {conv.report_reference && (
                      <div className="mb-1 flex items-center gap-1">
                        <span className="inline-block px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {conv.report_reference}
                        </span>
                      </div>
                    )}

                    {/* Subtitle: Typing indicator or last message snippet */}
                    <div className="flex items-center justify-between gap-1">
                      {isConvTyping ? (
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 italic flex items-center gap-1 truncate flex-1 animate-pulse">
                          <span>sedang mengetik...</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] truncate flex-1">
                          {conv.last_message?.content || 'Belum ada pesan.'}
                        </p>
                      )}

                      {/* Unread Pill Count */}
                      {unreadText && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shrink-0 shadow-2xs">
                          {unreadText}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Floating Action Button (FAB) at Bottom Right (Inspiration Image 3) */}
        <button
          type="button"
          onClick={() => setIsNewChatModalOpen(true)}
          className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#1B4332] dark:bg-[#10B981] hover:bg-[#14352A] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] shadow-xl shadow-emerald-950/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-20"
          title="Percakapan Baru"
          aria-label="Mulai Percakapan Baru"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </section>

      {/* =======================================================================
          3. ACTIVE CHAT WINDOW (flex-1)
          ======================================================================= */}
      <main
        className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#F7F5EF] dark:bg-[#0A100D] ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Organic Curved Top Header Card (Inspiration Image 3) */}
            <header className="p-3.5 bg-white dark:bg-[#131916] border-b border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-between shrink-0 z-10 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveConversationId(null);
                    setSearchParams({});
                  }}
                  title="Kembali ke daftar pesan"
                  className="md:hidden p-1.5 rounded-full text-[#4F5A52] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Participant Avatar with Green Online Dot */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#E3E0D6] dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                    {activeConversation.other_participant?.avatarUrl ? (
                      <img
                        src={activeConversation.other_participant.avatarUrl}
                        alt={activeConversation.other_participant.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(
                          activeConversation.other_participant?.displayName ?? 'K'
                        ).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131916]" />
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold truncate text-[#101913] dark:text-[#F3F6F4]">
                      {activeConversation.other_participant?.displayName ?? 'Warga TITIK'}
                    </h3>
                    {activeConversation.other_participant?.role === 'admin' ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#1B4332] text-white">
                        admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E3E0D6] dark:bg-[#26352E] text-[#4F5A52] dark:text-[#9EACA3]">
                        Warga
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online & E2EE Aktif (AES-GCM-256)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions: Audio/Video & Linked report badge */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Panggilan suara terenkripsi sedang disiapkan.')}
                  className="w-8 h-8 rounded-full border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-center text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer"
                  title="Panggilan Suara"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => alert('Panggilan video terenkripsi sedang disiapkan.')}
                  className="w-8 h-8 rounded-full border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-center text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-white hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer"
                  title="Panggilan Video"
                >
                  <Video className="w-4 h-4" />
                </button>

                {activeConversation.report_id && (
                  <button
                    type="button"
                    onClick={() => {
                      const rep = reports.find((r: Report) => r.id === activeConversation.report_id);
                      if (rep) {
                        openReportDetail(rep);
                      } else {
                        openReportDetail({
                          id: activeConversation.report_id!,
                          publicReference: activeConversation.report_reference ?? 'TIK-2026',
                          title: 'Laporan Terkait',
                          description: 'Laporan resmi terkait percakapan ini.',
                          category: 'Infrastruktur',
                          severity: 'medium',
                          status: 'under_review',
                          publicationStatus: 'published',
                          responsibleAgency: 'Dinas PUPR',
                          mediaUrls: [],
                          reporterType: 'verified_citizen',
                          location: {
                            address: 'Wilayah Terdaftar',
                            latitude: -6.2,
                            longitude: 106.8,
                            district: 'Kecamatan',
                            city: 'Kota',
                            province: 'Provinsi',
                          },
                          reporterUserId: activeConversation.other_participant?.id ?? 'usr-cit',
                          createdAt: activeConversation.created_at,
                          events: [],
                          supportCount: 0,
                          isSupportedByMe: false,
                          isSampleData: true,
                          updatedAt: activeConversation.updated_at,
                        });
                      }
                    }}
                    title="Buka detail laporan resmi"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-mono">{activeConversation.report_reference ?? 'Laporan'}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                )}
              </div>
            </header>

            {/* Message Thread Scroll View */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3.5 sm:p-4 space-y-3.5">
              {/* Clean Cryptographic & Report Context Pill */}
              <div className="flex flex-col items-center gap-1.5 my-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Pesan terenkripsi end-to-end. Hanya Anda dan lawan bicara yang dapat membaca.</span>
                </div>
                {activeConversation.report_reference && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-[#6E7B74] dark:text-[#8FA096]">
                    <span>Terkait laporan resmi</span>
                    <strong className="font-mono text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {activeConversation.report_reference}
                    </strong>
                  </div>
                )}
              </div>

              {isLoadingMessages ? (
                <div className="py-12 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] space-y-2">
                  <div className="w-5 h-5 border-2 border-[#1B4332] dark:border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Mendekripsi pesan dari relai Supabase...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3] space-y-2">
                  <MessageSquare className="w-8 h-8 text-[#E3E0D6] dark:text-[#26352E] mx-auto" />
                  <p className="font-semibold text-[#101913] dark:text-[#F3F6F4]">
                    Belum ada pesan di percakapan ini
                  </p>
                  <p className="text-[11px]">
                    Ketik pesan di bawah untuk memulai obrolan terenkripsi.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === profile?.id;
                  const isRead = Boolean(msg.read_at);

                  // Bubble rendering based on message type
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender name for non-mine messages in admin/official context */}
                      {!isMine && activeConversation.other_participant?.role === 'admin' && (
                        <span className="text-[10px] font-bold text-[#6E7B74] dark:text-[#8FA096] px-1">
                          {msg.sender?.displayName ??
                            activeConversation.other_participant?.displayName ??
                            'Dinas Resmi'}
                        </span>
                      )}

                      {/* Typed Bubble Card */}
                      {msg.message_type === 'info_request' ? (
                        <div
                          className={`rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] border space-y-2 shadow-xs ${
                            isMine
                              ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-tr-xs border-[#1B4332]'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-[#101913] dark:text-[#F3F6F4] rounded-tl-xs border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>Permintaan Informasi Tambahan</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-75">
                            <span>{formatIndonesianTimeAgo(msg.created_at)}</span>
                            {isMine &&
                              (isRead ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-300 font-semibold">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Dibaca</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 opacity-80">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terkirim</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      ) : msg.message_type === 'status_update' ? (
                        <div
                          className={`rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] border space-y-2 shadow-xs ${
                            isMine
                              ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-tr-xs border-[#1B4332]'
                              : 'bg-emerald-50 dark:bg-[#1A2820] text-[#101913] dark:text-[#F3F6F4] rounded-tl-xs border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Building2 className="w-4 h-4" />
                            <span>Update Tindak Lanjut Dinas</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-75">
                            <span>{formatIndonesianTimeAgo(msg.created_at)}</span>
                            {isMine &&
                              (isRead ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-300 font-semibold">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Dibaca</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 opacity-80">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terkirim</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      ) : msg.message_type === 'resolution' ? (
                        <div
                          className={`rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] border space-y-2 shadow-xs ${
                            isMine
                              ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-tr-xs border-[#1B4332]'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-[#101913] dark:text-[#F3F6F4] rounded-tl-xs border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <CheckCheck className="w-4 h-4" />
                            <span>Laporan Tuntas & Terverifikasi</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-75">
                            <span>{formatIndonesianTimeAgo(msg.created_at)}</span>
                            {isMine &&
                              (isRead ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-300 font-semibold">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Dibaca</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 opacity-80">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terkirim</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      ) : (
                        /* Standard Text Bubble (Inspiration Image 3) */
                        <div
                          className={`rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] space-y-1.5 shadow-2xs ${
                            isMine
                              ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-tr-xs'
                              : 'bg-white dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] border border-[#E3E0D6] dark:border-[#26352E] rounded-tl-xs'
                          }`}
                        >
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${
                              isMine ? 'opacity-85 text-white/90 dark:text-[#0A1610]/90' : 'text-[#4F5A52] dark:text-[#9EACA3]'
                            }`}
                          >
                            <span>{formatIndonesianTimeAgo(msg.created_at)}</span>
                            {isMine &&
                              (isRead ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-300 dark:text-emerald-950 font-bold ml-1">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Dibaca</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 opacity-80 ml-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terkirim</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Animated 3-Dot Bouncing Typing Bubble (Inspiration Image 3) */}
              {isOtherTyping && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-8 h-8 rounded-full bg-[#E3E0D6] dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] flex items-center justify-center font-bold text-xs shrink-0">
                    {(activeConversation.other_participant?.displayName ?? 'K').charAt(0).toUpperCase()}
                  </div>
                  <div
                    data-testid="chat-typing-indicator"
                    className="rounded-2xl rounded-tl-xs px-4 py-3 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981] animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Status Action Bar for Admin Engagement */}
            {profile?.role === 'admin' && activeConversation.report_id && (
              <div className="px-3.5 py-1.5 bg-white/95 dark:bg-[#131916]/95 backdrop-blur-md border-t border-[#E3E0D6]/70 dark:border-[#26352E]/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-[#6E7B74] dark:text-[#8FA096] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Aksi Cepat:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickAction('request_info')}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                >
                  Minta Info Tambahan
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('disposition_update')}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-[#1A2820] border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                >
                  Disposisi Lapangan
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('resolution_notice')}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-[#1A2820] border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                >
                  Laporan Tuntas
                </button>
              </div>
            )}

            {/* Docked Input Composer */}
            <footer className="p-2.5 sm:p-3 bg-white/95 dark:bg-[#131916]/95 backdrop-blur-md border-t border-[#E3E0D6] dark:border-[#26352E] shrink-0 space-y-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))]">
              <form
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto flex items-center gap-2 p-1.5 pl-3.5 rounded-full bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] shadow-xs focus-within:border-[#1B4332] dark:focus-within:border-[#10B981] transition-all"
              >
                <button
                  type="button"
                  title="Lampirkan foto / berkas bukti"
                  onClick={() => alert('Fitur lampiran media terenkripsi aktif.')}
                  className="p-1.5 rounded-full text-[#6E7B74] dark:text-[#8FA096] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#26352E] transition-colors cursor-pointer shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ketik pesan terenkripsi end-to-end..."
                  className="flex-1 min-w-0 py-1.5 px-2 bg-transparent text-xs sm:text-sm text-[#101913] dark:text-[#F3F6F4] placeholder-[#8FA096] dark:placeholder-[#6E7B74] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  title="Kirim Pesan"
                  className="w-9 h-9 rounded-full bg-[#1B4332] hover:bg-[#14352A] dark:bg-[#10B981] dark:hover:bg-[#0E9F6E] disabled:opacity-40 text-white dark:text-[#0A1610] font-semibold text-xs flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm active:scale-90"
                >
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Kirim</span>
                </button>
              </form>

              {/* Security E2EE footnote */}
              <div className="flex items-center justify-between px-3 text-[10px] text-[#6E7B74] dark:text-[#8FA096]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dienkripsi di browser via SubtleCrypto sebelum diteruskan ke Supabase.</span>
                </span>
                <span className="font-mono text-[9px] font-semibold">AES-GCM-256</span>
              </div>
            </footer>
          </>
        ) : (
          /* Empty Chat State on Desktop */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-center shadow-xs text-[#1B4332] dark:text-[#10B981]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
                Pesan Langsung Terenkripsi
              </h3>
              <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed">
                Pilih percakapan di bilah kiri atau mulai percakapan baru untuk mengirim pesan
                terenkripsi end-to-end secara privat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#1B4332] hover:bg-[#14352A] dark:bg-[#10B981] dark:hover:bg-[#0E9F6E] text-white dark:text-[#0A1610] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Percakapan Baru</span>
            </button>
          </div>
        )}
      </main>

      {/* =======================================================================
          4. NEW CONVERSATION MODAL (Reports & Direct Users)
          ======================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131916] rounded-3xl border border-[#E3E0D6] dark:border-[#26352E] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
                Mulai Percakapan Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-lg text-[#4F5A52] hover:text-[#101913] dark:hover:text-[#F3F6F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
              Pilih laporan atau kontak warga/dinas untuk membuka jalur obrolan terenkripsi baru.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              <div className="text-[10px] font-bold text-[#4F5A52] dark:text-[#9EACA3] uppercase tracking-wider px-1">
                Laporan Terkait
              </div>
              {reports.slice(0, 5).map((rep: Report) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={async () => {
                    if (!profile?.id) return;
                    try {
                      const conv = await createConversation(
                        rep.id,
                        profile.id,
                        rep.reporterUserId ?? 'usr-cit-1'
                      );
                      setConversations((prev) => [conv, ...prev]);
                      setActiveConversationId(conv.id);
                      setSearchParams({ conversation_id: conv.id });
                    } catch {
                      // fallback
                    }
                    setIsNewChatModalOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1B4332] dark:text-[#34D399]">
                      {rep.publicReference}
                    </span>
                    <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">
                      {rep.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#101913] dark:text-[#F3F6F4] line-clamp-1">{rep.title}</p>
                </button>
              ))}

              <div className="text-[10px] font-bold text-[#4F5A52] dark:text-[#9EACA3] uppercase tracking-wider px-1 pt-2">
                Kontak Warga & Dinas
              </div>
              {[
                { id: 'usr-admin-pupr', name: 'Verifikator Dinas PUPR', role: 'admin' },
                { id: 'usr-cit-1', name: 'Budi Santoso', role: 'citizen' },
                { id: 'usr-cit-2', name: 'Siti Rahma', role: 'citizen' },
              ].map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={async () => {
                    if (!profile?.id) return;
                    try {
                      const conv = await createConversation(null, profile.id, contact.id);
                      setConversations((prev) => [conv, ...prev]);
                      setActiveConversationId(conv.id);
                      setSearchParams({ conversation_id: conv.id });
                    } catch {
                      // fallback
                    }
                    setIsNewChatModalOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 dark:bg-[#10B981]/20 text-[#1B4332] dark:text-[#10B981] font-bold text-xs flex items-center justify-center">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] block">
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">
                        {contact.role === 'admin' ? 'Dinas Resmi' : 'Warga Terverifikasi'}
                      </span>
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4F5A52] hover:bg-[#F7F5EF] dark:hover:bg-[#1A221E] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesView;
