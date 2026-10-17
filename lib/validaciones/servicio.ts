/**
 * APSys — Validación de Entrada y Operaciones de Servicios del Catálogo
 */

import { limpiarTexto, type ResultadoValidacion } from "./comun";

export type ServicioEntrada = {
  nombre: string;
  orden: number;
  activo: boolean;
};

export type ValidacionEliminacionServicioResultado = {
  valido: boolean;
  error?: string;
};

/**
 * Valida si un servicio puede ser eliminado físicamente de la base de datos.
 * Regla de Integridad: Si tiene al menos 1 pedido histórico asociado, se bloquea
 * el borrado físico para preservar la integridad de comandas y facturación.
 */
export function validarEliminacionServicio({
  pedidosAsociadosCount,
  servicioNombre,
}: {
  pedidosAsociadosCount: number;
  servicioNombre?: string;
}): ValidacionEliminacionServicioResultado {
  if (pedidosAsociadosCount > 0) {
    const nombreRef = servicioNombre ? ` '${servicioNombre}'` : "";
    return {
      valido: false,
      error: `No se puede eliminar el servicio${nombreRef} porque está asociado a ${pedidosAsociadosCount} pedido(s) histórico(s). Para retirarlo del catálogo, desactiva la casilla 'Activo'.`,
    };
  }

  return {
    valido: true,
  };
}

/**
 * Valida los datos de entrada para creación y edición de servicios.
 */
export function validarEntradaServicio(
  input: unknown,
): ResultadoValidacion<ServicioEntrada> {
  const errores: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return {
      exito: false,
      errores: { general: "Datos de servicio inválidos o inexistentes." },
    };
  }

  const raw = input as Record<string, unknown>;
  const nombreLimpio = limpiarTexto(
    typeof raw.nombre === "string" ? raw.nombre : "",
  );

  if (!nombreLimpio) {
    errores.nombre = "El nombre del servicio es obligatorio.";
  } else if (nombreLimpio.length > 100) {
    errores.nombre = "El nombre no puede superar los 100 caracteres.";
  }

  let ordenNum = 0;
  if (raw.orden !== undefined && raw.orden !== null && raw.orden !== "") {
    ordenNum = Number(raw.orden);
    if (isNaN(ordenNum) || ordenNum < 0 || !Number.isInteger(ordenNum)) {
      errores.orden = "La prioridad debe ser un número entero mayor o igual a 0.";
    }
  }

  const activo = raw.activo === true || raw.activo === "true" || raw.activo === "on";

  if (Object.keys(errores).length > 0) {
    return { exito: false, errores };
  }

  return {
    exito: true,
    datos: {
      nombre: nombreLimpio!,
      orden: ordenNum,
      activo,
    },
  };
}
