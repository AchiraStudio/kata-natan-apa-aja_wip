import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Conversation, Message, MessageType, UserProfile } from '../types/domain';
import { encryptMessage, decryptMessage } from '../utils/crypto';

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
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [userId])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const enriched: Conversation[] = await Promise.all(
    data.map(async (conv) => {
      const otherId = conv.participant_ids.find((id: string) => id !== userId);
      const otherProfile = otherId ? await fetchProfile(otherId) : undefined;

      // Last message
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let lastMsg: Message | undefined;

      if (msgs?.[0]) {
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

      // Unread count
      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .is('read_at', null);

      // Report reference
      let reportRef: string | undefined;
      if (conv.report_id) {
        const { data: rep } = await supabase
          .from('reports')
          .select('public_reference')
          .eq('id', conv.report_id)
          .single();
        reportRef = rep?.public_reference;
      }

      return {
        id: conv.id,
        report_id: conv.report_id ?? null,
        participant_ids: conv.participant_ids,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        other_participant: otherProfile,
        last_message: lastMsg,
        unread_count: unread ?? 0,
        report_reference: reportRef,
      };
    })
  );

  return enriched;
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------
export async function getMessages(
  conversationId: string,
  participantIds?: string[]
): Promise<Message[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  let participants = participantIds;
  if (!participants || participants.length === 0) {
    const { data: convData } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();
    participants = convData?.participant_ids ?? [];
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
  if (!isSupabaseConfigured) throw new Error('Supabase tidak terkonfigurasi.');

  let participants = participantIds;
  if (!participants || participants.length === 0) {
    const { data: convData } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();
    participants = convData?.participant_ids ?? [];
  }

  const trimmed = content.trim();
  let cipherContent = trimmed;
  if (participants && participants.length > 0) {
    cipherContent = await encryptMessage(trimmed, conversationId, participants);
  }

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

  if (error || !data) throw new Error(error?.message ?? 'Gagal mengirim pesan.');

  // Touch updated_at on conversation
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

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
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      report_id: reportId,
      participant_ids: participantIds,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Gagal membuat percakapan.');

  // Send initial system message
  if (reportId) {
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
  if (!isSupabaseConfigured) return;
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null);
}

// ---------------------------------------------------------------------------
// markConversationRead — mark all unread messages in a conversation as read
// ---------------------------------------------------------------------------
export async function markConversationRead(conversationId: string, currentUserId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);
}

// ---------------------------------------------------------------------------
// subscribeToMessages — realtime subscription
// ---------------------------------------------------------------------------
export function subscribeToMessages(
  conversationId: string,
  callback: (msg: Message) => void,
  participantIds?: string[]
) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };

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
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };

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

