import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";

describe("CustomSelect (Universal Accessible Component)", () => {
  const sampleOptions: CustomSelectOption<string>[] = [
    { value: "opt-1", label: "Pendones", subtitle: "Impresión gran formato" },
    { value: "opt-2", label: "Viniles", subtitle: "Rotulación brillante" },
    { value: "opt-3", label: "Microperforado", subtitle: "Vidrieras y vehículos" },
    { value: "opt-4", label: "Deshabilitado", disabled: true },
  ];

  it("renderiza el placeholder por defecto si no hay opción seleccionada", () => {
    render(<CustomSelect options={sampleOptions} placeholder="Selecciona un servicio" />);
    expect(screen.getByText("Selecciona un servicio")).toBeDefined();
  });

  it("renderiza la etiqueta de la opción seleccionada según el prop value", () => {
    render(<CustomSelect options={sampleOptions} value="opt-2" />);
    expect(screen.getByText("Viniles")).toBeDefined();
  });

  it("abre y cierra el desplegable al hacer clic en el botón disparador", () => {
    render(<CustomSelect options={sampleOptions} placeholder="Abrir menú" />);
    const trigger = screen.getByRole("button", { name: "Abrir menú" });

    // Inicialmente cerrado
    expect(screen.queryByRole("listbox")).toBeNull();

    // Abrir
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("Microperforado")).toBeDefined();

    // Cerrar
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selecciona una opción al hacer clic y dispara onChange con el nuevo valor", () => {
    const handleChange = vi.fn();
    render(<CustomSelect options={sampleOptions} onChange={handleChange} placeholder="Servicios" />);

    // Abrir
    fireEvent.click(screen.getByRole("button", { name: "Servicios" }));

    // Clic en la opción opt-3
    const option = screen.getByText("Microperforado");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("opt-3");
    // El menú debe haberse cerrado tras la selección
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("no selecciona ni dispara onChange si la opción tiene disabled: true", () => {
    const handleChange = vi.fn();
    render(<CustomSelect options={sampleOptions} onChange={handleChange} placeholder="Servicios" />);

    fireEvent.click(screen.getByRole("button", { name: "Servicios" }));
    const disabledOption = screen.getByText("Deshabilitado");
    fireEvent.click(disabledOption);

    expect(handleChange).not.toHaveBeenCalled();
    // El menú permanece abierto
    expect(screen.getByRole("listbox")).toBeDefined();
  });

  it("filtra opciones en tiempo real por label y subtitle cuando searchable es true", () => {
    render(<CustomSelect options={sampleOptions} searchable placeholder="Buscar servicio" />);

    fireEvent.click(screen.getByRole("button", { name: "Buscar servicio" }));
    const searchInput = screen.getByPlaceholderText("Buscar...");

    // Búsqueda por parte del label
    fireEvent.change(searchInput, { target: { value: "vini" } });
    expect(screen.getByText("Viniles")).toBeDefined();
    expect(screen.queryByText("Pendones")).toBeNull();

    // Búsqueda por subtitle
    fireEvent.change(searchInput, { target: { value: "vidrieras" } });
    expect(screen.getByText("Microperforado")).toBeDefined();
    expect(screen.queryByText("Viniles")).toBeNull();

    // Búsqueda sin coincidencias
    fireEvent.change(searchInput, { target: { value: "inexistente" } });
    expect(screen.getByText("No se encontraron opciones")).toBeDefined();
  });

  it("cierra el menú al presionar la tecla Escape", () => {
    render(<CustomSelect options={sampleOptions} placeholder="Menú con escape" />);

    fireEvent.click(screen.getByRole("button", { name: "Menú con escape" }));
    expect(screen.getByRole("listbox")).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("cierra el menú al hacer clic fuera del componente", () => {
    render(
      <div>
        <div data-testid="outside">Afuera</div>
        <CustomSelect options={sampleOptions} placeholder="Menú click outside" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Menú click outside" }));
    expect(screen.getByRole("listbox")).toBeDefined();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renderiza el botón de acción rápida y ejecuta su callback onClick", () => {
    const handleAction = vi.fn();
    render(
      <CustomSelect
        options={sampleOptions}
        placeholder="Clientes"
        actionButton={{ label: "+ Nuevo Cliente", onClick: handleAction }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
    const actionBtn = screen.getByRole("button", { name: "+ Nuevo Cliente" });
    expect(actionBtn).toBeDefined();

    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renderiza la variante header correctamente", () => {
    render(
      <CustomSelect
        options={sampleOptions}
        value="opt-1"
        variant="header"
        headerTitle="MIS SERVICIOS"
      />
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toBeDefined();
    expect(screen.getByText("Pendones")).toBeDefined();

    fireEvent.click(trigger);
    expect(screen.getByText("MIS SERVICIOS")).toBeDefined();
    expect(screen.getByText("4 disp.")).toBeDefined();
  });

  it("inyecta input hidden con name y value para soporte en formularios", () => {
    const { container } = render(
      <CustomSelect options={sampleOptions} value="opt-1" name="cliente_id" />
    );

    const hiddenInput = container.querySelector('input[type="hidden"][name="cliente_id"]') as HTMLInputElement;
    expect(hiddenInput).toBeDefined();
    expect(hiddenInput.value).toBe("opt-1");
  });

  it("respeta el estado disabled y no abre el menú", () => {
    render(<CustomSelect options={sampleOptions} disabled placeholder="Deshabilitado" />);
    const trigger = screen.getByRole("button", { name: "Deshabilitado" });

    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("aplica los tokens oficiales del Sistema de Diseño Tokyo Night (#16161e, #1a1b26, #24283b)", () => {
    render(<CustomSelect options={sampleOptions} placeholder="Seleccionar" />);
    const trigger = screen.getByRole("button", { name: "Seleccionar" });

    expect(trigger.className).toContain("dark:bg-[#16161e]");
    expect(trigger.className).toContain("dark:border-[#24283b]");

    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox.className).toContain("dark:bg-[#1a1b26]");
    expect(listbox.className).toContain("dark:border-[#2f3654]");
  });
});
