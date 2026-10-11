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

