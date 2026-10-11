import { describe, expect, it } from "vitest";
import { generarCodigoBarrasSvg } from "@/lib/comanda/barcode";
import { generarQrSvg } from "@/lib/comanda/qr";

describe("T-011a — generador de código de barras (RF-03)", () => {
  it("genera un SVG válido para un número de orden numérico", () => {
    const svg = generarCodigoBarrasSvg("1001");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
    expect(svg).toContain("viewBox");
  });

  it("admite prefijos alfanuméricos como ORD-1001", () => {
    const svg = generarCodigoBarrasSvg("ORD-1001");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("lanza error ante cadenas vacías", () => {
    expect(() => generarCodigoBarrasSvg("")).toThrow(
      "El texto para el código de barras no puede estar vacío.",
    );
  });
});

describe("T-011a — generador de código QR (RF-03)", () => {
  it("genera un SVG con matriz cuadrada válida para una URL", () => {
    const url = "https://apsys.local/pedidos/1001";
    const svg = generarQrSvg(url);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<rect");
  });

  it("lanza error si el texto para el QR está vacío", () => {
    expect(() => generarQrSvg("")).toThrow(
      "El texto para el código QR no puede estar vacío.",
    );
  });
});
