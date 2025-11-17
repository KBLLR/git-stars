# Intake Report: Setup Vercel & GitHub Pages Deployments

**Date**: 2025-11-17
**Agent ID**: agent.prompt.audit-plan-implement.deploy.v2
**Session**: claude/setup-deployments-01JhpaFRrtDB9KsPw2ucM3pM

## Task Summary

Configure dual hosting for git-stars repository:

1. **Fix Build Errors**: Resolve missing GITHUB_TOKEN in .env causing build failures
2. **Vercel Deployment**: Add Vercel configuration and GitHub Actions workflow
3. **GitHub Pages Enhancement**: Modernize existing GitHub Pages workflow
4. **Verification**: Ensure both hosting targets are reachable and functional

## Acceptance Criteria

### Primary
- [x] Build succeeds in CI without local .env file
- [ ] Vercel deployment configured with GitHub Actions workflow
- [ ] GitHub Pages deployment enhanced to modern standards
- [ ] Both URLs return HTTP 200
- [ ] Documentation updated (README, CHANGELOG, ADR)

### Secondary
- [ ] Vercel preview deployments on PRs (optional)
- [ ] 404 fallback for SPA routing
- [ ] Performance optimizations for static assets
- [ ] Deployment status badges in README

## Assumptions & Locked Defaults

1. **Stack**: Node.js 20, npm/pnpm, Vite 5
2. **Build Output**: `dist/` directory (static files)
3. **GitHub Token**: Available as `secrets.GITHUB_TOKEN` in CI
4. **Vercel Token**: User must add `secrets.VERCEL_TOKEN` manually
5. **Base Path**: Using `./` for both platforms
6. **Deployment**: Static-only (no SSR) for GitHub Pages compatibility

## Non-Functional Requirements

### Performance
- Build time < 5 minutes
- Static asset caching configured
- Optimized bundle size

### Security
- No secrets in repository
- Minimal token scopes (public_repo, read:user)
- Secure token storage in GitHub Secrets

### Accessibility
- Existing frontend a11y maintained
- Clear documentation structure

## Definition of DONE

**DONE** = Build works + Vercel configured + GitHub Pages enhanced + Both URLs reachable (HTTP 200) + Docs updated + HANDOFF created
