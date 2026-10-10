import { describe, expect, it } from "vitest";
import {
  normalizarTelefono,
  validarDatosCliente,
} from "@/app/clientes/validaciones";

describe("normalizarTelefono", () => {
  it("colapsa espacios internos múltiples y recorta los extremos", () => {
    expect(normalizarTelefono("  600   123  456  ")).toBe("600 123 456");
  });

  it("solo espacios → null", () => {
    expect(normalizarTelefono("   ")).toBeNull();
  });

  it("vacío, null o undefined → null", () => {
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono(null)).toBeNull();
    expect(normalizarTelefono(undefined)).toBeNull();
  });
});

describe("validarDatosCliente", () => {
  it("nombre vacío → error de obligatorio", () => {
    const { errores } = validarDatosCliente({
      nombre: "",
      telefono: null,
      notas: null,
    });

    expect(errores.nombre).toBe("El nombre es obligatorio.");
  });

  it("nombre solo con espacios → error de obligatorio", () => {
    const { errores } = validarDatosCliente({
      nombre: "   ",
      telefono: null,
      notas: null,
    });

    expect(errores.nombre).toBe("El nombre es obligatorio.");
  });

  it("nombre con espacios alrededor → se recorta", () => {
    const { errores, datos } = validarDatosCliente({
      nombre: "  Ana María  ",
      telefono: null,
      notas: null,
    });

    expect(errores.nombre).toBeUndefined();
    expect(datos.nombre).toBe("Ana María");
  });

  it("teléfono con espacios → se normaliza", () => {
    const { datos } = validarDatosCliente({
      nombre: "Ana",
      telefono: " 600   123 ",
      notas: null,
    });

    expect(datos.telefono).toBe("600 123");
  });

  it("teléfono vacío → null", () => {
    const { datos } = validarDatosCliente({
      nombre: "Ana",
      telefono: "",
      notas: null,
    });

    expect(datos.telefono).toBeNull();
  });

  it("notas vacías o solo espacios → null", () => {
    const { datos } = validarDatosCliente({
      nombre: "Ana",
      telefono: null,
      notas: "   ",
    });

    expect(datos.notas).toBeNull();
  });

  it("caso válido completo → sin errores y con datos normalizados", () => {
    const { errores, datos } = validarDatosCliente({
      nombre: "  Ana Pérez  ",
      telefono: "  0414   123 4567 ",
      notas: "  Prefiere entregas por la tarde.  ",
    });

    expect(errores).toEqual({});
    expect(datos).toEqual({
      nombre: "Ana Pérez",
      telefono: "0414 123 4567",
      notas: "Prefiere entregas por la tarde.",
    });
  });
});
