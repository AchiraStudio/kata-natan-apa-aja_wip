import { Post, Report, Facility, BudgetSectorContext } from '../types/domain';

// =============================================================================
// SECTOR BUDGET CONTEXT (OGD - Open Government Data Simulation)
// SIKD Kemendagri / APBD Kota Bogor TA 2026 Simulation
// =============================================================================

export const MOCK_BUDGET_SECTORS: Record<string, BudgetSectorContext> = {
  drainase: {
    sectorId: 'bdg-drainase-01',
    sectorName: 'Infrastruktur Publik & Kebinamargaan',
    subSectorName: 'Rehabilitasi Saluran Drainase & Pencegahan Genangan',
    paguAllocation: 38500000000, // Rp 38,5 Miliar
    realizedSpending: 24200000000, // Rp 24,2 Miliar
    executionRatePercent: 62.8,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    agencyAcronym: 'Dinas PUPR',
    responsivenessScore: 84,
    avgResolutionDays: 14,
    lastUpdated: '15 Oktober 2026',
    dataSource: 'Simulasi SIKD Kemendagri & Portal Satu Data Kota Bogor 2026',
    isSampleData: true,
  },
  jalan: {
    sectorId: 'bdg-jalan-02',
    sectorName: 'Infrastruktur Jalan & Keselamatan Pejalan Kaki',
    subSectorName: 'Pemeliharaan Trotoar & Jembatan Penyeberangan Orang',
    paguAllocation: 52000000000, // Rp 52 Miliar
    realizedSpending: 39500000000, // Rp 39,5 Miliar
    executionRatePercent: 75.9,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    agencyAcronym: 'Dinas PUPR',
    responsivenessScore: 86,
    avgResolutionDays: 12,
    lastUpdated: '12 Oktober 2026',
    dataSource: 'Simulasi SIKD Kemendagri & Portal Satu Data Kota Bogor 2026',
    isSampleData: true,
  },
  persampahan: {
    sectorId: 'bdg-lingkungan-03',
    sectorName: 'Pengelolaan Lingkungan & Persampahan',
    subSectorName: 'Operasional Armada Truk Sampah & TPS Terpadu',
    paguAllocation: 29000000000, // Rp 29 Miliar
    realizedSpending: 18100000000, // Rp 18,1 Miliar
    executionRatePercent: 62.4,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Lingkungan Hidup (DLH) Kota Bogor',
    agencyAcronym: 'Dinas Lingkungan Hidup',
    responsivenessScore: 78,
    avgResolutionDays: 7,
    lastUpdated: '17 Oktober 2026',
    dataSource: 'Simulasi SIKD Kemendagri & Portal Satu Data Kota Bogor 2026',
    isSampleData: true,
  },
  pju: {
    sectorId: 'bdg-pju-04',
    sectorName: 'Penerangan Jalan Umum & Kelistrikan Publik',
    subSectorName: 'Pengadaan Lampu LED Smart PJU & Perawatan Tiang',
    paguAllocation: 16500000000, // Rp 16,5 Miliar
    realizedSpending: 11200000000, // Rp 11,2 Miliar
    executionRatePercent: 67.8,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Perhubungan (Dishub) Kota Bogor',
    agencyAcronym: 'Dishub',
    responsivenessScore: 91,
    avgResolutionDays: 5,
    lastUpdated: '16 Oktober 2026',
    dataSource: 'Simulasi SIKD Kemendagri & Portal Satu Data Kota Bogor 2026',
    isSampleData: true,
  },
};

