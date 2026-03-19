# `msg-to-pdf` Storyboard

This is the first storyboard for the task-theater prototype.

## Goal

Show one `msg` file becoming one PDF in a way that is:

- readable in a few seconds
- accurate to the real app stages
- charming without becoming noisy

## Scene Layout

Use one left-to-right workshop stage:

- Source Shelf
- Intake Desk
- Conversion Station
- Destination Dock
- Error Tray

## Cast

- Courier
- Clerk
- Porter

## Props

- `MSG` document
- `PDF` document
- output label stamp
- conversion glow

## Success Sequence

### Beat 1: Awaiting Work

- Scene is idle.
- Characters loop with subtle idle motion.
- Source Shelf is empty.

Trigger:

- `drop_received`

### Beat 2: Input Appears

- An `MSG` document appears on the Source Shelf.
- Courier looks toward it.

Meaning:

- the app has accepted input for processing

Trigger:

- `drop_received`

### Beat 3: Intake Pickup

- Courier runs to the Source Shelf.
- Courier picks up the `MSG` document.
- Courier carries it to the Intake Desk.

Meaning:

- the file is being staged for processing

Trigger:

- `files_accepted`

### Beat 4: Clerk Inspection

- Clerk leans over the document at the Intake Desk.
- A brief inspection pulse or scanning line appears.

Meaning:

- parse and thread analysis are happening

Trigger:

- `parse_started`

### Beat 5: Label Stamp

- Clerk stamps the output date label.
- Tiny date-tag card appears next to the document.

Meaning:

- filename and thread date are computed

Trigger:

- `filename_built`

### Beat 6: Station Load

- Courier carries the prepared `MSG` document to the Conversion Station.
- Station wakes up and starts a low idle glow.

Meaning:

- PDF rendering pipeline has started

Trigger:

- `pdf_pipeline_started`

### Beat 7: Conversion Mode

The station has three visual modes:

- `outlook_edge`: arcane glow, smooth blue effect
- `edge_html`: clean amber pulse
- `reportlab`: mechanical gears, crank, or press effect

Meaning:

- the real pipeline choice is reflected honestly

Trigger:

- `pipeline_selected`

### Beat 8: PDF Emerges

- The original `MSG` disappears into the station.
- A `PDF` document pops out.

Meaning:

- the file was rendered successfully

Trigger:

- `pdf_written`

### Beat 9: Delivery

- Porter picks up the `PDF`.
- Destination Dock lights up.
- Porter carries the `PDF` to the dock and drops it off.

Meaning:

- the finished output is delivered to the chosen folder

Trigger:

- `deliver_started`
- `complete`

### Beat 10: Success Beat

- Small sparkle or stamp effect.
- Characters briefly react with a subtle success motion.
- Scene returns to idle.

Meaning:

- work completed successfully

Trigger:

- `complete`

## Failure Sequence

### Beat F1: Station Failure

- Station sputters or flashes red.
- Processing stops.

Trigger:

- `failed`

### Beat F2: Failed Output

- The item appears marked `FAILED`.
- Courier or Clerk reacts briefly.

Trigger:

- `failed`

### Beat F3: Error Tray

- Failed item is moved to the Error Tray.
- Scene settles back to idle.

Trigger:

- `failed`

## Pacing Guidance

- total success loop target: 5 to 8 seconds
- each beat should read clearly even at a glance
- do not overlap too many major actions at once
- keep reaction beats short

## Accuracy Rules

- never show a `PDF` before `pdf_written`
- never show a success beat before `complete`
- station mode should match the actual pipeline when known
- failures should stop the success choreography immediately

## First Prototype Simplification

For the first browser sandbox:

- use one file per replay
- use placeholder characters and props
- use fake events
- support replay on demand
- log the emitted stages beside the scene
