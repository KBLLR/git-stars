---
name: repo-discovery
description: Discover, filter, compare, and cluster GitHub repositories inside Git Stars. Use when the user wants search, similar repos, topic scans, language breakdowns, or shortlist generation from starred repositories.
---

# Repo Discovery

Use this skill for search and comparison tasks across `git-stars`.

## Workflow

1. Start with `search_repos` when the user provides keywords.
2. Use `filter_by_criteria` when the user gives structured constraints like language, topic, stars, or author.
3. Use `find_similar_repos` when the user starts from one known repo.
4. Pull `get_repo_details` before making claims about a specific repository.
5. When the question is broader than a single repo, use `get_statistics`, `get_language_breakdown`, or `get_trending_topics` to anchor the answer.

## Output Rules

- Prefer short ranked shortlists over long dumps.
- Include why each repo matched.
- Call out uncertainty if metadata is sparse.
