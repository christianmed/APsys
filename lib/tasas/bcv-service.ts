/**
 * Servicio de consumo de tasas BCV (Banco Central de Venezuela).
 *
 * Consume la API pública de DolarVZLA (rates.dolarvzla.com/bcv/current.json)
 * para obtener las tasas oficiales del USD y EUR en bolívares.
 * Incluye fallback secundario a DolarApi (ve.dolarapi.com) para alta disponibilidad.
 *
 * @module lib/tasas/bcv-service
 */

import { esTasaBcvFutura } from "./tasas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Respuesta de rates.dolarvzla.com/bcv/current.json */
export type DolarVzlaBcvResponse = {
  current: {
    date: string;
    usd: number;
    eur: number;
  };
  previous?: {
    date: string;
    usd: number;
    eur: number;
  };
  changePercentage?: {
    usd: number;
    eur: number;
  };
};

/** Respuesta cruda de ve.dolarapi.com (fallback) */
export type DolarApiResponse = {
  moneda: string;
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
};

/** Resultado normalizado que devuelve nuestro servicio */
export type TasaBcv = {
  moneda: "USD" | "EUR";
  valorBs: number;
  fechaActualizacion: string;
  fuente: string;
  variacionPorcentaje?: number;
};

/** Resultado completo con ambas divisas y desglose hoy/mañana */
export type TasasBcvCompletas = {
  usd: TasaBcv | null;
  eur: TasaBcv | null;
  hoy?: {
    usd: number;
    eur: number;
    fecha: string;
  } | null;
  siguiente?: {
    usd: number;
    eur: number;
    fecha: string;
  } | null;
  error?: string;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const DOLARVZLA_BCV_URL = "https://rates.dolarvzla.com/bcv/current.json";
export const DOLARAPI_BASE = "https://ve.dolarapi.com/v1";

/** Timeout de 8 segundos para evitar bloquear la UI en caso de API lenta */
const FETCH_TIMEOUT_MS = 8_000;

/** TTL de caché en memoria: 15 minutos para evitar consultas HTTP salientes en cada SSR */
export const CACHE_BCV_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  datos: TasasBcvCompletas;
  timestamp: number;
};

let cacheTasasBcv: CacheEntry | null = null;

/**
 * Invalida el caché en memoria para obligar a consultar la API en la próxima llamada.
 */
export function limpiarCacheBcv(): void {
  cacheTasasBcv = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch con timeout configurable. Lanza AbortError si se excede el tiempo.
 */
async function fetchConTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "APSys/1.0",
      },
      // No cachear en el servidor para obtener siempre datos frescos
      cache: "no-store",
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parsea y normaliza la respuesta de DolarVZLA.
 */
export function parsearRespuestaDolarVzla(
  data: unknown,
): TasasBcvCompletas | null {
  if (!data || typeof data !== "object") return null;

  const resp = data as DolarVzlaBcvResponse;
  if (!resp.current || typeof resp.current !== "object") return null;

  const usdValor =
    typeof resp.current.usd === "number" &&
    isFinite(resp.current.usd) &&
    resp.current.usd > 0
      ? resp.current.usd
      : null;

  const eurValor =
    typeof resp.current.eur === "number" &&
    isFinite(resp.current.eur) &&
    resp.current.eur > 0
      ? resp.current.eur
      : null;

  if (usdValor === null && eurValor === null) {
    return null;
  }

  const fecha = resp.current.date ?? new Date().toISOString();

  const usd: TasaBcv | null =
    usdValor !== null
      ? {
          moneda: "USD",
          valorBs: usdValor,
          fechaActualizacion: fecha,
          fuente: "DolarVZLA (BCV)",
          variacionPorcentaje: resp.changePercentage?.usd,
        }
      : null;

  const eur: TasaBcv | null =
    eurValor !== null
      ? {
          moneda: "EUR",
          valorBs: eurValor,
          fechaActualizacion: fecha,
          fuente: "DolarVZLA (BCV)",
          variacionPorcentaje: resp.changePercentage?.eur,
        }
      : null;

  const errores: string[] = [];
  if (!usd) errores.push("USD");
  if (!eur) errores.push("EUR");

  const esFutura = resp.current.date ? esTasaBcvFutura(resp.current.date) : false;

  let hoyDesglose: { usd: number; eur: number; fecha: string } | null = null;
  let siguienteDesglose: { usd: number; eur: number; fecha: string } | null = null;

  if (esFutura) {
    hoyDesglose = {
      usd:
        typeof resp.previous?.usd === "number" && resp.previous.usd > 0
          ? resp.previous.usd
          : (usdValor ?? 0),
      eur:
        typeof resp.previous?.eur === "number" && resp.previous.eur > 0
          ? resp.previous.eur
          : (eurValor ?? 0),
      fecha: resp.previous?.date ?? "",
    };
    siguienteDesglose = {
      usd: usdValor ?? 0,
      eur: eurValor ?? 0,
      fecha: resp.current.date,
    };
  } else {
    hoyDesglose = {
      usd: usdValor ?? 0,
      eur: eurValor ?? 0,
      fecha: resp.current.date,
    };
  }

  return {
    usd,
    eur,
    hoy: hoyDesglose,
    siguiente: siguienteDesglose,
    error:
      errores.length > 0
        ? `No se pudo obtener la tasa para: ${errores.join(", ")}`
        : undefined,
  };
}

