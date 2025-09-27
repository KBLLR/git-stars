# Git Stars - Setup Guide

This document provides detailed instructions for setting up and running the Git Stars application, which allows you to browse, filter, and organize your GitHub starred repositories.

## Overview

Git Stars is a web application that:
- Displays all your GitHub starred repositories in one place
- Allows filtering by language, tag, and license
- Provides search functionality for repository names and descriptions
- Supports sorting by various criteria
- Shows README files directly in the application
- Offers multiple visual themes

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- npm (included with Node.js)
- A GitHub account
- A GitHub Personal Access Token

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KBLLR/git-stars.git
   cd git-stars
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## GitHub Token Setup

The application requires a GitHub Personal Access Token to fetch your starred repositories.

1. Create a GitHub token:
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token"
   - Give it a name like "Git Stars App"
   - Select the following scopes: `public_repo`, `read:user`
   - Click "Generate token"
   - Copy the generated token

2. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_token_here
   USERNAME=your_github_username
   ```

## Running the Application

### Generate Repository Data

Before running the app, you need to generate the data for your starred repositories:

```bash
npm run build:data
```

This will:
- Fetch all your starred repositories from GitHub
- Extract relevant information including languages, topics, and licenses
- Save the data to `data.json` in both the project root and the frontend directory

### Start Development Server

To run the application in development mode:

```bash
npm run dev
```

This will start the Vite development server, and the application will be available at http://localhost:5173 (or another port if 5173 is in use).

## Building for Production

To build the application for production:

```bash
npm run build
```

This generates optimized files in the `dist` directory.

## Deployment

### GitHub Pages

The repository includes GitHub Actions workflows for automatic deployment to GitHub Pages:

1. Push your changes to the `main` branch
2. The GitHub Action will build and deploy the application

### Other Hosting Options

You can deploy the contents of the `dist` directory to any static hosting service:

- Netlify
- Vercel
- Firebase Hosting
- Amazon S3

## Troubleshooting

### Data Loading Error

If you see "Failed to load data" with an error about HTML not being valid JSON:

1. Make sure you've run the data generation script:
   ```bash
   npm run build:data
   ```

2. Check that `data.json` exists in the `src/frontend` directory

3. If using development mode, try these fixes:
   - Restart the development server
   - Clear your browser cache
   - Add `?debug=true` to the URL to see detailed error information

### GitHub API Rate Limiting

If you see errors related to GitHub API rate limits:

1. Make sure your GitHub token is correctly set in the `.env` file
2. Try running the data generation script with a longer delay:
   ```bash
   npm run build:data
   ```

### Other Issues

- Check the browser console for detailed error messages
- For persistent issues, try clearing your browser's local storage
- Ensure you're using a compatible browser (Chrome, Firefox, Safari, Edge)

## Advanced Configuration

To customize the application further:

### Custom Styling

Edit the theme files in `src/frontend/css/themes/` to create custom visual styles.

### Adding New Features

The main application code is in:
- `src/frontend/main.js` - Core functionality
- `src/frontend/index.html` - Main HTML structure
- `src/frontend/css/` - Styling

## License

See the [LICENSE](LICENSE) file for details.