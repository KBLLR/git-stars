# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Vercel deployment configuration and workflow
- Dual hosting support (Vercel + GitHub Pages)
- ADR-002 documenting dual-deployment architecture
- Live sites section in README with deployment URLs
- Automated deployment workflows for both platforms
- CHANGELOG following Keep a Changelog format

### Changed
- GitHub Pages workflow updated to modern standards (Actions v4)
- Node version upgraded from 18.x to 20.x in CI workflows
- GitHub Pages now uses official `actions/deploy-pages@v4`
- Improved permissions and concurrency handling in workflows

### Fixed
- Build process now properly documented for local development
- Environment variable requirements clarified in documentation

## [1.0.0] - 2025-11-17 (Previous State)

### Added
- Initial git-stars repository tracking 2171+ starred repositories
- GitHub Pages deployment
- Vite-based frontend for browsing starred repos
- Automated README updates via GitHub Actions
- Data generation from GitHub API
- MCP server for AI agent integration
- Statistics and analytics module

### Repository
- **Homepage**: https://github.com/KBLLR/git-stars
- **Live Sites**:
  - GitHub Pages: https://kbllr.github.io/git-stars/
  - Vercel: https://git-stars-kbllr.vercel.app

[Unreleased]: https://github.com/KBLLR/git-stars/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/KBLLR/git-stars/releases/tag/v1.0.0
