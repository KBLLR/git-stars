// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Specify the correct base path (especially important if deploying to a subdirectory)
  base: './',

  // Configure the public directory where static assets should be served from
  publicDir: resolve(__dirname, 'public'),

  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate sourcemaps for better debugging
    sourcemap: true,
  },

  // Configure server options
  server: {
    // Show overlay on errors
    hmr: { overlay: true },
    // Enable automatic opening in browser
    open: true,
  },

  // Resolve aliases for easier imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/frontend'),
    },
  },
});
