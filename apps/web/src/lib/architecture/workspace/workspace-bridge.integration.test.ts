import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "vitest";
import { Workspace } from "@coding-cad/workspace";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";

/**
 * P3.1 Workspace host bridge integration tests.
 *
 * These exercise the Node-only Workspace operations that the SvelteKit server
 * routes forward: create, open, and save round-trips with snapshot version
 * progression. The server routes themselves are thin typed forwards over these
 * operations; the browser-safe contract is covered by contract.test.ts.
 *
 * P3.1 Workspace host bridge 集成测试：覆盖 server route 转发的 Node-only
 * Workspace 操作——create/open/save 往返与 snapshot 版本递增。server route 本身
 * 只是这些操作的薄 typed 转发层；browser-safe contract 由 contract.test.ts 覆盖。
 */

async function withTemporaryWorkspace(
  run: (directory: string) => Promise<void>
): Promise<void> {
  const directory = await mkdtemp(path.join(tmpdir(), "coding-cad-workspace-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("workspace host bridge round-trips (P3.1)", () => {
  it("create -> open restores the same architecture facts", async () => {
    await withTemporaryWorkspace(async (directory) => {
      const workspace = await Workspace.create(directory, pointsSystemFixture);
      const id = workspace.id;
      assert.equal(workspace.name, pointsSystemFixture.intent.name);
      assert.equal(workspace.latestVersion, 1);

      const reopened = await Workspace.open(directory);
      assert.equal(reopened.id, id);
      const restored = reopened.loadLatestArchitecture();
      assert.deepEqual(restored, pointsSystemFixture);
    });
  });

  it("saveSnapshot produces a new version while preserving prior snapshots", async () => {
    await withTemporaryWorkspace(async (directory) => {
      const created = await Workspace.create(directory, pointsSystemFixture);
      const workspace = await Workspace.open(directory);
      const snapshot = await workspace.saveSnapshot(pointsSystemFixture);
      assert.equal(snapshot.version, 2);
      assert.equal(workspace.latestVersion, 2);
      assert.equal(created.id, workspace.id);

      const version1 = workspace.getSnapshot(1);
      assert.deepEqual(version1.architecture, pointsSystemFixture);
    });
  });

  it("loadLatestArchitecture returns a defensive copy", async () => {
    await withTemporaryWorkspace(async (directory) => {
      await Workspace.create(directory, pointsSystemFixture);
      const workspace = await Workspace.open(directory);
      const first = workspace.loadLatestArchitecture();
      const second = workspace.loadLatestArchitecture();
      assert.notEqual(first, second);
      assert.deepEqual(first, second);
    });
  });
});

describe("workspace view state round-trips (P3.6)", () => {
  it("saveViewState persists independently of the IR snapshot", async () => {
    await withTemporaryWorkspace(async (directory) => {
      await Workspace.create(directory, pointsSystemFixture);
      const workspace = await Workspace.open(directory);
      assert.equal(workspace.loadViewState(), undefined);

      await workspace.saveViewState(JSON.stringify({ version: 1, direction: "LR", nodes: [], edges: [] }));
      const reopened = await Workspace.open(directory);
      assert.deepEqual(
        JSON.parse(reopened.loadViewState() ?? "null"),
        { version: 1, direction: "LR", nodes: [], edges: [] }
      );
      // The IR snapshot is untouched by view state writes.
      assert.deepEqual(reopened.loadLatestArchitecture(), pointsSystemFixture);
    });
  });

  it("architecture snapshot and view state are saved and read separately", async () => {
    await withTemporaryWorkspace(async (directory) => {
      const created = await Workspace.create(directory, pointsSystemFixture);
      await created.saveViewState(JSON.stringify({ version: 7 }));
      await created.saveSnapshot(pointsSystemFixture);

      const reopened = await Workspace.open(directory);
      assert.equal(reopened.latestVersion, 2);
      assert.equal(reopened.loadViewState(), JSON.stringify({ version: 7 }));
    });
  });
});
