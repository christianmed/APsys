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
      "border border-blue-200/90 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-[#7aa2f7]",
    descripcion: "Esperando inicio de producción en taller",
  },
  en_produccion: {
    label: "En Producción",
    badgeColor:
      "border border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-[#e0af68]",
    descripcion: "En proceso de impresión o acabado",
  },
  listo: {
    label: "Listo para Retiro",
    badgeColor:
      "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-[#9ece6a]",
    descripcion: "Trabajo terminado, listo para entregar al cliente",
  },
  entregado: {
    label: "Entregado",
    badgeColor:
      "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300",
    descripcion: "Orden retirada y entregada al cliente",
  },
  cancelado: {
    label: "Cancelado",
    badgeColor:
      "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-[#f7768e]",
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
  saldoPendienteUsd,
}: {
  estadoActual: EstadoPedido;
  nuevoEstado: EstadoPedido;
  rolUsuario: string;
  motivoCancelacion?: string | null;
  saldoPendienteUsd?: number;
}): ValidacionCambioEstadoResultado {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { valido: false, error: "El estado especificado no es válido." };
  }

  // Regla de Entrega Estricta: el saldo debe ser igual a cero ($0.00)
  if (
    nuevoEstado === "entregado" &&
    typeof saldoPendienteUsd === "number" &&
    saldoPendienteUsd > 0.005
  ) {
    return {
      valido: false,
      error: `No se puede entregar el pedido: registra un saldo pendiente de $${saldoPendienteUsd.toFixed(2)}. Debe liquidarse el pago antes de realizar la entrega.`,
    };
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

export type ContadoresProduccion = {
  porIniciar: number;
  enProduccion: number;
  listos: number;
  totalActivos: number;
};

/**
 * Calcula con precisión los contadores del flujo de producción en taller,
 * garantizando coherencia 1:1 entre el tablero kanban y el dashboard de inicio (Fase 32).
 */
export function calcularContadoresProduccion(
  pedidos: Array<{ estado?: string | null; anulado?: boolean | null }>,
): ContadoresProduccion {
  const activosNoAnulados = (pedidos ?? []).filter((p) => !p.anulado);

  const porIniciar = activosNoAnulados.filter((p) => p.estado === "recibido").length;
  const enProduccion = activosNoAnulados.filter((p) => p.estado === "en_produccion").length;
  const listos = activosNoAnulados.filter((p) => p.estado === "listo").length;
  const totalActivos = porIniciar + enProduccion + listos;

  return {
    porIniciar,
    enProduccion,
    listos,
    totalActivos,
  };
}

