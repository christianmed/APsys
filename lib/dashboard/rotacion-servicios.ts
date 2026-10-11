export type ServicioCatalogo = {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
};

export type ItemPedidoRotacion = {
  servicio_id: string;
  cantidad: number;
  precio_usd: number;
};

export type PedidoRotacionInput = {
  id: string;
  anulado: boolean;
  creado_en: string;
  items: ItemPedidoRotacion[];
};

export type MetricaServicioRotacion = {
  servicio_id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  ordenes_count: number;
  cantidad_total: number;
  ingresos_usd: number;
  porcentaje_ingresos: number;
  porcentaje_cantidad: number;
};

export type ResumenRotacionServicios = {
  total_ordenes_procesadas: number;
  total_items_producidos: number;
  total_ingresos_usd: number;
  servicio_lider_ingresos: MetricaServicioRotacion | null;
  servicio_lider_volumen: MetricaServicioRotacion | null;
  servicios_sin_demanda: MetricaServicioRotacion[];
};

export type CriterioOrdenRotacion =
  | "mayor_ingreso"
  | "menor_ingreso"
  | "mayor_demanda"
  | "menor_demanda"
  | "nombre";

export type ResultadoRotacionServicios = {
  metricasPorServicio: MetricaServicioRotacion[];
  resumen: ResumenRotacionServicios;
};

/**
 * Filtra los pedidos que caen dentro del intervalo de tiempo y no están anulados.
 */
export function filtrarPedidosPorFecha(
  pedidos: PedidoRotacionInput[],
  desde?: Date | string | null,
  hasta?: Date | string | null,
): PedidoRotacionInput[] {
  const dInicio = desde ? (typeof desde === "string" ? new Date(desde) : desde) : null;
  const dFin = hasta ? (typeof hasta === "string" ? new Date(hasta) : hasta) : null;

  return pedidos.filter((pedido) => {
    if (pedido.anulado) return false;
    const fecha = new Date(pedido.creado_en);

    if (dInicio && fecha < dInicio) return false;
    if (dFin && fecha > dFin) return false;
    return true;
  });
}

/**
 * Procesa la rotación y demanda por servicio agrupando por catálogo.
 */
export function calcularRotacionServicios(
  catalogo: ServicioCatalogo[],
  pedidos: PedidoRotacionInput[],
  criterioOrden: CriterioOrdenRotacion = "mayor_ingreso",
): ResultadoRotacionServicios {
  const mapaServicios = new Map<
    string,
    {
      servicio_id: string;
      nombre: string;
      activo: boolean;
      orden: number;
      ordenesSet: Set<string>;
      cantidad_total: number;
      ingresos_usd: number;
    }
  >();

  // Inicializar todos los servicios del catálogo con 0 para capturar demanda nula
  for (const s of catalogo) {
    mapaServicios.set(s.id, {
      servicio_id: s.id,
      nombre: s.nombre,
      activo: s.activo,
      orden: s.orden,
      ordenesSet: new Set<string>(),
      cantidad_total: 0,
      ingresos_usd: 0,
    });
  }

  let totalItemsProducidos = 0;
  let totalIngresosUsd = 0;
  const ordenesProcesadasSet = new Set<string>();

  for (const pedido of pedidos) {
    if (pedido.anulado) continue;
    ordenesProcesadasSet.add(pedido.id);

    for (const item of pedido.items) {
      let reg = mapaServicios.get(item.servicio_id);

      // Si el servicio no está en el catálogo activo (ej. histórico o eliminado), registrarlo
      if (!reg) {
        reg = {
          servicio_id: item.servicio_id,
          nombre: "Servicio no catalogado",
          activo: false,
          orden: 999,
          ordenesSet: new Set<string>(),
          cantidad_total: 0,
          ingresos_usd: 0,
        };
        mapaServicios.set(item.servicio_id, reg);
      }

      const cant = Number(item.cantidad) || 0;
      const precio = Number(item.precio_usd) || 0;

      reg.ordenesSet.add(pedido.id);
      reg.cantidad_total += cant;
      reg.ingresos_usd = Math.round((reg.ingresos_usd + precio) * 100) / 100;

      totalItemsProducidos += cant;
      totalIngresosUsd = Math.round((totalIngresosUsd + precio) * 100) / 100;
    }
  }

  // Convertir a lista con porcentajes
  const metricasPorServicio: MetricaServicioRotacion[] = Array.from(
    mapaServicios.values(),
  ).map((reg) => {
    const porcentajeIngresos =
      totalIngresosUsd > 0
        ? Math.round((reg.ingresos_usd / totalIngresosUsd) * 100)
        : 0;

    const porcentajeCantidad =
      totalItemsProducidos > 0
        ? Math.round((reg.cantidad_total / totalItemsProducidos) * 100)
        : 0;

    return {
      servicio_id: reg.servicio_id,
      nombre: reg.nombre,
      activo: reg.activo,
      orden: reg.orden,
      ordenes_count: reg.ordenesSet.size,
      cantidad_total: reg.cantidad_total,
      ingresos_usd: reg.ingresos_usd,
      porcentaje_ingresos: porcentajeIngresos,
      porcentaje_cantidad: porcentajeCantidad,
    };
  });

  // Ordenar según criterio
  metricasPorServicio.sort((a, b) => {
    switch (criterioOrden) {
      case "mayor_ingreso":
        return b.ingresos_usd - a.ingresos_usd || b.cantidad_total - a.cantidad_total;
      case "menor_ingreso":
        return a.ingresos_usd - b.ingresos_usd || a.cantidad_total - b.cantidad_total;
      case "mayor_demanda":
        return b.cantidad_total - a.cantidad_total || b.ingresos_usd - a.ingresos_usd;
      case "menor_demanda":
        return a.cantidad_total - b.cantidad_total || a.ingresos_usd - b.ingresos_usd;
      case "nombre":
        return a.nombre.localeCompare(b.nombre);
      default:
        return 0;
    }
  });

  // Identificar líderes y servicios sin demanda
  let servicioLiderIngresos: MetricaServicioRotacion | null = null;
  let servicioLiderVolumen: MetricaServicioRotacion | null = null;
  const serviciosSinDemanda: MetricaServicioRotacion[] = [];

  for (const metrica of metricasPorServicio) {
    if (metrica.cantidad_total === 0) {
      serviciosSinDemanda.push(metrica);
      continue;
    }

    if (!servicioLiderIngresos || metrica.ingresos_usd > servicioLiderIngresos.ingresos_usd) {
      servicioLiderIngresos = metrica;
    }

    if (!servicioLiderVolumen || metrica.cantidad_total > servicioLiderVolumen.cantidad_total) {
      servicioLiderVolumen = metrica;
    }
  }

  return {
    metricasPorServicio,
    resumen: {
      total_ordenes_procesadas: ordenesProcesadasSet.size,
      total_items_producidos: totalItemsProducidos,
      total_ingresos_usd: totalIngresosUsd,
      servicio_lider_ingresos: servicioLiderIngresos,
      servicio_lider_volumen: servicioLiderVolumen,
      servicios_sin_demanda: serviciosSinDemanda,
    },
  };
}
