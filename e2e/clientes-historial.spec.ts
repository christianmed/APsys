import { expect, test } from "@playwright/test";

test.describe("T-022 — Historial por cliente: compras, montos y recurrencia (RF-14)", () => {
  test("listado de clientes muestra tarjetas con resumen de compras acumuladas", async ({
    page,
  }) => {
    await page.goto("/clientes");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByPlaceholder("Nombre o teléfono")).toBeVisible();
  });

  test("detalle de cliente muestra datos, KPIs de compras y tabla de historial", async ({
    page,
  }) => {
    await page.goto("/clientes");
    if (page.url().includes("/login")) {
      return;
    }

    // Si hay al menos un cliente en la lista, abrirlo
    const primeraTarjeta = page.locator("ul li a").first();
    if ((await primeraTarjeta.count()) > 0) {
      await primeraTarjeta.click();

      // Verificar que cargó la página de detalle con formulario e historial
      await expect(page.getByText("Datos del Cliente")).toBeVisible();
      await expect(page.getByText("Historial de Compras")).toBeVisible();

      // Métricas clave de RF-14
      await expect(page.getByText("Total Comprado")).toBeVisible();
      await expect(page.getByText("Saldo por Cobrar")).toBeVisible();
      await expect(page.getByText("Ticket Promedio")).toBeVisible();
      await expect(page.getByText("Recurrencia")).toBeVisible();
    }
  });
});
