
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Injecting the provided API Key
      'process.env.API_KEY': JSON.stringify('AIzaSyCkJKhjAbhmWlVOtgJktKhyRlHTzt68Ofs'),
    },
  };
});
