import { FeedComment } from './adapters/types';

// =============================================================================
// CITIZEN PERSONAS (Jabodetabek Authentic Archetypes)
// =============================================================================

export type PersonaType =
  | 'ojol'
  | 'commuter'
  | 'rt_rw'
  | 'student'
  | 'warung_owner'
  | 'budget_observer';

export interface CitizenPersona {
  id: PersonaType;
  roleLabel: string;
  authorName: string;
  avatarUrl: string;
  archetypeBio: string;
  focusArea: string;
}

export const CITIZEN_PERSONAS: Record<PersonaType, CitizenPersona[]> = {
  ojol: [
    {
      id: 'ojol',
      roleLabel: 'Pengemudi Ojek Online',
      authorName: 'Bang Ocid Ojol',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Ojol senior lintas Bekasi-Jakarta, hafal jeglukan jalan.',
      focusArea: 'Kondisi aspal, kedalaman genangan, velg peyang, jalur alternatif tikus',
    },
    {
      id: 'ojol',
      roleLabel: 'Pengemudi Ojek Online',
      authorName: 'Hendra Grabbike',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Rider harian Depok-Jaksel, motor tempur shockbreaker rawan.',
      focusArea: 'Busi kerendem, lubang tergenang air, keselamatan order malam',
    },
    {
      id: 'ojol',
      roleLabel: 'Kurir Logistik Ekspedisi',
      authorName: 'Mamang Kurir Express',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Kurir paket muatan berat Tangerang-Bogor.',
      focusArea: 'Kerusakan jalan, blind spot bahaya, paket basah saat hujan',
    },
  ],
  commuter: [
    {
      id: 'commuter',
      roleLabel: 'Pekerja Komuter KRL',
      authorName: 'Dian Komuter',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Anak KRL lintas Bogor-Manggarai-Sudirman tiap jam kerja.',
      focusArea: 'Sepatu kerja basah, antrean transit, akses trotoar stasiun',
    },
    {
      id: 'commuter',
      roleLabel: 'Pengguna TransJakarta & Pejalan Kaki',
      authorName: 'Rangga Sudirman',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Pegawai kantoran SCBD, pejalan kaki koridor utama.',
      focusArea: 'JPO rusak, zebra cross, genangan trotoar, bottleneck halte busway',
    },
    {
      id: 'commuter',
      roleLabel: 'Komuter Cikarang-Jakarta',
      authorName: 'Maya KRL Pejuang Transit',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Rutin komuter lintas timur, sangat peduli kenyamanan fasilitas publik.',
      focusArea: 'Keterlambatan armada, keselamatan penerangan jalan malam, genangan stasiun',
    },
  ],
  rt_rw: [
    {
      id: 'rt_rw',
      roleLabel: 'Ketua RT Setempat',
      authorName: 'Pak RT Sutrisno',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Pengabdi warga 2 periode, aktif kawal usulan Musrenbang.',
      focusArea: 'Koordinasi lurah/camat, kebersihan selokan, mitigasi warga lansia',
    },
    {
      id: 'rt_rw',
      roleLabel: 'Pengurus RW 05',
      authorName: 'Ibu RW 05 Melati',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Penggerak posko darurat dan bank sampah lingkungan.',
      focusArea: 'Logistik warga terdampak, pengurasan lumpur gorong-gorong, posko warga',
    },
    {
      id: 'rt_rw',
      roleLabel: 'Tokoh Masyarakat',
      authorName: 'H. Murod',
      avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Sesepuh warga sekitar, vokal saat ada proyek mangkrak.',
      focusArea: 'Ketertiban lingkungan, tanggul pengaman, respons cepat dinas',
    },
  ],
  student: [
    {
      id: 'student',
      roleLabel: 'Mahasiswa Depok',
      authorName: 'Fikri UI Depok',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Mahasiswa tingkat akhir, kritis terhadap tata ruang kota.',
      focusArea: 'Trotoar ramah disabilitas, rebar mencuat, keselamatan zebra cross, satpam kampus',
    },
    {
      id: 'student',
      roleLabel: 'Mahasiswi IPB Bogor',
      authorName: 'Nadia IPB Dramaga',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Aktivis lingkungan kampus, riset drainase perkotaan.',
      focusArea: 'Resapan air, pohon rawan tumbang, sedimentasi kali, satwa liar saluran air',
    },
    {
      id: 'student',
      roleLabel: 'Pelajar & Remaja Komunitas',
      authorName: 'Bagas Pelajar Margonda',
      avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Konten kreator TikTok urban, pengamat aspal remuk gaya gen-Z.',
      focusArea: 'Estetika jalan rusak, meme infrastruktur, satire kontraktor',
    },
  ],
  warung_owner: [
    {
      id: 'warung_owner',
      roleLabel: 'Pemilik Warung Sembako',
      authorName: 'Mbak Tri Warung',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Pedagang kelontong pinggir jalan raya, terdampak langsung genangan.',
      focusArea: 'Omzet turun, etalase kecipratan air kotor, terpal gerobak robek',
    },
    {
      id: 'warung_owner',
      roleLabel: 'Pengusaha Kuliner Tenda',
      authorName: 'Pakde Kuliner',
      avatarUrl: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Jualan pecel lele malam, terganggu bau parit mampet dan jalan berdebu.',
      focusArea: 'Pelanggan sepi saat banjir, akses parkir tertutup kubangan air',
    },
    {
      id: 'warung_owner',
      roleLabel: 'Pemilik Toko Ruko',
      authorName: 'Koh Ahok Toko',
      avatarUrl: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Warga ruko veteran, langganan pasang tanggul pasir di depan pintu.',
      focusArea: 'Tanggul pembatas ruko, genangan masuk toko, kerugian barang elektronik',
    },
  ],
  budget_observer: [
    {
      id: 'budget_observer',
      roleLabel: 'Pengamat Kebijakan Publik & APBD',
      authorName: 'Kawal APBD Warga',
      avatarUrl: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Inisiatif warga pantau portal SIKD Kemendagri & LPSE daerah.',
      focusArea: 'Pagu anggaran drainase & jalan, selisih realisasi belanja, audit kontraktor',
    },
    {
      id: 'budget_observer',
      roleLabel: 'Advokat Transparansi Anggaran',
      authorName: 'Rudi Transparansi',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Pemerhati tender pengadaan barang jasa daerah Jabodetabek.',
      focusArea: 'Kualitas aspal hotmix vs spek tender, pemeliharaan rutin vs tambal sulam',
    },
    {
      id: 'budget_observer',
      roleLabel: 'Pemerhati Kota Bogor',
      authorName: 'Bogor Watch',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      archetypeBio: 'Komunitas audit anggaran publik kawasan Bogor Raya.',
      focusArea: 'Alokasi rehabilitasi saluran drainase Rp 38,5 Miliar, efektivitas belanja',
    },
  ],
};

