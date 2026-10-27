import { getSeedClient } from './seedClient';
import { MOCK_POSTS_KN } from '../../src/data/mockCivicData';

export async function seedProfiles(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan profil akun demo (is_demo = true)...');

  const uniqueProfilesMap = new Map<string, {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
    district: string;
    role: string;
    is_verified: boolean;
    is_demo: boolean;
  }>();

  // Add demo accounts from MOCK_POSTS_KN
  for (const post of MOCK_POSTS_KN) {
    if (!uniqueProfilesMap.has(post.author.id)) {
      uniqueProfilesMap.set(post.author.id, {
        id: post.author.id,
        username: post.author.username.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        display_name: post.author.displayName,
        avatar_url: post.author.avatarUrl,
        bio: post.author.bio || 'Warga aktif pemerhati fasilitas dan tata kelola publik.',
        district: post.locationTag.includes('Bekasi')
          ? 'Bekasi Barat'
          : post.locationTag.includes('Depok')
          ? 'Pancoran Mas'
          : post.locationTag.includes('Bogor')
          ? 'Bogor Tengah'
          : 'Kota Bogor',
        role: post.author.role || 'citizen',
        is_verified: true,
        is_demo: true,
      });
    }
  }

  // Also include PUPR official admin profile
  uniqueProfilesMap.set('usr-pupr-admin', {
    id: 'usr-pupr-admin',
    username: 'admin.pupr',
    display_name: 'Verifikator Dinas PUPR',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Akun resmi verifikasi dan tindak lanjut laporan infrastruktur dinas PUPR.',
    district: 'Bogor Tengah',
    role: 'admin',
    is_verified: true,
    is_demo: true,
  });

  const profileRows = Array.from(uniqueProfilesMap.values());

  const { error } = await client.from('profiles').upsert(profileRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed profiles:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${profileRows.length} akun profil demo.`);
  return profileRows.length;
}
