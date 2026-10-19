import { SupabaseDataAdapter } from './adapters/supabaseAdapter';
import { IDataAdapter } from './adapters/types';

// Global singleton data service
export const dataService: IDataAdapter = new SupabaseDataAdapter();

