import { expect, test } from "@playwright/test";

// Requiere TEST_USER_GERENCIAL_* en .env.local: sin credenciales se omite.
// El perfil gerencial tiene permisos completos para leer clientes, servicios y pedidos.
const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("pedidos: validaciones y registro de un pedido completo", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de pedidos omitido.",
  );

  const sufijo = `${Date.now()}`;
  const nombreCliente = `Cliente Pedido ${sufijo}`;

  // 1. Iniciar sesión
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // 2. Crear un cliente para asegurar que hay al menos uno disponible
  await page.getByRole("link", { name: "Clientes" }).click();
  await page.getByRole("link", { name: /nuevo cliente/i }).click();
  await page.getByLabel("Nombre", { exact: true }).fill(nombreCliente);
  await page.getByRole("button", { name: /guardar cliente/i }).click();
  await expect(page.getByRole("link", { name: nombreCliente })).toBeVisible({
    timeout: 15_000,
  });

  // 3. Navegar al módulo de pedidos
  await page.goto("/pedidos");
  await expect(
    page.getByRole("heading", { name: "Pedidos", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // 4. Abrir formulario de nuevo pedido
  await page.getByRole("link", { name: /nuevo pedido/i }).click();
  await expect(page.getByRole("heading", { name: "Nuevo pedido" })).toBeVisible(
    { timeout: 15_000 },
  );

  // 5. Seleccionar cliente
  const selectCliente = page.locator("select[name='cliente_id']");
  await selectCliente.selectOption({ label: nombreCliente });

  // 6. Configurar el ítem del pedido
  const selectServicio = page.locator("select").nth(1); // Segundo select del formulario (el del renglón 1)
  const opciones = await selectServicio.locator("option").all();
  if (opciones.length > 1) {
    await selectServicio.selectOption({ index: 1 });
  }

  await page.getByPlaceholder("Ej: 1.20 x 0.80 m").fill("1.50 x 2.00 m");
  await page
    .getByPlaceholder("Ej: Ojetes cada 50 cm, corte recto")
    .fill("Ojetes perimetrales");
  await page.getByPlaceholder("0.00").fill("25.00");
  await page
    .getByPlaceholder("Indicaciones para taller o recepción...")
    .fill("Entrega urgente para evento corporativo");

  // 7. Enviar formulario
  await page.getByRole("button", { name: /registrar pedido/i }).click();

  // 8. Verificar redirección y presencia de la orden en el listado
  await expect(
    page.getByRole("heading", { name: "Pedidos", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(nombreCliente)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("$25.00 USD")).toBeVisible({
    timeout: 15_000,
  });
});
