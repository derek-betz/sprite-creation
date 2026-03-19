# Reference Pass And App Plan

This note summarizes the four reference posts and translates them into a concrete direction for `msg-to-pdf-dropzone`.

## Scope

Reviewed on March 19, 2026 using the public content visible on the post pages, media, and article content that were accessible without reply-thread access.

Sources:

- https://x.com/sukh_saroy/status/2034247194396811656?s=20
- https://x.com/techhalla/status/2032583215903281638?s=20
- https://x.com/chongdashu/status/2031743032266043687?s=20
- https://x.com/dkundel/status/2029679518869532990?s=20
- https://github.com/derek-betz/msg-to-pdf-dropzone

## Solid Pass On The Four Posts

### 1. Sukh Sroay: Sprite Sheet Creator

What it shows:

- an open-source sprite-sheet creator
- prompt-to-character generation
- walk, jump, and attack animation generation
- a sandbox preview for testing animations before export

What matters:

- the value proposition is not "AI image generation"
- the value proposition is "full pipeline from concept to testable asset"

Useful lesson:

- sandbox preview is a first-class feature
- users need to see motion before export
- the generated output is organized by animation role, not just dumped as loose images

What to borrow:

- generator plus sandbox, not generator alone
- asset output grouped by animation verb
- quick preview controls

What not to copy blindly:

- your project is not a general-purpose sprite generator
- your real product value is accurate task theater for apps

### 2. TechHalla: AI Workflow That Builds Spritesheets

What it shows:

- a workflow-oriented app, not just a prompt box
- frames extracted from source motion material
- manual frame selection and ordering
- loop validation
- shadow tuning and environment testing
- final sprite test inside a scene

What matters:

- curation matters as much as generation
- good sprite output is a pipeline of extract, pick, order, validate, test
- a live test scene exposes problems that a frame strip alone hides

Useful lesson:

- your future tooling should include inspection and validation steps
- sprites should be tested in context, not just viewed on transparent backgrounds

What to borrow:

- choose and order frames
- validate loops before export
- test the character inside a real scene

What not to copy blindly:

- the UI is powerful but broad
- you should start with one task scene, not a full sprite-workbench product

### 3. Chong-U: Generating Animated Game Sprites Using GPT-5.4 + Image 1.5

This is the most technically useful reference.

What it shows:

- start from one approved seed frame
- upscale and place that frame into a larger reference canvas
- ask for a full animation strip in one request
- normalize the result back into fixed-size game frames
- use one shared scale across the strip
- lock frame 01 back to the approved idle when needed
- verify in a preview scene before treating the output as usable

What matters:

- consistency comes from anchoring to a real approved sprite
- full-strip generation is more stable than frame-by-frame generation
- normalization is mandatory if the output is supposed to be production-ready

Useful lesson:

- if you want recurring characters in your app theater, do not regenerate them from scratch every time
- pick a canonical courier, alchemist, and porter
- anchor all later animation generation to those approved designs

What to borrow:

- seed-frame workflow
- full-strip generation
- shared-scale normalization
- preview-before-acceptance

What not to copy blindly:

- you do not need a complex production asset pipeline on day one
- but you should adopt the consistency principles immediately

### 4. dominik kundel: Codex + Playwright Interactive For Complex Front-End Work

What it shows:

- browser-based iterative prototyping
- using a JavaScript-capable agent loop to build and test interactive visual systems
- complex UI or game-like work developed through fast visual feedback

What matters:

- your first implementation should be browser-first
- animation work is mostly timing and feel, so fast iteration is critical

Useful lesson:

- build the first task theater in a browser sandbox
- optimize for rapid visual debugging
- do not begin with a native desktop embedding problem

What to borrow:

- browser-first runtime
- fast iteration loops
- visual debugging and scene replay

What not to copy blindly:

- the post is about the build workflow, not sprite generation itself
- it supports the technical approach more than the art approach

## Synthesis

The common pattern across the references is:

- generation alone is not enough
- preview is essential
- normalization is essential
- consistency comes from anchoring
- iteration speed matters

That leads to a strong recommendation:

- use AI to accelerate concepting and rough animation generation
- but structure the project around a curated asset pipeline and a browser-based sandbox

## What This Means For `msg-to-pdf-dropzone`

The app already has a clean real-world workflow:

- user drops `.msg` files
- Outlook selection may be materialized into temp `.msg` files
- files are accepted into a list
- user chooses an output folder
- each file is parsed
- thread naming is computed
- PDF writing tries a fidelity pipeline first
- fallback pipelines are attempted if needed
- PDF is written to disk
- success or failure is reported

