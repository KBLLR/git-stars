---
name: repo-adoption
description: Score and classify repositories for adoption into a house, tool, service, template, or ignore track. Use when the user wants fit analysis, adoption ranking, ecosystem alignment, or integration recommendations.
---

# Repo Adoption

Use this skill for “should we use this?” decisions.

## Workflow

1. Inspect the canonical extraction with `extract_repo_skills`.
2. Pull `get_adoption_candidates` for ranking context.
3. Explain the adoption kind:
   - `house`
   - `tool`
   - `service`
   - `template`
   - `ignore`
4. Convert the category into the next concrete action, not just a label.

## Output Rules

- Justify the adoption fit with repo capabilities and house skills.
- Mention the main risks if the score is high but maintenance or license signals are weak.
