import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const apiPort = process.env.VITE_API_PORT || '3000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public/spa',
    emptyOutDir: true,
  },
});
