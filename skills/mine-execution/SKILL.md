---
name: mine-execution
description: Operate on owned repositories in Vega Lab. Use when the user wants README gaps, maintenance plans, deployment/test signals, package update planning, template extraction, mission briefs, or execution prioritization for repos in the Mine workspace.
---

# Mine Execution

Use this skill for the `Mine` tab and owned-repo workflows.

## Workflow

1. Start with `get_mine_health` for health flags and recommended actions.
2. Use `inspect_owned_repo` or `get_repo_inspection` when you need file evidence for README, package, workflow, deployment, or test signals.
3. Use `list_action_items`, `update_action_item`, or `draft_action_item` when work belongs in the Ops Inbox.
4. Use `find_repos_missing_readme` when the task is specifically about README coverage.
5. Pull `extract_repo_skills` when you need adoption or template context.
6. Call `generate_repo_mission` for `codex` or `claude` when the user wants an implementation brief.
7. Keep output execution-oriented: what to fix, what to template, and what to queue.

## Output Rules

- Prefer action lists over passive summaries.
- Separate maintenance tasks from template/adoption tasks.
- Call out when a repo is private, stale, or missing a README because those affect readiness.
- Keep automation output draft-only.
