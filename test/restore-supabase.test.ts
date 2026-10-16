import { describe, expect, it } from "vitest";
import { convertirBackupASql } from "@/scripts/restore-supabase.mjs";

describe("Restauración de Backups y Conversor SQL (scripts/restore-supabase.mjs)", () => {
  it("genera un script SQL válido respetando el orden relacional", () => {
    const backupMock = {
      perfiles: [
        {
          id: "perf-1",
          nombre: "Admin Demo",
          rol: "gerencial",
        },
      ],
      clientes: [
        {
          id: "cli-1",
          nombre: "Imprenta Central",
          telefono: "+584121234567",
        },
      ],
      tasas_cambio: [
        {
          id: "tasa-1",
          valor_bs_por_usd: 879.1225,
          vigente_desde: "2026-10-15T00:00:00-04:00",
        },
      ],
      pedidos: [
        {
          id: "ped-1",
          numero_orden: "ORD-001",
          cliente_id: "cli-1",
          tasa_id: "tasa-1",
          total_usd: 150.0,
        },
      ],
    };

    const sql = convertirBackupASql(backupMock);

    expect(sql).toContain("begin;");
    expect(sql).toContain("commit;");
    expect(sql).toContain("insert into public.perfiles");
    expect(sql).toContain("insert into public.clientes");
    expect(sql).toContain("insert into public.tasas_cambio");
    expect(sql).toContain("insert into public.pedidos");
    expect(sql).toContain("on conflict (id) do nothing;");

    // Verificar que perfiles e clientes aparecen antes de pedidos
    const posPerfiles = sql.indexOf("public.perfiles");
    const posPedidos = sql.indexOf("public.pedidos");
    expect(posPerfiles).toBeLessThan(posPedidos);
  });

  it("omite tablas sin registros sin romper la transacción SQL", () => {
    const backupVacio = {};
    const sql = convertirBackupASql(backupVacio);

    expect(sql).toContain("begin;");
    expect(sql).toContain("commit;");
    expect(sql).not.toContain("insert into");
  });
});
