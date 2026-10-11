import { expect, test } from "@playwright/test";

// Requiere TEST_USER_GERENCIAL_* en .env.local: sin credenciales se omite.
// Se usa el usuario GERENCIAL (no el operativo) porque ambos roles leen,
// crean y editan `clientes` (RLS 0002), y auth-login.spec.ts corre en
// paralelo con el operativo y cierra sesión con signOut() global
// (app/actions.ts): eso revoca TODAS las sesiones de ese usuario al
// instante (verificado: GET /auth/v1/user con access token vigente → 403
// tras el logout global), lo que tumbaría los requests de esta spec y la
// devolvería a /login.
//
// Nota: la tabla `clientes` no permite borrar (por diseño): cada corrida deja
// marcadores "__e2e__" con teléfono único y NO los limpia.
//
// En dev cada ruta nueva compila en el primer hit: se amplía el presupuesto y
// cada navegación espera el contenido propio de la ruta destino (el `Link`
// actualiza la URL antes de que el árbol nuevo esté montado).
const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("clientes: alta, búsqueda por nombre y edición de notas", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de clientes omitido.",
  );

  const sufijo = `${Date.now()}`;
  const nombre = `__e2e__ ${sufijo}`;
  const telefono = `0414${sufijo.slice(-7)}`;

  // Sesión con el usuario gerencial.
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // Entrada al módulo desde la tarjeta de inicio.
  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(
    page.getByRole("heading", { name: "Clientes", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // Alta de cliente.
  await page.getByRole("link", { name: /nuevo cliente/i }).click();
  await expect(
    page.getByRole("heading", { name: "Nuevo cliente" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Nombre", { exact: true }).fill(nombre);
  await page.getByLabel("Teléfono", { exact: true }).fill(telefono);
  await page.getByRole("button", { name: /guardar cliente/i }).click();
  await expect(page.getByRole("link", { name: nombre })).toBeVisible({
    timeout: 15_000,
  });

  // Búsqueda por nombre (formulario GET con `q`).
  await page
    .getByLabel("Buscar por nombre o teléfono", { exact: true })
    .fill(nombre);
  await page.getByRole("button", { name: /buscar/i }).click();
  await expect(page).toHaveURL(/\?q=/, { timeout: 15_000 });

  const tarjeta = page.getByRole("link", { name: nombre });
  await expect(tarjeta).toHaveCount(1, { timeout: 15_000 });

  // Edición de notas desde el detalle.
  await tarjeta.click();
  await expect(
    page.getByRole("heading", { name: "Editar cliente" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Notas", { exact: true }).fill("Nota editada por E2E");
  await page.getByRole("button", { name: /guardar cliente/i }).click();
  await expect(page).toHaveURL(/\/clientes$/, { timeout: 15_000 });
  await expect(tarjeta).toBeVisible({ timeout: 15_000 });
  await expect(tarjeta).toContainText("Nota editada por E2E");
});
