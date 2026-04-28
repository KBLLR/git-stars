# Vega Lab MCP Server

`src/mcp-server/index.js` exposes the typed tool layer used by Vega Lab UI panels, the orchestrator, and OpenResponses-compatible local agents.

## Identity

- Server name: `vega-lab-mcp`
- Legacy name: `git-stars-mcp`
- Runtime contract: OpenResponses via the local MLX Gateway
- Local bus: `/bus`, proxied to `http://127.0.0.1:8090`

## Run

```bash
pnpm run mcp
```

The server uses stdio transport for MCP clients. The app uses the OpenResponses/Event Bus path in local runtime mode.

## Tools

Discovery and analytics:

- `list_starred_repos`
- `search_repos`
- `get_repo_details`
- `get_statistics`
- `get_language_breakdown`
- `get_trending_topics`
- `filter_by_criteria`
- `find_similar_repos`

Research, adoption, and skills:

- `list_news_signals`
- `get_research_queue`
- `update_research_queue`
- `mark_for_research`
- `get_adoption_candidates`
- `extract_repo_skills`
- `list_template_kits`
- `generate_repo_mission`
- `generate_repo_ops_kit`

Mine and ops:

- `get_mine_health`
- `find_repos_missing_readme`
- `list_action_items`
- `update_action_item`
- `inspect_owned_repo`
- `get_repo_inspection`
- `draft_action_item`

Automation outputs and runtime:

- `generate_ops_digest`
- `generate_weekly_research_review`
- `get_runtime_health`

## Data Contract

The server reads and writes purposeful JSON artifacts in `data/` and mirrors them into `public/`:

- `data.json`
- `my-repos.json`
- `repo-signals.json`
- `research-queue.json`
- `skill-extractions.json`
- `mine-health.json`
- `repo-inspections.json`
- `action-items.json`
- `automation-runs.json`
- `ops-digest.json`
- `weekly-research-review.json`
- `template-kits.json`
- `repo-ops-kits.json`

`update_research_queue`, `update_action_item`, `draft_action_item`, and `generate_repo_ops_kit` are stateful. Tests restore mutated files after exercising those paths.

## Authority

The MCP server may draft action items, inspections, Ops kits, digests, and mission briefs. It must not open PRs, merge, deploy, or mutate other repositories.
