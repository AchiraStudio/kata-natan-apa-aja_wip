import { 
  PublicFacility, 
  BudgetProject, 
  CitizenReport, 
  DiscrepancyFlag, 
  MonthlyDigest,
  SubdistrictType,
  SectorType,
  SectorMeta,
  BudgetProgram,
  SourceMetadata
} from '../types';

export const JABODETABEK_COORDINATES: [number, number] = [-6.2500, 106.8200];
export const KOTA_BOGOR_COORDINATES: [number, number] = JABODETABEK_COORDINATES;

export const SUBDISTRICTS: SubdistrictType[] = [
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Barat',
  'Jakarta Utara',
  'Bogor Tengah',
  'Bogor Barat',
  'Bogor Selatan',
  'Bogor Timur',
  'Bogor Utara',
  'Tanah Sareal',
  'Depok',
  'Citayem',
  'Kota Tangerang',
  'Tangerang Selatan',
  'Kota Bekasi'
];

export const SECTORS: SectorType[] = [
  'Pendidikan',
  'Kesehatan',
  'Lingkungan & Drainase',
  'Infrastruktur Jalan',
  'Transportasi Publik',
  'Ruang Terbuka Hijau',
  'Pengelolaan Persampahan',
  'Pasar Tradisional',
  'Layanan Administrasi'
];

export const SECTOR_DEFINITIONS: SectorMeta[] = [
  {
    id: 'Pendidikan',
    label: 'Pendidikan',
    description: 'Sarana & prasarana gedung sekolah dasar dan menengah negeri, ruang laboratorium, dan fasilitas penunjang belajar.',
    defaultAgency: 'Dinas Pendidikan Pemda (Disdik)',
    color: '#2563EB'
  },
  {
    id: 'Kesehatan',
    label: 'Kesehatan',
    description: 'Puskesmas induk, puskesmas pembantu, RSUD, instalasi farmasi, dan sarana gawat darurat dasar 24 jam.',
    defaultAgency: 'Dinas Kesehatan Pemda (Dinkes)',
    color: '#0D9488'
  },
  {
    id: 'Lingkungan & Drainase',
    label: 'Lingkungan & Drainase',
    description: 'Sistem drainase primer/sekunder, box culvert, kolam retensi pencegah banjir limpasan, dan sudetan sungai.',
    defaultAgency: 'Dinas Sumber Daya Air / PUPR',
    color: '#0284C7'
  },
  {
    id: 'Infrastruktur Jalan',
    label: 'Infrastruktur Jalan & Jembatan',
    description: 'Jalan arteri kota, jembatan penghubung, jalur pedestrian, trotoar disabilitas, dan penerangan jalan umum (PJU).',
    defaultAgency: 'Dinas Bina Marga / PUPR',
    color: '#D97706'
  },
  {
    id: 'Transportasi Publik',
    label: 'Transportasi Publik',
    description: 'Halte integrasi transportasi bus, jalur pemandu difabel, dan fasilitas integrasi transit stasiun KRL / LRT.',
    defaultAgency: 'Dinas Perhubungan (Dishub)',
    color: '#2563EB'
  },
  {
    id: 'Ruang Terbuka Hijau',
    label: 'Ruang Terbuka Hijau & Taman',
    description: 'Taman kota tematik, alun-alun publik, jalur hijau tepian sungai, dan fasilitas rekreasi warga terbuka.',
    defaultAgency: 'Dinas Pertamanan & Hutan Kota / DLH',
    color: '#15803D'
  },
  {
    id: 'Pengelolaan Persampahan',
    label: 'Pengelolaan Persampahan',
    description: 'Tempat Pengolahan Sampah Terpadu (TPST 3R), bank sampah induk, dan armada pengangkutan sampah permukiman.',
    defaultAgency: 'Dinas Lingkungan Hidup (DLH)',
    color: '#B45309'
  },
  {
    id: 'Pasar Tradisional',
    label: 'Pasar Tradisional',
    description: 'Revitalisasi los basah/kering pasar rakyat, instalasi pengelolaan limbah pasar, dan proteksi kebakaran.',
    defaultAgency: 'Perumda Pasar Daerah / Disperindag',
    color: '#DC2626'
  },
  {
    id: 'Layanan Administrasi',
    label: 'Layanan Administrasi Publik',
    description: 'Mal Pelayanan Publik (MPP), kantor kelurahan/kecamatan terpadu, dan loket kependudukan ramah inklusi.',
    defaultAgency: 'DPMPTSP & Bagian Umum Pemda',
    color: '#4B5563'
  }
];

export const STANDARD_SOURCE_METADATA: SourceMetadata = {
  sourceName: 'Simulasi Terbuka Format SIKD Kemendagri & Portal Satu Data Jabodetabek 2026',
  sourceType: 'OFFICIAL_SIMULATED',
  reportingPeriod: 'APBD Murni TA 2026 (Periode Pelaporan: 01 Jan - 30 Sep 2026)',
  publicationDate: '15 Oktober 2026',
  verifiedBy: 'Tim Kurasi Data Terbuka WIA 2026',
  confidenceLevel: 'Tinggi (98%)',
  methodologyNote: 'Data disimulasikan secara realistis berdasarkan struktur bagan akun standar (BAS) Permendagri No. 77/2020 tentang Pengelolaan Keuangan Daerah untuk keperluan kompetisi Web In Action 2026.',
  isSimulatedCompetitionData: true
};

// Format Helpers
export const formatRupiahShort = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(1).replace('.0', '');
    return `Rp ${val} M`;
  }
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(0);
    return `Rp ${val} Jt`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export const formatRupiahFull = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

