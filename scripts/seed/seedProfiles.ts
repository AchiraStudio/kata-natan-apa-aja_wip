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

  // Also include PUPR official admin profile aligned with migration ID
  uniqueProfilesMap.set('a0000000-0000-0000-0000-000000000001', {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'admin.pupr',
    display_name: 'Administrator Dinas PUPR',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Akun resmi verifikasi dan tindak lanjut laporan infrastruktur dinas PUPR Kota Bogor.',
    district: 'Bogor Tengah',
    role: 'admin',
    is_verified: true,
    is_demo: false,
  });

  // Regular citizen auth demo profile (warga@titik.id)
  uniqueProfilesMap.set('c0000000-0000-0000-0000-000000000001', {
    id: 'c0000000-0000-0000-0000-000000000001',
    username: 'budi.santoso',
    display_name: 'Budi Santoso',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Warga Bogor Selatan pemerhati fasilitas jalan, drainase, dan keterbukaan APBD.',
    district: 'Bogor Selatan',
    role: 'citizen',
    is_verified: true,
    is_demo: false,
  });

  // Additional active citizen & commenter profiles
  const additionalCitizens = [
    {
      id: 'usr-kn-011',
      username: 'sahabatbogor',
      display_name: 'Rizky Pratama',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      bio: 'Komunitas peduli fasilitas publik & taman Kota Bogor.',
      district: 'Bogor Tengah',
    },
    {
      id: 'usr-kn-012',
      username: 'sariwulan',
      display_name: 'Sari Wulandari',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      bio: 'Pemerhati keselamatan pejalan kaki dan jembatan kota.',
      district: 'Bogor Timur',
    },
    {
      id: 'usr-kn-013',
      username: 'dikasetia',
      display_name: 'Dika Setiawan',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      bio: 'Teknisi kelistrikan & pemerhati penerangan jalan umum.',
      district: 'Bogor Selatan',
    },
    {
      id: 'usr-kn-014',
      username: 'infobogor',
      display_name: 'Portal Info Warga Bogor',
      avatar_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
      bio: 'Kanal independen pemantauan infrastruktur dan agenda kota.',
      district: 'Bogor Tengah',
    },
    {
      id: 'usr-kn-015',
      username: 'rizkyaprianto',
      display_name: 'Rizky Aprianto',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'Warga Bogor Tengah pemerhati drainase perumahan.',
      district: 'Bogor Tengah',
    },
    {
      id: 'usr-kn-016',
      username: 'ahmadfauzi',
      display_name: 'Ahmad Fauzi',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Warga Pasar Anyar pemerhati kebersihan lingkungan.',
      district: 'Bogor Tengah',
    },
    {
      id: 'usr-kn-017',
      username: 'nurulhidayah',
      display_name: 'Nurul Hidayah',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Pedagang pasar & warga aktif Kota Bogor.',
      district: 'Bogor Tengah',
    },
    {
      id: 'usr-kn-018',
      username: 'hendrokurnia',
      display_name: 'Hendro Kurnia',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      bio: 'Penglaju harian motor rute Bogor - Jakarta.',
      district: 'Bogor Utara',
    },
    {
      id: 'usr-kn-019',
      username: 'aguspramono',
      display_name: 'Agus Pramono',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Pengawas konstruksi independen & warga Bogor Barat.',
      district: 'Bogor Barat',
    },
  ];

  for (const c of additionalCitizens) {
    if (!uniqueProfilesMap.has(c.id)) {
      uniqueProfilesMap.set(c.id, {
        id: c.id,
        username: c.username,
        display_name: c.display_name,
        avatar_url: c.avatar_url,
        bio: c.bio,
        district: c.district,
        role: 'citizen',
        is_verified: true,
        is_demo: true,
      });
    }
  }

  const profileRows = Array.from(uniqueProfilesMap.values());

  const { error } = await client.from('profiles').upsert(profileRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed profiles:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${profileRows.length} akun profil demo.`);
  return profileRows.length;
}
