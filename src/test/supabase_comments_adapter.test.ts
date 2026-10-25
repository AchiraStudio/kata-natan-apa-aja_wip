import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseDataAdapter } from '../services/adapters/supabaseAdapter';

describe('SupabaseDataAdapter Comments Integration', () => {
  let adapter: SupabaseDataAdapter;

  beforeEach(() => {
    adapter = new SupabaseDataAdapter();
  });

  it('retrieves comments from fallback mock when client is offline or empty', async () => {
    const comments = await adapter.getComments('kn-001');
    expect(comments).toBeDefined();
    expect(comments.length).toBeGreaterThan(0);

    const first = comments[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('authorName');
    expect(first).toHaveProperty('body');
    expect(first).toHaveProperty('timeAgo');
    expect(first).toHaveProperty('likes');
  });

  it('preserves threaded replies with valid parentId', async () => {
    const comments = await adapter.getComments('kn-001');
    const replies = comments.filter((c) => Boolean(c.parentId));
    expect(replies.length).toBeGreaterThan(0);

    replies.forEach((r) => {
      expect(r.parentId).toBeDefined();
      const parent = comments.find((c) => c.id === r.parentId);
      expect(parent, `Parent comment ${r.parentId} must exist`).toBeDefined();
    });
  });

  it('adds a new comment and returns properly formatted FeedComment', async () => {
    const newComment = await adapter.addComment(
      'kn-001',
      'Warga Pengetes',
      'https://example.com/avatar.jpg',
      'Test tanggapan warga di Supabase adapter'
    );

    expect(newComment).toBeDefined();
    expect(newComment.id).toMatch(/^c-/);
    expect(newComment.authorName).toBe('Warga Pengetes');
    expect(newComment.body).toBe('Test tanggapan warga di Supabase adapter');
    expect(newComment.timeAgo).toBe('Baru saja');
    expect(newComment.likes).toBe(0);

    // Verify it is present in subsequent queries
    const comments = await adapter.getComments('kn-001');
    const found = comments.find((c) => c.id === newComment.id);
    expect(found).toBeDefined();
  });

  it('adds a threaded reply with parentId successfully', async () => {
    const parent = (await adapter.getComments('kn-001'))[0];
    const reply = await adapter.addComment(
      'kn-001',
      'Warga Pembalas',
      'https://example.com/avatar2.jpg',
      'Setuju sekali pak!',
      parent.id
    );

    expect(reply.parentId).toBe(parent.id);
    expect(reply.authorName).toBe('Warga Pembalas');
  });
});
