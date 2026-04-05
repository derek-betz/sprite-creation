# Cone Guy Implementation Notes

## Stable Decisions

- Cone Guy should be subtle, clever, and charming, not loud.
- He should act as a living progress indicator, not a wandering mascot.
- The tracker belongs in the app's `Progress` UI, not in a separate novelty card.
- The preferred placement is above `Run Log`.

## Canonical Milestones

- `Load`
- `Alt-seek`
- `Pricing`
- `Finish`

## Real Runtime Anchors

These live estimator signals were confirmed during prototype calibration:

- pipeline steps `[pipeline:01]` through `[pipeline:14]`
- `[pipeline:09] Running item pricing analytics for N project rows`
- `alternate_seek activating => ...`
- `alternate_seek resolved => ...`
- `Outputs written:`
- `Estimator completed successfully.`

## Visual Behaviors That Worked

- slow driving between milestone positions
- tread animation during movement
- lower milestone row so Cone Guy never overlaps it
- understated lane/track
- quiet note text
- phase-specific treatment:
  - `Load`: headlights
  - `Alt-seek`: search beam
  - `Pricing`: small calculator plus drifting math glyphs
  - `Finish`: restrained settle/glow

## Future Completion Goals

- make the tracker feel even more native to serious-mode UI
- improve within-phase progress if richer runtime data becomes available
- tune alternate-seek dwell timing for short and long runs
- replace CSS-only motion with a cleaner sprite-sheet system if higher fidelity is wanted
