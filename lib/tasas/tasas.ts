export type TasaHistorica = {
  id: string;
  valor_bs_por_usd: number;
  vigente_desde: string;
  creado_en?: string;
};

export type ResultadoValidacionTasa = {
  valido: boolean;
  valor?: number;
  error?: string;
};

/**
 * Redondea un valor numérico a dos posiciones decimales exactas para moneda.
 */
export function redondearCentavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Valida y normaliza la entrada del usuario para una nueva tasa de cambio.
 * Acepta formatos con punto o coma decimal y exige un valor estrictamente positivo.
 */
export function validarEntradaTasa(entrada: unknown): ResultadoValidacionTasa {
  if (typeof entrada !== "string" && typeof entrada !== "number") {
    return { valido: false, error: "Debe ingresar un valor para la tasa" };
  }

  const strLimpio = String(entrada).trim().replace(",", ".");

  if (!strLimpio) {
    return { valido: false, error: "El valor de la tasa es obligatorio" };
  }

  const num = Number(strLimpio);

  if (isNaN(num) || !isFinite(num)) {
    return { valido: false, error: "El valor debe ser un número válido" };
  }

  if (num <= 0) {
    return { valido: false, error: "La tasa de cambio debe ser mayor a 0" };
  }

  // Máximo 4 decimales según el esquema `numeric(16, 4)`
  const valorRedondeado = Math.round(num * 10000) / 10000;

  return { valido: true, valor: valorRedondeado };
}

/**
 * Convierte un monto en USD a su equivalente en Bolívares usando la tasa proporcionada.
 */
export function calcularConversionBsUsd(
  montoUsd: number,
  valorTasa: number,
): number {
  if (valorTasa <= 0 || isNaN(valorTasa) || isNaN(montoUsd)) return 0;
  return redondearCentavos(montoUsd * valorTasa);
}

/**
 * Convierte un monto en Bolívares a su equivalente en USD usando la tasa proporcionada.
 */
export function calcularConversionUsdBs(
  montoBs: number,
  valorTasa: number,
): number {
  if (valorTasa <= 0 || isNaN(valorTasa) || isNaN(montoBs)) return 0;
  return redondearCentavos(montoBs / valorTasa);
}

/**
 * Resuelve la tasa de cambio vigente para una fecha determinada en el histórico.
 * Ordena por fecha de vigencia descendente y selecciona la primera cuya vigencia <= fecha.
 * Si ninguna es anterior, toma la más antigua disponible.
 */
export function obtenerTasaVigenteParaFecha(
  historial: TasaHistorica[],
  fechaReferencia: Date = new Date(),
): TasaHistorica | null {
  if (!historial || historial.length === 0) return null;

  const ordenadas = [...historial].sort(
    (a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime(),
  );

  const refTime = fechaReferencia.getTime();

  // Buscar la tasa más reciente cuya vigencia ya haya comenzado
  for (const t of ordenadas) {
    if (new Date(t.vigente_desde).getTime() <= refTime) {
      return t;
    }
  }

  // Si todas las vigencias son posteriores a la fecha dada, retornar la más antigua
  return ordenadas[ordenadas.length - 1];
}

/**
 * Resuelve una tasa futura programada (por ejemplo, la publicada por el BCV para el día siguiente).
 * Ordena por fecha de vigencia ascendente y selecciona la primera cuya vigencia > fechaReferencia.
 * Si no existe ninguna tasa programada en el futuro, retorna null.
 */
export function obtenerTasaProgramadaParaFecha(
  historial: TasaHistorica[],
  fechaReferencia: Date = new Date(),
): TasaHistorica | null {
  if (!historial || historial.length === 0) return null;

  const refTime = fechaReferencia.getTime();

  // Ordenar cronológicamente ascendente para encontrar la más próxima en el futuro
  const futuras = [...historial]
    .filter((t) => new Date(t.vigente_desde).getTime() > refTime)
    .sort(
      (a, b) => new Date(a.vigente_desde).getTime() - new Date(b.vigente_desde).getTime(),
    );

  return futuras.length > 0 ? futuras[0] : null;
}

/**
 * Convierte una fecha en formato YYYY-MM-DD (emitida por la API del BCV)
 * a una cadena ISO con inicio de operaciones en zona horaria Venezuela (Caracas, UTC-4).
 * Por defecto las 00:00:00 (medianoche).
 */
export function calcularVigenciaDesdeFechaBcv(
  fechaBcv: string,
  horaCaracas: string = "00:00:00",
): string {
  // Garantizar formato limpio YYYY-MM-DD
  const fechaLimpia = fechaBcv.trim().slice(0, 10);
  return `${fechaLimpia}T${horaCaracas}-04:00`;
}

/**
 * Determina si una fecha emitida por el BCV (YYYY-MM-DD) corresponde a un día futuro
 * comparado con la fecha actual en la zona horaria de Caracas.
 */
export function esTasaBcvFutura(
  fechaBcv: string,
  fechaReferencia: Date = new Date(),
): boolean {
  // Obtener la fecha YYYY-MM-DD actual en zona horaria America/Caracas (UTC-4)
  const formateador = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const fechaHoyCaracas = formateador.format(fechaReferencia);
  const fechaBcvLimpia = fechaBcv.trim().slice(0, 10);

  return fechaBcvLimpia > fechaHoyCaracas;
}

/**
 * Formatea un valor de tasa referencial con separador de miles y decimales venezolanos.
 */
export function formatearTasaBs(valor: number): string {
  return valor.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/**
 * Extrae la fecha YYYY-MM-DD anclada a la zona horaria America/Caracas (UTC-4).
 */
export function obtenerFechaYmdCaracas(fecha: Date | string): string {
  const formateador = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (typeof fecha === "string") {
    const limpia = fecha.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpia)) {
      return limpia;
    }
    try {
      return formateador.format(new Date(limpia));
    } catch {
      return limpia.slice(0, 10);
    }
  }
  return formateador.format(fecha);
}

