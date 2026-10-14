import { render, screen, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// Mock del cliente Supabase del navegador
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}));

import { TasasProvider, useTasas } from "@/context/tasas-context";

function ConsumerComponent() {
  const {
    tasaUsd,
    tasaEur,
    tasaSiguiente,
    isLoading,
    convertirUsdABs,
    convertirBsAUsd,
    refrescarTasas,
  } = useTasas();

  if (isLoading) {
    return <div data-testid="loading-tasas">Cargando tasas...</div>;
  }

  return (
    <div>
      <div data-testid="tasa-usd">{tasaUsd}</div>
      <div data-testid="tasa-eur">{tasaEur ?? "sin-eur"}</div>
      <div data-testid="tasa-siguiente">{tasaSiguiente ?? "sin-siguiente"}</div>
      <div data-testid="calc-usd-to-bs">{convertirUsdABs(10)}</div>
      <div data-testid="calc-bs-to-usd">{convertirBsAUsd(500)}</div>
      <button onClick={() => refrescarTasas()} data-testid="refresh-btn">
        Refrescar
      </button>
    </div>
  );
}

describe("TasasContext (Client-First Exchange Rates)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza un error descriptivo si useTasas se usa fuera de TasasProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ConsumerComponent />)).toThrow(
      "useTasas debe ser utilizado dentro de un TasasProvider",
    );

    spy.mockRestore();
  });

  it("hidrata inmediatamente sin parpadeo si se proporcionan initialTasas", () => {
    render(
      <TasasProvider
        initialTasas={{
          tasaUsd: 50.0,
          tasaEur: 54.5,
          tasaSiguiente: 51.2,
        }}
      >
        <ConsumerComponent />
      </TasasProvider>,
    );

    expect(screen.queryByTestId("loading-tasas")).toBeNull();
    expect(screen.getByTestId("tasa-usd")).toHaveTextContent("50");
    expect(screen.getByTestId("tasa-eur")).toHaveTextContent("54.5");
    expect(screen.getByTestId("tasa-siguiente")).toHaveTextContent("51.2");
  });

  it("ejecuta conversiones multimoneda matemáticas precisas en 0ms", () => {
    render(
      <TasasProvider
        initialTasas={{
          tasaUsd: 50.0,
        }}
      >
        <ConsumerComponent />
      </TasasProvider>,
    );

    // 10 USD * 50 = 500 Bs.
    expect(screen.getByTestId("calc-usd-to-bs")).toHaveTextContent("500");
    // 500 Bs. / 50 = 10 USD
    expect(screen.getByTestId("calc-bs-to-usd")).toHaveTextContent("10");
  });

  it("consulta Supabase para resolver tasa vigente y programada si no hay initialTasas", async () => {
    // Configurar mock de Supabase para tasa vigente y tasa programada
    const mockMaybeSingleVigente = vi.fn().mockResolvedValue({
      data: { valor_bs_por_usd: 52.5 },
      error: null,
    });
    const mockMaybeSingleProgramada = vi.fn().mockResolvedValue({
      data: { valor_bs_por_usd: 53.0 },
      error: null,
    });

    mockFrom.mockImplementation((tabla: string) => {
      if (tabla === "tasas_cambio") {
        return {
          select: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: mockMaybeSingleVigente,
                }),
              }),
            }),
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: mockMaybeSingleProgramada,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    render(
      <TasasProvider>
        <ConsumerComponent />
      </TasasProvider>,
    );

    expect(screen.getByTestId("loading-tasas")).toHaveTextContent("Cargando tasas...");

    await waitFor(() => {
      expect(screen.getByTestId("tasa-usd")).toHaveTextContent("52.5");
    });

    expect(screen.getByTestId("tasa-siguiente")).toHaveTextContent("53");
  });

  it("permite refrescar tasas a demanda mediante refrescarTasas()", async () => {
    const mockMaybeSingleVigente = vi.fn().mockResolvedValue({
      data: { valor_bs_por_usd: 55.0 },
      error: null,
    });

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        lte: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingleVigente,
            }),
          }),
        }),
        gt: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));

    render(
      <TasasProvider initialTasas={{ tasaUsd: 50.0 }}>
        <ConsumerComponent />
      </TasasProvider>,
    );

    expect(screen.getByTestId("tasa-usd")).toHaveTextContent("50");

    const btn = screen.getByTestId("refresh-btn");
    await act(async () => {
      btn.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("tasa-usd")).toHaveTextContent("55");
    });
  });
});
