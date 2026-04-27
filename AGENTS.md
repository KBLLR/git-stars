# Vega Lab Agents

## Paradigm

- House ID: `vega-lab`
- Legacy alias: `git-stars`
- Role: Local-first Git universe intelligence and repo ops center
- Status/Type: active · ui · lab
- Runtime contract: OpenResponses only
- Authority: draft-only for automations and cross-repo maintenance

## Product Truth

- UI entry: `src/main.tsx`
- Runtime shell: `src/App.tsx`
- MCP/OpenResponses tools: `src/mcp-server/index.js`
- Orchestrator: `orchestrators/vega-lab.orchestrator.json`
- House manifest: `house.manifest.json`
- Function manifest: `functions.manifest.json`

## Local Runtime

- Local mode defaults to `/bus`
- Vite proxies `/bus` to `http://127.0.0.1:8090`
- The Event Bus must expose OpenResponses-compatible settings, response streaming, and tool-call events
- Web mode is for deployed testing only

## Data

- Raw starred repos: `data/data.json` and `public/data.json`
- Owned/collab repos: `data/my-repos.json` and `public/my-repos.json`
- Derived intelligence: `repo-signals.json`, `research-queue.json`, `skill-extractions.json`, `mine-health.json`, `repo-inspections.json`, `action-items.json`, `automation-runs.json`, `ops-digest.json`, `weekly-research-review.json`
- Every derived artifact must be mirrored in both `data/` and `public/`

## Skills

- `repo-discovery`: search, filter, compare, similar repos
- `repo-research`: research queue, summaries, status tracking
- `skill-extraction`: canonical skills, rules, flows, mission briefs
- `repo-adoption`: house/tool/service/template/ignore classification
- `mine-execution`: owned-repo inspection, maintenance, deployment/test/readme actions

## Runtime / Dev

- Install: `pnpm install`
- Dev: `pnpm run dev`
- Data refresh: `pnpm run build:data && pnpm run sync:mine && pnpm run generate:stats`
- Tests: `pnpm test`
- Build: `pnpm run build`

## Rules

- Preserve the visual design direction unless the user explicitly asks for design changes.
- Prefer typed tools and durable JSON artifacts over prompt-only behavior.
- Keep old `git-stars:*` local storage and agent aliases readable for one migration cycle, but write new state under `vega-lab:*`.
- Automations may draft action items and mission briefs only. Do not open PRs, merge, deploy, or mutate other repositories without explicit human approval.
