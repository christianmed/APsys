/**
 * Normaliza el teléfono capturado en recepción: recorta extremos y colapsa
 * espacios internos múltiples a uno. Vacío equivale a "sin teléfono" (null).
 *
 * TODO(T-015): normalizar a formato E.164 para los enlaces de WhatsApp.
 */
export function normalizarTelefono(
  valor: string | null | undefined,
): string | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  const limpio = valor.trim().replace(/\s+/g, " ");

  return limpio === "" ? null : limpio;
}

/**
 * Valida y normaliza los datos del formulario de cliente (RF-01). Devuelve
 * `errores` por campo con mensajes en español listos para la UI, y `datos`
 * recortados para persistir en Supabase.
 */
export function validarDatosCliente(datos: {
  nombre: string;
  telefono: string | null;
  notas: string | null;
}): {
  errores: Record<string, string>;
  datos: { nombre: string; telefono: string | null; notas: string | null };
} {
  const errores: Record<string, string> = {};

  const nombre = datos.nombre.trim();
  if (nombre === "") {
    errores.nombre = "El nombre es obligatorio.";
  }

  const notasLimpias = datos.notas?.trim();

  return {
    errores,
    datos: {
      nombre,
      telefono: normalizarTelefono(datos.telefono),
      notas: notasLimpias ? notasLimpias : null,
    },
  };
}
