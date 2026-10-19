import { describe, it, expect } from "vitest";
import {
  formatearFechaLargaCaracas,
  formatearFechaCortaCaracas,
  formatearFechaHoraCaracas,
  obtenerInicioFinDiaCaracas,
  obtenerRangoPresetCaracas,
  obtenerTiempoHastaMedianocheCaracas,
  obtenerFechaYmdCaracas,
} from "@/lib/fechas";

describe("Módulo Centralizado de Fechas Caracas (lib/fechas.ts) - TDD Fase 32", () => {
  // Domingo 18 de Octubre de 2026 a las 9:30 p. m. hora Caracas (UTC-4)
  // En UTC corresponde a: 2026-10-19T01:30:00.000Z (Lunes en el servidor)
  const fechaDomingoNocheCaracas = new Date("2026-10-19T01:30:00.000Z");

  describe("Inmunidad a la zona horaria del servidor (UTC vs America/Caracas)", () => {
    it("debe formatear como domingo 18 de octubre aún cuando en UTC ya sea lunes 19", () => {
      const fechaTexto = formatearFechaLargaCaracas(fechaDomingoNocheCaracas);
      // Debe contener domingo y 18, NO lunes ni 19
      expect(fechaTexto.toLowerCase()).toContain("domingo");
      expect(fechaTexto.toLowerCase()).toContain("18");
      expect(fechaTexto.toLowerCase()).toContain("octubre");
      expect(fechaTexto).not.toContain("lunes");
      expect(fechaTexto).not.toContain("19");
    });

    it("debe extraer la fecha YMD exacta de Caracas (2026-10-18)", () => {
      const ymd = obtenerFechaYmdCaracas(fechaDomingoNocheCaracas);
      expect(ymd).toBe("2026-10-18");
    });

    it("debe formatear fecha corta en formato DD/MM/AAAA para Caracas", () => {
      const corta = formatearFechaCortaCaracas(fechaDomingoNocheCaracas);
      expect(corta).toBe("18/10/2026");
    });

    it("debe formatear fecha y hora precisa en Caracas", () => {
      const fechaHora = formatearFechaHoraCaracas(fechaDomingoNocheCaracas);
      expect(fechaHora).toContain("18");
      expect(fechaHora).toContain("oct");
      expect(fechaHora).toContain("2026");
      // 9:30 p. m. o 21:30 en Caracas
      expect(fechaHora).toMatch(/0?9:30|21:30/);
    });
  });

  describe("Límites exactos de inicio y fin de jornada en Caracas", () => {
    it("debe calcular el inicio del día a las 00:00:00 y fin a las 23:59:59 de Caracas", () => {
      const { desde, hasta } = obtenerInicioFinDiaCaracas(fechaDomingoNocheCaracas);

      // Caracas es UTC-4:
      // 2026-10-18 00:00:00 Caracas = 2026-10-18T04:00:00.000Z
      // 2026-10-18 23:59:59.999 Caracas = 2026-10-19T03:59:59.999Z
      expect(desde).toBe("2026-10-18T04:00:00.000Z");
      expect(hasta).toBe("2026-10-19T03:59:59.999Z");
    });

    it("debe calcular correctamente los milisegundos restantes hasta la medianoche de Caracas", () => {
      // Si son las 21:30 en Caracas, faltan exactamente 2 horas y 30 minutos para medianoche
      // 2.5 horas = 2.5 * 3600 * 1000 = 9,000,000 ms
      const msRestantes = obtenerTiempoHastaMedianocheCaracas(fechaDomingoNocheCaracas);
      expect(msRestantes).toBe(2.5 * 3600 * 1000);
    });
  });

  describe("Rangos para Dashboard y Reportes (obtenerRangoPresetCaracas)", () => {
    it("debe calcular el rango de 'hoy' en Caracas sin saltar de día en horas nocturnas", () => {
      const rangoHoy = obtenerRangoPresetCaracas("hoy", fechaDomingoNocheCaracas);
      expect(rangoHoy.desde).toBe("2026-10-18T04:00:00.000Z");
      expect(rangoHoy.hasta).toBe("2026-10-19T03:59:59.999Z");
    });

    it("debe calcular el rango de 'este_mes' anclado al mes calendario de Caracas", () => {
      const rangoMes = obtenerRangoPresetCaracas("este_mes", fechaDomingoNocheCaracas);
      // 1 de Octubre 00:00 Caracas = 2026-10-01T04:00:00.000Z
      // 31 de Octubre 23:59:59.999 Caracas = 2026-11-01T03:59:59.999Z
      expect(rangoMes.desde).toBe("2026-10-01T04:00:00.000Z");
      expect(rangoMes.hasta).toBe("2026-11-01T03:59:59.999Z");
    });

    it("debe calcular el rango de 'todo' abarcando el histórico completo", () => {
      const rangoTodo = obtenerRangoPresetCaracas("todo", fechaDomingoNocheCaracas);
      expect(new Date(rangoTodo.desde).getFullYear()).toBeLessThanOrEqual(2020);
      expect(new Date(rangoTodo.hasta).getFullYear()).toBeGreaterThanOrEqual(2030);
    });
  });
});
