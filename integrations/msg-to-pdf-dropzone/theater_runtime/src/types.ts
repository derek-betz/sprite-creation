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

export type TaskMetaValue = string | number | boolean | null;

export interface TaskEvent {
  taskId: string;
  taskType: TaskType;
  stage: TaskStage;
  timestamp: string;
  fileName?: string;
  pipeline?: RenderPipeline;
  success?: boolean | null;
  error?: string;
  meta?: Record<string, TaskMetaValue>;
}

export interface EventBatchResponse {
  events: TaskEvent[];
  nextOffset: number;
}

export interface TaskSnapshot {
  taskId: string;
  taskType: TaskType;
  stage: TaskStage;
  firstTimestamp: string;
  lastTimestamp: string;
  batchId?: string;
  batchSize?: number;
  batchIndex?: number;
  fileName?: string;
  pipeline?: RenderPipeline;
  outputName?: string;
  outputPath?: string;
  outputDir?: string;
  outputDirLabel?: string;
  success?: boolean | null;
  error?: string;
  meta: Record<string, TaskMetaValue>;
  events: TaskEvent[];
  hasPdfWritten: boolean;
  terminal: boolean;
  failed: boolean;
}

export type EventSourceStatus = "connecting" | "live" | "error";

export interface TheaterPoint {
  x: number;
  y: number;
}

export interface ArtLayerManifest {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha?: number;
}

export interface StationArtManifest {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentArtManifest {
  msg: string;
  pdf: string;
  failed: string;
}

export interface CourierArtManifest {
  file: string;
  width: number;
  height: number;
  carryAnchorX: number;
  carryAnchorY: number;
}

export interface PipelineFxManifest {
  stationGlowColor: number;
  stationGlowAlpha: number;
  destinationGlowColor: number;
  destinationGlowAlpha: number;
}

export interface TheaterAnchorManifest {
  entry: TheaterPoint;
  intake: TheaterPoint;
  station: TheaterPoint;
  destination: TheaterPoint;
  error: TheaterPoint;
  stationIncoming: TheaterPoint;
  stationOutgoing: TheaterPoint;
  stationTransferMid: TheaterPoint;
  errorStack: TheaterPoint;
  actorStops: {
    entry: TheaterPoint;
    intake: TheaterPoint;
    station: TheaterPoint;
    destination: TheaterPoint;
    error: TheaterPoint;
  };
}

export interface ArtManifest {
  environment: {
    background: ArtLayerManifest[];
    foreground: ArtLayerManifest[];
  };
  stations: {
    intake: StationArtManifest;
    conversion: StationArtManifest;
    destination: StationArtManifest;
    error: StationArtManifest;
  };
  courier: CourierArtManifest;
  documents: DocumentArtManifest;
  anchors: TheaterAnchorManifest;
  pipelineFx: Record<RenderPipeline, PipelineFxManifest>;
}

export const TERMINAL_STAGES = new Set<TaskStage>(["complete", "failed"]);

export const STAGE_LABELS: Record<TaskStage, string> = {
  drop_received: "Document arrived",
  outlook_extract_started: "Reading Outlook selection",
  files_accepted: "Accepted into queue",
  output_folder_selected: "Destination chosen",
  parse_started: "Parsing message",
  filename_built: "Naming the PDF",
  pdf_pipeline_started: "Walking to the conversion station",
  pipeline_selected: "Conversion mode locked",
  pdf_written: "PDF created",
  deliver_started: "Delivering to destination",
  complete: "Delivered",
  failed: "Conversion failed"
};

export const IMPORTANT_STAGES = new Set<TaskStage>([
  "files_accepted",
  "output_folder_selected",
  "parse_started",
  "filename_built",
  "pdf_pipeline_started",
  "pipeline_selected",
  "pdf_written",
  "deliver_started",
  "complete",
  "failed"
]);
