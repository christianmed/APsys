import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks para servicios externos
const mockObtenerTasasBcvCompletas = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/tasas/bcv-service", () => ({
  obtenerTasasBcvCompletas: () => mockObtenerTasasBcvCompletas(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (tabla: string) => mockAdminFrom(tabla),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Importar el handler bajo prueba
import { GET } from "@/app/api/cron/sincronizar-tasas/route";

describe("GET /api/cron/sincronizar-tasas (Fase 27 - TDD)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret-12345";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  describe("Seguridad y Autorización", () => {
    it("rechaza peticiones sin cabecera Authorization con 401", async () => {
      const request = new Request("https://apsys.local/api/cron/sincronizar-tasas");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toMatch(/no autorizado/i);
    });

    it("rechaza peticiones con Bearer token incorrecto con 401", async () => {
      const request = new Request("https://apsys.local/api/cron/sincronizar-tasas", {
        headers: { Authorization: "Bearer token-invalido" },
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toMatch(/token inválido/i);
    });
  });

  describe("Lógica de Sincronización e Idempotencia", () => {
    it("omite inserción si la tasa para esa vigencia ya está registrada (Idempotencia)", async () => {
      mockObtenerTasasBcvCompletas.mockResolvedValueOnce({
        usd: {
          moneda: "USD",
          valorBs: 880.1159,
          fechaActualizacion: "2026-10-16",
          fuente: "BCV",
        },
        eur: null,
      });

      // Simular que en tasas_cambio ya existe
      mockAdminFrom.mockImplementation((tabla: string) => {
        if (tabla === "tasas_cambio") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "tasa-existente-1", valor_bs_por_usd: 880.1159 },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new Request("https://apsys.local/api/cron/sincronizar-tasas", {
        headers: { Authorization: "Bearer test-cron-secret-12345" },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.exito).toBe(true);
      expect(json.accion).toBe("al_dia");
      expect(json.valor).toBe(880.1159);
    });

    it("inserta la nueva tasa y registra en auditoría cuando no existe", async () => {
      mockObtenerTasasBcvCompletas.mockResolvedValueOnce({
        usd: {
          moneda: "USD",
          valorBs: 882.5,
          fechaActualizacion: "2026-10-16",
          fuente: "BCV",
        },
        eur: null,
      });

      const mockInsertTasas = vi.fn().mockResolvedValue({ error: null });
      const mockInsertAuditoria = vi.fn().mockResolvedValue({ error: null });

      mockAdminFrom.mockImplementation((tabla: string) => {
        if (tabla === "tasas_cambio") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null, // No existe aún
                  error: null,
                }),
              }),
            }),
            insert: mockInsertTasas,
          };
        }
        if (tabla === "auditoria") {
          return {
            insert: mockInsertAuditoria,
          };
        }
        return {};
      });

      const request = new Request("https://apsys.local/api/cron/sincronizar-tasas", {
        headers: { Authorization: "Bearer test-cron-secret-12345" },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.exito).toBe(true);
      expect(json.accion).toBe("insertada");
      expect(json.valor).toBe(882.5);

      expect(mockInsertTasas).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_bs_por_usd: 882.5,
          vigente_desde: expect.stringContaining("2026-10-16T00:00:00-04:00"),
        }),
      );

      expect(mockInsertAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          tabla: "tasas_cambio",
          accion: "INSERT",
        }),
      );
    });

    it("devuelve 502 si la API del BCV no devuelve datos válidos", async () => {
      mockObtenerTasasBcvCompletas.mockResolvedValueOnce({
        usd: null,
        eur: null,
      });

      const request = new Request("https://apsys.local/api/cron/sincronizar-tasas", {
        headers: { Authorization: "Bearer test-cron-secret-12345" },
      });

      const response = await GET(request);
      expect(response.status).toBe(502);

      const json = await response.json();
      expect(json.exito).toBe(false);
      expect(json.error).toMatch(/no se pudo obtener/i);
    });
  });
});
