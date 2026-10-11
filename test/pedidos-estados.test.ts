import { describe, expect, it } from "vitest";
import {
  esTransicionValida,
  obtenerSiguienteEstadoSugerido,
  validarCambioEstado,
} from "@/lib/pedidos/estados";

describe("T-013a — máquina de estados de pedidos (RF-05)", () => {
  it("transiciones válidas hacia adelante del ciclo de vida", () => {
    expect(esTransicionValida("recibido", "en_produccion")).toBe(true);
    expect(esTransicionValida("en_produccion", "listo")).toBe(true);
    expect(esTransicionValida("listo", "entregado")).toBe(true);
  });

  it("retrocesos permitidos para correcciones en taller", () => {
    // Si un material listo requiere reimpresión o corrección, puede volver a producción
    expect(esTransicionValida("listo", "en_produccion")).toBe(true);
    // Si un pedido en producción se pausa o reasigna, puede volver a recibido
    expect(esTransicionValida("en_produccion", "recibido")).toBe(true);
  });

  it("transiciones inválidas (saltos ilegales en el flujo)", () => {
    // No puede saltar de recibido directamente a entregado sin producirse
    expect(esTransicionValida("recibido", "entregado")).toBe(false);
    // Un pedido ya entregado es un estado final que no puede volver a producción
    expect(esTransicionValida("entregado", "en_produccion")).toBe(false);
    expect(esTransicionValida("entregado", "recibido")).toBe(false);
    // Un pedido cancelado no puede transicionar directamente
    expect(esTransicionValida("cancelado", "entregado")).toBe(false);
  });

  it("cancelación: sólo gerencial puede cancelar y requiere motivo obligatorio", () => {
    // Operativo intentando cancelar
    const resOperativo = validarCambioEstado({
      estadoActual: "recibido",
      nuevoEstado: "cancelado",
      rolUsuario: "operativo",
      motivoCancelacion: "Cliente se arrepintió",
    });
    expect(resOperativo.valido).toBe(false);
    expect(resOperativo.error).toBe(
      "Solo el perfil gerencial puede cancelar o anular un pedido.",
    );

    // Gerencial sin motivo
    const resSinMotivo = validarCambioEstado({
      estadoActual: "recibido",
      nuevoEstado: "cancelado",
      rolUsuario: "gerencial",
      motivoCancelacion: "   ",
    });
    expect(resSinMotivo.valido).toBe(false);
    expect(resSinMotivo.error).toBe(
      "Debe ingresar un motivo obligatorio para cancelar el pedido.",
    );

    // Gerencial con motivo válido
    const resValido = validarCambioEstado({
      estadoActual: "recibido",
      nuevoEstado: "cancelado",
      rolUsuario: "gerencial",
      motivoCancelacion: "Archivo con resolución insuficiente, cliente desistió",
    });
    expect(resValido.valido).toBe(true);
    expect(resValido.motivoLimpio).toBe(
      "Archivo con resolución insuficiente, cliente desistió",
    );
  });

  it("operativo puede avanzar estados regulares", () => {
    const res = validarCambioEstado({
      estadoActual: "recibido",
      nuevoEstado: "en_produccion",
      rolUsuario: "operativo",
    });
    expect(res.valido).toBe(true);
  });

  it("siguiente estado sugerido para acciones rápidas en ≤ 2 toques", () => {
    expect(obtenerSiguienteEstadoSugerido("recibido")).toBe("en_produccion");
    expect(obtenerSiguienteEstadoSugerido("en_produccion")).toBe("listo");
    expect(obtenerSiguienteEstadoSugerido("listo")).toBe("entregado");
    expect(obtenerSiguienteEstadoSugerido("entregado")).toBeNull();
    expect(obtenerSiguienteEstadoSugerido("cancelado")).toBeNull();
  });
});
