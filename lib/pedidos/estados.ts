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

export const ESTADOS_METADATA: Record<
  EstadoPedido,
  {
    label: string;
    badgeColor: string;
    descripcion: string;
  }
> = {
  recibido: {
    label: "Recibido",
    badgeColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    descripcion: "Esperando inicio de producción en taller",
  },
  en_produccion: {
    label: "En Producción",
    badgeColor:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
    descripcion: "En proceso de impresión o acabado",
  },
  listo: {
    label: "Listo para Retiro",
    badgeColor:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    descripcion: "Trabajo terminado, listo para entregar al cliente",
  },
  entregado: {
    label: "Entregado",
    badgeColor:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    descripcion: "Orden retirada y entregada al cliente",
  },
  cancelado: {
    label: "Cancelado",
    badgeColor:
      "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
    descripcion: "Orden anulada con motivo justificado",
  },
};

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
