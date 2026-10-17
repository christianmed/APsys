import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CobrarYEntregarModal } from "@/app/taller/cobrar-entregar-modal";

// Mock de Server Action cobrarYEntregarPedido
vi.mock("@/app/pedidos/actions", () => ({
  cobrarYEntregarPedido: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Componente CobrarYEntregarModal (Fase 31)", () => {
  it("no renderiza nada cuando abierto es false", () => {
    const { container } = render(
      <CobrarYEntregarModal
        pedidoId="p-123"
        numeroOrden={1005}
        clienteNombre="Dylan"
        saldoUsd={10.0}
        tasaBs={40.0}
        abierto={false}
        alCerrar={() => {}}
        alCompletar={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza orden, cliente, saldo USD y saldo Bs cuando abierto es true", () => {
    render(
      <CobrarYEntregarModal
        pedidoId="p-123"
        numeroOrden={1005}
        clienteNombre="Dylan"
        saldoUsd={10.0}
        tasaBs={40.0}
        abierto={true}
        alCerrar={() => {}}
        alCompletar={() => {}}
      />,
    );

    expect(screen.getByText(/ORD-1005 · Dylan/i)).toBeDefined();
    expect(screen.getByText(/\$10\.00/i)).toBeDefined();
    expect(screen.getByText(/Bs\.\s*400[,.]00/i)).toBeDefined();
  });

  it("cambia el monto por defecto al alternar entre USD y Bs", () => {
    render(
      <CobrarYEntregarModal
        pedidoId="p-123"
        numeroOrden={1005}
        clienteNombre="Dylan"
        saldoUsd={15.0}
        tasaBs={40.0}
        abierto={true}
        alCerrar={() => {}}
        alCompletar={() => {}}
      />,
    );

    const inputMonto = screen.getByLabelText(/Monto a Cobrar/i) as HTMLInputElement;
    expect(inputMonto.value).toBe("15.00");

    // Cambiar a Bolívares
    const botonBs = screen.getByRole("button", { name: /Bolívares \(Bs\)/i });
    fireEvent.click(botonBs);

    // 15 * 40 = 600
    expect(inputMonto.value).toBe("600.00");
  });

  it("permite cancelar y llama a alCerrar", () => {
    const alCerrar = vi.fn();
    render(
      <CobrarYEntregarModal
        pedidoId="p-123"
        numeroOrden={1005}
        clienteNombre="Dylan"
        saldoUsd={10.0}
        tasaBs={40.0}
        abierto={true}
        alCerrar={alCerrar}
        alCompletar={() => {}}
      />,
    );

    const botonCancelar = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(botonCancelar);
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });
});
