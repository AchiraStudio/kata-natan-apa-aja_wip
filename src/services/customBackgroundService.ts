// =============================================================================
// Custom Background Service (IndexedDB + CSS Gradient / Patterns)
// Supports HD custom image uploads without localStorage quota limits.
// Targets: 'global', 'beranda', 'pesan', 'chat'
// =============================================================================

export type BackgroundTarget = 'global' | 'beranda' | 'pesan' | 'chat';

export type PatternType = 'none' | 'dots' | 'grid' | 'topography' | 'hex' | 'lines' | 'waves';

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle?: number; // degrees for linear
  from: string;
  to: string;
  via?: string;
}

export interface BackgroundConfig {
  target: BackgroundTarget;
  mode: 'default' | 'image' | 'gradient' | 'pattern';
  imageDataUrl?: string; // Stored in IndexedDB
  gradient?: GradientConfig;
  pattern: PatternType;
  patternOpacity: number; // 0.0 - 0.5
  overlayDim: number; // 0.0 - 0.8 (black tint for high readability)
  blurAmount: number; // 0 - 16px
  updatedAt: number;
}

const DB_NAME = 'titik_custom_backgrounds_v1';
const STORE_NAME = 'backgrounds';
const DB_VERSION = 1;

/** SVG Pattern Data URIs for crisp, ultra-light vector patterns */
export const SVG_PATTERNS: Record<PatternType, string> = {
  none: '',
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
  grid: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v32H0V0zm1 1v30h30V1H1z' fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  topography: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c16.568 0 30 13.432 30 30s-13.432 30-30 30S0 46.568 0 30 13.432 0 30 0zm0 10c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20zm0 10c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10z' fill='%23ffffff' fill-opacity='0.12' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  hex: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l11 6.35 11-6.35V17.9l-11-6.35L3 17.9z' fill='%23ffffff' fill-opacity='0.18' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  lines: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
  waves: `url("data:image/svg+xml,%3Csvg width='50' height='20' viewBox='0 0 50 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c12.5 5 12.5-5 25 0s12.5 5 25 0v2c-12.5 5-12.5-5-25 0s-12.5 5-25 0v-2z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
};

/** Preset color palettes conforming to Kebun Raya Glass aesthetics */
export const GRADIENT_PRESETS: { name: string; gradient: GradientConfig }[] = [
  {
    name: 'Kebun Raya Aurora',
    gradient: { type: 'linear', angle: 135, from: '#0c281e', via: '#173f2f', to: '#061710' },
  },
  {
    name: 'Midnight Emerald',
    gradient: { type: 'linear', angle: 180, from: '#051310', via: '#0f2920', to: '#020b08' },
  },
  {
    name: 'Botanical Sage',
    gradient: { type: 'linear', angle: 140, from: '#1a3328', via: '#244537', to: '#12261e' },
  },
  {
    name: 'Sunset Terracotta',
    gradient: { type: 'linear', angle: 120, from: '#382015', via: '#261b18', to: '#150f12' },
  },
  {
    name: 'Deep Slate Minimal',
    gradient: { type: 'linear', angle: 135, from: '#151918', via: '#1e2321', to: '#0c0e0e' },
  },
  {
    name: 'Radial Bioluminescence',
    gradient: { type: 'radial', from: '#1c4535', to: '#08140f' },
  },
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'target' });
      }
    };
  });
}

/** Get background configuration for a specific target */
export async function getBackgroundConfig(target: BackgroundTarget): Promise<BackgroundConfig | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(target);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Save background configuration for a target */
export async function saveBackgroundConfig(config: BackgroundConfig): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ ...config, updatedAt: Date.now() });
    req.onsuccess = () => {
      // Broadcast change event for reactive UI updates
      window.dispatchEvent(
        new CustomEvent('titik-background-changed', {
          detail: { target: config.target, config },
        })
      );
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/** Reset background to default for a target */
export async function resetBackgroundConfig(target: BackgroundTarget): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(target);
    req.onsuccess = () => {
      window.dispatchEvent(
        new CustomEvent('titik-background-changed', {
          detail: { target, config: null },
        })
      );
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/** Convert a User File into an optimized Data URL string for IndexedDB storage */
export async function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });
}

/** Compute React inline styles for background wrapper */
export function getBackgroundInlineStyles(config: BackgroundConfig | null): React.CSSProperties {
  if (!config || config.mode === 'default') {
    return {};
  }

  let backgroundImage = '';

  if (config.mode === 'image' && config.imageDataUrl) {
    backgroundImage = `url("${config.imageDataUrl}")`;
  } else if (config.mode === 'gradient' && config.gradient) {
    const g = config.gradient;
    if (g.type === 'radial') {
      backgroundImage = `radial-gradient(circle at center, ${g.from}, ${g.to})`;
    } else {
      const angle = g.angle ?? 135;
      backgroundImage = g.via
        ? `linear-gradient(${angle}deg, ${g.from}, ${g.via}, ${g.to})`
        : `linear-gradient(${angle}deg, ${g.from}, ${g.to})`;
    }
  }

  // Combine background image / gradient with SVG pattern if requested
  if (config.pattern && config.pattern !== 'none' && SVG_PATTERNS[config.pattern]) {
    const patternUrl = SVG_PATTERNS[config.pattern];
    backgroundImage = backgroundImage ? `${patternUrl}, ${backgroundImage}` : patternUrl;
  }

  return {
    backgroundImage: backgroundImage || undefined,
    backgroundSize: config.mode === 'image' ? 'cover' : 'auto',
    backgroundPosition: 'center',
    backgroundRepeat: config.mode === 'image' ? 'no-repeat' : 'repeat',
  };
}
