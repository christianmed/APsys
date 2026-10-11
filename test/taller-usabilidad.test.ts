import { describe, expect, it } from "vitest";
import {
  esTransicionValida,
  obtenerSiguienteEstadoSugerido,
  type EstadoPedido,
} from "@/lib/pedidos/estados";

/**
 * Pruebas de usabilidad para la vista de taller (RF-07 / T-014).
 * Regla: el operario de taller debe poder transicionar el pedido en <= 2 toques.
 */
describe("T-014 — usabilidad de taller (RF-07)", () => {
  it("cada estado activo tiene una acción primaria sugerida a 1 toque", () => {
    // 1 toque: de recibido a en_producción
    const siguienteRecibido = obtenerSiguienteEstadoSugerido("recibido");
    expect(siguienteRecibido).toBe("en_produccion");
    expect(esTransicionValida("recibido", siguienteRecibido!)).toBe(true);

    // 1 toque: de en_producción a listo
    const siguienteProd = obtenerSiguienteEstadoSugerido("en_produccion");
    expect(siguienteProd).toBe("listo");
    expect(esTransicionValida("en_produccion", siguienteProd!)).toBe(true);

    // 1 toque: de listo a entregado
    const siguienteListo = obtenerSiguienteEstadoSugerido("listo");
    expect(siguienteListo).toBe("entregado");
    expect(esTransicionValida("listo", siguienteListo!)).toBe(true);
  });

  it("los estados finales no tienen avance sugerido", () => {
    expect(obtenerSiguienteEstadoSugerido("entregado")).toBeNull();
    expect(obtenerSiguienteEstadoSugerido("cancelado")).toBeNull();
  });

  it("filtro de pedidos activos para taller descarta entregados y anulados", () => {
    const pedidos = [
      { id: "1", estado: "recibido" as EstadoPedido, anulado: false },
      { id: "2", estado: "en_produccion" as EstadoPedido, anulado: false },
      { id: "3", estado: "listo" as EstadoPedido, anulado: false },
      { id: "4", estado: "entregado" as EstadoPedido, anulado: false },
      { id: "5", estado: "recibido" as EstadoPedido, anulado: true },
    ];

    const activosTaller = pedidos.filter(
      (p) => !p.anulado && (p.estado === "recibido" || p.estado === "en_produccion" || p.estado === "listo"),
    );

    expect(activosTaller).toHaveLength(3);
    expect(activosTaller.map((p) => p.id)).toEqual(["1", "2", "3"]);
  });
});