// =============================================================================
// INITIAL CIVIC REPORTS
// =============================================================================

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-001',
    publicReference: 'TIK-2026-000123',
    secretFollowUpTokenHash: 'hash_secret_token_123',
    title: 'Drainase lingkungan',
    description:
      'Saluran drainase air di samping trotoar pecah dan tersumbat sedimen lumpur serta sampah daun. Setiap hujan lebih dari 20 menit, air meluap setinggi mata kaki hingga membahayakan pengguna jalan dan anak sekolah.',
    category: 'Infrastruktur',
    severity: 'high',
    status: 'under_review',
    publicationStatus: 'published',
    location: {
      latitude: -6.595038,
      longitude: 106.790422,
      address: 'Jl. Melati, Bogor Tengah',
      district: 'Bogor Tengah',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      isApproximate: false,
    },
    facilityName: 'Trotoar & Saluran Terbuka Jl. Melati',
    responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    mediaUrls: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1200&auto=format&fit=crop',
    ],
    reporterType: 'verified_citizen',
    reporterDisplayName: 'Rizky Aprianto',
    supportCount: 1240,
    isSupportedByMe: false,
    budgetContext: MOCK_BUDGET_SECTORS.drainase,
    events: [
      {
        id: 'ev-01',
        reportId: 'rep-001',
        eventType: 'SUBMITTED',
        newStatus: 'submitted',
        actorType: 'citizen',
        actorName: 'Rizky Aprianto',
        description: 'Laporan dibuat oleh warga melalui portal TITIK.',
        timestamp: '18 Oktober 2026, 09:14 WIB',
      },
      {
        id: 'ev-02',
        reportId: 'rep-001',
        eventType: 'UNDER_REVIEW',
        previousStatus: 'submitted',
        newStatus: 'under_review',
        actorType: 'moderator',
        actorName: 'Moderator TITIK (Bambang S.)',
        description:
          'Kesesuaian foto bukti, titik koordinat GPS, dan keterkaitan APBD sektor drainase telah divalidasi sistem. Menunggu penjadwalan inspeksi.',
        timestamp: '18 Oktober 2026, 11:30 WIB',
      },
    ],
    createdAt: '2026-10-18T02:14:00Z',
    updatedAt: '2026-10-18T04:30:00Z',
    isSampleData: true,
  },
  {
    id: 'rep-002',
    publicReference: 'TIK-2026-000124',
    secretFollowUpTokenHash: 'hash_secret_token_124',
    title: 'Tumpukan Sampah Liar di Radius Pasar',
    description:
      'Sampah basah dan plastik menumpuk di bahu jalan belakang pasar selama lebih dari 4 hari tanpa armada pengangkut. Bau menyengat dan mengganggu aktivitas pedagang sekitar.',
    category: 'Lingkungan',
    severity: 'medium',
    status: 'forwarded_to_institution',
    publicationStatus: 'published',
    location: {
      latitude: -6.589112,
      longitude: 106.793884,
      address: 'Jl. Dewi Sartika No. 14, Pasar Anyar',
      district: 'Bogor Tengah',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      isApproximate: false,
    },
    facilityName: 'Area Pengumpulan Sementara Pasar Anyar',
    responsibleAgency: 'Dinas Lingkungan Hidup (DLH) Kota Bogor',
    mediaUrls: [
      'https://images.unsplash.com/photo-1611288875571-0816828b693d?q=80&w=1000&auto=format&fit=crop',
    ],
    reporterType: 'anonymous',
    supportCount: 428,
    isSupportedByMe: true,
    budgetContext: MOCK_BUDGET_SECTORS.persampahan,
    events: [
      {
        id: 'ev-03',
        reportId: 'rep-002',
        eventType: 'SUBMITTED',
        newStatus: 'submitted',
        actorType: 'citizen',
        actorName: 'Warga Anonim',
        description: 'Laporan anonim terkirim via enkripsi token.',
        timestamp: '17 Oktober 2026, 14:05 WIB',
      },
      {
        id: 'ev-04',
        reportId: 'rep-002',
        eventType: 'UNDER_REVIEW',
        previousStatus: 'submitted',
        newStatus: 'under_review',
        actorType: 'moderator',
        actorName: 'Moderator TITIK',
        description: 'Verifikasi kelengkapan foto tumpukan sampah selesai.',
        timestamp: '17 Oktober 2026, 16:00 WIB',
      },
      {
        id: 'ev-05',
        reportId: 'rep-002',
        eventType: 'FORWARDED_TO_INSTITUTION',
        previousStatus: 'under_review',
        newStatus: 'forwarded_to_institution',
        actorType: 'moderator',
        actorName: 'Admin TITIK (Simulasi Rute)',
        description:
          'Catatan tiket diteruskan ke portal koordinasi DLH Kota Bogor untuk penjadwalan armada truk pengangkut.',
        timestamp: '18 Oktober 2026, 08:30 WIB',
      },
    ],
    createdAt: '2026-10-17T07:05:00Z',
    updatedAt: '2026-10-18T01:30:00Z',
    isSampleData: true,
  },
  {
    id: 'rep-003',
    publicReference: 'TIK-2026-000125',
    secretFollowUpTokenHash: 'hash_secret_token_125',
    title: 'Lampu PJU Padam di Tikungan Gelap',
    description:
      'Dua tiang lampu PJU mati total sejak 1 minggu terakhir. Area tikungan menjadi sangat gelap saat malam hari dan rawan kecelakaan motor.',
    category: 'Infrastruktur',
    severity: 'medium',
    status: 'needs_info',
    publicationStatus: 'published',
    location: {
      latitude: -6.602314,
      longitude: 106.804119,
      address: 'Jl. Pajajaran No. 88 (Dekat Bantarjati)',
      district: 'Bogor Utara',
      city: 'Kota Bogor',
      province: 'Jawa Barat',
      isApproximate: false,
    },
    facilityName: 'Koridor Penerangan Jalan Pajajaran',
    responsibleAgency: 'Dinas Perhubungan (Dishub) Kota Bogor',
    mediaUrls: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1000&auto=format&fit=crop',
    ],
    reporterType: 'verified_citizen',
    reporterDisplayName: 'Dika Setiawan',
    supportCount: 189,
    isSupportedByMe: false,
    budgetContext: MOCK_BUDGET_SECTORS.pju,
    events: [
      {
        id: 'ev-06',
        reportId: 'rep-003',
        eventType: 'SUBMITTED',
        newStatus: 'submitted',
        actorType: 'citizen',
        actorName: 'Dika Setiawan',
        description: 'Laporan diunggah dengan foto tiang malam hari.',
        timestamp: '18 Oktober 2026, 21:10 WIB',
      },
      {
        id: 'ev-07',
        reportId: 'rep-003',
        eventType: 'NEEDS_INFO',
        previousStatus: 'submitted',
        newStatus: 'needs_info',
        actorType: 'moderator',
        actorName: 'Admin TITIK',
        description:
          'Mohon tambahkan nomor seri tiang PJU (stiker kuning pada pangkal tiang) agar mempermudah teknisi lapangan.',
        timestamp: '19 Oktober 2026, 08:00 WIB',
      },
    ],
    createdAt: '2026-10-18T14:10:00Z',
    updatedAt: '2026-10-19T01:00:00Z',
    isSampleData: true,
  },
];

