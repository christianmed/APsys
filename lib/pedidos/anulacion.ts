export type ResultadoValidacionMotivo = {
  valido: boolean;
  motivoLimpio?: string;
  error?: string;
};

export type ResultadoPermisoAnulacion = {
  permitido: boolean;
  razon?: string;
};

export type EventoAuditoria = {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  motivo?: string | null;
  usuario_id?: string | null;
  usuario_nombre?: string | null;
  fecha: string;
};

/**
 * Valida que el motivo de anulación sea obligatorio, no vacío, tenga al menos 5 caracteres
 * y no exceda 500 caracteres (RF-16).
 */
export function validarMotivoAnulacion(
  motivo: unknown,
): ResultadoValidacionMotivo {
  if (typeof motivo !== "string") {
    return {
      valido: false,
      error: "El motivo de anulación es obligatorio.",
    };
  }

  const motivoLimpio = motivo.trim();

  if (motivoLimpio.length === 0) {
    return {
      valido: false,
      error: "Debe ingresar una justificación para anular el pedido.",
    };
  }

  if (motivoLimpio.length < 5) {
    return {
      valido: false,
      error: "El motivo debe contener un mínimo de 5 caracteres.",
    };
  }

  if (motivoLimpio.length > 500) {
    return {
      valido: false,
      error: "El motivo no puede exceder 500 caracteres.",
    };
  }

  return {
    valido: true,
    motivoLimpio,
  };
}

/**
 * Evalúa las reglas de negocio para determinar si un pedido puede ser anulado.
 * Solo el perfil gerencial puede anular pedidos, y no se puede anular un pedido ya anulado.
 */
export function puedeAnularPedido(
  pedido: { estado: string; anulado: boolean },
  rol: string,
): ResultadoPermisoAnulacion {
  if (rol !== "gerencial") {
    return {
      permitido: false,
      razon: "Solo los usuarios con perfil gerencial tienen permiso para anular pedidos (RF-16 / RF-18).",
    };
  }

  if (pedido.anulado) {
    return {
      permitido: false,
      razon: "Este pedido ya se encuentra anulado.",
    };
  }

  return {
    permitido: true,
  };
}