// =============================================================================
// CATEGORY-AWARE INDONESIAN CIVIC VOCABULARY BANKS
// =============================================================================

export interface CivicVocabularyBank {
  coreTerms: string[];
  hazardKeywords: string[];
  agencyTags: Record<string, string[]>; // city -> agency handles
  satiricalIdioms: string[];
  civicDemands: string[];
  solidarityPhrases: string[];
}

export const VOCABULARY_BANKS: Record<string, CivicVocabularyBank> = {
  road_infrastructure: {
    coreTerms: [
      'lubang menganga',
      'aspal keriting',
      'besi rebar nongol',
      'velg peyang',
      'shockbreaker remuk',
      'amblas',
      'tambalan tambal-sulam',
      'marka pudar',
      'kabel semrawut',
      'PJU padam',
      'blind spot bahaya',
      'motor terperosok',
      'jalur tengkorak',
      'lapisan aspal hotmix terkelupas',
    ],
    hazardKeywords: [
      'kedalaman 15 cm ketutup air',
      'rawan kecelakaan pemotor malam',
      'pejalan kaki keserempet',
      'besi coran mencuat tajam',
      'tiang miring rawan roboh',
    ],
    agencyTags: {
      Bekasi: ['@dinaspupr_bekasi', '@dishub_bekasi', '@pemkotbekasi'],
      Depok: ['@dinaspupr_depok', '@dishubdepok', '@pemkotdepok'],
      Bogor: ['@dinaspupr_kotabogor', '@dishubkotabogor', '@pemkotbogor'],
      Jakarta: ['@dinaspupr_dki', '@dishubdkijakarta', '@dkijakarta'],
      'North Jakarta': ['@dinaspupr_dki', '@dishubdkijakarta', '@sudinpupr_jakut'],
      'East Jakarta': ['@dinaspupr_dki', '@dishubdkijakarta', '@sudinpupr_jaktim'],
      'South Jakarta': ['@dinaspupr_dki', '@dishubdkijakarta', '@sudinpupr_jaksel'],
      Tangerang: ['@dinaspupr_tangerang', '@dishub_tangerang'],
      'South Tangerang': ['@dinaspupr_tangsel', '@dishub_tangsel', '@pemkot_tangsel'],
      General: ['@dinaspupr', '@dishub', '@pln_id'],
    },
    satiricalIdioms: [
      'Selamat datang di wisata Jeglukan Seribu Lubang cabang jalan ini 😂',
      'Bisa sekalian tebar bibit lele ini mah, lumayan panen bulan depan',
      'Shockbreaker ganti tiap bulan, mending sekalian beli tank baja dah',
      'Ini aspal apa kerupuk kaleng kena kuah soto? Tipis banget tambalannya',
      'Lampu jalan mati berbulan-bulan berasa uji nyali uji nyawa tiap lewat',
    ],
    civicDemands: [
      'Pajak kendaraan bermotor tiap tahun bayar tertib, tapi aspal jalur ini gak pernah di-overlay permanen!',
      'Mana pengawasan dari dinas terkait? Jangan tunggu ada korban jiwa baru gerak!',
      'Tolong audit kontraktor pelaksana tender, baru 2 bulan ditambal udah amblas lagi!',
      'Tolong atensinya min sebelum makan korban pemotor yang lewat pas gelap!',
    ],
    solidarityPhrases: [
      'Hati-hati kawan semua, ambil lajur kanan agak pelan ya pas lewat tikungan ini.',
      'Tadi pagi udah kami pasang dahan pohon dan karung pasir biar gak ada motor nyungsep lagi.',
      'Yang mau lewat sini mending cari jalan tikus lewat perumahan sebelah, lebih aman.',
    ],
  },

  flooding_weather: {
    coreTerms: [
      'genangan sebetis',
      'banjir sedada',
      'kali meluap',
      'pompa air ngadat',
      'sedimen lumpur',
      'tanggul jebol',
      'rob pasang',
      'dorong motor mogok',
      'perahu karet',
      'busi kerendem',
      'gerobak terpal',
      'air limpasan drainase',
      'saluran air mampet',
      'pintu air siaga 1',
    ],
    hazardKeywords: [
      'arus kali cukup deras',
      'ketinggian air naik 30 cm dalam sejam',
      'akses jalan utama terputus total',
      'air masuk rumah warga lansia',
      'listrik gardu padam otomatis',
    ],
    agencyTags: {
      Jakarta: ['@dsdadkijakarta', '@bpbddkijakarta', '@dkijakarta'],
      'East Jakarta': ['@dsdadkijakarta', '@bpbddkijakarta', '@sudinsda_jaktim'],
      'South Jakarta': ['@dsdadkijakarta', '@bpbddkijakarta', '@sudinsda_jaksel'],
      'North Jakarta': ['@dsdadkijakarta', '@bpbddkijakarta', '@sudinsda_jakut'],
      Tangerang: ['@bpbdtangerangkota', '@dinaspupr_tangerang', '@pemkot_tangerang'],
      'South Tangerang': ['@bpbd_tangsel', '@dsda_tangsel'],
      Bogor: ['@bpbd_kotabogor', '@dinaspupr_kotabogor', '@pemkotbogor'],
      Bekasi: ['@bpbd_kotabekasi', '@dinaspupr_bekasi', '@pemkotbekasi'],
      Depok: ['@bpbd_kotadepok', '@dinaspupr_depok'],
      General: ['@dsdadkijakarta', '@bpbddkijakarta', '@bmkg_indonesia'],
    },
    satiricalIdioms: [
      'Udah siap dayung perahu karet nih min, waterpark gratis tahunan hadir kembali 🛶',
      'Sepatu kerja basah kuyup, masuk kantor udah berasa abis nyebrang selat sunda',
      'Gerimis 15 menit tapi genangan serasa waterboom, drainase mikro kemana larinya?',
      'Banjir rob datang lagi, ojol udah kayak nahkoda kapal pesiar bawa penumpang 😂',
    ],
    civicDemands: [
      'Mana realisasi pagu anggaran rehabilitasi drainase puluhan miliar? Kenapa pompa stasioner ngadat lagi?!',
      'Segera operasikan pompa portabel dan bersihkan sedimen lumpur yang bikin air meluap!',
      'Mohon tim BPBD dan perahu karet standby untuk evakuasi warga dan lansia di gang dalam!',
      'Pintu air tolong segera dibuka dan koordinasikan pintu air hilir sebelum malam!',
    ],
    solidarityPhrases: [
      'Warga terdampak yang butuh tempat evakuasi atau cas HP, masjid RT 03 sudah buka posko hangat.',
      'Kuat ya bapak ibu semua, tim relawan dan Karang Taruna sudah mulai sebar nasi bungkus.',
      'Pemotor jangan nekat terobos genangan ya, filter karbu sama busi pasti kena kalau dipaksa.',
    ],
  },

  traffic_transit: {
    coreTerms: [
      'macet horor',
      'bottleneck',
      'angkot ngetem',
      'pak ogah',
      'trotoar diokupasi',
      'jalur busway diserobot',
      'antrean mengular',
      'transit stasiun krl chaos',
      'headway molor',
      'lampu merah eror',
      'penyempitan lajur proyek',
    ],
    hazardKeywords: [
      'kendaraan terkunci di persimpangan',
      'pejalan kaki harus turun ke aspal jalan raya',
      'klakson bersahut-sahutan bikin stres',
      'penumpang KRL menumpuk di peron',
    ],
    agencyTags: {
      Jakarta: ['@dishubdkijakarta', '@pt_transjakarta', '@commuterline', '@tmcpoldametro'],
      Bekasi: ['@dishub_bekasi', '@polresmetrobekasikota'],
      Depok: ['@dishubdepok', '@polresmetrodepok'],
      Bogor: ['@dishubkotabogor', '@bptj_kemenhub'],
      Tangerang: ['@dishub_tangerang', '@polrestro_tangerang'],
      General: ['@dishub', '@tmcpoldametro', '@commuterline'],
    },
    satiricalIdioms: [
      'Macetnya gak ngotak, bisa ditinggal masak rendang dulu ini mah 🥩',
      'Angkot ngetem 3 baris udah kayak parade agustusan, polisi kemana ya?',
      'Trotoar lebar tapi buat parkir motor sama gerobak, pejalan kaki terbang aja apa?',
    ],
    civicDemands: [
      'Tolong tertibkan angkot ngetem sembarangan dan pak ogah yang bikin macet horor tiap sore!',
      'Dishub tolong tempatkan petugas pengatur lalu lintas di titik bottleneck ini!',
      'Jalur busway dan trotoar wajib steril, keselamatan pejalan kaki harus diutamakan!',
    ],
    solidarityPhrases: [
      'Sabar ya teman-teman pejuang komuter, istirahat sejenak di warung kopi terdekat dulu.',
      'Tetap tertib dan jangan saling serobot, keselamatan bersama jauh lebih penting.',
    ],
  },

  waste_environment: {
    coreTerms: [
      'tumpukan sampah 4 hari',
      'bau menyengat',
      'armada DLH gak lewat',
      'TPS liar',
      'lalat hijau',
      'saluran drainase mampet sampah plastik',
      'air lindi hitam',
      'puntung & styrofoam',
      'kali penuh sampah',
    ],
    hazardKeywords: [
      'bau busuk masuk ke pemukiman dan sekolah',
      'lalat mengerubungi warung makan',
      'sampah menyumbat mulut gorong-gorong',
    ],
    agencyTags: {
      Jakarta: ['@dlh_jakarta', '@dkijakarta'],
      Bogor: ['@dlh_kotabogor', '@pemkotbogor'],
      Bekasi: ['@dlh_kotabekasi', '@pemkotbekasi'],
      Depok: ['@dlh_depok', '@pemkotdepok'],
      Tangerang: ['@dinaslhk_tangerang', '@pemkot_tangerang'],
      General: ['@dinaslingkunganhidup', '@kebersihankota'],
    },
    satiricalIdioms: [
      'Aromanya semerbak nusantara menusuk hidung sampai masker dobel tembus 🤢',
      'Gunung sampah gratis tanpa perlu naik gunung beneran, pemandangan estetik abis',
    ],
    civicDemands: [
      'Armada truk sampah tolong segera dijadwalkan angkut, sudah menumpuk 4 hari!',
      'Tolong tindak tegas pembuang sampah liar di bantaran kali dan pasang jaring pengaman!',
    ],
    solidarityPhrases: [
      'Hari Minggu ini warga RT siap kerja bakti bareng bersihkan sisa sumbatan gorong-gorong.',
      'Mari saling jaga kebersihan lingkungan, jangan buang bungkusan plastik ke saluran air.',
    ],
  },
};

