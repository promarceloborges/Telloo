
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'node:process';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode and working directory
  // Fix: use imported cwd() to avoid type issues with process.cwd() in some environments
  const env = loadEnv(mode, cwd(), '');
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['pdfjs-dist']
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
    }
  };
});
