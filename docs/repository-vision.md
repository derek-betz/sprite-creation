# sprite-creation repository vision

`sprite-creation` is the hub for designing, prototyping, refining, and packaging sprite-based UI experiences that can be integrated into Derek's other applications.

## Core purpose

This repository exists to:

- create and polish reusable sprite assets and animation behaviors
- prototype sprite-driven UI patterns before they land in product repos
- provide a shared sandbox for visual experimentation
- document integration patterns so future project work stays coherent
- preserve provenance, reusable artifacts, and implementation notes

This repository does **not** exist to permanently absorb the full source trees of Derek's app repos.

## Operating model

Use `sprite-creation` as the **hub** and real product repos as **spokes**.

- `sprite-creation` owns reusable assets, experiments, animation logic, preview tooling, and integration notes.
- each product repo owns its real production UI implementation and app-specific wiring.
- local development should connect to sibling clones of real repos through a local config file, not through git submodules by default.

## Preferred integration strategy

### 1. Local project mapping over submodules

When working with a real app UI, point this repo at a locally cloned sibling repo using a local config file.

Why:

- avoids nested git complexity
- keeps app repos independent
- makes local iteration faster
- scales better as the number of connected projects grows

### 2. Harnesses for fast iteration

Most sprite work should start in a lightweight local harness inside this repo, not directly inside a production app.

Use harnesses to:

- test motion
- refine timing
- tune asset placement
- simulate common UI states
- rehearse event flows before touching product code

### 3. Shared packages only when reuse becomes real

If a reusable runtime/helper layer emerges, package it intentionally.
Do **not** create shared packages prematurely.

Good package candidates:

- sprite runtime helpers
- animation state machines
- reusable event adapters
- asset loading helpers

## Repo boundaries

### Belongs here

- reusable sprite assets
- asset catalogs and provenance
- preview/runtime sandbox code
- integration notes and recipes
- representative UI harnesses
- project-specific prototype adapters that are clearly experimental
- generated outputs worth keeping as references

### Does not belong here

- full copies of unrelated product repos
- long-lived production app code that should live with the app
- git submodules unless there is a strong, explicit reason
- disposable build output or local-only environment junk

## Anti-drift rules

When adding a new project integration:

1. create a folder under `integrations/<project-name>/`
2. write down the app goal, UI target area, event mapping, and constraints
3. prefer a local path mapping in `config/projects.local.json`
4. keep production-ready code in the app repo once the concept is proven
5. update this repo's docs if the pattern evolves

When in doubt, ask:

- is this reusable across projects?
- is this experimental or production?
- does this belong to the sprite hub or to the app itself?

If it is product-specific and shipping, it probably belongs in the app repo.

## Submodule policy

Default answer: **do not use submodules**.

Only use a submodule if all of the following are true:

- the nested repo is a true dependency
- pinned versioning matters
- multiple repos consume it as-is
- the added git complexity is worth it

That is expected to be rare.

## Long-term goal

Over time, `sprite-creation` should become a reliable workshop containing:

- polished assets
- repeatable integration playbooks
- a visual sandbox for exploration
- a thin bridge to real application repos
- enough written intent that future work stays aligned even as the number of projects grows
