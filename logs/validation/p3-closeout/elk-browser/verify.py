"""Run the requested ordered gates against source in a writable environment."""
import json, os, subprocess, time
from pathlib import Path
repo = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parent / "verification"
out.mkdir(exist_ok=True)
env = dict(os.environ, CI="true", TURBO_FORCE="true")
commands = [
 ("01-install", ["pnpm", "install"]),
 ("02-build", ["pnpm", "build"]),
 ("03-typecheck", ["pnpm", "typecheck"]),
 ("04-test", ["pnpm", "test"]),
 ("05-web-unit", ["pnpm", "--filter", "@coding-cad/web", "test:unit"]),
 ("06-web-integration", ["pnpm", "--filter", "@coding-cad/web", "test:integration"]),
 ("07-browser", ["pnpm", "--filter", "@coding-cad/web", "test:e2e"]),
 ("08-ci", ["pnpm", "ci:verify"])
]
rows = []
for name, command in commands:
 started = time.monotonic()
 with (out / (name + ".txt")).open("w") as log:
  completed = subprocess.run(command, cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT)
 row = dict(step=name, command=" ".join(command), exitCode=completed.returncode,
            seconds=round(time.monotonic()-started, 2), log=name+".txt",
            environment={"CI":"true","TURBO_FORCE":"true"},
            failureCategory=None if completed.returncode == 0 else "unclassified; inspect raw log")
 rows.append(row)
 (out / "results.json").write_text(json.dumps(rows, indent=2)+"\n")
 print(json.dumps(row), flush=True)
if any(row["exitCode"] for row in rows): raise SystemExit(1)
