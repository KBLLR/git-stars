---
name: repo-research
description: Research repositories inside Git Stars, manage the research queue, and produce concise adoption-oriented briefs. Use when the user wants to queue, review, track, or summarize repository research.
---

# Repo Research

Use this skill when the task is about research state, not just search.

## Workflow

1. Load repo facts with `get_repo_details`.
2. Inspect queue state with `get_research_queue`.
3. If the repo is being queued or moved through the workflow, call `update_research_queue`.
4. Pull `extract_repo_skills` to ground the brief in canonical capabilities, rules, flows, and adoption fit.
5. End with a short brief: why it matters, what category it fits, and the next action.

## Status Meanings

- `queued`: needs investigation.
- `researching`: active review.
- `done`: research complete, ready for reuse or adoption decisions.
- `dismissed`: tracked and intentionally not pursued.
