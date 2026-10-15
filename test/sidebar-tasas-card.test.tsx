import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { SidebarTasasCard } from "@/components/shell/sidebar-tasas-card";

describe("SidebarTasasCard (Acordeones de Tasas BCV)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const propsBase = {
    tasaHoy: 877.9,
    tasaEurHoy: 982.76,
    tasaSiguiente: 879.12,
    tasaEurSiguiente: 977.68,
    fechaHoy: "2026-10-14",
    fechaSiguiente: "2026-10-15",
    esGerencial: true,
  };

  it("renderiza el título 'Tasas Referenciales BCV' y el enlace 'Ajustar' para perfil gerencial", () => {
    render(<SidebarTasasCard {...propsBase} />);

    expect(screen.getByText("Tasas Referenciales BCV")).toBeInTheDocument();
    expect(screen.getByText("Ajustar")).toBeInTheDocument();
  });

  it("mantiene el acordeón de Hoy abierto por defecto sin la palabra 'vigente' ni 'en vigencia'", () => {
    render(<SidebarTasasCard {...propsBase} />);

    // Título Hoy presente
    expect(screen.getByText("Hoy, 14/10/2026")).toBeInTheDocument();

    // No debe contener las palabras "vigente" o "en vigencia"
    expect(screen.queryByText(/en vigencia/i)).toBeNull();
    expect(screen.queryByText(/^vigente$/i)).toBeNull();

    // Tasas visibles inmediatamente
    expect(screen.getByText("Bs. 877.90")).toBeInTheDocument();
    expect(screen.getByText("Bs. 982.76")).toBeInTheDocument();

    // Permite colapsar el acordeón de Hoy y persiste en localStorage
    const botonHoy = screen.getByRole("button", { name: /Hoy, 14\/10\/2026/i });
    fireEvent.click(botonHoy);
    expect(screen.queryByText("Bs. 877.90")).toBeNull();
    expect(localStorage.getItem("apsys_tasas_acordeon_hoy")).toBe("false");
  });

  it("mantiene el acordeón de Mañana cerrado por defecto, NO incluye la palabra BCV en su título, y se despliega al hacer clic", () => {
    render(<SidebarTasasCard {...propsBase} />);

    // Encabezado de Mañana presente SIN la palabra BCV
    expect(screen.getByText("Mañana, 15/10/2026")).toBeInTheDocument();
    expect(screen.queryByText("BCV")).toBeNull();

    // Las tasas de mañana están ocultas inicialmente (cerrado por defecto)
    expect(screen.queryByText("Bs. 879.12")).toBeNull();
    expect(screen.queryByText("Bs. 977.68")).toBeNull();
    expect(screen.queryByText("Vigente a partir de medianoche")).toBeNull();

    // Desplegar acordeón de Mañana y verificar persistencia
    const botonManana = screen.getByRole("button", { name: /Mañana, 15\/10\/2026/i });
    fireEvent.click(botonManana);

    // Tasas de mañana visibles y sin la linea de medianoche
    expect(screen.getByText("Bs. 879.12")).toBeInTheDocument();
    expect(screen.getByText("Bs. 977.68")).toBeInTheDocument();
    expect(screen.queryByText("Vigente a partir de medianoche")).toBeNull();
    expect(localStorage.getItem("apsys_tasas_acordeon_manana")).toBe("true");
  });

  it("persiste el estado de apertura/cierre entre renders simulando navegación entre páginas", () => {
    // Simulamos que el usuario previamente cerró Hoy y abrió Mañana
    localStorage.setItem("apsys_tasas_acordeon_hoy", "false");
    localStorage.setItem("apsys_tasas_acordeon_manana", "true");

    render(<SidebarTasasCard {...propsBase} />);

    // Hoy debe estar cerrado según localStorage
    expect(screen.queryByText("Bs. 877.90")).toBeNull();

    // Mañana debe estar abierto según localStorage
    expect(screen.getByText("Bs. 879.12")).toBeInTheDocument();
    expect(screen.getByText("Bs. 977.68")).toBeInTheDocument();
  });
});
