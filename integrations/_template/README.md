# Integration Template

Copy this folder to `integrations/<project-name>/` when starting a new sprite integration.

## Purpose

This folder exists to keep future integrations consistent.

Each integration should capture:

- what app/repo it relates to
- what UI surface the sprite belongs in
- what events or state changes drive animation
- what is prototype-only versus production-bound
- where the real app repo lives locally

## Suggested workflow

1. Copy this folder to `integrations/<project-name>/`
2. Fill out `integration-brief.md`
3. Add local path mapping to `config/projects.local.json`
4. Use `npm run projects:list` and `npm run project:open -- <project-name>` from `runtime/`
5. Build the concept in `prototype/` or the shared runtime harness
6. Move production-ready implementation into the owning app repo

## Files

- `integration-brief.md` — durable intent and constraints
- `event-mapping.md` — app states/events to sprite behaviors
- `notes.md` — rough progress notes and decisions
- `prototype/` — optional integration-specific experiments
- `shots/` — screenshots, references, or captured states worth keeping
