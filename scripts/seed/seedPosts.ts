import { getSeedClient } from './seedClient';
import { MOCK_POSTS_KN } from '../../src/data/mockCivicData';

export async function seedPosts(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data postingan feed (is_demo = true)...');

  const postRows = MOCK_POSTS_KN.map((p) => ({
    id: p.id,
    author_id: p.author.id,
    author_username: p.author.username,
    author_display_name: p.author.displayName,
    author_avatar_url: p.author.avatarUrl,
    author_role: p.author.role,
    body: p.body,
    post_type: p.postType,
    media: p.media,
    location_tag: p.locationTag,
    related_report_id: p.relatedReportId || null,
    support_count: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    saves_count: 0,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    is_demo: true,
  }));

  const { error } = await client.from('posts').upsert(postRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed posts:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${postRows.length} postingan feed demo.`);
  return postRows.length;
}
