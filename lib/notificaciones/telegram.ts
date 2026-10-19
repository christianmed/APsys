/**
 * APSys — Módulo Ligero de Notificaciones y Alertas por Telegram
 *
 * Utiliza fetch nativo (cero dependencias de terceros) para emitir alertas
 * de fallos en tareas desatendidas (Cron jobs, sincronización de tasas, etc.).
 *
 * Variables de entorno requeridas:
 * - TELEGRAM_BOT_TOKEN: Token del bot generado con @BotFather.
 * - TELEGRAM_CHAT_ID: Identificador del chat o grupo de administración.
 */

export interface ParametrosAlertaTelegram {
  titulo: string;
  mensaje: string;
  detalles?: string;
}

export interface ResultadoAlertaTelegram {
  enviado: boolean;
  motivo?: string;
}

/**
 * Envía un mensaje de alerta a Telegram con formato HTML.
 * Diseñado como fail-safe: jamás lanza excepciones para no interrumpir
 * el ciclo de vida del proceso principal si Telegram está inaccesible.
 */
export async function enviarAlertaTelegram({
  titulo,
  mensaje,
  detalles,
}: ParametrosAlertaTelegram): Promise<ResultadoAlertaTelegram> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return {
      enviado: false,
      motivo: "TELEGRAM_NO_CONFIGURADO",
    };
  }

  const fechaHora = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());

  const textoHtml = [
    `<b>APSys — ${sanitizarHtml(titulo)}</b>`,
    `<i>Fecha/Hora: ${fechaHora} (Caracas)</i>`,
    "",
    sanitizarHtml(mensaje),
    detalles ? `\n<code>${sanitizarHtml(detalles)}</code>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textoHtml,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000), // Timeout de seguridad de 5 segundos
    });

    if (!respuesta.ok) {
      const cuerpoError = await respuesta.text().catch(() => "");
      return {
        enviado: false,
        motivo: cuerpoError || `HTTP_${respuesta.status}`,
      };
    }

    return { enviado: true };
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : "ERROR_DESCONOCIDO";
    return {
      enviado: false,
      motivo: mensajeError,
    };
  }
}

/**
 * Escapa caracteres especiales para el modo HTML de Telegram (&, <, >).
 */
function sanitizarHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
