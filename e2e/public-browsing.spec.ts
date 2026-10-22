import { expect, test } from "@playwright/test";

test("a visitor can open the public landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Khayargoli Family Tree/i);
  await expect(
    page.getByRole("heading", { name: /every branch has a story/i }),
  ).toBeVisible();
});

test("a visitor can open the privacy page", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page).toHaveTitle(/Privacy/i);
  await expect(
    page.getByRole("heading", { name: /sharing family information/i }),
  ).toBeVisible();
});
