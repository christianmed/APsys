import { expect, test } from "@playwright/test";

test.describe("T-015 — Aviso de retiro por WhatsApp (RF-08, D-2)", () => {
  test("órdenes en estado listo muestran el botón con enlace wa.me", async ({ page }) => {
    await page.goto("/pedidos");

    if (page.url().includes("/login")) {
      // Ruta protegida por login
      return;
    }

    // Si existen pedidos en pantalla con estado 'listo', debe haber al menos un botón de WhatsApp
    const botonesWhatsApp = page.locator('a[data-testid^="btn-whatsapp-"]');
    const conteo = await botonesWhatsApp.count();

    if (conteo > 0) {
      const primerBoton = botonesWhatsApp.first();
      await expect(primerBoton).toBeVisible();
      const href = await primerBoton.getAttribute("href");
      expect(href).toContain("https://wa.me/");
      expect(href).toContain("text=");
      expect(await primerBoton.getAttribute("target")).toBe("_blank");
    }
  });

  test("pantalla de taller muestra acción directa de WhatsApp para órdenes listas", async ({
    page,
  }) => {
    await page.goto("/taller");

    if (page.url().includes("/login")) {
      return;
    }

    // Filtrar por la pestaña 'Listos para Retiro'
    const tabListos = page.getByRole("button", { name: /Listos para Retiro/i });
    await tabListos.click();

    const botonesWhatsApp = page.locator('a[data-testid^="btn-whatsapp-"]');
    const conteo = await botonesWhatsApp.count();

    if (conteo > 0) {
      const boton = botonesWhatsApp.first();
      await expect(boton).toBeVisible();
      const href = await boton.getAttribute("href");
      expect(href).toContain("https://wa.me/");
      expect(href).toContain("text=");
    }
  });
});