// =============================================================================
// DISCUSSION TONES & TEMPLATES
// =============================================================================

export type DiscussionTone =
  | 'urgent_alert'
  | 'civic_demand'
  | 'solidarity'
  | 'satirical_commentary'
  | 'official_tagging';

export const DISCUSSION_TONES: DiscussionTone[] = [
  'urgent_alert',
  'civic_demand',
  'solidarity',
  'satirical_commentary',
  'official_tagging',
];

// Simple deterministic Mulberry32 PRNG for reproducible test runs
function createPrng(seed: number) {
  let s = Math.abs(seed) || 123456789;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  const s = str || 'seed';
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) || 987654321;
}

/**
 * Normalizes input category to one of the 4 primary vocabulary bank keys.
 */
export function normalizeCategory(category: string): keyof typeof VOCABULARY_BANKS {
  const lower = (category || '').toLowerCase();
  if (
    lower.includes('road') ||
    lower.includes('jalan') ||
    lower.includes('infrastruktur') ||
    lower.includes('pju') ||
    lower.includes('trotoar') ||
    lower.includes('rebar') ||
    lower.includes('lubang')
  ) {
    return 'road_infrastructure';
  }
  if (
    lower.includes('flood') ||
    lower.includes('banjir') ||
    lower.includes('weather') ||
    lower.includes('cuaca') ||
    lower.includes('genangan') ||
    lower.includes('rob') ||
    lower.includes('drainase')
  ) {
    return 'flooding_weather';
  }
  if (
    lower.includes('traffic') ||
    lower.includes('macet') ||
    lower.includes('transit') ||
    lower.includes('transportasi') ||
    lower.includes('krl')
  ) {
    return 'traffic_transit';
  }
  if (
    lower.includes('waste') ||
    lower.includes('sampah') ||
    lower.includes('lingkungan') ||
    lower.includes('kebersihan')
  ) {
    return 'waste_environment';
  }
  return 'road_infrastructure';
}

