import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Search, AlertCircle } from "lucide-react";

describe("Canonical Atomic Components (Phase 39)", () => {
  describe("Input Component", () => {
    it("renderiza un input estándar con clases de foco Tokyo Night", () => {
      render(<Input placeholder="Buscar cliente..." />);
      const input = screen.getByPlaceholderText("Buscar cliente...");
      expect(input).not.toBeNull();
      expect(input.className).toContain("rounded-xl");
      expect(input.className).toContain("dark:bg-[#16161e]");
      expect(input.className).toContain("dark:focus:border-[#7aa2f7]");
    });

    it("soporta icono izquierdo integrado", () => {
      const { container } = render(
        <Input placeholder="Buscar..." icon={Search} />
      );
      expect(container.querySelector("svg")).not.toBeNull();
      const input = screen.getByPlaceholderText("Buscar...");
      expect(input.className).toContain("pl-9");
    });

    it("aplica variante de error cuando error es true o string", () => {
      render(
        <Input placeholder="Campo obligatorio" error="Este campo es requerido" />
      );
      expect(screen.getByText("Este campo es requerido")).not.toBeNull();
      const input = screen.getByPlaceholderText("Campo obligatorio");
      expect(input.className).toContain("border-rose-500");
    });
  });

  describe("Alert Component", () => {
    it("renderiza una alerta con variante warning y cromo neutro", () => {
      render(
        <Alert
          title="Sin demanda"
          variant="warning"
          icon={AlertCircle}
        >
          No hay órdenes registradas.
        </Alert>
      );

      expect(screen.getByText("Sin demanda")).not.toBeNull();
      expect(screen.getByText("No hay órdenes registradas.")).not.toBeNull();
    });
  });

  describe("Tabs Component", () => {
    it("renderiza las pestañas y ejecuta onChange al seleccionar una", () => {
      const handleChange = vi.fn();
      const items = [
        { key: "todos", label: "Todos (10)" },
        { key: "recibido", label: "Recibido (4)" },
      ];

      render(
        <Tabs items={items} activeKey="todos" onChange={handleChange} />
      );

      const recibidoTab = screen.getByRole("tab", { name: "Recibido (4)" });
      fireEvent.click(recibidoTab);
      expect(handleChange).toHaveBeenCalledWith("recibido");
    });

    it("aplica micro-escala active:scale-[0.97] y touch-manipulation", () => {
      render(
        <Tabs
          items={[{ key: "1", label: "Pestaña 1" }]}
          activeKey="1"
          onChange={() => {}}
        />
      );
      const tab = screen.getByRole("tab");
      expect(tab.className).toContain("active:scale-[0.97]");
      expect(tab.className).toContain("touch-manipulation");
    });
  });

  describe("Modal Component", () => {
    it("no renderiza cuando isOpen es false", () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Título">
          Contenido modal
        </Modal>
      );
      expect(screen.queryByText("Contenido modal")).toBeNull();
    });

    it("renderiza contenido y permite cerrar con tecla Escape o botón", () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Cobrar Orden">
          Contenido modal
        </Modal>
      );

      expect(screen.getByText("Cobrar Orden")).not.toBeNull();
      expect(screen.getByText("Contenido modal")).not.toBeNull();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
