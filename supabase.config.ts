// Supabase Configuration
// ⚠️ IMPORTANT: For production, use environment variables in .env file
// Create a .env file with:
// VITE_SUPABASE_URL=https://swhdqlsqkprycyxeattj.supabase.co
// VITE_SUPABASE_ANON_KEY=sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
//
// The values below are fallbacks for development only.
// In production, these should NOT be hardcoded for security reasons.

// Fallback values
const FALLBACK_URL = 'https://swhdqlsqkprycyxeattj.supabase.co';
const FALLBACK_KEY = 'sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b';

// Get environment variables, but check if they contain placeholders
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use fallback if env var is missing, undefined, empty, or contains placeholder
const SUPABASE_URL = (envUrl && !envUrl.includes('your-project-id') && envUrl !== 'undefined') 
  ? envUrl 
  : FALLBACK_URL;
const SUPABASE_ANON_KEY = (envKey && !envKey.includes('your-anon-key') && envKey !== 'undefined') 
  ? envKey 
  : FALLBACK_KEY;

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

// Warn if using fallback values in production
if (import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️ Using hardcoded Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for production!');
}

