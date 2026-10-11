import { describe, expect, it } from "vitest";
import {
  calcularTotalPedido,
  validarDatosPedido,
  type ItemPedidoEntrada,
} from "@/app/pedidos/validaciones";

describe("validarDatosPedido — validaciones de entrada", () => {
  const CLIENTE_VALIDO_ID = "11111111-1111-4111-8111-111111111111";
  const SERVICIO_VALIDO_ID = "22222222-2222-4222-8222-222222222222";

  const itemBaseValido: ItemPedidoEntrada = {
    servicio_id: SERVICIO_VALIDO_ID,
    descripcion: "Pendón promocional",
    dimensiones: "1.20 x 0.80 m",
    acabados: "Ojetes perimetrales",
    cantidad: 2,
    precio_usd: 15.5,
  };

  it("cliente_id vacío → error de obligatorio", () => {
    const res = validarDatosPedido({
      cliente_id: "",
      notas: null,
      items: [itemBaseValido],
    });

    expect(res.errores.cliente_id).toBe("Debe seleccionar un cliente.");
  });

  it("cliente_id con formato inválido → error de cliente inválido", () => {
    const res = validarDatosPedido({
      cliente_id: "no-es-un-uuid",
      notas: null,
      items: [itemBaseValido],
    });

    expect(res.errores.cliente_id).toBe(
      "El identificador del cliente no es válido.",
    );
  });

  it("lista de items vacía → error de items requeridos", () => {
    const res = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [],
    });

    expect(res.errores.items).toBe(
      "El pedido debe contener al menos un servicio o ítem.",
    );
  });

  it("item sin servicio_id → error en el ítem", () => {
    const res = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [{ ...itemBaseValido, servicio_id: "" }],
    });

    expect(res.errores["items[0].servicio_id"]).toBe(
      "Debe seleccionar un servicio.",
    );
  });

  it("item con cantidad <= 0 o no entera → error en cantidad", () => {
    const resCero = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [{ ...itemBaseValido, cantidad: 0 }],
    });
    const resDecimal = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [{ ...itemBaseValido, cantidad: 1.5 }],
    });

    expect(resCero.errores["items[0].cantidad"]).toBe(
      "La cantidad debe ser un número entero mayor a 0.",
    );
    expect(resDecimal.errores["items[0].cantidad"]).toBe(
      "La cantidad debe ser un número entero mayor a 0.",
    );
  });

  it("item con precio_usd negativo o inválido → error en precio", () => {
    const resNegativo = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [{ ...itemBaseValido, precio_usd: -5 }],
    });
    const resNaN = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items: [{ ...itemBaseValido, precio_usd: Number.NaN }],
    });

    expect(resNegativo.errores["items[0].precio_usd"]).toBe(
      "El precio unitario debe ser mayor o igual a 0.",
    );
    expect(resNaN.errores["items[0].precio_usd"]).toBe(
      "El precio unitario debe ser mayor o igual a 0.",
    );
  });

  it("normaliza espacios en textos y convierte strings vacíos a null", () => {
    const res = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: "   Entrega urgente para el viernes   ",
      items: [
        {
          servicio_id: SERVICIO_VALIDO_ID,
          descripcion: "   Vinil adhesivo brilloso   ",
          dimensiones: "   2x1 m   ",
          acabados: "   ",
          cantidad: 1,
          precio_usd: 20,
        },
      ],
    });

    expect(res.errores).toEqual({});
    expect(res.datos.notas).toBe("Entrega urgente para el viernes");
    expect(res.datos.items[0].descripcion).toBe("Vinil adhesivo brilloso");
    expect(res.datos.items[0].dimensiones).toBe("2x1 m");
    expect(res.datos.items[0].acabados).toBeNull();
  });

  it("calcula correctamente el total_usd del pedido", () => {
    const items = [
      {
        servicio_id: SERVICIO_VALIDO_ID,
        descripcion: null,
        dimensiones: null,
        acabados: null,
        cantidad: 2,
        precio_usd: 15.5, // 31.00
      },
      {
        servicio_id: SERVICIO_VALIDO_ID,
        descripcion: null,
        dimensiones: null,
        acabados: null,
        cantidad: 3,
        precio_usd: 10.25, // 30.75
      },
    ];

    expect(calcularTotalPedido(items)).toBe(61.75);

    const res = validarDatosPedido({
      cliente_id: CLIENTE_VALIDO_ID,
      notas: null,
      items,
    });

    expect(res.errores).toEqual({});
    expect(res.datos.total_usd).toBe(61.75);
  });
});