/**
 * Resolves agency tags for a city and category.
 */
function resolveAgencyTags(bank: CivicVocabularyBank, city: string): string[] {
  const safeCity = (city || '').toLowerCase();
  if (bank.agencyTags[city]) {
    return bank.agencyTags[city];
  }
  for (const key of Object.keys(bank.agencyTags)) {
    if (safeCity.includes(key.toLowerCase())) {
      return bank.agencyTags[key];
    }
  }
  return bank.agencyTags['General'] || ['@dinas_terkait'];
}

export interface GenerateCommentOptions {
  postId: string;
  category: string;
  city: string;
  urgency?: 'CRITICAL' | 'MEDIUM' | 'LOW/VIBE' | 'LOW' | 'HIGH' | string;
  count?: number; // 15–30
  seed?: number;
  postCaption?: string;
  locationTag?: string;
}

const INDONESIAN_TIME_AGOS = [
  '5 menit yang lalu',
  '12 menit yang lalu',
  '24 menit yang lalu',
  '38 menit yang lalu',
  '50 menit yang lalu',
  '1 jam yang lalu',
  '2 jam yang lalu',
  '3 jam yang lalu',
  '4 jam yang lalu',
  '5 jam yang lalu',
  '6 jam yang lalu',
  '7 jam yang lalu',
  '8 jam yang lalu',
  '10 jam yang lalu',
  '12 jam yang lalu',
  '14 jam yang lalu',
  '16 jam yang lalu',
  '18 jam yang lalu',
  '1 hari yang lalu',
  '2 hari yang lalu',
];

