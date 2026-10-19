import { describe, it, expect } from "vitest";
import { calcularContadoresProduccion } from "@/lib/pedidos/estados";

describe("Contadores de Producción en Vivo (Fase 32 - Consistencia Home vs Taller)", () => {
  const pedidosEjemplo = [
    { id: "1", estado: "recibido", anulado: false },
    { id: "2", estado: "recibido", anulado: false },
    { id: "3", estado: "en_produccion", anulado: false },
    { id: "4", estado: "en_produccion", anulado: false },
    { id: "5", estado: "listo", anulado: false },
    { id: "6", estado: "listo", anulado: false },
    { id: "7", estado: "entregado", anulado: false }, // No activo
    { id: "8", estado: "cancelado", anulado: false }, // No activo
  ];

  it("debe calcular exactamente los contadores usando los estados canónicos del taller", () => {
    const contadores = calcularContadoresProduccion(pedidosEjemplo);

    expect(contadores.porIniciar).toBe(2);
    expect(contadores.enProduccion).toBe(2);
    expect(contadores.listos).toBe(2);
    // Activas en taller = 2 + 2 + 2 = 6
    expect(contadores.totalActivos).toBe(6);
  });

  it("no debe contabilizar pedidos anulados o cancelados como activos", () => {
    const conAnulados = [
      ...pedidosEjemplo,
      { id: "9", estado: "recibido", anulado: true },
      { id: "10", estado: "en_produccion", anulado: true },
    ];

    const contadores = calcularContadoresProduccion(conAnulados);

    expect(contadores.porIniciar).toBe(2);
    expect(contadores.enProduccion).toBe(2);
    expect(contadores.totalActivos).toBe(6);
  });

  it("debe devolver 0 si la lista está vacía", () => {
    const contadores = calcularContadoresProduccion([]);
    expect(contadores.porIniciar).toBe(0);
    expect(contadores.enProduccion).toBe(0);
    expect(contadores.listos).toBe(0);
    expect(contadores.totalActivos).toBe(0);
  });
});
