import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
// IMPORTANT: These must be set in the deployment environment (Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please set it in your .env file or deployment environment.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please set it in your .env file or deployment environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
