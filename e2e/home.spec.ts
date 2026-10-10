import { expect, test } from "@playwright/test";

test("la página principal carga con el contenido inicial", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/APSys/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
