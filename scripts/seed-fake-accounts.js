/**
 * TITIK. — Mass Fake Account Seeder Script
 * Usage:
 *   node scripts/seed-fake-accounts.js [count]
 * Example:
 *   node scripts/seed-fake-accounts.js 500
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually for standalone CLI run
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        env[key] = val;
      }
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const countArg = parseInt(process.argv[2], 10) || 100;

console.log(`\n🌱 [TITIK.] Menyiapkan generator untuk ${countArg} akun warga Kota Bogor...`);

const FIRST_NAMES = [
  'Rizky', 'Sari', 'Budi', 'Dewi', 'Dika', 'Nurul', 'Bambang', 'Wulandari',
  'Ahmad', 'Putri', 'Hendro', 'Siti', 'Agus', 'Rina', 'Bayu', 'Maya',
  'Fajar', 'Dian', 'Dimas', 'Ayu', 'Ilham', 'Nadia', 'Reza', 'Fitri',
];

const LAST_NAMES = [
  'Aprianto', 'Wulandari', 'Setiawan', 'Surya', 'Santoso', 'Pratama',
  'Hidayah', 'Kurniawan', 'Pramono', 'Wijaya', 'Saputra', 'Kusuma',
  'Nugroho', 'Siregar', 'Lubis', 'Pangestu', 'Gunawan', 'Mahendra',
];

const DISTRICTS = [
  'Bogor Tengah',
  'Bogor Utara',
  'Bogor Selatan',
  'Bogor Timur',
  'Bogor Barat',
  'Tanah Sareal',
];

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const generated = [];
for (let i = 1; i <= countArg; i++) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
  const district = DISTRICTS[(i * 2) % DISTRICTS.length];
  const username = `${first.toLowerCase()}.${last.toLowerCase()}${i > 50 ? i : ''}`;
  const email = `${username}@warga.bogor.go.id`;

  let role = 'citizen';
  if (i % 50 === 0) role = 'admin';
  else if (i % 25 === 0) role = 'moderator';

  generated.push({
    id: `usr-gen-${String(i).padStart(6, '0')}`,
    username,
    display_name: `${first} ${last}`,
    email,
    avatar_url: AVATARS[i % AVATARS.length],
    role,
    district,
    is_verified: i % 3 !== 0,
    bio: `Warga aktif kecamatan ${district} Kota Bogor.`,
    created_at: new Date().toISOString(),
  });
}

console.log(`✅ ${generated.length} akun warga berhasil dibuat di memori.`);

// Save to JSON export
const outputPath = path.resolve(process.cwd(), 'seeded-accounts.json');
fs.writeFileSync(outputPath, JSON.stringify(generated, null, 2), 'utf8');
console.log(`📁 File cadangan tersimpan di: ${outputPath}`);

if (supabaseUrl && supabaseKey) {
  console.log(`📡 Menghubungkan ke Supabase: ${supabaseUrl}...`);
  const client = createClient(supabaseUrl, supabaseKey);

  async function pushToSupabase() {
    try {
      const batchSize = 100;
      let inserted = 0;
      for (let i = 0; i < generated.length; i += batchSize) {
        const batch = generated.slice(i, i + batchSize);
        const { error } = await client.from('profiles').upsert(batch, { onConflict: 'id' });
        if (error) {
          console.warn(`⚠️ Catatan Supabase (tabel 'profiles'): ${error.message}`);
          console.log(`💡 Akun tetap valid dan dapat digunakan langsung melalui UI Generator.`);
          break;
        }
        inserted += batch.length;
        process.stdout.write(`\r   Mengirim batch: ${inserted}/${generated.length} akun...`);
      }
      console.log(`\n🎉 Proses selesai!`);
    } catch (err) {
      console.warn('⚠️ Gagal terhubung ke Supabase:', err.message);
    }
  }

  pushToSupabase();
} else {
  console.log('ℹ️ Supabase credentials tidak ditemukan di .env, akun hanya tersimpan di JSON lokal.');
}

