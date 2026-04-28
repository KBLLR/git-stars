# {{house_name}} Agents

## House Truth

- House ID: `{{house_id}}`
- Role: `{{house_role}}`
- Runtime contract: OpenResponses
- Local model path: `{{local_model}}`
- Local bus: `/bus -> http://127.0.0.1:8090`

## Agent Roster

- `{{orchestrator_id}}`: routes work and protects draft-only authority.
- `{{specialist_ids}}`: perform specialist work through typed tools.

## Rules

- Use typed tools before freeform answers when repo facts, runtime state, or generated artifacts are requested.
- Do not open PRs, merge, deploy, or mutate other repositories without explicit approval.
- If evidence is missing, state the gap and draft the next inspection action.

