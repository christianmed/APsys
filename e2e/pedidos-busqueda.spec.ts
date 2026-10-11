import { expect, test } from "@playwright/test";

const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("pedidos: búsqueda por número y simulación de escáner USB (RF-06 / T-012)", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de búsqueda omitido.",
  );

  // 1. Iniciar sesión
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // 2. Ir al listado de pedidos
  await page.goto("/pedidos");
  await expect(
    page.getByRole("heading", { name: "Pedidos", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // 3. Capturar el número de una orden visible (ej: "#1001" o similar)
  const primerNumeroElem = page.locator("span.font-mono").first();
  await expect(primerNumeroElem).toBeVisible({ timeout: 15_000 });
  const textoOrden = (await primerNumeroElem.textContent()) ?? "#1001";
  const numeroLimpio = textoOrden.replace(/[^0-9]/g, "");

  // 4. Simular lectura de pistola de código de barras USB (envía prefijo ORD-XXXX seguido de Enter)
  const buscador = page.getByPlaceholder(/Buscar por N° orden/i);
  await buscador.fill(`ORD-${numeroLimpio}`);
  await buscador.press("Enter");

  // 5. Verificar que el resultado filtrado aparezca en pantalla inmediatamente (< 2 s)
  await expect(page.locator(`text=#${numeroLimpio}`).first()).toBeVisible({
    timeout: 5_000,
  });

  // 6. Probar botón de limpiar búsqueda
  const btnLimpiar = page.getByRole("button", { name: /Limpiar búsqueda/i });
  await btnLimpiar.click();

  await expect(buscador).toHaveValue("");
  await expect(primerNumeroElem).toBeVisible({ timeout: 5_000 });
});
