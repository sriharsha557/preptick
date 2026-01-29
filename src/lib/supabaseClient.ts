import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mqeenbberuxzqtngkygh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZWVuYmJlcnV4enF0bmdreWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjA5MDIsImV4cCI6MjA4NTIzNjkwMn0.T3zzt3JqRYNnMgBcEehHj0qwaizCAPVPr4fTS8rt6RE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
