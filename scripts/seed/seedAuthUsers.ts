import { getSeedClient } from './seedClient';

export async function seedAuthUsers(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan akun autentikasi Supabase (Admin & Warga)...');

  // Check if we have service_role privileges
  // If running with anon key, client.auth.admin is not available
  if (!client.auth?.admin) {
    console.log('ℹ️ Seeding akun Auth membutuhkan SUPABASE_SERVICE_ROLE_KEY.');
    console.log('   Akun admin (admin@titik.id) dan warga (warga@titik.id) dapat dibuat via migration SQL:');
    console.log('   supabase/migrations/20261028000002_add_normal_and_admin_accounts.sql');
    return 0;
  }

  const accounts = [
    {
      email: 'admin@titik.id',
      password: 'admin2026',
      user_metadata: {
        username: 'admin.pupr',
        display_name: 'Administrator Dinas PUPR',
        district: 'Bogor Tengah',
      },
      role: 'admin' as const,
    },
    {
      email: 'warga@titik.id',
      password: 'titik2026',
      user_metadata: {
        username: 'budi.santoso',
        display_name: 'Budi Santoso',
        district: 'Bogor Selatan',
      },
      role: 'citizen' as const,
    },
  ];

  let createdCount = 0;

  for (const acc of accounts) {
    try {
      const { data, error } = await client.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: acc.user_metadata,
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          console.log(`ℹ️ Akun ${acc.email} sudah terdaftar di auth.users.`);
        } else {
          console.warn(`Peringatan pembuatan auth ${acc.email}:`, error.message);
        }
      } else if (data?.user) {
        console.log(`✅ Berhasil membuat akun auth ${acc.email}.`);
        createdCount++;
      }
    } catch (err: unknown) {
      console.warn(`Pengecualian saat membuat akun auth ${acc.email}:`, err);
    }
  }

  return createdCount;
}
