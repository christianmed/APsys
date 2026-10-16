import { describe, expect, it } from "vitest";
import { NAVIGATION_GROUPS } from "@/components/shell/app-nav-items";

describe("NAVIGATION_GROUPS (Arquitectura de Información del Sidebar)", () => {
  it("incluye 'Tasa de Cambio' dentro de 'Gestión Comercial' sin restricción de rol", () => {
    const grupoComercial = NAVIGATION_GROUPS.find(
      (g) => g.title === "Gestión Comercial",
    );
    expect(grupoComercial).toBeDefined();

    const itemTasas = grupoComercial?.items.find(
      (item) => item.href === "/tasas",
    );
    expect(itemTasas).toBeDefined();
    expect(itemTasas?.label).toBe("Tasa de Cambio");
    expect(itemTasas?.rolRequerido).toBeUndefined();
  });

  it("mantiene 'Finanzas & Gerencia' 100% exclusivo para el perfil gerencial", () => {
    const grupoFinanzas = NAVIGATION_GROUPS.find(
      (g) => g.title === "Finanzas & Gerencia",
    );
    expect(grupoFinanzas).toBeDefined();

    // Todos los items de Finanzas & Gerencia deben requerir rol gerencial
    for (const item of grupoFinanzas!.items) {
      expect(item.rolRequerido).toBe("gerencial");
    }
  });

  it("muestra 'Tasa de Cambio' a un usuario con rol operativo", () => {
    const usuarioRol = "operativo";

    const itemsVisibles = NAVIGATION_GROUPS.flatMap((g) =>
      g.items.filter(
        (item) => !item.rolRequerido || (item.rolRequerido as string) === usuarioRol,
      ),
    );

    const tieneTasas = itemsVisibles.some((item) => item.href === "/tasas");
    expect(tieneTasas).toBe(true);

    const tieneDashboard = itemsVisibles.some((item) => item.href === "/dashboard");
    expect(tieneDashboard).toBe(false);
  });

  it("muestra todas las opciones al rol gerencial", () => {
    const usuarioRol = "gerencial";

    const itemsVisibles = NAVIGATION_GROUPS.flatMap((g) =>
      g.items.filter(
        (item) => !item.rolRequerido || item.rolRequerido === usuarioRol,
      ),
    );

    expect(itemsVisibles.some((item) => item.href === "/tasas")).toBe(true);
    expect(itemsVisibles.some((item) => item.href === "/dashboard")).toBe(true);
    expect(itemsVisibles.some((item) => item.href === "/cuentas-por-cobrar")).toBe(true);
    expect(itemsVisibles.some((item) => item.href === "/dashboard/rotacion")).toBe(true);
  });
});
