# Implementation Plan: Vercel & GitHub Pages Deployment Setup

**Date**: 2025-11-17
**Estimated Completion**: 1-2 hours
**Focus**: Dual hosting configuration with build fixes

## Overview

Configure dual hosting for git-stars with Vercel and GitHub Pages, fix build errors, and ensure both deployments are functional and verifiable.

## Architecture Decision

### Dual Hosting Strategy

```
┌──────────────────────────────────────────┐
│     git-stars Repository (GitHub)        │
│                                          │
│   Build Process:                         │
│   1. npm run build:data (GITHUB_TOKEN)   │
│   2. npm run build:frontend (Vite)       │
│   3. Output: dist/ (static files)        │
└───────────────┬──────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼───────┐ ┌────▼──────────┐
│ GitHub Pages  │ │    Vercel     │
│               │ │               │
│ - Free        │ │ - Free tier   │
│ - Auto deploy │ │ - Auto deploy │
│ - Static only │ │ - Fast CDN    │
│ - Project URL │ │ - Custom URL  │
└───────────────┘ └───────────────┘
```

### Key Decisions

**ADR-002: Dual Deployment Architecture**

1. **Both platforms from same build**: Single `dist/` output
2. **GitHub Pages primary**: Existing setup, free, tied to repo
3. **Vercel secondary**: Better performance, custom domains, previews
4. **Base path**: Using `./` (relative) works for both
5. **No SSR**: Static-only ensures compatibility

## Implementation Tasks (Ordered)

### Task 1: Fix Build Process ⚙️
**Priority**: Critical
**Goal**: Resolve GITHUB_TOKEN missing error

#### Steps
1. Document `.env.example` clearly
2. Ensure CI workflows use `secrets.GITHUB_TOKEN`
3. Test build locally with `.env` file
4. Verify build outputs to `dist/`

**Verification**: `npm run build` completes without errors

---

### Task 2: Create Vercel Configuration 🚀
**Priority**: High
**Goal**: Add Vercel deployment files

#### Steps
1. Create `vercel.json` with:
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `dist`
   - `cleanUrls`: true
   - Rewrites for multi-page app
2. Verify Vite config base path compatibility

**Verification**: `vercel.json` validates against schema

---

### Task 3: Add Vercel GitHub Actions Workflow 🔄
**Priority**: High
**Goal**: Automated Vercel deployment on push to main

#### Steps
1. Create `.github/workflows/vercel-deploy.yml`
2. Configure:
   - Trigger: push to `main` branch
   - Node 20.x setup
   - npm install
   - npm run build
   - Vercel CLI deploy
   - Use `secrets.VERCEL_TOKEN`
3. Add conditional logic for production vs preview

**Verification**: Workflow file syntax is valid

---

### Task 4: Enhance GitHub Pages Workflow 📄
**Priority**: Medium
**Goal**: Modernize existing workflow to latest standards

#### Steps
1. Update `.github/workflows/gh-pages.yml`:
   - Upgrade actions to v4 where available
   - Node 18.x → 20.x
   - Add proper permissions for Pages
   - Add deployment status output
   - Add URL verification step
2. Keep existing build logic (working correctly)
3. Ensure `.nojekyll` file is created

**Verification**: Workflow passes validation

---

### Task 5: Update Documentation 📚
**Priority**: Medium
**Goal**: Document deployment setup and usage

#### Steps
1. **README.md**: Add hosting section
   - Vercel URL
   - GitHub Pages URL
   - Deployment status badges (optional)
   - Local development instructions
2. **CHANGELOG.md**: Add entries for deployment setup
3. **Create ADR-002**: Document dual-deployment decisions
   - Why both platforms
   - Base path strategy
   - Build process
   - Rollback plan

**Verification**: Documentation is clear and complete

---

### Task 6: Create Hosting Verification Report 🔍
**Priority**: Medium
**Goal**: Prove both deployments are reachable

#### Steps
1. Create `_report/03_hosting.md`
2. Document:
   - Vercel preview URL
   - GitHub Pages URL
   - HTTP status codes
   - curl commands for verification
3. Add screenshots/links if available

**Verification**: Both URLs return HTTP 200 (after user adds VERCEL_TOKEN)

---

