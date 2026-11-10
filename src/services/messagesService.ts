import { supabase, isSupabaseConfigured } from './supabaseClient';
import type {
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  MessageType,
  UserProfile,
} from '../types/domain';
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

// ---------------------------------------------------------------------------
// Device-local store. Used whenever the server tables are not available (migration not run,
// Supabase not configured). It lives in localStorage so threads and messages survive reloads.
// Server conversation ids are UUIDs; local ones always start with "conv-".
// ---------------------------------------------------------------------------
const LOCAL_KEY = 'titik_local_messages_v1';
const LOCAL_EVENT = 'titik-local-messages';

interface LocalDb {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
}

const isLocalConversationId = (id: string) => id.startsWith('conv-');

function readLocal(): LocalDb {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalDb>;
      return { conversations: parsed.conversations ?? [], messages: parsed.messages ?? {} };
    }
  } catch {
    // corrupt or unavailable storage: start empty
  }
  return { conversations: [], messages: {} };
}

function writeLocal(db: LocalDb) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
  } catch {
    // storage full or blocked: the in-flight message is still returned to the caller
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_EVENT));
    window.dispatchEvent(new Event('titik-unread-refresh'));
  }
}

/** Runs `callback` when local messages change, in this tab or in another one. */
function onLocalChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_KEY || e.key === null) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCAL_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCAL_EVENT, callback);
  };
}

function appendLocalMessage(conversationId: string, message: Message) {
  const db = readLocal();
  db.messages[conversationId] = [...(db.messages[conversationId] ?? []), message];
  db.conversations = db.conversations.map((c) =>
    c.id === conversationId ? { ...c, updated_at: message.created_at } : c
  );
  writeLocal(db);
}

