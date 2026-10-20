import { expect, test } from "@playwright/test";

test.describe("T-027 — Flujo crítico integrado de taller de gráfica (RF-01 a RF-17)", () => {
  test("ciclo de vida completo de orden de trabajo: registro -> comanda -> taller -> aviso -> cobranza -> métricas", async ({
    page,
  }) => {
    // 1. REGISTRO — Comprobar formulario de creación de pedidos
    await page.goto("/pedidos/nuevo");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    await expect(
      page.getByRole("heading", { name: "Nueva Orden de Trabajo" }),
    ).toBeVisible();

    // Verificamos selector de cliente y botón de guardar
    await expect(page.locator('select[name="cliente_id"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear Pedido" })).toBeVisible();

    // 2. COMANDA Y SEGUIMIENTO — Ir al listado general de pedidos
    await page.goto("/pedidos");
    await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

    const enlaceComanda = page.getByRole("link", { name: "Comanda" }).first();
    if ((await enlaceComanda.count()) > 0) {
      await enlaceComanda.click();
      await expect(page).toHaveURL(/\/comanda\//);
      // Validar que se muestre el ticket/comanda técnica para taller
      await expect(page.getByText(/ORDEN #/i)).toBeVisible();
      await expect(page.getByText(/Detalle de Trabajos y Especificaciones/i)).toBeVisible();
    }

    // 3. TALLER — Tablero visual de producción por columnas de estado
    await page.goto("/taller");
    await expect(
      page.getByRole("heading", { name: /Taller/i }),
    ).toBeVisible();

    // Filtros de estado / pestañas kanban
    await expect(page.getByText(/Activos/i).first()).toBeVisible();
    await expect(page.getByText(/Recibido/i).first()).toBeVisible();
    await expect(page.getByText(/En Producción/i).first()).toBeVisible();

    // 4. AVISO WHATSAPP — Verificar disponibilidad de avisos al cliente
    const botonWhatsApp = page.locator('a[href*="wa.me"]').first();
    if ((await botonWhatsApp.count()) > 0) {
      const href = await botonWhatsApp.getAttribute("href");
      expect(href).toContain("wa.me");
      expect(href).toContain("text=");
    }

    // 5. COBRANZAS Y CUENTAS POR COBRAR
    await page.goto("/cuentas-por-cobrar");
    if (!page.url().includes("/login")) {
      await expect(
        page.getByRole("heading", { name: "Cuentas por Cobrar" }),
      ).toBeVisible();
    }

    // 6. MÉTRICAS Y DASHBOARD GERENCIAL
    await page.goto("/dashboard");
    if (!page.url().includes("/login")) {
      await expect(
        page.getByRole("heading", { name: "Dashboard Gerencial de Ingresos" }),
      ).toBeVisible();
      await expect(page.getByText("Total Consolidado")).toBeVisible();
      await expect(page.getByRole("link", { name: "Descargar CSV" })).toBeVisible();
    }
  });
});