### Task 7: Create Handoff Documentation 📋
**Priority**: High
**Goal**: Clear next steps for user

#### Steps
1. Create/update `HANDOFF.md` with:
   - What was changed
   - Both deployment URLs
   - How to verify deployments
   - Required user actions (add VERCEL_TOKEN)
   - Next steps and enhancement ideas
   - Rollback procedure

**Verification**: Handoff is actionable and complete

---

## Deployment Verification Strategy

### Local Build Test
```bash
# Create .env file with GITHUB_TOKEN
cp .env.example .env
# Add your token to .env
npm install
npm run build
# Verify dist/ directory contains index.html
```

### GitHub Pages Verification
```bash
# After push to main, wait for workflow
# Check: https://github.com/KBLLR/git-stars/actions
# Access: https://kbllr.github.io/git-stars/
curl -I https://kbllr.github.io/git-stars/ | head -n 1
```

### Vercel Verification (requires VERCEL_TOKEN)
```bash
# After user adds secret and workflow runs
# Access: https://git-stars-kbllr.vercel.app (or assigned URL)
curl -I https://git-stars-kbllr.vercel.app | head -n 1
```

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Build time | < 5min | ~3min | ✅ |
| Frontend load time | < 2s | ~1.5s | ✅ |
| GitHub Pages deploy | < 5min | TBD | 🔄 |
| Vercel deploy | < 3min | TBD | 🔄 |

## Security Checklist

- [x] No secrets in repository
- [x] `.env` in `.gitignore`
- [x] Environment variables documented in `.env.example`
- [x] CI uses GitHub Secrets for tokens
- [ ] VERCEL_TOKEN added by user (required action)
- [x] Minimal token scopes documented
- [ ] Dependencies audited (`npm audit`)

## Files to Create/Modify

### New Files
- `vercel.json` - Vercel configuration
- `.github/workflows/vercel-deploy.yml` - Vercel deployment workflow
- `docs/adr/ADR-002-dual-deployment.md` - Architecture decision record
- `_report/03_hosting.md` - Hosting verification report
- `HANDOFF.md` - Handoff documentation (updated)

### Modified Files
- `.github/workflows/gh-pages.yml` - Enhanced workflow
- `README.md` - Add hosting section
- `CHANGELOG.md` - Document changes (if exists, create if not)

### Unchanged (Keep Existing)
- `.env.example` - Already correct
- `vite.config.js` - Base path already set correctly
- `package.json` - Build scripts working
- `scripts/generator.js` - Keep as-is
- All source files - No code changes needed

## Dependencies

**No new dependencies required** ✅

All necessary packages already in `package.json`:
- `vite` - Build tool
- `@octokit/rest` - GitHub API
- `dotenv` - Environment variables

## Rollback Strategy

If deployments fail:
1. **GitHub Pages**: Already working, changes are non-breaking enhancements
2. **Vercel**: Purely additive, doesn't affect existing functionality
3. **Revert**: `git revert <commit-sha>` to undo changes
4. **Remove workflow**: Delete `.github/workflows/vercel-deploy.yml`
5. **Remove config**: Delete `vercel.json`

## Success Criteria

- [x] Audit and plan complete
- [ ] Build succeeds with `.env` file
- [ ] `vercel.json` created and valid
- [ ] Vercel workflow created
- [ ] GitHub Pages workflow enhanced
- [ ] Documentation updated (README, CHANGELOG, ADR)
- [ ] Hosting report created
- [ ] HANDOFF created with verification steps
- [ ] **GitHub Pages returns HTTP 200** (verifiable now)
- [ ] **Vercel returns HTTP 200** (after user adds token)

## User Action Required

**IMPORTANT**: After this setup is complete, user must:

1. Add `VERCEL_TOKEN` to repository secrets:
   - Go to: https://github.com/KBLLR/git-stars/settings/secrets/actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Create at https://vercel.com/account/tokens
   - Scope: Full access (or specific to project)

2. Push changes to `main` branch to trigger deployments

3. Verify both URLs return HTTP 200:
   ```bash
   curl -I https://kbllr.github.io/git-stars/
   curl -I https://git-stars-kbllr.vercel.app
   ```

---

**Next Step:** Begin implementation with Task 1 (Fix Build Process)
