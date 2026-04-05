import "./styles.css";

import { Application, Assets, Color, Container, Graphics, Sprite, Text } from "pixi.js";

import {
  STAGE_LABELS,
  type ArtManifest,
  type EventSourceStatus,
  type RenderPipeline,
  type TaskEvent,
  type TaskSnapshot,
  type TheaterPoint
} from "./types";
import type { AnimationOptions, SceneAdapter } from "./scene-scheduler";

export interface DemoSettings {
  fileCount: number;
  failureCount: number;
}

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

type BundleLocation = "entry" | "intake" | "station" | "destination" | "error";
type TerminalDisplayLocation = Extract<BundleLocation, "destination" | "error">;
type StationPile = "incoming" | "outgoing";

class StageActor {
  readonly view: Container;
  private readonly model: Container;
  private baseX: number;
  private baseY: number;
  private bobOffset = Math.random() * Math.PI * 2;
  private carryAnchorX = -14;
  private carryAnchorY = -132;
  private modelScale = 1.22;
  private facing = 1;

  constructor(name: string, color: number, x: number, y: number) {
    this.view = new Container();
    this.model = new Container();
    this.baseX = x;
    this.baseY = y;

    const shadow = new Graphics();
    shadow.ellipse(0, 28, 30, 11).fill({ color: 0x030509, alpha: 0.3 });
    shadow.y = 18;

    const reactorGlow = new Graphics();
    reactorGlow.circle(0, -8, 28).fill({ color: 0x79ebff, alpha: 0.11 });

    const cape = new Graphics();
    cape
      .poly([-22, -40, -6, 26, 0, 34, 8, 26, 24, -36], true)
      .fill(0x1b2333)
      .stroke({ color: 0x435677, alpha: 0.38, width: 1.5 });

    const body = new Graphics();
    body
      .roundRect(-18, -70, 36, 20, 10)
      .fill(Color.shared.setValue(color).multiply(1.18))
      .stroke({ color: 0xeff9ff, alpha: 0.22, width: 1.5 });
    body
      .roundRect(-24, -54, 48, 52, 16)
      .fill(color)
      .stroke({ color: 0xd6f3ff, alpha: 0.18, width: 1.5 });
    body
      .roundRect(-30, -52, 16, 18, 8)
      .fill(Color.shared.setValue(color).multiply(0.85));
    body
      .roundRect(14, -52, 16, 18, 8)
      .fill(Color.shared.setValue(color).multiply(0.85));
    body
      .roundRect(-30, -30, 14, 30, 8)
      .fill(Color.shared.setValue(color).multiply(0.94));
    body
      .roundRect(16, -30, 14, 30, 8)
      .fill(Color.shared.setValue(color).multiply(0.94));
    body
      .roundRect(-20, 2, 14, 34, 8)
      .fill(Color.shared.setValue(color).multiply(0.78));
    body
      .roundRect(6, 2, 14, 34, 8)
      .fill(Color.shared.setValue(color).multiply(0.78));
    body.roundRect(-22, 34, 18, 9, 4).fill(0x232833);
    body.roundRect(4, 34, 18, 9, 4).fill(0x232833);
    body.circle(0, -26, 8).fill(0x8effff);
    body.circle(0, -26, 15).stroke({ color: 0xa6f6ff, alpha: 0.34, width: 2 });
    body.roundRect(-8, -18, 16, 18, 6).fill(0x1c2738);
    body.roundRect(-8, -12, 16, 5, 2).fill(0xb6dfff);
    body.roundRect(-6, -66, 12, 5, 2).fill(0xd6f0ff);

    const badge = new Graphics();
    badge.roundRect(-16, -12, 32, 11, 5).fill(0x102737);
    badge.roundRect(-11, -10, 22, 4, 2).fill(0xf0c36d);

    const blade = new Graphics();
    blade
      .poly([24, -18, 42, -26, 44, -8, 26, -2], true)
      .fill({ color: 0x6ae5ff, alpha: 0.72 })
      .stroke({ color: 0xf0ffff, alpha: 0.3, width: 1 });

    const label = new Text({
      text: name,
      style: {
        fill: 0xf7f2e7,
        fontFamily: "Palatino Linotype, Book Antiqua, serif",
        fontSize: 11
      }
    });
    label.anchor.set(0.5, 0);
    label.y = 48;

    this.view.position.set(x, y);
    this.model.addChild(shadow, reactorGlow, cape, body, badge, blade);
    this.model.scale.set(this.modelScale, this.modelScale);
    this.model.y = -6;
    this.view.addChild(this.model, label);
  }

  update(deltaSeconds: number): void {
    this.bobOffset += deltaSeconds * 2.2;
    this.view.x = this.baseX + Math.cos(this.bobOffset * 0.7) * 1.1;
    this.view.y = this.baseY + Math.sin(this.bobOffset) * 1.7;
  }

  setPosition(x: number, y: number): void {
    if (Math.abs(x - this.baseX) > 1) {
      this.facing = x > this.baseX ? 1 : -1;
      this.model.scale.set(this.modelScale * this.facing, this.modelScale);
    }
    this.view.position.set(x, y);
    this.baseX = x;
    this.baseY = y;
  }

  applySkin(
    file: string,
    width: number,
    height: number,
    carryAnchorX: number,
    carryAnchorY: number
  ): void {
    this.model.removeChildren();
    const sprite = Sprite.from(file);
    sprite.anchor.set(0.5, 1);
    sprite.width = width;
    sprite.height = height;
    this.modelScale = 1;
    this.model.scale.set(this.modelScale * this.facing, this.modelScale);
    this.model.y = 0;
    this.model.addChild(sprite);
    this.carryAnchorX = carryAnchorX;
    this.carryAnchorY = carryAnchorY;
  }

  carryAnchor(): { x: number; y: number } {
    return { x: this.carryAnchorX * this.facing, y: this.carryAnchorY };
  }
}

class DocumentProp {
  readonly view: Container;
  private readonly stack: Graphics;
  private readonly artLayer: Container;
  private readonly frame: Graphics;
  private readonly label: Text;
  private readonly tag: Text;
  private readonly countBubble: Graphics;
  private readonly countLabel: Text;
  private stackCount = 1;
  private artPaths: Partial<Record<"MSG" | "PDF" | "FAILED", string>> = {};
  private currentArtState: "MSG" | "PDF" | "FAILED" = "MSG";

  constructor(kind: "MSG" | "PDF") {
    this.view = new Container();
    this.stack = new Graphics();
    this.artLayer = new Container();
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
    this.countBubble = new Graphics();
    this.countLabel = new Text({
      text: "",
      style: {
        fill: 0x1a130d,
        fontFamily: "Courier New, monospace",
        fontSize: 10,
        fontWeight: "700"
      }
    });
    this.countLabel.anchor.set(0.5);
    this.countLabel.position.set(60, 10);

    this.view.addChild(
      this.stack,
      this.artLayer,
      this.frame,
      this.label,
      this.tag,
      this.countBubble,
      this.countLabel
    );
    this.setKind(kind);
  }

