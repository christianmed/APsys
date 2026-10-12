import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  obtenerTasaBcv,
  obtenerTasasBcvCompletas,
  parsearRespuestaDolarVzla,
  parsearRespuestaDolarApi,
  DOLARVZLA_BCV_URL,
  type DolarVzlaBcvResponse,
  type DolarApiResponse,
} from "@/lib/tasas/bcv-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function crearRespuestaDolarVzla(
  overrides: Partial<DolarVzlaBcvResponse> = {},
): DolarVzlaBcvResponse {
  return {
    current: {
      date: "2026-10-13",
      usd: 876.7976,
      eur: 982.0045,
    },
    previous: {
      date: "2026-10-09",
      usd: 875.6505,
      eur: 980.6147,
    },
    changePercentage: {
      usd: 0.131,
      eur: 0.142,
    },
    ...overrides,
  };
}

function crearRespuestaDolarApi(
  overrides: Partial<DolarApiResponse> = {},
): DolarApiResponse {
  return {
    moneda: "USD",
    fuente: "oficial",
    nombre: "Dólar",
    compra: null,
    venta: null,
    promedio: 875.6505,
    fechaActualizacion: "2026-10-09T00:00:00-04:00",
    ...overrides,
  };
}

function crearFetchMock(
  data: unknown,
  options: { ok?: boolean; status?: number } = {},
): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: () => Promise.resolve(data),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("bcv-service (DolarVZLA + fallback DolarApi)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("parsearRespuestaDolarVzla", () => {
    it("parsea correctamente la respuesta estándar de DolarVZLA", () => {
      const mockData = crearRespuestaDolarVzla();
      const resultado = parsearRespuestaDolarVzla(mockData);

      expect(resultado).not.toBeNull();
      expect(resultado!.usd).not.toBeNull();
      expect(resultado!.eur).not.toBeNull();
      expect(resultado!.usd!.valorBs).toBe(876.7976);
      expect(resultado!.eur!.valorBs).toBe(982.0045);
      expect(resultado!.usd!.fuente).toBe("DolarVZLA (BCV)");
      expect(resultado!.usd!.fechaActualizacion).toBe("2026-10-13");
      expect(resultado!.usd!.variacionPorcentaje).toBe(0.131);
    });

    it("retorna null si la respuesta es inválida o no contiene current", () => {
      expect(parsearRespuestaDolarVzla(null)).toBeNull();
      expect(parsearRespuestaDolarVzla({})).toBeNull();
      expect(parsearRespuestaDolarVzla({ current: { usd: 0, eur: 0 } })).toBeNull();
    });
  });

  describe("parsearRespuestaDolarApi", () => {
    it("parsea correctamente respuesta de DolarApi (fallback)", () => {
      const mockData = crearRespuestaDolarApi({ promedio: 875.6505 });
      const resultado = parsearRespuestaDolarApi(mockData, "USD");

      expect(resultado).not.toBeNull();
      expect(resultado!.valorBs).toBe(875.6505);
      expect(resultado!.moneda).toBe("USD");
      expect(resultado!.fuente).toContain("DolarApi");
    });
  });

  describe("obtenerTasasBcvCompletas", () => {
    it("obtiene USD y EUR en una sola petición desde DolarVZLA (proveedor principal)", async () => {
      const mockData = crearRespuestaDolarVzla();
      const fetchMock = crearFetchMock(mockData);
      globalThis.fetch = fetchMock;

      const resultado = await obtenerTasasBcvCompletas();

      expect(fetchMock).toHaveBeenCalledWith(
        DOLARVZLA_BCV_URL,
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        }),
      );

      expect(resultado.usd).not.toBeNull();
      expect(resultado.eur).not.toBeNull();
      expect(resultado.usd!.valorBs).toBe(876.7976);
      expect(resultado.eur!.valorBs).toBe(982.0045);
      expect(resultado.usd!.fuente).toContain("DolarVZLA");
      expect(resultado.error).toBeUndefined();
    });

    it("recurre a DolarApi como fallback si DolarVZLA responde con error HTTP", async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("dolarvzla.com")) {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
        }
        const esEuro = url.includes("/euros/");
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve(
              crearRespuestaDolarApi({
                moneda: esEuro ? "EUR" : "USD",
                promedio: esEuro ? 980.61 : 875.65,
              }),
            ),
        });
      });

      const resultado = await obtenerTasasBcvCompletas();

      expect(resultado.usd).not.toBeNull();
      expect(resultado.eur).not.toBeNull();
      expect(resultado.usd!.valorBs).toBe(875.65);
      expect(resultado.eur!.valorBs).toBe(980.61);
      expect(resultado.usd!.fuente).toContain("DolarApi");
    });

    it("recurre a DolarApi si DolarVZLA lanza un error de red", async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("dolarvzla.com")) {
          return Promise.reject(new Error("Network connection lost"));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(crearRespuestaDolarApi()),
        });
      });

      const resultado = await obtenerTasasBcvCompletas();

      expect(resultado.usd).not.toBeNull();
      expect(resultado.usd!.valorBs).toBe(875.6505);
    });

    it("reporta error si tanto DolarVZLA como DolarApi fallan", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve(null),
      });

      const resultado = await obtenerTasasBcvCompletas();

      expect(resultado.usd).toBeNull();
      expect(resultado.eur).toBeNull();
      expect(resultado.error).toContain("USD");
      expect(resultado.error).toContain("EUR");
    });
  });

  describe("obtenerTasaBcv", () => {
    it("obtiene específicamente la tasa USD", async () => {
      const mockData = crearRespuestaDolarVzla({
        current: { date: "2026-10-13", usd: 876.7976, eur: 982.0045 },
      });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).not.toBeNull();
      expect(resultado!.moneda).toBe("USD");
      expect(resultado!.valorBs).toBe(876.7976);
    });

    it("obtiene específicamente la tasa EUR", async () => {
      const mockData = crearRespuestaDolarVzla({
        current: { date: "2026-10-13", usd: 876.7976, eur: 982.0045 },
      });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("EUR");

      expect(resultado).not.toBeNull();
      expect(resultado!.moneda).toBe("EUR");
      expect(resultado!.valorBs).toBe(982.0045);
    });
  });
});
