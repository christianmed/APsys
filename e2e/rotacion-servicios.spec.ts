import { expect, test } from "@playwright/test";

test.describe("T-021 — Métricas de rotación por servicio (RF-13)", () => {
  test("página de rotación carga con KPIs, barras y ranking o bloquea a operarios", async ({
    page,
  }) => {
    await page.goto("/dashboard/rotacion");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Si tiene perfil operativo, debe ver aviso de restricción (RF-18 / RF-19)
    const avisoRestringido = page.getByText("Acceso Reservado a Gerencia");
    if ((await avisoRestringido.count()) > 0) {
      await expect(avisoRestringido).toBeVisible();
      await expect(page.getByRole("link", { name: "Volver a Pedidos" })).toBeVisible();
      return;
    }

    // Si es gerencial, verificar componentes de la vista
    await expect(
      page.getByRole("heading", { name: "Rotación y Demanda por Servicio" }),
    ).toBeVisible();

    // Métricas clave
    await expect(page.getByText("Mayor Facturación")).toBeVisible();
    await expect(page.getByText("Mayor Demanda (Piezas)")).toBeVisible();
    await expect(page.getByText("Total Facturado")).toBeVisible();
    await expect(page.getByText("Unidades Producidas")).toBeVisible();

    // Sección de gráfico/participación
    await expect(
      page.getByText("Participación de Facturación por Servicio"),
    ).toBeVisible();

    // Selector de orden
    await expect(page.getByText("Ordenar por:")).toBeVisible();

    // Tabla de ranking
    await expect(page.getByRole("heading", { name: /Ranking de Servicios/ })).toBeVisible();
  });

  test("filtro por período actualiza la URL y recarga métricas", async ({ page }) => {
    await page.goto("/dashboard/rotacion");
    if (page.url().includes("/login") || (await page.getByText("Acceso Reservado a Gerencia").count()) > 0) {
      return;
    }

    // Clic en 'Esta semana'
    await page.getByRole("button", { name: "Esta semana" }).click();
    await expect(page).toHaveURL(/preset=esta_semana/);

    // Clic en 'Este mes'
    await page.getByRole("button", { name: "Este mes" }).click();
    await expect(page).toHaveURL(/preset=este_mes/);
  });
});
