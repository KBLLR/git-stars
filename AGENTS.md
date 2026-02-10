# git-stars Agents

## Paradigm (House-Level)
- House ID: `git-stars`
- Role: Starred repos intelligence + curation
- Status/Type: active · ui
- Emits and consumes OpenResponses events via the Event Bus (no local schema forks).

## Sources of Truth (No Split Brain)
- `/registries/houses.registry.json`
- `/registries/agents.registry.json`
- `/registries/services.registry.json`
- `/registries/models.registry.json` (model-zoo)
- Event Bus: `/bus` (proxy) or `http://localhost:8085`

## Interfaces
- UI: http://localhost:5173

## Services
- Event Bus: `http://localhost:8085`
- Gateway (if needed): `http://localhost:8090`

## Orchestration & Linking
- Orchestrator: `houses/git-stars/orchestrators/git-stars.orchestrator.json`
- Local link: `houses/git-stars`
- Dev script: `npm run dev`

## Communication (OpenResponses)
- Emit events using the canonical OpenResponses schema (no local copies).
- Subscribe to the Event Bus SSE stream for activity.
- Use `response.*` and `tool.*` events for agent activity and tool calls.

## RAG / Knowledge (if applicable)
- Collection naming: `house:git-stars:<collection>`
- Use gateway `http://localhost:8090` for RAG (`/v1/search`, `/v1/documents`). Direct 8092 is admin-only.

## Runtime / Dev
- Run `npm install` then `npm run dev` (vite).

## Notes
- If you add new endpoints/services, update `/registries/houses.registry.json` and regenerate registries.
