// Supabase Configuration
// ⚠️ IMPORTANT: For production, use environment variables in .env file
// Create a .env file with:
// VITE_SUPABASE_URL=https://your-project-id.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key-here
//
// The values below are fallbacks for development only.
// In production, these should NOT be hardcoded for security reasons.

// Get environment variables (Vite replaces these at build time)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values (use actual project credentials)
const FALLBACK_URL = 'https://swhdqlsqkprycyxeattj.supabase.co';
const FALLBACK_KEY = 'sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b';

// Use environment variables if available, otherwise use fallback
const SUPABASE_URL = envUrl && envUrl !== 'your-project-id.supabase.co' 
  ? envUrl 
  : FALLBACK_URL;
const SUPABASE_ANON_KEY = envKey && envKey !== 'your-anon-key-here'
  ? envKey
  : FALLBACK_KEY;

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

// Warn if using fallback values in production
if (import.meta.env.PROD && (!envUrl || envUrl === 'your-project-id.supabase.co')) {
  console.warn('⚠️ Using fallback Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables for production!');
  console.warn('Current URL:', SUPABASE_URL);
}

// Validate configuration
if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-id')) {
  console.error('❌ Invalid Supabase URL. Please set VITE_SUPABASE_URL environment variable.');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon-key')) {
  console.error('❌ Invalid Supabase key. Please set VITE_SUPABASE_ANON_KEY environment variable.');
}

