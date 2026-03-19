import "./styles.css";

import { Application, Color, Container, Graphics, Text } from "pixi.js";

type TaskType = "msg-to-pdf";
type TaskStage =
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
type RenderPipeline = "outlook_edge" | "edge_html" | "reportlab";

interface TaskEvent {
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

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ActorVisual {
  body: Container;
  label: Text;
}

class StageActor {
  readonly view: Container;
  readonly name: string;
  private baseY: number;
  private bobOffset = Math.random() * Math.PI * 2;

  constructor(name: string, color: number, x: number, y: number) {
    this.name = name;
    this.view = new Container();
    this.baseY = y;

    const shadow = new Graphics();
    shadow.ellipse(0, 18, 22, 8).fill({ color: 0x05070d, alpha: 0.28 });
    shadow.y = 12;

    const body = new Graphics();
    body.roundRect(-18, -34, 36, 44, 14).fill(color);
    body.roundRect(-12, -48, 24, 20, 10).fill(Color.shared.setValue(color).multiply(1.12));
    body.rect(-10, 10, 8, 18).fill(Color.shared.setValue(color).multiply(0.9));
    body.rect(2, 10, 8, 18).fill(Color.shared.setValue(color).multiply(0.9));

    const badge = new Graphics();
    badge.roundRect(-14, -8, 28, 10, 5).fill(0xf7f2e7);

    const label = new Text({
      text: name,
      style: {
        fill: 0xf7f2e7,
        fontFamily: "Georgia, serif",
        fontSize: 11
      }
    });
    label.anchor.set(0.5, 0);
    label.y = 34;

    this.view.position.set(x, y);
    this.view.addChild(shadow, body, badge, label);
  }

  update(deltaSeconds: number): void {
    this.bobOffset += deltaSeconds * 2.3;
    this.view.y = this.baseY + Math.sin(this.bobOffset) * 1.8;
  }

  setPosition(x: number, y: number): void {
    this.view.position.set(x, y);
    this.baseY = y;
  }
}

class DocumentProp {
  readonly view: Container;
  private frame: Graphics;
  private label: Text;
  private tag: Text;

  constructor(kind: "MSG" | "PDF") {
    this.view = new Container();
    this.frame = new Graphics();
    this.label = new Text({
      text: kind,
      style: {
        fill: 0x1f2937,
        fontFamily: "Courier New, monospace",
        fontSize: 18,
        fontWeight: "700"
      }
    });
    this.tag = new Text({
      text: "",
      style: {
        fill: 0x9ca3af,
        fontFamily: "Courier New, monospace",
        fontSize: 10
      }
    });

    this.view.addChild(this.frame, this.label, this.tag);
    this.setKind(kind);
  }

  setKind(kind: "MSG" | "PDF"): void {
    const paperColor = kind === "MSG" ? 0xfff7e8 : 0xe9f1ff;
    const accent = kind === "MSG" ? 0xdc7b2b : 0x3072f6;

    this.frame.clear();
    this.frame.roundRect(0, 0, 72, 92, 10).fill(paperColor).stroke({ color: 0x1d2734, width: 2 });
    this.frame.roundRect(10, 14, 52, 12, 6).fill(accent);
    this.frame.rect(10, 38, 50, 5).fill({ color: 0x475569, alpha: 0.45 });
    this.frame.rect(10, 50, 44, 5).fill({ color: 0x475569, alpha: 0.3 });
    this.frame.rect(10, 62, 36, 5).fill({ color: 0x475569, alpha: 0.22 });

    this.label.text = kind;
    this.label.anchor.set(0.5);
    this.label.position.set(36, 20);

    this.tag.anchor.set(0.5);
    this.tag.position.set(36, 80);
  }

  setTag(text: string): void {
    this.tag.text = text;
  }

  setFailedTag(): void {
    this.tag.text = "FAILED";
    this.tag.style.fill = 0xc73e2d;
  }

