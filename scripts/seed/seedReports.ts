import { getSeedClient } from './seedClient';
import { MOCK_REPORTS_KN, LEGACY_REPORTS, MOCK_BUDGET_SECTORS } from '../../src/data/mockCivicData';

export async function seedReports(): Promise<number> {
  const client = getSeedClient();
  console.log('🌱 Menyiapkan data laporan warga (is_demo = true)...');

  const allReportsSource = [
    ...MOCK_REPORTS_KN,
    ...LEGACY_REPORTS,
    {
      id: 'rep-budi-001',
      publicReference: 'TIK-2026-000188',
      reporterUserId: 'c0000000-0000-0000-0000-000000000001',
      secretFollowUpTokenHash: 'hash_secret_budi_001',
      title: 'Paving Trotoar Rusak & Lubang Drainase Jl. Suryakencana',
      description:
        'Paving block trotoar di depan pertokoan Suryakencana amblas dan penutup drainase patah. Membahayakan pejalan kaki dan lansia yang beraktivitas pagi hari.',
      category: 'Infrastruktur',
      severity: 'medium',
      status: 'under_review',
      publicationStatus: 'published',
      location: {
        latitude: -6.6045,
        longitude: 106.8012,
        address: 'Jl. Suryakencana No. 112, Bogor Selatan',
        district: 'Bogor Selatan',
        city: 'Kota Bogor',
        province: 'Jawa Barat',
        isApproximate: false,
      },
      facilityName: 'Koridor Pedestrian Suryakencana',
      responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
      mediaUrls: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200'],
      reporterType: 'verified_citizen',
      reporterDisplayName: 'Budi Santoso',
      supportCount: 684,
      budgetContext: MOCK_BUDGET_SECTORS.jalan,
      events: [
        {
          id: 'ev-budi-001-1',
          reportId: 'rep-budi-001',
          eventType: 'SUBMITTED',
          newStatus: 'submitted',
          actorType: 'citizen',
          actorName: 'Budi Santoso',
          description: 'Laporan warga tercatat di sistem TITIK.',
          timestamp: '22 Oktober 2026, 09:15 WIB',
        },
      ],
      createdAt: '2026-10-22T09:15:00+07:00',
      updatedAt: '2026-10-22T09:15:00+07:00',
      isSampleData: true,
    },
  ];

  const reportRows = allReportsSource.map((r) => ({
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
    support_count: r.supportCount || Math.floor(Math.random() * 850) + 120,
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
