// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

const rootDir = resolve(__dirname, 'src/frontend');

export default defineConfig({
  root: rootDir,
  base: './',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
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
