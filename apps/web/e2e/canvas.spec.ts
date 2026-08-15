import { expect, test } from "@playwright/test";

test("greenfield workspace generates, validates, and renders a navigable canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Greenfield Architecture Workspace" })).toBeVisible();

  // Generate a candidate from the default requirement.
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();

  // The generated candidate renders PointService and its infrastructure.
  const pointService = page.getByText("PointService");
  await expect(pointService).toBeVisible();
  await expect(page.getByText("PostgreSQL")).toBeVisible();

  // Selecting a node updates the selection label with its id.
  const pointServiceNode = page.locator(".svelte-flow__node").filter({ hasText: "PointService" });
  await pointServiceNode.click();
  await expect(page.getByText("Selected: point-service")).toBeVisible();

  const viewport = page.locator(".svelte-flow__viewport");
  const initialTransform = await viewport.getAttribute("style");
  await page.getByRole("button", { name: /zoom in/i }).click();
  await expect.poll(() => viewport.getAttribute("style")).not.toBe(initialTransform);

  const zoomedTransform = await viewport.getAttribute("style");
  const pane = page.locator(".svelte-flow__pane");
  const box = await pane.boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 65, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(() => viewport.getAttribute("style")).not.toBe(zoomedTransform);

  await pointServiceNode.focus();
  await expect(pointServiceNode).toBeFocused();
  const nodeTransform = (): Promise<string> => pointServiceNode.evaluate((element) => (element as HTMLElement).style.transform);
  const generatedTransform = await nodeTransform();
  const nodeBox = await pointServiceNode.boundingBox();
  expect(nodeBox).not.toBeNull();
  if (nodeBox !== null) {
    await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(nodeBox.x + nodeBox.width / 2 + 80, nodeBox.y + nodeBox.height / 2 + 40, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(nodeTransform).not.toBe(generatedTransform);
  await page.getByRole("button", { name: "Auto Layout" }).click();
  await expect.poll(nodeTransform).toBe(generatedTransform);

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: /zoom out/i }).click();
  }
  await expect(page.getByRole("region", { name: "Architecture Canvas" })).toHaveAttribute("data-density", "compact");
});

test("validation problems navigate to the affected component", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();

  // Problems reference the Redis limitation; clicking the link selects the node.
  const redisProblem = page.getByRole("listitem").filter({ hasText: "Redis should not be used as primary storage" });
  await expect(redisProblem).toBeVisible();
  await redisProblem.getByRole("button", { name: "redis" }).click();
  await expect(page.getByText("Selected: redis")).toBeVisible();
});

test("rejecting a candidate keeps the accepted architecture and clears review", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();

  await page.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText(/rejected; accepted IR unchanged/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toBeHidden();
});
