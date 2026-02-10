// vite.config.js
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, 'src');

export default defineConfig({
  root: rootDir,
  // Use './' for local dev, Vercel, Netlify, etc.
  // If deploying to GitHub Pages under /git-stars/, change to base: '/git-stars/'
  base: './',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    hmr: { overlay: true },
    open: true,
    proxy: {
      '/bus': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': rootDir,
      '@agent-events': resolve(__dirname, '../../htdi-collective-agency/lib/agent-events.ts'),
    },
  },
});