/**
 * Calcula la diferencia exacta en días naturales entre dos fechas según el calendario de Caracas.
 * Retorna > 0 si fechaVigencia es futura respecto a fechaReferencia.
 * Retorna 0 si corresponden al mismo día natural.
 * Retorna < 0 si fechaVigencia es anterior (pasada).
 */
export function calcularDiferenciaDiasCaracas(
  fechaVigencia: string | Date,
  fechaReferencia: Date = new Date(),
): number {
  const ymdVigencia = obtenerFechaYmdCaracas(fechaVigencia);
  const ymdReferencia = obtenerFechaYmdCaracas(fechaReferencia);

  const [y1, m1, d1] = ymdVigencia.split("-").map(Number);
  const [y2, m2, d2] = ymdReferencia.split("-").map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.round((utc1 - utc2) / 86_400_000);
}

/**
 * Formatea una fecha YYYY-MM-DD o ISO a "DD/MM/AAAA".
 */
export function formatearFechaCorta(fechaStr?: string): string {
  if (!fechaStr) {
    const d = new Date();
    return d.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  const partes = fechaStr.trim().slice(0, 10).split("-");
  if (partes.length === 3) {
    const [y, m, d] = partes;
    return `${d}/${m}/${y}`;
  }
  try {
    return new Date(fechaStr).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

/**
 * Obtiene el nombre del día de la semana en español en zona horaria Caracas con inicial mayúscula.
 */
export function obtenerNombreDiaSemanaCaracas(fecha: string | Date): string {
  let d: Date;
  if (typeof fecha === "string") {
    const limpia = fecha.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpia)) {
      d = new Date(`${limpia}T12:00:00-04:00`);
    } else {
      d = new Date(limpia);
    }
  } else {
    d = fecha;
  }
  const formateadorDia = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    weekday: "long",
  });
  const nombre = formateadorDia.format(d);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export type TipoVigencia =
  | "vigente_hoy"
  | "vigente_fin_de_semana"
  | "vigente_historica"
  | "programada_manana"
  | "programada_proximo_dia_habil"
  | "historica";

export interface InfoEstadoVigencia {
  tipo: TipoVigencia;
  etiquetaBadge: string;
  esActiva: boolean;
  esProgramada: boolean;
  descripcionOperativa: string;
}

export interface OpcionesEstadoVigencia {
  fechaVigencia: string;
  esLaVigente: boolean;
  fechaReferencia?: Date;
}

/**
 * Resuelve dinámicamente el estado y la etiqueta de vigencia de una tasa
 * contemplando el desfase del calendario bancario venezolano (viernes -> lunes, fin de semana y feriados).
 */
