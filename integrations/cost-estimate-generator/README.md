# Cost Estimate Generator Integration

This integration captures the Cone Guy progress-tracker prototype work for `CostEstimateGenerator`.

## Contents

- `prototype/`: browser wrapper prototype used to test tracker placement, motion, and milestone logic
- `assets/`: integration-local assets used by the prototype
- `notes.md`: implementation notes and the milestone model that should carry into future work

## Why It Exists

This prototype proved that:

- Cone Guy works best as a living progress bar
- the tracker belongs in the `Progress` region above `Run Log`
- the strongest milestone model is:
  - `Load`
  - `Alt-seek`
  - `Pricing`
  - `Finish`

The real production implementation should live in the app repo, but this integration folder keeps the prototype learnings and demo adapter code around for reference.
