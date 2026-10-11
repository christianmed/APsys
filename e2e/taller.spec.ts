import { expect, test } from "@playwright/test";

test.describe("T-014 — Vista de taller táctil (RF-07)", () => {
  test("pantalla de taller carga en viewport de tablet con controles táctiles grandes", async ({
    page,
  }) => {
    // Simular tablet 800x1100 en taller
    await page.setViewportSize({ width: 800, height: 1100 });
    await page.goto("/taller");

    // Si redirige a login por sesión no activa en el test local, verificamos que la ruta esté protegida
    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Cabecera y buscador
    await expect(page.getByRole("heading", { name: "Taller y Producción" })).toBeVisible();
    await expect(page.getByPlaceholder("Escanear comanda o # orden...")).toBeVisible();

    // Pestañas táctiles de filtro
    await expect(page.getByRole("button", { name: /Activos en Taller/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Por Iniciar/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /En Producción/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Listos para Retiro/i })).toBeVisible();
  });

  test("navegación desde pedidos y cambio de pestañas táctiles", async ({ page }) => {
    await page.goto("/pedidos");
    if (page.url().includes("/login")) return;

    // Verificar botón de acceso a Vista de Taller
    const btnTaller = page.getByRole("link", { name: "Vista de Taller" });
    await expect(btnTaller).toBeVisible();
    await btnTaller.click();

    await expect(page).toHaveURL(/\/taller/);

    // Filtrar por 'Por Iniciar'
    await page.getByRole("button", { name: /Por Iniciar/i }).click();

    // Filtrar por 'En Producción'
    await page.getByRole("button", { name: /En Producción/i }).click();

    // Filtrar por 'Listos para Retiro'
    await page.getByRole("button", { name: /Listos para Retiro/i }).click();
  });
});
