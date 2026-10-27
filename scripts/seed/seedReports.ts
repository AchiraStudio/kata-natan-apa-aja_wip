import { getSeedClient } from './seedClient';
import { MOCK_REPORTS_KN } from '../../src/data/mockCivicData';

export async function seedReports(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data laporan warga (is_demo = true)...');

  const reportRows = MOCK_REPORTS_KN.map((r) => ({
    id: r.id,
    public_reference: r.publicReference,
    reporter_user_id: r.reporterUserId || null,
    secret_follow_up_token_hash: r.secretFollowUpTokenHash || null,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity,
    status: r.status,
    publication_status: r.publicationStatus,
    location: r.location,
    facility_name: r.facilityName || null,
    responsible_agency: r.responsibleAgency,
    media_urls: r.mediaUrls,
    reporter_type: r.reporterType,
    reporter_display_name: r.reporterDisplayName,
    support_count: 0,
    budget_context: r.budgetContext,
    events: r.events,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    is_demo: true,
  }));

  const { error } = await client.from('reports').upsert(reportRows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Gagal seed reports:', error.message);
    throw error;
  }

  console.log(`✅ Berhasil seed ${reportRows.length} laporan warga demo.`);
  return reportRows.length;
}
