import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  obtenerTasaBcv,
  obtenerTasasBcvCompletas,
  type DolarApiResponse,
} from "@/lib/tasas/bcv-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

describe("bcv-service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("obtenerTasaBcv", () => {
    it("retorna la tasa USD correctamente desde DolarApi", async () => {
      const mockData = crearRespuestaDolarApi({ promedio: 875.6505 });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).not.toBeNull();
      expect(resultado!.moneda).toBe("USD");
      expect(resultado!.valorBs).toBe(875.6505);
      expect(resultado!.fuente).toContain("DolarApi");
    });

    it("retorna la tasa EUR correctamente desde DolarApi", async () => {
      const mockData = crearRespuestaDolarApi({
        moneda: "EUR",
        nombre: "Euro",
        promedio: 980.61472543,
      });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("EUR");

      expect(resultado).not.toBeNull();
      expect(resultado!.moneda).toBe("EUR");
      expect(resultado!.valorBs).toBe(980.61472543);
    });

    it("llama a la URL correcta para USD", async () => {
      const fetchMock = crearFetchMock(crearRespuestaDolarApi());
      globalThis.fetch = fetchMock;

      await obtenerTasaBcv("USD");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://ve.dolarapi.com/v1/dolares/oficial",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        }),
      );
    });

    it("llama a la URL correcta para EUR", async () => {
      const fetchMock = crearFetchMock(
        crearRespuestaDolarApi({ moneda: "EUR" }),
      );
      globalThis.fetch = fetchMock;

      await obtenerTasaBcv("EUR");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://ve.dolarapi.com/v1/euros/oficial",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        }),
      );
    });

    it("retorna null si la API responde con error HTTP", async () => {
      globalThis.fetch = crearFetchMock(null, { ok: false, status: 500 });

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).toBeNull();
    });

    it("retorna null si la respuesta no tiene un valor numérico válido", async () => {
      const mockData = crearRespuestaDolarApi({ promedio: 0 });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).toBeNull();
    });

    it("retorna null si el promedio es negativo", async () => {
      const mockData = crearRespuestaDolarApi({ promedio: -10 });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).toBeNull();
    });

    it("retorna null si el promedio no es finito", async () => {
      const mockData = crearRespuestaDolarApi({ promedio: Infinity });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).toBeNull();
    });

    it("retorna null si fetch lanza un error de red", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado).toBeNull();
    });

    it("usa venta como fallback si promedio es null/undefined", async () => {
      const mockData = {
        moneda: "USD",
        fuente: "oficial",
        nombre: "Dólar",
        compra: null,
        venta: 880.0,
        promedio: null,
        fechaActualizacion: "2026-10-09T00:00:00-04:00",
      };
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      // promedio es null/falsy, so it should fallback to venta
      expect(resultado).not.toBeNull();
      expect(resultado!.valorBs).toBe(880.0);
    });

    it("preserva la fecha de actualización de la API", async () => {
      const fecha = "2026-10-08T12:00:00-04:00";
      const mockData = crearRespuestaDolarApi({
        fechaActualizacion: fecha,
      });
      globalThis.fetch = crearFetchMock(mockData);

      const resultado = await obtenerTasaBcv("USD");

      expect(resultado!.fechaActualizacion).toBe(fecha);
    });
  });

  describe("obtenerTasasBcvCompletas", () => {
    it("retorna ambas tasas cuando ambas APIs responden", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        callCount++;
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
      expect(resultado.error).toBeUndefined();
      expect(callCount).toBe(2);
    });

    it("reporta error parcial si solo falla una divisa", async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/euros/")) {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(crearRespuestaDolarApi()),
        });
      });

      const resultado = await obtenerTasasBcvCompletas();

      expect(resultado.usd).not.toBeNull();
      expect(resultado.eur).toBeNull();
      expect(resultado.error).toContain("EUR");
    });

    it("reporta error completo si ambas APIs fallan", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve(null) });

      const resultado = await obtenerTasasBcvCompletas();

      expect(resultado.usd).toBeNull();
      expect(resultado.eur).toBeNull();
      expect(resultado.error).toContain("USD");
      expect(resultado.error).toContain("EUR");
    });
  });
});
