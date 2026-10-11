import { expect, test } from "@playwright/test";

test.describe("T-019 — Dashboard gerencial de ingresos por moneda y fechas (RF-11)", () => {
  test("página de dashboard carga con métricas consolidadas o restringe acceso a operarios", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Si tiene perfil operativo, debe ver el aviso de restricción gerencial (RF-18)
    const avisoRestringido = page.getByText("Acceso Reservado a Gerencia");
    if ((await avisoRestringido.count()) > 0) {
      await expect(avisoRestringido).toBeVisible();
      await expect(page.getByRole("link", { name: "Volver a Pedidos" })).toBeVisible();
      return;
    }

    // Si tiene perfil gerencial, debe ver el Dashboard completo con sus tarjetas
    await expect(
      page.getByRole("heading", { name: "Dashboard Gerencial de Ingresos" }),
    ).toBeVisible();

    // Métricas clave
    await expect(page.getByText("Total Consolidado")).toBeVisible();
    await expect(page.getByText("Recaudado en USD")).toBeVisible();
    await expect(page.getByText("Recaudado en Bs.")).toBeVisible();
    await expect(page.getByText("Total Cobros")).toBeVisible();

    // Botones de filtro de período
    await expect(page.getByRole("button", { name: "Hoy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Esta semana" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Este mes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Todo el histórico" })).toBeVisible();
  });

  test("navegación entre filtros de fecha actualiza la URL", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/login") || (await page.getByText("Acceso Reservado a Gerencia").count()) > 0) {
      return;
    }

    // Filtrar por 'Hoy'
    await page.getByRole("button", { name: "Hoy" }).click();
    await expect(page).toHaveURL(/preset=hoy/);

    // Filtrar por 'Esta semana'
    await page.getByRole("button", { name: "Esta semana" }).click();
    await expect(page).toHaveURL(/preset=esta_semana/);
  });
});