// ============================================================================
// 1. PUBLIC FACILITIES (COMPREHENSIVE MULTI-SECTOR DATASET)
// ============================================================================
export const INITIAL_FACILITIES: PublicFacility[] = [
  {
    id: 'FAC-BGR-001',
    name: 'SDN Menteng 01 Bogor Barat',
    sector: 'Pendidikan',
    subdistrict: 'Bogor Barat',
    address: 'Jl. Medika No. 12, Menteng, Bogor Barat',
    coordinates: [-6.5824, 106.7761],
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    condition: 'Rusak Sedang',
    serviceCapacity: '540 Siswa Aktif (18 Rombel)',
    activeReportsCount: 4,
    resolvedReportsCount: 2,
    linkedProjectIds: ['PRJ-BGR-2026-EDU-01'],
    budgetSummary: {
      paguAnggaran: 850_000_000,
      danaTerikatKontrak: 790_000_000,
      realisasiPenyerapan: 480_000_000,
      sisaPaguBelumTerikat: 60_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '14 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-002',
    name: 'Puskesmas Bogor Tengah (Sempur)',
    sector: 'Kesehatan',
    subdistrict: 'Bogor Tengah',
    address: 'Jl. Sempur Kaler No. 5, Sempur, Bogor Tengah',
    coordinates: [-6.5912, 106.7984],
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    condition: 'Baik',
    serviceCapacity: '14.500 Warga Terlayani/Tahun',
    activeReportsCount: 1,
    resolvedReportsCount: 8,
    linkedProjectIds: ['PRJ-BGR-2026-HLT-02'],
    budgetSummary: {
      paguAnggaran: 1_400_000_000,
      danaTerikatKontrak: 1_350_000_000,
      realisasiPenyerapan: 1_280_000_000,
      sisaPaguBelumTerikat: 50_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '12 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-003',
    name: 'Saluran Drainase Primer Jl. Pajajaran',
    sector: 'Lingkungan & Drainase',
    subdistrict: 'Bogor Timur',
    address: 'Koridor Simpang Sukasari - Bantar Kemang, Bogor Timur',
    coordinates: [-6.6095, 106.8124],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - SDA',
    condition: 'Perlu Intervensi Kritis',
    serviceCapacity: 'Kapasitas 12.000 m³/jam Limpasan Hujan',
    activeReportsCount: 9,
    resolvedReportsCount: 1,
    linkedProjectIds: ['PRJ-BGR-2026-DRN-03'],
    budgetSummary: {
      paguAnggaran: 2_600_000_000,
      danaTerikatKontrak: 2_520_000_000,
      realisasiPenyerapan: 2_470_000_000,
      sisaPaguBelumTerikat: 80_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '15 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-004',
    name: 'Jalur Pedestrian & Trotoar Kebun Raya',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Tengah',
    address: 'Jl. Ir. H. Juanda, Paledang, Bogor Tengah',
    coordinates: [-6.5985, 106.7951],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    condition: 'Baik',
    serviceCapacity: '35.000 Pejalan Kaki/Hari',
    activeReportsCount: 2,
    resolvedReportsCount: 14,
    linkedProjectIds: ['PRJ-BGR-2026-ROD-04'],
    budgetSummary: {
      paguAnggaran: 3_800_000_000,
      danaTerikatKontrak: 3_750_000_000,
      realisasiPenyerapan: 3_700_000_000,
      sisaPaguBelumTerikat: 50_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '16 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-005',
    name: 'Halte Integrasi Biskita Stasiun Bogor',
    sector: 'Transportasi Publik',
    subdistrict: 'Bogor Tengah',
    address: 'Jl. Mayor Oking No. 1, Cibogor, Bogor Tengah',
    coordinates: [-6.5960, 106.7905],
    responsibleAgency: 'Dinas Perhubungan (Dishub) Kota Bogor',
    condition: 'Baik',
    serviceCapacity: '42.000 Penumpang Transit/Hari',
    activeReportsCount: 3,
    resolvedReportsCount: 9,
    linkedProjectIds: ['PRJ-BGR-2026-TRN-05'],
    budgetSummary: {
      paguAnggaran: 1_250_000_000,
      danaTerikatKontrak: 1_200_000_000,
      realisasiPenyerapan: 1_150_000_000,
      sisaPaguBelumTerikat: 50_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '15 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-006',
    name: 'Alun-Alun Kota Bogor',
    sector: 'Ruang Terbuka Hijau',
    subdistrict: 'Bogor Tengah',
    address: 'Jl. Kapten Muslihat No. 21, Pabaton, Bogor Tengah',
    coordinates: [-6.5948, 106.7892],
    responsibleAgency: 'Dinas Perumahan & Permukiman (Disperumkim)',
    condition: 'Baik',
    serviceCapacity: '25.000 Pengunjung Akhir Pekan',
    activeReportsCount: 2,
    resolvedReportsCount: 11,
    linkedProjectIds: ['PRJ-BGR-2026-RTH-06'],
    budgetSummary: {
      paguAnggaran: 980_000_000,
      danaTerikatKontrak: 920_000_000,
      realisasiPenyerapan: 850_000_000,
      sisaPaguBelumTerikat: 60_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '12 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-007',
    name: 'Jembatan Cibalok Batutulis',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Selatan',
    address: 'Jl. Batutulis Simpang Cipaku, Bogor Selatan',
    coordinates: [-6.6180, 106.8095],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    condition: 'Perlu Intervensi Kritis',
    serviceCapacity: 'Arteri Distribusi Logistik Selatan',
    activeReportsCount: 7,
    resolvedReportsCount: 0,
    linkedProjectIds: ['PRJ-BGR-2026-ROD-07'],
    budgetSummary: {
      paguAnggaran: 1_850_000_000,
      danaTerikatKontrak: 1_200_000_000,
      realisasiPenyerapan: 410_000_000,
      sisaPaguBelumTerikat: 650_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '16 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-008',
    name: 'TPST 3R Mekarwangi',
    sector: 'Pengelolaan Persampahan',
    subdistrict: 'Tanah Sareal',
    address: 'Kawasan Mekarwangi RW 05, Tanah Sareal',
    coordinates: [-6.5492, 106.7725],
    responsibleAgency: 'Dinas Lingkungan Hidup (DLH) Kota Bogor',
    condition: 'Rusak Ringan',
    serviceCapacity: 'Daya Olah 18 Ton Sampah/Hari',
    activeReportsCount: 3,
    resolvedReportsCount: 4,
    linkedProjectIds: ['PRJ-BGR-2026-WST-08'],
    budgetSummary: {
      paguAnggaran: 1_100_000_000,
      danaTerikatKontrak: 1_020_000_000,
      realisasiPenyerapan: 780_000_000,
      sisaPaguBelumTerikat: 80_000_000,
      linkageConfidence: 'Sedang (75%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '10 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-009',
    name: 'Pasar Anyar (Blok A & B Revitalisasi)',
    sector: 'Pasar Tradisional',
    subdistrict: 'Bogor Tengah',
    address: 'Jl. Dewi Sartika, Pabaton, Bogor Tengah',
    coordinates: [-6.5898, 106.7925],
    responsibleAgency: 'Perumda Pasar Pakuan Jaya / Disperindag',
    condition: 'Rusak Sedang',
    serviceCapacity: '1.200 Pedagang Kios & Los',
    activeReportsCount: 5,
    resolvedReportsCount: 3,
    linkedProjectIds: ['PRJ-BGR-2026-MKT-09'],
    budgetSummary: {
      paguAnggaran: 4_500_000_000,
      danaTerikatKontrak: 4_200_000_000,
      realisasiPenyerapan: 3_100_000_000,
      sisaPaguBelumTerikat: 300_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '14 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BGR-010',
    name: 'Mal Pelayanan Publik Grha Tiyasa',
    sector: 'Layanan Administrasi',
    subdistrict: 'Bogor Timur',
    address: 'Lippo Plaza Keboen Raya Lt. 2, Bogor Timur',
    coordinates: [-6.6021, 106.8042],
    responsibleAgency: 'Bagian Organisasi & DPMPTSP Kota Bogor',
    condition: 'Baik',
    serviceCapacity: '1.800 Pemohon Layanan/Hari (145 Jenis Layanan)',
    activeReportsCount: 1,
    resolvedReportsCount: 12,
    linkedProjectIds: ['PRJ-BGR-2026-ADM-10'],
    budgetSummary: {
      paguAnggaran: 820_000_000,
      danaTerikatKontrak: 800_000_000,
      realisasiPenyerapan: 790_000_000,
      sisaPaguBelumTerikat: 20_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '16 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-JKT-001',
    name: 'SMPN 1 Jakarta (Cikini)',
    sector: 'Pendidikan',
    subdistrict: 'Jakarta Pusat',
    address: 'Jl. Cikini Raya No. 87, Menteng, Jakarta Pusat',
    coordinates: [-6.1905, 106.8378],
    responsibleAgency: 'Dinas Pendidikan Pemda DKI Jakarta',
    condition: 'Baik',
    serviceCapacity: '720 Siswa Aktif (24 Rombel)',
    activeReportsCount: 1,
    resolvedReportsCount: 5,
    linkedProjectIds: ['PRJ-BGR-2026-EDU-01'],
    budgetSummary: {
      paguAnggaran: 1_250_000_000,
      danaTerikatKontrak: 1_180_000_000,
      realisasiPenyerapan: 950_000_000,
      sisaPaguBelumTerikat: 70_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '15 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-JKT-002',
    name: 'Puskesmas Kecamatan Kebayoran Baru',
    sector: 'Kesehatan',
    subdistrict: 'Jakarta Selatan',
    address: 'Jl. Iskandarsyah Raya No. 10, Melawai, Kebayoran Baru',
    coordinates: [-6.2443, 106.8005],
    responsibleAgency: 'Dinas Kesehatan Pemda DKI Jakarta',
    condition: 'Baik',
    serviceCapacity: '15.000 Pasien/Tahun',
    activeReportsCount: 2,
    resolvedReportsCount: 8,
    linkedProjectIds: ['PRJ-BGR-2026-HLT-02'],
    budgetSummary: {
      paguAnggaran: 2_100_000_000,
      danaTerikatKontrak: 1_950_000_000,
      realisasiPenyerapan: 1_600_000_000,
      sisaPaguBelumTerikat: 150_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '14 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-DPK-001',
    name: 'Saluran Drainase Primer Margonda Raya',
    sector: 'Lingkungan & Drainase',
    subdistrict: 'Depok',
    address: 'Jl. Margonda Raya Km. 4.5, Kemiri Muka, Beji, Depok',
    coordinates: [-6.3725, 106.8324],
    responsibleAgency: 'Dinas PUPR Pemkot Depok - SDA',
    condition: 'Rusak Sedang',
    serviceCapacity: 'Tampungan Limpasan 12.000 m3/detik',
    activeReportsCount: 5,
    resolvedReportsCount: 3,
    linkedProjectIds: ['PRJ-BGR-2026-DRN-03'],
    budgetSummary: {
      paguAnggaran: 1_600_000_000,
      danaTerikatKontrak: 1_450_000_000,
      realisasiPenyerapan: 1_100_000_000,
      sisaPaguBelumTerikat: 150_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '15 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-TNG-001',
    name: 'Ruas Jalan & Trotoar Daan Mogot Barat',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Kota Tangerang',
    address: 'Jl. Daan Mogot Km. 22, Sukasari, Kota Tangerang',
    coordinates: [-6.1738, 106.6389],
    responsibleAgency: 'Dinas PUPR / Bina Marga Kota Tangerang',
    condition: 'Rusak Ringan',
    serviceCapacity: 'LHR 35.000 Kendaraan/Hari',
    activeReportsCount: 3,
    resolvedReportsCount: 6,
    linkedProjectIds: ['PRJ-BGR-2026-RDS-04'],
    budgetSummary: {
      paguAnggaran: 1_850_000_000,
      danaTerikatKontrak: 1_700_000_000,
      realisasiPenyerapan: 1_300_000_000,
      sisaPaguBelumTerikat: 150_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '16 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'FAC-BKS-001',
    name: 'Taman Kota Patriot Bina Bangsa',
    sector: 'Ruang Terbuka Hijau',
    subdistrict: 'Kota Bekasi',
    address: 'Jl. Ahmad Yani No. 2, Marga Jaya, Bekasi Selatan',
    coordinates: [-6.2383, 106.9956],
    responsibleAgency: 'Dinas Pertamanan & LH Kota Bekasi',
    condition: 'Baik',
    serviceCapacity: '2.500 Pengunjung/Hari',
    activeReportsCount: 1,
    resolvedReportsCount: 7,
    linkedProjectIds: ['PRJ-BGR-2026-PRK-06'],
    budgetSummary: {
      paguAnggaran: 750_000_000,
      danaTerikatKontrak: 720_000_000,
      realisasiPenyerapan: 680_000_000,
      sisaPaguBelumTerikat: 30_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '12 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    photoUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80'
  }
];

// ============================================================================
// 2. BUDGET PROGRAMS & ACTIVITIES HIERARCHY (APBD JABODETABEK 2026)
// ============================================================================
export const INITIAL_BUDGET_PROGRAMS: BudgetProgram[] = [
  {
    id: 'PRG-DISDIK-01',
    code: '1.01.02',
    name: 'Program Pengelolaan Pendidikan Dasar & Menengah',
    sector: 'Pendidikan',
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    paguAnggaran: 2_850_000_000,
    danaTerikatKontrak: 2_640_000_000,
    realisasiPenyerapan: 1_820_000_000,
    sisaPaguBelumTerikat: 210_000_000,
    projectsCount: 4,
    activities: [
      { id: 'ACT-01', code: '1.01.02.1.01', name: 'Rehabilitasi Sedang/Berat Gedung SD', pagu: 1_250_000_000, terikat: 1_180_000_000, realisasi: 820_000_000 },
      { id: 'ACT-02', code: '1.01.02.1.02', name: 'Pengadaan Meubelair & Laboratorium Komputer', pagu: 850_000_000, terikat: 790_000_000, realisasi: 580_000_000 },
      { id: 'ACT-03', code: '1.01.02.1.03', name: 'Pemeliharaan Rutin Sarana Prasarana Sekolah', pagu: 750_000_000, terikat: 670_000_000, realisasi: 420_000_000 }
    ]
  },
  {
    id: 'PRG-DINKES-02',
    code: '1.02.02',
    name: 'Program Pemenuhan Upaya Kesehatan Perorangan & Masyarakat',
    sector: 'Kesehatan',
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    paguAnggaran: 3_400_000_000,
    danaTerikatKontrak: 3_250_000_000,
    realisasiPenyerapan: 2_950_000_000,
    sisaPaguBelumTerikat: 150_000_000,
    projectsCount: 5,
    activities: [
      { id: 'ACT-04', code: '1.02.02.1.01', name: 'Peningkatan Sarana Cold-Chain & Instalasi Farmasi', pagu: 1_400_000_000, terikat: 1_350_000_000, realisasi: 1_280_000_000 },
      { id: 'ACT-05', code: '1.02.02.1.02', name: 'Pengadaan Alkes Diagnostik Dasar Puskesmas', pagu: 1_100_000_000, terikat: 1_050_000_000, realisasi: 980_000_000 },
      { id: 'ACT-06', code: '1.02.02.1.03', name: 'Operasional Layanan Kesehatan Keliling 24 Jam', pagu: 900_000_000, terikat: 850_000_000, realisasi: 690_000_000 }
    ]
  },
  {
    id: 'PRG-PUPR-03',
    code: '1.03.02',
    name: 'Program Pengelolaan Sumber Daya Air & Pengendalian Banjir',
    sector: 'Lingkungan & Drainase',
    responsibleAgency: 'Dinas PUPR Kota Bogor',
    paguAnggaran: 6_800_000_000,
    danaTerikatKontrak: 6_620_000_000,
    realisasiPenyerapan: 6_420_000_000,
    sisaPaguBelumTerikat: 180_000_000,
    projectsCount: 6,
    activities: [
      { id: 'ACT-07', code: '1.03.02.1.01', name: 'Normalisasi Drainase Primer Sukasari - Pajajaran', pagu: 2_600_000_000, terikat: 2_520_000_000, realisasi: 2_470_000_000 },
      { id: 'ACT-08', code: '1.03.02.1.02', name: 'Pembangunan Kolam Retensi Situ Gede', pagu: 2_400_000_000, terikat: 2_350_000_000, realisasi: 2_300_000_000 },
      { id: 'ACT-09', code: '1.03.02.1.03', name: 'Pemeliharaan Berkala Sudetan Sungai Cibalok & Cisadane', pagu: 1_800_000_000, terikat: 1_750_000_000, realisasi: 1_650_000_000 }
    ]
  },
  {
    id: 'PRG-PUPR-04',
    code: '1.03.03',
    name: 'Program Penyelenggaraan Jalan, Jembatan & Keselamatan Pejalan Kaki',
    sector: 'Infrastruktur Jalan',
    responsibleAgency: 'Dinas PUPR Kota Bogor',
    paguAnggaran: 7_500_000_000,
    danaTerikatKontrak: 6_700_000_000,
    realisasiPenyerapan: 5_260_000_000,
    sisaPaguBelumTerikat: 800_000_000,
    projectsCount: 8,
    activities: [
      { id: 'ACT-10', code: '1.03.03.1.01', name: 'Pemeliharaan Rutin Jalur Pedestrian Kebun Raya', pagu: 3_800_000_000, terikat: 3_750_000_000, realisasi: 3_700_000_000 },
      { id: 'ACT-11', code: '1.03.03.1.02', name: 'Perkuatan Struktur Pondasi Jembatan Cibalok', pagu: 1_850_000_000, terikat: 1_200_000_000, realisasi: 410_000_000 },
      { id: 'ACT-12', code: '1.03.03.1.03', name: 'Rehabilitasi Aspal Hotmix Jalur Distribusi Logistik', pagu: 1_850_000_000, terikat: 1_750_000_000, realisasi: 1_150_000_000 }
    ]
  }
];

// ============================================================================
// 3. BUDGET PROJECTS (APBD OPEN GOVERNMENT DATA)
// ============================================================================
export const INITIAL_BUDGET_PROJECTS: BudgetProject[] = [
  {
    id: 'PRJ-BGR-2026-EDU-01',
    code: 'APBD-2026-DISDIK-019',
    title: 'Rehabilitasi Atap & Ruang Kelas Laboratorium SDN Menteng 01',
    sector: 'Pendidikan',
    subdistrict: 'Bogor Barat',
    facilityId: 'FAC-BGR-001',
    facilityName: 'SDN Menteng 01 Bogor Barat',
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    contractorName: 'CV. Cipta Graha Mandiri',
    progressPercent: 56,
    status: 'Dalam Pengerjaan',
    startDate: '15 Mei 2026',
    targetEndDate: '30 Nov 2026',
    budget: {
      paguAnggaran: 850_000_000,
      danaTerikatKontrak: 790_000_000,
      realisasiPenyerapan: 480_000_000,
      sisaPaguBelumTerikat: 60_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '14 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    description: 'Penggantian rangka atap baja ringan dan perbaikan plafon 4 ruang kelas guna menjamin keselamatan proses belajar mengajar.'
  },
  {
    id: 'PRJ-BGR-2026-DRN-03',
    code: 'APBD-2026-PUPR-041',
    title: 'Normalisasi & Peningkatan Kapasitas Drainase Primer Koridor Sukasari - Pajajaran',
    sector: 'Lingkungan & Drainase',
    subdistrict: 'Bogor Timur',
    facilityId: 'FAC-BGR-003',
    facilityName: 'Saluran Drainase Primer Jl. Pajajaran',
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - SDA',
    contractorName: 'PT. Tirta Konstruksi Utama',
    progressPercent: 95,
    status: 'Dalam Pengerjaan',
    startDate: '01 Mar 2026',
    targetEndDate: '15 Okt 2026',
    budget: {
      paguAnggaran: 2_600_000_000,
      danaTerikatKontrak: 2_520_000_000,
      realisasiPenyerapan: 2_470_000_000,
      sisaPaguBelumTerikat: 80_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '15 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    description: 'Pengerukan sedimentasi lumpur, pemasangan box culvert 2x2 meter, dan rekonstruksi sudetan air menuju Sungai Cibalok.'
  },
  {
    id: 'PRJ-BGR-2026-ROD-07',
    code: 'APBD-2026-PUPR-082',
    title: 'Perkuatan Pondasi & Pelebaran Badan Jembatan Cibalok Batutulis',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Selatan',
    facilityId: 'FAC-BGR-007',
    facilityName: 'Jembatan Cibalok Batutulis',
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    contractorName: 'PT. Pilar Marga Nusantara',
    progressPercent: 32,
    status: 'Dalam Pengerjaan',
    startDate: '10 Jul 2026',
    targetEndDate: '20 Des 2026',
    budget: {
      paguAnggaran: 1_850_000_000,
      danaTerikatKontrak: 1_200_000_000,
      realisasiPenyerapan: 410_000_000,
      sisaPaguBelumTerikat: 650_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '16 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    description: 'Pemasangan tiang pancang penahan longsor tebing sungai dan rekonstruksi girder jembatan penghubung Simpang Batutulis.'
  },
  {
    id: 'PRJ-BGR-2026-HLT-02',
    code: 'APBD-2026-DINKES-007',
    title: 'Modernisasi Ruang Rawat Inap & Instalasi Farmasi Puskesmas Sempur',
    sector: 'Kesehatan',
    subdistrict: 'Bogor Tengah',
    facilityId: 'FAC-BGR-002',
    facilityName: 'Puskesmas Bogor Tengah (Sempur)',
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    contractorName: 'CV. Husada Pradana',
    progressPercent: 100,
    status: 'Selesai',
    startDate: '10 Feb 2026',
    targetEndDate: '15 Agu 2026',
    budget: {
      paguAnggaran: 1_400_000_000,
      danaTerikatKontrak: 1_350_000_000,
      realisasiPenyerapan: 1_280_000_000,
      sisaPaguBelumTerikat: 50_000_000,
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Jabodetabek 2026',
      lastUpdated: '12 Okt 2026',
      sourceMetadata: STANDARD_SOURCE_METADATA
    },
    description: 'Optimalisasi fasilitas gawat darurat dasar 24 jam dan pendingin cold-chain vaksin imunisasi balita.'
  }
];

// ============================================================================
// 4. CITIZEN REPORTS ("TITIK MASALAH")
// ============================================================================
export const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: 'TITIK-BGR-2026-084',
    title: 'Genangan Banjir 40cm Akibat Sedimentasi Drainase Simpang Sukasari',
    description: 'Setiap hujan deras lebih dari 30 menit, air meluap ke badan jalan utama dan pertokoan. Box culvert yang baru dibangun diduga tersumbat sisa material proyek.',
    sector: 'Lingkungan & Drainase',
    subdistrict: 'Bogor Timur',
    facilityId: 'FAC-BGR-003',
    facilityName: 'Saluran Drainase Primer Jl. Pajajaran',
    coordinates: [-6.6092, 106.8129],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - SDA',
    linkedProjectId: 'PRJ-BGR-2026-DRN-03',
    linkedProjectTitle: 'Normalisasi & Peningkatan Kapasitas Drainase Pajajaran',
    isBudgetLinkConfirmed: true,
    priorityVotes: 48,
    userHasVoted: false,
    reporterHandle: 'warga_pajajaran_timur',
    reportedAt: '12 Okt 2026, 16:42 WIB',
    currentStep: 4,
    severity: 'Kritis',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    evidenceFilesCount: 3,
    timeline: [
      {
        stepNumber: 1,
        title: 'Laporan Diterima Warga',
        date: '12 Okt 2026, 16:42 WIB',
        description: 'Laporan masuk dengan geotag koordinat dan 3 bukti visual banjir limpasan.',
        status: 'COMPLETED',
        actor: 'Sistem TITIK.'
      },
      {
        stepNumber: 2,
        title: 'Bukti Visual Terverifikasi',
        date: '13 Okt 2026, 09:15 WIB',
        description: 'Verifikator komunitas mengonfirmasi ketinggian air 40cm dan lokasi valid.',
        status: 'COMPLETED',
        actor: 'Tim Kurasi Komunitas WIA'
      },
      {
        stepNumber: 3,
        title: 'Dinas Penanggung Jawab Teridentifikasi',
        date: '13 Okt 2026, 11:30 WIB',
        description: 'Otoritas penanganan ditetapkan pada Dinas PUPR Bidang Sumber Daya Air.',
        status: 'COMPLETED',
        actor: 'Katalog Layanan Publik SIKD'
      },
      {
        stepNumber: 4,
        title: 'Tautan Anggaran APBD Dicek',
        date: '14 Okt 2026, 14:00 WIB',
        description: 'Terhubung ke proyek aktif PRJ-BGR-2026-DRN-03 dengan penyerapan dana 95% (Rp 2,47 M). Anomali terdeteksi.',
        status: 'COMPLETED',
        actor: 'Mesin Penelusuran SIKD'
      },
      {
        stepNumber: 5,
        title: 'Menunggu Respon Resmi Dinas',
        date: 'Sedang Berjalan',
        description: 'Notifikasi audit publik telah diteruskan ke Pejabat Pembuat Komitmen (PPK) Dinas PUPR terkait.',
        status: 'IN_PROGRESS',
        actor: 'Dinas PUPR'
      },
      {
        stepNumber: 6,
        title: 'Verifikasi Tindak Lanjut Komunitas',
        date: 'Menunggu Langkah 5',
        description: 'Warga pelapor dan komunitas sekitar akan menginspeksi hasil pembersihan saluran.',
        status: 'PENDING',
        actor: 'Warga Sekitar'
      }
    ]
  },
  {
    id: 'TITIK-BGR-2026-079',
    title: 'Plafon Kelas 4 SDN Menteng 01 Runtuh Saat KBM Berlangsung',
    description: 'Rembesan air dari talang atap menyebabkan plafon gypsum rapuh dan ambruk. 2 murid mengalami luka ringan. Renovasi baru berjalan separuh namun mandek 3 minggu.',
    sector: 'Pendidikan',
    subdistrict: 'Bogor Barat',
    facilityId: 'FAC-BGR-001',
    facilityName: 'SDN Menteng 01 Bogor Barat',
    coordinates: [-6.5826, 106.7765],
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    linkedProjectId: 'PRJ-BGR-2026-EDU-01',
    linkedProjectTitle: 'Rehabilitasi Atap & Ruang Kelas Laboratorium SDN Menteng 01',
    isBudgetLinkConfirmed: true,
    priorityVotes: 64,
    userHasVoted: false,
    reporterHandle: 'komite_sekolah_menteng',
    reportedAt: '09 Okt 2026, 10:20 WIB',
    currentStep: 5,
    severity: 'Kritis',
    photoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    evidenceFilesCount: 2,
    timeline: [
      {
        stepNumber: 1,
        title: 'Laporan Diterima Warga',
        date: '09 Okt 2026, 10:20 WIB',
        description: 'Laporan diajukan oleh ketua komite sekolah beserta surat pengantar kepala sekolah.',
        status: 'COMPLETED',
        actor: 'Komite Sekolah'
      },
      {
        stepNumber: 2,
        title: 'Bukti Visual Terverifikasi',
        date: '09 Okt 2026, 13:00 WIB',
        description: 'Kondisi atap ambruk dan material berserakan terverifikasi valid.',
        status: 'COMPLETED',
        actor: 'Relawan Penilik Pendidikan'
      },
      {
        stepNumber: 3,
        title: 'Dinas Penanggung Jawab Teridentifikasi',
        date: '09 Okt 2026, 15:45 WIB',
        description: 'Dinas Pendidikan Bidang Sarana & Prasarana.',
        status: 'COMPLETED',
        actor: 'Sistem TITIK.'
      },
      {
        stepNumber: 4,
        title: 'Tautan Anggaran APBD Dicek',
        date: '10 Okt 2026, 09:30 WIB',
        description: 'Terkonfirmasi terikat kontrak Rp 790 Jt dengan progres tercatat 56%.',
        status: 'COMPLETED',
        actor: 'Satu Data Daerah'
      },
      {
        stepNumber: 5,
        title: 'Respon Resmi & Instruksi Kontraktor',
        date: '12 Okt 2026, 11:00 WIB',
        description: 'Dinas Pendidikan melayangkan Surat Peringatan 1 (SP1) kepada kontraktor pelaksana CV. Cipta Graha Mandiri untuk melanjutkan perbaikan dalam 3x24 jam.',
        status: 'COMPLETED',
        actor: 'Dinas Pendidikan'
      },
      {
        stepNumber: 6,
        title: 'Verifikasi Tindak Lanjut Komunitas',
        date: 'Sedang Dipantau',
        description: 'Warga dan komite sekolah mengawasi pengerjaan rangka atap pengganti di lokasi.',
        status: 'IN_PROGRESS',
        actor: 'Komite & Warga Menteng'
      }
    ]
  },
  {
    id: 'TITIK-BGR-2026-062',
    title: 'Retakan Struktur Abutment Jembatan Cibalok Menganga 15cm',
    description: 'Longsoran lereng sungai mengikis pondasi barat jembatan. Kendaraan truk muatan berat masih sering melintas meski berbahaya.',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Selatan',
    facilityId: 'FAC-BGR-007',
    facilityName: 'Jembatan Cibalok Batutulis',
    coordinates: [-6.6184, 106.8091],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    linkedProjectId: 'PRJ-BGR-2026-ROD-07',
    linkedProjectTitle: 'Perkuatan Pondasi Jembatan Cibalok',
    isBudgetLinkConfirmed: true,
    priorityVotes: 91,
    userHasVoted: false,
    reporterHandle: 'forum_rw_batutulis',
    reportedAt: '03 Okt 2026, 08:12 WIB',
    currentStep: 5,
    severity: 'Kritis',
    photoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    evidenceFilesCount: 4,
    timeline: [
      {
        stepNumber: 1,
        title: 'Laporan Diterima Warga',
        date: '03 Okt 2026, 08:12 WIB',
        description: 'Pengaduan darurat keamanan struktur jalur utama selatan Bogor.',
        status: 'COMPLETED',
        actor: 'Forum RW 04 Batutulis'
      },
      {
        stepNumber: 2,
        title: 'Bukti Visual Terverifikasi',
        date: '03 Okt 2026, 10:00 WIB',
        description: 'Foto pengukuran retakan struktur 15cm dinyatakan memenuhi kriteria bahaya tinggi.',
        status: 'COMPLETED',
        actor: 'Inspektur Komunitas'
      },
      {
        stepNumber: 3,
        title: 'Dinas Penanggung Jawab Teridentifikasi',
        date: '03 Okt 2026, 11:30 WIB',
        description: 'Dinas PUPR Bidang Pemeliharaan Jembatan & Jalan.',
        status: 'COMPLETED',
        actor: 'Sistem TITIK.'
      },
      {
        stepNumber: 4,
        title: 'Tautan Anggaran APBD Dicek',
        date: '04 Okt 2026, 14:10 WIB',
        description: 'Terkonfirmasi anggaran terikat kontrak Rp 1,2 M dari pagu Rp 1,85 M. Sisa pagu belum terikat Rp 650 Jt.',
        status: 'COMPLETED',
        actor: 'Modul Pelacakan APBD'
      },
      {
        stepNumber: 5,
        title: 'Respon Resmi & Pemasangan Rambu Pembatas',
        date: '06 Okt 2026, 16:30 WIB',
        description: 'Dinas PUPR & Dishub memberlakukan pembatasan tonase maksimal 3,5 ton dan memulai penancapan cerucuk bronjong darurat.',
        status: 'COMPLETED',
        actor: 'Dinas PUPR & Dishub Bogor'
      },
      {
        stepNumber: 6,
        title: 'Verifikasi Tindak Lanjut Komunitas',
        date: 'Dalam Pengerjaan',
        description: 'Warga melaporkan alat berat bore-pile telah tiba di sisi barat jembatan.',
        status: 'IN_PROGRESS',
        actor: 'Warga Sekitar'
      }
    ]
  },
  {
    id: 'TITIK-BGR-2026-091',
    title: 'Lampu Penerangan & Paving Rusak di Jalur Pedestrian Kebun Raya',
    description: '3 titik lampu tiang antik mati total sejak 2 pekan lalu, paving block amblas sedalam 10cm membahayakan pejalan kaki tunanetra dan lansia.',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Tengah',
    facilityId: 'FAC-BGR-004',
    facilityName: 'Jalur Pedestrian & Trotoar Kebun Raya',
    coordinates: [-6.5989, 106.7947],
    responsibleAgency: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    linkedProjectId: 'PRJ-BGR-2026-ROD-04',
    linkedProjectTitle: 'Pemeliharaan Rutin Jalur Pedestrian Lingkar Kebun Raya',
    isBudgetLinkConfirmed: true,
    priorityVotes: 23,
    userHasVoted: false,
    reporterHandle: 'bogor_pedestrian_coalition',
    reportedAt: '15 Okt 2026, 19:40 WIB',
    currentStep: 6,
    severity: 'Rendah',
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    evidenceFilesCount: 2,
    timeline: [
      {
        stepNumber: 1,
        title: 'Laporan Diterima Warga',
        date: '15 Okt 2026, 19:40 WIB',
        description: 'Laporan kerusakan malam hari disertai foto pencahayaan redup.',
        status: 'COMPLETED',
        actor: 'Koalisi Pejalan Kaki'
      },
      {
        stepNumber: 2,
        title: 'Bukti Visual Terverifikasi',
        date: '16 Okt 2026, 08:30 WIB',
        description: 'Tim patroli mengonfirmasi 3 armatur LED mati dan paving amblas.',
        status: 'COMPLETED',
        actor: 'Verifikator TITIK.'
      },
      {
        stepNumber: 3,
        title: 'Dinas Penanggung Jawab Teridentifikasi',
        date: '16 Okt 2026, 09:15 WIB',
        description: 'Dinas PUPR UPTD PJU & Pemeliharaan Trotoar.',
        status: 'COMPLETED',
        actor: 'Sistem TITIK.'
      },
      {
        stepNumber: 4,
        title: 'Tautan Anggaran APBD Dicek',
        date: '16 Okt 2026, 10:00 WIB',
        description: 'Pos pemeliharaan rutin terkonfirmasi aktif.',
        status: 'COMPLETED',
        actor: 'SIKD Daerah'
      },
      {
        stepNumber: 5,
        title: 'Respon Resmi & Perbaikan Cepat (Quick Response)',
        date: '16 Okt 2026, 14:20 WIB',
        description: 'Petugas UPTD mengganti driver LED baru dan meratakan kembali paving block.',
        status: 'COMPLETED',
        actor: 'Tim Reaksi Cepat PUPR'
      },
      {
        stepNumber: 6,
        title: 'Tindak Lanjut Terverifikasi Oleh Komunitas',
        date: '16 Okt 2026, 21:00 WIB',
        description: 'Warga mengirimkan foto lampu menyala normal dan memberikan rating puas.',
        status: 'COMPLETED',
        actor: 'Warga Pelapor'
      }
    ]
  },
  {
    id: 'TITIK-BGR-2026-103',
    title: 'Mesin Tap Pembayaran Tiket Rusak & Atap Bocor di Halte Stasiun',
    description: '2 dari 3 gerbang tiket otomatis Biskita mati total menyebabkan antrean menumpuk ke trotoar saat jam pulang kerja.',
    sector: 'Transportasi Publik',
    subdistrict: 'Bogor Tengah',
    facilityId: 'FAC-BGR-005',
    facilityName: 'Halte Integrasi Biskita Stasiun Bogor',
    coordinates: [-6.5962, 106.7907],
    responsibleAgency: 'Dinas Perhubungan (Dishub)',
    linkedProjectId: 'PRJ-BGR-2026-TRN-05',
    linkedProjectTitle: 'Pemeliharaan Fasilitas Integrasi Transit Biskita Trans Pakuan',
    isBudgetLinkConfirmed: true,
    priorityVotes: 37,
    userHasVoted: false,
    reporterHandle: 'komuter_krl_bogor',
    reportedAt: '16 Okt 2026, 07:15 WIB',
    currentStep: 3,
    severity: 'Sedang',
    photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
    evidenceFilesCount: 2,
    timeline: [
      {
        stepNumber: 1,
        title: 'Laporan Diterima Warga',
        date: '16 Okt 2026, 07:15 WIB',
        description: 'Laporan pengaduan pengguna KRL & Biskita Trans Pakuan.',
        status: 'COMPLETED',
        actor: 'Komuter KRL'
      },
      {
        stepNumber: 2,
        title: 'Bukti Visual Terverifikasi',
        date: '16 Okt 2026, 09:00 WIB',
        description: 'Verifikasi video antrean dan display mesin tap error.',
        status: 'COMPLETED',
        actor: 'Verifikator Komunitas'
      },
      {
        stepNumber: 3,
        title: 'Dinas Penanggung Jawab Teridentifikasi',
        date: '16 Okt 2026, 10:30 WIB',
        description: 'Ditujukan ke Dishub Bidang Angkutan & Sarpras.',
        status: 'IN_PROGRESS',
        actor: 'Dinas Perhubungan'
      },
      {
        stepNumber: 4,
        title: 'Tautan Anggaran APBD Dicek',
        date: 'Menunggu Langkah 3',
        description: 'Pengecekan alokasi kontrak pemeliharaan vendor tapping.',
        status: 'PENDING',
        actor: 'SIKD Daerah'
      },
      {
        stepNumber: 5,
        title: 'Respon Resmi Dinas',
        date: 'Menunggu Langkah 4',
        description: 'Surat tugas teknisi vendor Biskita.',
        status: 'PENDING',
        actor: 'Dinas Perhubungan (Dishub)'
      },
      {
        stepNumber: 6,
        title: 'Verifikasi Tuntas',
        date: 'Menunggu Penyelesaian',
        description: 'Validasi kelancaran tapping oleh komuter.',
        status: 'PENDING',
        actor: 'Komuter KRL'
      }
    ]
  }
];

// ============================================================================
// 5. DISCREPANCIES (SPENDING VS. NEEDS DETECTOR)
// ============================================================================
export const INITIAL_DISCREPANCIES: DiscrepancyFlag[] = [
  {
    id: 'DISC-BGR-001',
    title: 'Dana Proyek Drainase Pajajaran Cair 95%, Genangan Masih Terjadi di 9 Titik',
    sector: 'Lingkungan & Drainase',
    subdistrict: 'Bogor Timur',
    facilityName: 'Saluran Drainase Primer Jl. Pajajaran',
    projectCode: 'APBD-2026-PUPR-041',
    projectTitle: 'Normalisasi & Peningkatan Kapasitas Drainase Pajajaran',
    realizationPercent: 95,
    unresolvedReportsCount: 9,
    flagReason: 'Kas Daerah telah mencairkan Rp 2,47 miliar (95% dari pagu), tetapi warga sekitar masih melaporkan 9 titik banjir setinggi 30-50 cm setiap hujan turun.',
    agencyName: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - SDA',
    auditRecommendation: 'Inspektorat Daerah perlu memeriksa kemiringan saluran box culvert di lapangan sebelum masa pemeliharaan kontraktor berakhir.',
    coordinates: [-6.6095, 106.8124],
    severity: 'Tinggi',
    confidenceLevel: 'Tinggi (98%)',
    observedPattern: 'Pencairan termin akhir dilakukan sebelum uji alir air saat hujan deras.'
  },
  {
    id: 'DISC-BGR-002',
    title: 'Perbaikan Atap SDN Menteng 01 Baru Mencapai 56% Menjelang Batas Kontrak',
    sector: 'Pendidikan',
    subdistrict: 'Bogor Barat',
    facilityName: 'SDN Menteng 01 Bogor Barat',
    projectCode: 'APBD-2026-DISDIK-019',
    projectTitle: 'Rehabilitasi Atap & Ruang Kelas SDN Menteng 01',
    realizationPercent: 56,
    unresolvedReportsCount: 4,
    flagReason: 'Sisa waktu pengerjaan tinggal 45 hari kalender, namun progres fisik baru 56%. Empat ruang kelas masih menggunakan terpal sementara untuk 540 siswa.',
    agencyName: 'Dinas Pendidikan Kota Bogor',
    auditRecommendation: 'Pejabat Pembuat Komitmen (PPK) Dinas Pendidikan perlu menggelar rapat pembuktian keterlambatan (Show Cause Meeting) dengan kontraktor pelaksana.',
    coordinates: [-6.5824, 106.7761],
    severity: 'Tinggi',
    confidenceLevel: 'Tinggi (98%)',
    observedPattern: 'Pengiriman rangka baja ringan ke lokasi proyek tertunda tiga minggu.'
  },
  {
    id: 'DISC-BGR-003',
    title: 'Sisa Pagu Rp 650 Juta Belum Terikat Kontrak di Jembatan Cibalok yang Retak',
    sector: 'Infrastruktur Jalan',
    subdistrict: 'Bogor Selatan',
    facilityName: 'Jembatan Cibalok Batutulis',
    projectCode: 'APBD-2026-PUPR-082',
    projectTitle: 'Perkuatan Pondasi Jembatan Cibalok',
    realizationPercent: 22,
    unresolvedReportsCount: 7,
    flagReason: 'Dari pagu Rp 1,85 miliar, baru Rp 1,2 miliar yang terikat kontrak dan realisasi fisik baru 22%. Masih ada Rp 650 juta sisa pagu yang belum dilelang untuk penahan tebing.',
    agencyName: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga',
    auditRecommendation: 'Dinas PUPR dapat mempercepat lelang paket penahan tebing menggunakan sisa pagu sebelum curah hujan puncak bulan November.',
    coordinates: [-6.6180, 106.8095],
    severity: 'Sedang',
    confidenceLevel: 'Tinggi (98%)',
    observedPattern: 'Dokumen Harga Perkiraan Sendiri (HPS) untuk paket tebing belum disahkan.'
  }
];

// ============================================================================
// 6. MONTHLY EDITORIAL DIGEST
// ============================================================================
export const CURRENT_MONTHLY_DIGEST: MonthlyDigest = {
  monthYear: 'Oktober 2026',
  headline: 'Pencairan APBD Triwulan IV Mencapai 78%, Tiga Proyek Fisik Masuk Daftar Pantau Warga',
  totalBudgetAllocated: 20_550_000_000,
  totalBudgetRealized: 16_120_000_000,
  newCompletedProjects: 8,
  activeDiscrepanciesCount: 3,
  verifiedReportsCount: 120,
  editorialSummary: 'Hingga pertengahan Oktober 2026, delapan proyek perbaikan fasilitas kesehatan, lampu jalan, dan halte bus telah rampung dan diverifikasi warga. Namun, pencairan anggaran pada proyek Drainase Jl. Pajajaran dan SDN Menteng 01 tidak sejalan dengan kondisi fisik di lapangan. Warga dapat memberikan dukungan suara pada kasus tersebut agar Inspektorat Daerah menjadwalkan pemeriksaan fisik.'
};

// ============================================================================
// 7. ACCOUNTABILITY FUNNEL METRICS
// ============================================================================
export const ACCOUNTABILITY_FUNNEL = [
  { step: 1, label: 'Laporan Masuk', count: 120, pct: '100%', description: 'Warga mengirim foto kondisi fasilitas beserta titik koordinat.' },
  { step: 2, label: 'Bukti Diperiksa', count: 84, pct: '70%', description: 'Relawan memeriksa keaslian foto dan mencocokkan lokasi pada peta.' },
  { step: 3, label: 'Respon Dinas', count: 60, pct: '50%', description: 'Dinas terkait menerbitkan jadwal perbaikan atau surat perintah kerja.' },
  { step: 4, label: 'Selesai Diperbaiki', count: 32, pct: '27%', description: 'Warga sekitar mengunggah foto hasil perbaikan sebelum kasus ditutup.' }
];
