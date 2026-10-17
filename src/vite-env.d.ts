/// <reference types="vite/client" />

interface ImportMetaEnv {
  // CARTO Basemaps & Platform API
  readonly VITE_CARTO_API_KEY?: string;
  readonly VITE_CARTO_STYLE?: string; // 'light_all' (Positron) or 'voyager'

  // MapTiler Fallback
  readonly VITE_MAPTILER_API_KEY?: string;

  // AI & Backend Services
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  // SIKD / Satu Data Regional API
  readonly VITE_SIKD_API_URL?: string;
  readonly VITE_SIKD_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
