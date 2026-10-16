"""Rebuild and observe the unchanged product in dev/preview; temporary servers are cleaned."""
import json, os, signal, shutil, subprocess, tempfile, time, urllib.request
from pathlib import Path

repo = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parent
label = os.environ.get("P3_DIAGNOSTIC_LABEL", "baseline")
env = os.environ.copy()
env.update({"CI": "true", "TURBO_FORCE": "true"})
with (out / (label + "-build.txt")).open("w") as log:
    build = subprocess.run(["pnpm", "--filter", "@coding-cad/web...", "build"], cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT)
if build.returncode:
    raise RuntimeError("Source build failed; see diagnostic build output")

browser = r"""
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  await page.addInitScript(() => {
    window.__elkProbeResults = [];
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) => {
          if (data?.type === "result") window.__elkProbeResults.push(data.result);
        });
      }
    };
  });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await page.getByRole("heading", { name: "Problems" }).waitFor({ timeout: 15000 });
  const warnings = await page.getByRole("status").filter({ hasText: "Layout fallback:" }).allTextContents();
  await page.screenshot({ path: process.argv[1], fullPage: true });
  console.log(JSON.stringify({ mode: process.argv[2], warnings, pageErrors: errors, canvasNodes: await page.locator(".svelte-flow__node").count(), layouts: await page.evaluate(() => window.__elkProbeResults.map(result => ({ status: result.status, diagnostics: result.diagnostics, routedEdges: result.edges.filter(edge => edge.sections.length > 0).length }))) }, null, 2));
} finally { await browser.close(); }
"""
observations = []
for mode, command in [
    ("dev", ["pnpm", "dev", "--host", "127.0.0.1", "--port", "4173", "--strictPort"]),
    ("preview", ["pnpm", "exec", "vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"])
]:
    directory = tempfile.mkdtemp(prefix="coding-cad-elk-diagnostic-")
    hostenv = dict(env, CODING_CAD_WORKSPACE_ROOT=directory)
    with (out / (label + "-" + mode + "-server.txt")).open("w") as log:
        server = subprocess.Popen(command, cwd=repo / "apps/web", env=hostenv, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            for attempt in range(100):
                if server.poll() is not None:
                    raise RuntimeError(mode + " server exited")
                try:
                    urllib.request.urlopen("http://127.0.0.1:4173/", timeout=1)
                    break
                except Exception:
                    time.sleep(0.2)
            else:
                raise RuntimeError(mode + " server did not become ready")
            result = subprocess.run(["node", "--input-type=module", "-e", browser, str(out / (label + "-" + mode + ".png")), mode], cwd=repo / "apps/web", capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
            observation = json.loads(result.stdout)
            observations.append(observation)
            print(json.dumps(observation), flush=True)
        finally:
            try:
                os.killpg(server.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(server.pid, signal.SIGKILL)
                server.wait()
            shutil.rmtree(directory)
(out / (label + "-modes.json")).write_text(json.dumps(observations, indent=2) + "\n")
