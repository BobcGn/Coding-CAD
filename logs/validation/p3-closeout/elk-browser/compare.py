"""Compare actual browser ELK and controlled timeout fallback without relaxing positive gates."""
import json, os, signal, shutil, subprocess, tempfile, time, urllib.request
from pathlib import Path

repo = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parent
env = dict(os.environ, CI="true", TURBO_FORCE="true")
with (out / "comparison-build.txt").open("w") as log:
    for command in [
        ["pnpm", "--filter", "@coding-cad/web...", "build"],
        ["pnpm", "--filter", "@coding-cad/web", "exec", "vite", "build", "--mode", "layout-acceptance"]
    ]:
        result = subprocess.run(command, cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode: raise RuntimeError("Comparison source build failed")

browser = r"""
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";
const js = ts.transpileModule(readFileSync("e2e/layout-metrics.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { measureLayout } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
  await page.goto("http://127.0.0.1:4173/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await page.getByRole("heading", { name: "Problems" }).waitFor();
  await page.waitForFunction(() => Boolean(window.__p3LayoutAcceptance));
  const rows = [];
  for (const name of ["workspace-default", "points-system"]) {
    const elk = await page.evaluate(name => window.__p3LayoutAcceptance.runFixture(name), name);
    const fallback = await page.evaluate(name => window.__p3LayoutAcceptance.compareFallback(name), name);
    const fallbackRepeated = await page.evaluate(name => window.__p3LayoutAcceptance.compareFallback(name), name);
    if (elk.first.result.status !== "success") throw Error("Positive ELK comparison must succeed");
    if (fallback.result.status !== "fallback" || fallback.result.diagnostics[0]?.code !== "LAYOUT_TIMEOUT") throw Error("Controlled fallback must be real timeout fallback");
    rows.push({
      fixture: name, mode: process.argv[2],
      elk: { status: elk.first.result.status, metrics: measureLayout(elk.first.projection.layoutGraph, elk.first.result),
        deterministic: JSON.stringify(elk.first.result) === JSON.stringify(elk.repeated.result),
        movement: elk.incremental.movement, appliedMode: elk.incremental.appliedMode },
      fallback: { status: fallback.result.status, diagnostics: fallback.result.diagnostics,
        metrics: measureLayout(fallback.projection.layoutGraph, fallback.result),
        deterministic: JSON.stringify(fallback.result) === JSON.stringify(fallbackRepeated.result),
        appliedMode: fallback.appliedMode, movement: fallback.movement ?? null },
      raw: { elk, fallback, fallbackRepeated }
    });
  }
  writeFileSync(process.argv[1], JSON.stringify(rows, null, 2) + "\n");
  console.log(JSON.stringify(rows.map(({ raw, ...summary }) => summary), null, 2));
} finally { await browser.close(); }
"""
for mode, command in [
    ("dev", ["pnpm", "dev", "--host", "127.0.0.1", "--port", "4173", "--strictPort"]),
    ("preview", ["pnpm", "exec", "vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"])
]:
    directory = tempfile.mkdtemp(prefix="coding-cad-elk-compare-")
    with (out / ("comparison-" + mode + "-server.txt")).open("w") as log:
        server = subprocess.Popen(command, cwd=repo / "apps/web", env=dict(env, CODING_CAD_WORKSPACE_ROOT=directory), stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            for attempt in range(100):
                if server.poll() is not None: raise RuntimeError("Comparison server exited")
                try:
                    urllib.request.urlopen("http://127.0.0.1:4173/", timeout=1)
                    break
                except Exception: time.sleep(.2)
            else: raise RuntimeError("Comparison server timeout")
            result = subprocess.run(["node", "--input-type=module", "-e", browser, str(out / ("comparison-" + mode + ".json")), mode], cwd=repo / "apps/web", capture_output=True, text=True)
            (out / ("comparison-" + mode + ".txt")).write_text(result.stdout + result.stderr)
            if result.returncode: raise RuntimeError(result.stdout + result.stderr)
            print(mode + " comparison saved", flush=True)
        finally:
            try: os.killpg(server.pid, signal.SIGTERM)
            except ProcessLookupError: pass
            try: server.wait(timeout=5)
            except subprocess.TimeoutExpired: os.killpg(server.pid, signal.SIGKILL); server.wait()
            shutil.rmtree(directory)
