import { expect, test } from "@playwright/test";

const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("comanda: apertura, cambio de formato A4/Ticket y elementos de lectura (RF-03, D-4)", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de comanda omitido.",
  );

  // 1. Iniciar sesión
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // 2. Ir a pedidos
  await page.goto("/pedidos");
  await expect(
    page.getByRole("heading", { name: "Pedidos", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // 3. Abrir la comanda del primer pedido disponible
  const botonComanda = page.getByRole("link", { name: "Comanda" }).first();
  await expect(botonComanda).toBeVisible({ timeout: 15_000 });
  await botonComanda.click();

  // 4. Verificar encabezado y orden de la comanda
  await expect(
    page.getByRole("heading", { name: /Sol_gráficas C\.J\., C\.A\./i }),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(/Comanda de Producción y Recepción/i)).toBeVisible();

  // 5. Verificar presencia de código de barras y QR
  await expect(page.locator("svg[aria-label*='Código de barras']")).toBeVisible();
  await expect(page.locator("svg[aria-label*='Código QR']")).toBeVisible();

  // 6. Probar alternancia de formato: Ticket 80mm vs Hoja A4
  const btnTicket = page.getByRole("button", { name: /Ticket 80mm/i });
  await btnTicket.click();

  const btnA4 = page.getByRole("button", { name: /Hoja A4/i });
  await btnA4.click();

  // 7. Verificar botón de impresión
  await expect(page.getByRole("button", { name: /Imprimir/i })).toBeVisible();
});
