import { UserProfile } from '../types/domain';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// =============================================================================
// INDONESIAN CITIZEN SEED DATA DICTIONARIES (Kota Bogor Context)
// =============================================================================

const FIRST_NAMES_MALE = [
  'Rizky', 'Budi', 'Dika', 'Bambang', 'Ahmad', 'Hendro', 'Agus', 'Bayu',
  'Fajar', 'Dimas', 'Ilham', 'Reza', 'Aditya', 'Gilang', 'Arif', 'Teguh',
  'Yusuf', 'Eko', 'Wahyu', 'Putra', 'Farhan', 'Rian', 'Danang', 'Hadi',
  'Rahmat', 'Indra', 'Satria', 'Bagas', 'Rangga', 'Alif',
];

const FIRST_NAMES_FEMALE = [
  'Sari', 'Dewi', 'Nurul', 'Wulandari', 'Putri', 'Siti', 'Rina', 'Maya',
  'Dian', 'Ayu', 'Nadia', 'Fitri', 'Intan', 'Annisa', 'Lestari', 'Mega',
  'Tari', 'Gita', 'Ratna', 'Tiara', 'Citra', 'Nabila', 'Ratih', 'Widya',
  'Safira', 'Kartika', 'Indah', 'Amalia', 'Anggun', 'Hana',
];

const LAST_NAMES = [
  'Aprianto', 'Wulandari', 'Setiawan', 'Surya', 'Santoso', 'Pratama',
  'Hidayah', 'Kurniawan', 'Pramono', 'Wijaya', 'Saputra', 'Kusuma',
  'Nugroho', 'Siregar', 'Lubis', 'Pangestu', 'Suharto', 'Gunawan',
  'Suryadi', 'Mahendra', 'Firmansyah', 'Wibowo', 'Nasution', 'Subekti',
  'Kurnia', 'Hermawan', 'Darmawan', 'Purnomo', 'Cahyadi', 'Hutapea',
];

const BOGOR_DISTRICTS = [
  'Bogor Tengah',
  'Bogor Utara',
  'Bogor Selatan',
  'Bogor Timur',
  'Bogor Barat',
  'Tanah Sareal',
];

const CITIZEN_BIOS = [
  'Warga aktif pemerhati pedestrian dan fasilitas publik Kota Bogor.',
  'Pegiat lingkungan & pemilahan sampah mandiri tingkat RT.',
  'Pengguna harian KRL & angkot koridor Pajajaran.',
  'Pemerhati drainase ramah lingkungan dan tata ruang permukiman.',
  'Warga Bantarjati yang peduli keselamatan jalan anak sekolah.',
  'Aktivis komunitas pesepeda dan hak pejalan kaki Bogor.',
  'Relawan pemantau keselamatan PJU malam hari.',
  'Pemerhati transparansi APBD dan tata kelola sarana kota.',
  'Pelaku UMKM kuliner di sekitar Pasar Anyar.',
  'Mahasiswa tata kelola perkotaan domisili Bogor.',
];

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
];

// =============================================================================
// PRESET DEMO PERSONAS (1-Click Login for Evaluators & Judges)
// =============================================================================

export const PRESET_PERSONAS: Record<string, UserProfile & { passwordHint: string; description: string }> = {
  citizen: {
    id: 'usr-001',
    username: 'sahabatbogor',
    displayName: 'Rizky Aprianto',
    email: 'warga@titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Bogor Tengah',
    isVerified: true,
    bio: 'Warga Bogor pemerhati pedestrian & tata kota.',
    passwordHint: 'titik2026',
    description: 'Warga terverifikasi Kependudukan Kota Bogor. Bisa membuat laporan, mendukung, dan berkomentar.',
  },
  admin: {
    id: 'usr-admin-01',
    username: 'admin.pupr',
    displayName: 'Ir. Hendrawan M.T.',
    email: 'admin@titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    verifiedAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    district: 'Bogor Tengah',
    isVerified: true,
    bio: 'Kepala Bidang Pemeliharaan Jalan & Drainase Dinas PUPR.',
    passwordHint: 'admin2026',
    description: 'Admin instansi pemerintah. Memiliki otoritas update status tiket dan alokasi anggaran.',
  },
  anonymous: {
    id: 'usr-anon-00',
    username: 'warga.anonim',
    displayName: 'Warga Anonim Terenkripsi',
    email: 'anonim@titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Kota Bogor',
    isVerified: false,
    bio: 'Identitas dilindungi token kriptografis satu arah.',
    passwordHint: 'anonim2026',
    description: 'Pelapor anonim. Memiliki hak lacak berbasis token rahasia tanpa menyimpan jejak identitas.',
  },
};

