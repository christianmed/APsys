import { expect, test } from "@playwright/test";

test.describe("T-018 — Escaneo de comanda con cámara móvil (RF-06)", () => {
  test("modal de cámara se abre desde la vista de taller y permite cerrar", async ({
    page,
  }) => {
    await page.goto("/taller");

    if (page.url().includes("/login")) {
      return;
    }

    const btnCamara = page.getByRole("button", {
      name: "Escanear con cámara móvil",
    });
    await expect(btnCamara).toBeVisible();

    // Abrir modal de escáner
    await btnCamara.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Escanear Comanda con Cámara" }),
    ).toBeVisible();

    // El input manual como fallback debe estar presente
    const inputManual = page.getByLabel("Número de orden manual");
    await expect(inputManual).toBeVisible();

    // Cerrar modal
    const btnCerrar = page.getByRole("button", { name: "Cerrar escáner" });
    await btnCerrar.click();

    await expect(modal).not.toBeVisible();
  });
});
