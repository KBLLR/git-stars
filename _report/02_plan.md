# Implementation Plan: git-stars MCP Transformation

**Date**: 2025-11-17
**Estimated Completion**: 4-6 hours of development time

## Overview

Transform git-stars into a production-ready MCP server with enhanced statistics, clean codebase, and seamless automation.

## Architecture Decision

### MCP Server Design

```
┌─────────────────────────────────────┐
│   MLX / OpenAI Compatible Agent     │
└───────────────┬─────────────────────┘
                │ stdio/SSE
┌───────────────▼─────────────────────┐
│         MCP Server (Node.js)        │
│  ┌──────────────────────────────┐   │
│  │  Tools:                      │   │
│  │  - list_starred_repos        │   │
│  │  - search_repos              │   │
│  │  - get_repo_details          │   │
│  │  - get_statistics            │   │
│  │  - get_language_breakdown    │   │
│  │  - get_trending_topics       │   │
│  │  - filter_by_criteria        │   │
│  └──────────────────────────────┘   │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│      Data Layer (data.json)         │
│   + Statistics Cache (stats.json)   │
└─────────────────────────────────────┘
```

### Data Contracts

**Input**: MCP tool requests (JSON-RPC 2.0)
**Output**: Structured repository data + statistics
**Storage**: File-based (data.json, stats.json)

## Implementation Slices

### Slice 1: MCP Server Foundation (MVP)
**Goal**: Get a working MCP server responding to basic queries

#### Tasks
1. Create `src/mcp-server/` directory structure
2. Implement MCP server with stdio transport
3. Add `list_starred_repos` tool
4. Add `search_repos` tool
5. Add `get_repo_details` tool
6. Create server configuration file
7. Add npm script to run MCP server

**Test**: Agent can connect and list repositories

---

### Slice 2: Statistics Module
**Goal**: Generate and expose comprehensive statistics

#### Tasks
1. Create `src/analytics/statistics.js` module
2. Implement statistics calculation:
   - Total repos, stars, forks
   - Language distribution (count + percentage)
   - Topic frequency analysis
   - License breakdown
   - Activity timeline (stars over time)
   - Top repositories by stars
3. Add `get_statistics` MCP tool
4. Add `get_language_breakdown` MCP tool
5. Create statistics caching mechanism
6. Add npm script: `npm run generate:stats`

**Test**: Statistics returned accurately for all 2171 repos

---

### Slice 3: Code Consolidation & Cleanup
**Goal**: Remove duplication, improve maintainability

#### Tasks
1. Create `src/core/data-fetcher.js` - shared GitHub API logic
2. Create `src/core/transformer.js` - shared data transformation
3. Refactor `scripts/generator.js` to use core modules
4. Remove `scripts/stargazed.js` (functionality absorbed)
5. Standardize data.json location: `data/data.json`
6. Update all imports to use new structure
7. Add JSDoc comments to all modules
8. Fix ESLint warnings

**Test**: All existing scripts work with refactored code

---

### Slice 4: Enhanced MCP Tools
**Goal**: Add advanced query capabilities

#### Tasks
1. Implement `get_trending_topics` tool (top 20 topics)
2. Implement `filter_by_criteria` tool (language, stars, date range)
3. Implement `get_repo_recommendations` tool (similar repos)
4. Add caching layer for expensive queries
5. Add rate limiting configuration

**Test**: All tools return correct results for edge cases

---

### Slice 5: Automation Enhancement
**Goal**: Robust, reliable automation

#### Tasks
1. Update `.github/workflows/main.yml`:
   - Add statistics generation step
   - Add MCP server validation step
   - Improve error handling
2. Create new workflow: `.github/workflows/mcp-test.yml`
   - Test MCP server on every push
3. Add pre-commit hook configuration
4. Update build scripts to handle all steps
5. Add build verification tests

**Test**: Full workflow runs successfully in CI

---

### Slice 6: Documentation & Handoff
**Goal**: Complete, clear documentation

#### Tasks
1. Update `README.md` with MCP server instructions
2. Create `docs/MCP_SERVER.md` - detailed MCP guide
3. Create `docs/STATISTICS.md` - statistics documentation
4. Create `docs/API_REFERENCE.md` - tool reference
5. Create `docs/adr/ADR-001-mcp-architecture.md`
6. Update `CHANGELOG.md`
7. Create `HANDOFF.md`

**Test**: New user can set up and use MCP server from docs

---

## Test Strategy

### Unit Tests
- Data transformation functions
- Statistics calculations
- Filter and search logic

### Integration Tests
- MCP server tool execution
- GitHub API interactions
- Data caching behavior

### E2E Tests
- Full MCP request/response cycle
- Statistics generation pipeline
- Automation workflow

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| MCP tool response | < 500ms | TBD | 🔄 |
| Statistics generation | < 30s | TBD | 🔄 |
| Data fetch (2171 repos) | < 5min | ~3min | ✅ |
| Frontend load time | < 2s | ~1.5s | ✅ |

## Security Checklist

- [ ] No secrets in repository
- [ ] Environment variables documented
- [ ] Input validation on all MCP tools
- [ ] Rate limiting for API calls
- [ ] Error messages don't leak sensitive data
- [ ] Dependencies audited (`npm audit`)

## File Structure (Post-Implementation)

```
git-stars/
├── _report/                    [NEW] Documentation
│   ├── 00_intake.md
│   ├── 01_audit.md
│   └── 02_plan.md
├── data/                       [NEW] Centralized data storage
│   ├── data.json
│   └── stats.json
├── docs/                       [NEW] Documentation
│   ├── adr/
│   │   └── ADR-001-mcp-architecture.md
│   ├── API_REFERENCE.md
│   ├── MCP_SERVER.md
│   └── STATISTICS.md
├── src/
│   ├── core/                   [NEW] Shared logic
│   │   ├── data-fetcher.js
│   │   ├── transformer.js
│   │   └── cache-manager.js
│   ├── analytics/              [NEW] Statistics
│   │   ├── statistics.js
│   │   └── trends.js
│   ├── mcp-server/             [NEW] MCP implementation
│   │   ├── index.js
│   │   ├── tools/
│   │   │   ├── list-repos.js
│   │   │   ├── search.js
│   │   │   ├── statistics.js
│   │   │   └── filter.js
│   │   └── config.js
│   ├── frontend/
│   │   └── main.js
│   └── streamlit_app/
│       ├── app.py
│       └── utils.py
├── scripts/
│   ├── generator.js            [REFACTORED]
│   └── [others kept]
├── tests/                      [ENHANCED]
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── CHANGELOG.md                [UPDATED]
├── HANDOFF.md                  [NEW]
└── README.md                   [UPDATED]
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

## Rollback Strategy

If MCP server fails:
1. Feature is additive - doesn't break existing functionality
2. Can disable MCP server via environment variable
3. Git revert to previous working state
4. Existing frontend/streamlit continue to work

## Success Metrics

- ✅ MCP server responds to all 7 core tools
- ✅ Statistics generated for 2171+ repositories
- ✅ Code duplication reduced by >50%
- ✅ All workflows passing in CI
- ✅ Documentation complete and tested
- ✅ MLX agent successfully queries data