// =============================================================================
// SOCIAL FEED POSTS (TikTok Style Vertical Cards)
// =============================================================================

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-001',
    author: {
      id: 'usr-001',
      username: 'sahabatbogor',
      displayName: 'Rizky Aprianto',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
      bio: 'Warga Bogor pemerhati pedestrian & tata kota.',
    },
    body: 'Trotoar ini rusak dan air menggenang setiap hujan. Pejalan kaki terpaksa turun ke bahu jalan raya yang ramai.',
    postType: 'citizen_report',
    media: [
      {
        id: 'med-001',
        type: 'video',
        // High quality civic clip simulation (or video preview)
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        posterUrl:
          'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop',
        aspectRatio: '9/16',
        durationSeconds: 45,
      },
    ],
    locationTag: 'Bogor, Jawa Barat',
    relatedReportId: 'rep-001',
    relatedReport: MOCK_REPORTS[0],
    supportCount: 1240,
    isSupportedByMe: false,
    commentsCount: 342,
    sharesCount: 186,
    savesCount: 87,
    isSavedByMe: false,
    createdAt: '2 jam yang lalu',
    isSampleData: true,
  },
  {
    id: 'post-002',
    author: {
      id: 'usr-002',
      username: 'sariwulan',
      displayName: 'Sari Wulandari',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
      bio: 'Aktivis lingkungan & pegiat pilah sampah rumah tangga.',
    },
    body: 'Pemandangan di belakang Pasar Anyar pagi ini. Sudah 4 hari tumpukan belum diangkut armada. Butuh penanganan cepat DLH!',
    postType: 'citizen_report',
    media: [
      {
        id: 'med-002',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611288875571-0816828b693d?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: '1/1',
      },
    ],
    locationTag: 'Pasar Anyar, Kota Bogor',
    relatedReportId: 'rep-002',
    relatedReport: MOCK_REPORTS[1],
    supportCount: 428,
    isSupportedByMe: true,
    commentsCount: 119,
    sharesCount: 54,
    savesCount: 22,
    isSavedByMe: true,
    createdAt: '5 jam yang lalu',
    isSampleData: true,
  },
  {
    id: 'post-003',
    author: {
      id: 'usr-003',
      username: 'dikasetia',
      displayName: 'Dika Setiawan',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
    },
    body: 'Lampu PJU mati di tikungan Jl. Pajajaran. Gelap sekali dan bahaya untuk pengendara motor saat hujan deras.',
    postType: 'citizen_report',
    media: [
      {
        id: 'med-003',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: '4/3',
      },
    ],
    locationTag: 'Jl. Pajajaran, Kota Bogor',
    relatedReportId: 'rep-003',
    relatedReport: MOCK_REPORTS[2],
    supportCount: 189,
    isSupportedByMe: false,
    commentsCount: 47,
    sharesCount: 16,
    savesCount: 11,
    isSavedByMe: false,
    createdAt: '1 hari yang lalu',
    isSampleData: true,
  },
  {
    id: 'post-004',
    author: {
      id: 'usr-004',
      username: 'infobogor',
      displayName: 'Info Publik Bogor',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
    },
    body: 'Kondisi drainase utama Jl. Pajajaran yang sedang dalam pemantauan dinas. Pagu sektor mencapai Rp 38,5 Miliar.',
    postType: 'community_discussion',
    media: [
      {
        id: 'med-004',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop',
        aspectRatio: '16/9',
      },
    ],
    locationTag: 'Pajajaran KM 2, Bogor',
    relatedReportId: 'rep-001',
    relatedReport: MOCK_REPORTS[0],
    supportCount: 312,
    isSupportedByMe: false,
    commentsCount: 65,
    sharesCount: 41,
    savesCount: 19,
    isSavedByMe: false,
    createdAt: '1 hari yang lalu',
    isSampleData: true,
  },
  {
    id: 'post-005',
    author: {
      id: 'usr-005',
      username: 'budi_pejalan',
      displayName: 'Budi Santoso',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
    },
    body: 'Akses ram trotoar untuk disabilitas dan lansia yang terhalang tiang utilitas di dekat Puskesmas Bogor Tengah.',
    postType: 'citizen_report',
    media: [
      {
        id: 'med-005',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '3/4',
      },
    ],
    locationTag: 'Bogor Tengah',
    relatedReportId: 'rep-001',
    relatedReport: MOCK_REPORTS[0],
    supportCount: 524,
    isSupportedByMe: true,
    commentsCount: 88,
    sharesCount: 30,
    savesCount: 45,
    isSavedByMe: true,
    createdAt: '2 hari yang lalu',
    isSampleData: true,
  },
];

