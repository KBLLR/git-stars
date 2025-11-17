# Audit Report: git-stars Codebase

**Date**: 2025-11-17
**Scope**: Full repository analysis

## Repository Overview

**Repository**: KBLLR/git-stars
**Purpose**: GitHub starred repository browser and organizer
**Current Stack**: Node.js, JavaScript (Vite), Python (Streamlit)
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

## Risk Assessment

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|------------|
| **Code Duplication** | Medium | Maintenance overhead, bugs | Consolidate generators into shared module |
| **No MCP Interface** | High | Missing core requirement | Implement MCP server |
| **Limited Statistics** | Medium | Reduced value proposition | Add analytics module |
| **No Tests** | Medium | Quality assurance | Add test suite |
| **Cache Location** | Low | Potential conflicts | Document and standardize |
| **Error Handling** | Medium | Poor user experience | Enhance error messages |

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

## Positive Findings

✅ **Well-structured data model** with comprehensive repo metadata
✅ **Effective caching** strategy for GitHub API rate limiting
✅ **Active automation** via GitHub Actions
✅ **Dual UI options** (Vite SPA + Streamlit)
✅ **Clean separation** between data generation and presentation

## Recommendations

### Immediate (Critical Path)
1. Create MCP server module with stdio transport
2. Add statistics generation module
3. Consolidate data generators
4. Standardize data.json location and format

### Short-term (Quality)
1. Add comprehensive test suite
2. Improve error handling and logging
3. Document API contracts
4. Create ADR for architecture decisions

### Long-term (Enhancement)
1. Add ML-powered recommendations
2. Implement trending analysis
3. Create API documentation site
4. Add contribution graph analytics
