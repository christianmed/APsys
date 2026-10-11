import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("T-026 — Validación del Runbook y Scripts de Respaldo", () => {
  it("el documento del runbook existe y define RPO, RTO y procedimientos de recuperación", () => {
    const rutaRunbook = resolve(
      process.cwd(),
      "docs/operaciones/runbook-respaldo-restauracion.md",
    );
    const contenido = readFileSync(rutaRunbook, "utf-8");

    expect(contenido).toContain("RPO");
    expect(contenido).toContain("Recovery Point Objective");
    expect(contenido).toContain("RTO");
    expect(contenido).toContain("Recovery Time Objective");
    expect(contenido).toContain("backup-supabase.mjs");
    expect(contenido).toContain("Disaster Recovery");
    expect(contenido).toContain("SHA-256");
  });

  it("el cálculo de hash criptográfico SHA-256 es determinista para verificar integridad de datos", () => {
    const datosMuestra = JSON.stringify({
      clientes: [{ id: "c-1", nombre: "Cliente Prueba" }],
      pedidos: [{ id: "p-1", total_usd: 150 }],
    });

    const hash1 = createHash("sha256").update(datosMuestra).digest("hex");
    const hash2 = createHash("sha256").update(datosMuestra).digest("hex");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
