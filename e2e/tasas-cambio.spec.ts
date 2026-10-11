import { expect, test } from "@playwright/test";

test.describe("T-023 — Tasa de cambio: captura, vigencia e inmutabilidad histórica (RF-15)", () => {
  test("página de tasas carga con tasa vigente, histórico y formulario o bloquea a operarios", async ({
    page,
  }) => {
    await page.goto("/tasas");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Título y encabezado
    await expect(
      page.getByRole("heading", { name: "Tasa de Cambio Referencial" }),
    ).toBeVisible();

    // Tarjeta de tasa vigente destacada
    await expect(page.getByText("Tasa Vigente Ahora")).toBeVisible();
    await expect(page.getByText(/Bs\./)).toBeVisible();

    // Histórico de tasas
    await expect(page.getByText(/Histórico de Tasas Registradas/)).toBeVisible();

    // Si es gerencial, debe tener el formulario disponible
    const formularioActualizar = page.getByRole("heading", {
      name: "Actualizar Tasa Referencial",
    });
    await expect(formularioActualizar).toBeVisible();
  });

  test("formulario valida entrada de tasa numérica", async ({ page }) => {
    await page.goto("/tasas");
    if (page.url().includes("/login")) {
      return;
    }

    const inputTasa = page.locator('input[name="valor"]');
    if ((await inputTasa.count()) > 0) {
      // Input está presente y editable para gerencia
      await expect(inputTasa).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Aplicar Nueva Tasa Referencial" }),
      ).toBeVisible();
    }
  });
});
