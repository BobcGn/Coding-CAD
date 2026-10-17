import { expect, type Page } from "@playwright/test";
import { test } from "./layout-fixture.js";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";

test.describe.configure({ mode: "serial" });

async function generate(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await approve(page);
}

async function approve(page: Page) {
  await page.getByLabel("Review rationale").fill("Reviewed the architecture change.");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByText("Candidate accepted.", { exact: true })).toBeVisible();
}

async function saveFacts(page: Page): Promise<ArchitectureProject> {
  const saved = page.waitForResponse((response) =>
    response.url().includes("/api/workspace/") && response.request().method() === "PUT" && response.ok());
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const response = await saved;
  const sent = JSON.parse(response.request().postDataJSON().architectureJson) as ArchitectureProject;
  const reopened = await page.request.get(response.url());
  expect(reopened.ok()).toBe(true);
  const facts = JSON.parse((await reopened.json()).architectureJson) as ArchitectureProject;
  expect(facts).toEqual(sent);
  return facts;
}

async function reopenFacts(page: Page): Promise<ArchitectureProject> {
  const opened = page.waitForResponse((response) =>
    response.url().includes("/api/workspace/") && response.request().method() === "GET" && response.ok());
  await page.getByRole("button", { name: "Open", exact: true }).click();
  const facts = JSON.parse((await (await opened).json()).architectureJson) as ArchitectureProject;
  await expect(page.getByText(/Project opened:/)).toBeVisible();
  return facts;
}

async function connect(page: Page, to: string) {
  await page.getByLabel("Connection id", { exact: true }).fill("reviewed-edge");
  await page.getByLabel("Source component id").fill("point-service");
  await page.getByLabel("Target component id").fill(to);
  await page.getByLabel("Connection protocol").fill("MESSAGE");
  await page.getByRole("button", { name: "Connect components", exact: true }).click();
}

test("successful removal cascades incident edges and survives Save/Open", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await page.getByLabel("Component to remove").fill("redis");
  await expect(page.getByText(/also removes .* connected edge/)).toBeVisible();
  await page.getByLabel("Confirm cascade removal").check();
  await page.getByRole("button", { name: "Remove component", exact: true }).click();
  expect(await saveFacts(page)).toEqual(before);
  await approve(page);
  const after = await saveFacts(page);
  expect(after.architecture.components).toEqual(before.architecture.components.filter((node) => node.id !== "redis"));
  expect(after.architecture.connections).toEqual(before.architecture.connections.filter((edge) => edge.from !== "redis" && edge.to !== "redis"));
  expect(await reopenFacts(page)).toEqual(after);
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "Redis" })).toHaveCount(0);
});

test("removal without cascade confirmation is blocked and facts are unchanged", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await page.getByLabel("Component to remove").fill("redis");
  await page.getByRole("button", { name: "Remove component", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Confirm cascade removal");
  expect(await saveFacts(page)).toEqual(before);
  expect(await reopenFacts(page)).toEqual(before);
});

test("missing-component removal is blocked by existing command semantics", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await page.getByLabel("Component to remove").fill("missing");
  await page.getByRole("button", { name: "Remove component", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("does not exist");
  expect(await saveFacts(page)).toEqual(before);
});

test("successful connection waits for approval and survives Save/Open", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await connect(page, "redis");
  expect(await saveFacts(page)).toEqual(before);
  await approve(page);
  const after = await saveFacts(page);
  expect(after.architecture.components).toEqual(before.architecture.components);
  expect(after.architecture.connections).toEqual([...before.architecture.connections, {
    id: "reviewed-edge", from: "point-service", to: "redis", protocol: "MESSAGE"
  }]);
  expect(await reopenFacts(page)).toEqual(after);
});

test("invalid connection appears in Problems and cannot enter accepted architecture", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await connect(page, "missing");
  await expect(page.getByText("Connection reviewed-edge has an unknown target component", { exact: true })).toBeVisible();
  await page.getByLabel("Review rationale").fill("Try invalid connection");
  await expect(page.getByRole("button", { name: "Accept", exact: true })).toBeDisabled();
  expect(await saveFacts(page)).toEqual(before);
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  expect(await saveFacts(page)).toEqual(before);
  expect(await reopenFacts(page)).toEqual(before);
});

