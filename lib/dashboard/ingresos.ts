/**
 * Métricas financieras y consolidación de ingresos por moneda y fechas (RF-11 / T-019).
 */

export type PresetFecha = "hoy" | "esta_semana" | "este_mes" | "todo";

export type PagoMétrica = {
  id: string;
  pedidoId: string;
  numeroOrden?: number;
  monto: number;
  moneda: "USD" | "Bs";
  referencia?: string | null;
  tasaValor?: number | null;
  creadoEn: string;
  clienteNombre?: string | null;
};

export type FiltroRangoFechas = {
  desde?: string | null;
  hasta?: string | null;
};

export type ConsolidadoIngresos = {
  totalUsd: number;
  totalBs: number;
  totalEquivalenteUsd: number;
  conteoPagosUsd: number;
  conteoPagosBs: number;
  totalPagosCount: number;
  pagosFiltrados: PagoMétrica[];
};

/**
 * Genera las marcas de tiempo ISO de inicio y fin para los rangos preestablecidos.
 */
export function obtenerRangoFechasPreset(
  preset: PresetFecha,
  fechaReferencia: Date = new Date(),
): { desde: string; hasta: string } {
  const anio = fechaReferencia.getFullYear();
  const mes = fechaReferencia.getMonth();
  const dia = fechaReferencia.getDate();

  switch (preset) {
    case "hoy": {
      const inicio = new Date(anio, mes, dia, 0, 0, 0, 0);
      const fin = new Date(anio, mes, dia, 23, 59, 59, 999);
      return { desde: inicio.toISOString(), hasta: fin.toISOString() };
    }
    case "esta_semana": {
      // Inicio en lunes de la semana actual
      const diaSemana = fechaReferencia.getDay(); // 0 es domingo
      const diffLunes = (diaSemana + 6) % 7;
      const inicio = new Date(anio, mes, dia - diffLunes, 0, 0, 0, 0);
      const fin = new Date(anio, mes, dia + (6 - diffLunes), 23, 59, 59, 999);
      return { desde: inicio.toISOString(), hasta: fin.toISOString() };
    }
    case "este_mes": {
      const inicio = new Date(anio, mes, 1, 0, 0, 0, 0);
      const ultimoDia = new Date(anio, mes + 1, 0, 23, 59, 59, 999);
      return { desde: inicio.toISOString(), hasta: ultimoDia.toISOString() };
    }
    case "todo":
    default: {
      return {
        desde: new Date(2020, 0, 1).toISOString(),
        hasta: new Date(2100, 11, 31).toISOString(),
      };
    }
  }
}

/**
 * Consolida con precisión al centavo los ingresos recaudados por moneda
 * y calcula el equivalente global en USD según la tasa congelada de cada cobro.
 */
export function calcularConsolidadoIngresos(
  pagos: PagoMétrica[],
  rango?: FiltroRangoFechas,
): ConsolidadoIngresos {
  let pagosFiltrados = pagos;

  if (rango?.desde || rango?.hasta) {
    const tiempoDesde = rango.desde ? new Date(rango.desde).getTime() : -Infinity;
    const tiempoHasta = rango.hasta ? new Date(rango.hasta).getTime() : Infinity;

    pagosFiltrados = pagos.filter((pago) => {
      const t = new Date(pago.creadoEn).getTime();
      return t >= tiempoDesde && t <= tiempoHasta;
    });
  }

  let totalUsdRaw = 0;
  let totalBsRaw = 0;
  let totalEquivalenteUsdRaw = 0;
  let conteoPagosUsd = 0;
  let conteoPagosBs = 0;

  for (const pago of pagosFiltrados) {
    const monto = Number(pago.monto) || 0;
    const tasa = Number(pago.tasaValor) || 40.0;

    if (pago.moneda === "USD") {
      totalUsdRaw += monto;
      totalEquivalenteUsdRaw += monto;
      conteoPagosUsd += 1;
    } else if (pago.moneda === "Bs") {
      totalBsRaw += monto;
      const equivUsd = tasa > 0 ? monto / tasa : 0;
      totalEquivalenteUsdRaw += equivUsd;
      conteoPagosBs += 1;
    }
  }

  // Redondear exactamente al centavo para evitar errores de coma flotante
  const totalUsd = Math.round(totalUsdRaw * 100) / 100;
  const totalBs = Math.round(totalBsRaw * 100) / 100;
  const totalEquivalenteUsd = Math.round(totalEquivalenteUsdRaw * 100) / 100;

  return {
    totalUsd,
    totalBs,
    totalEquivalenteUsd,
    conteoPagosUsd,
    conteoPagosBs,
    totalPagosCount: pagosFiltrados.length,
    pagosFiltrados,
  };
}
