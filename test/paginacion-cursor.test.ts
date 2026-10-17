import { describe, expect, it } from "vitest";
import {
  procesarPaginacionCursor,
  construirUrlPaginacion,
} from "@/lib/paginacion/cursor";

describe("Paginación por Cursor (Keyset Pagination)", () => {
  it("cuando hay menos elementos que el límite, hayMas es false y siguienteCursor es null", () => {
    const items = [
      { id: "1", numero_orden: 105, creado_en: "2026-10-16T10:00:00Z" },
      { id: "2", numero_orden: 104, creado_en: "2026-10-16T09:00:00Z" },
    ];

    const resultado = procesarPaginacionCursor(items, 25, "numero_orden");

    expect(resultado.hayMas).toBe(false);
    expect(resultado.siguienteCursor).toBeNull();
    expect(resultado.datos).toHaveLength(2);
    expect(resultado.datos[0].numero_orden).toBe(105);
  });

  it("cuando hay exactamente el límite de elementos, hayMas es false", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      numero_orden: 1000 - i,
      creado_en: `2026-10-16T${String(i).padStart(2, "0")}:00:00Z`,
    }));

    const resultado = procesarPaginacionCursor(items, 25, "numero_orden");

    expect(resultado.hayMas).toBe(false);
    expect(resultado.siguienteCursor).toBeNull();
    expect(resultado.datos).toHaveLength(25);
  });

  it("cuando hay límite + 1 elementos, descarta el extra, hayMas es true y extrae el cursor del último elemento visible", () => {
    // 26 elementos (límite 25 + 1 de sondeo)
    const items = Array.from({ length: 26 }, (_, i) => ({
      id: String(i + 1),
      numero_orden: 1000 - i,
      creado_en: `2026-10-16T${String(i).padStart(2, "0")}:00:00Z`,
    }));

    const resultado = procesarPaginacionCursor(items, 25, "numero_orden");

    expect(resultado.hayMas).toBe(true);
    // El elemento 25 (índice 24) tiene numero_orden 1000 - 24 = 976
    expect(resultado.siguienteCursor).toBe(976);
    expect(resultado.datos).toHaveLength(25);
    expect(resultado.datos[24].numero_orden).toBe(976);
  });

  it("soporta cursor basado en strings (como fechas ISO creado_en)", () => {
    const items = [
      { id: "1", creado_en: "2026-10-16T12:00:00Z" },
      { id: "2", creado_en: "2026-10-16T11:00:00Z" },
      { id: "3", creado_en: "2026-10-16T10:00:00Z" },
    ];

    // Con límite 2, recibe 3 elementos -> hayMas = true
    const resultado = procesarPaginacionCursor(items, 2, "creado_en");

    expect(resultado.hayMas).toBe(true);
    expect(resultado.siguienteCursor).toBe("2026-10-16T11:00:00Z");
    expect(resultado.datos).toHaveLength(2);
  });

  it("maneja listas vacías correctamente", () => {
    const resultado = procesarPaginacionCursor([], 25, "numero_orden");

    expect(resultado.hayMas).toBe(false);
    expect(resultado.siguienteCursor).toBeNull();
    expect(resultado.datos).toEqual([]);
  });

  it("construirUrlPaginacion genera URLs limpias preservando otros searchParams", () => {
    const url1 = construirUrlPaginacion("/pedidos", { q: "vinil", cursor: 1024 });
    expect(url1).toBe("/pedidos?q=vinil&cursor=1024");

    const urlSinCursor = construirUrlPaginacion("/pedidos", { q: "vinil", cursor: null });
    expect(urlSinCursor).toBe("/pedidos?q=vinil");

    const urlVacia = construirUrlPaginacion("/pedidos", {});
    expect(urlVacia).toBe("/pedidos");
  });
});
