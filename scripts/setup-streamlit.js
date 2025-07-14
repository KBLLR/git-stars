#!/usr/bin/env node

/**
 * setup-streamlit.js
 *
 * This script sets up the necessary data files for the Streamlit app.
 * It ensures that data.json and other required files exist in the locations
 * expected by the Streamlit app.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const streamlitDataDir = path.join(rootDir, 'src', 'streamlit_app', 'data');

console.log('🚀 Setting up data for Streamlit app...');

// Ensure data directories exist
if (!fs.existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(streamlitDataDir)) {
  console.log('📁 Creating Streamlit data directory...');
  fs.mkdirSync(streamlitDataDir, { recursive: true });
}

// Find data.json in possible locations
const possiblePaths = [
  path.join(rootDir, 'public', 'data.json'),
  path.join(rootDir, 'src', 'frontend', 'data.json'),
  path.join(rootDir, 'data.json'),
  path.join(dataDir, 'data.json')
];

let sourceDataPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    sourceDataPath = possiblePath;
    console.log(`✅ Found data.json at ${possiblePath}`);
    break;
  }
}

if (!sourceDataPath) {
  console.error('❌ Could not find data.json in any expected location.');
  console.log('📝 Checking if we need to generate the data file...');

  // Check if generator.js exists
  const generatorPath = path.join(__dirname, 'generator.js');
  if (fs.existsSync(generatorPath)) {
    console.log('🔄 Running data generator script...');
    const { exec } = await import('child_process');
    await new Promise((resolve, reject) => {
      exec('node scripts/generator.js', { cwd: rootDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error running generator: ${error.message}`);
          reject(error);
          return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
        resolve();
      });
    });

    // Check if data.json was generated
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        sourceDataPath = possiblePath;
        console.log(`✅ Generated data.json at ${possiblePath}`);
        break;
      }
    }
  }
}

// If we still don't have a data file, create a minimal one
if (!sourceDataPath) {
  console.warn('⚠️ No data.json found. Creating a minimal template file.');
  const minimalData = [
    {
      "language": "JavaScript",
      "repos": [
        {
          "name": "example-repo",
          "description": "Example repository - please run 'npm run build:data' to generate real data",
          "author": "KBLLR",
          "stars": 0,
          "url": "https://github.com/KBLLR/git-stars",
          "date": new Date().toLocaleDateString(),
          "languages": [
            {
              "language": "JavaScript",
              "percentage": "100%"
            }
          ],
          "topics": [
            "example",
            "template"
          ],
          "license": "MIT",
          "forks": 0,
          "open_issues": 0,
          "last_updated": new Date().toLocaleDateString()
        }
      ]
    }
  ];

  sourceDataPath = path.join(dataDir, 'data.json');
  fs.writeFileSync(sourceDataPath, JSON.stringify(minimalData, null, 2));
  console.log(`✅ Created minimal data.json template at ${sourceDataPath}`);
}

// Copy data.json to all required locations
const targetPaths = [
  path.join(dataDir, 'data.json'),
  path.join(streamlitDataDir, 'data.json')
];

for (const targetPath of targetPaths) {
  if (targetPath !== sourceDataPath) {
    try {
      fs.copyFileSync(sourceDataPath, targetPath);
      console.log(`✅ Copied data.json to ${targetPath}`);
    } catch (error) {
      console.error(`❌ Error copying to ${targetPath}: ${error.message}`);
    }
  }
}

// Create required placeholder files
const filesToCreate = {
  'modules.json': {
    "modules": []
  },
  'knowledgeBase.json': []
};

for (const [filename, content] of Object.entries(filesToCreate)) {
  const targetPath = path.join(dataDir, filename);
  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, JSON.stringify(content, null, 2));
    console.log(`✅ Created placeholder ${filename}`);
  }

  // Also copy to streamlit data directory
  const streamlitTargetPath = path.join(streamlitDataDir, filename);
  fs.copyFileSync(targetPath, streamlitTargetPath);
  console.log(`✅ Copied ${filename} to Streamlit data directory`);
}

// Create a .streamlit directory if it doesn't exist
const streamlitConfigDir = path.join(rootDir, '.streamlit');
if (!fs.existsSync(streamlitConfigDir)) {
  fs.mkdirSync(streamlitConfigDir, { recursive: true });
  console.log(`✅ Created .streamlit directory`);

  // Create config.toml if it doesn't exist
  const configPath = path.join(streamlitConfigDir, 'config.toml');
  if (!fs.existsSync(configPath)) {
    const configContent = `
[theme]
primaryColor = "#ffcc00"
backgroundColor = "#222222"
secondaryBackgroundColor = "#333333"
textColor = "#ffffff"
font = "sans serif"
    `;
    fs.writeFileSync(configPath, configContent.trim());
    console.log(`✅ Created .streamlit/config.toml`);
  }
}

console.log('✨ Streamlit data setup complete!');
console.log('');
console.log('To run the Streamlit app locally:');
console.log('  npm run streamlit');
console.log('');
console.log('To deploy to Streamlit Cloud:');
console.log('  1. Push these changes to GitHub');
console.log('  2. Visit https://streamlit.io/cloud');
console.log('  3. Connect your GitHub repository');
console.log('  4. Set the path to: src/streamlit_app/app.py');
