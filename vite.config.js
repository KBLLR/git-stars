// vite.config.js
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, 'src/frontend');

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
        main: resolve(__dirname, 'src/frontend/index.html'),
        logs: resolve(__dirname, 'src/frontend/logs.html'),
      },
    },
  },
  server: {
    hmr: { overlay: true },
    open: true,
  },
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
});
