# ADR-001: Vega Lab MCP And OpenResponses Architecture

## Status

Accepted.

## Context

Vega Lab needs one operational layer for the UI, local MLX models, the orchestrator, and automations. Prompt-only actions caused drift between News, Mine, ReadmePanel, ChatPanel, and generated artifacts.

## Decision

Use typed MCP tools as the house tool surface and OpenResponses as the runtime contract. Local mode routes through `/bus`, proxied to `http://127.0.0.1:8090`, so MLX-backed local models are the default path.

`src/mcp-server/index.js` is the single MCP entrypoint. It reads raw repository snapshots and writes derived intelligence artifacts into both `data/` and `public/`.

## Consequences

- The UI and orchestrator share the same data contract.
- Actions become durable inbox records instead of transient prompts.
- Claude and Codex missions are adapter formats over one canonical extraction record.
- Automations stay draft-only and produce reviewable JSON artifacts.
- Legacy `git-stars:*` aliases remain only for one migration cycle.
