import process from 'node:process';
import { getSeedClient } from './seedClient';
import { seedProfiles } from './seedProfiles';
import { seedFacilities } from './seedFacilities';
import { seedReports } from './seedReports';
import { seedPosts } from './seedPosts';
import { seedComments } from './seedComments';

async function resetDemoData() {
  const client = getSeedClient();
  console.log('🧹 [RESET DEMO] Menghapus data demo lama (is_demo = true)...');

  // Delete in reverse order of foreign key dependencies
  try {
    const { error: comErr } = await client.from('comments').delete().eq('is_demo', true);
    if (comErr) console.warn('Peringatan saat menghapus komentar demo:', comErr.message);

    const { error: postErr } = await client.from('posts').delete().eq('is_demo', true);
    if (postErr) console.warn('Peringatan saat menghapus postingan demo:', postErr.message);

    const { error: repErr } = await client.from('reports').delete().eq('is_demo', true);
    if (repErr) console.warn('Peringatan saat menghapus laporan demo:', repErr.message);

    const { error: facErr } = await client.from('facilities').delete().eq('is_demo', true);
    if (facErr) console.warn('Peringatan saat menghapus fasilitas demo:', facErr.message);

    const { error: profErr } = await client.from('profiles').delete().eq('is_demo', true);
    if (profErr) console.warn('Peringatan saat menghapus profil demo:', profErr.message);

    console.log('✅ Pembersihan data demo selesai.');
  } catch (err: unknown) {
    console.warn('Terjadi kesalahan saat pembersihan demo:', err);
  }
}

async function runMasterSeed() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset-demo') || args.includes('-r');

  console.log('====================================================');
  console.log('🌱 TITIK. Deterministic Supabase Seeding Pipeline');
  console.log('====================================================');

  const startTime = Date.now();

  if (shouldReset) {
    await resetDemoData();
  }

  try {
    const profilesCount = await seedProfiles();
    const facilitiesCount = await seedFacilities();
    const reportsCount = await seedReports();
    const postsCount = await seedPosts();
    const commentsCount = await seedComments();

    const elapsedMs = Date.now() - startTime;

    console.log('\n====================================================');
    console.log('📊 RINGKASAN SEEDING SELESAI');
    console.log('====================================================');
    console.log(`👤 Profil Akun Demo : ${profilesCount}`);
    console.log(`🏢 Fasilitas Publik : ${facilitiesCount}`);
    console.log(`📋 Laporan Warga    : ${reportsCount}`);
    console.log(`📱 Postingan Linimasa: ${postsCount}`);
    console.log(`💬 Komentar Warga   : ${commentsCount}`);
    console.log(`⏱️ Waktu Eksekusi   : ${(elapsedMs / 1000).toFixed(2)} detik`);
    console.log('====================================================\n');
  } catch (err: unknown) {
    console.error('\n❌ Proses seeding gagal:', (err as Error).message || err);
    process.exit(1);
  }
}

runMasterSeed();