That is already enough structure for a sprite-based task layer.

## Best V1 Task-Theater Mapping

### Scene

Build one horizontal scene with:

- source shelf
- intake desk
- conversion station
- destination dock
- error tray

### Cast

Use only three recurring characters:

- Courier: brings in the message file
- Clerk: stamps or labels the output name
- Porter: carries the final PDF to the destination

The conversion station itself can act like the "alchemist" so you do not need a fourth character yet.

### Workflow Mapping

Map the real app stages to animation beats:

1. `drop_received`
   - envelope or document appears at the source shelf
2. `outlook_extract_started`
   - courier pulls a message from an Outlook portal or mailbox
3. `files_accepted`
   - accepted documents stack in the intake area
4. `output_folder_selected`
   - destination dock lights up
5. `parse_started`
   - clerk inspects the document at the intake desk
6. `filename_built`
   - clerk stamps the dated PDF label
7. `pdf_pipeline_started`
   - courier places the item into the conversion station
8. `pipeline_outlook_edge`
   - station glows blue
9. `pipeline_edge_html`
   - station glows amber
10. `pipeline_reportlab`
    - station switches to a manual mechanical fallback mode
11. `pdf_written`
    - finished PDF pops out
12. `deliver_started`
    - porter carries the PDF to the destination dock
13. `complete`
    - small success beat
14. `failed`
    - item goes to error tray with a brief fail reaction

This keeps the animation truthful while still making the workflow charming.

## Why This Project Is A Good First Target

`msg-to-pdf-dropzone` is a strong first app for task theater because:

- the input object is visually obvious
- the transformation is concrete
- the destination is concrete
- the workflow has useful internal stages
- the fallback pipelines can become visible personality instead of hidden implementation detail

The pipeline fallback is especially useful.

Instead of hiding implementation details, you can turn them into flavor:

- `outlook_edge` feels premium or magical
- `edge_html` feels standard and efficient
- `reportlab` feels mechanical and dependable

That gives the animation system honest variation without inventing fake drama.

## AI-Assisted Asset Recommendation

AI assistance is appropriate here, but only if used with discipline.

Recommended asset approach:

1. Use AI for concept exploration and rough first-pass sprite strips.
2. Approve one canonical idle frame per recurring character.
3. Generate or refine full animation strips anchored to that approved frame.
4. Normalize frame size, scale, and alignment.
5. Hand-tune the final accepted assets.

That is the most effective and future-proof approach because:

- it is faster than hand-authoring everything
- it preserves recurring-character consistency
- it avoids depending on raw text prompts for production assets

Do not use AI like this:

- new prompt for the courier every time
- different art styles per workflow
- final assets accepted without preview and cleanup

## Recommended Technical Shape

For the runtime:

- Vite
- TypeScript
- PixiJS

For the first integration:

- browser sandbox first
- mock events based on the real app stages
- later add a small adapter inside `msg-to-pdf-dropzone` that emits normalized events

## Recommended Event Schema For V1

```json
{
  "taskId": "job-001",
  "taskType": "msg-to-pdf",
  "stage": "pdf_pipeline_started",
  "fileName": "message.msg",
  "pipeline": "outlook_edge",
  "success": null,
  "timestamp": "2026-03-19T09:00:00-06:00"
}
```

Optional fields later:

- `batchIndex`
- `requestedCount`
- `outputPath`
- `error`
- `timingMs`

## Where To Hook Into The Existing App

From the current project structure, the most natural hook points are:

- app-level interaction states in the Tk app
- per-batch conversion states in `convert_msg_files`
- per-file PDF pipeline selection in `write_email_pdf`

In practical terms:

- emit coarse UI events from the app layer
- emit per-file stage events from the converter
- emit render-pipeline events from the PDF writer

That gives you enough signal for a convincing first integration without rewriting the app.

## Best Immediate Next Steps

1. Write the `msg-to-pdf` storyboard in 6 to 10 beats.
2. Define the small event schema above.
3. Build a browser sandbox that replays one fake conversion.
4. Use placeholder art first if needed.
5. Once the scene reads clearly, build or generate the first canonical courier character.
6. Only after the sandbox works, add an adapter for the real `msg-to-pdf-dropzone` events.

## Bottom Line

The references support a clear path:

- browser-first prototype
- AI-assisted but anchored asset pipeline
- preview and normalization as core workflow steps
- one accurate, charming `msg-to-pdf` scene before anything broader

That is the highest-leverage route to something users will react to with "that is super cool" instead of "why is this random animation on my screen?"