/**
 * Builds realistic citizen comment text incorporating authentic Indonesian civic
 * vocabulary, selected persona perspective, tone, and agency handles.
 */
function composeCommentText(
  persona: CitizenPersona,
  bankKey: keyof typeof VOCABULARY_BANKS,
  bank: CivicVocabularyBank,
  tone: DiscussionTone,
  city: string,
  random: () => number
): string {
  const agencyList = resolveAgencyTags(bank, city);
  const agencyTag = agencyList[Math.floor(random() * agencyList.length)];
  const coreTerm = bank.coreTerms[Math.floor(random() * bank.coreTerms.length)];

  switch (tone) {
    case 'urgent_alert': {
      if (persona.id === 'ojol') {
        return `AWAS kawan ojol & pemotor! Jalur ini ada ${coreTerm}, tadi rekan saya velg peyang parah. Kalau lewat pas malam atau hujan jangan ngebut!`;
      }
      if (persona.id === 'commuter') {
        return `Perhatian buat pejalan kaki & komuter, ${coreTerm} bikin akses tertutup. Sepatu kerja bisa basah kuyup kalau nekat lewat.`;
      }
      if (persona.id === 'rt_rw') {
        return `Waspada warga sekitar, ${coreTerm} makin parah. Pengurus RT imbau hati-hati terutama anak-anak dan lansia.`;
      }
      return `Hati-hati semua yang melintas, ${coreTerm} ini bahaya banget kalau gak kelihatan dari jauh!`;
    }

    case 'civic_demand': {
      if (persona.id === 'budget_observer') {
        return `Di portal SIKD ada pagu anggaran infrastruktur puluhan miliar, tapi kenapa ${coreTerm} dibiarkan berlarut-larut? Kontraktor wajib diaudit ini!`;
      }
      if (persona.id === 'warung_owner') {
        return `Pajak retribusi bayar terus tiap bulan, tapi gara-gara ${coreTerm} toko jadi sepi pembeli. Mohon ${agencyTag} segera turun tangan!`;
      }
      if (persona.id === 'student') {
        return `Udah 2026 tapi kualitas penanganan masih begini. ${coreTerm} cuma dikasih tanda seadanya, tolong dong ${agencyTag} kerja nyata!`;
      }
      return `Jangan nunggu ada korban jiwa baru ditindak! ${coreTerm} ini jelas tanggung jawab ${agencyTag}, segera perbaiki!`;
    }

    case 'satirical_commentary': {
      const satire = bank.satiricalIdioms[Math.floor(random() * bank.satiricalIdioms.length)];
      return `${satire} Apalagi pas ada ${coreTerm}, lengkap sudah derita warga harian.`;
    }

    case 'solidarity': {
      const phrase = bank.solidarityPhrases[Math.floor(random() * bank.solidarityPhrases.length)];
      if (persona.id === 'rt_rw') {
        return `${phrase} Kami dari pengurus lingkungan siap gotong royong dan koordinasi bantuan.`;
      }
      return `${phrase} Tetap utamakan keselamatan ya kawan-kawan saat melewati area ${coreTerm}.`;
    }

    case 'official_tagging': {
      const secondaryAgency = agencyList[(agencyList.indexOf(agencyTag) + 1) % agencyList.length];
      return `Mohon atensi cepat min ${agencyTag} & ${secondaryAgency}, titik ${coreTerm} ini sangat mendesak ditangani sebelum makin parah.`;
    }

    default:
      return `Semoga segera ada tindak lanjut perbaikan untuk ${coreTerm} ini demi keselamatan kita bersama.`;
  }
}

