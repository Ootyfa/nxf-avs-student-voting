
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnghydnripsieemsvmoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZ2h5ZG5yaXBzaWVlbXN2bW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NTY4OTcsImV4cCI6MjA4NDEzMjg5N30.vv9KjCztJs7UQvzN_-9JalN5jboKjS94wABPZo__KoA';

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
