// Supabase Configuration
// ⚠️ IMPORTANT: For production, use environment variables in .env file
// Create a .env file with:
// VITE_SUPABASE_URL=https://your-project-id.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key-here
//
// The values below are fallbacks for development only.
// In production, these should NOT be hardcoded for security reasons.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://swhdqlsqkprycyxeattj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b';

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

// Warn if using fallback values in production
if (import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️ Using hardcoded Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for production!');
}

