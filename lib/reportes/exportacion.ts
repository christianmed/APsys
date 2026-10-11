import {
  type FiltroRangoFechas,
  type PresetFecha,
  obtenerRangoFechasPreset,
} from "@/lib/dashboard/ingresos";

export type PagoReporte = {
  monto: number;
  moneda: "USD" | "Bs";
};

export type PedidoReporte = {
  id: string;
  numeroOrden: number;
  creadoEn: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  estado: string;
  anulado: boolean;
  totalUsd: number;
  tasaBsPorUsd: number;
  pagos: PagoReporte[];
};

export type ResumenReporte = {
  totalFacturadoUsd: number;
  totalCobradoUsd: number;
  saldoPendienteUsd: number;
  totalPedidos: number;
};

/**
 * Filtra pedidos según el rango de fechas seleccionado (preset o personalizado).
 */
export function filtrarPedidosPorPeriodo(
  pedidos: PedidoReporte[],
  opciones?: {
    preset?: PresetFecha;
    rango?: FiltroRangoFechas;
    fechaReferencia?: Date;
  },
): PedidoReporte[] {
  let desde: string | undefined = opciones?.rango?.desde ?? undefined;
  let hasta: string | undefined = opciones?.rango?.hasta ?? undefined;

  if (opciones?.preset) {
    const rangoPreset = obtenerRangoFechasPreset(
      opciones.preset,
      opciones.fechaReferencia,
    );
    desde = rangoPreset.desde;
    hasta = rangoPreset.hasta;
  }

  if (!desde && !hasta) {
    return pedidos;
  }

  const tiempoDesde = desde ? new Date(desde).getTime() : -Infinity;
  const tiempoHasta = hasta ? new Date(hasta).getTime() : Infinity;

  return pedidos.filter((p) => {
    const t = new Date(p.creadoEn).getTime();
    return t >= tiempoDesde && t <= tiempoHasta;
  });
}

/**
 * Calcula el resumen de facturación, cobros y saldo del conjunto de pedidos excluyendo anulados.
 */
export function calcularResumenReporte(pedidos: PedidoReporte[]): ResumenReporte {
  const pedidosActivos = pedidos.filter((p) => !p.anulado);

  let totalFacturadoUsd = 0;
  let totalCobradoUsd = 0;
  let saldoPendienteUsd = 0;

  for (const pedido of pedidosActivos) {
    const tasa = pedido.tasaBsPorUsd > 0 ? pedido.tasaBsPorUsd : 40;
    let pagadoUsd = 0;
    for (const pago of pedido.pagos) {
      if (pago.moneda === "USD") {
        pagadoUsd += pago.monto;
      } else {
        pagadoUsd += pago.monto / tasa;
      }
    }
    pagadoUsd = Math.round(pagadoUsd * 100) / 100;
    const saldoUsd = Math.max(0, Math.round((pedido.totalUsd - pagadoUsd) * 100) / 100);

    totalFacturadoUsd += pedido.totalUsd;
    totalCobradoUsd += pagadoUsd;
    saldoPendienteUsd += saldoUsd;
  }

  return {
    totalFacturadoUsd: Math.round(totalFacturadoUsd * 100) / 100,
    totalCobradoUsd: Math.round(totalCobradoUsd * 100) / 100,
    saldoPendienteUsd: Math.round(saldoPendienteUsd * 100) / 100,
    totalPedidos: pedidosActivos.length,
  };
}

/**
 * Escapa un campo para CSV respetando estándar RFC 4180.
 */
export function escaparCampoCsv(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return "";
  }
  const str = String(valor);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera el archivo CSV con BOM UTF-8 para Excel, listado de órdenes y totales contables.
 */
export function generarCsvReportePedidos(pedidos: PedidoReporte[]): string {
  // Exclusión estricta de pedidos anulados
  const pedidosActivos = pedidos.filter((p) => !p.anulado);

  const BOM = "\uFEFF";
  const cabeceras = [
    "N° Orden",
    "Fecha",
    "Cliente",
    "Teléfono",
    "Estado",
    "Total USD",
    "Total Bs (ref)",
    "Pagado USD",
    "Saldo USD",
    "Cobranza",
  ];

  const lineas: string[] = [cabeceras.join(",")];

  let totalFacturadoUsd = 0;
  let totalCobradoUsd = 0;
  let saldoPendienteUsd = 0;

  for (const pedido of pedidosActivos) {
    const tasa = pedido.tasaBsPorUsd > 0 ? pedido.tasaBsPorUsd : 40;
    const totalBsRef = Math.round(pedido.totalUsd * tasa * 100) / 100;

    let pagadoUsd = 0;
    for (const pago of pedido.pagos) {
      if (pago.moneda === "USD") {
        pagadoUsd += pago.monto;
      } else {
        pagadoUsd += pago.monto / tasa;
      }
    }
    pagadoUsd = Math.round(pagadoUsd * 100) / 100;

    const saldoUsd = Math.max(0, Math.round((pedido.totalUsd - pagadoUsd) * 100) / 100);

    totalFacturadoUsd += pedido.totalUsd;
    totalCobradoUsd += pagadoUsd;
    saldoPendienteUsd += saldoUsd;

    const estadoCobranza =
      saldoUsd === 0 && pedido.totalUsd > 0
        ? "Pagado"
        : pagadoUsd > 0
          ? "Abono parcial"
          : "Pendiente";

    const fila = [
      escaparCampoCsv(`#${pedido.numeroOrden}`),
      escaparCampoCsv(new Date(pedido.creadoEn).toLocaleString("es-VE")),
      escaparCampoCsv(pedido.clienteNombre),
      escaparCampoCsv(pedido.clienteTelefono ?? "N/A"),
      escaparCampoCsv(pedido.estado),
      pedido.totalUsd.toFixed(2),
      totalBsRef.toFixed(2),
      pagadoUsd.toFixed(2),
      saldoUsd.toFixed(2),
      escaparCampoCsv(estadoCobranza),
    ];

    lineas.push(fila.join(","));
  }

  // Línea en blanco separadora
  lineas.push("");
  lineas.push("TOTALES DEL PERÍODO");
  lineas.push(`Total Facturado USD: ${totalFacturadoUsd.toFixed(2)}`);
  lineas.push(`Total Cobrado USD: ${totalCobradoUsd.toFixed(2)}`);
  lineas.push(`Saldo Pendiente USD: ${saldoPendienteUsd.toFixed(2)}`);
  lineas.push(`Total de Pedidos: ${pedidosActivos.length}`);

  return BOM + lineas.join("\r\n");
}
