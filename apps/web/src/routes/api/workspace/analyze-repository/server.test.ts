import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { AnalyzeRepositoryResponse } from "$lib/architecture/workspace/contract.js";
import { POST } from "./+server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../../../../..");
const smallMonoFixture = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/small-monorepo"
);
const edgeCasesFixture = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/edge-cases-repo"
);

function createMockEvent(params: {
  hostname?: string;
  body?: unknown;
}): Parameters<typeof POST>[0] {
  const hostname = params.hostname ?? "localhost";
  const url = new URL(`http://${hostname}/api/workspace/analyze-repository`);

  const request = new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.body ?? {})
  });

  return {
    request,
    url,
    params: {},
    locals: {},
    cookies: {} as any,
    fetch: globalThis.fetch,
    getClientAddress: () => "127.0.0.1",
    platform: undefined,
    route: { id: "/api/workspace/analyze-repository" },
    setHeaders: () => {},
    isDataRequest: false
  } as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/workspace/analyze-repository security and functionality", () => {
  it("rejects non-loopback requests with 403", async () => {
    const event = createMockEvent({
      hostname: "evil-attacker.com",
      body: { repositoryPath: smallMonoFixture }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("restricted to loopback");
    });
  });

  it("rejects missing or empty repositoryPath with 400", async () => {
    const event = createMockEvent({
      body: { repositoryPath: "   " }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 400 && err.body.message.includes("requires a non-empty repositoryPath");
    });
  });

  it("rejects non-existent directory with 400", async () => {
    const event = createMockEvent({
      body: { repositoryPath: path.join(smallMonoFixture, "non-existent-subpath") }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 400 && err.body.message.includes("does not exist");
    });
  });

  it("rejects file path that is not a directory with 400", async () => {
    const event = createMockEvent({
      body: { repositoryPath: path.join(smallMonoFixture, "package.json") }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 400 && err.body.message.includes("not a directory");
    });
  });

  it("successfully analyzes small-monorepo and returns browser-safe DTO without source code", async () => {
    const event = createMockEvent({
      body: { repositoryPath: smallMonoFixture }
    });

    const response = await POST(event);
    assert.equal(response.status, 200);

    const data = (await response.json()) as AnalyzeRepositoryResponse;
    assert.ok(typeof data.architectureJson === "string");

    const project = JSON.parse(data.architectureJson) as ArchitectureProject;
    assert.equal(project.version, "0.1");
    assert.equal(project.architecture.components.length, 3);
    assert.equal(project.architecture.connections.length, 3);

    // DTO Purity check: ensure no source code body is included
    const rawDtoStr = JSON.stringify(data);
    assert.ok(
      !rawDtoStr.includes("export class AuthService"),
      "DTO must not contain source code bodies"
    );
    assert.ok(
      !rawDtoStr.includes("return amount > 0"),
      "DTO must not contain function implementation logic"
    );

    // Inspection metadata check
    assert.deepEqual(data.inspection.languages, ["TypeScript"]);
    assert.ok(data.inspection.configFiles.includes("packages/auth/package.json"));
  });

  it("reports unsupported structures explicitly for edge-cases-repo", async () => {
    const event = createMockEvent({
      body: { repositoryPath: edgeCasesFixture }
    });

    const response = await POST(event);
    assert.equal(response.status, 200);

    const data = (await response.json()) as AnalyzeRepositoryResponse;
    assert.ok(
      data.inspection.unsupportedStructures.some(
        (s) => s.type === "unparseable-syntax" && s.scope.includes("broken.ts")
      ),
      "Must report unparseable-syntax explicitly without silent failure"
    );
  });

  it("rejects path containing '..' traversal with 400", async () => {
    const event = createMockEvent({
      body: { repositoryPath: smallMonoFixture + "/../small-single-repo" }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 400 && err.body.message.includes("must not contain traversal segments");
    });
  });

  it("does not follow symlinks pointing outside the repository root", async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "symlink-test-"));
    const outsideTarget = await fs.promises.mkdtemp(path.join(os.tmpdir(), "outside-target-"));
    try {
      await fs.promises.writeFile(path.join(outsideTarget, "secret.ts"), "export const secret = 1;");
      await fs.promises.writeFile(path.join(tempDir, "package.json"), JSON.stringify({ name: "symlink-repo" }));
      await fs.promises.symlink(outsideTarget, path.join(tempDir, "outside-link"), "dir");

      const event = createMockEvent({ body: { repositoryPath: tempDir } });
      const response = await POST(event);
      assert.equal(response.status, 200);

      const data = (await response.json()) as AnalyzeRepositoryResponse;
      assert.ok(!JSON.stringify(data).includes("secret.ts"));
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      await fs.promises.rm(outsideTarget, { recursive: true, force: true });
    }
  });

  it("ignores sensitive .env* files and default ignored directories", async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ignore-test-"));
    try {
      await fs.promises.writeFile(path.join(tempDir, "package.json"), JSON.stringify({ name: "ignore-repo" }));
      await fs.promises.writeFile(path.join(tempDir, ".env"), "SECRET_API_KEY=12345");
      await fs.promises.writeFile(path.join(tempDir, ".env.local"), "SECRET_API_KEY=67890");
      await fs.promises.mkdir(path.join(tempDir, "node_modules"));
      await fs.promises.writeFile(path.join(tempDir, "node_modules/dummy.ts"), "export const dummy = 1;");

      const event = createMockEvent({ body: { repositoryPath: tempDir } });
      const response = await POST(event);
      assert.equal(response.status, 200);

      const data = (await response.json()) as AnalyzeRepositoryResponse;
      const str = JSON.stringify(data);
      assert.ok(!str.includes(".env"));
      assert.ok(!str.includes("dummy.ts"));
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
