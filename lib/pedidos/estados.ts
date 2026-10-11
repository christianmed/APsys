/**
 * Máquina de estados y reglas de transición de pedidos (RF-05 / T-013).
 */

export type EstadoPedido =
  | "recibido"
  | "en_produccion"
  | "listo"
  | "entregado"
  | "cancelado";

export const ESTADOS_VALIDOS: EstadoPedido[] = [
  "recibido",
  "en_produccion",
  "listo",
  "entregado",
  "cancelado",
];

const TRANSICIONES_PERMITIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  recibido: ["en_produccion", "cancelado"],
  en_produccion: ["listo", "recibido", "cancelado"],
  listo: ["entregado", "en_produccion", "cancelado"],
  entregado: [], // Estado terminal
  cancelado: [], // Estado terminal
};

/**
 * Determina si una transición de estado es válida según el flujo de producción.
 */
export function esTransicionValida(
  estadoActual: EstadoPedido,
  nuevoEstado: EstadoPedido,
): boolean {
  if (estadoActual === nuevoEstado) return true;
  const permitidos = TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
  return permitidos.includes(nuevoEstado);
}

/**
 * Devuelve el siguiente estado natural en el flujo de taller para acciones rápidas.
 */
export function obtenerSiguienteEstadoSugerido(
  estadoActual: EstadoPedido,
): EstadoPedido | null {
  switch (estadoActual) {
    case "recibido":
      return "en_produccion";
    case "en_produccion":
      return "listo";
    case "listo":
      return "entregado";
    default:
      return null;
  }
}

export type ValidacionCambioEstadoResultado = {
  valido: boolean;
  error?: string;
  motivoLimpio?: string | null;
};

/**
 * Valida un intento de cambio de estado considerando permisos por rol y reglas de negocio.
 */
export function validarCambioEstado({
  estadoActual,
  nuevoEstado,
  rolUsuario,
  motivoCancelacion,
}: {
  estadoActual: EstadoPedido;
  nuevoEstado: EstadoPedido;
  rolUsuario: string;
  motivoCancelacion?: string | null;
}): ValidacionCambioEstadoResultado {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { valido: false, error: "El estado especificado no es válido." };
  }

  // Regla de cancelación: solo gerencial con motivo obligatorio
  if (nuevoEstado === "cancelado") {
    if (rolUsuario !== "gerencial") {
      return {
        valido: false,
        error: "Solo el perfil gerencial puede cancelar o anular un pedido.",
      };
    }

    const motivo = motivoCancelacion?.trim() ?? "";
    if (motivo === "") {
      return {
        valido: false,
        error: "Debe ingresar un motivo obligatorio para cancelar el pedido.",
      };
    }

    return { valido: true, motivoLimpio: motivo };
  }

  // Validar si la transición está permitida
  if (!esTransicionValida(estadoActual, nuevoEstado)) {
    return {
      valido: false,
      error: `No está permitido cambiar el estado de '${estadoActual}' a '${nuevoEstado}'.`,
    };
  }

  return { valido: true, motivoLimpio: null };
}
