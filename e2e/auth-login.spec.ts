import { expect, test } from "@playwright/test";

const emailOperativo = process.env.TEST_USER_OPERATIVO_EMAIL;
const claveOperativo = process.env.TEST_USER_OPERATIVO_PASSWORD;

test("login operativo: entra, ve su rol y cierra sesión", async ({ page }) => {
  test.skip(
    !emailOperativo || !claveOperativo,
    "Faltan TEST_USER_OPERATIVO_* (.env.local): E2E de login omitido.",
  );

  await page.goto("/login");

  await page.getByLabel("Correo electrónico").fill(emailOperativo!);
  await page.getByLabel("Contraseña").fill(claveOperativo!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible();
  await expect(page.getByText(/Rol:/)).toContainText("operativo");

  await page.getByRole("button", { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});