function newLocalMessageId() {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** True once we know the server cannot store messages, so threads are kept on this device. */
export function isMessagingLocalOnly(): boolean {
  return !isSupabaseConfigured || isConversationsTableAvailable === false || isMessagesTableAvailable === false;
}

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

/** Public profile summary for one user, used to label a brand-new thread. */
export const getProfileSummary = fetchProfile;

export function deduplicate1on1Conversations(list: Conversation[]): Conversation[] {
  const seenPair = new Map<string, Conversation>();
  const result: Conversation[] = [];

  for (const conv of list) {
    if (conv.is_group) {
      result.push(conv);
      continue;
    }

    const ids = (conv.participant_ids || []).filter(Boolean).sort();
    if (ids.length !== 2) {
      result.push(conv);
      continue;
    }

    const key = ids.join(':');
    const existing = seenPair.get(key);
    if (!existing) {
      seenPair.set(key, conv);
      result.push(conv);
    } else {
      existing.unread_count = (existing.unread_count ?? 0) + (conv.unread_count ?? 0);
      if (!existing.report_reference && conv.report_reference) {
        existing.report_reference = conv.report_reference;
        existing.report_id = conv.report_id;
      }
      if (
        conv.last_message &&
        (!existing.last_message ||
          (conv.last_message.created_at || '') > (existing.last_message.created_at || ''))
      ) {
        existing.last_message = conv.last_message;
        existing.updated_at = conv.updated_at;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------
export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!userId) return [];
  const [remote, local] = await Promise.all([getRemoteConversations(userId), getLocalConversations(userId)]);
  const remoteIds = new Set(remote.map((c) => c.id));
  const rawList = [...remote, ...local.filter((c) => !remoteIds.has(c.id))].sort((a, b) =>
    (b.updated_at || '').localeCompare(a.updated_at || '')
  );
  return deduplicate1on1Conversations(rawList);
}

async function getLocalConversations(userId: string): Promise<Conversation[]> {
  const db = readLocal();
  const mine = db.conversations.filter((c) => c.participant_ids.includes(userId));
  return Promise.all(
    mine.map(async (conv) => {
      const thread = db.messages[conv.id] ?? [];
      const otherId = conv.participant_ids.find((id) => id !== userId);
      const other = otherId ? await fetchProfile(otherId).catch(() => undefined) : undefined;
      return {
        ...conv,
        other_participant: other ?? conv.other_participant,
        last_message: thread[thread.length - 1],
        unread_count: thread.filter((m) => m.sender_id !== userId && !m.read_at).length,
        is_group: Boolean(conv.is_group),
        title: conv.title,
        description: conv.description,
        avatar_url: conv.avatar_url,
        created_by: conv.created_by,
        member_count: conv.participant_ids?.length || 1,
      };
    })
  );
}

async function getRemoteConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured || isConversationsTableAvailable === false) return [];

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
          is_group: Boolean(conv.is_group),
          title: conv.title,
          description: conv.description,
          avatar_url: conv.avatar_url,
          created_by: conv.created_by,
          member_count: Array.isArray(conv.participant_ids) ? conv.participant_ids.length : 1,
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
  if (!conversationId) return [];
  const local = () => readLocal().messages[conversationId] ?? [];

  // Device-local threads, or the server cannot store messages
  if (isLocalConversationId(conversationId) || !isSupabaseConfigured || isMessagesTableAvailable === false) {
    return local();
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
      return local();
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
  participantIds?: string[],
  attachments: MessageAttachment[] = []
): Promise<Message> {
  const trimmed = content.trim();

  const sendLocal = (): Message => {
    const localMsg: Message = {
      id: newLocalMessageId(),
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      message_type: messageType,
      attachments: attachments ?? [],
      created_at: new Date().toISOString(),
      read_at: null,
    };
    appendLocalMessage(conversationId, localMsg);
    return localMsg;
  };

  // Device-local threads, or the server cannot store messages: keep it on this device
  if (isLocalConversationId(conversationId) || !isSupabaseConfigured || isMessagesTableAvailable === false) {
    return sendLocal();
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
        attachments: attachments ?? [],
      })
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        isMessagesTableAvailable = false;
        return sendLocal();
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
      attachments: data.attachments ?? attachments ?? [],
      created_at: data.created_at,
      read_at: data.read_at,
    };
  } catch (err: unknown) {
    if (isTableMissingError(err)) {
      isMessagesTableAvailable = false;
      return sendLocal();
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// createConversation — 1-on-1 strictly idempotent: ALWAYS reuses existing thread
// between the exact same 2 participants, preventing any duplicate chat creation.
// ---------------------------------------------------------------------------
export async function createConversation(
  reportId: string | null,
  adminId: string,
  citizenId: string,
  reportReference?: string
): Promise<Conversation> {
  const participantIds = [adminId, citizenId].sort();

  /** Thread kept on this device. Stable canonical id for 1-on-1 pairs so reopening always returns the same thread. */
  const createLocal = (): Conversation => {
    const db = readLocal();
    // Check if any 1-on-1 conversation already exists between these 2 participants
    const existing = db.conversations.find(
      (c) =>
        !c.is_group &&
        Array.isArray(c.participant_ids) &&
        c.participant_ids.length === 2 &&
        c.participant_ids.includes(adminId) &&
        c.participant_ids.includes(citizenId)
    );
    if (existing) {
      if (reportId && !existing.report_id) {
        existing.report_id = reportId;
        existing.report_reference = reportReference || existing.report_reference;
        writeLocal(db);
      }
      return existing;
    }

    const now = new Date().toISOString();
    const id = `conv-local-${participantIds.join('_')}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const conv: Conversation = {
      id,
      report_id: reportId,
      participant_ids: participantIds,
      created_at: now,
      updated_at: now,
      report_reference: reportReference,
      is_group: false,
    };
    db.conversations = [conv, ...db.conversations];
    writeLocal(db);
    return conv;
  };

  if (!isSupabaseConfigured || isConversationsTableAvailable === false) return createLocal();

  // 1. Check for ANY existing 1-on-1 conversation between these two participants
  try {
    const { data: matches, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', participantIds)
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(matches) && matches.length > 0) {
      // Find the direct 1-on-1 match (not a group)
      const existing1on1 = matches.find(
        (c) => !c.is_group && Array.isArray(c.participant_ids) && c.participant_ids.length === 2
      );

      if (existing1on1) {
        // If a new report context is initiated, link it and notify inside the existing thread
        if (reportId && existing1on1.report_id !== reportId) {
          try {
            const { data: rep } = await supabase
              .from('reports')
              .select('public_reference, title')
              .eq('id', reportId)
              .single();
            if (rep) {
              const ref = rep.public_reference || reportReference || reportId;
              const note = `Percakapan ditautkan dengan laporan #${ref}: "${rep.title}".`;
              const cipher = await encryptMessage(note, existing1on1.id, participantIds);
              await supabase.from('messages').insert({
                conversation_id: existing1on1.id,
                sender_id: adminId,
                content: cipher,
                message_type: 'status_update',
                attachments: [],
              });
              await supabase
                .from('conversations')
                .update({ report_id: reportId, updated_at: new Date().toISOString() })
                .eq('id', existing1on1.id);
            }
          } catch {
            // ignore context message failure
          }
        }

        return {
          id: existing1on1.id,
          report_id: existing1on1.report_id ?? reportId ?? null,
          participant_ids: existing1on1.participant_ids,
          created_at: existing1on1.created_at,
          updated_at: existing1on1.updated_at,
          report_reference: reportReference,
          is_group: false,
        };
      }
    }
  } catch {
    // Ignore query error, proceed to insert
  }

  let data = null;
  let error = null;
  try {
    const res = await supabase
      .from('conversations')
      .insert({
        report_id: reportId,
        participant_ids: participantIds,
        is_group: false,
      })
      .select()
      .single();
    data = res.data;
    error = res.error;
  } catch (err) {
    error = err;
  }

  if (error || !data) {
    if (isTableMissingError(error)) isConversationsTableAvailable = false;
    return createLocal();
  }
  isConversationsTableAvailable = true;

  // Send initial system message if tied to a report
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
    report_reference: reportReference,
    is_group: false,
  };
}

