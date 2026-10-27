import { getSeedClient } from './seedClient';
import { MOCK_COMMENTS } from '../../src/data/mockCivicData';
import { FeedComment } from '../../src/services/adapters/types';

export async function seedComments(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data komentar warga (is_demo = true)...');

  const commentRows: Array<{
    id: string;
    post_id: string;
    author_id: string;
    author_name: string;
    avatar_url: string;
    body: string;
    parent_id: string | null;
    likes: number;
    created_at: string;
    is_demo: boolean;
  }> = [];

  let count = 0;
  const now = Date.now();

  for (const [postId, comments] of Object.entries(MOCK_COMMENTS) as [string, FeedComment[]][]) {
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const timeOffsetMs = (comments.length - i) * 3600000;
      commentRows.push({
        id: c.id,
        post_id: postId,
        author_id: `usr-anon-${c.id}`,
        author_name: c.authorName,
        avatar_url: c.avatarUrl,
        body: c.body,
        parent_id: c.parentId || null,
        likes: c.likes || 0,
        created_at: new Date(now - timeOffsetMs).toISOString(),
        is_demo: true,
      });
      count++;
    }
  }

  // Insert in chunks of 50 to avoid request size limits
  const chunkSize = 50;
  for (let i = 0; i < commentRows.length; i += chunkSize) {
    const chunk = commentRows.slice(i, i + chunkSize);
    const { error } = await client.from('comments').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.warn(`Peringatan: Gagal upsert chunk komentar (${i}):`, error.message);
    }
  }

  console.log(`✅ Berhasil seed ${count} komentar warga demo.`);
  return count;
}
