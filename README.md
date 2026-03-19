# Sprite Task Theater

This workspace is for designing and building small animated sprite characters that visually represent application work.

## Core Idea

Instead of showing tasks as plain logs, spinners, or progress bars, the system turns each task into a short scene:

- A courier character picks up an item that represents the input.
- The item is carried to a station that represents the operation.
- A worker character performs the transformation.
- Another character delivers the output to its destination.

Example:

- `msg-to-pdf` starts.
- A sprite runs to collect a message document.
- The document is dropped into a magical conversion station.
- A PDF appears.
- A delivery sprite carries the PDF to the destination folder.

## Product Goal

Build a reusable sprite-based "task theater" that can:

- Represent real application events in a playful but understandable way.
- Make background work feel alive without becoming noisy or confusing.
- Reuse a small animation vocabulary across many task types.
- Start as a sandbox/prototype and later plug into real app events.

## Workspace Layout

- `docs/`: planning docs, event schema notes, and storyboards
- `runtime/`: the original standalone browser sandbox
- `integrations/msg-to-pdf-dropzone/`: the first real app integration, tracked as its own Git repo

If you clone this workspace from GitHub, use `--recurse-submodules` so the integration checkout is pulled with it.

## Design Principles

- Readable first: the animation should clarify what is happening.
- Whimsical second: the charm should support understanding, not replace it.
- Modular assets: characters, props, stations, and items should be reusable.
- Event-driven runtime: app events should trigger scene actions.
- Small loops: short animations are easier to author, reuse, and debug.

## Interaction Model

Every task is broken into the same basic steps:

1. `queued`
2. `claimed`
3. `pickup`
4. `process`
5. `deliver`
6. `complete` or `fail`

That gives the project a consistent animation grammar:

- `run_to(target)`
- `pickup(item)`
- `carry(item)`
- `use_station(station)`
- `spawn_output(item)`
- `deliver(item, destination)`
- `react_success()`
- `react_failure()`
- `idle()`

## Recommended First Use Case

Start with exactly one polished scenario:

- `msg-to-pdf`

Why:

- It has a clear input, transformation, and output.
- The metaphor is easy to animate.
- It creates a useful pattern for many future jobs.

## Suggested Technical Direction

Assumption: start with a browser-based prototype because it is the fastest place to iterate on art, timing, and event handling.

Recommended stack:

- Sprite art: Aseprite
- Runtime: TypeScript + PixiJS
- App shell: Vite
- Animation/state flow: simple task state machines, not a heavy game engine
- Event input: mocked JSON events first, then WebSocket or local event bridge

Why this stack:

- PixiJS is strong for 2D sprite scenes without the overhead of a full game engine.
- Vite keeps iteration fast.
- A mock-event loop lets you perfect the visual model before wiring into production systems.

## Runtime Architecture

### 1. Task Event Layer

Normalize real app work into a small event schema:

```json
{
  "taskId": "job-123",
  "taskType": "msg-to-pdf",
  "status": "started",
  "source": "inbox/message.msg",
  "destination": "output/report.pdf",
  "metadata": {
    "priority": "normal"
  }
}
```

### 2. Scene Mapper

Map task types to staged animations:

- `msg-to-pdf` -> courier + conversion circle + delivery
- `upload-file` -> porter + launcher + cloud drop-off
- `index-document` -> archivist + sorting desk + library shelf

### 3. Animation Engine

The runtime should:

- assign a sprite to the job
- move it through scene waypoints
- attach items to the sprite during carry steps
- switch stations into processing loops
- emit success or failure beats

### 4. Asset System

Organize assets into reusable buckets:

- characters
- items
- stations
- effects
- tiles/backgrounds

## Art Direction Recommendation

Start narrow.

Pick one style and constrain it:

- Pixel art
- Fixed scale such as `32x32` or `48x48`
- Limited palette
- Side-view movement
- Simple exaggerated silhouettes

Character roles can be semantic:

- courier
- wizard/transformer
- archivist
- mechanic
- messenger

This is better than inventing one unique character per workflow right away.

## Authoring Strategy

Do not hand-author every workflow animation from scratch.

Instead, build a kit:

- base locomotion loops
- pickup/drop poses
- carry poses
- station interaction loops
- reaction loops
- item overlays

Then compose workflows from those parts.

## Best Plan Of Action

### Phase 1: Lock the visual language

- choose pixel size, palette, and camera angle
- define 3 to 5 character roles
- sketch 1 station for conversion magic
- sketch 3 to 5 item types like document, PDF, folder, package

Deliverable:

- a one-page style sheet and rough sprite sketches

### Phase 2: Build the animation vocabulary

- create idle, run, pickup, carry, drop, process, celebrate, fail
- export spritesheets for the first character
- prove that one character can complete the full `msg-to-pdf` sequence

Deliverable:

- one complete polished animation loop in isolation

### Phase 3: Build the sandbox runtime

- create a small stage with source zone, process zone, and destination zone
- load spritesheets into PixiJS
- drive the scene from mocked events
- queue multiple jobs and make sure animations remain readable

Deliverable:

- local prototype that can replay demo jobs

### Phase 4: Design the event contract

- define a stable JSON schema for task events
- map task lifecycle states to animation states
- decide how failures, retries, and cancellations look

Deliverable:

- event contract document plus sample payloads

### Phase 5: Integrate with a real app

- connect to one real background process
- translate process events into normalized task events
- tune pacing so it feels informative instead of distracting

Deliverable:

- one real workflow visualized end-to-end

### Phase 6: Generalize

- add more stations and character roles
- support concurrent jobs
- add priority, error, and retry behaviors
- package the runtime so other apps can embed it

Deliverable:

- reusable task-visualization module

## Practical Repo Structure

```text
docs/
  vision.md
  event-schema.md
art/
  characters/
  items/
  stations/
  palettes/
runtime/
  app/
  assets/
  src/
examples/
  msg-to-pdf-events.json
```

## Biggest Risks

- Over-animating and losing clarity.
- Making every workflow custom instead of composable.
- Wiring into real app events before the sandbox metaphor feels right.
- Allowing too many concurrent characters on screen.

## Immediate Next Steps

1. Decide whether the visual style is pixel-art, hand-drawn 2D, or something else.
2. Decide whether the first target is a browser prototype, desktop overlay, or embedded app component.
3. Create the first `msg-to-pdf` storyboard.
4. Build the smallest runtime that can replay that storyboard from fake events.

## Open Questions

- Do you want this to feel like a tiny game, a desktop pet, or a subtle status layer inside an app?
- Is the target environment a web app, macOS app, Electron app, or something else?
- Do you want pixel art specifically, or are you open to other 2D styles?
- Should the sprites be mostly decorative, or should they be a serious operational UI that communicates status at a glance?
