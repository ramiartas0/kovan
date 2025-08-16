import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'src/renderer/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/main': path.resolve(__dirname, 'src/main'),
      '@/renderer': path.resolve(__dirname, 'src/renderer'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/plugins': path.resolve(__dirname, 'src/plugins'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});

