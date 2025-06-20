
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access the globally defined variables
const supabaseUrl = (window as any).SUPABASE_URL;
const supabaseAnonKey = (window as any).SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key must be defined in the window scope (index.html).");
  throw new Error("Supabase credentials are not configured.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
