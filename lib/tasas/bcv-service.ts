/**
 * Servicio de consumo de tasas BCV (Banco Central de Venezuela).
 *
 * Consume la API pública de DolarVZLA (rates.dolarvzla.com/bcv/current.json)
 * para obtener las tasas oficiales del USD y EUR en bolívares.
 * Incluye fallback secundario a DolarApi (ve.dolarapi.com) para alta disponibilidad.
 *
 * @module lib/tasas/bcv-service
 */

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

/** Resultado completo con ambas divisas */
export type TasasBcvCompletas = {
  usd: TasaBcv | null;
  eur: TasaBcv | null;
  error?: string;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const DOLARVZLA_BCV_URL = "https://rates.dolarvzla.com/bcv/current.json";
export const DOLARAPI_BASE = "https://ve.dolarapi.com/v1";

/** Timeout de 8 segundos para evitar bloquear la UI en caso de API lenta */
const FETCH_TIMEOUT_MS = 8_000;

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

  return {
    usd,
    eur,
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
    error:
      errores.length > 0
        ? `No se pudo obtener la tasa para: ${errores.join(", ")}`
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// API Pública
// ---------------------------------------------------------------------------

/**
 * Obtiene ambas tasas oficiales (USD y EUR) del BCV.
 *
 * Consulta primero la API de DolarVZLA (rates.dolarvzla.com/bcv/current.json).
 * Si falla, utiliza DolarApi como respaldo automático.
 *
 * @returns Objeto con ambas tasas y posible mensaje de error parcial
 */
export async function obtenerTasasBcvCompletas(): Promise<TasasBcvCompletas> {
  // 1. Intentar proveedor principal: DolarVZLA
  try {
    const response = await fetchConTimeout(DOLARVZLA_BCV_URL);
    if (response.ok) {
      const data: unknown = await response.json();
      const resultado = parsearRespuestaDolarVzla(data);
      if (resultado && resultado.usd && resultado.eur) {
        return resultado;
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

  // 2. Fallback secundario: DolarApi
  return obtenerTasasDesdeDolarApi();
}

/**
 * Obtiene la tasa oficial BCV para una divisa específica (USD o EUR).
 *
 * @param divisa - La divisa a consultar ("USD" o "EUR")
 * @returns La tasa normalizada o null si falla
 */
export async function obtenerTasaBcv(
  divisa: "USD" | "EUR",
): Promise<TasaBcv | null> {
  const tasas = await obtenerTasasBcvCompletas();
  return divisa === "USD" ? tasas.usd : tasas.eur;
}
