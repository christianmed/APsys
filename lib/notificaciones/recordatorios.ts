/**
 * Lógica de negocio para recordatorios de pedidos listos sin retirar (RF-09 / T-016).
 * Alertas automáticas para órdenes con 48 h (atención) o 72 h (urgente) esperando retiro.
 */

import { normalizarTelefonoWhatsApp } from "./whatsapp";

export type UmbralAntiguedad = "reciente" | "atencion_48h" | "urgente_72h";

export type PedidoListoRecordatorio = {
  id: string;
  numeroOrden: number;
  nombreCliente: string;
  telefono: string | null | undefined;
  horasTranscurridas: number;
  totalUsd: number;
  saldoUsd: number;
  tasaBsPorUsd?: number | null;
  listoEn?: string | null;
};

export type MensajeRecordatorioParams = {
  nombreCliente: string;
  numeroOrden: number;
  horasTranscurridas: number;
  totalUsd: number;
  saldoUsd: number;
  tasaBsPorUsd?: number | null;
};

export type EnlaceWhatsAppRecordatorioParams = MensajeRecordatorioParams & {
  telefono: string | null | undefined;
};

/**
 * Calcula las horas transcurridas desde que la orden fue marcada como 'listo_en'.
 */
export function calcularAntiguedadHoras(
  listoEnIso: string,
  fechaReferencia: Date = new Date(),
): number {
  try {
    const fechaListo = new Date(listoEnIso);
    const diffMs = fechaReferencia.getTime() - fechaListo.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

/**
 * Clasifica la antigüedad de espera en taller:
 * - reciente: < 48 h
 * - atencion_48h: 48 h a 71.9 h
 * - urgente_72h: >= 72 h
 */
export function clasificarUmbralAntiguedad(horas: number): UmbralAntiguedad {
  if (horas >= 72) return "urgente_72h";
  if (horas >= 48) return "atencion_48h";
  return "reciente";
}

/**
 * Ordena los pedidos por horas transcurridas descendente (los más antiguos primero).
 */
export function ordenarPedidosPorAntiguedad(
  pedidos: PedidoListoRecordatorio[],
): PedidoListoRecordatorio[] {
  return [...pedidos].sort((a, b) => b.horasTranscurridas - a.horasTranscurridas);
}

function formatearMoneda(valor: number): string {
  return valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Genera la plantilla de mensaje de recordatorio según el umbral de tiempo (48 h o 72 h).
 */
export function generarMensajeRecordatorioRetiro({
  nombreCliente,
  numeroOrden,
  horasTranscurridas,
  totalUsd,
  saldoUsd,
  tasaBsPorUsd,
}: MensajeRecordatorioParams): string {
  const ordenStr = `ORD-${String(numeroOrden).padStart(4, "0")}`;
  const clienteLimpio = nombreCliente.trim() || "Cliente";
  const esUrgente = horasTranscurridas >= 72;

  const lineas: string[] = [
    `🔔 *Hola ${clienteLimpio}*, le escribimos con un cordial recordatorio de *APSys Gráfica*.`,
    "",
  ];

  if (esUrgente) {
    lineas.push(
      `⚠️ Su orden *#${ordenStr}* lleva *más de 3 días* lista para retiro en nuestro taller.`,
    );
    lineas.push(
      "Agradecemos enormemente su apoyo retirando el material lo antes posible para evitar maltrato y liberar espacio en nuestro almacén.",
    );
  } else {
    lineas.push(
      `📦 Le recordamos que su pedido *#${ordenStr}* lleva *más de 48 horas listo* para ser retirado en nuestras instalaciones.`,
    );
  }

  lineas.push("");

  if (saldoUsd <= 0.009) {
    lineas.push(`✅ *Estado de pago:* 100% Pagado. ¡Solo debe pasar a retirar!`);
  } else {
    lineas.push(`💵 *Total:* $${formatearMoneda(totalUsd)} USD`);
    lineas.push(`💳 *Saldo pendiente:* $${formatearMoneda(saldoUsd)} USD`);

    if (tasaBsPorUsd && tasaBsPorUsd > 0) {
      const saldoBs = Math.round(saldoUsd * tasaBsPorUsd * 100) / 100;
      lineas.push(
        `🇻🇪 *Equivalente en Bs:* Bs. ${formatearMoneda(saldoBs)} (tasa: ${formatearMoneda(tasaBsPorUsd)} Bs/$)`,
      );
    }
  }

  lineas.push("");
  lineas.push(
    "📍 Le esperamos en nuestro taller. Si ya coordinó el retiro, por favor desestime este mensaje. ¡Muchas gracias!",
  );

  return lineas.join("\n");
}

/**
 * Genera el enlace directo wa.me para enviar el recordatorio con 1 clic.
 */
export function generarEnlaceWhatsAppRecordatorio(
  params: EnlaceWhatsAppRecordatorioParams,
): string | null {
  const telefonoNormalizado = normalizarTelefonoWhatsApp(params.telefono);
  if (!telefonoNormalizado) return null;

  const texto = generarMensajeRecordatorioRetiro(params);
  return `https://wa.me/${telefonoNormalizado}?text=${encodeURIComponent(texto)}`;
}
