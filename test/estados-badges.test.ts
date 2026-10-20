import { describe, it, expect } from "vitest";
import { ESTADOS_METADATA } from "@/lib/pedidos/estados";
import { ESTADO_CONFIG } from "@/app/pedidos/estado-control";

describe("TB-UI-01 — Semántica Unificada de Estados y Badges Operativos", () => {
  it("ESTADOS_METADATA debe asignar azul a recibido y ámbar a en_produccion", () => {
    expect(ESTADOS_METADATA.recibido.label).toBe("Recibido");
    expect(ESTADOS_METADATA.recibido.badgeColor).toContain("blue");
    expect(ESTADOS_METADATA.recibido.badgeColor).not.toContain("amber");

    expect(ESTADOS_METADATA.en_produccion.label).toBe("En Producción");
    expect(ESTADOS_METADATA.en_produccion.badgeColor).toContain("amber");
    expect(ESTADOS_METADATA.en_produccion.badgeColor).not.toContain("blue");

    expect(ESTADOS_METADATA.listo.label).toBe("Listo para Retiro");
    expect(ESTADOS_METADATA.listo.badgeColor).toContain("emerald");
  });

  it("ESTADO_CONFIG en app/pedidos/estado-control.tsx debe ser consistente con la semántica oficial", () => {
    // recibido DEBE ser azul, NUNCA ámbar
    expect(ESTADO_CONFIG.recibido.label).toBe("Recibido");
    expect(ESTADO_CONFIG.recibido.clasesBadge).toContain("blue");
    expect(ESTADO_CONFIG.recibido.clasesBadge).not.toContain("amber");

    // en_produccion DEBE ser ámbar, NUNCA azul
    expect(ESTADO_CONFIG.en_produccion.label).toBe("En Producción");
    expect(ESTADO_CONFIG.en_produccion.clasesBadge).toContain("amber");
    expect(ESTADO_CONFIG.en_produccion.clasesBadge).not.toContain("blue");

    // listo DEBE ser verde/esmeralda
    expect(ESTADO_CONFIG.listo.label).toBe("Listo para Retiro");
    expect(ESTADO_CONFIG.listo.clasesBadge).toMatch(/emerald|green/);
  });
});
