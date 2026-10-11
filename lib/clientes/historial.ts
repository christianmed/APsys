export type ClasificacionRecurrencia =
  | "Sin compras"
  | "Nuevo"
  | "Ocasional"
  | "Recurrente"
  | "VIP / Frecuente"
  | "Inactivo (> 60 días)";

export type PagoHistorial = {
  monto: number;
  moneda: "USD" | "VES";
  tasa_valor?: number | null;
};

export type PedidoHistorialInput = {
  id: string;
  numero_orden: number | string;
  creado_en: string;
  estado: string;
  anulado: boolean;
  total_usd: number;
  tasa_valor?: number;
  pagos: PagoHistorial[];
  items_count?: number;
};

export type ItemHistorialCliente = {
  pedido_id: string;
  numero_orden: string;
  creado_en: string;
  estado: string;
  anulado: boolean;
  total_usd: number;
  total_pagado_usd: number;
  saldo_usd: number;
  saldo_bs: number;
  items_count: number;
};

export type MetricasCliente = {
  total_pedidos_activos: number;
  total_pedidos_anulados: number;
  total_gastado_usd: number;
  total_pagado_usd: number;
  saldo_pendiente_usd: number;
  ticket_promedio_usd: number;
  fecha_primera_compra: string | null;
  fecha_ultima_compra: string | null;
  dias_desde_ultima_compra: number | null;
  frecuencia_dias_promedio: number | null;
  clasificacion: ClasificacionRecurrencia;
  historial_pedidos: ItemHistorialCliente[];
};

export function redondearCentavos(monto: number): number {
  return Math.round(monto * 100) / 100;
}

export function clasificarRecurrenciaCliente(
  pedidosActivos: number,
  diasDesdeUltimaCompra: number,
  frecuenciaPromedioDias?: number,
): ClasificacionRecurrencia {
  if (pedidosActivos === 0) return "Sin compras";
  if (diasDesdeUltimaCompra > 60) return "Inactivo (> 60 días)";
  if (pedidosActivos === 1) return "Nuevo";
  if (pedidosActivos === 2) return "Ocasional";
  if (
    pedidosActivos >= 5 ||
    (typeof frecuenciaPromedioDias === "number" &&
      frecuenciaPromedioDias > 0 &&
      frecuenciaPromedioDias <= 15 &&
      pedidosActivos >= 3)
  ) {
    return "VIP / Frecuente";
  }
  return "Recurrente";
}

/**
 * Procesa la lista de pedidos de un cliente para extraer estadísticas acumuladas,
 * saldos y métricas de recurrencia (RF-14).
 */
export function calcularMetricasCliente(
  pedidos: PedidoHistorialInput[],
  fechaReferencia: Date = new Date(),
): MetricasCliente {
  let totalActivos = 0;
  let totalAnulados = 0;
  let totalGastadoUsd = 0;
  let totalPagadoUsd = 0;

  const pedidosActivosOrdenados = pedidos
    .filter((p) => !p.anulado)
    .sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());

  const itemsHistorial: ItemHistorialCliente[] = [];

  for (const p of pedidos) {
    if (p.anulado) {
      totalAnulados += 1;
    } else {
      totalActivos += 1;
      totalGastadoUsd = redondearCentavos(totalGastadoUsd + p.total_usd);
    }

    const tasaPedido = p.tasa_valor || 1;
    const pagadoUsd = redondearCentavos(
      p.pagos.reduce((acc, pago) => {
        if (pago.moneda === "USD") {
          return acc + pago.monto;
        }
        const tasaPago = pago.tasa_valor || tasaPedido;
        return acc + pago.monto / tasaPago;
      }, 0),
    );

    if (!p.anulado) {
      totalPagadoUsd = redondearCentavos(totalPagadoUsd + pagadoUsd);
    }

    const saldoUsd = p.anulado ? 0 : redondearCentavos(Math.max(0, p.total_usd - pagadoUsd));
    const saldoBs = redondearCentavos(saldoUsd * tasaPedido);

    const ordenFormato =
      typeof p.numero_orden === "number"
        ? `ORD-${String(p.numero_orden).padStart(4, "0")}`
        : String(p.numero_orden);

    itemsHistorial.push({
      pedido_id: p.id,
      numero_orden: ordenFormato,
      creado_en: p.creado_en,
      estado: p.estado,
      anulado: p.anulado,
      total_usd: p.total_usd,
      total_pagado_usd: pagadoUsd,
      saldo_usd: saldoUsd,
      saldo_bs: saldoBs,
      items_count: p.items_count ?? 1,
    });
  }

  // Ordenar el historial entregado de más reciente a más antiguo
  itemsHistorial.sort(
    (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime(),
  );

  const saldoPendienteUsd = redondearCentavos(
    Math.max(0, totalGastadoUsd - totalPagadoUsd),
  );

  const ticketPromedioUsd =
    totalActivos > 0 ? redondearCentavos(totalGastadoUsd / totalActivos) : 0;

  if (pedidosActivosOrdenados.length === 0) {
    return {
      total_pedidos_activos: 0,
      total_pedidos_anulados: totalAnulados,
      total_gastado_usd: 0,
      total_pagado_usd: 0,
      saldo_pendiente_usd: 0,
      ticket_promedio_usd: 0,
      fecha_primera_compra: null,
      fecha_ultima_compra: null,
      dias_desde_ultima_compra: null,
      frecuencia_dias_promedio: null,
      clasificacion: "Sin compras",
      historial_pedidos: itemsHistorial,
    };
  }

  const primeraCompra = pedidosActivosOrdenados[0].creado_en;
  const ultimaCompra =
    pedidosActivosOrdenados[pedidosActivosOrdenados.length - 1].creado_en;

  const msUltima =
    fechaReferencia.getTime() - new Date(ultimaCompra).getTime();
  const diasDesdeUltimaCompra = Math.max(
    0,
    Math.floor(msUltima / (1000 * 60 * 60 * 24)),
  );

  let frecuenciaDiasPromedio: number | null = null;
  if (pedidosActivosOrdenados.length > 1) {
    let sumaDiferenciasDias = 0;
    for (let i = 1; i < pedidosActivosOrdenados.length; i++) {
      const fechaAnterior = new Date(pedidosActivosOrdenados[i - 1].creado_en);
      const fechaActual = new Date(pedidosActivosOrdenados[i].creado_en);
      const difDias = (fechaActual.getTime() - fechaAnterior.getTime()) / (1000 * 60 * 60 * 24);
      sumaDiferenciasDias += difDias;
    }
    frecuenciaDiasPromedio = Math.round(
      sumaDiferenciasDias / (pedidosActivosOrdenados.length - 1),
    );
  }

  const clasificacion = clasificarRecurrenciaCliente(
    totalActivos,
    diasDesdeUltimaCompra,
    frecuenciaDiasPromedio ?? 0,
  );

  return {
    total_pedidos_activos: totalActivos,
    total_pedidos_anulados: totalAnulados,
    total_gastado_usd: totalGastadoUsd,
    total_pagado_usd: totalPagadoUsd,
    saldo_pendiente_usd: saldoPendienteUsd,
    ticket_promedio_usd: ticketPromedioUsd,
    fecha_primera_compra: primeraCompra,
    fecha_ultima_compra: ultimaCompra,
    dias_desde_ultima_compra: diasDesdeUltimaCompra,
    frecuencia_dias_promedio: frecuenciaDiasPromedio,
    clasificacion,
    historial_pedidos: itemsHistorial,
  };
}
