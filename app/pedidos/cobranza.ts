/**
 * Monedas aceptadas en la cobranza según la decisión D-3 y PRD (RF-02).
 */
export type MonedaCobranza = "USD" | "Bs";

export type CobranzaInicialEntrada = {
  monto: number | string;
  moneda: MonedaCobranza;
  referencia?: string | null;
};

export type CalculoCobranzaResultado = {
  tieneAbono: boolean;
  abonoMontoOriginal: number;
  abonoMoneda: MonedaCobranza;
  abonoUsd: number;
  saldoUsd: number;
  saldoBs: number;
  esPagoCompleto: boolean;
};

export type ValidacionCobranzaResultado = {
  errores: Record<string, string>;
  datos: {
    monto: number;
    moneda: MonedaCobranza;
    referencia: string | null;
    abonoUsd: number;
    saldoUsd: number;
    tieneAbono: boolean;
  };
};

/**
 * Limpia y recorta la referencia de pago (si queda vacía, retorna null).
 */
function limpiarReferencia(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const limpio = valor.trim();
  return limpio === "" ? null : limpio;
}

/**
 * Calcula montos y saldos en tiempo real para cobranza dual USD / Bs (RF-02).
 */
export function calcularCobranzaInicial(
  totalUsd: number,
  entrada: CobranzaInicialEntrada,
  tasaBsPorUsd: number,
): CalculoCobranzaResultado {
  const montoNum =
    typeof entrada.monto === "number" ? entrada.monto : Number(entrada.monto) || 0;
  const montoLimpio = Math.max(0, Math.round(montoNum * 100) / 100);

  const tieneAbono = montoLimpio > 0;
  const tasaValida = tasaBsPorUsd > 0 ? tasaBsPorUsd : 1;

  let abonoUsd = 0;
  if (tieneAbono) {
    if (entrada.moneda === "USD") {
      abonoUsd = montoLimpio;
    } else {
      // Conversión de Bs a USD
      abonoUsd = Math.round((montoLimpio / tasaValida) * 100) / 100;
    }
  }

  // Prevenir desbordes por redondeos mínimos
  abonoUsd = Math.min(abonoUsd, totalUsd);

  const saldoUsd = Math.max(0, Math.round((totalUsd - abonoUsd) * 100) / 100);
  const saldoBs = Math.round(saldoUsd * tasaValida * 100) / 100;
  const esPagoCompleto = saldoUsd === 0 && totalUsd > 0;

  return {
    tieneAbono,
    abonoMontoOriginal: montoLimpio,
    abonoMoneda: entrada.moneda,
    abonoUsd,
    saldoUsd,
    saldoBs,
    esPagoCompleto,
  };
}

/**
 * Valida los datos de cobranza inicial ante la creación del pedido.
 */
export function validarCobranzaInicial(
  totalUsd: number,
  entrada: CobranzaInicialEntrada,
  tasaBsPorUsd: number,
): ValidacionCobranzaResultado {
  const errores: Record<string, string> = {};

  if (tasaBsPorUsd <= 0 || !Number.isFinite(tasaBsPorUsd)) {
    errores.tasa = "La tasa de cambio debe ser mayor a 0.";
  }

  if (entrada.moneda !== "USD" && entrada.moneda !== "Bs") {
    errores.moneda = "La moneda debe ser 'USD' o 'Bs'.";
  }

  const montoNum =
    typeof entrada.monto === "number" ? entrada.monto : Number(entrada.monto);

  if (Number.isNaN(montoNum) || montoNum < 0) {
    errores.monto = "El monto del abono debe ser mayor o igual a 0.";
  } else if (tasaBsPorUsd > 0) {
    if (entrada.moneda === "USD" && montoNum > totalUsd) {
      errores.monto = `El abono no puede ser mayor al total del pedido ($${totalUsd.toFixed(2)} USD).`;
    } else if (entrada.moneda === "Bs") {
      const maxBs = Math.round(totalUsd * tasaBsPorUsd * 100) / 100;
      if (montoNum > maxBs) {
        errores.monto = `El abono no puede ser mayor al total del pedido (${maxBs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.).`;
      }
    }
  }

  const calculo = calcularCobranzaInicial(
    totalUsd,
    {
      monto: Number.isNaN(montoNum) || montoNum < 0 ? 0 : montoNum,
      moneda: entrada.moneda === "Bs" ? "Bs" : "USD",
      referencia: entrada.referencia,
    },
    tasaBsPorUsd > 0 ? tasaBsPorUsd : 1,
  );

  return {
    errores,
    datos: {
      monto: Number.isNaN(montoNum) || montoNum < 0 ? 0 : montoNum,
      moneda: entrada.moneda === "Bs" ? "Bs" : "USD",
      referencia: limpiarReferencia(entrada.referencia),
      abonoUsd: calculo.abonoUsd,
      saldoUsd: calculo.saldoUsd,
      tieneAbono: calculo.tieneAbono,
    },
  };
}
