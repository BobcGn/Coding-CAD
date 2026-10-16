import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";

export default function setup() {
  const root = process.env.CODING_CAD_E2E_WORKSPACE_ROOT;
  return async () => {
    if (root && resolve(root).startsWith(resolve(tmpdir()) + "/") && basename(root).startsWith("coding-cad-p3-e2e-")) {
      await rm(root, { recursive: true, force: true });
    }
  };
}
