import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CursorPagination } from "@/components/ui/cursor-pagination";

describe("Componente CursorPagination", () => {
  it("no renderiza nada si no hay cursor activo ni siguiente página", () => {
    const { container } = render(
      <CursorPagination baseUrl="/pedidos" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza solo [ Siguiente → ] en la primera página cuando hay más resultados", () => {
    render(
      <CursorPagination
        baseUrl="/pedidos"
        siguienteCursor={1025}
      />,
    );

    const botonSiguiente = screen.getByRole("link", { name: "Siguiente →" });
    expect(botonSiguiente).toBeDefined();
    expect(botonSiguiente.getAttribute("href")).toBe("/pedidos?cursor=1025");

    // En la primera página no debe haber enlace navegable para "Inicio"
    expect(screen.queryByRole("link", { name: "← Inicio" })).toBeNull();
  });

  it("renderiza ambos botones [ ← Inicio ] y [ Siguiente → ] en páginas intermedias", () => {
    render(
      <CursorPagination
        baseUrl="/pedidos"
        cursorActivo={1025}
        siguienteCursor={1000}
      />,
    );

    const botonInicio = screen.getByRole("link", { name: "← Inicio" });
    const botonSiguiente = screen.getByRole("link", { name: "Siguiente →" });

    expect(botonInicio).toBeDefined();
    expect(botonInicio.getAttribute("href")).toBe("/pedidos");

    expect(botonSiguiente).toBeDefined();
    expect(botonSiguiente.getAttribute("href")).toBe("/pedidos?cursor=1000");
  });

  it("renderiza solo [ ← Inicio ] en la última página", () => {
    render(
      <CursorPagination
        baseUrl="/pedidos"
        cursorActivo={1000}
        siguienteCursor={null}
      />,
    );

    const botonInicio = screen.getByRole("link", { name: "← Inicio" });
    expect(botonInicio).toBeDefined();
    expect(botonInicio.getAttribute("href")).toBe("/pedidos");

    expect(screen.queryByRole("link", { name: "Siguiente →" })).toBeNull();
  });

  it("preserva los parámetros de búsqueda existentes (como q=banner)", () => {
    render(
      <CursorPagination
        baseUrl="/clientes"
        searchParams={{ q: "empresa" }}
        cursorActivo="2026-10-15T12:00:00Z"
        siguienteCursor="2026-10-14T10:00:00Z"
      />,
    );

    const botonInicio = screen.getByRole("link", { name: "← Inicio" });
    const botonSiguiente = screen.getByRole("link", { name: "Siguiente →" });

    expect(botonInicio.getAttribute("href")).toBe("/clientes?q=empresa");
    expect(botonSiguiente.getAttribute("href")).toBe(
      "/clientes?q=empresa&cursor=2026-10-14T10%3A00%3A00Z",
    );
  });
});
