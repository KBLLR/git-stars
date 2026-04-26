---
name: skill-extraction
description: Extract canonical skills, rules, flows, and mission briefs from a repository in Vega Lab. Use when the user asks for SKILLS, RULES, FLOWS, Codex missions, Claude missions, or toolization output.
---

# Skill Extraction

This skill turns repo metadata into reusable Vega Lab house outputs.

## Workflow

1. Call `extract_repo_skills` for the canonical extraction record.
2. Return the record directly when the user wants the raw skills/rules/flows.
3. Call `generate_repo_mission` with `target=codex` or `target=claude` when the user wants model-specific execution instructions.
4. If the repo should become an adoption candidate, pair the extraction with `get_adoption_candidates`.

## Output Rules

- Treat the extraction record as the source of truth.
- Do not invent separate Claude and Codex logic; only format the mission differently when needed.
- Keep mission briefs implementation-ready and file/task oriented.
