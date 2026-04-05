(function () {
  const OVERLAY_ID = "estimator-showcase-overlay";
  const BOT_SRC = "/cone-bot.png";
  const state = {
    observer: null,
    rafId: null,
    driveTimer: null,
    currentProgress: null,
    settleTimer: null,
    altSeekUntil: 0,
  };

  const MILESTONES = [
    {
      id: "load",
      label: "Load",
      progress: 18,
      note: "Workbook staged and lane opened.",
    },
    {
      id: "alternate_seek",
      label: "Alt-seek",
      progress: 42,
      note: "Fallback rescue is filling sparse history.",
    },
    {
      id: "pricing",
      label: "Pricing",
      progress: 68,
      note: "Main pricing sweep is moving through pay items.",
    },
    {
      id: "finalize",
      label: "Finish",
      progress: 92,
      note: "Final checks and output handoff lane.",
    },
  ];

  if (window.__ESTIMATOR_SHOWCASE__) {
    window.__ESTIMATOR_SHOWCASE__.refresh();
    return;
  }

  function mount() {
    const progress = document.querySelector(".section .progress");
    if (!progress) return false;

    relocateProgressSection(progress);
    if (document.getElementById(OVERLAY_ID)) return true;

    const convoy = document.createElement("div");
    convoy.id = OVERLAY_ID;
    convoy.className = "estimator-convoy is-idle";
    convoy.innerHTML = `
      <div class="estimator-convoy-header">
        <div class="estimator-convoy-label">Work Zone Tracker</div>
        <div class="estimator-convoy-state" data-role="state">Awaiting run</div>
      </div>
      <div class="estimator-convoy-track">
        <div class="estimator-convoy-road"></div>
        <div class="estimator-convoy-progress" data-role="progressFill"></div>
        <div class="estimator-convoy-bot">
          <div class="estimator-convoy-headlights" aria-hidden="true"></div>
          <div class="estimator-convoy-treads" aria-hidden="true"></div>
          <div class="estimator-convoy-calculator" aria-hidden="true">
            <div class="estimator-convoy-calculator-screen">Σ</div>
            <div class="estimator-convoy-calculator-keys">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <img alt="Cone-bot sprite" src="${BOT_SRC}" />
        </div>
        <div class="estimator-convoy-math" aria-hidden="true">
          <span>+</span>
          <span>-</span>
          <span>×</span>
          <span>÷</span>
          <span>=</span>
        </div>
        <div class="estimator-convoy-nodes">
          ${MILESTONES.map(({ id, label }) => `
            <div class="estimator-convoy-node" data-node="${id}">
              <div class="estimator-convoy-dot"></div>
              <div class="estimator-convoy-node-label">${label}</div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="estimator-convoy-note" data-role="note">The lane is quiet until a workbook is ready.</div>
    `;
    progress.parentElement.appendChild(convoy);
    return true;
  }

  function relocateProgressSection(progress) {
    const section = progress.closest(".section");
    const rightCol = document.querySelector(".right-col");
    const logCard = rightCol?.querySelector(".log-card");
    if (!section || !rightCol || !logCard) return;
    if (section.parentElement === rightCol && section.nextElementSibling === logCard) return;

    section.classList.add("card", "estimator-progress-relocated");
    rightCol.insertBefore(section, logCard);
  }

  function getRefs() {
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return null;
    return {
      root,
      state: root.querySelector('[data-role="state"]'),
      note: root.querySelector('[data-role="note"]'),
      progressFill: root.querySelector('[data-role="progressFill"]'),
      nodes: Array.from(root.querySelectorAll("[data-node]")),
    };
  }

  function getLogTexts(limit) {
    return Array.from(document.querySelectorAll("#run-log .log-line"))
      .slice(-Math.max(1, limit || 1))
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean);
  }

  function parseRuntimeSignals() {
    const recentLogTexts = getLogTexts(18);
    const allLogTexts = getLogTexts(400);
    const combinedRecent = recentLogTexts.join(" ").toLowerCase();
    const activityText = (document.getElementById("snapshot-activity")?.textContent || "").trim();
    const combined = `${combinedRecent} ${activityText}`.toLowerCase();

    const pipelineMatch = [...allLogTexts]
      .reverse()
      .map((text) => text.match(/\[pipeline:(\d+)\]/i))
      .find(Boolean);
    const pipelineStep = pipelineMatch ? Number(pipelineMatch[1]) : null;

    const rowMatch = allLogTexts.find((text) => /\[pipeline:09\]/i.test(text))?.match(/for\s+(\d+)\s+project rows/i);
    const totalRows = rowMatch ? Number(rowMatch[1]) : null;
    const pricedRows = allLogTexts.filter((text) => /^\[item\]/i.test(text)).length;

    if (combined.includes("alternate_seek activating") || combined.includes("alternate_seek resolved")) {
      state.altSeekUntil = Date.now() + 9000;
    }

    return {
      pipelineStep,
      totalRows,
      pricedRows,
      recentAltSeek: Date.now() < state.altSeekUntil,
      combined,
      recentLogTexts,
    };
  }

  function detectPhase() {
    const snapshot = document.getElementById("snapshot-tag");
    const statusTitle = document.getElementById("status-title");
    const progress = document.querySelector(".progress.running");
    const snapshotText = (snapshot?.textContent || "").trim().toLowerCase();
    const titleText = (statusTitle?.textContent || "").trim().toLowerCase();
    if (snapshotText.includes("failed") || titleText.includes("failed") || titleText.includes("error")) return "error";
    if (snapshotText.includes("complete")) return "success";
    if (snapshotText.includes("running") || titleText.includes("starting") || progress) return "running";
    return "idle";
  }

  function detectMilestone(phase) {
    const explicitMilestone = document.body?.dataset?.convoyMilestone;
    if (explicitMilestone && MILESTONES.some((item) => item.id === explicitMilestone)) {
      return explicitMilestone;
    }

    const runtime = parseRuntimeSignals();
    if (runtime.recentAltSeek) return "alternate_seek";
    if (runtime.pipelineStep !== null) {
      if (runtime.pipelineStep >= 10) return "finalize";
      if (runtime.pipelineStep >= 9) return "pricing";
      if (runtime.pipelineStep >= 1) return "load";
    }

    const combined = [
      document.getElementById("status-title")?.textContent || "",
      document.getElementById("status-detail")?.textContent || "",
      document.getElementById("snapshot-activity")?.textContent || "",
    ].join(" ").toLowerCase();

    if (phase === "success") return "finalize";
    if (phase === "error") return "alternate_seek";
    if (phase === "idle") return "load";
    if (combined.includes("alternate-seek") || combined.includes("fallback")) return "alternate_seek";
    if (combined.includes("pricing") || combined.includes("pay item") || combined.includes("unit price") || combined.includes("triangulating")) return "pricing";
    if (combined.includes("finalizing") || combined.includes("wrap") || combined.includes("output") || combined.includes("suppressing")) return "finalize";
    return "load";
  }

  function detectProgress(phase, milestoneId) {
    const explicitProgress = Number(document.body?.dataset?.convoyProgress);
    if (Number.isFinite(explicitProgress)) return explicitProgress;

    const runtime = parseRuntimeSignals();
    if (runtime.pipelineStep !== null) {
      const step = runtime.pipelineStep;
      if (runtime.recentAltSeek) return 46;
      if (step >= 1 && step <= 8) {
        return Math.round(10 + ((step - 1) / 7) * 24);
      }
      if (step === 9) {
        const ratio = runtime.totalRows ? Math.min(1, runtime.pricedRows / runtime.totalRows) : 0.35;
        return Math.round(52 + ratio * 24);
      }
      if (step >= 10 && step <= 14) {
        return Math.round(78 + ((step - 10) / 4) * 14);
      }
    }

    const milestone = MILESTONES.find((item) => item.id === milestoneId) || MILESTONES[0];
    if (phase === "success") return 92;
    if (phase === "error") return 46;
    return milestone.progress;
  }

  function getNote(phase, milestoneId) {
    if (phase === "success") return "Lane clear.";
    if (phase === "error") return "Check run log.";
    if (phase === "idle") return "Waiting for run.";

    if (milestoneId === "load") return "Staging inputs.";
    if (milestoneId === "alternate_seek") return "Rescuing sparse items.";
    if (milestoneId === "pricing") return "Crunching prices.";
    return "Docking outputs.";
  }

  function applyState() {
    const refs = getRefs();
    if (!refs) return;
    const phase = detectPhase();
    const milestoneId = detectMilestone(phase);
    const milestone = MILESTONES.find((item) => item.id === milestoneId) || MILESTONES[0];
    const progress = detectProgress(phase, milestoneId);

    refs.root.classList.remove(
      "is-idle",
      "is-running",
      "is-success",
      "is-error",
      "phase-load",
      "phase-alternate_seek",
      "phase-pricing",
      "phase-finalize"
    );
    refs.root.classList.add(`is-${phase}`);
    refs.root.classList.add(`phase-${milestoneId}`);
    refs.root.style.setProperty("--convoy-progress", `${progress}%`);
    updateMotionState(refs.root, progress, phase, milestoneId);

    refs.state.textContent =
      phase === "success" ? "Lane clear" :
      phase === "error" ? "Needs review" :
      phase === "running" ? milestone.label :
      "Awaiting run";

    refs.note.textContent = getNote(phase, milestoneId);

    refs.nodes.forEach((node, index) => {
      const nodeMilestone = MILESTONES[index];
      node.classList.remove("is-active", "is-done");
      if (nodeMilestone.id === milestoneId) {
        node.classList.add("is-active");
      } else if (nodeMilestone.progress < progress || phase === "success") {
        node.classList.add("is-done");
      }
    });
  }

  function updateMotionState(root, progress, phase, milestoneId) {
    if (state.currentProgress === null) {
      state.currentProgress = progress;
      return;
    }
    if (state.currentProgress === progress) return;

    const wasBeforeFinish = state.currentProgress < MILESTONES[MILESTONES.length - 1].progress;
    state.currentProgress = progress;
    root.classList.add("is-driving");
    root.classList.remove("is-settling");
    if (state.driveTimer) window.clearTimeout(state.driveTimer);
    state.driveTimer = window.setTimeout(() => {
      root.classList.remove("is-driving");
      state.driveTimer = null;
      if ((phase === "success" || milestoneId === "finalize") && wasBeforeFinish) {
        root.classList.add("is-settling");
        if (state.settleTimer) window.clearTimeout(state.settleTimer);
        state.settleTimer = window.setTimeout(() => {
          root.classList.remove("is-settling");
          state.settleTimer = null;
        }, 1800);
      }
    }, 3000);
  }

  function scheduleApplyState() {
    if (state.rafId) return;
    state.rafId = window.requestAnimationFrame(() => {
      state.rafId = null;
      applyState();
    });
  }

  function observe() {
    if (state.observer) state.observer.disconnect();
    state.observer = new MutationObserver(() => {
      scheduleApplyState();
    });

    [
      document.getElementById("snapshot-tag"),
      document.getElementById("status-title"),
      document.getElementById("status-detail"),
      document.querySelector(".progress"),
      document.getElementById("snapshot-activity"),
      document.getElementById("run-log"),
      document.body,
    ]
      .filter(Boolean)
      .forEach((target) => {
        state.observer.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["class", "style", "data-convoy-milestone", "data-convoy-progress"],
        });
      });
  }

  function refresh() {
    if (!mount()) return;
    applyState();
    observe();
  }

  window.__ESTIMATOR_SHOWCASE__ = {
    refresh,
    destroy() {
      if (state.observer) state.observer.disconnect();
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      if (state.driveTimer) window.clearTimeout(state.driveTimer);
      if (state.settleTimer) window.clearTimeout(state.settleTimer);
      document.getElementById(OVERLAY_ID)?.remove();
      delete window.__ESTIMATOR_SHOWCASE__;
    },
  };

  refresh();
})();
