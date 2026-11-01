import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Conversation, Message, MessageType, UserProfile } from '../types/domain';
import { encryptMessage, decryptMessage } from '../utils/crypto';

// ---------------------------------------------------------------------------
// Table availability circuit-breaker (prevents repeated 404 console flooding if SQL migration hasn't been run)
// ---------------------------------------------------------------------------
let isMessagesTableAvailable: boolean | null = null;
let isConversationsTableAvailable: boolean | null = null;

function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.statusCode;
  const code = error.code;
  const message = (error.message || '').toLowerCase();
  return (
    status === 404 ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('could not find the table') ||
    message.includes('not found')
  );
}

// In-memory / session store for local/fallback conversation messages
const localMessagesStore = new Map<string, Message[]>();

// ---------------------------------------------------------------------------
// Profile helper — fetch a single profile by user id
// ---------------------------------------------------------------------------
async function fetchProfile(userId: string): Promise<UserProfile | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role')
    .eq('id', userId)
    .single();
  if (!data) return undefined;
  return {
    id: data.id,
    username: data.username ?? '',
    displayName: data.display_name ?? data.username ?? '',
    avatarUrl: data.avatar_url ?? '',
    role: data.role ?? 'citizen',
  };
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------
export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured || !userId || isConversationsTableAvailable === false) return [];

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        isConversationsTableAvailable = false;
      }
      return [];
    }
    if (!data) return [];
    isConversationsTableAvailable = true;

    const enriched: Conversation[] = await Promise.all(
      data.map(async (conv) => {
        const otherId = conv.participant_ids?.find((id: string) => id !== userId);
        const otherProfile = otherId ? await fetchProfile(otherId) : undefined;

        // Last message
        let lastMsg: Message | undefined;
        if (isMessagesTableAvailable !== false) {
          try {
            const { data: msgs, error: msgError } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (msgError && isTableMissingError(msgError)) {
              isMessagesTableAvailable = false;
            } else if (msgs?.[0]) {
              isMessagesTableAvailable = true;
              let decryptedContent = msgs[0].content;
              if (decryptedContent && Array.isArray(conv.participant_ids) && conv.participant_ids.length > 0) {
                try {
                  decryptedContent = await decryptMessage(decryptedContent, conv.id, conv.participant_ids);
                } catch {
                  decryptedContent = msgs[0].content;
                }
              }

              lastMsg = {
                id: msgs[0].id,
                conversation_id: msgs[0].conversation_id,
                sender_id: msgs[0].sender_id,
                content: decryptedContent,
                message_type: msgs[0].message_type,
                attachments: msgs[0].attachments ?? [],
                created_at: msgs[0].created_at,
                read_at: msgs[0].read_at,
              };
            }
          } catch {
            // ignore last message query failure
          }
        }

        // Unread count
        let unread = 0;
        if (isMessagesTableAvailable !== false) {
          try {
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId)
              .is('read_at', null);
            if (countError && isTableMissingError(countError)) {
              isMessagesTableAvailable = false;
            } else {
              unread = count ?? 0;
            }
          } catch {
            unread = 0;
          }
        }

        // Report reference
        let reportRef: string | undefined;
        if (conv.report_id) {
          try {
            const { data: rep } = await supabase
              .from('reports')
              .select('public_reference')
              .eq('id', conv.report_id)
              .single();
            reportRef = rep?.public_reference;
          } catch {
            // ignore
          }
        }

        return {
          id: conv.id,
          report_id: conv.report_id ?? null,
          participant_ids: conv.participant_ids ?? [],
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          other_participant: otherProfile,
          last_message: lastMsg,
          unread_count: unread,
          report_reference: reportRef,
        };
      })
    );

    return enriched;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------
