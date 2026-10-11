import { describe, expect, it } from "vitest";
import {
  puedeAnularPedido,
  validarMotivoAnulacion,
} from "@/lib/pedidos/anulacion";

describe("Anulación de pedidos y reglas de auditoría (T-024a / RF-16)", () => {
  it("valida que el motivo de anulación sea obligatorio y tenga longitud mínima", () => {
    // Vacío o espacios en blanco
    expect(validarMotivoAnulacion("").valido).toBe(false);
    expect(validarMotivoAnulacion("   ").valido).toBe(false);
    expect(validarMotivoAnulacion(null).valido).toBe(false);

    // Muy corto (< 5 caracteres)
    expect(validarMotivoAnulacion("chau").valido).toBe(false);
    expect(validarMotivoAnulacion("chau").error).toContain("mínimo");

    // Motivos válidos
    const valido1 = validarMotivoAnulacion("Cliente canceló por tiempo de entrega");
    expect(valido1.valido).toBe(true);
    expect(valido1.motivoLimpio).toBe("Cliente canceló por tiempo de entrega");

    const valido2 = validarMotivoAnulacion("   Error en las dimensiones cargadas en el archivo   ");
    expect(valido2.valido).toBe(true);
    expect(valido2.motivoLimpio).toBe("Error en las dimensiones cargadas en el archivo");

    // Límite de longitud máxima
    const muyLargo = "a".repeat(501);
    expect(validarMotivoAnulacion(muyLargo).valido).toBe(false);
  });

  it("verifica permisos de anulación según el perfil del usuario", () => {
    const pedidoActivo = { estado: "en_impresion", anulado: false };
    const pedidoYaAnulado = { estado: "en_impresion", anulado: true };

    // Solo perfil gerencial puede anular
    expect(puedeAnularPedido(pedidoActivo, "operativo").permitido).toBe(false);
    expect(puedeAnularPedido(pedidoActivo, "operativo").razon).toContain("gerencial");

    expect(puedeAnularPedido(pedidoActivo, "gerencial").permitido).toBe(true);

    // No se puede anular un pedido que ya está anulado
    expect(puedeAnularPedido(pedidoYaAnulado, "gerencial").permitido).toBe(false);
    expect(puedeAnularPedido(pedidoYaAnulado, "gerencial").razon).toContain("ya se encuentra anulado");
  });
});
