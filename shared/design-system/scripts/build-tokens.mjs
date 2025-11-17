#!/usr/bin/env node
/**
 * Design Token Builder
 * Converts tokens.design.json to CSS custom properties
 *
 * Usage: node scripts/build-tokens.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "tokens.design.json");
const out = resolve(root, "src/styles/themes.css");

// Read tokens
const tokens = JSON.parse(readFileSync(src, "utf8"));

/**
 * Convert color object to CSS variable declarations
 */
function colorObjectToCss(obj, prefix = "") {
  return Object.entries(obj)
    .map(([key, value]) => `  --color-${prefix}${key}: ${value};`)
    .join("\n");
}

// Generate theme CSS
const css = `/* ==================================================
   THEMES
   Light, Dark, and High-Contrast modes
   Generated from tokens.design.json
   DO NOT EDIT MANUALLY
   ================================================== */
@layer tokens {
  /* Light theme (explicit) */
  [data-theme="light"] {
    color-scheme: light;
${colorObjectToCss(tokens.roles.color.light)}
  }

  /* Dark theme */
  [data-theme="dark"] {
    color-scheme: dark;
${colorObjectToCss(tokens.roles.color.dark)}
  }

  /* High-contrast theme (accessibility) */
  [data-theme="hc"] {
    color-scheme: dark;
${colorObjectToCss(tokens.roles.color.hc)}
  }
}
`;

// Write output
writeFileSync(out, css);
console.log(`✅ Tokens built successfully → ${out}`);
