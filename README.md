# Sprite Creation Workshop

`sprite-creation` is a long-lived workspace for two related kinds of work:

- building polished sprite/animation UI integrations for real applications
- generating, cataloging, and revisiting fun experimental sprite work for future use

## Workspace Layout

- `integrations/`: app-specific animation prototypes and adapters
- `assets/`: curated reusable source assets and approved exports
- `catalog/`: asset manifests, provenance, and usage notes
- `lab/`: experimental sprite ideas, motion studies, and prompt recipes
- `runtime/`: shared preview sandbox for trying animation ideas quickly
- `docs/`: durable planning and reference notes
- `output/`: ephemeral generated output only
- `tmp/`: local scratch space

## Current Integrations

- `integrations/msg-to-pdf-dropzone/`: existing task-theater style app integration
- `integrations/cost-estimate-generator/`: Cone Guy progress tracker prototype and notes

## Repo Rules

- Keep durable prototypes under `integrations/`, not at the repo root.
- Keep reusable art in `assets/`.
- Keep exploratory one-offs in `lab/` until they are worth curating.
- Put provenance and tagging info in `catalog/`.
- Treat `output/`, browser logs, screenshots, and local installs as disposable.

## Cone Guy Notes

The Cost Estimate Generator work established a useful pattern for future integrations:

- the sprite should behave like a living progress indicator, not a roaming mascot
- the animation should be subtle, charming, and product-aware
- real app milestones are better than fake demo timelines whenever they are available
- the best placements are existing progress/status regions, not novelty panels

## Next Good Uses

- more roadway/status indicators
- loading and empty-state companions
- app-specific “work zone” progress trackers
- reusable sprite-sheet or Pixi-based mini integrations for other tools