  setNormalTag(): void {
    this.tag.style.fill = 0x9ca3af;
  }
}

class WorkshopScene {
  readonly app: Application;
  readonly view: HTMLCanvasElement;
  readonly currentStageEl: HTMLElement;
  readonly eventListEl: HTMLElement;
  readonly outputNameEl: HTMLElement;
  readonly pipelineEl: HTMLElement;
  readonly replayButton: HTMLButtonElement;
  private root: HTMLElement;
  private stage: Container;
  private zones: Record<string, Zone>;
  private courier: StageActor;
  private clerk: StageActor;
  private porter: StageActor;
  private document: DocumentProp;
  private station: Graphics;
  private stationGlow: Graphics;
  private destinationLight: Graphics;
  private errorTray: Graphics;
  private activeRunToken = 0;
  private lastPipeline: RenderPipeline | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = `
      <div class="shell">
        <section class="stage-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Sprite Task Theater</p>
              <h1>msg-to-pdf scene sandbox</h1>
            </div>
            <button class="replay-button" type="button">Replay Scene</button>
          </div>
          <div class="canvas-frame">
            <div class="canvas-host"></div>
          </div>
        </section>
        <aside class="side-panel">
          <section class="card">
            <p class="card-label">Current Stage</p>
            <h2 class="stage-value">idle</h2>
            <div class="meta-grid">
              <div>
                <p class="card-label">Pipeline</p>
                <p class="meta-value pipeline-value">none</p>
              </div>
              <div>
                <p class="card-label">Output Name</p>
                <p class="meta-value output-value">not built yet</p>
              </div>
            </div>
          </section>
          <section class="card">
            <p class="card-label">Fake Event Feed</p>
            <ol class="event-feed"></ol>
          </section>
        </aside>
      </div>
    `;

    this.currentStageEl = this.root.querySelector(".stage-value") as HTMLElement;
    this.pipelineEl = this.root.querySelector(".pipeline-value") as HTMLElement;
    this.outputNameEl = this.root.querySelector(".output-value") as HTMLElement;
    this.eventListEl = this.root.querySelector(".event-feed") as HTMLElement;
    this.replayButton = this.root.querySelector(".replay-button") as HTMLButtonElement;

    this.app = new Application();
    this.stage = new Container();

    this.zones = {
      source: { x: 42, y: 300, width: 170, height: 126, label: "Source Shelf" },
      intake: { x: 240, y: 266, width: 170, height: 160, label: "Intake Desk" },
      station: { x: 438, y: 220, width: 206, height: 206, label: "Conversion Station" },
      destination: { x: 674, y: 260, width: 160, height: 166, label: "Destination Dock" },
      error: { x: 674, y: 440, width: 160, height: 68, label: "Error Tray" }
    };

    this.courier = new StageActor("Courier", 0x2f8f83, 124, 452);
    this.clerk = new StageActor("Clerk", 0xa15f2f, 324, 452);
    this.porter = new StageActor("Porter", 0x4969b4, 742, 452);
    this.document = new DocumentProp("MSG");

    this.station = new Graphics();
    this.stationGlow = new Graphics();
    this.destinationLight = new Graphics();
    this.errorTray = new Graphics();

    this.view = document.createElement("canvas");
    const canvasHost = this.root.querySelector(".canvas-host") as HTMLElement;
    canvasHost.appendChild(this.view);
  }

  async init(): Promise<void> {
    await this.app.init({
      canvas: this.view,
      width: 880,
      height: 540,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    this.app.stage.addChild(this.stage);
    this.drawBackdrop();
    this.drawZones();
    this.drawStation();
    this.drawDestinationDock();
    this.drawErrorTray();

    this.document.view.visible = false;
    this.document.view.position.set(this.zones.source.x + 48, this.zones.source.y + 18);
    this.stage.addChild(this.document.view);
    this.stage.addChild(this.courier.view, this.clerk.view, this.porter.view);

    this.app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;
      this.courier.update(deltaSeconds);
      this.clerk.update(deltaSeconds);
      this.porter.update(deltaSeconds);
      this.pulseStation(deltaSeconds);
    });

    window.addEventListener("resize", () => this.handleResize());
    this.handleResize();
    this.replayButton.addEventListener("click", () => {
      void this.play(buildFakeEventSequence());
    });
  }

