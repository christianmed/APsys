import { describe, expect, it } from "vitest";
import {
  generarEnlaceWhatsAppAviso,
  generarMensajeAvisoRetiro,
  normalizarTelefonoWhatsApp,
} from "@/lib/notificaciones/whatsapp";

describe("T-015 — Aviso de retiro por WhatsApp (RF-08, D-2)", () => {
  describe("normalización de teléfonos para WhatsApp", () => {
    it("convierte formato nacional venezolano 04XX a 584XX", () => {
      expect(normalizarTelefonoWhatsApp("0414-1234567")).toBe("584141234567");
      expect(normalizarTelefonoWhatsApp("0424 9876543")).toBe("584249876543");
      expect(normalizarTelefonoWhatsApp("(0412) 555-1234")).toBe("584125551234");
      expect(normalizarTelefonoWhatsApp("04161112233")).toBe("584161112233");
    });

    it("respeta números que ya incluyen código de país 58 o +58", () => {
      expect(normalizarTelefonoWhatsApp("+58 414 1234567")).toBe("584141234567");
      expect(normalizarTelefonoWhatsApp("584129876543")).toBe("584129876543");
    });

    it("acepta números internacionales con código de país", () => {
      expect(normalizarTelefonoWhatsApp("+1 (305) 555-0199")).toBe("13055550199");
      expect(normalizarTelefonoWhatsApp("+34 612 345 678")).toBe("34612345678");
    });

    it("retorna null si el teléfono está vacío o no contiene dígitos suficientes", () => {
      expect(normalizarTelefonoWhatsApp("")).toBeNull();
      expect(normalizarTelefonoWhatsApp("   ")).toBeNull();
      expect(normalizarTelefonoWhatsApp("123")).toBeNull();
      expect(normalizarTelefonoWhatsApp(null as unknown as string)).toBeNull();
    });
  });

  describe("generación de plantilla de mensaje para aviso de retiro", () => {
    it("genera mensaje completo con saldo pendiente en USD y Bs", () => {
      const mensaje = generarMensajeAvisoRetiro({
        nombreCliente: "Acme Corp",
        numeroOrden: 42,
        totalUsd: 150.0,
        saldoUsd: 50.0,
        tasaBsPorUsd: 40.0,
      });

      expect(mensaje).toContain("Hola Acme Corp");
      expect(mensaje).toContain("ORD-0042");
      expect(mensaje).toContain("listo para ser retirado");
      expect(mensaje).toContain("*Saldo pendiente:* $50.00 USD");
      expect(mensaje).toContain("Bs. 2,000.00");
    });

    it("genera mensaje sin saldo pendiente cuando está pagado al 100%", () => {
      const mensaje = generarMensajeAvisoRetiro({
        nombreCliente: "Juan Pérez",
        numeroOrden: 105,
        totalUsd: 80.0,
        saldoUsd: 0,
        tasaBsPorUsd: 40.0,
      });

      expect(mensaje).toContain("Hola Juan Pérez");
      expect(mensaje).toContain("ORD-0105");
      expect(mensaje).toContain("listo para ser retirado");
      expect(mensaje).toContain("Pagado completamente");
      expect(mensaje).not.toContain("Bs.");
    });
  });

  describe("construcción del enlace wa.me", () => {
    it("retorna enlace wa.me con texto URL encoded si los datos son válidos", () => {
      const enlace = generarEnlaceWhatsAppAviso({
        telefono: "0414-1234567",
        nombreCliente: "María López",
        numeroOrden: 7,
        totalUsd: 100.0,
        saldoUsd: 20.0,
        tasaBsPorUsd: 42.5,
      });

      expect(enlace).not.toBeNull();
      expect(enlace).toContain("https://wa.me/584141234567?text=");
      expect(enlace).toContain("ORD-0007");
    });

    it("retorna null si el teléfono no es válido", () => {
      const enlace = generarEnlaceWhatsAppAviso({
        telefono: "",
        nombreCliente: "Sin Teléfono",
        numeroOrden: 1,
        totalUsd: 50,
        saldoUsd: 0,
      });

      expect(enlace).toBeNull();
    });
  });
});
