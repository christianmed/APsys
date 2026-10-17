/**
 * APSys — Validación de Entrada de Pedidos y Renglones
 */

import {
  esUuidValido,
  limpiarTexto,
  type ResultadoValidacion,
} from "./comun";

export type ItemPedidoEntradaValidado = {
  servicio_id: string;
  descripcion: string | null;
  dimensiones: string | null;
  acabados: string | null;
  cantidad: number;
  precio_usd: number;
};

export type PedidoEntradaValidado = {
  cliente_id: string;
  notas: string | null;
  tasa_id?: string | null;
  items: ItemPedidoEntradaValidado[];
};

export function validarEntradaPedido(
  input: unknown,
): ResultadoValidacion<PedidoEntradaValidado> {
  const errores: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return {
      exito: false,
      errores: { general: "Datos de pedido inválidos o inexistentes." },
    };
  }

  const raw = input as Record<string, unknown>;

  // Validar cliente_id
  const clienteId = typeof raw.cliente_id === "string" ? raw.cliente_id.trim() : "";
  if (!clienteId) {
    errores.cliente_id = "Debe seleccionar un cliente para registrar la orden.";
  } else if (!esUuidValido(clienteId)) {
    errores.cliente_id = "El identificador del cliente no es válido.";
  }

  // Validar notas opcionales
  const notasLimpias = limpiarTexto(
    typeof raw.notas === "string" ? raw.notas : null,
  );

  // Validar tasa_id opcional
  let tasaId: string | null = null;
  if (raw.tasa_id) {
    const tasaStr = String(raw.tasa_id).trim();
    if (esUuidValido(tasaStr)) {
      tasaId = tasaStr;
    }
  }

  // Validar ítems
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  if (rawItems.length === 0) {
    errores.items = "La orden debe contener al menos un ítem o servicio.";
  }

  const itemsValidados: ItemPedidoEntradaValidado[] = [];

  rawItems.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errores[`items[${index}]`] = "El renglón del pedido es inválido.";
      return;
    }

    const itemRaw = item as Record<string, unknown>;

    // Validar servicio_id
    const servicioId =
      typeof itemRaw.servicio_id === "string" ? itemRaw.servicio_id.trim() : "";
    if (!servicioId || !esUuidValido(servicioId)) {
      errores[`items[${index}].servicio_id`] =
        "Debe seleccionar un servicio válido del catálogo.";
    }

    // Validar cantidad
    const cantidadNum = Number(itemRaw.cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      errores[`items[${index}].cantidad`] =
        "La cantidad debe ser un número entero mayor o igual a 1.";
    }

    // Validar precio_usd
    const precioNum = Number(itemRaw.precio_usd);
    if (isNaN(precioNum) || precioNum < 0) {
      errores[`items[${index}].precio_usd`] =
        "El precio unitario en USD debe ser mayor o igual a 0.";
    }

    // Sanitizar campos descriptivos
    const descripcion = limpiarTexto(
      typeof itemRaw.descripcion === "string" ? itemRaw.descripcion : null,
    );
    const dimensiones = limpiarTexto(
      typeof itemRaw.dimensiones === "string" ? itemRaw.dimensiones : null,
    );
    const acabados = limpiarTexto(
      typeof itemRaw.acabados === "string" ? itemRaw.acabados : null,
    );

    itemsValidados.push({
      servicio_id: servicioId,
      descripcion,
      dimensiones,
      acabados,
      cantidad: cantidadNum,
      precio_usd: precioNum,
    });
  });

  if (Object.keys(errores).length > 0) {
    return { exito: false, errores };
  }

  return {
    exito: true,
    datos: {
      cliente_id: clienteId,
      notas: notasLimpias,
      tasa_id: tasaId,
      items: itemsValidados,
    },
  };
}
