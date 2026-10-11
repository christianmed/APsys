import { describe, expect, it } from "vitest";
import { validarDatosServicio } from "@/app/servicios/validaciones";

describe("validarDatosServicio", () => {
  it("nombre vacío → error de obligatorio", () => {
    const { errores } = validarDatosServicio({ nombre: "", orden: null });

    expect(errores.nombre).toBe("El nombre es obligatorio.");
  });

  it("nombre solo con espacios → error de obligatorio", () => {
    const { errores } = validarDatosServicio({ nombre: "   ", orden: null });

    expect(errores.nombre).toBe("El nombre es obligatorio.");
  });

  it("nombre con espacios alrededor → se recorta", () => {
    const { errores, datos } = validarDatosServicio({
      nombre: "  Pendones  ",
      orden: null,
    });

    expect(errores.nombre).toBeUndefined();
    expect(datos.nombre).toBe("Pendones");
  });

  it("orden \"3\" (texto) → 3", () => {
    const { errores, datos } = validarDatosServicio({
      nombre: "Pendones",
      orden: "3",
    });

    expect(errores.orden).toBeUndefined();
    expect(datos.orden).toBe(3);
  });

  it("orden vacío o null → 0", () => {
    const vacio = validarDatosServicio({ nombre: "Pendones", orden: "" });
    const nulo = validarDatosServicio({ nombre: "Pendones", orden: null });

    expect(vacio.errores.orden).toBeUndefined();
    expect(vacio.datos.orden).toBe(0);
    expect(nulo.errores.orden).toBeUndefined();
    expect(nulo.datos.orden).toBe(0);
  });

  it("orden \"-1\" → error de entero no negativo", () => {
    const { errores } = validarDatosServicio({ nombre: "Pendones", orden: "-1" });

    expect(errores.orden).toBe(
      "El orden debe ser un número entero mayor o igual a 0.",
    );
  });

  it("orden \"abc\" → error de entero no negativo", () => {
    const { errores } = validarDatosServicio({ nombre: "Pendones", orden: "abc" });

    expect(errores.orden).toBe(
      "El orden debe ser un número entero mayor o igual a 0.",
    );
  });

  it("caso válido completo → sin errores y con datos normalizados", () => {
    const { errores, datos } = validarDatosServicio({
      nombre: "  Viniles  ",
      orden: 5,
    });

    expect(errores).toEqual({});
    expect(datos).toEqual({ nombre: "Viniles", orden: 5 });
  });
});
