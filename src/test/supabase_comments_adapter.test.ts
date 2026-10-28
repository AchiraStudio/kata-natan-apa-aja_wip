import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseDataAdapter } from '../services/adapters/supabaseAdapter';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { DataError } from '../services/errors/DataError';

describe('SupabaseDataAdapter Comments Integration', () => {
  let adapter: SupabaseDataAdapter;
  const createdCommentIds: string[] = [];
  const mockTableComments: any[] = [];
  let fromSpy: any = null;

  beforeEach(() => {
    adapter = new SupabaseDataAdapter();
    if (!isSupabaseConfigured) {
      fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'comments') {
          return {
            insert: (payload: any) => ({
              select: () => ({
                single: async () => {
                  if (payload.post_id?.startsWith('nonexistent-')) {
                    return {
                      data: null,
                      error: {
                        code: '23503',
                        message: `Key (post_id)=(${payload.post_id}) is not present in table "posts".`,
                      },
                    };
                  }
                  mockTableComments.push(payload);
                  return { data: payload, error: null };
                },
              }),
            }),
            select: (_cols?: string) => ({
              eq: (_col: string, val: string) => ({
                order: (_orderCol: string, _opts: any) => {
                  const filtered = mockTableComments.filter((c) => c.post_id === val);
                  return Promise.resolve({ data: filtered, error: null });
                },
              }),
            }),
            delete: () => ({
              in: (_col: string, ids: string[]) => {
                const idSet = new Set(ids);
                const remaining = mockTableComments.filter((c) => !idSet.has(c.id));
                mockTableComments.length = 0;
                mockTableComments.push(...remaining);
                return Promise.resolve({ data: null, error: null });
              },
            }),
          } as any;
        }
        return (supabase as any).from(table);
      });
    }
  });

  afterEach(async () => {
    if (fromSpy) {
      fromSpy.mockRestore();
      fromSpy = null;
    }
    if (createdCommentIds.length > 0 && isSupabaseConfigured) {
      await supabase.from('comments').delete().in('id', [...createdCommentIds]);
    }
    createdCommentIds.length = 0;
    mockTableComments.length = 0;
  });

  it('retrieves an empty array when a post has no comments', async () => {
    const emptyPostId = `test-empty-${Date.now()}`;
    const comments = await adapter.getComments(emptyPostId);
    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBe(0);
  });

  it('throws typed DataError when inserting a comment on a nonexistent post', async () => {
    const nonexistentPostId = `nonexistent-post-${Date.now()}`;
    await expect(
      adapter.addComment(
        nonexistentPostId,
        'Warga Pengetes',
        'https://example.com/avatar.jpg',
        'Komentar ini harus gagal'
      )
    ).rejects.toThrow(DataError);
  });

  it('adds a new comment on a valid post and returns properly formatted FeedComment', async () => {
    const validPostId = 'kn-001';
    const newComment = await adapter.addComment(
      validPostId,
      'Warga Pengetes',
      'https://example.com/avatar.jpg',
      'Test tanggapan warga di Supabase adapter'
    );
    createdCommentIds.push(newComment.id);

    expect(newComment).toBeDefined();
    expect(newComment.id).toMatch(/^c-/);
    expect(newComment.authorName).toBe('Warga Pengetes');
    expect(newComment.body).toBe('Test tanggapan warga di Supabase adapter');
    expect(newComment.timeAgo).toBe('Baru saja');
    expect(newComment.likes).toBe(0);

    // Verify it is present in subsequent queries
    const comments = await adapter.getComments(validPostId);
    const found = comments.find((c) => c.id === newComment.id);
    expect(found).toBeDefined();
    expect(found?.body).toBe('Test tanggapan warga di Supabase adapter');
  });

  it('preserves threaded replies with valid parentId', async () => {
    const validPostId = 'kn-001';
    const parent = await adapter.addComment(
      validPostId,
      'Warga Pengetes',
      'https://example.com/avatar.jpg',
      'Induk komentar'
    );
    createdCommentIds.push(parent.id);

    const reply = await adapter.addComment(
      validPostId,
      'Warga Pembalas',
      'https://example.com/avatar2.jpg',
      'Balasan komentar',
      parent.id
    );
    createdCommentIds.push(reply.id);

    const comments = await adapter.getComments(validPostId);
    const foundParent = comments.find((c) => c.id === parent.id);
    const foundReply = comments.find((c) => c.id === reply.id);

    expect(foundParent).toBeDefined();
    expect(foundReply).toBeDefined();
    expect(foundReply?.parentId).toBe(parent.id);
  });
});