// =============================================================================
// COMMENTS (Matching reference image)
// =============================================================================

export const MOCK_COMMENTS: Record<string, { id: string; authorName: string; avatarUrl: string; body: string; timeAgo: string; likes: number }[]> = {
  'post-001': [
    {
      id: 'c-01',
      authorName: 'RizkyAprianto',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      body: 'Iya nih, setiap hujan pasti banjir di sini. Semoga segera diperbaiki 🙏',
      timeAgo: '2 jam yang lalu',
      likes: 24,
    },
    {
      id: 'c-02',
      authorName: 'SariWulandari',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      body: 'Di depan rumah saya juga sama, udah lama rusak.',
      timeAgo: '1 jam yang lalu',
      likes: 12,
    },
    {
      id: 'c-03',
      authorName: 'DikaSetiawan',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      body: 'Tolong segera ditindaklanjuti ya, ini udah bahaya buat pejalan kaki.',
      timeAgo: '45 menit yang lalu',
      likes: 8,
    },
    {
      id: 'c-04',
      authorName: 'BambangSurya',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      body: 'Kemarin ada motor hampir kepeleset pas airnya naik ke aspal.',
      timeAgo: '30 menit yang lalu',
      likes: 5,
    },
  ],
  'post-002': [
    {
      id: 'c-11',
      authorName: 'AhmadFauzi',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      body: 'Armada DLH biasanya datang jam 6 pagi, tapi 3 hari ini memang gak kelihatan lewat.',
      timeAgo: '3 jam yang lalu',
      likes: 19,
    },
    {
      id: 'c-12',
      authorName: 'NurulHidayah',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      body: 'Pedagang sayur juga terganggu banget baunya. Semoga cepat diangkut.',
      timeAgo: '2 jam yang lalu',
      likes: 14,
    },
  ],
  'post-003': [
    {
      id: 'c-21',
      authorName: 'HendroKurnia',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      body: 'Tikungan ini blind spot, bahaya banget kalau PJU padam.',
      timeAgo: '5 jam yang lalu',
      likes: 31,
    },
  ],
  'post-004': [
    {
      id: 'c-31',
      authorName: 'AgusPramono',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      body: 'PUPR sudah mulai turunkan alat berat kecil kemarin sore.',
      timeAgo: '6 jam yang lalu',
      likes: 42,
    },
  ],
};

