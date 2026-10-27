import { getSeedClient } from './seedClient';
import { MOCK_POSTS_KN } from '../../src/data/mockCivicData';

export async function seedPosts(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data postingan feed (is_demo = true)...');

  const postRows = MOCK_POSTS_KN.map((p, idx) => ({
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
    support_count: p.supportCount || Math.floor(Math.random() * 850) + 120,
    likes_count: p.likesCount || Math.floor(Math.random() * 3200) + 450,
    comments_count: p.commentsCount || Math.floor(Math.random() * 240) + 30,
    shares_count: p.sharesCount || Math.floor(Math.random() * 110) + 15,
    saves_count: p.savesCount || Math.floor(Math.random() * 70) + 8,
    created_at: new Date(Date.now() - (idx + 1) * 3600000 * 5).toISOString(),
    is_demo: true,
  }));

  // Add Budi Santoso's citizen post
  postRows.push({
    id: 'kn-budi-001',
    author_id: 'c0000000-0000-0000-0000-000000000001',
    author_username: 'budi.santoso',
    author_display_name: 'Budi Santoso',
    author_avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    author_role: 'citizen',
    body: 'Trotoar di Jalan Suryakencana dekat persimpangan Gang Aut pavingnya banyak yang copot dan berlubang. Bahaya untuk lansia yang jalan pagi.',
    post_type: 'citizen_report',
    media: [{ id: 'med-budi-001', type: 'image', url: '/images/feed/k002.png', aspectRatio: '4/5' }],
    location_tag: 'Jl. Suryakencana, Bogor Selatan',
    related_report_id: 'rep-budi-001',
    support_count: 684,
    likes_count: 1420,
    comments_count: 86,
    shares_count: 42,
    saves_count: 31,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    is_demo: true,
  });

  // Add Official PUPR Admin Update
  postRows.push({
    id: 'kn-admin-001',
    author_id: 'a0000000-0000-0000-0000-000000000001',
    author_username: 'admin.pupr',
    author_display_name: 'Administrator Dinas PUPR',
    author_avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    author_role: 'admin',
    body: 'Rekapitulasi Penanganan Aduan Infrastruktur Pekan III Oktober 2026: 42 titik jalan berlubang telah selesai ditambal cepat oleh Tim Reaksi Cepat PUPR Bogor. Terima kasih warga yang aktif melaporkan lewat portal TITIK.',
    post_type: 'official_update',
    media: [{ id: 'med-admin-001', type: 'image', url: '/images/feed/k004.png', aspectRatio: '4/5' }],
    location_tag: 'Kota Bogor',
    related_report_id: null,
    support_count: 890,
    likes_count: 3410,
    comments_count: 145,
    shares_count: 230,
    saves_count: 88,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    is_demo: false,
  });

  const { error } = await client.from('posts').upsert(postRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed posts:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${postRows.length} postingan feed demo.`);
  return postRows.length;
}
