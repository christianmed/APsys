import { normalizarTelefonoWhatsApp } from "@/lib/notificaciones/whatsapp";

export type TramoAntiguedad = "0_a_7" | "8_a_15" | "16_a_30" | "mas_de_30";

export type PagoSimple = {
  monto: number;
  moneda: "USD" | "VES";
  tasa_valor?: number | null;
};

export type PedidoConDeudaInput = {
  id: string;
  numero_orden: string | number;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono?: string | null;
  estado: string;
  anulado: boolean;
  total_usd: number;
  tasa_valor: number;
  creado_en: string;
  pagos: PagoSimple[];
};

export type CuentaPorCobrar = {
  pedido_id: string;
  numero_orden: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  estado: string;
  creado_en: string;
  dias_antiguedad: number;
  tramo: TramoAntiguedad;
  total_usd: number;
  total_pagado_usd: number;
  saldo_usd: number;
  saldo_bs: number;
  tasa_valor: number;
};

export type ResumenTramo = {
  cantidad: number;
  monto_usd: number;
  porcentaje_del_total: number;
};

export type ResumenCuentasPorCobrar = {
  total_pedidos_con_deuda: number;
  total_clientes_deudores: number;
  total_por_cobrar_usd: number;
  total_por_cobrar_bs: number;
  tramos: Record<TramoAntiguedad, ResumenTramo>;
};

export type ResultadoCuentasPorCobrar = {
  cuentas: CuentaPorCobrar[];
  resumen: ResumenCuentasPorCobrar;
};