export async function getMessages(
  conversationId: string,
  participantIds?: string[]
): Promise<Message[]> {
  if (!isSupabaseConfigured || !conversationId) return [];

  // Demo conversations or when messages table is unavailable return local messages
  if (conversationId.startsWith('conv-demo') || isMessagesTableAvailable === false) {
    return localMessagesStore.get(conversationId) ?? [];
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) {
        isMessagesTableAvailable = false;
      }
      return localMessagesStore.get(conversationId) ?? [];
    }
    if (!data) return [];
    isMessagesTableAvailable = true;

    let participants = participantIds;
    if (!participants || participants.length === 0) {
      try {
        const { data: convData } = await supabase
          .from('conversations')
          .select('participant_ids')
          .eq('id', conversationId)
          .single();
        participants = convData?.participant_ids ?? [];
      } catch {
        participants = [];
      }
    }

    const withSenders: Message[] = await Promise.all(
      data.map(async (m) => {
        const sender = await fetchProfile(m.sender_id);
        let decrypted = m.content;
        if (participants && participants.length > 0) {
          try {
            decrypted = await decryptMessage(m.content, conversationId, participants);
          } catch {
            decrypted = m.content;
          }
        }

        return {
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id,
          content: decrypted,
          message_type: m.message_type as MessageType,
          attachments: m.attachments ?? [],
          created_at: m.created_at,
          read_at: m.read_at,
          sender,
        };
      })
    );

    return withSenders;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: MessageType = 'text',
  participantIds?: string[]
): Promise<Message> {
  const trimmed = content.trim();

  // If demo conversation, Supabase unconfigured, or messages table unavailable, handle locally
  if (conversationId.startsWith('conv-demo') || !isSupabaseConfigured || isMessagesTableAvailable === false) {
    const localMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      message_type: messageType,
      attachments: [],
      created_at: new Date().toISOString(),
      read_at: null,
    };
    const existing = localMessagesStore.get(conversationId) ?? [];
    localMessagesStore.set(conversationId, [...existing, localMsg]);
    return localMsg;
  }

  let participants = participantIds;
  if (!participants || participants.length === 0) {
    try {
      const { data: convData } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single();
      participants = convData?.participant_ids ?? [];
    } catch {
      participants = [];
    }
  }

  let cipherContent = trimmed;
  if (participants && participants.length > 0) {
    try {
      cipherContent = await encryptMessage(trimmed, conversationId, participants);
    } catch {
      cipherContent = trimmed;
    }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: cipherContent,
        message_type: messageType,
        attachments: [],
      })
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        isMessagesTableAvailable = false;
        const localMsg: Message = {
          id: `msg-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: senderId,
          content: trimmed,
          message_type: messageType,
          attachments: [],
          created_at: new Date().toISOString(),
          read_at: null,
        };
        const existing = localMessagesStore.get(conversationId) ?? [];
        localMessagesStore.set(conversationId, [...existing, localMsg]);
        return localMsg;
      }
      throw new Error(error.message ?? 'Gagal mengirim pesan.');
    }

    if (!data) throw new Error('Gagal mengirim pesan.');
    isMessagesTableAvailable = true;

    // Touch updated_at on conversation
    try {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch {
      // ignore
    }

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: trimmed,
      message_type: data.message_type,
      attachments: data.attachments ?? [],
      created_at: data.created_at,
      read_at: data.read_at,
    };
  } catch (err: any) {
    if (isTableMissingError(err)) {
      isMessagesTableAvailable = false;
      const localMsg: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmed,
        message_type: messageType,
        attachments: [],
        created_at: new Date().toISOString(),
        read_at: null,
      };
      const existing = localMessagesStore.get(conversationId) ?? [];
      localMessagesStore.set(conversationId, [...existing, localMsg]);
      return localMsg;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// createConversation — idempotent: reuses existing if same report + participants
// ---------------------------------------------------------------------------
export async function createConversation(
  reportId: string | null,
  adminId: string,
  citizenId: string
): Promise<Conversation> {
  if (!isSupabaseConfigured) throw new Error('Supabase tidak terkonfigurasi.');

  const participantIds = [adminId, citizenId].sort();

  // Check if conversation already exists for this report + participants
  if (reportId) {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('report_id', reportId)
        .contains('participant_ids', participantIds)
        .limit(1)
        .single();

      if (existing) {
        return {
          id: existing.id,
          report_id: existing.report_id,
          participant_ids: existing.participant_ids,
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        };
      }
    } catch {
      // ignore
    }
  } else {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .is('report_id', null)
        .contains('participant_ids', participantIds)
        .limit(1)
        .single();

      if (existing) {
        return {
          id: existing.id,
          report_id: existing.report_id,
          participant_ids: existing.participant_ids,
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        };
      }
    } catch {
      // ignore
    }
  }

  let data = null;
  let error = null;
  try {
    const res = await supabase
      .from('conversations')
      .insert({
        report_id: reportId,
        participant_ids: participantIds,
      })
      .select()
      .single();
    data = res.data;
    error = res.error;
  } catch (err) {
    error = err;
  }

  if (error || !data) {
    // Graceful fallback for local/demo/unmigrated table
    return {
      id: `conv-user-${adminId.slice(0, 8)}-${citizenId.slice(0, 8)}`,
      report_id: reportId,
      participant_ids: participantIds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Send initial system message
  if (reportId) {
    try {
      const { data: rep } = await supabase
        .from('reports')
        .select('public_reference, title')
        .eq('id', reportId)
        .single();

      if (rep) {
        const initialSystemPlain = `Admin membuka percakapan terkait laporan ${rep.public_reference}: "${rep.title}".`;
        const initialSystemCipher = await encryptMessage(initialSystemPlain, data.id, participantIds);

        await supabase.from('messages').insert({
          conversation_id: data.id,
          sender_id: adminId,
          content: initialSystemCipher,
          message_type: 'status_update',
          attachments: [],
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    id: data.id,
    report_id: data.report_id ?? null,
    participant_ids: data.participant_ids,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// ---------------------------------------------------------------------------
// markAsRead
// ---------------------------------------------------------------------------
export async function markAsRead(messageId: string): Promise<void> {
  if (!isSupabaseConfigured || !messageId || messageId.startsWith('msg-') || messageId.startsWith('opt-') || isMessagesTableAvailable === false) return;
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null);
    if (error && isTableMissingError(error)) {
      isMessagesTableAvailable = false;
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// markConversationRead — mark all unread messages in a conversation as read
// ---------------------------------------------------------------------------
export async function markConversationRead(conversationId: string, currentUserId: string): Promise<void> {
  if (!isSupabaseConfigured || !conversationId || conversationId.startsWith('conv-demo') || isMessagesTableAvailable === false) return;
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .is('read_at', null);
    if (error && isTableMissingError(error)) {
      isMessagesTableAvailable = false;
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// subscribeToMessages — realtime subscription
// ---------------------------------------------------------------------------
export function subscribeToMessages(
  conversationId: string,
  callback: (msg: Message) => void,
  participantIds?: string[]
) {
  if (!isSupabaseConfigured || !conversationId || conversationId.startsWith('conv-demo') || isMessagesTableAvailable === false) {
    return { unsubscribe: () => {} };
  }

  let cachedParticipants = participantIds;

  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        (async () => {
          if (!cachedParticipants || cachedParticipants.length === 0) {
            const { data: convData } = await supabase
              .from('conversations')
              .select('participant_ids')
              .eq('id', conversationId)
              .single();
            cachedParticipants = convData?.participant_ids ?? [];
          }

          let decryptedContent = row.content as string;
          if (cachedParticipants && cachedParticipants.length > 0) {
            try {
              decryptedContent = await decryptMessage(row.content as string, conversationId, cachedParticipants);
            } catch {
              decryptedContent = row.content as string;
            }
          }

          callback({
            id: row.id as string,
            conversation_id: row.conversation_id as string,
            sender_id: row.sender_id as string,
            content: decryptedContent,
            message_type: row.message_type as MessageType,
            attachments: (row.attachments as Message['attachments']) ?? [],
            created_at: row.created_at as string,
            read_at: row.read_at as string | null,
          });
        })();
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// subscribeToConversations — realtime subscription for conversation list
// ---------------------------------------------------------------------------
export function subscribeToConversations(
  userId: string,
  callback: () => void
) {
  if (!isSupabaseConfigured || isConversationsTableAvailable === false) return { unsubscribe: () => {} };

  const channel = supabase
    .channel(`conversations-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      callback
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers: formatAdminReportMessage & formatUnreadBadge
// ---------------------------------------------------------------------------
export interface FormattedAdminMessage {
  conversationId: string;
  senderId: string;
  senderRole: 'admin';
  senderName: string;
  body: string;
  linkedReportId: string;
  linkedReportReference: string;
  actionType: 'request_info' | 'disposition_update' | 'resolution_notice';
  isRead: boolean;
}

export function formatAdminReportMessage(
  reportId: string,
  reference: string,
  actionType: 'request_info' | 'disposition_update' | 'resolution_notice',
  customNote: string
): FormattedAdminMessage {
  let headerPrefix = '';
  switch (actionType) {
    case 'request_info':
      headerPrefix = `[Klarifikasi Laporan ${reference}] Mohon kelengkapan informasi: `;
      break;
    case 'disposition_update':
      headerPrefix = `[Update Penanganan ${reference}] Laporan didisposisikan: `;
      break;
    case 'resolution_notice':
      headerPrefix = `[Laporan Tuntas ${reference}] Pekerjaan fisik telah selesai: `;
      break;
  }

  return {
    conversationId: `conv-${reportId}`,
    senderId: 'usr-admin-pupr',
    senderRole: 'admin',
    senderName: 'Verifikator Dinas PUPR',
    body: `${headerPrefix}${customNote.trim()}`,
    linkedReportId: reportId,
    linkedReportReference: reference,
    actionType,
    isRead: false,
  };
}

export function formatUnreadBadge(count: number): string {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
}

