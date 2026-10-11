import { expect, test } from "@playwright/test";

const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("pedidos: máquina de estados, avance en 1 toque y cancelación con motivo (RF-05 / T-013)", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de estados omitido.",
  );

  // 1. Iniciar sesión
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // 2. Crear un nuevo pedido dedicado para probar transiciones limpiamente
  await page.goto("/pedidos/nuevo");
  const selectCliente = page.locator("select[name='cliente_id']");
  const opcionesCliente = await selectCliente.locator("option").all();
  if (opcionesCliente.length > 1) {
    await selectCliente.selectOption({ index: 1 });
  }

  const selectServicio = page.locator("select").nth(1);
  const opcionesServicio = await selectServicio.locator("option").all();
  if (opcionesServicio.length > 1) {
    await selectServicio.selectOption({ index: 1 });
  }

  await page.getByPlaceholder("Ej: 1.20 x 0.80 m").fill("1.00 x 1.00 m");
  await page.getByPlaceholder("0.00").first().fill("15.00");
  await page.getByRole("button", { name: /registrar pedido/i }).click();

  // 3. Verificar que aparece en el listado con estado inicial "Recibido"
  await expect(
    page.getByRole("heading", { name: "Pedidos", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText("Recibido").first()).toBeVisible({
    timeout: 15_000,
  });

  // 4. Probar avance a "En Producción" con el botón rápido
  const btnIniciar = page.getByRole("button", { name: /iniciar producción/i }).first();
  await expect(btnIniciar).toBeVisible({ timeout: 10_000 });
  await btnIniciar.click();

  // 5. Verificar que el estado cambió a "En Producción" y ahora sugiere "Marcar listo"
  await expect(page.getByText("En Producción").first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("button", { name: /marcar listo/i }).first()).toBeVisible({
    timeout: 10_000,
  });

  // 6. Probar cancelación con motivo obligatorio
  const btnCancelar = page.getByRole("button", { name: /cancelar/i }).first();
  await btnCancelar.click();

  await expect(page.getByRole("heading", { name: "Cancelar pedido" })).toBeVisible();
  await page.getByPlaceholder(/motivo/i).fill("Cancelado por prueba de estados E2E");
  await page.getByRole("button", { name: /confirmar anulación/i }).click();

  // 7. Verificar que el estado ahora refleja "Cancelado"
  await expect(page.getByText("Cancelado").first()).toBeVisible({
    timeout: 10_000,
  });
});
