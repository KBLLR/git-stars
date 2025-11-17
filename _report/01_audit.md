# Audit Report: git-stars Deployment Infrastructure

**Date**: 2025-11-17
**Focus**: Hosting configuration and deployment setup
**Scope**: Vercel + GitHub Pages dual deployment

## Repository Overview

**Repository**: KBLLR/git-stars
**Purpose**: GitHub starred repository browser and organizer
**Current Stack**: Node.js 18+, Vite 5, JavaScript ESM
**Build Tool**: Vite (static output to `dist/`)
**Total Stars Tracked**: ~2,171 repositories

## Codebase Structure

```
git-stars/
├── scripts/
│   ├── generator.js          [Primary data generator - 447 LOC]
│   ├── stargazed.js           [Simple README generator - 92 LOC]
│   ├── generateChartUrl.js    [Chart generation utility]
│   ├── setup-streamlit.js     [Streamlit setup]
│   └── ensure-build.js        [Build verification]
├── src/
│   ├── frontend/
│   │   └── main.js            [Frontend app logic]
│   └── streamlit_app/
│       ├── app.py             [Streamlit UI]
│       └── utils.py           [Data loading utilities - 309 LOC]
├── .github/workflows/
│   ├── main.yml               [Daily README updates]
│   ├── gh-pages.yml           [Deployment]
│   └── stargazed.yml          [Legacy workflow]
└── public/                    [Build output]
```

## Dependency Map

### JavaScript Dependencies
- `@octokit/rest` → GitHub API client
- `p-queue` → Rate limiting for API calls
- `vite` → Frontend build tool
- `dotenv` → Environment configuration
- `commander` → CLI argument parsing
- `marked` → Markdown parsing

### Python Dependencies
- `streamlit` → Alternative UI framework

## Current Deployment Status

### GitHub Pages (Existing)
- ✅ Workflow: `.github/workflows/gh-pages.yml`
- ✅ Deploy target: `dist/` directory
- ✅ Token: Uses `secrets.GITHUB_TOKEN`
- ✅ Trigger: Push to `main` branch
- ⚠️ Uses older Actions versions (v2, v3)
- ⚠️ Node 18.x (should update to 20)
- ⚠️ Permissions: Only `contents: write`

### Vercel (Missing)
- ❌ No `vercel.json` configuration
- ❌ No Vercel deployment workflow
- ❌ No `VERCEL_TOKEN` secret configured
- ❌ No Vercel project linked

## Hosting Feasibility

### Static Export Compatibility: ✅ FEASIBLE

**Analysis:**
- Vite config outputs to `dist/` as static files
- Build process: `npm run build:frontend` + `npm run build:data`
- Multi-page app (index.html, logs.html) - no SPA routing issues
- Data generated at build time (data.json)
- No server-side rendering required
- All assets properly bundled

**Conclusion:** Project is 100% compatible with static hosting on both Vercel and GitHub Pages

## Build Process Analysis

### Current Build Flow
```bash
npm run build
  ├─> npm run build:frontend  # Vite build
  └─> npm run build:data      # GitHub API fetch → data.json
```

### Build Dependencies
1. **GITHUB_TOKEN** (critical): Required by `scripts/generator.js:14`
   - Used for: Octokit API authentication
   - Scopes needed: `public_repo`, `read:user`
   - Error on missing: `process.exit(1)` at generator.js:15

2. **Node.js 18+**: ESM modules, native fetch
3. **npm/pnpm**: Package manager

### Build Outputs
- `dist/` - Frontend static files
  - `dist/index.html` - Main UI
  - `dist/logs.html` - Activity logs
  - `dist/assets/` - Bundled JS/CSS
  - `dist/images/` - Static images (copied from src)
- `public/data.json` - Repository data (generated)
- `src/frontend/data.json` - Copy for dev server

## Risk Assessment

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|------------|
| **Missing .env locally** | High | Build fails | Document .env.example, use CI secrets |
| **No Vercel config** | High | Deployment blocked | Create vercel.json |
| **GITHUB_TOKEN exposure** | Critical | Security breach | Use GitHub Secrets only |
| **Base path mismatch** | Medium | Asset 404s on Pages | Verify `base: './'` works for project pages |
| **Workflow versions outdated** | Low | Deprecation warnings | Update to v4 actions |
| **No deployment verification** | Medium | Silent failures | Add URL probes to workflow |

## Coupling Hotspots

1. **Data Format Inconsistency**: Generator outputs both grouped (by language) and flattened arrays
2. **Path Dependencies**: Streamlit app searches multiple paths for data.json
3. **Duplicate Logic**: HTML generation exists in both generator.js and frontend/main.js

## Missing Tests

- No unit tests for data transformation
- No integration tests for GitHub API interactions
- No E2E tests for frontend
- No validation tests for data.json schema

## Dead Code / Technical Debt

- `stargazed.js`: Simplified generator that duplicates core logic
- Unused HTML generation in generator.js (frontend now uses Vite)
- `.README-backup.md`: Large backup file (299KB)
- Multiple data.json locations causing path confusion

## Environment & Configuration Gaps

- No `.env` file documentation beyond example
- Missing MCP server configuration
- No analytics/statistics configuration
- Limited logging configuration

## Expected Hosting URLs

### GitHub Pages
- **URL Pattern**: `https://kbllr.github.io/git-stars/`
- **Type**: Project Pages (repo-based)
- **Base Path**: Vite config uses `base: './'` which works for both root and project pages

### Vercel
- **Production URL**: `https://git-stars-kbllr.vercel.app` (or custom domain)
- **Preview URL**: `https://git-stars-<branch>-kbllr.vercel.app`
- **Project Name**: `git-stars` (to be created)

## Positive Findings

✅ **Static build ready**: No SSR, fully compatible with both platforms
✅ **Existing GitHub Pages workflow**: Foundation already in place
✅ **Environment-based auth**: GITHUB_TOKEN properly externalized
✅ **Multi-page support**: No SPA routing complexity
✅ **Build verification**: `ensure-build.js` checks dist output

## Recommendations for Deployment Setup

### Immediate (This Session)
1. Create `vercel.json` with static configuration
2. Add `.github/workflows/vercel-deploy.yml` workflow
3. Update `.github/workflows/gh-pages.yml` to modern standards
4. Create `.env` locally for testing (not committed)
5. Add hosting documentation to README
6. Create ADR for dual-deployment architecture

### User Action Required
1. Add `VERCEL_TOKEN` to repository secrets
   - Navigate to: https://github.com/KBLLR/git-stars/settings/secrets/actions
   - Create token at: https://vercel.com/account/tokens
   - Add secret named `VERCEL_TOKEN`
2. Link Vercel project (will happen on first deploy)

### Short-term (Follow-up)
1. Add deployment status badges to README
2. Configure custom domain (if desired)
3. Set up Vercel preview deployments for PRs
4. Add performance monitoring

---

**Next Step:** Create detailed implementation plan with task breakdown