export function redondearCentavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function formatearMonedaUSD(valor: number): string {
  return `$${valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearMonedaBs(valor: number): string {
  return `Bs. ${valor.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calcula los días transcurridos entre la fecha de creación del pedido y la fecha de referencia.
 */
export function calcularAntiguedadDias(
  fechaInicio: Date | string,
  fechaReferencia: Date = new Date(),
): number {
  const inicio = typeof fechaInicio === "string" ? new Date(fechaInicio) : fechaInicio;
  const diferenciaMs = fechaReferencia.getTime() - inicio.getTime();
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}

/**
 * Clasifica los días de antigüedad en los 4 tramos estándar de cobranza.
 */
export function clasificarTramoAntiguedad(dias: number): TramoAntiguedad {
  if (dias <= 7) return "0_a_7";
  if (dias <= 15) return "8_a_15";
  if (dias <= 30) return "16_a_30";
  return "mas_de_30";
}

/**
 * Procesa la cartera de pedidos y consolida las cuentas por cobrar con sus métricas.
 */
export function calcularCuentasPorCobrar(
  pedidos: PedidoConDeudaInput[],
  fechaReferencia: Date = new Date(),
): ResultadoCuentasPorCobrar {
  const cuentas: CuentaPorCobrar[] = [];
  const clientesDeudoresSet = new Set<string>();

  let totalPorCobrarUsd = 0;
  let totalPorCobrarBs = 0;

  const tramosAgregados: Record<TramoAntiguedad, { cantidad: number; monto_usd: number }> = {
    "0_a_7": { cantidad: 0, monto_usd: 0 },
    "8_a_15": { cantidad: 0, monto_usd: 0 },
    "16_a_30": { cantidad: 0, monto_usd: 0 },
    "mas_de_30": { cantidad: 0, monto_usd: 0 },
  };

  for (const pedido of pedidos) {
    if (pedido.anulado) continue;

    // Calcular abonos en USD equivalente
    const totalPagadoUsd = redondearCentavos(
      pedido.pagos.reduce((total, pago) => {
        if (pago.moneda === "USD") {
          return total + pago.monto;
        }
        const tasa = pago.tasa_valor || pedido.tasa_valor || 1;
        return total + pago.monto / tasa;
      }, 0),
    );

    const saldoUsd = redondearCentavos(Math.max(0, pedido.total_usd - totalPagadoUsd));

    // Si el saldo es 0 o menor (completamente pagado), no entra en cartera de cobranza
    if (saldoUsd <= 0.001) continue;

    const saldoBs = redondearCentavos(saldoUsd * (pedido.tasa_valor || 1));
    const dias = calcularAntiguedadDias(pedido.creado_en, fechaReferencia);
    const tramo = clasificarTramoAntiguedad(dias);

    totalPorCobrarUsd += saldoUsd;
    totalPorCobrarBs += saldoBs;
    clientesDeudoresSet.add(pedido.cliente_id);

    tramosAgregados[tramo].cantidad += 1;
    tramosAgregados[tramo].monto_usd += saldoUsd;

    const numeroOrdenStr =
      typeof pedido.numero_orden === "number"
        ? `ORD-${String(pedido.numero_orden).padStart(4, "0")}`
        : String(pedido.numero_orden);

    cuentas.push({
      pedido_id: pedido.id,
      numero_orden: numeroOrdenStr,
      cliente_id: pedido.cliente_id,
      cliente_nombre: pedido.cliente_nombre,
      cliente_telefono: pedido.cliente_telefono || null,
      estado: pedido.estado,
      creado_en: pedido.creado_en,
      dias_antiguedad: dias,
      tramo,
      total_usd: pedido.total_usd,
      total_pagado_usd: totalPagadoUsd,
      saldo_usd: saldoUsd,
      saldo_bs: saldoBs,
      tasa_valor: pedido.tasa_valor,
    });
  }

  totalPorCobrarUsd = redondearCentavos(totalPorCobrarUsd);
  totalPorCobrarBs = redondearCentavos(totalPorCobrarBs);

  // Calcular porcentajes de cada tramo
  const tramos: Record<TramoAntiguedad, ResumenTramo> = {
    "0_a_7": {
      cantidad: tramosAgregados["0_a_7"].cantidad,
      monto_usd: redondearCentavos(tramosAgregados["0_a_7"].monto_usd),
      porcentaje_del_total:
        totalPorCobrarUsd > 0
          ? Math.round((tramosAgregados["0_a_7"].monto_usd / totalPorCobrarUsd) * 100)
          : 0,
    },
    "8_a_15": {
      cantidad: tramosAgregados["8_a_15"].cantidad,
      monto_usd: redondearCentavos(tramosAgregados["8_a_15"].monto_usd),
      porcentaje_del_total:
        totalPorCobrarUsd > 0
          ? Math.round((tramosAgregados["8_a_15"].monto_usd / totalPorCobrarUsd) * 100)
          : 0,
    },
    "16_a_30": {
      cantidad: tramosAgregados["16_a_30"].cantidad,
      monto_usd: redondearCentavos(tramosAgregados["16_a_30"].monto_usd),
      porcentaje_del_total:
        totalPorCobrarUsd > 0
          ? Math.round((tramosAgregados["16_a_30"].monto_usd / totalPorCobrarUsd) * 100)
          : 0,
    },
    "mas_de_30": {
      cantidad: tramosAgregados["mas_de_30"].cantidad,
      monto_usd: redondearCentavos(tramosAgregados["mas_de_30"].monto_usd),
      porcentaje_del_total:
        totalPorCobrarUsd > 0
          ? Math.round((tramosAgregados["mas_de_30"].monto_usd / totalPorCobrarUsd) * 100)
          : 0,
    },
  };

  return {
    cuentas,
    resumen: {
      total_pedidos_con_deuda: cuentas.length,
      total_clientes_deudores: clientesDeudoresSet.size,
      total_por_cobrar_usd: totalPorCobrarUsd,
      total_por_cobrar_bs: totalPorCobrarBs,
      tramos,
    },
  };
}

export type OpcionesFiltroCuentas = {
  tramo?: "todos" | TramoAntiguedad;
  busqueda?: string;
  ordenarPor?: "mayor_saldo" | "mas_antiguo" | "mas_reciente" | "cliente";
};

/**
 * Filtra y ordena las cuentas según los criterios del usuario.
 */
export function filtrarYOrdenarCuentas(
  cuentas: CuentaPorCobrar[],
  opciones: OpcionesFiltroCuentas,
): CuentaPorCobrar[] {
  let resultado = [...cuentas];

  if (opciones.tramo && opciones.tramo !== "todos") {
    resultado = resultado.filter((c) => c.tramo === opciones.tramo);
  }

  if (opciones.busqueda && opciones.busqueda.trim() !== "") {
    const q = opciones.busqueda.trim().toLowerCase();
    resultado = resultado.filter(
      (c) =>
        c.cliente_nombre.toLowerCase().includes(q) ||
        c.numero_orden.toLowerCase().includes(q) ||
        (c.cliente_telefono && c.cliente_telefono.includes(q)),
    );
  }

  const criterio = opciones.ordenarPor || "mayor_saldo";

  resultado.sort((a, b) => {
    switch (criterio) {
      case "mayor_saldo":
        return b.saldo_usd - a.saldo_usd;
      case "mas_antiguo":
        return b.dias_antiguedad - a.dias_antiguedad;
      case "mas_reciente":
        return a.dias_antiguedad - b.dias_antiguedad;
      case "cliente":
        return a.cliente_nombre.localeCompare(b.cliente_nombre);
      default:
        return 0;
    }
  });

  return resultado;
}

export type MensajeCobranzaParams = {
  cliente_nombre: string;
  cliente_telefono?: string | null;
  numero_orden: string;
  saldo_usd: number;
  saldo_bs: number;
  dias_antiguedad: number;
};

/**
 * Genera el mensaje formal de cobranza para WhatsApp y el enlace wa.me.
 */
export function generarMensajeCobranza(cuenta: MensajeCobranzaParams): {
  mensaje: string;
  enlaceWhatsApp: string | null;
} {
  const montoUsd = formatearMonedaUSD(cuenta.saldo_usd);
  const montoBs = formatearMonedaBs(cuenta.saldo_bs);

  const mensaje = [
    `Estimado/a ${cuenta.cliente_nombre},`,
    `Le contactamos de APSys Gráfica para recordarle un saldo pendiente por valor de ${montoUsd} (${montoBs}) correspondiente a su orden ${cuenta.numero_orden} (${cuenta.dias_antiguedad} días transcurridos).`,
    `Agradecemos coordinar la cancelación de dicho saldo o reportar su comprobante de pago para mantener su cuenta al día.`,
    `¡Gracias por su preferencia!`,
  ].join("\n\n");

  const telefonoNorm = normalizarTelefonoWhatsApp(cuenta.cliente_telefono);
  const enlaceWhatsApp = telefonoNorm
    ? `https://wa.me/${telefonoNorm}?text=${encodeURIComponent(mensaje)}`
    : null;

  return { mensaje, enlaceWhatsApp };
}
