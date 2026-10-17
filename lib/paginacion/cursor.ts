/**
 * APSys — Utilidades de Paginación por Cursor (Keyset Pagination)
 *
 * Implementa el patrón LIMIT + 1 para optimizar consultas en PostgreSQL
 * utilizando índices B-Tree sin sobrecarga de OFFSET ni SELECT COUNT(*).
 */

export interface ResultadoPaginacionCursor<T> {
  datos: T[];
  hayMas: boolean;
  siguienteCursor: string | number | null;
}

/**
 * Procesa un arreglo de registros obtenido con límite + 1.
 * Si se recibieron más elementos que el límite establecido, descarta el último
 * registro de control, fija `hayMas: true` y extrae el cursor del último registro visible.
 *
 * @param items Arreglo de registros recibidos de la base de datos.
 * @param limite Cantidad de registros que se deben mostrar por página.
 * @param campoCursor Propiedad del objeto que actúa como cursor (ej. "numero_orden", "creado_en").
 */
export function procesarPaginacionCursor<T, K extends keyof T>(
  items: T[],
  limite: number,
  campoCursor: K,
): ResultadoPaginacionCursor<T> {
  if (!items || items.length === 0) {
    return {
      datos: [],
      hayMas: false,
      siguienteCursor: null,
    };
  }

  const hayMas = items.length > limite;
  const datos = hayMas ? items.slice(0, limite) : items;
  const ultimoItem = datos[datos.length - 1];

  let siguienteCursor: string | number | null = null;
  if (hayMas && ultimoItem) {
    const valor = ultimoItem[campoCursor];
    if (typeof valor === "string" || typeof valor === "number") {
      siguienteCursor = valor;
    }
  }

  return {
    datos,
    hayMas,
    siguienteCursor,
  };
}

/**
 * Construye una URL con parámetros de búsqueda limpios para la paginación,
 * eliminando claves con valor null, undefined o cadenas vacías.
 *
 * @param ruta Base de la ruta (ej. "/pedidos", "/clientes").
 * @param params Objeto con parámetros clave-valor.
 */
export function construirUrlPaginacion(
  ruta: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const searchParams = new URLSearchParams();

  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== null && valor !== undefined && valor !== "") {
      searchParams.set(clave, String(valor));
    }
  }

  const query = searchParams.toString();
  return query ? `${ruta}?${query}` : ruta;
}
