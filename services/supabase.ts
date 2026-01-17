
import { createClient } from '@supabase/supabase-js';

// Access Environment Variables securely
// We use a helper with optional chaining to prevent crashes if import.meta.env is undefined
// which can happen in certain runtime environments or build configurations.
const getEnvVar = (key: string) => {
  try {
    // 1. Try Vite approach (import.meta.env)
    // Use optional chaining (?.) to avoid "undefined is not an object" error
    const viteEnv = (import.meta as any)?.env?.[key];
    if (viteEnv) return viteEnv;
    
    // 2. Try Process (Create React App / Webpack / Node)
    // Check if process is defined to avoid ReferenceError
    if (typeof process !== 'undefined' && process.env) {
      // Check for exact key or REACT_APP_ prefix
      return process.env[key] || process.env[`REACT_APP_${key.replace('VITE_', '')}`];
    }
  } catch (e) {
    console.warn('Error reading env var:', key);
  }
  return '';
};

const envUrl = getEnvVar('VITE_SUPABASE_URL');
const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Fallback to prevent crash if env vars are missing (e.g. during build or initial setup)
// Use a placeholder URL that matches Supabase format to pass validation
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseKey = envKey || 'placeholder-key';

if (!envUrl || !envKey) {
  console.warn("Supabase credentials missing! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file or Netlify settings.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkConnection = async () => {
  try {
    // Check against 'master_films' which is the main table now
    const { count, error } = await supabase.from('master_films').select('*', { count: 'exact', head: true });
    if (error) {
      console.error("Supabase connection check failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Supabase connection error:", e);
    return false;
  }
};