export function describirEstadoVigencia({
  fechaVigencia,
  esLaVigente,
  fechaReferencia = new Date(),
}: OpcionesEstadoVigencia): InfoEstadoVigencia {
  const diff = calcularDiferenciaDiasCaracas(fechaVigencia, fechaReferencia);

  // Obtener día de la semana de la fecha de referencia en Caracas
  const diaSemanaRef = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    weekday: "short",
  }).format(fechaReferencia);
  const esFinDeSemana = diaSemanaRef === "Sat" || diaSemanaRef === "Sun";

  if (esLaVigente) {
    if (diff === 0) {
      return {
        tipo: "vigente_hoy",
        etiquetaBadge: "Vigente (Hoy)",
        esActiva: true,
        esProgramada: false,
        descripcionOperativa: "Tasa oficial activa para las cotizaciones y cobros del día de hoy.",
      };
    }
    if (esFinDeSemana || diff < 0) {
      return {
        tipo: "vigente_fin_de_semana",
        etiquetaBadge: "Vigente (Fin de semana)",
        esActiva: true,
        esProgramada: false,
        descripcionOperativa: "Tasa oficial fijada el viernes que rige durante el fin de semana.",
      };
    }
    return {
      tipo: "vigente_historica",
      etiquetaBadge: "Vigente",
      esActiva: true,
      esProgramada: false,
      descripcionOperativa: "Tasa oficial actualmente activa.",
    };
  }

  // Tasa no activa: o es futura programada o es histórica pasada
  if (diff > 0) {
    const nombreDia = obtenerNombreDiaSemanaCaracas(fechaVigencia);
    if (diff === 1) {
      return {
        tipo: "programada_manana",
        etiquetaBadge: "Programada (Mañana)",
        esActiva: false,
        esProgramada: true,
        descripcionOperativa: "Esta tasa oficial entrará en vigencia automática a las 12:00 a. m. de mañana.",
      };
    }
    return {
      tipo: "programada_proximo_dia_habil",
      etiquetaBadge: `Programada (${nombreDia})`,
      esActiva: false,
      esProgramada: true,
      descripcionOperativa: `Esta tasa oficial entrará en vigencia el ${nombreDia} (Próx. Día Hábil) a las 12:00 a. m.`,
    };
  }

  return {
    tipo: "historica",
    etiquetaBadge: "Histórica",
    esActiva: false,
    esProgramada: false,
    descripcionOperativa: "Tasa histórica registrada previamente.",
  };
}

export interface ParametrosEtiquetaSidebar {
  fechaVigencia?: string;
  esTasaActiva: boolean;
  fechaReferencia?: Date;
}

/**
 * Formatea dinámicamente la cabecera de las tarjetas del widget del Sidebar
 * evitando decir "Hoy" en fin de semana o "Mañana" cuando la fecha es lunes.
 */
export function formatearEtiquetaSidebar({
  fechaVigencia,
  esTasaActiva,
  fechaReferencia = new Date(),
}: ParametrosEtiquetaSidebar): string {
  const fechaFormateada = formatearFechaCorta(fechaVigencia);

  if (!fechaVigencia) {
    if (esTasaActiva) {
      return `Hoy, ${fechaFormateada}`;
    }
    const manana = new Date(fechaReferencia);
    manana.setDate(manana.getDate() + 1);
    const mananaFormateada = formatearFechaCorta(obtenerFechaYmdCaracas(manana));
    return `Mañana, ${mananaFormateada}`;
  }

  const diff = calcularDiferenciaDiasCaracas(fechaVigencia, fechaReferencia);

  if (esTasaActiva) {
    if (diff === 0) {
      return `Hoy, ${fechaFormateada}`;
    }
    return `Vigente • ${fechaFormateada}`;
  }

  // Tasa siguiente / futura
  if (diff === 1) {
    return `Mañana, ${fechaFormateada}`;
  }
  if (diff > 1) {
    const nombreDia = obtenerNombreDiaSemanaCaracas(fechaVigencia);
    return `${nombreDia}, ${fechaFormateada}`;
  }

  // Si la fecha proporcionada no es estrictamente futura (diff <= 0), calcular el día siguiente
  const manana = new Date(fechaReferencia);
  manana.setDate(manana.getDate() + 1);
  const mananaFormateada = formatearFechaCorta(obtenerFechaYmdCaracas(manana));
  return `Mañana, ${mananaFormateada}`;
}


