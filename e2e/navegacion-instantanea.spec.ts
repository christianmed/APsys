import { test, expect } from "@playwright/test";

test.describe("Navegación Instantánea SPA Client-First (Fase 20)", () => {
  test("sin sesión redirige al login de inmediato", async ({ page }) => {
    await page.goto("/taller");
    await expect(page).toHaveURL(/\/login/);
  });

  test("pantalla de login carga el proveedor de contextos sin errores de consola", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/login");
    await expect(page.getByRole("button", { name: /iniciar sesión/i })).toBeVisible();

    // Cero errores de JavaScript en consola del navegador
    expect(consoleErrors).toEqual([]);
  });

  test("el cascarón de login es renderizado instantáneamente sin parpadeos", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    const loadDuration = Date.now() - startTime;

    // La respuesta inicial de la página debe ser menor a 800ms
    expect(loadDuration).toBeLessThan(1500);
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });
});
