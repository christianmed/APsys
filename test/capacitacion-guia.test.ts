import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("T-028 — Verificación de Guía Rápida y Plan de Capacitación", () => {
  it("la guía rápida cubre los tres perfiles operativos (Mostrador, Taller, Gerencia)", () => {
    const rutaGuia = resolve(
      process.cwd(),
      "docs/capacitacion/guia-rapida-usuarios.md",
    );
    const contenido = readFileSync(rutaGuia, "utf-8");

    expect(contenido).toContain("Perfil Mostrador");
    expect(contenido).toContain("Perfil Taller");
    expect(contenido).toContain("Perfil Gerencial");
    expect(contenido).toContain("Comanda Técnica");
    expect(contenido).toContain("WhatsApp");
  });

  it("el plan de capacitación define agenda modular, duración y formato de feedback", () => {
    const rutaPlan = resolve(
      process.cwd(),
      "docs/capacitacion/plan-capacitacion-y-feedback.md",
    );
    const contenido = readFileSync(rutaPlan, "utf-8");

    expect(contenido).toContain("Plan de Capacitación en Sede");
    expect(contenido).toContain("Agenda de la Sesión");
    expect(contenido).toContain("Formato de Evaluación y Feedback");
    expect(contenido).toContain("Criterio de Aprobación");
  });
});
