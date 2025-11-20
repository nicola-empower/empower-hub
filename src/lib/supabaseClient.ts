// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Use environment variables for the keys
// This is more secure and consistent with your other code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check that the keys exist to prevent errors
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// This creates the connection to Supabase and exports it for other files to use.
export const supabase = createClient(supabaseUrl, supabaseKey);
