import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enviarAlertaTelegram } from "@/lib/notificaciones/telegram";

describe("Módulo de Notificaciones por Telegram (Alertas Cron)", () => {
  const envOriginal = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envOriginal };
  });

  afterEach(() => {
    process.env = envOriginal;
    vi.restoreAllMocks();
  });

  it("si no están configuradas las variables de entorno, no lanza error y retorna enviado: false", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const res = await enviarAlertaTelegram({
      titulo: "Prueba de Alerta",
      mensaje: "Fallo simulado",
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe("TELEGRAM_NO_CONFIGURADO");
  });

  it("si las variables están configuradas, hace POST a la API de Telegram con formato HTML", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    process.env.TELEGRAM_CHAT_ID = "987654321";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await enviarAlertaTelegram({
      titulo: "Fallo en Sincronización BCV",
      mensaje: "Timeout al consultar rates.dolarvzla.com",
      detalles: "Error de red código 504",
    });

    expect(res.enviado).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123456:TEST_TOKEN/sendMessage");
    expect(opciones.method).toBe("POST");
    expect(opciones.headers["Content-Type"]).toBe("application/json");

    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.chat_id).toBe("987654321");
    expect(cuerpo.parse_mode).toBe("HTML");
    expect(cuerpo.text).toContain("🚨 <b>APSys — Fallo en Sincronización BCV</b>");
    expect(cuerpo.text).toContain("Timeout al consultar rates.dolarvzla.com");
    expect(cuerpo.text).toContain("Error de red código 504");
  });

  it("si la API de Telegram responde con error HTTP, no revienta la aplicación y captura el fallo", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    process.env.TELEGRAM_CHAT_ID = "987654321";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ description: "Chat not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await enviarAlertaTelegram({
      titulo: "Fallo",
      mensaje: "Error",
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toContain("Chat not found");
  });

  it("si ocurre una excepción de red al contactar a Telegram, maneja el error limpiamente", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    process.env.TELEGRAM_CHAT_ID = "987654321";

    const fetchMock = vi.fn().mockRejectedValue(new Error("Network drop"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await enviarAlertaTelegram({
      titulo: "Fallo",
      mensaje: "Error",
    });

    expect(res.enviado).toBe(false);
    expect(res.motivo).toBe("Network drop");
  });
});
