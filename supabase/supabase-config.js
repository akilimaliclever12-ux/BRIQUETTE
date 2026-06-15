// =====================================================================
//  Supabase client initialization
//  ---------------------------------------------------------------------
//  Uses the Supabase JS SDK v2 loaded from a CDN as an ES module.
//  No npm / bundler required.
//
//  TODO: replace the two placeholder constants below with your real
//  project values (Supabase dashboard → Project Settings → API).
//  The anon/public key is safe to expose in front-end code; row level
//  security (see supabase/schema.sql) is what actually protects data.
// =====================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cpeypxsfdzafsffmydeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlweHNmZHphZnNmZm15ZGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzIzNjcsImV4cCI6MjA5NzEwODM2N30.YVAS2gHDJ-ZqFJKwvvPXnQrHzQ91bp_P6xpCu36BHCk';

// A single shared client instance used across the whole site.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handy flag so other modules can detect an unconfigured project and
// fall back gracefully instead of throwing network errors.
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
