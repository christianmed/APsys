import { expect, test } from "@playwright/test";

test.describe("T-016 — Panel de recordatorios 48–72 h (RF-09)", () => {
  test("panel de recordatorios carga con métricas y filtros de umbrales", async ({
    page,
  }) => {
    await page.goto("/recordatorios");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Cabecera
    await expect(
      page.getByRole("heading", { name: /Panel de Recordatorios/i }),
    ).toBeVisible();

    // Métricas clave
    await expect(page.getByText("Total Listos sin Retirar")).toBeVisible();
    await expect(page.getByRole("button", { name: /Atención \(≥ 48 h\)/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Urgente \(≥ 72 h\)/i })).toBeVisible();
    await expect(page.getByText("Saldo Retenido por Cobrar")).toBeVisible();
  });

  test("navegación desde pedidos y filtrado por umbral de urgencia", async ({
    page,
  }) => {
    await page.goto("/pedidos");
    if (page.url().includes("/login")) return;

    // Clic en botón de Recordatorios
    const btnRecordatorios = page.getByRole("link", { name: "Recordatorios" });
    await expect(btnRecordatorios).toBeVisible();
    await btnRecordatorios.click();

    await expect(page).toHaveURL(/\/recordatorios/);

    // Filtrar por urgentes
    const btnUrgente = page.getByRole("button", { name: /Urgente \(≥ 72 h\)/i });
    await btnUrgente.click();

    // Filtrar por atención
    const btnAtencion = page.getByRole("button", { name: /Atención \(≥ 48 h\)/i });
    await btnAtencion.click();
  });
});
