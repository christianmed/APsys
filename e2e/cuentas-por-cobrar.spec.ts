import { expect, test } from "@playwright/test";

test.describe("T-020 — Cuentas por cobrar: vista consolidada de saldos pendientes y antigüedad (RF-12)", () => {
  test("página de cuentas por cobrar carga con métricas de cartera o restringe a operarios", async ({
    page,
  }) => {
    await page.goto("/cuentas-por-cobrar");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Si tiene perfil operativo, debe ver el aviso de restricción gerencial (RF-18 / RF-19)
    const avisoRestringido = page.getByText("Acceso Reservado a Gerencia");
    if ((await avisoRestringido.count()) > 0) {
      await expect(avisoRestringido).toBeVisible();
      await expect(page.getByRole("link", { name: "Volver a Pedidos" })).toBeVisible();
      return;
    }

    // Si tiene perfil gerencial, debe ver Cuentas por Cobrar completo
    await expect(
      page.getByRole("heading", { name: "Cuentas por Cobrar" }),
    ).toBeVisible();

    // Métricas clave de cartera
    await expect(page.getByText("Total por Cobrar (USD)")).toBeVisible();
    await expect(page.getByText("Equivalente en Bolívares")).toBeVisible();
    await expect(page.getByText("Clientes con Saldo")).toBeVisible();

    // Sección de antigüedad (Aging)
    await expect(
      page.getByText("Antigüedad de la Cartera por Cobrar (Aging)"),
    ).toBeVisible();

    // Filtros de tramos
    await expect(page.getByRole("button", { name: /Todos/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /0 a 7 días/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /8 a 15 días/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /16 a 30 días/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Más de 30 días/ })).toBeVisible();

    // Campo de búsqueda y selector de orden
    await expect(page.getByPlaceholder("Buscar cliente, orden o tlf...")).toBeVisible();
  });

  test("filtro por tramo de antigüedad responde al clic", async ({ page }) => {
    await page.goto("/cuentas-por-cobrar");
    if (page.url().includes("/login") || (await page.getByText("Acceso Reservado a Gerencia").count()) > 0) {
      return;
    }

    // Clic en tramo '0 a 7 días'
    const botonTramo0a7 = page.getByRole("button", { name: /0 a 7 días/ }).first();
    await botonTramo0a7.click();

    // La tabla o estado vacío sigue visible sin errores de consola
    await expect(page.getByText(/Detalle de Saldos por Cobrar/)).toBeVisible();
  });
});
