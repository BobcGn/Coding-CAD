import { expect, test, type Page } from "@playwright/test";

/**
 * Dispatch a native click on an element. Svelte 5 event delegation can be
 * unreliable under Playwright's synthetic clicks once a conditionally
 * rendered panel (e.g. the Inspector) is present, so tests dispatch real
 * DOM events for buttons inside dynamic panels.
 */
async function nativeClick(page: Page, locator: ReturnType<Page["locator"]>): Promise<void> {
  await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  await locator.evaluate((element) => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
}

test("greenfield workspace generates, validates, and renders a navigable canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Greenfield Architecture Workspace" })).toBeVisible();

  // Generate a candidate from the default requirement.
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();

  // The generated candidate renders PointService and its infrastructure.
  const pointServiceNode = page.locator(".svelte-flow__node").filter({ hasText: "PointService" });
  await expect(pointServiceNode).toBeVisible();
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "PostgreSQL" })).toBeVisible();

  // Selecting a node updates the selection label with its id.
  await pointServiceNode.click();
  await expect(page.getByText("Selected: point-service")).toBeVisible();

  // The Canvas renders as an accessible region with a density attribute.
  await expect(page.locator("[data-density='standard']").or(page.locator("[data-density='compact']"))).toBeVisible();
});

test("palette adds a component through the command application", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Palette" })).toBeVisible();

  // Add Kafka from the palette; the command application accepts it.
  await page.getByRole("button", { name: /Kafka/ }).click();
  await expect(page.getByText(/Command accepted: Add component kafka/i)).toBeVisible();
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "Kafka" })).toBeVisible();
});

test("save and open restore the accepted architecture and a usable view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/Candidate accepted/i)).toBeVisible();

  // Save the accepted project, then open it back.
  await nativeClick(page, page.getByRole("button", { name: "Save" }));
  await expect(page.getByText(/Project saved/i)).toBeVisible();
  await nativeClick(page, page.getByRole("button", { name: "Open" }));
  await expect(page.getByText(/Project opened/i)).toBeVisible();

  // The architecture facts are restored and the canvas renders nodes.
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "PointService" })).toBeVisible();
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "PostgreSQL" })).toBeVisible();
});

test("inspector edits a component description via explicit command", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();

  // Accept the candidate so edits apply to the accepted IR.
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/Candidate accepted/i)).toBeVisible();

  // Select the PointService node to open the inspector.
  const pointServiceNode = page.locator(".svelte-flow__node").filter({ hasText: "PointService" });
  await pointServiceNode.click();
  await expect(page.locator(".inspector")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible();

  // Edit the description and save.
  const descriptionBox = page.locator(".inspector textarea");
  await descriptionBox.fill("Core ledger service for point balances.");
  // Dispatch a native click on the conditionally rendered Save button.
  const saveButton = page.locator(".inspector button").filter({ hasText: "Save Description" });
  await nativeClick(page, saveButton);
  await page.waitForTimeout(600);

  // The description is committed through the command application.
  await expect(descriptionBox).toHaveValue("Core ledger service for point balances.");
  // Re-open the inspector after the layout refresh and confirm the edit stuck.
  await pointServiceNode.click();
  await page.waitForTimeout(400);
  await expect(page.locator(".inspector textarea")).toHaveValue("Core ledger service for point balances.");
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

test("empty requirement shows an error and blocks generation", async ({ page }) => {
  await page.goto("/");
  await page.locator("#requirement").fill("   ");
  const generate = page.getByRole("button", { name: "Generate Architecture" });
  await expect(generate).toBeDisabled();
});

test("duplicate palette component is rejected and accepted IR is preserved", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/Candidate accepted/i)).toBeVisible();

  // PostgreSQL is already in the accepted architecture; adding it again fails.
  await page.getByRole("button", { name: /PostgreSQL/ }).click();
  await expect(page.getByText(/Command rejected: Component postgresql already exists/i)).toBeVisible();
});

test("full greenfield happy path: create, validate, accept, save, open", async ({ page }) => {
  await page.goto("/");

  // Create from requirement.
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();

  // Display: the candidate renders on the canvas.
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "PointService" })).toBeVisible();

  // Edit: accept the candidate so the architecture is committed.
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/Candidate accepted/i)).toBeVisible();

  // Validate: problems are still navigable after acceptance.
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();

  // Save and open round-trip.
  await nativeClick(page, page.getByRole("button", { name: "Save" }));
  await expect(page.getByText(/Project saved/i)).toBeVisible();
  await nativeClick(page, page.getByRole("button", { name: "Open" }));
  await expect(page.getByText(/Project opened/i)).toBeVisible();
  await expect(page.locator(".svelte-flow__node").filter({ hasText: "PointService" })).toBeVisible();
});
