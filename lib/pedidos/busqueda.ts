/**
 * Utilidades para saneamiento de búsquedas y lectura con escáner USB (RF-06 / T-012a).
 */

export type ResultadoTerminoBusqueda = {
  esNumeroOrden: boolean;
  numeroOrden: number | null;
  terminoLimpio: string;
};

/**
 * Procesa y sanea el término de búsqueda ingresado manualmente o capturado
 * por un lector de código de barras USB (Code 39 / wedge de teclado).
 * Remueve prefijos estándar (*, #, ORD-), aísla números correlativos y limpia comodines.
 */
export function sanearTerminoBusquedaOrden(
  entrada: string | null | undefined,
): ResultadoTerminoBusqueda {
  if (!entrada) {
    return {
      esNumeroOrden: false,
      numeroOrden: null,
      terminoLimpio: "",
    };
  }

  const recorte = entrada.trim();
  if (recorte === "") {
    return {
      esNumeroOrden: false,
      numeroOrden: null,
      terminoLimpio: "",
    };
  }

  // 1. Detectar si coincide con un patrón de código de barras o número de orden
  // Ejemplos: "ORD-1001", "*ORD-1001*", "#1001", "1001"
  const patronOrden = /^\*?(?:ORD-?|#)?(\d+)\*?$/i;
  const coincidenciaOrden = recorte.match(patronOrden);

  if (coincidenciaOrden && coincidenciaOrden[1]) {
    const num = Number.parseInt(coincidenciaOrden[1], 10);
    if (!Number.isNaN(num) && num > 0) {
      return {
        esNumeroOrden: true,
        numeroOrden: num,
        terminoLimpio: String(num),
      };
    }
  }

  // 2. Si no es un número de orden, limpiar comodines y caracteres problemáticos para búsqueda de cliente
  const saneado = recorte
    .replace(/[*#]/g, "")
    .replace(/[%,_()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    esNumeroOrden: false,
    numeroOrden: null,
    terminoLimpio: saneado,
  };
}
