# Event Schema V1

This schema is the normalized contract between an application and the sprite task theater.

## Design Goals

- small enough to emit from many kinds of apps
- expressive enough to drive readable scenes
- stable even if the art style changes

## Event Shape

```json
{
  "taskId": "job-001",
  "taskType": "msg-to-pdf",
  "stage": "pdf_pipeline_started",
  "fileName": "message.msg",
  "pipeline": "outlook_edge",
  "success": null,
  "timestamp": "2026-03-19T09:00:00-06:00",
  "meta": {
    "outputName": "2026-03-18_Project Update.pdf",
    "outputDirLabel": "Selected Folder"
  }
}
```

## Required Fields

- `taskId`
- `taskType`
- `stage`
- `timestamp`

## Optional Fields

- `fileName`
- `pipeline`
- `success`
- `error`
- `meta`

## Enumerations

### `taskType`

For `v1`:

- `msg-to-pdf`

### `stage`

For `msg-to-pdf`:

- `drop_received`
- `outlook_extract_started`
- `files_accepted`
- `output_folder_selected`
- `parse_started`
- `filename_built`
- `pdf_pipeline_started`
- `pipeline_selected`
- `pdf_written`
- `deliver_started`
- `complete`
- `failed`

### `pipeline`

For `msg-to-pdf`:

- `outlook_edge`
- `edge_html`
- `reportlab`

### `success`

- `true`
- `false`
- `null`

Use `null` for in-progress stages.

## Semantics

### `drop_received`

Input has been accepted for processing.

### `outlook_extract_started`

The app is materializing a selected Outlook item into a real `.msg` file.

### `files_accepted`

The file is accepted into the conversion batch.

### `output_folder_selected`

The destination folder has been chosen.

### `parse_started`

The app is parsing the `.msg` contents.

### `filename_built`

The output filename has been computed.

### `pdf_pipeline_started`

Rendering work has begun.

### `pipeline_selected`

The app knows which rendering pipeline is currently active.

### `pdf_written`

The output PDF now exists.

### `deliver_started`

The scene may animate the final handoff to the destination dock.

### `complete`

The task finished successfully.

### `failed`

The task failed and the scene should stop success choreography.

## TypeScript Reference

```ts
export type TaskType = "msg-to-pdf";

export type TaskStage =
  | "drop_received"
  | "outlook_extract_started"
  | "files_accepted"
  | "output_folder_selected"
  | "parse_started"
  | "filename_built"
  | "pdf_pipeline_started"
  | "pipeline_selected"
  | "pdf_written"
  | "deliver_started"
  | "complete"
  | "failed";

export type RenderPipeline = "outlook_edge" | "edge_html" | "reportlab";

export interface TaskEvent {
  taskId: string;
  taskType: TaskType;
  stage: TaskStage;
  timestamp: string;
  fileName?: string;
  pipeline?: RenderPipeline;
  success?: boolean | null;
  error?: string;
  meta?: Record<string, string | number | boolean | null>;
}
```

## Integration Guidance For `msg-to-pdf-dropzone`

Emit events from three layers:

- app UI layer for intake and folder-selection stages
- converter layer for parse and naming stages
- PDF writer layer for render pipeline and completion stages

This keeps the UI event stream accurate without tightly coupling the app to any specific animation engine.
