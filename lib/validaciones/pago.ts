/**
 * APSys — Validación de Entrada de Pagos y Abonos
 */

import {
  esUuidValido,
  limpiarTexto,
  type ResultadoValidacion,
} from "./comun";

export type MonedaPagoValida = "USD" | "Bs";

export type PagoEntradaValidado = {
  pedido_id: string;
  monto: number;
  moneda: MonedaPagoValida;
  referencia: string | null;
  tasa_id?: string | null;
};

export function validarEntradaPago(
  input: unknown,
): ResultadoValidacion<PagoEntradaValidado> {
  const errores: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return {
      exito: false,
      errores: { general: "Datos de pago inválidos o inexistentes." },
    };
  }

  const raw = input as Record<string, unknown>;

  // Validar pedido_id
  const pedidoId =
    typeof raw.pedido_id === "string" ? raw.pedido_id.trim() : "";
  if (!pedidoId || !esUuidValido(pedidoId)) {
    errores.pedido_id = "El identificador del pedido no es válido.";
  }

  // Validar monto
  const montoNum = Number(raw.monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    errores.monto = "El monto debe ser un número estrictamente mayor a 0.";
  }

  // Validar moneda
  const monedaStr = String(raw.moneda ?? "").trim();
  if (monedaStr !== "USD" && monedaStr !== "Bs") {
    errores.moneda = "La moneda debe ser 'USD' o 'Bs'.";
  }

  // Sanitizar referencia
  const referencia = limpiarTexto(
    typeof raw.referencia === "string" ? raw.referencia : null,
  );

  // Validar tasa_id opcional
  let tasaId: string | null = null;
  if (raw.tasa_id) {
    const tasaStr = String(raw.tasa_id).trim();
    if (esUuidValido(tasaStr)) {
      tasaId = tasaStr;
    }
  }

  if (Object.keys(errores).length > 0) {
    return { exito: false, errores };
  }

  return {
    exito: true,
    datos: {
      pedido_id: pedidoId,
      monto: Number(montoNum.toFixed(2)),
      moneda: monedaStr as MonedaPagoValida,
      referencia,
      tasa_id: tasaId,
    },
  };
}
