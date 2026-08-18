import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dekxifsxqxoljobhzraw.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla3hpZnN4cXhvbGpvYmh6cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQxOTksImV4cCI6MjEwMDkxMDE5OX0.8iczuu6qEGm9ZzTmMdjKewP3cnFHmuis7ZJNgr9x9Bw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
