import { describe, expect, it } from "vitest";
import {
  obtenerTasaVigenteParaFecha,
  obtenerTasaProgramadaParaFecha,
  calcularVigenciaDesdeFechaBcv,
  esTasaBcvFutura,
  calcularConversionBsUsd,
  type TasaHistorica,
} from "@/lib/tasas/tasas";

describe("Doble Vigencia de Tasas y Presupuestos Futuros (Fase 16)", () => {
  // Escenario: El 12 de Octubre a las 4:30 PM, el BCV publica la tasa para el 13 de Octubre
  const tasaHoy: TasaHistorica = {
    id: "tasa-hoy",
    valor_bs_por_usd: 875.65,
    vigente_desde: "2026-10-12T04:00:00.000Z", // 2026-10-12 00:00:00 Caracas (UTC-4)
  };

  const tasaManana: TasaHistorica = {
    id: "tasa-manana",
    valor_bs_por_usd: 876.80,
    vigente_desde: "2026-10-13T04:00:00.000Z", // 2026-10-13 00:00:00 Caracas (UTC-4)
  };

  const historialConProgramada: TasaHistorica[] = [tasaHoy, tasaManana];

  describe("Resolución temporal de tasa vigente vs. programada", () => {
    it("mantiene la tasa de hoy para pedidos creados a las 4:30 PM a pesar de existir una tasa futura", () => {
      // 12 de Octubre a las 4:30 PM Caracas (20:30 UTC)
      const fechaOperacionTarde = new Date("2026-10-12T20:30:00.000Z");

      const vigente = obtenerTasaVigenteParaFecha(historialConProgramada, fechaOperacionTarde);
      expect(vigente).not.toBeNull();
      expect(vigente?.id).toBe("tasa-hoy");
      expect(vigente?.valor_bs_por_usd).toBe(875.65);
    });

    it("identifica la tasa de mañana como tasa futura programada a las 4:30 PM", () => {
      const fechaOperacionTarde = new Date("2026-10-12T20:30:00.000Z");

      const programada = obtenerTasaProgramadaParaFecha(historialConProgramada, fechaOperacionTarde);
      expect(programada).not.toBeNull();
      expect(programada?.id).toBe("tasa-manana");
      expect(programada?.valor_bs_por_usd).toBe(876.80);
    });

    it("activa automáticamente la tasa de mañana al cruzar la medianoche (00:01 AM)", () => {
      // 13 de Octubre a las 00:01 AM Caracas (04:01 UTC)
      const fechaMananaMadrugada = new Date("2026-10-13T04:01:00.000Z");

      const vigente = obtenerTasaVigenteParaFecha(historialConProgramada, fechaMananaMadrugada);
      expect(vigente).not.toBeNull();
      expect(vigente?.id).toBe("tasa-manana");
      expect(vigente?.valor_bs_por_usd).toBe(876.80);

      // A esa hora ya no hay tasa futura programada
      const programada = obtenerTasaProgramadaParaFecha(historialConProgramada, fechaMananaMadrugada);
      expect(programada).toBeNull();
    });
  });

  describe("Utilidades de fecha y detección de tasa BCV del siguiente día hábil", () => {
    it("convierte la fecha YYYY-MM-DD del BCV a ISO con inicio del día en hora Caracas (UTC-4)", () => {
      const isoInicioDia = calcularVigenciaDesdeFechaBcv("2026-10-13");
      // Medianoche en Caracas (UTC-4) corresponde a 04:00:00.000Z
      expect(new Date(isoInicioDia).toISOString()).toBe("2026-10-13T04:00:00.000Z");
    });

    it("detecta si la fecha publicada por el BCV corresponde a un día futuro respecto a la fecha actual", () => {
      // Supongamos que hoy en Caracas es 2026-10-12 a las 16:30
      const fechaActualCaracas = new Date("2026-10-12T20:30:00.000Z");

      // La API entrega date: '2026-10-13' -> es futura
      expect(esTasaBcvFutura("2026-10-13", fechaActualCaracas)).toBe(true);

      // La API entrega date: '2026-10-12' -> es de hoy, no futura
      expect(esTasaBcvFutura("2026-10-12", fechaActualCaracas)).toBe(false);

      // Caso fin de semana: Viernes por la tarde publica para el Lunes (2026-10-16 -> 2026-10-19)
      const viernesTarde = new Date("2026-10-16T20:30:00.000Z");
      expect(esTasaBcvFutura("2026-10-19", viernesTarde)).toBe(true);
    });
  });

  describe("Presupuestos y cotizaciones con tasa programada", () => {
    it("permite cotizar a tasa de mañana protegiendo el margen comercial sin alterar pedidos inmediatos", () => {
      const fechaTarde = new Date("2026-10-12T20:30:00.000Z");
      const vigente = obtenerTasaVigenteParaFecha(historialConProgramada, fechaTarde)!;
      const programada = obtenerTasaProgramadaParaFecha(historialConProgramada, fechaTarde)!;

      const ordenHoy = {
        totalUsd: 100,
        tasaId: vigente.id,
        tasaValor: vigente.valor_bs_por_usd,
        totalBs: calcularConversionBsUsd(100, vigente.valor_bs_por_usd),
      };

      const presupuestoManana = {
        totalUsd: 100,
        tasaId: programada.id,
        tasaValor: programada.valor_bs_por_usd,
        totalBs: calcularConversionBsUsd(100, programada.valor_bs_por_usd),
      };

      // La orden de hoy se cobra a Bs. 87,565.00
      expect(ordenHoy.totalBs).toBe(87565);
      // El presupuesto para mañana se cotiza a Bs. 87,680.00
      expect(presupuestoManana.totalBs).toBe(87680);
      expect(presupuestoManana.totalBs).toBeGreaterThan(ordenHoy.totalBs);
    });
  });
});