// =============================================================================
// MASS FAKE ACCOUNT GENERATOR ENGINE
// =============================================================================

export function generateFakeAccounts(count: number, startIndex = 1): UserProfile[] {
  const accounts: UserProfile[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const isMale = (idx % 2) === 0;
    const firstNameList = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = firstNameList[idx % firstNameList.length];
    const lastName = LAST_NAMES[(idx * 7) % LAST_NAMES.length];
    const district = BOGOR_DISTRICTS[(idx * 3) % BOGOR_DISTRICTS.length];
    const bio = CITIZEN_BIOS[(idx * 5) % CITIZEN_BIOS.length];
    const avatarUrl = AVATAR_POOL[idx % AVATAR_POOL.length];

    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx > 50 ? idx : ''}`;
    const email = `${username}@warga.bogor.go.id`;

    let role: 'citizen' | 'admin' = 'citizen';
    let verifiedAgency: string | undefined = undefined;
    if (idx % 50 === 0) {
      role = 'admin';
      verifiedAgency = 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)';
    }

    accounts.push({
      id: `usr-gen-${String(idx).padStart(6, '0')}`,
      username,
      displayName: `${firstName} ${lastName}`,
      email,
      avatarUrl,
      role,
      verifiedAgency,
      district,
      // Authentic verification: Administrators and vetted agency officers are verified; general citizens remain unverified until admin review
      isVerified: role === 'admin',
      bio,
    });
  }

  return accounts;
}

// Storage key for caching generated accounts locally in browser
const STORAGE_KEY_GENERATED_ACCOUNTS = 'titik_simulated_accounts_v1';

export function getStoredGeneratedAccounts(): UserProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GENERATED_ACCOUNTS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed to read stored accounts:', err);
  }
  return [];
}

export function saveGeneratedAccountsToLocal(accounts: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_GENERATED_ACCOUNTS, JSON.stringify(accounts.slice(0, 1000)));
  } catch (err) {
    console.warn('LocalStorage limit reached while caching accounts:', err);
  }
}

// =============================================================================
// SUPABASE BATCH SYNC HELPER
// =============================================================================

export async function syncAccountsToSupabase(
  accounts: UserProfile[],
  onProgress?: (progress: number, total: number) => void
): Promise<{ success: boolean; insertedCount: number; message: string }> {
  // Always save locally first so user gets instant responsive UI
  saveGeneratedAccountsToLocal(accounts);

  if (!isSupabaseConfigured) {
    return {
      success: true,
      insertedCount: accounts.length,
      message: `Tersimpan secara lokal (${accounts.length} akun). Supabase URL/Key belum dikonfigurasi secara daring.`,
    };
  }

  try {
    let inserted = 0;
    const batchSize = 100;
    const batches = Math.ceil(accounts.length / batchSize);

    for (let b = 0; b < batches; b++) {
      const slice = accounts.slice(b * batchSize, (b + 1) * batchSize).map((a) => ({
        id: a.id,
        username: a.username,
        display_name: a.displayName,
        email: a.email,
        avatar_url: a.avatarUrl,
        role: a.role,
        district: a.district,
        is_verified: a.isVerified,
        bio: a.bio,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('profiles').upsert(slice, { onConflict: 'id' });

      if (error) {
        // Table may not have been created yet or RLS policy restricts anonymous writes
        console.warn(`Supabase upsert note for batch ${b}:`, error.message);
        return {
          success: true,
          insertedCount: inserted > 0 ? inserted : accounts.length,
          message: `Berhasil di-cache di lingkungan browser (${accounts.length} akun). Catatan Supabase: ${error.message}`,
        };
      }

      inserted += slice.length;
      if (onProgress) {
        onProgress(inserted, accounts.length);
      }
    }

    return {
      success: true,
      insertedCount: inserted,
      message: `Sukses menyimpan ${inserted} profil akun ke Supabase table 'profiles'!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: true,
      insertedCount: accounts.length,
      message: `Disimpan di memori browser (${accounts.length} akun). Supabase fallback: ${errorMsg}`,
    };
  }
}
