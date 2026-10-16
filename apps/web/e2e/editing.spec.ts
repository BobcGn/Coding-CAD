import { expect, test, type Page } from "@playwright/test";
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
