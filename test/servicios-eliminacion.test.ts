import { describe, it, expect } from "vitest";
import { validarEliminacionServicio } from "@/lib/validaciones/servicio";

describe("Borrado Seguro de Servicios del Catálogo (Fase 31)", () => {
  it("debe RECHAZAR la eliminación física si el servicio tiene pedidos asociados", () => {
    const resultado = validarEliminacionServicio({
      pedidosAsociadosCount: 4,
      servicioNombre: "Viniles",
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/no se puede eliminar/i);
    expect(resultado.error).toMatch(/asociado a 4 pedido\(s\) histórico\(s\)/i);
    expect(resultado.error).toMatch(/desactiva la casilla 'Activo'/i);
  });

  it("debe PERMITIR la eliminación física si el servicio NO tiene pedidos asociados (0 pedidos)", () => {
    const resultado = validarEliminacionServicio({
      pedidosAsociadosCount: 0,
      servicioNombre: "Servicio de Test Temporal",
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.error).toBeUndefined();
  });
});
