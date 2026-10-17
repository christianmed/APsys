import { describe, it, expect } from "vitest";
import {
  describirEstadoVigencia,
  formatearEtiquetaSidebar,
  calcularDiferenciaDiasCaracas,
} from "@/lib/tasas/tasas";

describe("Lógica de Calendario Bancario y Dinámica de Vigencias (Fase 30)", () => {
  // Configuración de fechas de prueba en Caracas (UTC-4)
  // 16/10/2026 = Viernes
  // 17/10/2026 = Sábado
  // 18/10/2026 = Domingo
  // 19/10/2026 = Lunes
  // 20/10/2026 = Martes
  // 21/10/2026 = Miércoles

  const fechaViernes16 = new Date("2026-10-16T15:00:00-04:00");
  const fechaSabado17 = new Date("2026-10-17T11:00:00-04:00");
  const fechaDomingo18 = new Date("2026-10-18T14:30:00-04:00");
  const fechaMartes20 = new Date("2026-10-20T10:00:00-04:00");

  describe("calcularDiferenciaDiasCaracas", () => {
    it("debe calcular 0 días si las fechas corresponden al mismo día en Caracas", () => {
      const d1 = "2026-10-17T04:00:00-04:00";
      const diff = calcularDiferenciaDiasCaracas(d1, fechaSabado17);
      expect(diff).toBe(0);
    });

    it("debe calcular -1 día si la fecha de vigencia fue ayer (viernes vs sábado)", () => {
      const dViernes = "2026-10-16T00:00:00-04:00";
      const diff = calcularDiferenciaDiasCaracas(dViernes, fechaSabado17);
      expect(diff).toBe(-1);
    });

    it("debe calcular +2 días si la fecha es el lunes evaluada desde el sábado", () => {
      const dLunes = "2026-10-19T00:00:00-04:00";
      const diff = calcularDiferenciaDiasCaracas(dLunes, fechaSabado17);
      expect(diff).toBe(2);
    });
  });

  describe("describirEstadoVigencia (para la tarjeta de Histórico en /tasas)", () => {
    it("un sábado, la tasa del viernes (activa) debe tener badge 'Vigente (Fin de semana)'", () => {
      const vigenciaViernes = "2026-10-16T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaViernes,
        esLaVigente: true,
        fechaReferencia: fechaSabado17,
      });

      expect(resultado.tipo).toBe("vigente_fin_de_semana");
      expect(resultado.etiquetaBadge).toBe("Vigente (Fin de semana)");
      expect(resultado.esActiva).toBe(true);
    });

    it("un domingo, la tasa del viernes (activa) debe tener badge 'Vigente (Fin de semana)'", () => {
      const vigenciaViernes = "2026-10-16T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaViernes,
        esLaVigente: true,
        fechaReferencia: fechaDomingo18,
      });

      expect(resultado.tipo).toBe("vigente_fin_de_semana");
      expect(resultado.etiquetaBadge).toBe("Vigente (Fin de semana)");
    });

    it("un sábado, la tasa del lunes (programada) debe tener badge 'Programada (Lunes)'", () => {
      const vigenciaLunes = "2026-10-19T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaLunes,
        esLaVigente: false,
        fechaReferencia: fechaSabado17,
      });

      expect(resultado.tipo).toBe("programada_proximo_dia_habil");
      expect(resultado.etiquetaBadge).toBe("Programada (Lunes)");
      expect(resultado.descripcionOperativa).toContain("Lunes");
    });

    it("en un día entre semana habitual, la tasa del día debe ser 'Vigente (Hoy)'", () => {
      const vigenciaMartes = "2026-10-20T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaMartes,
        esLaVigente: true,
        fechaReferencia: fechaMartes20,
      });

      expect(resultado.tipo).toBe("vigente_hoy");
      expect(resultado.etiquetaBadge).toBe("Vigente (Hoy)");
    });

    it("en un día entre semana habitual, la tasa del día siguiente debe ser 'Programada (Mañana)'", () => {
      const vigenciaMiercoles = "2026-10-21T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaMiercoles,
        esLaVigente: false,
        fechaReferencia: fechaMartes20,
      });

      expect(resultado.tipo).toBe("programada_manana");
      expect(resultado.etiquetaBadge).toBe("Programada (Mañana)");
    });

    it("una tasa anterior que ya no es vigente debe ser 'Histórica'", () => {
      const vigenciaJueves = "2026-10-15T00:00:00-04:00";
      const resultado = describirEstadoVigencia({
        fechaVigencia: vigenciaJueves,
        esLaVigente: false,
        fechaReferencia: fechaSabado17,
      });

      expect(resultado.tipo).toBe("historica");
      expect(resultado.etiquetaBadge).toBe("Histórica");
    });
  });

  describe("formatearEtiquetaSidebar (para el widget del Sidebar)", () => {
    it("en fin de semana (sábado con tasa de viernes), debe formatear como 'Vigente • 16/10/2026'", () => {
      const etiqueta = formatearEtiquetaSidebar({
        fechaVigencia: "2026-10-16",
        esTasaActiva: true,
        fechaReferencia: fechaSabado17,
      });
      expect(etiqueta).toBe("Vigente • 16/10/2026");
    });

    it("en fin de semana (sábado con tasa de lunes), debe formatear como 'Lunes, 19/10/2026'", () => {
      const etiqueta = formatearEtiquetaSidebar({
        fechaVigencia: "2026-10-19",
        esTasaActiva: false,
        fechaReferencia: fechaSabado17,
      });
      expect(etiqueta).toBe("Lunes, 19/10/2026");
    });

    it("en día normal (martes con tasa de martes), debe formatear como 'Hoy, 20/10/2026'", () => {
      const etiqueta = formatearEtiquetaSidebar({
        fechaVigencia: "2026-10-20",
        esTasaActiva: true,
        fechaReferencia: fechaMartes20,
      });
      expect(etiqueta).toBe("Hoy, 20/10/2026");
    });

    it("en día normal (martes con tasa de miércoles), debe formatear como 'Mañana, 21/10/2026'", () => {
      const etiqueta = formatearEtiquetaSidebar({
        fechaVigencia: "2026-10-21",
        esTasaActiva: false,
        fechaReferencia: fechaMartes20,
      });
      expect(etiqueta).toBe("Mañana, 21/10/2026");
    });
  });
});