/**
 * Builds authentic threaded sub-replies that directly address parent comment themes.
 */
function composeSubReplyText(
  parentComment: FeedComment,
  persona: CitizenPersona,
  _bankKey: keyof typeof VOCABULARY_BANKS,
  bank: CivicVocabularyBank,
  city: string,
  random: () => number
): string {
  const agencyList = resolveAgencyTags(bank, city);
  const agencyTag = agencyList[0] || '@dinaspupr';
  const parentAuthor = parentComment.authorName;
  const pick = random() > 0.5 ? 1 : 0;

  if (persona.id === 'ojol') {
    return pick === 1
      ? `@${parentAuthor.replace(/\s+/g, '')} Betul banget bang, tadi sore saya baru lewat sana bawa penumpang, shockbreaker remuk kena hentakan keras. Makasih infonya!`
      : `@${parentAuthor.replace(/\s+/g, '')} Izin nambahin bang, yang bawa motor matic hati-hati di sisi kiri, velg peyang rawan banget kalau kejeblos lubang menganga itu.`;
  }
  if (persona.id === 'rt_rw') {
    return pick === 1
      ? `@${parentAuthor.replace(/\s+/g, '')} Terimakasih atas laporannya warga. Ini sudah kami teruskan ke pihak kelurahan dan camat untuk prioritas Musrenbang darurat.`
      : `@${parentAuthor.replace(/\s+/g, '')} Laporan dicatat ya warga. Kami dari RT setempat akan pasang rambu darurat dulu sambil tunggu tindakan dinas terkait.`;
  }
  if (persona.id === 'budget_observer') {
    return pick === 1
      ? `@${parentAuthor.replace(/\s+/g, '')} Sepakat! Kami catat titik koordinat ini untuk dicocokkan dengan laporan realisasi APBD tahun anggaran berjalan. Jangan sampai ada markup.`
      : `@${parentAuthor.replace(/\s+/g, '')} Tepat sekali. Kami dorong dewan komisi pembangunan untuk sidak langsung ke lapangan meninjau kualitas perbaikan ini.`;
  }
  if (persona.id === 'warung_owner') {
    return pick === 1
      ? `@${parentAuthor.replace(/\s+/g, '')} Bener kak, warung saya di dekat sini kena imbasnya, pembeli pada muter balik. Tolong ditanggapi ya ${agencyTag}.`
      : `@${parentAuthor.replace(/\s+/g, '')} Iya kak, debu dan lumpurnya sampai masuk ke terpal depan warung. Semoga dinas cepat beresin.`;
  }
  if (persona.id === 'student') {
    return pick === 1
      ? `@${parentAuthor.replace(/\s+/g, '')} Valid banget infonya. Kemarin lewat situ juga kaget besi rebar nongol gitu aja tanpa pembatas pengaman.`
      : `@${parentAuthor.replace(/\s+/g, '')} Setuju kak! Jalur pejalan kaki makin gak manusiawi kalau fasilitas dasarnya diabaikan terus.`;
  }
  return pick === 1
    ? `@${parentAuthor.replace(/\s+/g, '')} Makasih update terbarunya kak, sangat membantu warga komuter yang mau pulang kerja sore ini.`
    : `@${parentAuthor.replace(/\s+/g, '')} Sangat informatif kak, saya infokan juga ke grup warga perumahan sebelah biar waspada.`;
}

