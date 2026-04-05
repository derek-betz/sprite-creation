# sprite-creation

`sprite-creation` is a long-lived workspace for two related kinds of work:

- building polished sprite/animation UI integrations for real applications
- generating, cataloging, and revisiting fun experimental sprite work for future use

## Repository Intent

The durable vision for this repo lives in [`docs/repository-vision.md`](docs/repository-vision.md).

The short version:

- this repo is the **hub** for sprite assets, experiments, runtime tooling, and integration patterns
- real application repos remain independent and own their production code
- local app connections should use a local path map, **not submodules by default**
- the goal is to scale to many connected projects without turning git into a goblin nest

## Workspace Layout

- `integrations/`: app-specific animation prototypes and adapters
- `assets/`: curated reusable source assets and approved exports
- `catalog/`: asset manifests, provenance, and usage notes
- `lab/`: experimental sprite ideas, motion studies, and prompt recipes
- `runtime/`: shared preview sandbox for trying animation ideas quickly
- `config/`: example local project mapping files for connecting sibling repos
- `docs/`: durable planning and reference notes
- `output/`: ephemeral generated output only
- `tmp/`: local scratch space

## Current Integrations

- `integrations/msg-to-pdf-dropzone/`: existing sprite-driven app integration
- `integrations/cost-estimate-generator/`: Cone Guy progress tracker prototype and notes

## Connecting Real Project Repos

Use `config/projects.example.json` as the template, then create your own ignored local file at:

- `config/projects.local.json`

Example:

```json
{
  "msg-to-pdf-dropzone": "/absolute/path/to/msg-to-pdf-dropzone",
  "cost-estimate-generator": "/absolute/path/to/cost-estimate-generator"
}
```

Then from `runtime/` you can run:

- `npm run projects:list`

This keeps app repos independent while still making it easy for `sprite-creation` to know where your real local clones live.

## Repo Rules

- Keep durable prototypes under `integrations/`, not at the repo root.
- Keep reusable art in `assets/`.
- Keep exploratory one-offs in `lab/` until they are worth curating.
- Put provenance and tagging info in `catalog/`.
- Treat `output/`, browser logs, screenshots, and local installs as disposable.
- Prefer local path mappings over submodules when connecting to real app repos.
- Move production-ready integration code into the owning app repo once a concept is proven.

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
