/**
 * Expresión regular estándar para validar identificadores UUID v4 / RFC 4122.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Entrada cruda o pre-procesada de un ítem de pedido.
 */
export type ItemPedidoEntrada = {
  servicio_id: string;
  descripcion?: string | null;
  dimensiones?: string | null;
  acabados?: string | null;
  cantidad: number | string;
  precio_usd: number | string;
};

/**
 * Ítem de pedido normalizado y listo para persistir en la base de datos.
 */
export type ItemPedidoNormalizado = {
  servicio_id: string;
  descripcion: string | null;
  dimensiones: string | null;
  acabados: string | null;
  cantidad: number;
  precio_usd: number;
};

/**
 * Entrada completa de un pedido.
 */
export type PedidoEntrada = {
  cliente_id: string;
  notas?: string | null;
  items: ItemPedidoEntrada[];
};

/**
 * Pedido normalizado con total calculado.
 */
export type PedidoNormalizado = {
  cliente_id: string;
  notas: string | null;
  total_usd: number;
  items: ItemPedidoNormalizado[];
};

/**
 * Resultado de la validación.
 */
export type ResultadoValidacionPedido = {
  errores: Record<string, string>;
  datos: PedidoNormalizado;
};

/**
 * Limpia un texto: recorta espacios; si queda vacío, devuelve `null`.
 */
function limpiarTexto(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  const recortado = valor.trim();
  return recortado === "" ? null : recortado;
}

/**
 * Calcula la suma total de los ítems en USD redondeada a 2 decimales.
 */
export function calcularTotalPedido(
  items: Array<{ cantidad: number; precio_usd: number }>,
): number {
  const suma = items.reduce((acc, item) => {
    const cant =
      Number.isInteger(item.cantidad) && item.cantidad > 0 ? item.cantidad : 0;
    const precio =
      Number.isFinite(item.precio_usd) && item.precio_usd >= 0
        ? item.precio_usd
        : 0;
    return acc + cant * precio;
  }, 0);

  return Math.round(suma * 100) / 100;
}

/**
 * Valida y normaliza la entrada de un pedido con sus ítems (RF-01 / T-008).
 * Devuelve un mapa de errores por campo y los datos listos para inserción en `pedidos` y `pedido_items`.
 */
export function validarDatosPedido(
  entrada: PedidoEntrada,
): ResultadoValidacionPedido {
  const errores: Record<string, string> = {};

  const clienteIdLimpio = entrada.cliente_id?.trim() ?? "";
  if (clienteIdLimpio === "") {
    errores.cliente_id = "Debe seleccionar un cliente.";
  } else if (!UUID_REGEX.test(clienteIdLimpio)) {
    errores.cliente_id = "El identificador del cliente no es válido.";
  }

  const items = Array.isArray(entrada.items) ? entrada.items : [];
  if (items.length === 0) {
    errores.items = "El pedido debe contener al menos un servicio o ítem.";
  }

  const itemsNormalizados: ItemPedidoNormalizado[] = [];

  items.forEach((item, index) => {
    const prefijo = `items[${index}]`;

    const servicioIdLimpio = item.servicio_id?.trim() ?? "";
    if (servicioIdLimpio === "") {
      errores[`${prefijo}.servicio_id`] = "Debe seleccionar un servicio.";
    } else if (!UUID_REGEX.test(servicioIdLimpio)) {
      errores[`${prefijo}.servicio_id`] =
        "El identificador del servicio no es válido.";
    }

    const cantidadNum =
      typeof item.cantidad === "number" ? item.cantidad : Number(item.cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      errores[`${prefijo}.cantidad`] =
        "La cantidad debe ser un número entero mayor a 0.";
    }

    const precioNum =
      typeof item.precio_usd === "number"
        ? item.precio_usd
        : Number(item.precio_usd);
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      errores[`${prefijo}.precio_usd`] =
        "El precio unitario debe ser mayor o igual a 0.";
    }

    itemsNormalizados.push({
      servicio_id: servicioIdLimpio,
      descripcion: limpiarTexto(item.descripcion),
      dimensiones: limpiarTexto(item.dimensiones),
      acabados: limpiarTexto(item.acabados),
      cantidad:
        Number.isInteger(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1,
      precio_usd:
        Number.isFinite(precioNum) && precioNum >= 0
          ? Math.round(precioNum * 100) / 100
          : 0,
    });
  });

  const totalUsd = calcularTotalPedido(itemsNormalizados);

  return {
    errores,
    datos: {
      cliente_id: clienteIdLimpio,
      notas: limpiarTexto(entrada.notas),
      total_usd: totalUsd,
      items: itemsNormalizados,
    },
  };
}
