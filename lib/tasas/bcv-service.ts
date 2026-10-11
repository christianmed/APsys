/**
 * Servicio de consumo de tasas BCV (Banco Central de Venezuela).
 *
 * Consume la API pública de DolarApi (ve.dolarapi.com) para obtener las tasas
 * oficiales del USD y EUR en bolívares. Incluye fallback a rates.dolarvzla.com.
 *
 * @module lib/tasas/bcv-service
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Respuesta cruda de ve.dolarapi.com */
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

const DOLARAPI_BASE = "https://ve.dolarapi.com/v1";
const DOLARAPI_USD = `${DOLARAPI_BASE}/dolares/oficial`;
const DOLARAPI_EUR = `${DOLARAPI_BASE}/euros/oficial`;

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
 * Parsea y valida la respuesta de DolarApi para una divisa.
 */
function parsearRespuestaDolarApi(
  data: unknown,
  divisaEsperada: "USD" | "EUR",
): TasaBcv | null {
  if (!data || typeof data !== "object") return null;

  const resp = data as DolarApiResponse;

  // El campo "promedio" contiene el valor oficial cuando compra/venta son null
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

// ---------------------------------------------------------------------------
// API Pública
// ---------------------------------------------------------------------------

/**
 * Obtiene la tasa oficial BCV para una divisa específica (USD o EUR).
 *
 * @param divisa - La divisa a consultar ("USD" o "EUR")
 * @returns La tasa normalizada o null si falla
 */
export async function obtenerTasaBcv(
  divisa: "USD" | "EUR",
): Promise<TasaBcv | null> {
  const url = divisa === "USD" ? DOLARAPI_USD : DOLARAPI_EUR;

  try {
    const response = await fetchConTimeout(url);

    if (!response.ok) {
      console.warn(
        `[bcv-service] DolarApi respondió ${response.status} para ${divisa}`,
      );
      return null;
    }

    const data: unknown = await response.json();
    return parsearRespuestaDolarApi(data, divisa);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn(
        `[bcv-service] Timeout al consultar tasa ${divisa} en DolarApi`,
      );
    } else {
      console.warn(`[bcv-service] Error al consultar tasa ${divisa}:`, error);
    }
    return null;
  }
}

/**
 * Obtiene ambas tasas oficiales (USD y EUR) de forma paralela.
 * Si una falla, la otra puede tener éxito de manera independiente.
 *
 * @returns Objeto con ambas tasas y posible mensaje de error parcial
 */
export async function obtenerTasasBcvCompletas(): Promise<TasasBcvCompletas> {
  const [usd, eur] = await Promise.all([
    obtenerTasaBcv("USD"),
    obtenerTasaBcv("EUR"),
  ]);

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
