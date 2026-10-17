// =============================================================================
// TITIK. — Supabase Client & Connection Validator
// Single typed Supabase client with safe fallback for unconfigured demo mode
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

const isValidHttpUrl = (str?: string): boolean => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && 
  isValidHttpUrl(supabaseUrl) && 
  supabaseAnonKey && 
  supabaseAnonKey.length > 20
);

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

export const supabase: SupabaseClient | null = clientInstance;

/**
 * Returns public URL for approved media stored in Supabase Storage.
 * If Supabase is unconfigured or path is missing, returns safe fallback.
 */
export const getPublicStorageUrl = (
  bucket: string, 
  storagePath: string
): string => {
  if (!isSupabaseConfigured || !supabase || !storagePath) {
    return '';
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
};

/**
 * Checks connectivity with the Supabase backend.
 */
export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase belum dikonfigurasi (Mode Simulasi Demo Lokal).',
    };
  }

  try {
    const { error } = await supabase.from('facilities').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Koneksi Supabase gagal: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Koneksi Supabase aktif & terverifikasi.',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Koneksi jaringan gagal: ${err.message || 'Unknown error'}`,
    };
  }
};

