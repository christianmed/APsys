import { describe, expect, it } from "vitest";
import { sanearTerminoBusquedaOrden } from "@/lib/pedidos/busqueda";

describe("T-012a — saneamiento de entradas de escáner USB y búsqueda (RF-06)", () => {
  it("extrae el número de orden cuando se escanea con prefijo ORD-", () => {
    expect(sanearTerminoBusquedaOrden("ORD-1001")).toEqual({
      esNumeroOrden: true,
      numeroOrden: 1001,
      terminoLimpio: "1001",
    });
  });

  it("extrae el número de orden cuando se escanea con asteriscos de código de barras *ORD-1002*", () => {
    expect(sanearTerminoBusquedaOrden("*ORD-1002*")).toEqual({
      esNumeroOrden: true,
      numeroOrden: 1002,
      terminoLimpio: "1002",
    });
  });

  it("reconoce número de orden con almohadilla #1003 o espacios", () => {
    expect(sanearTerminoBusquedaOrden("  #1003  ")).toEqual({
      esNumeroOrden: true,
      numeroOrden: 1003,
      terminoLimpio: "1003",
    });
  });

  it("reconoce número de orden introducido directamente", () => {
    expect(sanearTerminoBusquedaOrden("1050")).toEqual({
      esNumeroOrden: true,
      numeroOrden: 1050,
      terminoLimpio: "1050",
    });
  });

  it("si es texto de nombre de cliente, no lo marca como número de orden", () => {
    expect(sanearTerminoBusquedaOrden("Empresa Graficentro")).toEqual({
      esNumeroOrden: false,
      numeroOrden: null,
      terminoLimpio: "Empresa Graficentro",
    });
  });

  it("sanea caracteres especiales SQL y comodines para prevenir inyecciones", () => {
    expect(sanearTerminoBusquedaOrden("Juan % _ , ()")).toEqual({
      esNumeroOrden: false,
      numeroOrden: null,
      terminoLimpio: "Juan",
    });
  });

  it("cadena vacía retorna valores limpios nulos", () => {
    expect(sanearTerminoBusquedaOrden("   ")).toEqual({
      esNumeroOrden: false,
      numeroOrden: null,
      terminoLimpio: "",
    });
  });
});
