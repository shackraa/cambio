import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve ANON_KEY eksik! .env dosyasını kontrol et.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type { Database };
