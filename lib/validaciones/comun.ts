/**
 * APSys — Utilidades de validación y sanitización comunes
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida si una cadena cumple con el formato estándar de UUID (PostgreSQL)
 */
export function esUuidValido(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Recorta espacios en blanco en los extremos y remueve caracteres de control
 * Si queda una cadena vacía, retorna null.
 */
export function limpiarTexto(texto: string | null | undefined): string | null {
  if (texto === null || texto === undefined || typeof texto !== "string") {
    return null;
  }
  const limpio = texto.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return limpio === "" ? null : limpio;
}

/**
 * Normaliza números de teléfono para captura en mostrador y WhatsApp.
 * Elimina espacios dobles internos y espacios extremos.
 */
export function normalizarTelefono(
  valor: string | null | undefined,
): string | null {
  if (valor === null || valor === undefined || typeof valor !== "string") {
    return null;
  }
  const limpio = valor.trim().replace(/\s+/g, " ");
  return limpio === "" ? null : limpio;
}

export type ResultadoValidacion<T> =
  | { exito: true; datos: T }
  | { exito: false; errores: Record<string, string> };
