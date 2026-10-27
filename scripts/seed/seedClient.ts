import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getTargetProjectRef(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const parts = host.split('.');
    return parts[0] || host;
  } catch {
    return 'unknown';
  }
}

export function loadSeedEnvironment(): { supabaseUrl: string; supabaseKey: string; isServiceRole: boolean } {
  // Check for .env.seed or fallback to process.env or .env
  const envSeedPath = path.resolve(process.cwd(), '.env.seed');
  if (fs.existsSync(envSeedPath)) {
    const lines = fs.readFileSync(envSeedPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: SUPABASE_URL / VITE_SUPABASE_URL tidak ditemukan di environment atau .env.seed.');
    process.exit(1);
  }

  const supabaseKey = serviceKey || anonKey;
  if (!supabaseKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_ANON_KEY tidak ditemukan.');
    process.exit(1);
  }

  const isServiceRole = Boolean(serviceKey);
  const projectRef = getTargetProjectRef(supabaseUrl);

  console.log('----------------------------------------------------');
  console.log(`🌐 TITIK. Seeding Target: [${projectRef}] (${supabaseUrl})`);
  console.log(`🔑 Auth Type: ${isServiceRole ? 'SERVICE_ROLE (Akses Penuh / Bypass RLS)' : 'ANON_KEY'}`);
  console.log('----------------------------------------------------');

  return { supabaseUrl, supabaseKey, isServiceRole };
}

let cachedClient: SupabaseClient | null = null;

export function getSeedClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const { supabaseUrl, supabaseKey } = loadSeedEnvironment();
  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}