  private handleResize(): void {
    const frame = this.root.querySelector(".canvas-frame") as HTMLElement;
    const width = frame.clientWidth - 20;
    const scale = Math.min(width / 880, 1);
    this.view.style.width = `${880 * scale}px`;
    this.view.style.height = `${540 * scale}px`;
  }

  private drawBackdrop(): void {
    const wall = new Graphics();
    wall.rect(0, 0, 880, 540).fill(0x121924);

    const canopy = new Graphics();
    canopy.rect(0, 0, 880, 220).fill({ color: 0x253347, alpha: 0.78 });

    const haze = new Graphics();
    haze.rect(0, 180, 880, 220).fill({ color: 0x101722, alpha: 0.72 });

    const floor = new Graphics();
    floor.rect(0, 392, 880, 148).fill(0x161d27);
    floor.rect(0, 390, 880, 2).fill({ color: 0xffffff, alpha: 0.08 });

    const shelfGlow = new Graphics();
    shelfGlow.circle(120, 110, 94).fill({ color: 0xc9733f, alpha: 0.11 });
    shelfGlow.circle(500, 92, 118).fill({ color: 0x6d8cff, alpha: 0.08 });

    this.stage.addChild(wall, canopy, haze, shelfGlow, floor);
  }

  private drawZones(): void {
    for (const zone of Object.values(this.zones)) {
      const panel = new Graphics();
      panel.roundRect(zone.x, zone.y, zone.width, zone.height, 20).fill({ color: 0xf3e4c7, alpha: zone.label === "Error Tray" ? 0.08 : 0.12 });
      panel.stroke({ color: 0xffffff, alpha: 0.12, width: 1.5 });

      const title = new Text({
        text: zone.label,
        style: {
          fill: 0xf4e7cd,
          fontFamily: "Georgia, serif",
          fontSize: 16,
          fontWeight: "600"
        }
      });
      title.position.set(zone.x + 16, zone.y - 28);
      this.stage.addChild(panel, title);
    }
  }

  private drawStation(): void {
    this.stationGlow.circle(541, 316, 74).fill({ color: 0x4f78ff, alpha: 0.1 });

    this.station.roundRect(470, 238, 148, 146, 26).fill(0x243042).stroke({ color: 0xdcb57d, alpha: 0.28, width: 2 });
    this.station.circle(544, 308, 42).fill({ color: 0x8ba0d4, alpha: 0.12 }).stroke({ color: 0xffffff, alpha: 0.16, width: 2 });
    this.station.circle(544, 308, 18).fill({ color: 0xffffff, alpha: 0.18 });

    this.stage.addChild(this.stationGlow, this.station);
  }

  private drawDestinationDock(): void {
    this.destinationLight.roundRect(716, 302, 80, 80, 24).fill({ color: 0x65db8d, alpha: 0.1 });
    this.destinationLight.visible = false;

    const dock = new Graphics();
    dock.roundRect(708, 294, 96, 96, 24).fill(0x233426).stroke({ color: 0xa6f0bd, alpha: 0.26, width: 2 });
    dock.roundRect(730, 328, 52, 12, 6).fill({ color: 0xa6f0bd, alpha: 0.2 });

    this.stage.addChild(this.destinationLight, dock);
  }

  private drawErrorTray(): void {
    this.errorTray.roundRect(706, 454, 96, 32, 14).fill({ color: 0x5a1f1f, alpha: 0.5 }).stroke({ color: 0xffb0a7, alpha: 0.18, width: 2 });
    this.stage.addChild(this.errorTray);
  }

