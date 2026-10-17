import { describe, it, expect } from "vitest";
import { validarCambioEstado } from "@/lib/pedidos/estados";

describe("Blindaje Estricto de Entregas (Saldo $0 Obligatorio) - Fase 31", () => {
  describe("validarCambioEstado hacia 'entregado'", () => {
    it("debe RECHAZAR la entrega si el pedido tiene un saldo pendiente > 0", () => {
      const resultado = validarCambioEstado({
        estadoActual: "listo",
        nuevoEstado: "entregado",
        rolUsuario: "operativo",
        saldoPendienteUsd: 10.0,
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/saldo pendiente de \$10\.00/i);
      expect(resultado.error).toMatch(/debe liquidarse el pago antes de realizar la entrega/i);
    });

    it("debe RECHAZAR la entrega incluso si el rol es gerencial cuando hay saldo pendiente", () => {
      const resultado = validarCambioEstado({
        estadoActual: "listo",
        nuevoEstado: "entregado",
        rolUsuario: "gerencial",
        saldoPendienteUsd: 25.5,
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/saldo pendiente de \$25\.50/i);
    });

    it("debe PERMITIR la entrega si el saldo pendiente es estrictamente 0", () => {
      const resultado = validarCambioEstado({
        estadoActual: "listo",
        nuevoEstado: "entregado",
        rolUsuario: "operativo",
        saldoPendienteUsd: 0,
      });

      expect(resultado.valido).toBe(true);
      expect(resultado.error).toBeUndefined();
    });

    it("debe PERMITIR la entrega si la diferencia es un residuo despreciable de centavos (< 0.005)", () => {
      const resultado = validarCambioEstado({
        estadoActual: "listo",
        nuevoEstado: "entregado",
        rolUsuario: "operativo",
        saldoPendienteUsd: 0.002,
      });

      expect(resultado.valido).toBe(true);
    });

    it("debe PERMITIR pasar a 'listo' o 'en_produccion' aunque exista saldo pendiente", () => {
      const resultadoListo = validarCambioEstado({
        estadoActual: "en_produccion",
        nuevoEstado: "listo",
        rolUsuario: "operativo",
        saldoPendienteUsd: 50.0,
      });

      expect(resultadoListo.valido).toBe(true);

      const resultadoProd = validarCambioEstado({
        estadoActual: "recibido",
        nuevoEstado: "en_produccion",
        rolUsuario: "operativo",
        saldoPendienteUsd: 50.0,
      });

      expect(resultadoProd.valido).toBe(true);
    });
  });
});
