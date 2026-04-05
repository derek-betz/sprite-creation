(function () {
  const frame = document.getElementById("estimator-frame");
  const params = new URLSearchParams(window.location.search);
  const preset = params.get("preset");
  const runId = params.get("runId");
  const shellShowcase = document.getElementById("shell-showcase");
  const playButton = document.getElementById("control-play");
  const pauseButton = document.getElementById("control-pause");
  const restartButton = document.getElementById("control-restart");
  const dummyRunNote = document.getElementById("dummy-run-note");
  const phaseButtons = Array.from(document.querySelectorAll("[data-phase]"));
  const progressLabelNodes = {
    load: document.getElementById("shell-node-load"),
    filter: document.getElementById("shell-node-filter"),
    price: document.getElementById("shell-node-price"),
    export: document.getElementById("shell-node-export"),
  };

  const state = {
    dummyRun: {
      elapsedSeconds: 0,
      isPlaying: false,
      intervalId: null,
    },
  };

  const PHASE_DEFAULTS = {
    idle: {
      title: "Ready for dispatch.",
      hud: "IDLE",
      hudMeta: "Awaiting workbook",
      detail: "Cone-bot is staged at the shoulder, waiting for the next estimate run.",
      chip: "Awaiting workbook",
      mission: "Staged",
      scorePhase: "Awaiting Workbook",
      scoreEta: "No active run",
      targetMeta: "Shoulder idle",
      copy: "The lane sits armed but quiet until a workbook is dropped in and the estimator run begins.",
      progressWidth: "18%",
      activeCount: 1,
      pulseIndex: -1,
      opsLog: [
        "Workbook bay is empty.",
        "Cone-bot is parked on the shoulder.",
        "Ops feed is waiting for the next dispatch.",
      ],
    },
    running: {
      title: "Estimator convoy in motion.",
      hud: "RUN",
      hudMeta: "Estimator convoy in motion",
      detail: "Triangulating sane unit prices, calming variance, and sweeping the lane for outliers.",
      chip: "Live run",
      mission: "Convoy Live",
      scorePhase: "Pricing Sweep",
      scoreEta: "11s lane",
      targetMeta: "BidTabs corridor locked",
      copy: "A browser-only animation layer that turns estimator progress into a tiny roadway operations game scene.",
      progressWidth: "54%",
      activeCount: 2,
      pulseIndex: 2,
      opsLog: [
        "Loading workbook and priming the lane.",
        "Cone-bot is sweeping for price outliers.",
        "Export docks standing by.",
      ],
    },
    success: {
      title: "Estimate delivered.",
      hud: "DONE",
      hudMeta: "Outputs ready",
      detail: "Cone-bot cleared the work zone, lit the lane green, and handed off the finished estimate package.",
      chip: "Outputs ready",
      mission: "Lane Clear",
      scorePhase: "Export Complete",
      scoreEta: "Package ready",
      targetMeta: "Estimate package docked",
      copy: "The live run has finished, the convoy lights turn green, and the generated outputs are staged for handoff.",
      progressWidth: "92%",
      activeCount: 4,
      pulseIndex: -1,
      opsLog: [
        "Workbook cleared and priced successfully.",
        "Audit, draft estimate, and pay-item exports are ready.",
        "Cone-bot has handed the lane back to the operator.",
      ],
    },
    error: {
      title: "Caution: run interrupted.",
      hud: "WARN",
      hudMeta: "Needs review",
      detail: "Cone-bot has the caution beacons on while the team checks the log.",
      chip: "Needs review",
      mission: "Caution Hold",
      scorePhase: "Review Needed",
      scoreEta: "Manual assist",
      targetMeta: "Lane paused for diagnostics",
      copy: "The same browser-only layer can shift into a caution state and make failures legible without changing the production app.",
      progressWidth: "36%",
      activeCount: 1,
      pulseIndex: 1,
      opsLog: [
        "Estimator paused before export.",
        "Cone-bot switched the zone to caution beacons.",
        "Operator review required before the lane reopens.",
      ],
    },
  };

  const DUMMY_STEPS = [
    {
      start: 0,
      end: 10,
      phase: "running",
      scorePhase: "Filter Window",
      detail: "Opening the lane, staging the workbook, and narrowing BidTabs to a sane contract-cost corridor.",
      targetMeta: "Contract-cost corridor narrowing",
      progressWidth: "26%",
      activeCount: 1,
      pulseIndex: 1,
      nodeLabels: ["LOAD", "FILTER", "PRICE", "EXPORT"],
      iframe: {
        statusTitle: "Dummy estimate boot sequence",
        statusDetail: "Staging workbook and calibrating the contract-cost filter window for the demo run.",
        snapshotTag: "Running",
        snapshotStatus: "Browser-only dummy estimate is running.",
        snapshotActivity: "Calibrating BidTabs corridor to match the target workbook profile.",
        snapshotLastRun: "No backend work submitted. Outputs disabled.",
        runLogTitle: "Demo Run Log",
        runLog: [
          "Starting 45-second dummy estimate. No backend run submitted.",
          "[timeline:00-10] Priming workbook bay and contract-cost filter corridor.",
          "Outputs will be skipped for this test-only animation run.",
        ],
        outputs: ["Skipped", "Skipped", "Skipped", "Skipped"],
      },
      opsLog: [
        "Workbook token received by mission control.",
        "BidTabs corridor is narrowing around the target profile.",
        "Cone-bot is marking the live lane for pricing traffic.",
      ],
    },
    {
      start: 10,
      end: 20,
      phase: "running",
      scorePhase: "Alternate-Seek",
      detail: "Alternate-seek is active now, backfilling missing comparables and rescuing thin item history for 10 seconds.",
      targetMeta: "Alternate-seek fallback engaged",
      progressWidth: "48%",
      activeCount: 2,
      pulseIndex: 1,
      nodeLabels: ["LOAD", "ALT-SEEK", "PRICE", "EXPORT"],
      chip: "Alt-seek live",
      iframe: {
        statusTitle: "Alternate-seek backfill in progress",
        statusDetail: "Testing the alternate-seek method against sparse pricing history before returning to the main lane.",
        snapshotTag: "Running",
        snapshotStatus: "Alternate-seek method is active in the dummy timeline.",
        snapshotActivity: "Backfilling missing comparables with fallback scoring logic for 10 seconds.",
        snapshotLastRun: "Outputs remain disabled for this browser-only demo.",
        runLogTitle: "Demo Run Log",
        runLog: [
          "[timeline:10-20] Alternate-seek method engaged for sparse item history.",
          "Scoring fallback candidates and testing low-sample rescue paths.",
          "No outputs will be written; this is a visual-only estimator simulation.",
        ],
        outputs: ["Skipped", "Skipped", "Skipped", "Skipped"],
      },
      opsLog: [
        "Alternate-seek method has the lane for a full 10-second segment.",
        "Fallback candidates are being scored against sparse history.",
        "Cone-bot is holding the caution rail while the rescue pass completes.",
      ],
    },
    {
      start: 20,
      end: 35,
      phase: "running",
      scorePhase: "Pricing Sweep",
      detail: "The estimator is back in the main lane, pricing pay items and smoothing unit costs after the alternate-seek pass.",
      targetMeta: "Main pricing lane restored",
      progressWidth: "72%",
      activeCount: 2,
      pulseIndex: 2,
      nodeLabels: ["LOAD", "FILTER", "PRICE", "EXPORT"],
      iframe: {
        statusTitle: "Dummy estimate pricing sweep",
        statusDetail: "Applying unit prices, smoothing variance, and marching through pay items without generating outputs.",
        snapshotTag: "Running",
        snapshotStatus: "Dummy estimate is pricing items in the main lane.",
        snapshotActivity: "Alternate-seek segment completed. Main pricing sweep is now active.",
        snapshotLastRun: "Still browser-only. Outputs disabled.",
        runLogTitle: "Demo Run Log",
        runLog: [
          "[timeline:20-35] Main pricing sweep active after alternate-seek.",
          "Sweeping item history, calming variance, and projecting unit prices.",
          "Output docks remain disabled by design.",
        ],
        outputs: ["Skipped", "Skipped", "Skipped", "Skipped"],
      },
      opsLog: [
        "Alternate-seek has cleared the lane.",
        "Main pricing convoy is moving through the pay-item list.",
        "Export docks remain dark for this no-output rehearsal.",
      ],
    },
    {
      start: 35,
      end: 45,
      phase: "running",
      scorePhase: "No-Output Wrap",
      detail: "Dummy run is cooling down, validating the lane, and ending cleanly without writing files.",
      targetMeta: "Demo wrap-up with outputs suppressed",
      progressWidth: "88%",
      activeCount: 3,
      pulseIndex: 3,
      nodeLabels: ["LOAD", "FILTER", "PRICE", "SKIP"],
      chip: "Finalizing",
      iframe: {
        statusTitle: "Dummy estimate finalizing",
        statusDetail: "Wrapping the test run and skipping output generation before the lane turns green.",
        snapshotTag: "Running",
        snapshotStatus: "Dummy estimate is in final validation.",
        snapshotActivity: "No-output finale: validating the lane and suppressing file generation.",
        snapshotLastRun: "Completes at 45 seconds with no files written.",
        runLogTitle: "Demo Run Log",
        runLog: [
          "[timeline:35-45] Final validation and no-output wrap-up.",
          "Skipping output package creation for the browser-only demo path.",
          "Preparing the lane-clear signal.",
        ],
        outputs: ["Skipped", "Skipped", "Skipped", "Skipped"],
      },
      opsLog: [
        "The convoy is on the final straightaway.",
        "Output docks are intentionally bypassed.",
        "Cone-bot is preparing the lane-clear animation.",
      ],
    },
  ];

  function setNodeStates(activeCount, pulseIndex) {
    const nodes = document.querySelectorAll(".shell-progress-node");
    nodes.forEach((node, index) => {
      node.classList.remove("is-active", "is-pulse");
      if (index < activeCount) {
        node.classList.add("is-active");
      }
      if (index === pulseIndex) {
        node.classList.remove("is-active");
        node.classList.add("is-pulse");
      }
    });
  }

  function setProgressLabels(labels) {
    const values = labels || ["LOAD", "FILTER", "PRICE", "EXPORT"];
    progressLabelNodes.load.textContent = values[0];
    progressLabelNodes.filter.textContent = values[1];
    progressLabelNodes.price.textContent = values[2];
    progressLabelNodes.export.textContent = values[3];
  }

  function setOpsLog(lines) {
    const log = document.getElementById("shell-ops-log");
    if (!log) return;
    log.innerHTML = (lines || [])
      .map((line) => `<div class="shell-ops-line">${line}</div>`)
      .join("");
  }

  function setShellState(phase, detail, overrides) {
    if (!shellShowcase) return;
    const config = {
      ...PHASE_DEFAULTS[phase],
      ...(overrides || {}),
    };
    shellShowcase.classList.remove("is-idle", "is-running", "is-success", "is-error");
    shellShowcase.classList.add(`is-${phase}`);
    document.getElementById("shell-status-title").textContent = config.title;
    document.getElementById("shell-hud-value").textContent = config.hud;
    document.getElementById("shell-hud-meta").textContent = config.hudMeta;
    document.getElementById("shell-status-detail").textContent = detail || config.detail;
    document.getElementById("shell-chip").textContent = config.chip;
    document.getElementById("shell-mission-state").textContent = config.mission;
    document.getElementById("shell-score-phase").textContent = config.scorePhase;
    document.getElementById("shell-score-eta").textContent = config.scoreEta;
    document.getElementById("shell-target-meta").textContent = config.targetMeta;
    document.getElementById("shell-showcase-copy").textContent = config.copy;
    const progressFill = document.getElementById("shell-progress-fill");
    if (progressFill) progressFill.style.width = config.progressWidth;
    setNodeStates(config.activeCount, config.pulseIndex);
    setProgressLabels(config.nodeLabels);
    setOpsLog(config.opsLog);
  }

  async function injectOverlay() {
    if (!frame || !frame.contentWindow) return;
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;

    if (!doc.querySelector('link[data-estimator-showcase]')) {
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = "/overlay.css";
      link.dataset.estimatorShowcase = "1";
      doc.head.appendChild(link);
      await new Promise((resolve) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
      });
    }

    if (!doc.querySelector('script[data-estimator-showcase]')) {
      const script = doc.createElement("script");
      script.src = "/overlay.js";
      script.dataset.estimatorShowcase = "1";
      doc.body.appendChild(script);
      await new Promise((resolve) => {
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", resolve, { once: true });
      });
    } else if (frame.contentWindow.__ESTIMATOR_SHOWCASE__) {
      frame.contentWindow.__ESTIMATOR_SHOWCASE__.refresh();
    }
  }

  function setOutputs(doc, labels) {
    const nodes = doc.querySelectorAll(".output-slot-status");
    nodes.forEach((node, index) => {
      node.textContent = labels[index] || labels[labels.length - 1] || "Ready";
    });
  }

  function applyIframeScenario(doc, scenario) {
    if (!doc || !scenario) return;
    doc.getElementById("status-title").textContent = scenario.statusTitle;
    doc.getElementById("status-detail").textContent = scenario.statusDetail;
    doc.getElementById("snapshot-tag").textContent = scenario.snapshotTag;
    doc.getElementById("snapshot-status").textContent = scenario.snapshotStatus;
    doc.getElementById("snapshot-activity").textContent = scenario.snapshotActivity;
    doc.getElementById("snapshot-last-run").textContent = scenario.snapshotLastRun;
    const logTitle = doc.getElementById("run-log-title");
    if (logTitle && scenario.runLogTitle) logTitle.textContent = scenario.runLogTitle;
    const runLog = doc.getElementById("run-log");
    if (runLog && scenario.runLog) {
      runLog.innerHTML = scenario.runLog
        .map((line) => `<div class="log-line info">${line}</div>`)
        .join("");
    }
    if (scenario.progressRunning) {
      doc.querySelector(".progress")?.classList.add("running");
    } else {
      doc.querySelector(".progress")?.classList.remove("running");
    }
    if (scenario.outputs) {
      setOutputs(doc, scenario.outputs);
    }
    if (scenario.convoyMilestone) {
      doc.body.dataset.convoyMilestone = scenario.convoyMilestone;
    } else {
      delete doc.body.dataset.convoyMilestone;
    }
    if (typeof scenario.convoyProgress === "number") {
      doc.body.dataset.convoyProgress = String(scenario.convoyProgress);
    } else {
      delete doc.body.dataset.convoyProgress;
    }
  }

  function commonSetup(doc) {
    doc.getElementById("expected-cost").value = "2,850,000.00";
    doc.getElementById("project-district").value = "4 - LAPORTE";
    doc.getElementById("workbook-label").textContent = "2300946_project_quantities.xlsx";
    doc.getElementById("workbook-hint").textContent = "Workbook staged for the live demo.";
    doc.getElementById("snapshot-workbook").textContent = "2300946_project_quantities.xlsx";
    doc.getElementById("snapshot-inputs").textContent = "$2,850,000.00 | 4 - LAPORTE | +/-50%";
  }

  function applyPresetScenario(doc, presetName, responseData) {
    commonSetup(doc);

    if (presetName === "running") {
      setShellState("running");
      applyIframeScenario(doc, {
        statusTitle: "Estimator convoy in motion",
        statusDetail: "Triangulating a sane unit price while Cone-bot sweeps the lane for outliers.",
        snapshotTag: "Running",
        snapshotStatus: "Estimator is running.",
        snapshotActivity: "Filtered BidTabs to contracts between $1,425,000 and $4,275,000.",
        snapshotLastRun: "Live run in progress.",
        runLogTitle: "Run Log",
        runLog: [
          "Starting estimator for 2300946_project_quantities.xlsx",
          "[pipeline:08] Calibrating BidTabs contract-cost filter window",
          "Filtered BidTabs to contracts between $1,425,000 and $4,275,000.",
          "[pipeline:09] Running item pricing analytics for 45 project rows",
        ],
        outputs: ["Generating...", "Generating...", "Generating...", "Generating..."],
        progressRunning: true,
        convoyMilestone: "pricing",
        convoyProgress: 61,
      });
      return;
    }

    if (presetName === "complete") {
      setShellState("success", responseData?.message || "Estimator completed successfully.");
      applyIframeScenario(doc, {
        statusTitle: "Run complete",
        statusDetail: responseData?.message || "Estimator completed successfully.",
        snapshotTag: "Complete",
        snapshotStatus: "Estimator run completed successfully.",
        snapshotActivity: "Outputs written: Estimate_Draft.xlsx, Estimate_Audit.csv, PayItems_Audit.xlsx.",
        snapshotLastRun: `Completed in ${responseData?.duration || "11s"}.`,
        runLogTitle: "Run Log",
        runLog: [
          "Project subtotal (items x unit price): $813,215.",
          "Top 5 cost drivers account for 65% of the subtotal.",
          "Alternates used: 1",
          "Estimator completed successfully.",
        ],
        outputs: ["Ready", "Ready", "Ready", "Ready"],
        progressRunning: false,
        convoyMilestone: "finalize",
        convoyProgress: 92,
      });
    }
  }

  async function applyPreset() {
    const doc = frame?.contentDocument;
    if (!doc) return;

    if (preset === "running") {
      applyPresetScenario(doc, "running");
    }

    if (preset === "complete" && runId) {
      const response = await fetch(`/api/run/${runId}`);
      if (!response.ok) return;
      const data = await response.json();
      applyPresetScenario(doc, "complete", data);
    }
  }

  function setActivePhaseButton(secondMark) {
    phaseButtons.forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.phase) === secondMark);
    });
  }

  function updateControls() {
    if (!dummyRunNote || !playButton || !pauseButton) return;
    const remaining = Math.max(0, 45 - state.dummyRun.elapsedSeconds);
    playButton.disabled = state.dummyRun.isPlaying;
    pauseButton.disabled = !state.dummyRun.isPlaying;
    if (state.dummyRun.isPlaying) {
      dummyRunNote.textContent = `Playing browser-only estimate timeline. ${remaining}s remaining, with alternate-seek highlighted from 10s to 20s.`;
    } else if (state.dummyRun.elapsedSeconds === 0) {
      dummyRunNote.textContent = "Manual animation controls. Play the 45-second browser-only estimate or jump straight to alternate-seek.";
    } else if (state.dummyRun.elapsedSeconds >= 45) {
      dummyRunNote.textContent = "Timeline finished. Restart to replay, or jump directly to any phase.";
    } else {
      dummyRunNote.textContent = `Paused at ${state.dummyRun.elapsedSeconds}s. Use Play to continue or jump directly to another phase.`;
    }
  }

  function finishDummyRun(doc) {
    state.dummyRun.isPlaying = false;
    state.dummyRun.elapsedSeconds = 45;
    setShellState("success", "Dummy estimate complete. The lane turned green after a full 45-second rehearsal, and no files were written.", {
      chip: "No-output finish",
      scorePhase: "Lane Clear",
      scoreEta: "45s complete",
      targetMeta: "Dummy estimate completed with outputs suppressed",
      copy: "This was a pure front-end rehearsal: a full estimator-feeling run, including alternate-seek, without touching the backend or writing outputs.",
      opsLog: [
        "Dummy estimate completed right on the 45-second mark.",
        "Alternate-seek received its dedicated 10-second segment.",
        "No output package was generated.",
      ],
    });
    applyIframeScenario(doc, {
      statusTitle: "Dummy estimate complete",
      statusDetail: "45-second browser-only estimate finished cleanly. Alternate-seek was represented mid-run, and outputs were intentionally skipped.",
      snapshotTag: "Complete",
      snapshotStatus: "Dummy estimate completed with no backend outputs.",
      snapshotActivity: "Test-only timeline finished: filter window, alternate-seek, pricing sweep, and no-output wrap-up.",
      snapshotLastRun: "Completed in 45s. No files written.",
      runLogTitle: "Demo Run Log",
      runLog: [
        "Dummy estimate completed in 45 seconds.",
        "Alternate-seek held the lane from second 10 through second 20.",
        "Output generation was skipped by design.",
      ],
      outputs: ["Skipped", "Skipped", "Skipped", "Skipped"],
      progressRunning: false,
      convoyMilestone: "finalize",
      convoyProgress: 92,
    });
    setActivePhaseButton(35);
    updateControls();
  }

  function applyDummyStep(doc, elapsedSeconds) {
    const remaining = Math.max(0, 45 - elapsedSeconds);
    const activeStep = DUMMY_STEPS.find((step) => elapsedSeconds >= step.start && elapsedSeconds < step.end) || DUMMY_STEPS[DUMMY_STEPS.length - 1];
    const convoyProgress = getConvoyProgress(activeStep, elapsedSeconds);
    setShellState(activeStep.phase, activeStep.detail, {
      scorePhase: activeStep.scorePhase,
      scoreEta: `${remaining}s remaining`,
      targetMeta: activeStep.targetMeta,
      progressWidth: activeStep.progressWidth,
      activeCount: activeStep.activeCount,
      pulseIndex: activeStep.pulseIndex,
      nodeLabels: activeStep.nodeLabels,
      chip: activeStep.chip || `Demo run ${remaining}s`,
      mission: activeStep.scorePhase === "Alternate-Seek" ? "Fallback Rescue" : "Convoy Live",
      hudMeta: activeStep.scorePhase === "Alternate-Seek" ? "Alternate-seek method active" : "Estimator convoy in motion",
      copy: activeStep.scorePhase === "Alternate-Seek"
        ? "This phase spotlights the alternate-seek method, giving sparse-history rescue logic a clear visual lane for 10 full seconds."
        : PHASE_DEFAULTS.running.copy,
      opsLog: activeStep.opsLog,
    });
    applyIframeScenario(doc, {
      ...activeStep.iframe,
      progressRunning: true,
      convoyMilestone: getConvoyMilestone(activeStep),
      convoyProgress,
    });
    setActivePhaseButton(activeStep.start);
    if (dummyRunNote && activeStep.scorePhase === "Alternate-Seek") {
      dummyRunNote.textContent = `Paused on alternate-seek rescue logic. ${remaining}s remain in the full timeline when you resume play.`;
    }
  }

  function getConvoyMilestone(step) {
    if (step.start >= 35) return "finalize";
    if (step.start >= 20) return "pricing";
    if (step.start >= 10) return "alternate_seek";
    return "load";
  }

  function getConvoyProgress(step, elapsedSeconds) {
    const milestone = getConvoyMilestone(step);
    const progressMap = {
      load: { start: 10, end: 26 },
      alternate_seek: { start: 28, end: 48 },
      pricing: { start: 52, end: 78 },
      finalize: { start: 80, end: 92 },
    };
    const lane = progressMap[milestone];
    const span = Math.max(1, step.end - step.start);
    const local = Math.max(0, Math.min(span, elapsedSeconds - step.start));
    const ratio = local / span;
    return Math.round(lane.start + (lane.end - lane.start) * ratio);
  }

  function stopTicker() {
    if (state.dummyRun.intervalId) window.clearInterval(state.dummyRun.intervalId);
    state.dummyRun.intervalId = null;
  }

  function syncDummyState() {
    const doc = frame?.contentDocument;
    if (!doc) return;
    commonSetup(doc);
    if (state.dummyRun.elapsedSeconds >= 45) {
      finishDummyRun(doc);
    } else {
      applyDummyStep(doc, state.dummyRun.elapsedSeconds);
      updateControls();
    }
  }

  function playDummyRun() {
    const doc = frame?.contentDocument;
    if (!doc) return;
    if (state.dummyRun.isPlaying) return;
    if (state.dummyRun.elapsedSeconds >= 45) {
      state.dummyRun.elapsedSeconds = 0;
    }
    const startedAt = Date.now() - state.dummyRun.elapsedSeconds * 1000;
    state.dummyRun.isPlaying = true;
    updateControls();
    stopTicker();
    state.dummyRun.intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      state.dummyRun.elapsedSeconds = elapsed;
      if (elapsed >= 45) {
        stopTicker();
        finishDummyRun(doc);
        return;
      }
      applyDummyStep(doc, elapsed);
      updateControls();
    }, 250);
  }

  function pauseDummyRun() {
    if (!state.dummyRun.isPlaying) return;
    state.dummyRun.isPlaying = false;
    stopTicker();
    syncDummyState();
  }

  function restartDummyRun() {
    state.dummyRun.isPlaying = false;
    state.dummyRun.elapsedSeconds = 0;
    stopTicker();
    syncDummyState();
    playDummyRun();
  }

  function jumpToPhase(secondMark) {
    state.dummyRun.isPlaying = false;
    state.dummyRun.elapsedSeconds = Math.max(0, Math.min(45, secondMark));
    stopTicker();
    syncDummyState();
  }

  window.__COSTEST_DUMMY_RUN__ = playDummyRun;

  frame?.addEventListener("load", () => {
    injectOverlay()
      .then(() => {
        applyPreset();
        if (!preset) {
          syncDummyState();
        }
      })
      .catch(() => {});
  });

  playButton?.addEventListener("click", playDummyRun);
  pauseButton?.addEventListener("click", pauseDummyRun);
  restartButton?.addEventListener("click", restartDummyRun);
  phaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      jumpToPhase(Number(button.dataset.phase || "0"));
    });
  });

  if (!preset) {
    setShellState("idle");
    setActivePhaseButton(0);
  }

  updateControls();
})();