// =============================================================================
// SEED COMMENTS GENERATOR
// =============================================================================

/**
 * Pre-generates 15–30 distinct, rich comments per seed post with realistic
 * author profiles, avatars, likes, timestamps, and threaded sub-replies.
 */
export function generateSeedComments(options: GenerateCommentOptions): FeedComment[] {
  const { postId, city } = options;
  const categoryKey = normalizeCategory(options.category);
  const bank = VOCABULARY_BANKS[categoryKey];

  // Target count: clamped between 15 and 30 (default 20)
  const rawCount = Number.isFinite(options.count) ? options.count! : 20;
  const targetCount = Math.max(15, Math.min(30, rawCount));

  // Deterministic seed for reproducible testing and hydrating
  const seed = options.seed ?? stringToSeed(postId);
  const random = createPrng(seed);

  const personaKeys: PersonaType[] = [
    'ojol',
    'commuter',
    'rt_rw',
    'student',
    'warung_owner',
    'budget_observer',
  ];

  const generatedComments: FeedComment[] = [];

  // Generate top-level comments first (targetCount - 3 to leave room for at least 2-3 threaded sub-replies)
  const subReplyCount = Math.min(4, Math.max(2, Math.floor(targetCount * 0.15)));
  const topLevelCount = targetCount - subReplyCount;

  for (let i = 0; i < topLevelCount; i++) {
    // Ensure all 6 personas get balanced rotation
    const personaType = personaKeys[i % personaKeys.length];
    const personaPool = CITIZEN_PERSONAS[personaType];
    const persona = personaPool[Math.floor(random() * personaPool.length)];

    // Tone cycle
    const tone = DISCUSSION_TONES[i % DISCUSSION_TONES.length];

    const body = composeCommentText(persona, categoryKey, bank, tone, city, random);
    const timeAgo = INDONESIAN_TIME_AGOS[Math.min(i, INDONESIAN_TIME_AGOS.length - 1)];
    const likes = Math.floor(random() * 85) + 3;

    generatedComments.push({
      id: `c-${postId}-${String(i + 1).padStart(2, '0')}`,
      authorName: persona.authorName,
      avatarUrl: persona.avatarUrl,
      body,
      timeAgo,
      likes,
    });
  }

  // Generate at least 2 threaded sub-replies pointing to existing parent comments
  for (let j = 0; j < subReplyCount; j++) {
    // Select parent from the first few top-level comments
    const parentIndex = j % Math.min(topLevelCount, 4);
    const parentComment = generatedComments[parentIndex];

    // Select a complementary persona different from parent if possible
    const personaType = personaKeys[(parentIndex + j + 2) % personaKeys.length];
    const personaPool = CITIZEN_PERSONAS[personaType];
    const persona = personaPool[Math.floor(random() * personaPool.length)];

    const subReplyBody = composeSubReplyText(
      parentComment,
      persona,
      categoryKey,
      bank,
      city,
      random
    );
    const timeAgo = INDONESIAN_TIME_AGOS[Math.max(0, parentIndex - 1)];
    const likes = Math.floor(random() * 35) + 2;

    generatedComments.push({
      id: `c-${postId}-reply-${j + 1}`,
      authorName: persona.authorName,
      avatarUrl: persona.avatarUrl,
      body: subReplyBody,
      timeAgo,
      likes,
      parentId: parentComment.id,
    });
  }

  return generatedComments;
}

