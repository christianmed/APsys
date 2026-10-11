import { describe, expect, it } from "vitest";
import { extraerNumeroOrdenDeLecturaCamara } from "@/lib/camara/escaner";

describe("T-018 — Extracción y decodificación de comanda por cámara (RF-06)", () => {
  it("extrae número de orden desde código Code 39 estándar", () => {
    expect(extraerNumeroOrdenDeLecturaCamara("*ORD-0001*")).toBe(1);
    expect(extraerNumeroOrdenDeLecturaCamara("ORD-0042")).toBe(42);
    expect(extraerNumeroOrdenDeLecturaCamara("ORD-1050")).toBe(1050);
  });

  it("extrae número de orden desde lectura numérica o con numeral", () => {
    expect(extraerNumeroOrdenDeLecturaCamara("#42")).toBe(42);
    expect(extraerNumeroOrdenDeLecturaCamara("42")).toBe(42);
    expect(extraerNumeroOrdenDeLecturaCamara("#0005")).toBe(5);
  });

  it("extrae número de orden desde URL de QR impreso en comanda", () => {
    expect(
      extraerNumeroOrdenDeLecturaCamara(
        "https://apsys.app/comanda/abc-123?orden=88",
      ),
    ).toBe(88);
    expect(
      extraerNumeroOrdenDeLecturaCamara(
        "http://localhost:3000/comanda/xyz-999#ORD-0015",
      ),
    ).toBe(15);
  });

  it("retorna null para valores corruptos, vacíos o sin número de orden válido", () => {
    expect(extraerNumeroOrdenDeLecturaCamara("")).toBeNull();
    expect(extraerNumeroOrdenDeLecturaCamara("   ")).toBeNull();
    expect(extraerNumeroOrdenDeLecturaCamara("texto-sin-numero")).toBeNull();
    expect(extraerNumeroOrdenDeLecturaCamara("ORD-0000")).toBeNull();
    expect(extraerNumeroOrdenDeLecturaCamara("-5")).toBeNull();
    expect(extraerNumeroOrdenDeLecturaCamara(null as unknown as string)).toBeNull();
  });
});
