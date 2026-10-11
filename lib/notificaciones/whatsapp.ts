/**
 * Notificaciones y avisos de retiro vía WhatsApp (RF-08 / D-2 / T-015).
 */

export type AvisoRetiroParams = {
  nombreCliente: string;
  numeroOrden: number;
  totalUsd: number;
  saldoUsd: number;
  tasaBsPorUsd?: number | null;
};

export type EnlaceWhatsAppAvisoParams = AvisoRetiroParams & {
  telefono: string | null | undefined;
};

/**
 * Normaliza un número de teléfono para su uso en enlaces de WhatsApp (wa.me).
 * Convierte formatos venezolanos (0414..., +58 412...) al estándar internacional sin símbolos (58414...).
 */
export function normalizarTelefonoWhatsApp(
  telefono: string | null | undefined,
): string | null {
  if (!telefono) return null;

  // Remover todo excepto dígitos numéricos
  const digitos = telefono.replace(/\D/g, "");

  if (digitos.length < 10) {
    return null;
  }

  // Caso: Formato nacional de Venezuela con cero inicial (ej. 04141234567 -> 11 dígitos)
  if (digitos.startsWith("0") && digitos.length === 11) {
    return `58${digitos.slice(1)}`;
  }

  // Caso: Celular venezolano sin el 0 inicial (ej. 4141234567 -> 10 dígitos)
  if ((digitos.startsWith("414") || digitos.startsWith("424") || digitos.startsWith("412") || digitos.startsWith("416") || digitos.startsWith("426")) && digitos.length === 10) {
    return `58${digitos}`;
  }

  // Caso: Ya incluye código 58 de Venezuela (ej. 584141234567 -> 12 dígitos)
  if (digitos.startsWith("58") && digitos.length >= 12) {
    return digitos;
  }

  // Caso: Internacional general (10 a 15 dígitos)
  if (digitos.length >= 10 && digitos.length <= 15) {
    return digitos;
  }

  return null;
}

function formatearMoneda(valor: number): string {
  return valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Genera el texto del mensaje para avisar al cliente que su orden está lista para retiro.
 */
export function generarMensajeAvisoRetiro({
  nombreCliente,
  numeroOrden,
  totalUsd,
  saldoUsd,
  tasaBsPorUsd,
}: AvisoRetiroParams): string {
  const ordenStr = `ORD-${String(numeroOrden).padStart(4, "0")}`;
  const clienteLimpio = nombreCliente.trim() || "Cliente";

  const lineas: string[] = [
    `👋 *Hola ${clienteLimpio}*, le escribimos de *APSys Gráfica*.`,
    "",
    `🎉 ¡Su pedido *#${ordenStr}* está terminado y *listo para ser retirado* en nuestro taller!`,
    "",
  ];

  if (saldoUsd <= 0.009) {
    lineas.push(`✅ *Saldo pendiente:* $0.00 USD (Pagado completamente).`);
  } else {
    lineas.push(`💵 *Total del trabajo:* $${formatearMoneda(totalUsd)} USD`);
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
    "📍 Puede pasar a retirar su pedido en nuestro horario habitual. ¡Muchas gracias por confiar en nosotros!",
  );

  return lineas.join("\n");
}

/**
 * Construye el enlace wa.me para abrir la conversación de WhatsApp con el mensaje prellenado.
 */
export function generarEnlaceWhatsAppAviso(
  params: EnlaceWhatsAppAvisoParams,
): string | null {
  const telefonoNormalizado = normalizarTelefonoWhatsApp(params.telefono);
  if (!telefonoNormalizado) {
    return null;
  }

  const texto = generarMensajeAvisoRetiro(params);
  return `https://wa.me/${telefonoNormalizado}?text=${encodeURIComponent(texto)}`;
}