// =============================================================================
// DYNAMIC RUNTIME CONTEXTUAL REPLY GENERATOR
// =============================================================================

/**
 * Dynamically generates an authentic citizen reply to user input at runtime,
 * simulating contextual dialogue in the bottom sheet.
 */
export async function generateContextualReply(
  postId: string,
  category: string,
  userCommentBody: string
): Promise<FeedComment> {
  // Simulate minimal async response time
  await new Promise((resolve) => setTimeout(resolve, 80));

  const lower = (userCommentBody || '').toLowerCase();
  const bankKey = normalizeCategory(category);
  const bank = VOCABULARY_BANKS[bankKey];

  let chosenPersona: CitizenPersona;
  let replyBody: string;

  if (
    lower.includes('lurah') ||
    lower.includes('camat') ||
    lower.includes('rt') ||
    lower.includes('rw') ||
    lower.includes('warga') ||
    lower.includes('posko')
  ) {
    chosenPersona = CITIZEN_PERSONAS.rt_rw[0];
    replyBody = `Laporan dari warga sudah kami catat untuk diteruskan ke pihak kelurahan dan grup koordinasi tanggap wilayah. Tetap jaga keselamatan bersama ya.`;
  } else if (
    lower.includes('apbd') ||
    lower.includes('anggaran') ||
    lower.includes('korupsi') ||
    lower.includes('pagu') ||
    lower.includes('mark up') ||
    lower.includes('audit') ||
    lower.includes('tender') ||
    lower.includes('lpse')
  ) {
    chosenPersona = CITIZEN_PERSONAS.budget_observer[0];
    replyBody = `Terima kasih suaranya kak! Kami dari tim pemantau warga sedang mencocokkan laporan ini dengan pagu anggaran dinas terkait. Keterbukaan publik mutlak diperjuangkan.`;
  } else if (
    lower.includes('lubang') ||
    lower.includes('peyang') ||
    lower.includes('motor') ||
    lower.includes('jatuh') ||
    lower.includes('rusak') ||
    lower.includes('shockbreaker')
  ) {
    chosenPersona = CITIZEN_PERSONAS.ojol[0];
    replyBody = `Bener banget kak! Kami para ojol tiap hari lewat sini was-was velg peyang. Makasih udah bantu angkat suara di feed ini, semoga segera diaspal permanen.`;
  } else if (
    lower.includes('banjir') ||
    lower.includes('genangan') ||
    lower.includes('sepatu') ||
    lower.includes('hujan') ||
    lower.includes('air') ||
    lower.includes('pompa')
  ) {
    chosenPersona = CITIZEN_PERSONAS.commuter[0];
    replyBody = `Setuju kak, tiap hujan turun selalu deg-degan sepatu kerja basah kuyup. Semoga pompa stasioner dan petugas segera tiba di lokasi untuk percepat pengeringan.`;
  } else if (
    lower.includes('wkwk') ||
    lower.includes('lucu') ||
    lower.includes('haha') ||
    lower.includes('lele') ||
    lower.includes('wisata')
  ) {
    chosenPersona = CITIZEN_PERSONAS.student[2];
    replyBody = `Wkwkwk bener banget kak! Udah jadi wahana uji ketangkasan berkendara khas Jabodetabek ini mah 😂`;
  } else {
    // Default contextual citizen engagement
    const defaultTerm = bank.coreTerms[0] || 'kondisi ini';
    chosenPersona = CITIZEN_PERSONAS.commuter[1];
    replyBody = `Terima kasih atas perhatiannya kawan warga. Mari terus kita viralkan agar ${defaultTerm} ini lekas ditangani pemerintah daerah.`;
  }

  return {
    id: `c-dyn-${postId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    authorName: chosenPersona.authorName,
    avatarUrl: chosenPersona.avatarUrl,
    body: replyBody,
    timeAgo: 'Baru saja',
    likes: 1,
  };
}
