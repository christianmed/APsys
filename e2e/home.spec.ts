import { expect, test } from "@playwright/test";

test("sin sesión, la raíz redirige al login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle(/APSys/);
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /iniciar sesión/i }),
  ).toBeVisible();
});