// ---------------------------------------------------------------------------
// createGroupConversation — Creates a Group / Community thread (100+ members)
// ---------------------------------------------------------------------------
export async function createGroupConversation(
  title: string,
  creatorId: string,
  memberIds: string[],
  description?: string,
  avatarUrl?: string
): Promise<Conversation> {
  const allParticipantIds = Array.from(new Set([creatorId, ...memberIds])).filter(Boolean);
  const now = new Date().toISOString();

  const createLocalGroup = (): Conversation => {
    const db = readLocal();
    const id = `conv-group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const groupConv: Conversation = {
      id,
      report_id: null,
      participant_ids: allParticipantIds,
      created_at: now,
      updated_at: now,
      is_group: true,
      title,
      description,
      avatar_url: avatarUrl,
      created_by: creatorId,
      member_count: allParticipantIds.length,
    };
    db.conversations = [groupConv, ...db.conversations];
    writeLocal(db);

    const sysMsg: Message = {
      id: newLocalMessageId(),
      conversation_id: id,
      sender_id: creatorId,
      content: `Komunitas "${title}" telah dibuat.`,
      message_type: 'status_update',
      attachments: [],
      created_at: now,
      read_at: null,
    };
    appendLocalMessage(id, sysMsg);

    return groupConv;
  };

  if (!isSupabaseConfigured || isConversationsTableAvailable === false) {
    return createLocalGroup();
  }

  try {
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({
        report_id: null,
        participant_ids: allParticipantIds,
        is_group: true,
        title,
        description,
        avatar_url: avatarUrl,
        created_by: creatorId,
      })
      .select()
      .single();

    if (convError || !convData) {
      return createLocalGroup();
    }

    // Insert members into conversation_members
    try {
      const memberRows = allParticipantIds.map((uid) => ({
        conversation_id: convData.id,
        user_id: uid,
        role: uid === creatorId ? 'owner' : 'member',
        joined_at: now,
      }));
      await supabase.from('conversation_members').insert(memberRows);
    } catch {
      // ignore if conversation_members table migration not applied yet
    }

    // Initial system announcement
    try {
      const initialPlain = `Komunitas "${title}" telah dibuat.`;
      const initialCipher = await encryptMessage(initialPlain, convData.id, allParticipantIds);
      await supabase.from('messages').insert({
        conversation_id: convData.id,
        sender_id: creatorId,
        content: initialCipher,
        message_type: 'status_update',
        attachments: [],
      });
    } catch {
      // ignore
    }

    return {
      id: convData.id,
      report_id: null,
      participant_ids: allParticipantIds,
      created_at: convData.created_at,
      updated_at: convData.updated_at,
      is_group: true,
      title: convData.title,
      description: convData.description,
      avatar_url: convData.avatar_url,
      created_by: convData.created_by,
      member_count: allParticipantIds.length,
    };
  } catch {
    return createLocalGroup();
  }
}

// ---------------------------------------------------------------------------
// getGroupMembers — Fetch members with their profile and role
// ---------------------------------------------------------------------------
export async function getGroupMembers(conversationId: string): Promise<ConversationMember[]> {
  if (isLocalConversationId(conversationId) || !isSupabaseConfigured) {
    const db = readLocal();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return [];
    return Promise.all(
      (conv.participant_ids || []).map(async (uid) => {
        const profile = await fetchProfile(uid);
        return {
          conversation_id: conversationId,
          user_id: uid,
          role: uid === conv.created_by ? ('owner' as const) : ('member' as const),
          joined_at: conv.created_at,
          profile,
        };
      })
    );
  }

  try {
    const { data: members, error } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id, role, joined_at')
      .eq('conversation_id', conversationId);

    if (!error && members && members.length > 0) {
      return Promise.all(
        members.map(async (m) => {
          const profile = await fetchProfile(m.user_id);
          return {
            conversation_id: m.conversation_id,
            user_id: m.user_id,
            role: m.role as 'owner' | 'admin' | 'member',
            joined_at: m.joined_at,
            profile,
          };
        })
      );
    }
  } catch {
    // fallback
  }

  // Fallback to conversation.participant_ids
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_ids, created_by, created_at')
      .eq('id', conversationId)
      .single();
    if (!conv) return [];
    return Promise.all(
      (conv.participant_ids || []).map(async (uid: string) => {
        const profile = await fetchProfile(uid);
        return {
          conversation_id: conversationId,
          user_id: uid,
          role: uid === conv.created_by ? ('owner' as const) : ('member' as const),
          joined_at: conv.created_at,
          profile,
        };
      })
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// addGroupMembers — Add new members to an existing group
// ---------------------------------------------------------------------------
export async function addGroupMembers(
  conversationId: string,
  newMemberIds: string[],
  addedByUserId: string
): Promise<void> {
  if (!newMemberIds.length) return;

  if (isLocalConversationId(conversationId) || !isSupabaseConfigured) {
    const db = readLocal();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const combined = Array.from(new Set([...(conv.participant_ids || []), ...newMemberIds]));
    conv.participant_ids = combined;
    conv.member_count = combined.length;
    writeLocal(db);
    return;
  }

  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    const existingIds = conv?.participant_ids || [];
    const combined = Array.from(new Set([...existingIds, ...newMemberIds]));

    await supabase
      .from('conversations')
      .update({ participant_ids: combined, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const rows = newMemberIds.map((uid) => ({
      conversation_id: conversationId,
      user_id: uid,
      role: 'member',
      joined_at: new Date().toISOString(),
    }));
    await supabase.from('conversation_members').upsert(rows);

    // Announcement
    const note = `Menambahkan ${newMemberIds.length} anggota baru ke dalam grup.`;
    await sendMessage(conversationId, addedByUserId, note, 'status_update', combined);
  } catch {
    // ignore
  }
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
  if (!conversationId) return;
  if (isLocalConversationId(conversationId) || !isSupabaseConfigured || isMessagesTableAvailable === false) {
    const db = readLocal();
    const thread = db.messages[conversationId] ?? [];
    if (!thread.some((m) => m.sender_id !== currentUserId && !m.read_at)) return;
    const now = new Date().toISOString();
    db.messages[conversationId] = thread.map((m) => (m.sender_id !== currentUserId && !m.read_at ? { ...m, read_at: now } : m));
    writeLocal(db);
    return;
  }
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
  participantIds?: string[],
  /** Called when an existing message changes, e.g. the recipient read it. */
  onUpdate?: (update: { id: string; read_at: string | null }) => void
) {
  if (!conversationId) return { unsubscribe: () => {} };

  if (isLocalConversationId(conversationId) || !isSupabaseConfigured || isMessagesTableAvailable === false) {
    // Another tab (or another account in this browser) wrote to the same device store
    const known = new Map((readLocal().messages[conversationId] ?? []).map((m) => [m.id, m.read_at]));
    const stop = onLocalChange(() => {
      (readLocal().messages[conversationId] ?? []).forEach((m) => {
        if (!known.has(m.id)) callback(m);
        else if (known.get(m.id) !== m.read_at) onUpdate?.({ id: m.id, read_at: m.read_at });
        known.set(m.id, m.read_at);
      });
    });
    return { unsubscribe: stop };
  }

  let cachedParticipants = participantIds;

  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        onUpdate?.({ id: row.id as string, read_at: (row.read_at as string | null) ?? null });
      }
    )
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
  const stopLocal = onLocalChange(callback);
  if (!isSupabaseConfigured || isConversationsTableAvailable === false) return { unsubscribe: stopLocal };

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
      stopLocal();
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

/**
 * Delivers an admin's "please complete your report" note to the reporter as an info_request message,
 * opening the direct thread first when it does not exist yet. Returns the thread it landed in.
 */
export async function sendInfoRequest(
  report: { id: string; publicReference: string; reporterUserId?: string },
  adminId: string,
  note: string
): Promise<Conversation> {
  if (!report.reporterUserId) throw new Error('Laporan ini tidak punya pelapor yang bisa dikirimi pesan.');
  const text = note.trim();
  if (!text) throw new Error('Isi permintaan tidak boleh kosong.');
  const conv = await createConversation(report.id, adminId, report.reporterUserId, report.publicReference);
  const body = formatAdminReportMessage(report.id, report.publicReference, 'request_info', text).body;
  await sendMessage(conv.id, adminId, body, 'info_request', conv.participant_ids);
  return conv;
}

export function formatUnreadBadge(count: number): string {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
}


// ---------------------------------------------------------------------------
// Unread count across all of the user's conversations (drives the nav badge)
// ---------------------------------------------------------------------------
export async function getUnreadMessageCount(userId: string): Promise<number> {
  if (!userId) return 0;
  const db = readLocal();
  const localUnread = db.conversations
    .filter((c) => c.participant_ids.includes(userId))
    .reduce((sum, c) => sum + (db.messages[c.id] ?? []).filter((m) => m.sender_id !== userId && !m.read_at).length, 0);
  return localUnread + (await getRemoteUnreadCount(userId));
}

async function getRemoteUnreadCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured || isMessagesTableAvailable === false) return 0;
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .is('read_at', null);
    if (error) {
      if (isTableMissingError(error)) isMessagesTableAvailable = false;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Fires whenever any visible message is inserted or changes (new mail, read receipts). */
export function subscribeToUnreadChanges(userId: string, callback: () => void) {
  if (!userId) return { unsubscribe: () => {} };
  const stopLocal = onLocalChange(callback);
  if (!isSupabaseConfigured || isMessagesTableAvailable === false) return { unsubscribe: stopLocal };
  const channel = supabase
    .channel(`unread-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, callback)
    .subscribe();
  return {
    unsubscribe: () => {
      stopLocal();
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// People search for starting a new conversation
// ---------------------------------------------------------------------------
export async function searchProfiles(query: string, excludeUserId?: string): Promise<UserProfile[]> {
  const q = query.trim().replace(/[%,()]/g, '');
  if (!isSupabaseConfigured || q.length < 2) return [];
  try {
    let request = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8);
    if (excludeUserId) request = request.neq('id', excludeUserId);
    const { data, error } = await request;
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      username: row.username ?? '',
      displayName: row.display_name ?? row.username ?? '',
      avatarUrl: row.avatar_url ?? '',
      role: row.role ?? 'citizen',
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Typing indicator: ephemeral broadcast, nothing is stored
// ---------------------------------------------------------------------------
export function createTypingChannel(
  conversationId: string,
  currentUserId: string,
  onOtherTyping: () => void
) {
  if (!isSupabaseConfigured || !conversationId || conversationId.startsWith('conv-')) {
    return { sendTyping: () => {}, unsubscribe: () => {} };
  }
  const channel = supabase
    .channel(`typing-${conversationId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      if (payload?.payload?.userId && payload.payload.userId !== currentUserId) onOtherTyping();
    })
    .subscribe();

  return {
    sendTyping: () => {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserId } });
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