  setKind(kind: "MSG" | "PDF"): void {
    const paperColor = kind === "MSG" ? 0xfff4de : 0xe6eeff;
    const accent = kind === "MSG" ? 0xf39c45 : 0x4d88ff;
    const trim = kind === "MSG" ? 0x523822 : 0x213766;
    this.currentArtState = kind;

    this.frame.clear();
    this.frame
      .roundRect(0, 0, 72, 92, 10)
      .fill(paperColor)
      .stroke({ color: trim, width: 2 });
    this.frame
      .roundRect(6, 8, 60, 16, 6)
      .fill({ color: accent, alpha: 0.22 })
      .stroke({ color: accent, alpha: 0.56, width: 1.5 });
    this.frame.roundRect(10, 13, 28, 7, 3).fill(accent);
    this.frame.circle(53, 16, 6).fill({ color: accent, alpha: 0.28 });
    this.frame.rect(10, 35, 50, 4).fill({ color: trim, alpha: 0.28 });
    this.frame.rect(10, 46, 46, 4).fill({ color: trim, alpha: 0.22 });
    this.frame.rect(10, 57, 38, 4).fill({ color: trim, alpha: 0.16 });
    this.frame
      .poly([52, 0, 72, 0, 72, 20, 62, 20, 52, 10], true)
      .fill({ color: 0xffffff, alpha: 0.24 })
      .stroke({ color: trim, alpha: 0.24, width: 1 });

    this.label.text = kind;
    this.label.anchor.set(0.5);
    this.label.position.set(36, 18);

    this.tag.anchor.set(0.5);
    this.tag.position.set(36, 78);
    this.applyArtState(this.currentArtState);
    this.redrawStack();
  }

  setStackCount(count: number): void {
    this.stackCount = Math.max(1, Math.round(count));
    this.redrawStack();
  }

  setTag(text: string): void {
    this.tag.text = text;
  }

  setNormalTag(): void {
    this.tag.style.fill = 0x9ca3af;
  }

  setFailedTag(): void {
    this.tag.text = "FAILED";
    this.tag.style.fill = 0xc73e2d;
    this.applyArtState("FAILED");
  }

  configureArt(paths: { msg: string; pdf: string; failed: string }): void {
    this.artPaths = {
      MSG: paths.msg,
      PDF: paths.pdf,
      FAILED: paths.failed
    };
    this.applyArtState(this.currentArtState);
  }

  private redrawStack(): void {
    this.stack.clear();

    const extraSheets = Math.min(4, Math.max(0, this.stackCount - 1));
    for (let index = extraSheets; index >= 1; index -= 1) {
      const offset = index * 5;
      const alpha = 0.14 + index * 0.05;
      this.stack
        .roundRect(offset, offset, 72, 92, 10)
        .fill({ color: 0xffffff, alpha })
        .stroke({ color: 0x1d2734, width: 1, alpha: 0.16 });
    }

    if (this.stackCount > 1) {
      this.countBubble.clear();
      this.countBubble.circle(60, 10, 12).fill(0xf4c16f);
      this.countLabel.text = `x${this.stackCount}`;
      this.countLabel.visible = true;
      return;
    }

    this.countBubble.clear();
    this.countLabel.text = "";
    this.countLabel.visible = false;
  }

  private applyArtState(state: "MSG" | "PDF" | "FAILED"): void {
    const file = this.artPaths[state];
    this.artLayer.removeChildren();

    if (!file) {
      this.frame.visible = true;
      this.label.visible = true;
      return;
    }

    const sprite = Sprite.from(file);
    sprite.width = 72;
    sprite.height = 92;
    this.artLayer.addChild(sprite);
    this.frame.visible = false;
    this.label.visible = false;
  }
}

export class WorkshopScene implements SceneAdapter {
  readonly app: Application;

  private readonly root: HTMLElement;
  private readonly stage: Container;
  private readonly backgroundArt: Container;
  private readonly foregroundArt: Container;
  private readonly view: HTMLCanvasElement;
  private readonly zones: Record<Exclude<BundleLocation, "entry">, Zone>;
  private readonly carrier: StageActor;
  private readonly document: DocumentProp;
  private readonly stationIncoming: DocumentProp;
  private readonly stationOutgoing: DocumentProp;
  private readonly stationTransfer: DocumentProp;
  private readonly errorPile: DocumentProp;
  private readonly station: Graphics;
  private readonly stationGlow: Graphics;
  private readonly destinationLight: Graphics;
  private readonly errorBin: Graphics;
  private readonly currentStageEl: HTMLElement;
  private readonly currentFileEl: HTMLElement;
  private readonly outputNameEl: HTMLElement;
  private readonly pipelineEl: HTMLElement;
  private readonly queueCountEl: HTMLElement;
  private readonly connectionEl: HTMLElement;
  private readonly eventListEl: HTMLElement;
  private readonly demoFormEl: HTMLFormElement;
  private readonly demoFileCountEl: HTMLInputElement;
  private readonly demoFailureCountEl: HTMLInputElement;
  private readonly demoSubmitEl: HTMLButtonElement;
  private readonly demoStatusEl: HTMLElement;

  private artManifest: ArtManifest | null = null;
  private lastPipeline: RenderPipeline | null = null;
  private currentBatchId: string | null = null;
  private currentBatchSize = 1;
  private completedInBatch = 0;
  private failedInBatch = 0;
  private convertedInBatch = 0;
  private errorPileCount = 0;
  private bundleLocation: BundleLocation = "entry";
  private terminalDisplayLocation: TerminalDisplayLocation | null = null;
  private stationPilesActive = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = `
      <div class="shell">
        <section class="stage-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Sprite Task Theater</p>
              <h1>msg-to-pdf carrier workshop</h1>
              <p class="panel-copy">One carrier walks each batch from the intake desk to the conversion station, then on to the destination dock or error bin.</p>
            </div>
            <div class="status-cluster">
              <p class="pill connection-pill is-connecting">connecting</p>
              <p class="pill queue-pill">0 queued</p>
            </div>
          </div>
          <div class="canvas-frame">
            <div class="canvas-host"></div>
          </div>
        </section>
        <aside class="side-panel">
          <section class="card">
            <p class="card-label">Demo Controls</p>
            <form class="demo-form">
              <div class="field-grid">
                <label class="field">
                  <span class="field-label">Dummy .msg files</span>
                  <input class="number-input demo-file-count" type="number" min="1" max="10" step="1" value="5" />
                </label>
                <label class="field">
                  <span class="field-label">Files that fail</span>
                  <input class="number-input demo-failure-count" type="number" min="0" max="5" step="1" value="0" />
                </label>
              </div>
              <p class="demo-hint">The last N files fail and finish in the error bin. All earlier files complete normally.</p>
              <div class="button-row">
                <button class="demo-run-button" type="submit">Run Demo</button>
                <p class="demo-status">Ready to stage a fresh batch.</p>
              </div>
            </form>
          </section>
          <section class="card">
            <p class="card-label">Current Stage</p>
            <h2 class="stage-value">Idle</h2>
            <div class="meta-grid">
              <div>
                <p class="card-label">Current File</p>
                <p class="meta-value file-value">Waiting for work</p>
              </div>
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
            <p class="card-label">Live Event Feed</p>
            <ol class="event-feed"></ol>
          </section>
        </aside>
      </div>
    `;

    this.currentStageEl = this.query(".stage-value");
    this.currentFileEl = this.query(".file-value");
    this.outputNameEl = this.query(".output-value");
    this.pipelineEl = this.query(".pipeline-value");
    this.queueCountEl = this.query(".queue-pill");
    this.connectionEl = this.query(".connection-pill");
    this.eventListEl = this.query(".event-feed");
    this.demoFormEl = this.query(".demo-form");
    this.demoFileCountEl = this.query(".demo-file-count");
    this.demoFailureCountEl = this.query(".demo-failure-count");
    this.demoSubmitEl = this.query(".demo-run-button");
    this.demoStatusEl = this.query(".demo-status");

    this.app = new Application();
    this.stage = new Container();
    this.backgroundArt = new Container();
    this.foregroundArt = new Container();
    this.zones = {
      intake: { x: 86, y: 286, width: 180, height: 132, label: "Intake Desk" },
      station: { x: 334, y: 230, width: 214, height: 188, label: "Conversion Station" },
      destination: { x: 620, y: 278, width: 166, height: 140, label: "Destination Dock" },
      error: { x: 620, y: 444, width: 170, height: 72, label: "Error Bin" }
    };

