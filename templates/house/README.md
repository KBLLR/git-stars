# {{house_name}}

{{house_name}} is a core-x house. Its README should explain what the house does, how to run it locally, which data or services it depends on, and what agents should treat as product truth.

## Purpose

- House ID: `{{house_id}}`
- Role: `{{house_role}}`
- Primary users: `{{target_users}}`
- Authority: draft-only unless explicitly escalated

## Local Runtime

- Install: `{{install_command}}`
- Dev: `{{dev_command}}`
- Test: `{{test_command}}`
- Build: `{{build_command}}`

## Operating Notes

- Prefer local MLX/OpenResponses for model-assisted work.
- Keep proprietary inference providers behind settings or deployment-only adapters.
- Record evidence and missing assumptions before proposing repo mutations.

