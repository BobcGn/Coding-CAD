"""Verify the narrow security fix with fresh source and preserve earlier screenshots."""
import json, os, subprocess, time
from pathlib import Path
root=Path(__file__).resolve().parents[3]
out=Path(__file__).resolve().parent
env=dict(os.environ, CI="true", TURBO_FORCE="true")
old=root/"logs/validation/p3-closeout/elk-browser"
artifacts={p:p.read_bytes() for p in old.glob("quality-*") if p.suffix in [".json",".png"]}
rows=[]
try:
 for name,command in [
  ("03-frozen-install",["pnpm","install","--frozen-lockfile"]),
  ("04-source-build",["pnpm","build"]),
  ("05-security-audit",["pnpm","security:audit"]),
  ("06-audit-after",["pnpm","audit","--json"]),
  ("07-ci-verify",["pnpm","ci:verify"])
 ]:
  start=time.monotonic()
  with (out/(name+(".json" if name=="06-audit-after" else ".txt"))).open("w") as log:
   r=subprocess.run(command,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
  rows.append(dict(step=name,command=" ".join(command),exit=r.returncode,seconds=round(time.monotonic()-start,2),CI="true",TURBO_FORCE="true"))
  (out/"results.json").write_text(json.dumps(rows,indent=2)+"\n")
  print(json.dumps(rows[-1]),flush=True)
  # pnpm audit --json exits nonzero even for remaining below-gate low/moderate findings.
  if r.returncode and name!="06-audit-after": raise SystemExit(r.returncode)
finally:
 for p,data in artifacts.items():p.write_bytes(data)
