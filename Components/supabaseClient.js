import { createClient } from '@supabase/supabase-js';

// `process` does not exist in the browser bundle — Vite exposes env vars on
// `import.meta.env`, and only for the prefixes listed in vite.config.js.
const env = import.meta.env;

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPA_BASE_PROJECT_URL || '';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPA_BASE_API_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Creating a client with empty credentials throws, so stay null when unset and
// let the auth screen fall back to local demo sign-in.
const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export default supabase;