test("Inspector contract add/remove use Review and preserve schema through Save/Open", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await page.locator(".svelte-flow__node").filter({ hasText: "PointService" }).click();
  await page.getByLabel("Contract name", { exact: true }).fill("GetBalance");
  await page.getByLabel("Contract protocol", { exact: true }).selectOption("REST");
  await page.getByRole("button", { name: "Add contract", exact: true }).click();
  expect(await saveFacts(page)).toEqual(before);
  await approve(page);
  const added = await saveFacts(page);
  const component = added.architecture.components.find((node) => node.id === "point-service")!;
  expect(component.contracts).toContainEqual({ name: "GetBalance", protocol: "REST" });
  expect(await reopenFacts(page)).toEqual(added);
  await page.locator(".svelte-flow__node").filter({ hasText: "PointService" }).click();
  await page.getByRole("button", { name: "Remove contract GetBalance", exact: true }).click();
  expect(await saveFacts(page)).toEqual(added);
  await approve(page);
  const removed = await saveFacts(page);
  expect(removed.architecture.components.find((node) => node.id === "point-service")?.contracts ?? []).not.toContainEqual({ name: "GetBalance", protocol: "REST" });
  expect(await reopenFacts(page)).toEqual(removed);
});

test("Inspector type, capability and limitation controls use explicit review", async ({ page }) => {
  await generate(page);
  const node = page.locator(".svelte-flow__node").filter({ hasText: "PointService" });
  await node.click();
  await page.getByLabel("Component type", { exact: true }).selectOption("gateway");
  await approve(page);
  expect((await saveFacts(page)).architecture.components.find((entry) => entry.id === "point-service")?.type).toBe("gateway");
  await node.click();
  await page.getByPlaceholder("capability", { exact: true }).fill("rate-limiting");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await approve(page);
  expect((await saveFacts(page)).architecture.components.find((entry) => entry.id === "point-service")?.capabilities).toContain("rate-limiting");
  await node.click();
  await page.locator(".inspector li").filter({ hasText: "rate-limiting" }).getByRole("button", { name: "Remove capability" }).click();
  await approve(page);
  expect((await saveFacts(page)).architecture.components.find((entry) => entry.id === "point-service")?.capabilities).not.toContain("rate-limiting");
  await node.click();
  await page.getByLabel("New limitation", { exact: true }).fill("no-batch-writes");
  await page.getByRole("button", { name: "Add limitation", exact: true }).click();
  await approve(page);
  const facts = await saveFacts(page);
  expect(facts.architecture.components.find((entry) => entry.id === "point-service")?.limitations).toContain("no-batch-writes");
  expect(await reopenFacts(page)).toEqual(facts);
});

test("save and open failures remain visible and a retry preserves architecture", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  await page.route("**/api/workspace/**", (route) => route.fulfill({ status: 503, body: "Storage unavailable" }));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("503");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("503");
  await page.unroute("**/api/workspace/**");
  expect(await saveFacts(page)).toEqual(before);
  expect(await reopenFacts(page)).toEqual(before);
});

test("Add component renders Ghost node with badge, dashed border, zero overlap and stable formal nodes", async ({ page }) => {
  await generate(page);
  const pointServiceBefore = await page.locator(".svelte-flow__node").filter({ hasText: "PointService" }).boundingBox();
  expect(pointServiceBefore).not.toBeNull();

  // Add component from palette
  await page.locator("button.palette-item").filter({ hasText: "Kafka" }).click();

  // Ghost node is visible with badge and accessible label
  const ghostNode = page.locator(".svelte-flow__node article[data-ghost='true']");
  await expect(ghostNode).toBeVisible();
  await expect(ghostNode.getByTestId("ghost-badge")).toHaveText(/待审批 \/ Proposed/);
  await expect(ghostNode).toHaveAttribute("aria-label", /待审批 \/ Proposed/);

  // Formal node position remains stable (no displacement)
  const pointServiceAfter = await page.locator(".svelte-flow__node").filter({ hasText: "PointService" }).boundingBox();
  expect(pointServiceAfter?.x).toBeCloseTo(pointServiceBefore!.x, 1);
  expect(pointServiceAfter?.y).toBeCloseTo(pointServiceBefore!.y, 1);

  // Geometric zero-overlap between Ghost and formal node
  const ghostBox = await ghostNode.boundingBox();
  expect(ghostBox).not.toBeNull();
  const overlaps = (
    ghostBox!.x < pointServiceAfter!.x + pointServiceAfter!.width &&
    ghostBox!.x + ghostBox!.width > pointServiceAfter!.x &&
    ghostBox!.y < pointServiceAfter!.y + pointServiceAfter!.height &&
    ghostBox!.y + ghostBox!.height > pointServiceAfter!.y
  );
  expect(overlaps).toBe(false);

  // Rejecting proposal removes Ghost node immediately
  await page.getByLabel("Review rationale").fill("Reject ghost addition");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);
});