    this.carrier = new StageActor("Carrier", 0x2f8f83, 40, 452);
    this.document = new DocumentProp("MSG");
    this.stationIncoming = new DocumentProp("MSG");
    this.stationOutgoing = new DocumentProp("PDF");
    this.stationTransfer = new DocumentProp("MSG");
    this.errorPile = new DocumentProp("MSG");
    this.station = new Graphics();
    this.stationGlow = new Graphics();
    this.destinationLight = new Graphics();
    this.errorBin = new Graphics();

    this.stationIncoming.view.scale.set(0.84);
    this.stationOutgoing.view.scale.set(0.84);
    this.stationTransfer.view.scale.set(0.78);
    this.errorPile.view.scale.set(0.72);

    this.view = document.createElement("canvas");
    this.query(".canvas-host").appendChild(this.view);
  }

  async init(): Promise<void> {
    await this.app.init({
      canvas: this.view,
      width: 880,
      height: 540,
      backgroundAlpha: 0,
      antialias: true,
      preference: "webgl",
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    this.app.stage.addChild(this.stage);
    this.stage.addChild(this.backgroundArt);
    this.artManifest = await this.loadArtManifest();
    if (this.artManifest) {
      await this.preloadArtManifest(this.artManifest);
      this.renderArtScene(this.artManifest);
      this.carrier.applySkin(
        this.artManifest.courier.file,
        this.artManifest.courier.width,
        this.artManifest.courier.height,
        this.artManifest.courier.carryAnchorX,
        this.artManifest.courier.carryAnchorY
      );
      const documentArt = this.artManifest.documents;
      this.document.configureArt(documentArt);
      this.stationIncoming.configureArt(documentArt);
      this.stationOutgoing.configureArt(documentArt);
      this.stationTransfer.configureArt(documentArt);
      this.errorPile.configureArt(documentArt);
    } else {
      this.drawBackdrop();
      this.drawZones();
      this.drawIntakeDesk();
      this.drawStation();
      this.drawDestinationDock();
      this.drawErrorBin();
    }

    this.document.view.visible = false;
    this.hideStationPiles();
    this.resetErrorPile();
    this.stage.addChild(
      this.stationIncoming.view,
      this.stationOutgoing.view,
      this.stationTransfer.view,
      this.errorPile.view,
      this.document.view,
      this.carrier.view
    );
    this.stage.addChild(this.foregroundArt);

    this.app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;
      this.carrier.update(deltaSeconds);
      this.pulseStation();
    });

    window.addEventListener("resize", () => this.handleResize());
    this.syncDemoFailureLimit();
    this.handleResize();
  }

  bindDemoLauncher(
    launcher: (settings: DemoSettings) => Promise<void> | void
  ): void {
    this.demoFileCountEl.addEventListener("input", () => {
      this.syncDemoFailureLimit();
    });
    this.demoFailureCountEl.addEventListener("input", () => {
      this.syncDemoFailureLimit();
    });
    this.demoFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const settings = this.readDemoSettings();
      void launcher(settings);
    });
  }

  setDemoStatus(message: string, tone: "idle" | "busy" | "error" = "idle"): void {
    this.demoStatusEl.textContent = message;
    this.demoStatusEl.className = `demo-status is-${tone}`;
  }

  setDemoBusy(isBusy: boolean): void {
    this.demoSubmitEl.disabled = isBusy;
    this.demoFileCountEl.disabled = isBusy;
    this.demoFailureCountEl.disabled = isBusy;
  }

  setConnectionStatus(status: EventSourceStatus): void {
    this.connectionEl.textContent = status;
    this.connectionEl.className = `pill connection-pill is-${status}`;
  }

  setHeroTask(snapshot: TaskSnapshot | null): void {
    if (!snapshot) {
      this.currentStageEl.textContent = "Idle";
      this.currentFileEl.textContent = "Waiting for work";
      this.outputNameEl.textContent = "not built yet";
      this.pipelineEl.textContent = "none";
      return;
    }

    const nextBatchId = this.resolveBatchId(snapshot);
    if (this.currentBatchId !== nextBatchId) {
      this.resetHeroScene();
      this.currentBatchId = nextBatchId;
      this.currentBatchSize = snapshot.batchSize ?? 1;
      this.completedInBatch = 0;
      this.failedInBatch = 0;
      this.convertedInBatch = 0;
      this.document.setStackCount(this.currentBatchSize);
    } else if (snapshot.batchSize && snapshot.batchSize > this.currentBatchSize) {
      this.currentBatchSize = snapshot.batchSize;
      this.document.setStackCount(this.currentBatchSize);
    }

    this.currentStageEl.textContent = STAGE_LABELS[snapshot.stage];
    this.currentFileEl.textContent = snapshot.fileName ?? snapshot.taskId;
    this.outputNameEl.textContent = snapshot.outputName ?? "not built yet";
    this.pipelineEl.textContent = snapshot.pipeline ?? "pending";
  }

  setQueue(tasks: TaskSnapshot[], overflowCount: number): void {
    this.queueCountEl.textContent = `${tasks.length + overflowCount} queued`;
  }

  async applyEvents(
    events: TaskEvent[],
    snapshot: TaskSnapshot,
    options: AnimationOptions
  ): Promise<void> {
    for (const event of events) {
      await this.applyEvent(event, snapshot, options);
    }
  }

  async holdTerminal(
    snapshot: TaskSnapshot,
    options: AnimationOptions
  ): Promise<void> {
    if (snapshot.failed) {
      await sleep(Math.max(260, Math.round(520 * options.speed)));
      return;
    }

    const holdMs =
      this.bundleLocation === "destination"
        ? Math.max(320, Math.round(760 * options.speed))
        : Math.max(180, Math.round(320 * options.speed));
    await sleep(holdMs);
  }

  clearHeroTask(): void {
    this.currentStageEl.textContent = "Waiting";
    this.currentFileEl.textContent = "Queueing next task";
    this.outputNameEl.textContent = "not built yet";
    this.pipelineEl.textContent = "none";
    const keepTerminalBundleVisible = this.terminalDisplayLocation !== null;
    if (!keepTerminalBundleVisible) {
      this.document.view.visible = false;
    }
    this.currentBatchId = null;
    this.currentBatchSize = 1;
    this.completedInBatch = 0;
    this.failedInBatch = 0;
    this.convertedInBatch = 0;
    this.hideStationPiles();
    if (!keepTerminalBundleVisible) {
      this.bundleLocation = "entry";
    } else if (this.terminalDisplayLocation) {
      const terminalPoint = this.bundlePoint(this.terminalDisplayLocation);
      const terminalStop = this.actorStop(this.terminalDisplayLocation);
      this.document.view.visible = true;
      this.document.view.position.set(terminalPoint.x, terminalPoint.y);
      this.carrier.setPosition(terminalStop.x, terminalStop.y);
      this.bundleLocation = this.terminalDisplayLocation;
    }
    this.destinationLight.visible = false;
    this.lastPipeline = null;
  }

  private query<T extends HTMLElement>(selector: string): T {
    const element = this.root.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Expected element for selector ${selector}`);
    }
    return element as T;
  }

  private handleResize(): void {
    const frame = this.query(".canvas-frame");
    const width = frame.clientWidth - 20;
    const scale = Math.min(width / 880, 1);
    this.view.style.width = `${880 * scale}px`;
    this.view.style.height = `${540 * scale}px`;
  }

  private async loadArtManifest(): Promise<ArtManifest | null> {
    try {
      const response = await fetch("/art/manifest.json", {
        cache: "no-store"
      });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as ArtManifest;
      return payload;
    } catch {
      return null;
    }
  }

  private renderArtScene(manifest: ArtManifest): void {
    this.backgroundArt.removeChildren();
    this.foregroundArt.removeChildren();
    this.drawZones();

    for (const layer of manifest.environment.background) {
      this.backgroundArt.addChild(this.createArtSprite(layer));
    }

    this.backgroundArt.addChild(
      this.createArtSprite(manifest.stations.intake),
      this.createArtSprite(manifest.stations.conversion),
      this.createArtSprite(manifest.stations.destination),
      this.createArtSprite(manifest.stations.error)
    );

    this.renderStationGlow("outlook_edge");
    this.renderDestinationGlow("outlook_edge");
    this.destinationLight.visible = false;

    const error = manifest.stations.error;
    this.errorBin.clear();
    this.errorBin
      .roundRect(error.x + 18, error.y + 18, error.width - 36, error.height - 34, 18)
      .fill({ color: 0xff6b54, alpha: 0.18 });

    this.backgroundArt.addChild(this.stationGlow, this.destinationLight, this.errorBin);

    for (const layer of manifest.environment.foreground) {
      this.foregroundArt.addChild(this.createArtSprite(layer));
    }
  }

  private async preloadArtManifest(manifest: ArtManifest): Promise<void> {
    const assets = new Set<string>();

    for (const layer of manifest.environment.background) {
      assets.add(layer.file);
    }
    for (const layer of manifest.environment.foreground) {
      assets.add(layer.file);
    }
    assets.add(manifest.stations.intake.file);
    assets.add(manifest.stations.conversion.file);
    assets.add(manifest.stations.destination.file);
    assets.add(manifest.stations.error.file);
    assets.add(manifest.courier.file);
    assets.add(manifest.documents.msg);
    assets.add(manifest.documents.pdf);
    assets.add(manifest.documents.failed);

    await Assets.load([...assets]);
  }

  private createArtSprite(layer: {
    file: string;
    x: number;
    y: number;
    width: number;
    height: number;
    alpha?: number;
  }): Sprite {
    const sprite = Sprite.from(layer.file);
    sprite.position.set(layer.x, layer.y);
    sprite.width = layer.width;
    sprite.height = layer.height;
    sprite.alpha = layer.alpha ?? 1;
    return sprite;
  }

  private drawBackdrop(): void {
    const voidSky = new Graphics();
    voidSky.rect(0, 0, 880, 540).fill(0x081018);

    const rearWall = new Graphics();
    rearWall.rect(0, 0, 880, 370).fill(0x101724);
    rearWall.poly([0, 0, 196, 0, 116, 112, 0, 146], true).fill({
      color: 0x152231,
      alpha: 0.68
    });
    rearWall.poly([880, 0, 704, 0, 764, 124, 880, 156], true).fill({
      color: 0x152231,
      alpha: 0.68
    });

    const vault = new Graphics();
    vault.rect(0, 0, 880, 218).fill({ color: 0x1c2738, alpha: 0.86 });
    vault.rect(0, 214, 880, 4).fill({ color: 0xf7dcb7, alpha: 0.1 });

    const ribs = new Graphics();
    for (const x of [84, 226, 438, 654, 804]) {
      ribs.poly([x - 12, 0, x + 12, 0, x + 52, 232, x + 26, 232], true).fill({
        color: 0x263246,
        alpha: 0.46
      });
    }
    ribs.rect(0, 124, 880, 4).fill({ color: 0x33425a, alpha: 0.26 });

    const banners = new Graphics();
    banners.poly([136, 18, 196, 18, 182, 142, 166, 152, 154, 138], true).fill({
      color: 0x59351f,
      alpha: 0.55
    });
    banners.poly([692, 26, 748, 26, 736, 152, 720, 162, 710, 148], true).fill({
      color: 0x1a3f60,
      alpha: 0.56
    });

    const furnaceGlow = new Graphics();
    furnaceGlow.circle(214, 132, 132).fill({ color: 0xee8f43, alpha: 0.08 });
    furnaceGlow.circle(462, 92, 144).fill({ color: 0x68a7ff, alpha: 0.1 });
    furnaceGlow.circle(742, 146, 118).fill({ color: 0x72dca4, alpha: 0.06 });

    const windows = new Graphics();
    const beams = new Graphics();
    const addWindow = (x: number, tint: number, beamColor: number) => {
      windows
        .roundRect(x, 42, 118, 178, 28)
        .fill({ color: 0x1e2a3b, alpha: 0.9 })
        .stroke({ color: 0xc9b18d, alpha: 0.18, width: 2 });
      windows
        .roundRect(x + 14, 60, 90, 142, 22)
        .fill({ color: tint, alpha: 0.28 })
        .stroke({ color: 0xf8ffff, alpha: 0.1, width: 1.5 });
      windows.rect(x + 55, 60, 8, 142).fill({ color: 0xffffff, alpha: 0.08 });
      windows.rect(x + 14, 124, 90, 7).fill({ color: 0xffffff, alpha: 0.06 });
      beams.poly(
        [x + 26, 204, x + 92, 204, x + 146, 390, x - 16, 390],
        true
      ).fill({ color: beamColor, alpha: 0.09 });
    };
    addWindow(122, 0xef9f58, 0xf3b36d);
    addWindow(382, 0x5f89ff, 0x7ba4ff);
    addWindow(640, 0x61d3a0, 0x85efba);

    const catwalk = new Graphics();
    catwalk.rect(48, 250, 784, 18).fill({ color: 0x202a39, alpha: 0.72 });
    catwalk.rect(48, 266, 784, 4).fill({ color: 0xf2c892, alpha: 0.08 });
    for (const x of [94, 168, 242, 316, 390, 464, 538, 612, 686, 760]) {
      catwalk.rect(x, 250, 30, 18).fill({ color: 0x324157, alpha: 0.26 });
    }

    const floor = new Graphics();
    floor.rect(0, 370, 880, 170).fill(0x0d141c);
    floor.poly([0, 392, 880, 392, 880, 540, 0, 540], true).fill({
      color: 0x141d28,
      alpha: 0.92
    });
    floor.rect(0, 388, 880, 3).fill({ color: 0xffffff, alpha: 0.08 });
    for (const x of [58, 164, 270, 376, 482, 588, 694, 800]) {
      floor.poly([x, 392, x + 58, 392, x + 18, 540, x - 42, 540], true).fill({
        color: 0x1d2634,
        alpha: 0.3
      });
    }

    this.stage.addChild(
      voidSky,
      rearWall,
      vault,
      furnaceGlow,
      beams,
      windows,
      ribs,
      banners,
      catwalk,
      floor
    );
  }

  private drawZones(): void {
    for (const zone of Object.values(this.zones)) {
      const centerX = zone.x + zone.width / 2;
      const halo = new Graphics();
      halo.ellipse(centerX, zone.y + zone.height - 8, zone.width * 0.34, 16).fill({
        color:
          zone.label === "Conversion Station"
            ? 0x6d8cff
            : zone.label === "Destination Dock"
              ? 0x67d991
              : zone.label === "Error Bin"
                ? 0xd96252
                : 0xe0a45b,
        alpha: zone.label === "Error Bin" ? 0.08 : 0.12
      });
      halo.ellipse(centerX, zone.y + zone.height - 8, zone.width * 0.38, 20).stroke({
        color: 0xf4dfbc,
        alpha: 0.1,
        width: 1.5
      });

      const plaqueWidth = Math.max(128, zone.label.length * 9.5);
      const plaque = new Graphics();
      plaque
        .roundRect(centerX - plaqueWidth / 2, zone.y - 34, plaqueWidth, 26, 11)
        .fill({ color: 0x111722, alpha: 0.72 })
        .stroke({ color: 0xf1d7ae, alpha: 0.12, width: 1.5 });

      const title = new Text({
        text: zone.label,
        style: {
          fill: 0xf4e7cd,
          fontFamily: "Palatino Linotype, Book Antiqua, serif",
          fontSize: 17,
          fontWeight: "600"
        }
      });
      title.anchor.set(0.5, 0);
      title.position.set(centerX, zone.y - 31);
      this.stage.addChild(halo, plaque, title);
    }
  }

  private drawIntakeDesk(): void {
    const intakeBase = new Graphics();
    intakeBase
      .roundRect(94, 300, 164, 106, 26)
      .fill(0x202938)
      .stroke({ color: 0xe2b67f, alpha: 0.18, width: 2 });
    intakeBase
      .roundRect(110, 286, 132, 48, 18)
      .fill(0x2b3649)
      .stroke({ color: 0xf1c986, alpha: 0.16, width: 1.5 });
    intakeBase.roundRect(116, 300, 46, 16, 8).fill({ color: 0xffd28c, alpha: 0.16 });
    intakeBase.roundRect(178, 300, 46, 16, 8).fill({ color: 0x75c8ff, alpha: 0.16 });
    intakeBase.roundRect(132, 250, 88, 48, 14).fill(0x182331);
    intakeBase.roundRect(140, 258, 72, 32, 10).fill({ color: 0xe9c27d, alpha: 0.16 });
    intakeBase.rect(154, 266, 44, 4).fill({ color: 0xfbe3b6, alpha: 0.32 });
    intakeBase.rect(154, 276, 30, 4).fill({ color: 0xfbe3b6, alpha: 0.2 });
    intakeBase.roundRect(120, 330, 108, 16, 8).fill({ color: 0x0f151d, alpha: 0.54 });
    intakeBase.circle(116, 282, 10).fill({ color: 0xeb9a48, alpha: 0.28 });
    intakeBase.circle(238, 282, 10).fill({ color: 0xeb9a48, alpha: 0.28 });
    intakeBase.rect(118, 334, 6, 52).fill(0x111a27);
    intakeBase.rect(228, 334, 6, 52).fill(0x111a27);

    this.stage.addChild(intakeBase);
  }

  private drawStation(): void {
    this.stationGlow.circle(444, 314, 126).fill({ color: 0x5485ff, alpha: 0.14 });

    this.station
      .roundRect(344, 222, 202, 192, 32)
      .fill(0x1a2331)
      .stroke({ color: 0xdfbc8b, alpha: 0.26, width: 2.5 });
    this.station
      .roundRect(358, 244, 174, 148, 28)
      .fill(0x243142)
      .stroke({ color: 0xeff3ff, alpha: 0.08, width: 1.5 });
    this.station.roundRect(372, 292, 60, 88, 18).fill({ color: 0x0b1320, alpha: 0.52 });
    this.station.roundRect(454, 292, 60, 88, 18).fill({ color: 0x0b1320, alpha: 0.52 });
    this.station
      .roundRect(372, 292, 60, 88, 18)
      .stroke({ color: 0xf7d7a3, alpha: 0.1, width: 1.5 });
    this.station
      .roundRect(454, 292, 60, 88, 18)
      .stroke({ color: 0xbdd5ff, alpha: 0.1, width: 1.5 });
    this.station.circle(444, 270, 24).fill({ color: 0x77b1ff, alpha: 0.18 });
    this.station.circle(444, 270, 44).stroke({ color: 0xeaf5ff, alpha: 0.18, width: 2 });
    this.station.poly([394, 238, 410, 204, 426, 238], true).fill({ color: 0xf3b868, alpha: 0.58 });
    this.station.poly([462, 238, 478, 204, 494, 238], true).fill({ color: 0x7ac6ff, alpha: 0.58 });
    this.station.roundRect(420, 244, 48, 50, 18).fill({ color: 0x101922, alpha: 0.86 });
    this.station.circle(444, 270, 14).fill({ color: 0xa8d8ff, alpha: 0.48 });
    this.station.rect(364, 332, 150, 6).fill({ color: 0xffffff, alpha: 0.04 });
    this.station.rect(392, 392, 104, 10).fill({ color: 0x0d131d, alpha: 0.62 });

    const incomingLabel = new Text({
      text: "Incoming",
      style: {
        fill: 0xdcccb0,
        fontFamily: "Avenir Next Condensed, Segoe UI, sans-serif",
        fontSize: 12,
        fontWeight: "700"
      }
    });
    incomingLabel.anchor.set(0.5);
    incomingLabel.position.set(402, 272);

    const outgoingLabel = new Text({
      text: "Outgoing",
      style: {
        fill: 0xc7d7ff,
        fontFamily: "Avenir Next Condensed, Segoe UI, sans-serif",
        fontSize: 12,
        fontWeight: "700"
      }
    });
    outgoingLabel.anchor.set(0.5);
    outgoingLabel.position.set(484, 272);

    this.stage.addChild(this.stationGlow, this.station, incomingLabel, outgoingLabel);
  }

  private drawDestinationDock(): void {
    this.destinationLight
      .roundRect(650, 300, 110, 102, 28)
      .fill({ color: 0x65db8d, alpha: 0.12 });
    this.destinationLight.visible = false;

    const dock = new Graphics();
    dock
      .roundRect(636, 286, 136, 132, 28)
      .fill(0x1b2a22)
      .stroke({ color: 0x9ee4ba, alpha: 0.26, width: 2.5 });
    dock.roundRect(650, 302, 18, 86, 12).fill(0x22352d);
    dock.roundRect(740, 302, 18, 86, 12).fill(0x22352d);
    dock.roundRect(660, 292, 88, 18, 10).fill(0x30493c);
    dock.roundRect(670, 310, 68, 80, 22).fill({ color: 0x6fe7a0, alpha: 0.1 });
    dock.roundRect(680, 320, 48, 12, 6).fill({ color: 0x9cf5bf, alpha: 0.18 });
    dock.roundRect(666, 396, 76, 12, 6).fill({ color: 0x97f2b8, alpha: 0.22 });
    dock.rect(658, 350, 10, 42).fill(0x162019);
    dock.rect(740, 350, 10, 42).fill(0x162019);
    dock.circle(658, 318, 4).fill({ color: 0xa1f0bf, alpha: 0.64 });
    dock.circle(750, 318, 4).fill({ color: 0xa1f0bf, alpha: 0.64 });

    this.stage.addChild(this.destinationLight, dock);
  }

  private drawErrorBin(): void {
    this.errorBin
      .roundRect(636, 430, 136, 92, 24)
      .fill(0x311516)
      .stroke({ color: 0xffb79d, alpha: 0.18, width: 2.5 });
    this.errorBin.roundRect(650, 452, 108, 48, 16).fill({ color: 0x16090a, alpha: 0.92 });
    this.errorBin.roundRect(660, 462, 88, 28, 10).fill({ color: 0xdb583e, alpha: 0.26 });
    this.errorBin.rect(664, 470, 80, 4).fill({ color: 0xffa18a, alpha: 0.22 });
    this.errorBin.rect(664, 478, 80, 4).fill({ color: 0xffa18a, alpha: 0.18 });
    this.errorBin.roundRect(646, 440, 18, 10, 5).fill(0x4a2221);
    this.errorBin.roundRect(744, 440, 18, 10, 5).fill(0x4a2221);
    this.errorBin.circle(656, 445, 4).fill({ color: 0xff846d, alpha: 0.66 });
    this.errorBin.circle(752, 445, 4).fill({ color: 0xff846d, alpha: 0.66 });
    this.stage.addChild(this.errorBin);
  }

  private pulseStation(): void {
    const pipeline = this.lastPipeline ?? "outlook_edge";
    const fx = this.pipelineFx(pipeline);
    const strength = Math.max(0.08, fx.stationGlowAlpha);
    const time = performance.now() / 1000;
    this.stationGlow.alpha = strength + Math.sin(time * 2.7) * 0.04;
  }

  private resolveBatchId(snapshot: TaskSnapshot): string {
    return snapshot.batchId ?? snapshot.taskId;
  }

  private batchSizeFor(snapshot: TaskSnapshot): number {
    return snapshot.batchSize ?? this.currentBatchSize ?? 1;
  }

  private isFinalBatchTask(snapshot: TaskSnapshot): boolean {
    if (!this.isBatchMode(snapshot)) {
      return true;
    }
    if (
      typeof snapshot.batchIndex === "number" &&
      typeof snapshot.batchSize === "number"
    ) {
      return snapshot.batchIndex >= snapshot.batchSize;
    }
    return this.completedInBatch + this.failedInBatch + 1 >= this.currentBatchSize;
  }

  private isBatchMode(snapshot: TaskSnapshot): boolean {
    return this.batchSizeFor(snapshot) > 1;
  }

  private remainingBatchItems(): number {
    return Math.max(0, this.currentBatchSize - this.completedInBatch - this.failedInBatch);
  }

  private isFinalBatchItem(projectedCompleted = this.completedInBatch): boolean {
    return projectedCompleted + this.failedInBatch >= this.currentBatchSize;
  }

  private conversionHoldLocation(): BundleLocation {
    return this.bundleLocation === "entry" || this.bundleLocation === "intake"
      ? "intake"
      : "station";
  }

  private defaultPoint(location: BundleLocation): TheaterPoint {
    switch (location) {
      case "entry":
        return { x: -52, y: 302 };
      case "intake":
        return { x: 126, y: 302 };
      case "station":
        return { x: 410, y: 286 };
      case "destination":
        return { x: 668, y: 316 };
      case "error":
        return { x: 670, y: 394 };
    }
  }

  private defaultActorStop(location: BundleLocation): TheaterPoint {
    switch (location) {
      case "entry":
        return { x: 34, y: 452 };
      case "intake":
        return { x: 174, y: 452 };
      case "station":
        return { x: 446, y: 452 };
      case "destination":
        return { x: 694, y: 452 };
      case "error":
        return { x: 694, y: 452 };
    }
  }

  private pipelineFx(pipeline: RenderPipeline): {
    stationGlowColor: number;
    stationGlowAlpha: number;
    destinationGlowColor: number;
    destinationGlowAlpha: number;
  } {
    const fallback = {
      outlook_edge: {
        stationGlowColor: 0x4f78ff,
        stationGlowAlpha: 0.18,
        destinationGlowColor: 0x79efac,
        destinationGlowAlpha: 0.18
      },
      edge_html: {
        stationGlowColor: 0xdb9a38,
        stationGlowAlpha: 0.16,
        destinationGlowColor: 0xf5ca73,
        destinationGlowAlpha: 0.14
      },
      reportlab: {
        stationGlowColor: 0xb55b34,
        stationGlowAlpha: 0.14,
        destinationGlowColor: 0xff8d5a,
        destinationGlowAlpha: 0.12
      }
    } satisfies Record<
      RenderPipeline,
      {
        stationGlowColor: number;
        stationGlowAlpha: number;
        destinationGlowColor: number;
        destinationGlowAlpha: number;
      }
    >;

    return this.artManifest?.pipelineFx[pipeline] ?? fallback[pipeline];
  }

  private renderStationGlow(pipeline: RenderPipeline | null): void {
    const conversion = this.artManifest?.stations.conversion;
    const centerX = conversion ? conversion.x + conversion.width / 2 : 444;
    const centerY = conversion ? conversion.y + conversion.height / 2 : 314;
    const radius = conversion ? Math.max(conversion.width, conversion.height) * 0.42 : 126;
    const fx = this.pipelineFx(pipeline ?? "outlook_edge");

    this.stationGlow.clear();
    this.stationGlow.circle(centerX, centerY, radius).fill({
      color: fx.stationGlowColor,
      alpha: fx.stationGlowAlpha
    });
  }

  private renderDestinationGlow(pipeline: RenderPipeline | null): void {
    const fx = this.pipelineFx(pipeline ?? "outlook_edge");
    const destination = this.artManifest?.stations.destination;

    this.destinationLight.clear();
    if (!destination) {
      this.destinationLight
        .roundRect(650, 300, 110, 102, 28)
        .fill({ color: fx.destinationGlowColor, alpha: fx.destinationGlowAlpha });
      return;
    }

    this.destinationLight
      .roundRect(destination.x + 16, destination.y + 16, destination.width - 32, destination.height - 28, 28)
      .fill({ color: fx.destinationGlowColor, alpha: fx.destinationGlowAlpha });
  }

  private stationPilePoint(pile: StationPile): { x: number; y: number } {
    if (this.artManifest) {
      return pile === "incoming"
        ? this.artManifest.anchors.stationIncoming
        : this.artManifest.anchors.stationOutgoing;
    }
    if (pile === "incoming") {
      return { x: 380, y: 304 };
    }
    return { x: 462, y: 304 };
  }

  private stationTransferMidPoint(): { x: number; y: number } {
    if (this.artManifest) {
      return this.artManifest.anchors.stationTransferMid;
    }
    return { x: 424, y: 284 };
  }

  private bundlePoint(location: BundleLocation): { x: number; y: number } {
    if (this.artManifest) {
      switch (location) {
        case "entry":
          return this.artManifest.anchors.entry;
        case "intake":
          return this.artManifest.anchors.intake;
        case "station":
          return this.artManifest.anchors.station;
        case "destination":
          return this.artManifest.anchors.destination;
        case "error":
          return this.artManifest.anchors.error;
      }
    }
    return this.defaultPoint(location);
  }

  private actorStop(location: BundleLocation): { x: number; y: number } {
    if (this.artManifest) {
      switch (location) {
        case "entry":
          return this.artManifest.anchors.actorStops.entry;
        case "intake":
          return this.artManifest.anchors.actorStops.intake;
        case "station":
          return this.artManifest.anchors.actorStops.station;
        case "destination":
          return this.artManifest.anchors.actorStops.destination;
        case "error":
          return this.artManifest.anchors.actorStops.error;
      }
    }
    return this.defaultActorStop(location);
  }

  private incomingPileCount(): number {
    return Math.max(0, this.currentBatchSize - this.failedInBatch - this.convertedInBatch);
  }

  private outgoingPileCount(): number {
    return Math.max(0, this.convertedInBatch);
  }

  private errorPilePoint(): { x: number; y: number } {
    if (this.artManifest) {
      return this.artManifest.anchors.errorStack;
    }
    return { x: 670, y: 386 };
  }

  private hideStationPiles(): void {
    this.stationIncoming.view.visible = false;
    this.stationOutgoing.view.visible = false;
    this.stationTransfer.view.visible = false;
    this.stationPilesActive = false;
  }

  private resetErrorPile(): void {
    this.errorPileCount = 0;
    this.errorPile.view.visible = false;
  }

  private syncErrorPile(kind: "MSG" | "PDF" = "MSG"): void {
    if (this.errorPileCount <= 0) {
      this.errorPile.view.visible = false;
      return;
    }

    this.errorPile.setKind(kind);
    this.errorPile.setStackCount(this.errorPileCount);
    this.errorPile.setFailedTag();
    this.errorPile.setTag(`${this.errorPileCount} FAILED`);
    const point = this.errorPilePoint();
    this.stage.addChild(this.errorPile.view);
    this.errorPile.view.position.set(point.x, point.y);
    this.errorPile.view.visible = true;
  }

  private depositErrorFile(kind: "MSG" | "PDF"): void {
    this.errorPileCount += 1;
    this.syncErrorPile(kind);
    this.document.view.visible = false;
  }

  private syncStationPiles(): void {
    if (!this.stationPilesActive) {
      this.hideStationPiles();
      return;
    }

    const incomingCount = this.incomingPileCount();
    const outgoingCount = this.outgoingPileCount();

    if (incomingCount > 0) {
      this.stationIncoming.setKind("MSG");
      this.stationIncoming.setNormalTag();
      this.stationIncoming.setStackCount(incomingCount);
      this.stationIncoming.setTag(`${incomingCount} LEFT`);
      const point = this.stationPilePoint("incoming");
      this.stationIncoming.view.position.set(point.x, point.y);
      this.stationIncoming.view.visible = true;
    } else {
      this.stationIncoming.view.visible = false;
    }

    if (outgoingCount > 0) {
      this.stationOutgoing.setKind("PDF");
      this.stationOutgoing.setNormalTag();
      this.stationOutgoing.setStackCount(outgoingCount);
      this.stationOutgoing.setTag(`${outgoingCount} READY`);
      const point = this.stationPilePoint("outgoing");
      this.stationOutgoing.view.position.set(point.x, point.y);
      this.stationOutgoing.view.visible = true;
    } else {
      this.stationOutgoing.view.visible = false;
    }
  }

  private activateStationPiles(): void {
    this.stationPilesActive = true;
    this.document.view.visible = false;
    this.bundleLocation = "station";
    this.syncStationPiles();
  }

  private async animateStationTransfer(speed: number): Promise<void> {
    if (!this.stationPilesActive) {
      this.activateStationPiles();
    }

    const nextConverted = Math.min(this.currentBatchSize, this.convertedInBatch + 1);
    const incomingCount = Math.max(0, this.currentBatchSize - this.failedInBatch - nextConverted);
    const outgoingCount = nextConverted;
    const start = this.stationPilePoint("incoming");
    const mid = this.stationTransferMidPoint();
    const end = this.stationPilePoint("outgoing");

    this.stationTransfer.setKind("MSG");
    this.stationTransfer.setNormalTag();
    this.stationTransfer.setStackCount(1);
    this.stationTransfer.setTag("PROCESS");
    this.stationTransfer.view.position.set(start.x, start.y);
    this.stationTransfer.view.visible = true;

    if (incomingCount > 0) {
      this.stationIncoming.setStackCount(incomingCount);
      this.stationIncoming.setTag(`${incomingCount} LEFT`);
    } else {
      this.stationIncoming.view.visible = false;
    }

    await this.moveView(this.stationTransfer.view, mid.x, mid.y, scaleDuration(260, speed));
    this.stationTransfer.setKind("PDF");
    this.stationTransfer.setNormalTag();
    this.stationTransfer.setTag("READY");
    await this.moveView(this.stationTransfer.view, end.x, end.y, scaleDuration(260, speed));

    this.convertedInBatch = outgoingCount;
    this.syncStationPiles();
    this.stationTransfer.view.visible = false;
  }

  private prepareOutgoingBundleForCarry(): void {
    const outgoingCount = Math.max(1, this.outgoingPileCount());
    const outgoingPoint = this.stationPilePoint("outgoing");
    this.document.setKind("PDF");
    this.document.setNormalTag();
    this.document.setStackCount(outgoingCount);
    this.document.setTag(`${outgoingCount} PDF`);
    this.document.view.visible = true;
    this.stage.addChild(this.document.view);
    this.document.view.position.set(outgoingPoint.x, outgoingPoint.y);
    this.stationOutgoing.view.visible = false;
    this.stationTransfer.view.visible = false;
    this.bundleLocation = "station";
  }

  private resetHeroScene(): void {
    this.currentStageEl.textContent = "Queued";
    this.outputNameEl.textContent = "not built yet";
    this.pipelineEl.textContent = "pending";
    this.lastPipeline = null;
    this.destinationLight.visible = false;
    this.destinationLight.alpha = 0.1;
    this.renderDestinationGlow("outlook_edge");

    const entryStop = this.actorStop("entry");
    this.carrier.setPosition(entryStop.x, entryStop.y);

    this.convertedInBatch = 0;
    this.document.setKind("MSG");
    this.document.setNormalTag();
    this.document.setStackCount(1);
    this.document.setTag("");
    this.document.view.visible = false;
    this.stage.addChild(this.document.view);
    const entryPoint = this.bundlePoint("entry");
    this.document.view.position.set(entryPoint.x, entryPoint.y);
    this.bundleLocation = "entry";
    this.terminalDisplayLocation = null;
    this.hideStationPiles();
    this.resetErrorPile();

    this.stationGlow.clear();
    this.renderStationGlow("outlook_edge");
  }

  private async applyEvent(
    event: TaskEvent,
    snapshot: TaskSnapshot,
    options: AnimationOptions
  ): Promise<void> {
    if (
      typeof event.meta?.batchId === "string" &&
      (this.currentBatchId === null || this.currentBatchId === snapshot.taskId)
    ) {
      this.currentBatchId = event.meta.batchId;
    }
    if (snapshot.batchSize && snapshot.batchSize > this.currentBatchSize) {
      this.currentBatchSize = snapshot.batchSize;
    }

    const batchMode = this.isBatchMode(snapshot);
    const finalBatchTask = this.isFinalBatchTask(snapshot);

    this.currentStageEl.textContent = STAGE_LABELS[event.stage];
    this.currentFileEl.textContent = event.fileName ?? snapshot.fileName ?? snapshot.taskId;

    if (typeof event.meta?.outputName === "string") {
      this.outputNameEl.textContent = event.meta.outputName;
    } else if (snapshot.outputName) {
      this.outputNameEl.textContent = snapshot.outputName;
    }
    if (event.pipeline) {
      this.pipelineEl.textContent = event.pipeline;
    } else if (snapshot.pipeline) {
      this.pipelineEl.textContent = snapshot.pipeline;
    }

    this.addFeedLine(event, options.compressed);

    switch (event.stage) {
      case "drop_received": {
        if (this.stationPilesActive) {
          break;
        }
        if (batchMode && this.bundleLocation !== "entry" && this.document.view.visible) {
          break;
        }
        this.document.setKind("MSG");
        this.document.setNormalTag();
        this.document.setTag("");
        this.document.setStackCount(this.batchSizeFor(snapshot));
        const entryPoint = this.bundlePoint("entry");
        this.document.view.position.set(entryPoint.x, entryPoint.y);
        this.document.view.visible = true;
        this.bundleLocation = "entry";
        break;
      }

      case "outlook_extract_started":
        await this.paceAt("entry", options.speed);
        break;

      case "files_accepted":
        if (this.stationPilesActive) {
          await this.paceAt("station", options.speed);
          break;
        }
        this.document.setKind("MSG");
        this.document.setNormalTag();
        this.document.setStackCount(this.batchSizeFor(snapshot));
        this.document.setTag(batchMode ? `${this.currentBatchSize} MSG` : "MSG");
        if (!batchMode || this.bundleLocation === "entry") {
          await this.carryBundle(this.bundleLocation, "intake", options.speed);
        }
        break;

      case "output_folder_selected":
        this.destinationLight.visible = true;
        this.destinationLight.alpha = 0.22;
        await this.paceAt(this.conversionHoldLocation(), options.speed);
        break;

      case "parse_started":
        await this.paceAt(this.conversionHoldLocation(), options.speed);
        break;

      case "filename_built":
        this.document.setNormalTag();
        this.document.setTag(
          batchMode
            ? `TAG ${this.completedInBatch + this.failedInBatch + 1}/${this.currentBatchSize}`
            : "DATED"
        );
        await this.paceAt(this.conversionHoldLocation(), options.speed);
        break;

      case "pdf_pipeline_started":
        if (this.stationPilesActive) {
          await this.paceAt("station", options.speed);
          break;
        }
        if (this.bundleLocation === "entry") {
          await this.carryBundle("entry", "intake", options.speed);
        }
        if (this.bundleLocation === "station") {
          await this.paceAt("station", options.speed);
          break;
        }
        await this.carryBundle(this.bundleLocation, "station", options.speed);
        this.activateStationPiles();
        break;

      case "pipeline_selected":
        this.lastPipeline = event.pipeline ?? null;
        this.pipelineEl.textContent = event.pipeline ?? "none";
        this.recolorStation(event.pipeline ?? null);
        await this.paceAt("station", options.speed);
        break;

      case "pdf_written": {
        if (!this.stationPilesActive) {
          this.activateStationPiles();
        }
        await this.animateStationTransfer(options.speed);
        await this.paceAt("station", options.speed);
        break;
      }

      case "deliver_started":
        if (batchMode && !finalBatchTask) {
          await this.paceAt("station", options.speed);
          break;
        }
        this.prepareOutgoingBundleForCarry();
        await this.carryBundle(this.bundleLocation, "destination", options.speed);
        break;

      case "complete":
        this.completedInBatch += 1;
        if (batchMode && !this.isFinalBatchItem(this.completedInBatch)) {
          this.syncStationPiles();
          break;
        }
        this.destinationLight.visible = true;
        this.destinationLight.alpha = 0.4;
        if (batchMode || this.convertedInBatch > 0) {
          this.document.setKind("PDF");
          this.document.setNormalTag();
          this.document.setStackCount(Math.max(1, this.convertedInBatch));
          this.document.setTag(`${Math.max(1, this.convertedInBatch)} PDF`);
          const destinationPoint = this.bundlePoint("destination");
          this.document.view.position.set(destinationPoint.x, destinationPoint.y);
          this.bundleLocation = "destination";
        }
        this.hideStationPiles();
        this.terminalDisplayLocation = "destination";
        break;

      case "failed": {
        this.failedInBatch += 1;
        this.pipelineEl.textContent = event.pipeline ?? this.pipelineEl.textContent;
        if (this.stationPilesActive) {
          this.syncStationPiles();
        }
        const failedKind = snapshot.hasPdfWritten ? "PDF" : "MSG";
        this.document.setKind(failedKind);
        this.document.setFailedTag();
        this.document.setStackCount(1);
        if (this.stationPilesActive) {
          const incomingPoint = this.stationPilePoint("incoming");
          this.document.view.visible = true;
          this.stage.addChild(this.document.view);
          this.document.view.position.set(incomingPoint.x, incomingPoint.y);
          this.bundleLocation = "station";
        }
        await this.carryBundle(this.bundleLocation, "error", options.speed);
        this.errorBin.alpha = 1;
        await sleep(scaleDuration(220, options.speed));
        this.depositErrorFile(failedKind);

        if (this.incomingPileCount() > 0) {
          this.bundleLocation = "station";
          await this.moveActor(
            this.carrier,
            this.actorStop("station").x,
            this.actorStop("station").y,
            scaleDuration(420, options.speed)
          );
          break;
        }

        if (this.outgoingPileCount() > 0) {
          this.prepareOutgoingBundleForCarry();
          this.destinationLight.visible = true;
          this.destinationLight.alpha = 0.34;
          await this.carryBundle("station", "destination", options.speed);
          this.hideStationPiles();
          this.terminalDisplayLocation = "destination";
          break;
        }
        this.hideStationPiles();
        this.terminalDisplayLocation = null;
        break;
      }
    }
  }

  private recolorStation(pipeline: RenderPipeline | null): void {
    this.renderStationGlow(pipeline);
    this.renderDestinationGlow(pipeline);
  }

  private addFeedLine(event: TaskEvent, compressed: boolean): void {
    const item = document.createElement("li");
    const pieces = [event.fileName ?? compactLabel(event.taskId), STAGE_LABELS[event.stage]];
    if (event.pipeline) {
      pieces.push(`via ${event.pipeline}`);
    }
    if (compressed) {
      pieces.push("(compressed)");
    }
    item.textContent = pieces.join(" • ");
    this.eventListEl.appendChild(item);

    while (this.eventListEl.children.length > 18) {
      this.eventListEl.removeChild(this.eventListEl.firstElementChild as Node);
    }
    this.eventListEl.scrollTop = this.eventListEl.scrollHeight;
  }

  private async carryBundle(
    from: BundleLocation,
    to: BundleLocation,
    speed: number
  ): Promise<void> {
    if (from === to) {
      await this.paceAt(to, speed);
      return;
    }

    const pickupStop = this.actorStop(from);
    const dropStop = this.actorStop(to);
    await this.moveActor(this.carrier, pickupStop.x, pickupStop.y, scaleDuration(260, speed));
    await this.attachDocumentToActor(this.carrier, speed);
    await this.moveActor(this.carrier, dropStop.x, dropStop.y, scaleDuration(700, speed));
    const dropPoint = this.bundlePoint(to);
    this.detachDocument(dropPoint.x, dropPoint.y);
    this.bundleLocation = to;
  }

  private async paceAt(location: BundleLocation, speed: number): Promise<void> {
    const anchor = this.actorStop(location);
    const firstX = anchor.x + 22;
    const secondX = anchor.x - 16;
    await this.moveActor(this.carrier, anchor.x, anchor.y, scaleDuration(180, speed));
    await this.moveActor(this.carrier, firstX, anchor.y, scaleDuration(180, speed));
    await this.moveActor(this.carrier, secondX, anchor.y, scaleDuration(150, speed));
    await this.moveActor(this.carrier, anchor.x, anchor.y, scaleDuration(150, speed));
  }

  private async moveActor(
    actor: StageActor,
    x: number,
    y: number,
    durationMs: number
  ): Promise<void> {
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

  private async moveView(
    view: Container,
    x: number,
    y: number,
    durationMs: number
  ): Promise<void> {
    const fromX = view.x;
    const fromY = view.y;
    const start = performance.now();

    return new Promise((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = easeInOutCubic(t);
        view.position.set(lerp(fromX, x, eased), lerp(fromY, y, eased));
        if (t < 1) {
          requestAnimationFrame(tick);
          return;
        }
        resolve();
      };
      tick();
    });
  }

  private async attachDocumentToActor(
    actor: StageActor,
    speed: number
  ): Promise<void> {
    const anchor = actor.carryAnchor();
    actor.view.addChild(this.document.view);
    this.document.view.position.set(anchor.x, anchor.y);
    await sleep(scaleDuration(120, speed));
  }

  private detachDocument(x: number, y: number): void {
    this.stage.addChild(this.document.view);
    this.document.view.position.set(x, y);
  }

  private readDemoSettings(): DemoSettings {
    this.syncDemoFailureLimit();
    return {
      fileCount: clampInteger(this.demoFileCountEl.value, 5, 1, 10),
      failureCount: clampInteger(
        this.demoFailureCountEl.value,
        0,
        0,
        clampInteger(this.demoFileCountEl.value, 5, 1, 10)
      )
    };
  }

  private syncDemoFailureLimit(): void {
    const fileCount = clampInteger(this.demoFileCountEl.value, 5, 1, 10);
    this.demoFileCountEl.value = `${fileCount}`;
    this.demoFailureCountEl.max = `${fileCount}`;
    const failureCount = clampInteger(
      this.demoFailureCountEl.value,
      0,
      0,
      fileCount
    );
    this.demoFailureCountEl.value = `${failureCount}`;
  }
}

function compactLabel(value: string): string {
  const stem = value.replace(/\.msg$/i, "").replace(/\.pdf$/i, "");
  return stem.length <= 10 ? stem : `${stem.slice(0, 9)}…`;
}

function clampInteger(
  value: string | number,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function scaleDuration(baseMs: number, speed: number): number {
  return Math.max(120, Math.round(baseMs * speed));
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
