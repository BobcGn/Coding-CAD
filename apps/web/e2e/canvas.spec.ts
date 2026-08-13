import { expect, test } from "@playwright/test";

test("loads a navigable architecture canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Architecture Canvas" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Architecture Canvas" })).toBeVisible();
  const gateway = page.getByText("API Gateway");
  await expect(gateway).toBeVisible();

  await gateway.click();
  await expect(page.getByText("Selected: gateway")).toBeVisible();

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

  const gatewayNode = page.locator(".svelte-flow__node").filter({ hasText: "API Gateway" });
  await gatewayNode.focus();
  await expect(gatewayNode).toBeFocused();
  const nodeTransform = (): Promise<string> => gatewayNode.evaluate((element) => (element as HTMLElement).style.transform);
  const generatedTransform = await nodeTransform();
  const nodeBox = await gatewayNode.boundingBox();
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
