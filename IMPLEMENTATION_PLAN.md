# Git Stars: OpenResponses Activity Log Integration (Single Source of Truth)

## Goal

Replace the legacy `logs.html` with a modern **Activity Log** view inside the main React application.
The new logger will **strictly adhere to the OpenResponses Event Schema** and the **central ecosystem registries**.

**No split brains:** the frontend must not carry its own copy of schemas or parallel registries. All structure and identity flow from the single sources of truth listed below.

## User Review Required

> [!IMPORTANT]
> This removes `src/logs.html`. Any external bookmarks to `logs.html` will break. The Logs will now be a tab inside the main app.

## Sources of Truth (Non‑Negotiable)

**Schemas (OpenResponses):**
- `htdi-collective-agency/lib/agent-events.ts` — the single canonical event schema for **AgentEvent / OpenResponses**.

**Registries (Ecosystem):**
- `/registries/agents.registry.json`
- `/registries/houses.registry.json`
- `/registries/services.registry.json`
- `/registries/models.registry.json`

**Event Transport (OpenResponses Stream):**
- Event Bus SSE: `/bus/events` (proxy) or `http://localhost:8085/events`
- Event Bus emit: `POST /bus/emit` (proxy) or `POST http://localhost:8085/emit`

**Rule:** No local copies of these schemas/registries inside `git-stars`. If we need them in the frontend, we **import or fetch** from the canonical source or use an alias to it.

## Proposed Changes

### Shared Library [NEW]

#### [NEW] [agent-events.ts](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/lib/agent-events.ts) → **REMOVE**

- **Do not copy** schemas into `git-stars`.
- Instead **import** from the single source of truth (`htdi-collective-agency/lib/agent-events.ts`), or add a Vite alias that points to it.
- This avoids schema drift and guarantees OpenResponses compliance.

#### [NEW] [logger.ts](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/lib/logger.ts)

- Service to manage **event emission and persistence** using the canonical schema.
- Function `logEvent(event: AgentEvent)`:  
  1) Emit to Event Bus (`/emit`)  
  2) Append to local cache (optional, for UI speed/offline)
- Function `createRepoViewEvent(repo: Repo)`: Factory for `git-stars:repo.viewed`.
- Function `getEvents()`:  
  - Primary: subscribe to `/events` SSE stream  
  - Optional: merge with local cache (if offline)

**Rule:** Event Bus stream is the authoritative source of history. LocalStorage is only a cache, not a source of truth.

### Components [NEW/MODIFY]

#### [NEW] [ActivityLog.tsx](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/components/ActivityLog.tsx)

- React component to display the list of events from the **Event Bus stream**.
- Columns: `Timestamp`, `Type`, `House`, `Data/Details`.
- Features: Filter by Type, JSON Export (**OpenResponses‑compliant**).

#### [MODIFY] [App.tsx](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/App.tsx)

- Add `'activity'` to `currentView` state.
- Add "Activity" Tab to Header.
- Render `<ActivityLog />` when view is active.

#### [MODIFY] [RepoCard.tsx](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/components/RepoCard.tsx)

- Import `logger`.
- On click: `logger.logEvent(createRepoViewEvent(repo))` → emits to Event Bus (authoritative).

### Orchestrator Integration (REQUIRED)

The user must be able to **reach the Git Stars orchestrator from the UI** (similar to Emergence Lab’s right‑click orchestrator pattern).

#### [NEW] Orchestrator Entry Point (UI)
- Provide a contextual entry (right‑click or kebab menu) that opens an **Orchestrator Panel**.
- The panel must identify and connect to: `orchestrator:git-stars` (`houses/git-stars/orchestrators/git-stars.orchestrator.json`).

#### Orchestrator Capabilities (Minimum)
- **MCP Tools**: Git MCP + other useful tools (search, repo metadata, issues, stars, trends).
- **Analytics**: repo activity analytics (stars over time, contributor signal, language breakdown, recency).
- **OpenResponses Events**: all orchestrator actions emit `tool.call`, `tool.result`, `response.*` events to the Event Bus.

#### UX Expectations
- Orchestrator panel should display:
  - Current orchestrator identity + status (connected/disconnected)
  - Last action + outcome
  - Event stream log (OpenResponses)

### Cleanup

#### [DELETE] [logs.html](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/src/logs.html)

- Legacy file removal.
- Add a **migration step**: if any logs were stored locally (e.g., `localStorage`), migrate them into Event Bus by replaying as OpenResponses events once.

#### [MODIFY] [vite.config.js](file:///Users/davidcaballero/core-x-kbllr_0/houses/git-stars/vite.config.js)

- Remove `logs` entry point from rollup options.
- Add alias import to canonical schema (no local copy).
- Add Event Bus proxy (`/events`, `/emit`) if needed by the frontend.

## Verification Plan

### Automated Tests

- `npm run build` to ensure type safety with **canonical** schema import.

### Manual Verification

1.  Open App → Click "Activity" Tab.
2.  Click a Repo Card → Verify `git-stars:repo.viewed` is emitted via `/emit`.
3.  Confirm the Activity Log displays events **from `/events` stream**, not only local cache.
4.  Export JSON → Validate against canonical `agent-events.ts` schema.