  private pulseStation(deltaSeconds: number): void {
    const strength = this.lastPipeline === "outlook_edge" ? 0.18 : this.lastPipeline === "edge_html" ? 0.16 : this.lastPipeline === "reportlab" ? 0.14 : 0.08;
    const time = performance.now() / 1000;
    this.stationGlow.alpha = strength + Math.sin(time * 3.1) * 0.03 + deltaSeconds * 0;
  }

  private setStageLabel(text: string): void {
    this.currentStageEl.textContent = text;
  }

  private addFeedLine(text: string): void {
    const item = document.createElement("li");
    item.textContent = text;
    this.eventListEl.appendChild(item);
    this.eventListEl.scrollTop = this.eventListEl.scrollHeight;
  }

  private clearFeed(): void {
    this.eventListEl.innerHTML = "";
  }

  private resetScene(): void {
    this.activeRunToken += 1;
    this.setStageLabel("idle");
    this.pipelineEl.textContent = "none";
    this.outputNameEl.textContent = "not built yet";
    this.clearFeed();
    this.lastPipeline = null;
    this.destinationLight.visible = false;

    this.courier.setPosition(124, 452);
    this.clerk.setPosition(324, 452);
    this.porter.setPosition(742, 452);

    this.document.setKind("MSG");
    this.document.setNormalTag();
    this.document.setTag("");
    this.document.view.position.set(this.zones.source.x + 48, this.zones.source.y + 18);
    this.document.view.visible = false;
    this.document.view.parent = this.stage;
    this.stage.addChild(this.document.view);

    this.stationGlow.clear();
    this.stationGlow.circle(541, 316, 74).fill({ color: 0x4f78ff, alpha: 0.1 });
  }

  async play(events: TaskEvent[]): Promise<void> {
    this.resetScene();
    const runToken = this.activeRunToken;
    const startedAt = performance.now();

    for (const event of events) {
      const waitMs = Math.max(0, Date.parse(event.timestamp) - Date.parse(events[0].timestamp));
      const elapsed = performance.now() - startedAt;
      if (waitMs > elapsed) {
        await sleep(waitMs - elapsed);
      }
      if (runToken !== this.activeRunToken) {
        return;
      }
      await this.applyEvent(event);
    }
  }

  private async applyEvent(event: TaskEvent): Promise<void> {
    this.setStageLabel(event.stage);
    this.addFeedLine(`${event.stage}${event.pipeline ? ` (${event.pipeline})` : ""}`);

    switch (event.stage) {
      case "drop_received":
        this.document.setKind("MSG");
        this.document.setNormalTag();
        this.document.setTag("");
        this.document.view.position.set(this.zones.source.x + 48, this.zones.source.y + 18);
        this.document.view.visible = true;
        break;

      case "outlook_extract_started":
        await this.moveActor(this.courier, this.zones.source.x + 40, 452, 420);
        break;

      case "files_accepted":
        await this.moveActor(this.courier, this.zones.source.x + 68, 452, 240);
        await this.attachDocumentToActor(this.courier, -18, -108);
        await this.moveActor(this.courier, this.zones.intake.x + 42, 452, 620);
        this.detachDocument(this.zones.intake.x + 46, this.zones.intake.y + 24);
        break;

      case "output_folder_selected":
        this.destinationLight.visible = true;
        break;

      case "parse_started":
        await this.moveActor(this.clerk, this.zones.intake.x + 94, 452, 320);
        break;

      case "filename_built":
        if (event.meta?.outputName && typeof event.meta.outputName === "string") {
          this.outputNameEl.textContent = event.meta.outputName;
        }
        this.document.setTag("DATED");
        break;

      case "pdf_pipeline_started":
        await this.moveActor(this.courier, this.zones.intake.x + 48, 452, 220);
        await this.attachDocumentToActor(this.courier, -18, -108);
        await this.moveActor(this.courier, this.zones.station.x + 54, 452, 620);
        this.detachDocument(this.zones.station.x + 74, this.zones.station.y + 48);
        break;

      case "pipeline_selected":
        this.lastPipeline = event.pipeline ?? null;
        this.pipelineEl.textContent = event.pipeline ?? "none";
        this.recolorStation(event.pipeline ?? null);
        break;

      case "pdf_written":
        this.document.setKind("PDF");
        this.document.setNormalTag();
        this.document.setTag("READY");
        this.document.view.position.set(this.zones.station.x + 96, this.zones.station.y + 54);
        break;

      case "deliver_started":
        await this.moveActor(this.porter, this.zones.station.x + 132, 452, 520);
        await this.attachDocumentToActor(this.porter, -18, -108);
        await this.moveActor(this.porter, this.zones.destination.x + 44, 452, 620);
        this.detachDocument(this.zones.destination.x + 44, this.zones.destination.y + 34);
        break;

      case "complete":
        this.destinationLight.alpha = 0.32;
        break;

      case "failed":
        this.pipelineEl.textContent = event.pipeline ?? this.pipelineEl.textContent;
        this.document.setKind("PDF");
        this.document.setFailedTag();
        this.document.view.position.set(this.zones.error.x + 22, this.zones.error.y - 34);
        break;
    }
  }

