import fs from "node:fs/promises";
import { chromium } from "playwright";

const demoUrl = "http://127.0.0.1:8766/";
const apiBase = "http://127.0.0.1:8766/api";
const workbookPath = "/Users/derekbetz/.openclaw/workspace/CostEstimateGenerator/data/samples/2300946_project_quantities.xlsx";
const workbookName = "2300946_project_quantities.xlsx";
const outDir = "/Users/derekbetz/.openclaw/workspace/sprite-creation/output/playwright/costest-demo";

async function startRun() {
  const workbookBytes = await fs.readFile(workbookPath);
  const form = new FormData();
  form.append(
    "workbook",
    new File([workbookBytes], workbookName, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  form.append("expected_cost", "2850000");
  form.append("project_district", "4 - LAPORTE");
  form.append("contract_filter_pct", "50");
  form.append("alt_seek", "true");
  form.append("aggregate_method", "ROBUST_MEDIAN");
  form.append("robust_fallback", "true");

  const response = await fetch(`${apiBase}/run`, { method: "POST", body: form });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Run start failed: ${response.status} ${body}`);
  }
  return response.json();
}

async function getRun(runId) {
  const response = await fetch(`${apiBase}/run/${runId}`);
  if (!response.ok) throw new Error(`Status fetch failed: ${response.status}`);
  return response.json();
}

async function getLog(runId, since = 0) {
  const response = await fetch(`${apiBase}/run/${runId}/log?since=${since}`);
  if (!response.ok) throw new Error(`Log fetch failed: ${response.status}`);
  return response.json();
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1680, height: 1180 },
  colorScheme: "dark",
});

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

try {
  console.log("Opening demo shell...");
  await page.goto(demoUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator("#estimator-frame").waitFor({ timeout: 30000 });
  const frameHandle = await page.locator("#estimator-frame").elementHandle();
  const estimatorFrame = await frameHandle.contentFrame();
  if (!estimatorFrame) {
    throw new Error("Estimator iframe failed to load.");
  }
  await estimatorFrame.waitForSelector("#run-log", { timeout: 30000 });
  console.log("Injecting overlay directly into iframe...");
  await estimatorFrame.addStyleTag({ url: "http://127.0.0.1:8766/overlay.css" });
  await estimatorFrame.addScriptTag({ url: "http://127.0.0.1:8766/overlay.js" });
  await estimatorFrame.waitForSelector("#estimator-showcase-overlay", { timeout: 30000 });

  console.log("Starting real estimator run via backend...");
  const { runId } = await startRun();
  console.log("Run ID:", runId);

  await page.evaluate(({ workbookName }) => {
    const frame = document.querySelector("#estimator-frame");
    const doc = frame.contentDocument;
    doc.getElementById("expected-cost").value = "2,850,000.00";
    doc.getElementById("project-district").value = "4 - LAPORTE";
    doc.getElementById("workbook-label").textContent = workbookName;
    doc.getElementById("workbook-hint").textContent = "Workbook ready. Run dispatched through the live estimator service.";
    doc.getElementById("status-title").textContent = "Starting run";
    doc.getElementById("status-detail").textContent = "Estimator is preparing inputs.";
    doc.getElementById("snapshot-tag").textContent = "Running";
    doc.getElementById("snapshot-status").textContent = "Estimator is running.";
    doc.getElementById("snapshot-workbook").textContent = workbookName;
    doc.getElementById("snapshot-inputs").textContent = "$2,850,000.00 | 4 - LAPORTE | +/-50%";
    doc.getElementById("snapshot-activity").textContent = "Run dispatched to estimator service.";
    doc.getElementById("run-estimate").disabled = true;
    doc.querySelector(".progress")?.classList.add("running");
  }, { workbookName });

  const firstLog = await getLog(runId, 0);
  const firstEntry = (firstLog.entries || []).at(-1)?.text || "Estimator convoy in motion.";
  await page.evaluate(({ firstEntry }) => {
    const frame = document.querySelector("#estimator-frame");
    const doc = frame.contentDocument;
    doc.getElementById("status-title").textContent = "Estimator convoy in motion";
    doc.getElementById("status-detail").textContent = firstEntry;
    doc.getElementById("snapshot-activity").textContent = firstEntry;
    const runLog = doc.getElementById("run-log");
    if (runLog) {
      runLog.innerHTML = `<div class="log-line info">${firstEntry}</div>`;
    }
  }, { firstEntry });

  await page.waitForTimeout(2200);
  await page.screenshot({
    path: `${outDir}/costest-running-demo.png`,
  });
  console.log("Captured running view.");

  let finished = null;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const runData = await getRun(runId);
    if (runData.status !== "running") {
      finished = runData;
      break;
    }
    await page.waitForTimeout(1400);
  }

  if (!finished) {
    throw new Error("Timed out waiting for estimator completion.");
  }

  const finalLog = await getLog(runId, 0);
  const finalEntry = (finalLog.entries || []).at(-1)?.text || finished.message || "Estimator completed successfully.";
  await page.evaluate(({ runData, finalEntry }) => {
    const frame = document.querySelector("#estimator-frame");
    const doc = frame.contentDocument;
    const success = runData.status === "success";
    doc.getElementById("status-title").textContent = success ? "Run complete" : "Run failed";
    doc.getElementById("status-detail").textContent = runData.message || finalEntry;
    doc.getElementById("snapshot-tag").textContent = success ? "Complete" : "Failed";
    doc.getElementById("snapshot-status").textContent = success
      ? "Estimator run completed successfully."
      : "Estimator run failed.";
    doc.getElementById("snapshot-activity").textContent = finalEntry;
    doc.getElementById("snapshot-last-run").textContent = success
      ? "Outputs generated for the live run."
      : "Run ended with an error.";
    doc.querySelector(".progress")?.classList.remove("running");
    doc.getElementById("run-estimate").disabled = false;
    const runLog = doc.getElementById("run-log");
    if (runLog) {
      runLog.innerHTML = "";
      for (const entry of runData.outputs || []) {
        const line = doc.createElement("div");
        line.className = "log-line info";
        line.textContent = `Output ready: ${entry.name}`;
        runLog.appendChild(line);
      }
    }
    const outputs = doc.getElementById("output-links");
    if (outputs && Array.isArray(runData.outputs) && runData.outputs.length) {
      outputs.querySelectorAll(".output-slot-status").forEach((node) => {
        node.textContent = "Ready";
      });
    }
  }, { runData: finished, finalEntry });

  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${outDir}/costest-complete-demo.png`,
  });

  console.log("Saved artifacts:");
  console.log(`${outDir}/costest-running-demo.png`);
  console.log(`${outDir}/costest-complete-demo.png`);
} finally {
  await browser.close();
}
