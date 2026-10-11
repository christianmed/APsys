import { describe, expect, it } from "vitest";
import {
  calcularConsolidadoIngresos,
  obtenerRangoFechasPreset,
  type PagoMétrica,
} from "@/lib/dashboard/ingresos";

describe("T-019 — Dashboard gerencial de ingresos por moneda y fechas (RF-11)", () => {
  const datasetPagos: PagoMétrica[] = [
    {
      id: "p1",
      pedidoId: "ord1",
      numeroOrden: 1,
      monto: 50.0,
      moneda: "USD",
      tasaValor: 40.0,
      creadoEn: "2026-10-10T10:00:00Z",
    },
    {
      id: "p2",
      pedidoId: "ord2",
      numeroOrden: 2,
      monto: 100.0,
      moneda: "USD",
      tasaValor: 40.0,
      creadoEn: "2026-10-10T14:30:00Z",
    },
    {
      id: "p3",
      pedidoId: "ord3",
      numeroOrden: 3,
      monto: 800.0,
      moneda: "Bs",
      tasaValor: 40.0, // 800 / 40 = $20.00 USD
      creadoEn: "2026-10-10T16:00:00Z",
    },
    {
      id: "p4",
      pedidoId: "ord4",
      numeroOrden: 4,
      monto: 1200.0,
      moneda: "Bs",
      tasaValor: 40.0, // 1200 / 40 = $30.00 USD
      creadoEn: "2026-10-09T09:00:00Z",
    },
  ];

  describe("consolidación matemática exacta", () => {
    it("totaliza al centavo los pagos en USD y Bs", () => {
      const consolidado = calcularConsolidadoIngresos(datasetPagos);

      expect(consolidado.totalUsd).toBe(150.0); // 50 + 100
      expect(consolidado.totalBs).toBe(2000.0); // 800 + 1200
      expect(consolidado.conteoPagosUsd).toBe(2);
      expect(consolidado.conteoPagosBs).toBe(2);
      expect(consolidado.totalPagosCount).toBe(4);
    });

    it("calcula el equivalente consolidado total en USD", () => {
      const consolidado = calcularConsolidadoIngresos(datasetPagos);

      // 150 USD + (800 / 40) + (1200 / 40) = 150 + 20 + 30 = 200.00 USD
      expect(consolidado.totalEquivalenteUsd).toBe(200.0);
    });

    it("maneja lista vacía sin errores retornando ceros", () => {
      const consolidado = calcularConsolidadoIngresos([]);

      expect(consolidado.totalUsd).toBe(0);
      expect(consolidado.totalBs).toBe(0);
      expect(consolidado.totalEquivalenteUsd).toBe(0);
      expect(consolidado.totalPagosCount).toBe(0);
    });
  });

  describe("filtrado por rangos de fecha", () => {
    it("filtra únicamente pagos dentro del rango especificado", () => {
      const consolidado = calcularConsolidadoIngresos(datasetPagos, {
        desde: "2026-10-10T00:00:00Z",
        hasta: "2026-10-10T23:59:59Z",
      });

      // Solo p1, p2, p3 están en fecha 2026-10-10
      expect(consolidado.totalUsd).toBe(150.0);
      expect(consolidado.totalBs).toBe(800.0);
      expect(consolidado.totalEquivalenteUsd).toBe(170.0); // 150 + (800 / 40)
      expect(consolidado.totalPagosCount).toBe(3);
    });
  });

  describe("cálculo de rangos preestablecidos (presets)", () => {
    it("calcula límites válidos para hoy, esta_semana y este_mes", () => {
      const ahora = new Date("2026-10-10T15:00:00Z");

      const rangoHoy = obtenerRangoFechasPreset("hoy", ahora);
      expect(rangoHoy.desde).toBeDefined();
      expect(rangoHoy.hasta).toBeDefined();
      expect(new Date(rangoHoy.desde).getTime()).toBeLessThanOrEqual(
        new Date(rangoHoy.hasta).getTime(),
      );

      const rangoMes = obtenerRangoFechasPreset("este_mes", ahora);
      expect(rangoMes.desde).toContain("2026-10-01");
    });
  });
});