/**
 * Parsea y valida la respuesta de DolarApi para una divisa (fallback).
 */
export function parsearRespuestaDolarApi(
  data: unknown,
  divisaEsperada: "USD" | "EUR",
): TasaBcv | null {
  if (!data || typeof data !== "object") return null;

  const resp = data as DolarApiResponse;
  const valor = resp.promedio ?? resp.venta ?? resp.compra;

  if (typeof valor !== "number" || valor <= 0 || !isFinite(valor)) {
    return null;
  }

  return {
    moneda: divisaEsperada,
    valorBs: valor,
    fechaActualizacion: resp.fechaActualizacion ?? new Date().toISOString(),
    fuente: `DolarApi (${resp.fuente ?? "oficial"})`,
  };
}

/**
 * Consulta de respaldo utilizando DolarApi cuando DolarVZLA no responde.
 */
async function obtenerTasasDesdeDolarApi(): Promise<TasasBcvCompletas> {
  const [usdRes, eurRes] = await Promise.allSettled([
    fetchConTimeout(`${DOLARAPI_BASE}/dolares/oficial`),
    fetchConTimeout(`${DOLARAPI_BASE}/euros/oficial`),
  ]);

  let usd: TasaBcv | null = null;
  if (usdRes.status === "fulfilled" && usdRes.value.ok) {
    try {
      const data: unknown = await usdRes.value.json();
      usd = parsearRespuestaDolarApi(data, "USD");
    } catch {
      // Ignorar error de parsing
    }
  }

  let eur: TasaBcv | null = null;
  if (eurRes.status === "fulfilled" && eurRes.value.ok) {
    try {
      const data: unknown = await eurRes.value.json();
      eur = parsearRespuestaDolarApi(data, "EUR");
    } catch {
      // Ignorar error de parsing
    }
  }

  const errores: string[] = [];
  if (!usd) errores.push("USD");
  if (!eur) errores.push("EUR");

  return {
    usd,
    eur,
    hoy: {
      usd: usd?.valorBs ?? 0,
      eur: eur?.valorBs ?? 0,
      fecha: usd?.fechaActualizacion ?? "",
    },
    siguiente: null,
    error:
      errores.length > 0
        ? `No se pudo obtener la tasa para: ${errores.join(", ")}`
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// API Pública
// ---------------------------------------------------------------------------

export type OpcionesConsultaBcv = {
  /** Si es true, ignora el caché en memoria y consulta directamente los proveedores externos */
  forzarRefresco?: boolean;
};

/**
 * Obtiene ambas tasas oficiales (USD y EUR) del BCV.
 *
 * Utiliza un caché en memoria con TTL de 15 minutos para eliminar la latencia
 * de red en renders repetidos. Si el caché está vacío o expiró, consulta primero
 * DolarVZLA (rates.dolarvzla.com) con respaldo automático a DolarApi.
 *
 * @param opciones - Opciones de consulta (permite forzar el refresco)
 * @returns Objeto con ambas tasas y posible mensaje de error parcial
 */
export async function obtenerTasasBcvCompletas(
  opciones: OpcionesConsultaBcv = {},
): Promise<TasasBcvCompletas> {
  // Usar performance.now() para medición de TTL en memoria (recomendado por Next.js para evitar unstable prerender errors)
  const ahora = performance.now();

  // 1. Servir desde caché si está vigente y no se fuerza el refresco
  if (!opciones.forzarRefresco && cacheTasasBcv) {
    const edad = ahora - cacheTasasBcv.timestamp;
    if (edad < CACHE_BCV_TTL_MS && cacheTasasBcv.datos.usd && cacheTasasBcv.datos.eur) {
      return cacheTasasBcv.datos;
    }
  }

  // 2. Intentar proveedor principal: DolarVZLA
  let resultado: TasasBcvCompletas | null = null;
  try {
    const response = await fetchConTimeout(DOLARVZLA_BCV_URL);
    if (response.ok) {
      const data: unknown = await response.json();
      const parseado = parsearRespuestaDolarVzla(data);
      if (parseado && parseado.usd && parseado.eur) {
        resultado = parseado;
      }
    } else {
      console.warn(
        `[bcv-service] DolarVZLA respondió ${response.status}, recurriendo a fallback`,
      );
    }
  } catch (error) {
    console.warn(
      "[bcv-service] Error o timeout en DolarVZLA, recurriendo a fallback:",
      error,
    );
  }

  // 3. Fallback secundario si DolarVZLA no resolvió
  if (!resultado) {
    resultado = await obtenerTasasDesdeDolarApi();
  }

  // 4. Guardar en caché si se obtuvo al menos una divisa válida
  if (resultado.usd || resultado.eur) {
    cacheTasasBcv = {
      datos: resultado,
      timestamp: ahora,
    };
  }

  return resultado;
}

/**
 * Obtiene la tasa oficial BCV para una divisa específica (USD o EUR).
 *
 * @param divisa - La divisa a consultar ("USD" o "EUR")
 * @param opciones - Opciones de consulta (permite forzar refresco)
 * @returns La tasa normalizada o null si falla
 */
export async function obtenerTasaBcv(
  divisa: "USD" | "EUR",
  opciones: OpcionesConsultaBcv = {},
): Promise<TasaBcv | null> {
  const tasas = await obtenerTasasBcvCompletas(opciones);
  return divisa === "USD" ? tasas.usd : tasas.eur;
}
