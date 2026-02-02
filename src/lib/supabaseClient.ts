import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
// IMPORTANT: These must be set in the deployment environment (Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log for debugging (don't log the actual key)
console.log('Supabase URL:', supabaseUrl || 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

// Set up auth state change listener to keep token in sync
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  
  if (session) {
    // Update token in localStorage when session changes
    localStorage.setItem('token', session.access_token);
    localStorage.setItem('userId', session.user.id);
    localStorage.setItem('userEmail', session.user.email || '');
  } else if (event === 'SIGNED_OUT') {
    // Clear tokens on sign out
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('supabase_session');
  }
});
