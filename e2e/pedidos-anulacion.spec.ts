import { expect, test } from "@playwright/test";

test.describe("T-024 — Anulación de pedidos y auditoría inmutable (RF-16)", () => {
  test("listado de pedidos muestra información o redirige al login", async ({
    page,
  }) => {
    await page.goto("/pedidos");

    if (page.url().includes("/login")) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      return;
    }

    // Cabecera de pedidos
    await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

    // Verificamos si hay pedidos o estado vacío
    const pedidosVacios = page.getByText("No hay pedidos registrados");
    const pedidosListados = page.locator("text=#");

    const tienePedidos = (await pedidosListados.count()) > 0;
    const estaVacio = (await pedidosVacios.count()) > 0;

    expect(tienePedidos || estaVacio).toBeTruthy();
  });

  test("modal de anulación exige motivo de al menos 5 caracteres", async ({
    page,
  }) => {
    await page.goto("/pedidos");
    if (page.url().includes("/login")) {
      return;
    }

    // Buscar si existe un botón de anular (disponible solo para rol gerencial en pedidos no anulados)
    const botonAnular = page.getByRole("button", { name: /Anular/i }).first();
    if ((await botonAnular.count()) > 0) {
      await botonAnular.click();

      // Verificar que el diálogo modal se abra
      const dialogo = page.getByRole("dialog");
      await expect(dialogo).toBeVisible();
      await expect(
        dialogo.getByText(/Anular Pedido #/i),
      ).toBeVisible();

      // Validar textarea de motivo
      const textarea = dialogo.locator("textarea");
      await expect(textarea).toBeVisible();

      // Botón confirmar deshabilitado si está vacío
      const botonConfirmar = dialogo.getByRole("button", {
        name: "Confirmar Anulación",
      });
      await expect(botonConfirmar).toBeDisabled();

      // Escribir menos de 5 caracteres
      await textarea.fill("abc");
      await expect(botonConfirmar).toBeDisabled();

      // Escribir 5 o más caracteres
      await textarea.fill("Cliente canceló la solicitud del vinil");
      await expect(botonConfirmar).toBeEnabled();

      // Cerrar modal
      await dialogo.getByRole("button", { name: "Volver / Cancelar" }).click();
      await expect(dialogo).not.toBeVisible();
    }
  });

  test("modal de auditoría visualiza traza de eventos inmutables", async ({
    page,
  }) => {
    await page.goto("/pedidos");
    if (page.url().includes("/login")) {
      return;
    }

    // Buscar si existe botón de auditoría (disponible para gerencia)
    const botonAuditoria = page.getByRole("button", { name: /Auditoría/i }).first();
    if ((await botonAuditoria.count()) > 0) {
      await botonAuditoria.click();

      const dialogo = page.getByRole("dialog");
      await expect(dialogo).toBeVisible();
      await expect(
        dialogo.getByText(/Auditoría del Pedido #/i),
      ).toBeVisible();

      // Cerrar
      await dialogo.getByRole("button", { name: "Cerrar" }).click();
      await expect(dialogo).not.toBeVisible();
    }
  });
});
