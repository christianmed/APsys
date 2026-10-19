import { describe, it, expect } from "vitest";
import { TOKYO_NIGHT_TOKENS, DESIGN_SYSTEM } from "@/lib/design-system";

describe("Sistema de Diseño APSys Tokyo Night (Fase 34)", () => {
  it("debe definir los tokens oficiales Tokyo Night con los valores exactos", () => {
    expect(TOKYO_NIGHT_TOKENS.canvas).toBe("#16161e");
    expect(TOKYO_NIGHT_TOKENS.surface).toBe("#1a1b26");
    expect(TOKYO_NIGHT_TOKENS.elevated).toBe("#1f202c");
    expect(TOKYO_NIGHT_TOKENS.hover).toBe("#252b42");
    expect(TOKYO_NIGHT_TOKENS.border).toBe("#24283b");
    expect(TOKYO_NIGHT_TOKENS.borderActive).toBe("#2f3654");
    expect(TOKYO_NIGHT_TOKENS.accentBlue).toBe("#7aa2f7");
    expect(TOKYO_NIGHT_TOKENS.accentAmber).toBe("#e0af68");
    expect(TOKYO_NIGHT_TOKENS.accentEmerald).toBe("#9ece6a");
  });

  it("debe contener clases para tarjetas, inputs, botones y tablas alineadas a Tokyo Night", () => {
    expect(DESIGN_SYSTEM.card).toContain("#1a1b26");
    expect(DESIGN_SYSTEM.card).toContain("#24283b");

    expect(DESIGN_SYSTEM.input).toContain("#16161e");
    expect(DESIGN_SYSTEM.input).toContain("#24283b");
    expect(DESIGN_SYSTEM.input).toContain("#7aa2f7");

    expect(DESIGN_SYSTEM.buttonPrimary).toContain("#1f202c");
    expect(DESIGN_SYSTEM.buttonSecondary).toContain("#1a1b26");

    expect(DESIGN_SYSTEM.tableHeader).toContain("#1f202c");
    expect(DESIGN_SYSTEM.tableHeader).toContain("#24283b");
  });

  it("debe unificar los badges semánticos con la paleta Tokyo Night oficial", () => {
    expect(DESIGN_SYSTEM.badgeBlue).toContain("#7aa2f7");
    expect(DESIGN_SYSTEM.badgeAmber).toContain("#e0af68");
    expect(DESIGN_SYSTEM.badgeEmerald).toContain("#9ece6a");
    expect(DESIGN_SYSTEM.badgeNeutral).toContain("#1f202c");
  });
});
