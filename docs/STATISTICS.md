# Vega Lab Data And Statistics

Vega Lab keeps raw GitHub snapshots separate from derived intelligence. The UI, MCP tools, and orchestrator all read the same mirrored JSON artifacts.

## Generate

```bash
pnpm run build:data
pnpm run sync:mine
pnpm run generate:stats
```

`build:data` refreshes starred repositories, `sync:mine` refreshes owned/collaborative repositories, and `generate:stats` rebuilds statistics plus derived Vega Lab artifacts.

## Raw Snapshots

- `data/data.json`: starred repository snapshot
- `data/my-repos.json`: owned/collaborative repository snapshot
- `data/stats.json`: aggregate statistics

These files are mirrored into `public/` for browser use.

## Derived Intelligence

- `repo-signals.json`: News/adoption signals across watched, mine, research, and starred scope
- `research-queue.json`: canonical research queue state
- `skill-extractions.json`: canonical capabilities, house skills, rules, flows, and model mission briefs
- `mine-health.json`: owned-repo readiness and maintenance flags
- `repo-inspections.json`: README, package, workflow, deployment, and test evidence for owned repos
- `action-items.json`: durable draft-only Ops Inbox items
- `automation-runs.json`: daily/weekly automation output records
- `ops-digest.json`: daily ops summary
- `weekly-research-review.json`: weekly bright-star research review

## Verify

```bash
pnpm run test:data
pnpm run test:mcp
```

The data test checks mirror consistency and record shape. The MCP test verifies tool availability, mutation persistence, action item behavior, repo inspection, digest generation, weekly review generation, and runtime health.
