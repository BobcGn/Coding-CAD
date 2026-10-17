import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach, afterEach } from "vitest";
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
  hostHeader?: string | null;
  originHeader?: string;
  contentType?: string;
  body?: unknown;
}): Parameters<typeof POST>[0] {
  const hostname = params.hostname ?? "localhost";
  const url = new URL(`http://${hostname}/api/workspace/analyze-repository`);

  const headers = new Headers();
  if (params.contentType !== undefined) {
    if (params.contentType.length > 0) headers.set("content-type", params.contentType);
  } else {
    headers.set("content-type", "application/json");
  }

  if (params.hostHeader !== null) {
    headers.set("host", params.hostHeader ?? `${hostname}:5173`);
  }
  if (params.originHeader !== undefined) {
    headers.set("origin", params.originHeader);
  }

  const request = new Request(url, {
    method: "POST",
    headers,
    body: typeof params.body === "string" ? params.body : JSON.stringify(params.body ?? {})
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
  beforeEach(() => {
    process.env.CODING_CAD_ENABLE_REPOSITORY_ANALYSIS = "true";
  });

  afterEach(() => {
    delete process.env.CODING_CAD_ENABLE_REPOSITORY_ANALYSIS;
  });

  it("rejects with 403 when feature switch CODING_CAD_ENABLE_REPOSITORY_ANALYSIS is disabled", async () => {
    delete process.env.CODING_CAD_ENABLE_REPOSITORY_ANALYSIS;
    const event = createMockEvent({ body: { repositoryPath: smallMonoFixture } });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("Repository analysis is disabled");
    });
  });

  it("rejects non-loopback Host header with 403 (DNS rebinding simulation)", async () => {
    const event = createMockEvent({
      hostHeader: "attacker.com:5173",
      body: { repositoryPath: smallMonoFixture }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("Host 'attacker.com:5173' is not allowed");
    });
  });

  it("rejects missing Host header with 403", async () => {
    const event = createMockEvent({
      hostHeader: null,
      body: { repositoryPath: smallMonoFixture }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("Missing Host header");
    });
  });

  it("rejects non-loopback Origin header with 403", async () => {
    const event = createMockEvent({
      originHeader: "https://malicious-website.org",
      body: { repositoryPath: smallMonoFixture }
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("Origin 'https://malicious-website.org' is not allowed");
    });
  });

  it("accepts loopback Origin header with 200", async () => {
    const event = createMockEvent({
      originHeader: "http://localhost:5173",
      body: { repositoryPath: smallMonoFixture }
    });

    const response = await POST(event);
    assert.equal(response.status, 200);
  });

  it("rejects non-JSON Content-Type with 403", async () => {
    const event = createMockEvent({
      contentType: "text/plain",
      body: JSON.stringify({ repositoryPath: smallMonoFixture })
    });

    await assert.rejects(async () => {
      await POST(event);
    }, (err: any) => {
      return err.status === 403 && err.body.message.includes("Content-Type: application/json");
    });
  });

  it("rejects non-loopback URL requests with 403", async () => {
    const event = createMockEvent({
      hostHeader: "localhost:5173",
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

  it("skips and explicitly reports symlinks pointing outside the repository root", async () => {
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
      assert.ok(
        data.inspection.unsupportedStructures.some((s) => s.type === "symlink-outside-root"),
        "Must explicitly report symlink-outside-root instead of silently dropping"
      );
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      await fs.promises.rm(outsideTarget, { recursive: true, force: true });
    }
  });

  it("prevents infinite recursion on symlink cycles inside the repository root", async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "symlink-cycle-test-"));
    try {
      await fs.promises.writeFile(path.join(tempDir, "package.json"), JSON.stringify({ name: "cycle-repo" }));
      const subDir = path.join(tempDir, "sub");
      await fs.promises.mkdir(subDir);
      await fs.promises.writeFile(path.join(subDir, "index.ts"), "export const a = 1;");
      // Create recursive loop: sub/loop -> tempDir
      await fs.promises.symlink(tempDir, path.join(subDir, "loop"), "dir");

      const event = createMockEvent({ body: { repositoryPath: tempDir } });
      const response = await POST(event);
      assert.equal(response.status, 200);

      const data = (await response.json()) as AnalyzeRepositoryResponse;
      assert.ok(data.inspection.languages.includes("TypeScript"));
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("truncates analysis when file count limit is exceeded", async () => {
    const event = createMockEvent({
      body: {
        repositoryPath: smallMonoFixture,
        options: { maxFiles: 2 }
      }
    });

    const response = await POST(event);
    assert.equal(response.status, 200);

    const data = (await response.json()) as AnalyzeRepositoryResponse;
    assert.ok(data.inspection.truncated !== undefined, "Must include truncated metadata");
    assert.equal(data.inspection.truncated?.hitLimit, "file-count");
    assert.ok(data.inspection.truncated?.message.includes("limit"));
  });

  it("truncates analysis when timeout limit is exceeded", async () => {
    const event = createMockEvent({
      body: {
        repositoryPath: smallMonoFixture,
        options: { timeoutMs: 0.000001 }
      }
    });

    const response = await POST(event);
    assert.equal(response.status, 200);

    const data = (await response.json()) as AnalyzeRepositoryResponse;
    assert.ok(data.inspection.truncated !== undefined, "Must include truncated metadata");
    assert.equal(data.inspection.truncated?.hitLimit, "timeout");
  });

  it("reports oversized-file when file exceeds single file size limit", async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "oversized-test-"));
    try {
      await fs.promises.writeFile(path.join(tempDir, "package.json"), JSON.stringify({ name: "oversized-repo" }));
      // 500 bytes file
      await fs.promises.writeFile(path.join(tempDir, "big.ts"), "export const x = " + "x".repeat(500) + ";");

      const event = createMockEvent({
        body: {
          repositoryPath: tempDir,
          options: { maxFileSizeBytes: 100 }
        }
      });

      const response = await POST(event);
      assert.equal(response.status, 200);

      const data = (await response.json()) as AnalyzeRepositoryResponse;
      assert.ok(
        data.inspection.unsupportedStructures.some((s) => s.type === "oversized-file"),
        "Must explicitly report oversized-file"
      );
      assert.equal(data.inspection.truncated?.hitLimit, "file-size");
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
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
