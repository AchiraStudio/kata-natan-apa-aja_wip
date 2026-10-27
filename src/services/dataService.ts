import { SupabaseDataAdapter } from './adapters/supabaseAdapter';
import { MockDataAdapter } from './adapters/mockAdapter';
import { IDataAdapter } from './adapters/types';
import { isSupabaseConfigured } from './supabaseClient';

const isLiveMode = isSupabaseConfigured && import.meta.env.VITE_DATA_MODE !== 'demo';

// Global singleton data service: Truthful Supabase in live mode, Mock strictly in demo mode
export const dataService: IDataAdapter = isLiveMode
  ? new SupabaseDataAdapter()
  : new MockDataAdapter();
