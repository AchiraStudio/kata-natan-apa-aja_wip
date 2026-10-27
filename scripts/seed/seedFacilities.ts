import { getSeedClient } from './seedClient';
import { MOCK_FACILITIES } from '../../src/data/mockCivicData';

export async function seedFacilities(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data fasilitas publik (is_demo = true)...');

  const facilityRows = MOCK_FACILITIES.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    address: f.address,
    latitude: f.latitude,
    longitude: f.longitude,
    responsible_agency: f.responsibleAgency,
    active_reports_count: 0,
    resolved_reports_count: f.resolvedReportsCount || 0,
    is_demo: true,
  }));

  const { error } = await client.from('facilities').upsert(facilityRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed facilities:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${facilityRows.length} fasilitas publik demo.`);
  return facilityRows.length;
}
