import { expect } from "@playwright/test";
import { layoutSource, test } from "./layout-fixture.js";

test("requires ELK solver success with real routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
  const observed = await page.evaluate(() => window.__p3ObservedLayouts);
  expect(observed.length).toBeGreaterThan(0);
  const actual = observed.at(-1)!;
  expect(actual.result.status, JSON.stringify(actual.result.diagnostics)).toBe("success");
  expect(layoutSource(actual.result)).toBe("elk");
  expect(actual.result.edges.length).toBeGreaterThan(0);
  expect(actual.result.edges.every((edge) => edge.sections.length > 0)).toBe(true);
});