test("Remove component marks formal node with [待删除 / Pending Deletion] without mutating formal IR", async ({ page }) => {
  await generate(page);
  await page.getByLabel("Component to remove").fill("redis");
  await page.getByLabel("Confirm cascade removal").check();
  await page.getByRole("button", { name: "Remove component", exact: true }).click();

  // Marked with pending deletion in view layer
  const redisNode = page.locator(".svelte-flow__node article[data-ghost-status='pending-deletion']");
  await expect(redisNode).toBeVisible();
  await expect(redisNode.getByTestId("ghost-badge")).toHaveText(/待删除 \/ Pending Deletion/);

  // Formal architecture before accept still contains redis
  const facts = await saveFacts(page);
  expect(facts.architecture.components.some((c) => c.id === "redis")).toBe(true);

  // Rejecting clears the marker
  await page.getByLabel("Review rationale").fill("Reject deletion");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.locator(".svelte-flow__node article[data-ghost-status='pending-deletion']")).toHaveCount(0);
});

test("Inspector edit marks formal node with [待变更 / Pending Change]", async ({ page }) => {
  await generate(page);
  const node = page.locator(".svelte-flow__node").filter({ hasText: "PointService" });
  await node.click();
  await page.getByLabel("Component type", { exact: true }).selectOption("gateway");

  // Marked with pending change badge
  const pendingNode = page.locator(".svelte-flow__node article[data-ghost-status='pending-change']");
  await expect(pendingNode).toBeVisible();
  await expect(pendingNode.getByTestId("ghost-badge")).toHaveText(/待变更 \/ Pending Change/);

  // Reject clears marker
  await page.getByLabel("Review rationale").fill("Keep original type");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.locator(".svelte-flow__node article[data-ghost-status='pending-change']")).toHaveCount(0);
});

test("Create Ghost -> Accept -> formal node appears and Ghost projection disappears", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);
  expect(before.architecture.components.some((c) => c.name.toLowerCase().includes("kafka"))).toBe(false);

  // Create Ghost
  await page.locator("button.palette-item").filter({ hasText: "Kafka" }).click();
  const ghostNode = page.locator(".svelte-flow__node article[data-ghost='true']");
  await expect(ghostNode).toBeVisible();

  // Accept proposal
  await page.getByLabel("Review rationale").fill("Approve adding Kafka component");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByText("Candidate accepted.", { exact: true })).toBeVisible();

  // Ghost projection disappears
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);

  // Formal node now exists on canvas
  const formalKafkaNode = page.locator(".svelte-flow__node").filter({ hasText: "Kafka" });
  await expect(formalKafkaNode).toBeVisible();
  await expect(formalKafkaNode.locator("article[data-ghost='true']")).toHaveCount(0);

  // Formal architecture persisted facts now contain Kafka
  const after = await saveFacts(page);
  expect(after.architecture.components.some((c) => c.name.toLowerCase().includes("kafka"))).toBe(true);
});

test("Create Ghost -> Reject -> Ghost disappears immediately and formal architecture unchanged", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);

  // Create Ghost
  await page.locator("button.palette-item").filter({ hasText: "Kafka" }).click();
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toBeVisible();

  // Reject proposal
  await page.getByLabel("Review rationale").fill("Reject Kafka addition");
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  // Ghost disappears immediately
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "Kafka" })).toHaveCount(0);

  // Formal architecture unchanged
  const after = await saveFacts(page);
  expect(after).toEqual(before);
});

test("Stale proposal: formal architecture changes externally -> Accept disabled with stale warning -> Reject clears stale proposal", async ({ page }) => {
  await generate(page);
  const before = await saveFacts(page);

  // Create Ghost
  await page.locator("button.palette-item").filter({ hasText: "Kafka" }).click();
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toBeVisible();

  // Fill review rationale
  await page.getByLabel("Review rationale").fill("Try to review while formal architecture changes");
  await expect(page.getByRole("button", { name: "Accept", exact: true })).toBeEnabled();

  // Simulate external formal architecture update via custom event
  const updatedProject = structuredClone(before);
  updatedProject.intent.description = "Updated externally";
  await page.evaluate((project) => {
    window.dispatchEvent(new CustomEvent("coding-cad:external-architecture-change", { detail: project }));
  }, updatedProject);

  // Stale proposal warning appears
  await expect(page.getByTestId("stale-proposal-warning")).toBeVisible();
  await expect(page.getByTestId("stale-proposal-warning")).toHaveText(/正式架构已变化，提案已失效，请重新提议。|Formal architecture has changed/);

  // Accept button is DISABLED
  await expect(page.getByRole("button", { name: "Accept", exact: true })).toBeDisabled();

  // Reject button is ENABLED to clean up
  await expect(page.getByRole("button", { name: "Reject", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  // Stale warning and ghost disappear
  await expect(page.getByTestId("stale-proposal-warning")).toHaveCount(0);
  await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);

  // Formal architecture remains the updated project
  const facts = await saveFacts(page);
  expect(facts.intent.description).toBe("Updated externally");
  expect(facts.architecture.components.some((c) => c.name.toLowerCase().includes("kafka"))).toBe(false);
});

