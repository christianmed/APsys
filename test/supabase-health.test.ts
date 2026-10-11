// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/supabase-health/route";

const h = vi.hoisted(() => {
  const from = vi.fn();
  return {
    from,
    createClient: vi.fn(async () => ({ from })),
  };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: h.createClient }));

/** Simula la cadena postgrest: from().select().limit() → resultado. */
function respuesta(result: { count: number | null; error: unknown }) {
  return {
    select: () => ({
      limit: () => Promise.resolve(result),
    }),
  };
}

describe("GET /api/supabase-health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("esquema aplicado: reporta alcance, esquema y conteo", async () => {
    h.from.mockReturnValue(respuesta({ count: 3, error: null }));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ reachable: true, schemaReady: true, count: 3 });
  });

  it("tabla ausente (PGRST205): alcanzable sin esquema, sin conteo", async () => {
    h.from.mockReturnValue(
      respuesta({
        count: null,
        error: {
          code: "PGRST205",
          message: "table not found",
          details: null,
          hint: null,
        },
      }),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ reachable: true, schemaReady: false });
  });

  it("fallo de consulta: 503 con código, sin filtrar el detalle interno", async () => {
    h.from.mockReturnValue(
      respuesta({
        count: null,
        error: {
          code: "42501",
          message: "permission denied for table clientes",
          details: null,
          hint: null,
        },
      }),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      reachable: false,
      schemaReady: false,
      error: "42501",
    });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("configuración ausente: 503 genérico, sin filtrar el error de inicialización", async () => {
    h.createClient.mockRejectedValueOnce(
      new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local"),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      reachable: false,
      schemaReady: false,
      error: "configuracion_ausente",
    });
    expect(JSON.stringify(body)).not.toContain("NEXT_PUBLIC_SUPABASE_URL");
  });
});
