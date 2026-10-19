/**
 * Módulo Centralizado de Fechas y Tiempo de APSys (RF-11 / RF-15 / Fase 32).
 * Única fuente de verdad para el cálculo y formateo de fechas ancladas
 * estrictamente a la hora oficial de Venezuela (America/Caracas, UTC-4).
 */

export const ZONA_HORARIA_CARACAS = "America/Caracas";
export const OFFSET_CARACAS = "-04:00";
export const LOCALE_VENEZUELA = "es-VE";

export type PresetFecha = "hoy" | "esta_semana" | "este_mes" | "todo";

/**
 * Normaliza cualquier entrada a un objeto Date válido.
 */
function normalizarFecha(fecha: Date | string = new Date()): Date {
  return typeof fecha === "string" ? new Date(fecha) : fecha;
}

/**
 * Extrae la fecha YYYY-MM-DD anclada a la zona horaria America/Caracas.
 */
export function obtenerFechaYmdCaracas(fecha: Date | string = new Date()): string {
  const d = normalizarFecha(fecha);
  const formateador = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_CARACAS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formateador.format(d);
}

/**
 * Formatea una fecha larga con día de la semana para banners y cabeceras en español venezolano.
 * Ejemplo: "Domingo, 18 de octubre de 2026"
 */
export function formatearFechaLargaCaracas(fecha: Date | string = new Date()): string {
  const d = normalizarFecha(fecha);
  const formateador = new Intl.DateTimeFormat(LOCALE_VENEZUELA, {
    timeZone: ZONA_HORARIA_CARACAS,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const texto = formateador.format(d);
  if (!texto) return "";
  // Capitalizar la primera letra para un diseño editorial elegante
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Formatea una fecha corta en formato DD/MM/AAAA.
 * Ejemplo: "18/10/2026"
 */
export function formatearFechaCortaCaracas(fecha: Date | string = new Date()): string {
  const d = normalizarFecha(fecha);
  const formateador = new Intl.DateTimeFormat(LOCALE_VENEZUELA, {
    timeZone: ZONA_HORARIA_CARACAS,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return formateador.format(d);
}

/**
 * Formatea fecha y hora en formato legible venezolano.
 * Ejemplo: "18 oct 2026, 09:30 p. m."
 */
export function formatearFechaHoraCaracas(
  fecha: Date | string = new Date(),
  incluirHora: boolean = true,
): string {
  const d = normalizarFecha(fecha);
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: ZONA_HORARIA_CARACAS,
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (incluirHora) {
    opciones.hour = "2-digit";
    opciones.minute = "2-digit";
  }

  const formateador = new Intl.DateTimeFormat(LOCALE_VENEZUELA, opciones);
  return formateador.format(d);
}

/**
 * Calcula las marcas de tiempo ISO (UTC) del inicio exacto (00:00:00.000)
 * y fin exacto (23:59:59.999) del día civil correspondiente en Caracas.
 */
export function obtenerInicioFinDiaCaracas(fecha: Date | string = new Date()): {
  desde: string;
  hasta: string;
} {
  const ymd = obtenerFechaYmdCaracas(fecha);
  const inicioCaracasIso = `${ymd}T00:00:00.000${OFFSET_CARACAS}`;
  const finCaracasIso = `${ymd}T23:59:59.999${OFFSET_CARACAS}`;

  return {
    desde: new Date(inicioCaracasIso).toISOString(),
    hasta: new Date(finCaracasIso).toISOString(),
  };
}

/**
 * Calcula los milisegundos restantes hasta la medianoche (00:00:00) de Caracas.
 * Útil para temporizadores reactivos que actualizan la jornada en vivo.
 */
export function obtenerTiempoHastaMedianocheCaracas(
  fecha: Date | string = new Date(),
): number {
  const d = normalizarFecha(fecha);
  const { hasta } = obtenerInicioFinDiaCaracas(d);
  const medianocheMs = new Date(hasta).getTime() + 1; // 00:00:00.000 del día siguiente
  return Math.max(1000, medianocheMs - d.getTime());
}

/**
 * Genera rangos de fechas (desde / hasta en UTC ISO) para reportes y dashboards,
 * anclados al calendario oficial de Caracas.
 */
export function obtenerRangoPresetCaracas(
  preset: PresetFecha,
  fechaReferencia: Date | string = new Date(),
): { desde: string; hasta: string } {
  const d = normalizarFecha(fechaReferencia);
  const ymd = obtenerFechaYmdCaracas(d);
  const [anioStr, mesStr, diaStr] = ymd.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);

  switch (preset) {
    case "hoy":
      return obtenerInicioFinDiaCaracas(d);

    case "esta_semana": {
      // Determinar día de la semana en Caracas (0: Domingo, 1: Lunes, ..., 6: Sábado)
      const diaSemanaCaracas = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
      const diffLunes = (diaSemanaCaracas + 6) % 7;

      // Calcular lunes y domingo de la semana
      const lunesMs = Date.UTC(anio, mes - 1, dia - diffLunes);
      const domingoMs = Date.UTC(anio, mes - 1, dia + (6 - diffLunes));

      const dLunes = new Date(lunesMs);
      const dDomingo = new Date(domingoMs);

      const ymdLunes = `${dLunes.getUTCFullYear()}-${String(dLunes.getUTCMonth() + 1).padStart(2, "0")}-${String(dLunes.getUTCDate()).padStart(2, "0")}`;
      const ymdDomingo = `${dDomingo.getUTCFullYear()}-${String(dDomingo.getUTCMonth() + 1).padStart(2, "0")}-${String(dDomingo.getUTCDate()).padStart(2, "0")}`;

      return {
        desde: new Date(`${ymdLunes}T00:00:00.000${OFFSET_CARACAS}`).toISOString(),
        hasta: new Date(`${ymdDomingo}T23:59:59.999${OFFSET_CARACAS}`).toISOString(),
      };
    }

    case "este_mes": {
      const inicioMesStr = `${anioStr}-${mesStr}-01T00:00:00.000${OFFSET_CARACAS}`;
      // Último día del mes
      const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
      const finMesStr = `${anioStr}-${mesStr}-${String(ultimoDia).padStart(2, "0")}T23:59:59.999${OFFSET_CARACAS}`;

      return {
        desde: new Date(inicioMesStr).toISOString(),
        hasta: new Date(finMesStr).toISOString(),
      };
    }

    case "todo":
    default:
      return {
        desde: new Date("2020-01-01T00:00:00.000Z").toISOString(),
        hasta: new Date("2099-12-31T23:59:59.999Z").toISOString(),
      };
  }
}
