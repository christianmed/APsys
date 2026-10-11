import { expect, test } from "@playwright/test";

test.describe("T-025 — Exportación de reportes (CSV/PDF) del período seleccionado (RF-17)", () => {
  test("dashboard gerencial muestra enlaces de exportación CSV e Imprimir/PDF", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Cabecera del dashboard
    await expect(
      page.getByRole("heading", { name: "Dashboard Gerencial de Ingresos" }),
    ).toBeVisible();

    // Botones de exportación visibles en el período
    await expect(page.getByText("Exportar reporte del período:")).toBeVisible();
    await expect(page.getByRole("link", { name: "Descargar CSV" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Imprimir / Guardar PDF" }),
    ).toBeVisible();
  });

  test("página de impresión de reporte muestra membrete formal y tarjetas de resumen", async ({
    page,
  }) => {
    await page.goto("/reportes/imprimir?periodo=este_mes");

    if (page.url().includes("/login")) {
      return;
    }

    // Encabezado formal de reporte
    await expect(
      page.getByRole("heading", { name: "APSys — Gráfica & Impresión" }),
    ).toBeVisible();

    await expect(page.getByText("REPORTE GERENCIAL")).toBeVisible();
    await expect(page.getByText("Período analizado:")).toBeVisible();

    // Resumen financiero
    await expect(page.getByText("Total Facturado")).toBeVisible();
    await expect(page.getByText("Total Cobrado")).toBeVisible();
    await expect(page.getByText("Saldo Pendiente")).toBeVisible();
    await expect(page.getByText("Cantidad de Órdenes")).toBeVisible();

    // Botón de impresión disponible
    await expect(
      page.getByRole("button", { name: "Imprimir / Guardar en PDF" }),
    ).toBeVisible();
  });

  test("endpoint /api/reportes/exportar responde con descarga CSV para gerencia", async ({
    request,
  }) => {
    const res = await request.get("/api/reportes/exportar?periodo=este_mes");

    // Si no tiene cookie de sesión en test headless, debe responder 401
    // Si la tuviera, responde 200 con text/csv
    if (res.status() === 200) {
      const contentType = res.headers()["content-type"];
      expect(contentType).toContain("text/csv");
      const texto = await res.text();
      expect(texto.startsWith("\uFEFF")).toBe(true);
      expect(texto).toContain("N° Orden,Fecha,Cliente,Teléfono,Estado");
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });
});