  private recolorStation(pipeline: RenderPipeline | null): void {
    let glow = 0x4f78ff;
    if (pipeline === "edge_html") {
      glow = 0xdb9a38;
    } else if (pipeline === "reportlab") {
      glow = 0xb55b34;
    }

    this.stationGlow.clear();
    this.stationGlow.circle(541, 316, 74).fill({ color: glow, alpha: 0.16 });
  }

  private async moveActor(actor: StageActor, x: number, y: number, durationMs: number): Promise<void> {
    const fromX = actor.view.x;
    const fromY = actor.view.y;
    const start = performance.now();

    return new Promise((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = easeInOutCubic(t);
        actor.setPosition(lerp(fromX, x, eased), lerp(fromY, y, eased));
        if (t < 1) {
          requestAnimationFrame(tick);
          return;
        }
        resolve();
      };
      tick();
    });
  }

  private async attachDocumentToActor(actor: StageActor, offsetX: number, offsetY: number): Promise<void> {
    actor.view.addChild(this.document.view);
    this.document.view.position.set(offsetX, offsetY);
    await sleep(120);
  }

  private detachDocument(x: number, y: number): void {
    this.stage.addChild(this.document.view);
    this.document.view.position.set(x, y);
  }
}

function buildFakeEventSequence(): TaskEvent[] {
  const start = new Date();
  let cursor = start.getTime();
  const next = (stage: TaskStage, delayMs: number, options: Partial<TaskEvent> = {}): TaskEvent => {
    cursor += delayMs;
    return {
      taskId: "demo-job-001",
      taskType: "msg-to-pdf",
      stage,
      timestamp: new Date(cursor).toISOString(),
      success: null,
      ...options
    };
  };

  return [
    next("drop_received", 250, { fileName: "project-update.msg" }),
    next("outlook_extract_started", 550),
    next("files_accepted", 900),
    next("output_folder_selected", 420, {
      meta: { outputDirLabel: "Selected Folder" }
    }),
    next("parse_started", 560),
    next("filename_built", 720, {
      meta: { outputName: "2026-03-18_Project Update.pdf" }
    }),
    next("pdf_pipeline_started", 720),
    next("pipeline_selected", 180, { pipeline: "outlook_edge" }),
    next("pdf_written", 1100, { pipeline: "outlook_edge" }),
    next("deliver_started", 760),
    next("complete", 760, { success: true })
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const root = document.querySelector("#app");

if (!(root instanceof HTMLElement)) {
  throw new Error("Expected #app root element.");
}

const scene = new WorkshopScene(root);
await scene.init();
await scene.play(buildFakeEventSequence());
