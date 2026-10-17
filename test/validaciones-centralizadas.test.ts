import { describe, expect, it } from "vitest";
import {
  esUuidValido,
  limpiarTexto,
  normalizarTelefono,
  validarEntradaCliente,
  validarEntradaPedido,
  validarEntradaPago,
} from "@/lib/validaciones";

describe("Validaciones Comunes", () => {
  it("valida UUIDs v4 correctamente", () => {
    expect(esUuidValido("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(esUuidValido("c2f10b8e-5b12-4f3b-b2f5-2a6288ffbc66")).toBe(true);
    expect(esUuidValido("not-a-uuid")).toBe(false);
    expect(esUuidValido("123e4567-e89b-12d3-a456")).toBe(false);
    expect(esUuidValido("")).toBe(false);
  });

  it("limpia textos y recorta espacios de control", () => {
    expect(limpiarTexto("  Hola Mundo  ")).toBe("Hola Mundo");
    expect(limpiarTexto("")).toBeNull();
    expect(limpiarTexto("   ")).toBeNull();
    expect(limpiarTexto(null)).toBeNull();
    expect(limpiarTexto(undefined)).toBeNull();
  });

  it("normaliza números de teléfono eliminando espacios redundantes", () => {
    expect(normalizarTelefono(" 0414 123 4567 ")).toBe("0414 123 4567");
    expect(normalizarTelefono("+58   412  0001122")).toBe("+58 412 0001122");
    expect(normalizarTelefono("   ")).toBeNull();
    expect(normalizarTelefono(null)).toBeNull();
  });
});

describe("Validación de Cliente", () => {
  it("acepta un cliente válido", () => {
    const res = validarEntradaCliente({
      nombre: " Inversiones Gráficas 2026, C.A. ",
      telefono: "0414 1234567",
      notas: " Cliente frecuente de pendones ",
    });

    expect(res.exito).toBe(true);
    if (res.exito) {
      expect(res.datos.nombre).toBe("Inversiones Gráficas 2026, C.A.");
      expect(res.datos.telefono).toBe("0414 1234567");
      expect(res.datos.notas).toBe("Cliente frecuente de pendones");
    }
  });

  it("rechaza cliente sin nombre o solo espacios", () => {
    const res = validarEntradaCliente({
      nombre: "   ",
      telefono: "0412 1112233",
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores.nombre).toBeDefined();
    }
  });

  it("rechaza cliente con nombre excesivamente largo (> 150 caracteres)", () => {
    const res = validarEntradaCliente({
      nombre: "A".repeat(151),
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores.nombre).toContain("150 caracteres");
    }
  });
});

describe("Validación de Pedido", () => {
  const clienteIdValido = "c2f10b8e-5b12-4f3b-b2f5-2a6288ffbc66";
  const servicioIdValido = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("acepta un pedido con renglones válidos", () => {
    const res = validarEntradaPedido({
      cliente_id: clienteIdValido,
      notas: "Entrega urgente para el viernes",
      items: [
        {
          servicio_id: servicioIdValido,
          descripcion: "Pendón 1.20 x 2.00 con tubos y cordón",
          dimensiones: "1.20 x 2.00",
          acabados: "Tubos y cordón",
          cantidad: 2,
          precio_usd: 15.5,
        },
      ],
    });

    expect(res.exito).toBe(true);
    if (res.exito) {
      expect(res.datos.cliente_id).toBe(clienteIdValido);
      expect(res.datos.items).toHaveLength(1);
      expect(res.datos.items[0].precio_usd).toBe(15.5);
      expect(res.datos.items[0].cantidad).toBe(2);
    }
  });

  it("rechaza pedido con cliente_id inválido", () => {
    const res = validarEntradaPedido({
      cliente_id: "cliente-invalido",
      items: [
        {
          servicio_id: servicioIdValido,
          cantidad: 1,
          precio_usd: 10,
        },
      ],
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores.cliente_id).toBeDefined();
    }
  });

  it("rechaza pedido sin ítems", () => {
    const res = validarEntradaPedido({
      cliente_id: clienteIdValido,
      items: [],
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores.items).toBeDefined();
    }
  });

  it("rechaza ítem con precio negativo o cantidad menor a 1", () => {
    const res = validarEntradaPedido({
      cliente_id: clienteIdValido,
      items: [
        {
          servicio_id: servicioIdValido,
          cantidad: 0,
          precio_usd: -5,
        },
      ],
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores["items[0].cantidad"]).toBeDefined();
      expect(res.errores["items[0].precio_usd"]).toBeDefined();
    }
  });
});

describe("Validación de Pago / Abono", () => {
  const pedidoIdValido = "c2f10b8e-5b12-4f3b-b2f5-2a6288ffbc66";

  it("acepta abonos válidos en USD y Bs", () => {
    const pagoUsd = validarEntradaPago({
      pedido_id: pedidoIdValido,
      monto: 25.5,
      moneda: "USD",
      referencia: "Zelle John Doe",
    });

    expect(pagoUsd.exito).toBe(true);
    if (pagoUsd.exito) {
      expect(pagoUsd.datos.monto).toBe(25.5);
      expect(pagoUsd.datos.moneda).toBe("USD");
      expect(pagoUsd.datos.referencia).toBe("Zelle John Doe");
    }

    const pagoBs = validarEntradaPago({
      pedido_id: pedidoIdValido,
      monto: "1500.00",
      moneda: "Bs",
      referencia: "PagoMovil 9876",
    });

    expect(pagoBs.exito).toBe(true);
    if (pagoBs.exito) {
      expect(pagoBs.datos.monto).toBe(1500);
      expect(pagoBs.datos.moneda).toBe("Bs");
    }
  });

  it("rechaza montos menores o iguales a cero", () => {
    const pagoCero = validarEntradaPago({
      pedido_id: pedidoIdValido,
      monto: 0,
      moneda: "USD",
    });
    expect(pagoCero.exito).toBe(false);

    const pagoNegativo = validarEntradaPago({
      pedido_id: pedidoIdValido,
      monto: -10,
      moneda: "USD",
    });
    expect(pagoNegativo.exito).toBe(false);
  });

  it("rechaza moneda inválida", () => {
    const res = validarEntradaPago({
      pedido_id: pedidoIdValido,
      monto: 50,
      moneda: "EUR", // APSys solo admite cobros en USD o Bs
    });

    expect(res.exito).toBe(false);
    if (!res.exito) {
      expect(res.errores.moneda).toBeDefined();
    }
  });
});
