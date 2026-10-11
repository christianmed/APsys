/**
 * Valida y normaliza los datos del formulario de servicio (RF-04/T-007).
 * Devuelve `errores` por campo con mensajes en español listos para la UI, y
 * `datos` recortados para persistir en Supabase.
 *
 * El orden de presentación es opcional: vacío, null o "" equivalen a 0.
 */
export function validarDatosServicio(datos: {
  nombre: string;
  orden: string | number | null;
}): {
  errores: Record<string, string>;
  datos: { nombre: string; orden: number };
} {
  const errores: Record<string, string> = {};

  const nombre = datos.nombre.trim();
  if (nombre === "") {
    errores.nombre = "El nombre es obligatorio.";
  }

  let orden = 0;
  const ordenTexto = String(datos.orden ?? "").trim();
  if (ordenTexto !== "") {
    orden = Number.parseInt(ordenTexto, 10);
    if (Number.isNaN(orden) || orden < 0) {
      errores.orden = "El orden debe ser un número entero mayor o igual a 0.";
      orden = 0;
    }
  }

  return {
    errores,
    datos: { nombre, orden },
  };
}
