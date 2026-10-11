import { expect, test } from "@playwright/test";

// Requiere TEST_USER_GERENCIAL_* en .env.local: sin credenciales se omite.
// Se usa el usuario GERENCIAL (el único rol que administra el catálogo;
// RLS 0002 permite escribir `servicios` solo al perfil gerencial) y así las
// specs paralelas no comparten sesión con el usuario operativo de
// auth-login.spec.ts. (El `cerrarSesion` de la app usa scope local —
// app/actions.ts — sin revocación cruzada entre contextos.)
//
// Nota: la tabla `servicios` no permite borrar (por diseño: la baja es lógica
// vía `activo`, para no romper pedidos históricos): cada corrida deja
// marcadores "E2E " y NO los limpia. (Sin `_`/`%`: se mantiene la convención
// del saneo de comodines para futuras búsquedas.)
//
// En dev cada ruta nueva compila en el primer hit: se amplía el presupuesto y
// cada navegación espera el contenido propio de la ruta destino (el `Link`
// actualiza la URL antes de que el árbol nuevo esté montado).
const emailGerencial = process.env.TEST_USER_GERENCIAL_EMAIL;
const claveGerencial = process.env.TEST_USER_GERENCIAL_PASSWORD;

test.setTimeout(60_000);

test("servicios: alta, edición y baja lógica (Activo → Inactivo)", async ({
  page,
}) => {
  test.skip(
    !emailGerencial || !claveGerencial,
    "Faltan TEST_USER_GERENCIAL_* (.env.local): E2E de servicios omitido.",
  );

  const sufijo = `${Date.now()}`;
  const nombre = `E2E Servicio ${sufijo}`;
  const nombreEditado = `${nombre} editado`;

  // Sesión con el usuario gerencial.
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(emailGerencial!);
  await page.getByLabel("Contraseña").fill(claveGerencial!);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible({
    timeout: 15_000,
  });

  // Entrada al módulo desde la tarjeta de inicio.
  await page.getByRole("link", { name: "Servicios" }).click();
  await expect(
    page.getByRole("heading", { name: "Servicios", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // Alta de servicio.
  await page.getByRole("link", { name: /nuevo servicio/i }).click();
  await expect(
    page.getByRole("heading", { name: "Nuevo servicio" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Nombre", { exact: true }).fill(nombre);
  await page.getByLabel("Orden", { exact: true }).fill("9");
  await page.getByRole("button", { name: /guardar servicio/i }).click();

  // Vuelve al listado y la fila nueva se ve con su badge de estado.
  await expect(page).toHaveURL(/\/servicios$/, { timeout: 15_000 });
  const fila = page.getByRole("link", { name: nombre });
  await expect(fila).toHaveCount(1, { timeout: 15_000 });
  await expect(fila).toContainText("Activo");

  // Edición: sufijo en el nombre + baja lógica (desmarcar Activo).
  await fila.click();
  await expect(
    page.getByRole("heading", { name: "Editar servicio" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Nombre", { exact: true }).fill(nombreEditado);
  await page.getByLabel("Activo", { exact: true }).uncheck();
  await page.getByRole("button", { name: /guardar servicio/i }).click();

  // Vuelve al listado con el nombre editado y el badge "Inactivo".
  await expect(page).toHaveURL(/\/servicios$/, { timeout: 15_000 });
  const filaEditada = page.getByRole("link", { name: nombreEditado });
  await expect(filaEditada).toBeVisible({ timeout: 15_000 });
  await expect(filaEditada).toContainText("Inactivo");
});
