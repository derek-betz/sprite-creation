# Direction V1

This document turns the broad idea into a recommended starting direction.

## Product Position

This should be:

- decorative first
- accurate enough to feel connected to real work
- delightful enough that users talk about it

This should not be:

- a fake progress bar with cute lies
- a desktop pet that distracts from the app
- a giant game project before the core metaphor works

## Strong Recommendation

Build `v1` as a browser-based prototype that is designed to become an embeddable app panel later.

That means:

- first build: local web sandbox
- likely shipped form later: embedded web view or in-app status panel
- not recommended for v1: system-wide overlay, menubar pet, full game shell

Why:

- fastest iteration loop
- easiest to demo
- easiest to connect to real app events later
- lowest risk if the visual idea needs to change

## Recommended Visual Direction

Use a side-view 2D "mini workshop" style with chunky readable sprites.

Recommendation:

- sprite-driven, not skeletal animation
- side-view stage layout
- large readable props
- limited cast of recurring characters
- slightly stylized pixel-art or pixel-adjacent art

Practical default:

- characters authored on a `64x64` or `96x96` frame grid
- environment built as a horizontal stage
- strong silhouettes
- oversized items like envelopes, documents, PDFs, folders, sparks

This is the best middle ground between:

- charm
- legibility
- manageable production scope

## Why Not Go Fully Open-Ended On Style

You are new to this. That means the biggest risk is choosing a style that looks exciting in theory but is expensive to produce consistently.

The safest path is:

- 2D
- side view
- sprite sheets
- reusable animation verbs

Do not start with:

- isometric scenes
- procedural 3D
- free-roaming desktop pets
- workflow-specific bespoke animation sets

## UX Rules

The animation can embellish reality, but it cannot contradict it.

Rules:

- never show output before the process actually completes
- processing loops can continue while the job is still running
- success beats happen only on real success
- failures should be obvious and brief
- retries should reuse the same scene grammar
- idle motion is okay, fake completion is not

## Scene Grammar

Every job should map to a small set of visual verbs:

- appear
- claim
- move
- pick up
- carry
- process
- drop off
- react
- exit

That allows most workflows to reuse the same asset kit.

## V1 Cast

Start with 3 characters:

- Courier: picks up and carries inputs
- Alchemist: operates transformation stations
- Porter: carries outputs to destination zones

You can reuse one base body and differentiate by color, hat, prop, or backpack.

## V1 Environment

Build exactly one small stage:

- Source shelf
- Conversion circle or machine
- Destination inbox/folder dock

Optional flavor:

- moving particles
- ambient lamp glow
- tiny background shelves
- subtle parallax

## V1 Workflow: `msg-to-pdf`

Recommended sequence:

1. An envelope or document appears at the source shelf.
2. Courier runs in and picks it up.
3. Courier carries it to the conversion station.
4. Alchemist or machine loops while processing.
5. A PDF prop pops out of the station.
6. Porter carries the PDF to the destination dock.
7. Small success beat plays.

Failure variant:

1. Station sputters.
2. Item turns red, smoky, jammed, or stamped `FAILED`.
3. Character reacts and drops it in an error tray.

## Tooling Recommendation

Runtime:

- TypeScript
- Vite
- PixiJS

Art:

- Aseprite if you choose pixel-art production
- Krita or Photoshop if you choose painted 2D art

Support tools:

- use AI generators for concept exploration and rough first passes
- do not depend on AI output alone for final consistent production assets

## How To Use The Reference Material

Based on the provided references, the useful patterns are:

- generator plus sandbox preview is more valuable than generator alone
- sprite workflow tools are most helpful when they let you inspect frames before export
- fast front-end iteration matters because animation tuning is mostly visual

So the workspace should eventually support:

- asset preview
- event replay
- quick timing edits
- side-by-side comparison of animations

## First Milestone

The first milestone is not "a sprite engine."

It is:

- one charming `msg-to-pdf` scene
- driven by fake events
- readable in under 5 seconds
- replayable on demand

If that works, the rest of the project becomes much easier.

## Best Plan Of Action Right Now

1. Create a simple storyboard with 6 to 8 beats for `msg-to-pdf`.
2. Pick the first art style and lock it for one sprint.
3. Create one courier sprite and one station.
4. Build a tiny PixiJS stage that can replay those beats.
5. Test whether a stranger can understand the scene without explanation.
6. Only then add more workflows or generators.

## Two Important Unknowns

- Is the long-term target app web-based or desktop-based?
- Do you want to make the art mostly by hand, mostly with AI assistance, or by kitbashing existing assets?

These do not block the prototype, but they will affect the production pipeline.
