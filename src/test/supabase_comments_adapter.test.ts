import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseDataAdapter } from '../services/adapters/supabaseAdapter';

describe('SupabaseDataAdapter Comments Integration', () => {
  let adapter: SupabaseDataAdapter;

  beforeEach(() => {
    adapter = new SupabaseDataAdapter();
  });

  it('retrieves an empty array when a post has no comments', async () => {
    const emptyPostId = `test-empty-${Date.now()}`;
    const comments = await adapter.getComments(emptyPostId);
    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBe(0);
  });

  it('preserves threaded replies with valid parentId', async () => {
    const testPostId = `test-thread-${Date.now()}`;
    const parent = await adapter.addComment(
      testPostId,
      'Warga Pengetes',
      'https://example.com/avatar.jpg',
      'Induk komentar'
    );
    const reply = await adapter.addComment(
      testPostId,
      'Warga Pembalas',
      'https://example.com/avatar2.jpg',
      'Balasan komentar',
      parent.id
    );

    const comments = await adapter.getComments(testPostId);
    expect(comments.length).toBe(2);

    const foundReply = comments.find((c) => c.id === reply.id);
    expect(foundReply).toBeDefined();
    expect(foundReply?.parentId).toBe(parent.id);
  });

  it('adds a new comment and returns properly formatted FeedComment', async () => {
    const testPostId = `test-add-${Date.now()}`;
    const newComment = await adapter.addComment(
      testPostId,
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
    const comments = await adapter.getComments(testPostId);
    const found = comments.find((c) => c.id === newComment.id);
    expect(found).toBeDefined();
  });

  it('adds a threaded reply with parentId successfully', async () => {
    const testPostId = `test-reply-${Date.now()}`;
    const parent = await adapter.addComment(
      testPostId,
      'Warga Utama',
      'https://example.com/avatar.jpg',
      'Laporan awal'
    );
    const reply = await adapter.addComment(
      testPostId,
      'Warga Pembalas',
      'https://example.com/avatar2.jpg',
      'Setuju sekali pak!',
      parent.id
    );

    expect(reply.parentId).toBe(parent.id);
    expect(reply.authorName).toBe('Warga Pembalas');
  });
});
