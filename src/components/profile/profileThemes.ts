export const BOGOR_DISTRICTS = [
  'Bogor Tengah',
  'Bogor Timur',
  'Bogor Barat',
  'Bogor Selatan',
  'Bogor Utara',
  'Tanah Sareal',
];

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  bannerGradient: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  statBg: string;
  swatchHex: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'editorial_forest',
    name: 'Hutan Hujan Bogor',
    description: 'Hijau cemara khas alam Kota Hujan',
    bannerGradient: 'from-[#1E3A2F] via-[#2A4C3E] to-[#1E3A2F]',
    pageBg: 'bg-[#F4F6F4] dark:bg-[#0A120E]',
    cardBg: 'bg-white dark:bg-[#131C17]',
    cardBorder: 'border-[#D5DDD7] dark:border-[#1E2D25]',
    statBg: 'bg-[#EFF4F0] dark:bg-[#16221C]',
    swatchHex: '#1E3A2F',
  },
  {
    id: 'bogor_slate',
    name: 'Batu Andesit Salak',
    description: 'Batu sungai dingin Gunung Salak',
    bannerGradient: 'from-[#1E252B] via-[#2D3740] to-[#1E252B]',
    pageBg: 'bg-[#F2F4F7] dark:bg-[#0D1115]',
    cardBg: 'bg-white dark:bg-[#151B21]',
    cardBorder: 'border-[#D2D8DF] dark:border-[#222C36]',
    statBg: 'bg-[#EAEEF3] dark:bg-[#1A222A]',
    swatchHex: '#252F38',
  },
  {
    id: 'warm_terracotta',
    name: 'Bata Klasik Suryakencana',
    description: 'Terakota hangat kawasan cagar budaya',
    bannerGradient: 'from-[#3E2723] via-[#4E342E] to-[#3E2723]',
    pageBg: 'bg-[#F8F5F2] dark:bg-[#140E0C]',
    cardBg: 'bg-white dark:bg-[#1C1513]',
    cardBorder: 'border-[#E0D7D0] dark:border-[#2C211D]',
    statBg: 'bg-[#F2ECE6] dark:bg-[#231A17]',
    swatchHex: '#4E342E',
  },
  {
    id: 'midnight_charcoal',
    name: 'Malam Kebun Raya',
    description: 'Gelap arang malam dengan aksen tajam',
    bannerGradient: 'from-[#111815] via-[#16201B] to-[#111815]',
    pageBg: 'bg-[#F5F5F4] dark:bg-[#0A0D0B]',
    cardBg: 'bg-white dark:bg-[#121614]',
    cardBorder: 'border-[#DEDDD9] dark:border-[#1E2521]',
    statBg: 'bg-[#EAEAE7] dark:bg-[#171D1A]',
    swatchHex: '#141B18',
  },
  {
    id: 'vintage_paper',
    name: 'Arsip Berita Cetak',
    description: 'Nuansa kertas koran dan arsip kota',
    bannerGradient: 'from-[#2B2922] via-[#38352C] to-[#2B2922]',
    pageBg: 'bg-[#F7F5EE] dark:bg-[#12110D]',
    cardBg: 'bg-white dark:bg-[#1B1914]',
    cardBorder: 'border-[#DDD8C8] dark:border-[#2A261D]',
    statBg: 'bg-[#EFECE0] dark:bg-[#221F18]',
    swatchHex: '#333027',
  },
];

export const BANNER_PRESETS = [
  {
    id: 'kebun_raya',
    label: 'Kanopi Kebun Raya',
    url: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'salak_mist',
    label: 'Kabut Gunung Salak',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'green_valley',
    label: 'Lembah Hijau Puncak',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'night_sky',
    label: 'Langit Malam Salak',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  },
];
