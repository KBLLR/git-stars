# ADR-002: Dual Deployment Architecture (Vercel + GitHub Pages)

**Status**: Accepted
**Date**: 2025-11-17
**Decision Makers**: Claude Agent (automated deployment setup)
**Related**: Deployment infrastructure, hosting strategy

## Context

The git-stars project is a static web application that displays GitHub starred repositories. Previously, it was only deployed to GitHub Pages. We needed to:

1. Provide redundancy and flexibility in hosting
2. Enable better performance and CDN capabilities
3. Support custom domains and preview deployments
4. Maintain the free GitHub Pages deployment
5. Ensure both platforms work from the same build artifact

## Decision

We will deploy git-stars to **both Vercel and GitHub Pages** using the same static build artifact from the `dist/` directory.

### Architecture

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

1. **Single Build, Dual Deploy**: Both platforms use identical build artifacts
2. **GitHub Pages as Primary**: Continues existing setup, free forever
3. **Vercel as Secondary**: Better performance, edge network, custom domains
4. **Base Path Strategy**: Use relative path (`./`) in Vite config for compatibility
5. **Static-Only Constraint**: No SSR to ensure both platforms work identically
6. **Automated Workflows**: Both deploy automatically on push to `main`

## Rationale

### Why Dual Deployment?

**Redundancy**:
- If one platform has issues, the other remains available
- Different CDN networks provide global coverage

**Flexibility**:
- GitHub Pages: Free, simple, tied to repository
- Vercel: Better performance, analytics, preview deployments

**Cost**:
- Both platforms offer free tiers
- No additional hosting costs

**Developer Experience**:
- Vercel provides instant previews for PRs
- GitHub Pages provides stable, canonical URL

### Why These Platforms?

**GitHub Pages**:
- ✅ Free and unlimited for public repos
- ✅ Already integrated with GitHub
- ✅ Simple setup, no external account needed
- ✅ Canonical URL tied to repository
- ❌ Slower CDN compared to Vercel
- ❌ No preview deployments
- ❌ Limited configuration options

**Vercel**:
- ✅ Excellent CDN performance
- ✅ Preview deployments for PRs
- ✅ Custom domains (free)
- ✅ Analytics and insights
- ✅ Zero-config for many frameworks
- ❌ Requires separate account
- ❌ Needs VERCEL_TOKEN for CI/CD

## Implementation Details

### Build Configuration

**Vite Config** (`vite.config.js`):
```javascript
export default defineConfig({
  base: './', // Relative paths work for both platforms
  build: {
    outDir: resolve(__dirname, 'dist'),
  }
})
```

**Vercel Config** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Workflow Configuration

**GitHub Pages** (`.github/workflows/gh-pages.yml`):
- Triggers: Push to `main`, manual dispatch
- Build: `npm run build` (includes data generation)
- Deploy: `actions/deploy-pages@v4`
- URL: `https://kbllr.github.io/git-stars/`

**Vercel** (`.github/workflows/vercel-deploy.yml`):
- Triggers: Push to `main`, manual dispatch
- Build: `npm run build` (same as Pages)
- Deploy: Vercel CLI with prebuilt artifacts
- URL: `https://git-stars-kbllr.vercel.app` (or custom)

### Environment Variables

Both workflows use:
- `GITHUB_TOKEN` (for GitHub API access during build)
- `VERCEL_TOKEN` (Vercel only, for deployment)

### Base Path Handling

Using `base: './'` (relative) ensures:
- Assets load correctly on GitHub Pages project pages (`/git-stars/`)
- Assets load correctly on Vercel root domain
- No environment-specific configuration needed
- No build-time base path injection required

## Consequences

### Positive

✅ **Redundancy**: Two independent hosting platforms
✅ **Performance**: Vercel provides faster CDN
✅ **Flexibility**: Can switch primary URL if needed
✅ **Cost**: Both platforms are free
✅ **Developer Experience**: Vercel previews + GitHub Pages stability
✅ **Simple Config**: Same build works for both

### Negative

❌ **Complexity**: Maintain two workflows instead of one
❌ **Build Time**: Workflows run independently (but in parallel)
❌ **Token Management**: Requires adding VERCEL_TOKEN manually
❌ **DNS Confusion**: Two different URLs for same content

### Neutral

⚪ **Cache Invalidation**: Must clear cache on both platforms
⚪ **Monitoring**: Need to check both deployments
⚪ **Documentation**: Must document both URLs

## Migration Path

### From Single to Dual Deployment

1. ✅ Keep existing GitHub Pages workflow (non-breaking)
2. ✅ Add Vercel config and workflow (additive)
3. ✅ Update documentation with both URLs
4. ⏳ User adds VERCEL_TOKEN to repository secrets
5. ✅ Both deployments work from next push to `main`

### Rollback Strategy

If Vercel deployment fails or causes issues:
1. Delete `.github/workflows/vercel-deploy.yml`
2. Delete `vercel.json`
3. GitHub Pages continues working (unaffected)
4. No downtime for users accessing GitHub Pages URL

## Alternatives Considered

### 1. GitHub Pages Only
- **Rejected**: Limited performance, no preview deployments
- **Pro**: Simplest setup
- **Con**: Single point of failure, slower CDN

### 2. Vercel Only
- **Rejected**: Loses free GitHub Pages hosting
- **Pro**: Best performance
- **Con**: Requires external account, costs money at scale

### 3. Netlify + GitHub Pages
- **Rejected**: Vercel has better Next.js/React support
- **Pro**: Similar to Vercel
- **Con**: Another platform to learn

### 4. Cloudflare Pages + GitHub Pages
- **Rejected**: Vercel chosen for better DX
- **Pro**: Excellent CDN
- **Con**: Less integrated with GitHub workflows

### 5. Self-Hosted
- **Rejected**: Unnecessary complexity for static site
- **Pro**: Full control
- **Con**: Costs, maintenance, complexity

## Success Metrics

- ✅ Both deployments return HTTP 200
- ✅ Build completes in < 5 minutes
- ✅ No broken assets on either platform
- ✅ Page load time < 2 seconds on both platforms
- ✅ Zero downtime during deployments
- ✅ Automated deployments work reliably

## Related Decisions

- **ADR-001**: MCP Server Architecture (separate concern)
- **ADR-003**: Future custom domain strategy (if needed)

## References

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Base Path Configuration](https://vitejs.dev/config/shared-options.html#base)

---

**Review Date**: 2026-01-17 (2 months)
**Stakeholders**: Repository maintainers, users accessing the site
