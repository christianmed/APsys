import { expect, test } from "@playwright/test";

test.describe("T-017 — Editor de plantillas de mensajes (RF-10)", () => {
  test("página de plantillas carga con editor y simulador de WhatsApp", async ({
    page,
  }) => {
    await page.goto("/plantillas");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Cabecera
    await expect(
      page.getByRole("heading", { name: "Gestión de Plantillas de Mensajes" }),
    ).toBeVisible();

    // Textarea y simulación
    await expect(page.getByLabel("Contenido de plantilla")).toBeVisible();
    await expect(page.getByText("Vista Previa en Vivo")).toBeVisible();

    // Pestañas
    const tabAviso = page.getByRole("button", { name: /Aviso de Retiro/i });
    const tabRecordatorio = page.getByRole("button", { name: /Recordatorio/i });

    await expect(tabAviso).toBeVisible();
    await expect(tabRecordatorio).toBeVisible();

    // Conmutar a recordatorio
    await tabRecordatorio.click();
    await expect(page.getByLabel("Contenido de plantilla")).toContainText(
      "{dias}",
    );
  });

  test("advertencia ante variables desconocidas en el editor", async ({
    page,
  }) => {
    await page.goto("/plantillas");
    if (page.url().includes("/login")) return;

    const textarea = page.getByLabel("Contenido de plantilla");
    await textarea.fill("Texto con variable {variable_no_valida}");

    await expect(
      page.getByText(/Variables no permitidas detectadas: {variable_no_valida}/i),
    ).toBeVisible();
  });
});
