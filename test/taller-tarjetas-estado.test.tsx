import { describe, it, expect } from "vitest";
import { obtenerEstilosTarjetaTaller } from "@/lib/taller/estilos-tarjeta";

describe("Estilos de Tarjeta por Estado de Taller (Fase 33)", () => {
  it("debe retornar estilo con tinte azul zafiro tenue y botón neutral para 'recibido'", () => {
    const estilo = obtenerEstilosTarjetaTaller("recibido");

    expect(estilo.estado).toBe("recibido");
    expect(estilo.cardContainer).toContain("border");
    // Debe incluir tinte azul en claro y oscuro
    expect(estilo.cardContainer).toMatch(/blue|sky/i);
    // Botón de acción debe ser neutral (sin bg-sky-600 ni bg-blue-600)
    expect(estilo.btnAction).not.toMatch(/bg-sky-600|bg-blue-600/);
    expect(estilo.btnAction).toMatch(/zinc|\[#1f202c\]/);
    // Icono correspondiente: Play
    expect(estilo.iconoAccion).toBe("Play");
  });

  it("debe retornar estilo con tinte ámbar tenue y botón neutral para 'en_produccion'", () => {
    const estilo = obtenerEstilosTarjetaTaller("en_produccion");

    expect(estilo.estado).toBe("en_produccion");
    // Debe incluir tinte ámbar en claro y oscuro
    expect(estilo.cardContainer).toMatch(/amber/i);
    // Botón de acción debe ser neutral (sin bg-amber-600)
    expect(estilo.btnAction).not.toMatch(/bg-amber-600/);
    expect(estilo.btnAction).toMatch(/zinc|\[#1f202c\]/);
    // Icono correspondiente: Printer
    expect(estilo.iconoAccion).toBe("Printer");
  });

  it("debe retornar estilo con tinte esmeralda tenue y botón neutral para 'listo'", () => {
    const estilo = obtenerEstilosTarjetaTaller("listo");

    expect(estilo.estado).toBe("listo");
    // Debe incluir tinte esmeralda en claro y oscuro
    expect(estilo.cardContainer).toMatch(/emerald/i);
    // Botones de acción neutrales
    expect(estilo.btnAction).toMatch(/zinc|\[#1f202c\]/);
    // Icono correspondiente para entrega: PackageCheck
    expect(estilo.iconoAccion).toBe("PackageCheck");
  });

  it("debe retornar estilos para cobrar saldo que sean claros y sin colores chillones", () => {
    const estilo = obtenerEstilosTarjetaTaller("listo");
    // Botón de cobrar saldo debe tener jerarquía clara pero sobria
    expect(estilo.btnCobrarSaldo).toBeDefined();
    expect(estilo.btnCobrarSaldo).not.toContain("bg-amber-600");
    expect(estilo.iconoCobrar).toBe("HandCoins");
  });
});
