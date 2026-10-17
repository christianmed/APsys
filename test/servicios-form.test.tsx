import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ServicioForm } from "@/app/servicios/servicio-form";

// Mock de useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Componente ServicioForm (Fase 31)", () => {
  it("modo crear: muestra etiqueta de Prioridad en Catálogo y no muestra botón de eliminación", () => {
    render(<ServicioForm modo="crear" />);

    expect(screen.getByText("Prioridad en Catálogo (Posición)")).toBeDefined();
    expect(screen.queryByText(/Eliminar servicio definitivamente/i)).toBeNull();
  });

  it("modo editar con 0 pedidos: muestra botón de eliminación segura y checkbox de activo con texto explicativo", () => {
    render(
      <ServicioForm
        modo="editar"
        servicio={{
          id: "serv-test-1",
          nombre: "Servicio Temporal",
          orden: 99,
          activo: true,
        }}
        pedidosAsociados={0}
      />,
    );

    expect(screen.getByText("Prioridad en Catálogo (Posición)")).toBeDefined();
    expect(screen.getByText("Servicio Activo en Catálogo")).toBeDefined();
    expect(screen.getByRole("button", { name: /Eliminar servicio definitivamente/i })).toBeDefined();
    expect(screen.queryByText(/Protección de Integridad Histórica/i)).toBeNull();
  });

  it("modo editar con pedidos vinculados: bloquea botón de eliminación y muestra alerta de protección histórica", () => {
    render(
      <ServicioForm
        modo="editar"
        servicio={{
          id: "serv-test-2",
          nombre: "Pendones",
          orden: 1,
          activo: true,
        }}
        pedidosAsociados={8}
      />,
    );

    expect(screen.getByText(/Protección de Integridad Histórica/i)).toBeDefined();
    expect(screen.getByText(/8 pedidos registrados/i)).toBeDefined();
    // No debe existir el botón para eliminar
    expect(screen.queryByRole("button", { name: /Eliminar servicio definitivamente/i })).toBeNull();
  });
});
