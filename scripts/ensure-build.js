#!/usr/bin/env node

/**
 * ensure-build.js
 *
 * This script ensures that the build output is properly structured for deployment.
 * It creates necessary files and checks for common issues in the build.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const srcFrontendDir = path.join(rootDir, 'src', 'frontend');

console.log('🔍 Checking build output structure...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist. Run build:frontend first.');
  process.exit(1);
}

// Create .nojekyll file (prevents GitHub Pages from processing with Jekyll)
const nojekyllPath = path.join(distDir, '.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
  console.log('📝 Creating .nojekyll file...');
  fs.writeFileSync(nojekyllPath, '');
}

// Ensure index.html exists in root
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist directory.');

  // Check if it might be in a subdirectory
  const files = fs.readdirSync(distDir);
  const subdirs = files.filter(file =>
    fs.statSync(path.join(distDir, file)).isDirectory()
  );

  let found = false;
  for (const subdir of subdirs) {
    const subIndexPath = path.join(distDir, subdir, 'index.html');
    if (fs.existsSync(subIndexPath)) {
      console.log(`🔄 Moving index.html from ${subdir} to root...`);
      const indexContent = fs.readFileSync(subIndexPath, 'utf8');
      fs.writeFileSync(indexPath, indexContent);
      found = true;
      break;
    }
  }

  if (!found) {
    console.error('❌ Could not find index.html in any subdirectory.');
    process.exit(1);
  }
}

// Ensure data.json exists
const dataJsonPath = path.join(distDir, 'data.json');
if (!fs.existsSync(dataJsonPath)) {
  console.log('📝 Copying data.json to dist...');

  // Try to find data.json in various locations
  const possiblePaths = [
    path.join(rootDir, 'public', 'data.json'),
    path.join(rootDir, 'src', 'frontend', 'data.json'),
    path.join(rootDir, 'data.json')
  ];

  let dataFound = false;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      fs.copyFileSync(possiblePath, dataJsonPath);
      console.log(`✅ Copied data.json from ${possiblePath}`);
      dataFound = true;
      break;
    }
  }

  if (!dataFound) {
    console.warn('⚠️ data.json not found in any expected location.');
  }
}

// Ensure images directory exists
const imagesDistDir = path.join(distDir, 'images');
const imagesSrcDir = path.join(srcFrontendDir, 'images');

if (!fs.existsSync(imagesDistDir) && fs.existsSync(imagesSrcDir)) {
  console.log('📝 Copying images directory...');
  fs.mkdirSync(imagesDistDir, { recursive: true });

  // Copy all files from images directory
  const imageFiles = fs.readdirSync(imagesSrcDir);
  for (const file of imageFiles) {
    const srcPath = path.join(imagesSrcDir, file);
    const destPath = path.join(imagesDistDir, file);

    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`✅ Copied ${imageFiles.length} image files`);
}

// Check CSS files
const cssDir = path.join(distDir, 'css');
if (!fs.existsSync(cssDir)) {
  console.log('📝 Creating css directory...');
  fs.mkdirSync(cssDir, { recursive: true });

  // Check if css might be in assets instead
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    console.log('🔍 Looking for CSS files in assets directory...');
    // No need to copy as they should be properly referenced in the HTML
  } else {
    // Try to copy CSS files from source
    const srcCssDir = path.join(srcFrontendDir, 'css');
    if (fs.existsSync(srcCssDir)) {
      console.log('📝 Copying CSS files from source...');

      // Recursive function to copy directory
      function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);

          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      copyDir(srcCssDir, cssDir);
      console.log('✅ Copied CSS files from source');
    }
  }
}

// Final check
console.log('🔍 Final check of build structure:');
console.log(`✅ dist directory: ${fs.existsSync(distDir)}`);
console.log(`✅ .nojekyll file: ${fs.existsSync(nojekyllPath)}`);
console.log(`✅ index.html: ${fs.existsSync(indexPath)}`);
console.log(`✅ data.json: ${fs.existsSync(dataJsonPath)}`);
console.log(`✅ images directory: ${fs.existsSync(imagesDistDir) || 'N/A'}`);
console.log(`✅ css directory: ${fs.existsSync(cssDir) || 'Using assets'}`);

console.log('✨ Build structure verification complete!');
