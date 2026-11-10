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
  /** Two stops of the cover gradient shown when the profile has no cover photo. */
  bannerFrom: string;
  bannerTo: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'editorial_forest',
    name: 'Hutan Hujan Bogor',
    description: 'Hijau cemara khas alam Kota Hujan',
    bannerGradient: 'from-brand-soft via-[#2A4C3E] to-brand-soft',
    pageBg: 'bg-surface dark:bg-[#0A120E]',
    cardBg: 'bg-surface dark:bg-[#131C17]',
    cardBorder: 'border-line dark:border-[#1E2D25]',
    statBg: 'bg-surface dark:bg-[#16221C]',
    swatchHex: '#1E3A2F',
    bannerFrom: '#14301f',
    bannerTo: '#3b7a56',
  },
  {
    id: 'bogor_slate',
    name: 'Batu Andesit Salak',
    description: 'Batu sungai dingin Gunung Salak',
    bannerGradient: 'from-surface via-[#2D3740] to-surface',
    pageBg: 'bg-surface-2 dark:bg-[#0D1115]',
    cardBg: 'bg-surface dark:bg-[#151B21]',
    cardBorder: 'border-line dark:border-[#222C36]',
    statBg: 'bg-surface-2 dark:bg-[#1A222A]',
    swatchHex: '#252F38',
    bannerFrom: '#252f38',
    bannerTo: '#5b6f7e',
  },
  {
    id: 'warm_terracotta',
    name: 'Bata Klasik Suryakencana',
    description: 'Terakota hangat kawasan cagar budaya',
    bannerGradient: 'from-[#3E2723] via-[#4E342E] to-[#3E2723]',
    pageBg: 'bg-canvas dark:bg-[#140E0C]',
    cardBg: 'bg-surface dark:bg-[#1C1513]',
    cardBorder: 'border-line dark:border-[#2C211D]',
    statBg: 'bg-surface-2 dark:bg-[#231A17]',
    swatchHex: '#4E342E',
    bannerFrom: '#3e2723',
    bannerTo: '#9a5236',
  },
  {
    id: 'midnight_charcoal',
    name: 'Malam Kebun Raya',
    description: 'Gelap arang malam dengan aksen tajam',
    bannerGradient: 'from-canvas via-[#16201B] to-canvas',
    pageBg: 'bg-surface dark:bg-[#0A0D0B]',
    cardBg: 'bg-surface dark:bg-[#121614]',
    cardBorder: 'border-surface-2 dark:border-[#1E2521]',
    statBg: 'bg-surface-2 dark:bg-[#171D1A]',
    swatchHex: '#141B18',
    bannerFrom: '#0f1a14',
    bannerTo: '#2b4438',
  },
  {
    id: 'vintage_paper',
    name: 'Arsip Berita Cetak',
    description: 'Nuansa kertas koran dan arsip kota',
    bannerGradient: 'from-[#2B2922] via-[#38352C] to-[#2B2922]',
    pageBg: 'bg-canvas dark:bg-[#12110D]',
    cardBg: 'bg-surface dark:bg-[#1B1914]',
    cardBorder: 'border-line dark:border-[#2A261D]',
    statBg: 'bg-surface-2 dark:bg-[#221F18]',
    swatchHex: '#333027',
    bannerFrom: '#2b2922',
    bannerTo: '#76704f',
  },
];

export function getProfileTheme(id?: string | null): ThemeOption {
  return THEME_OPTIONS.find((t) => t.id === id) || THEME_OPTIONS[0];
}

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