// =============================================================================
// PUBLIC FACILITIES (For Map & Explore)
// =============================================================================

export const MOCK_FACILITIES: Facility[] = [
  {
    id: 'fac-01',
    name: 'Puskesmas Bogor Tengah',
    category: 'Kesehatan',
    address: 'Jl. Pemuda No. 34, Bogor Tengah',
    latitude: -6.586112,
    longitude: 106.797204,
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    activeReportsCount: 1,
    resolvedReportsCount: 14,
  },
  {
    id: 'fac-02',
    name: 'SDN Menteng 01 Bogor',
    category: 'Pendidikan',
    address: 'Jl. Menteng No. 12, Bogor Barat',
    latitude: -6.581903,
    longitude: 106.778942,
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    activeReportsCount: 0,
    resolvedReportsCount: 8,
  },
  {
    id: 'fac-03',
    name: 'Saluran Drainase Utama Pajajaran',
    category: 'Infrastruktur',
    address: 'Koridor Jl. Pajajaran KM 2 - KM 5',
    latitude: -6.602314,
    longitude: 106.804119,
    responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota Bogor',
    activeReportsCount: 3,
    resolvedReportsCount: 22,
  },
  {
    id: 'fac-04',
    name: 'Taman Kencana',
    category: 'Lingkungan',
    address: 'Babakan, Bogor Tengah',
    latitude: -6.590745,
    longitude: 106.801287,
    responsibleAgency: 'Dinas Perumahan dan Permukiman',
    activeReportsCount: 1,
    resolvedReportsCount: 19,
  },
];

