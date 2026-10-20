import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card, KpiCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Flame } from "lucide-react";

describe("Design System Atomic Components", () => {
  describe("Card & KpiCard", () => {
    it("renderiza un Card estático como div con fondo y bordes estándar", () => {
      const { container } = render(<Card>Contenido</Card>);
      const el = container.firstElementChild;
      expect(el?.tagName).toBe("DIV");
      expect(el?.className).toContain("rounded-2xl");
      expect(el?.className).toContain("dark:bg-[#1a1b26]");
    });

    it("renderiza un Card interactivo como button con micro-escala :active", () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Boton Card</Card>);
      const btn = screen.getByRole("button", { name: "Boton Card" });
      expect(btn).not.toBeNull();
      expect(btn.className).toContain("active:scale-[0.97]");
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renderiza KpiCard con título, valor audaz y subtítulo", () => {
      render(
        <KpiCard
          title="Total Facturado"
          value="$1,250.00"
          subtitle="En 15 órdenes"
          icon={DollarSign}
          variant="info"
        />,
      );

      expect(screen.getByText("Total Facturado")).not.toBeNull();
      expect(screen.getByText("$1,250.00")).not.toBeNull();
      expect(screen.getByText("En 15 órdenes")).not.toBeNull();
    });

    it("renderiza KpiCard como enlace accesible cuando se proporciona href", () => {
      render(
        <KpiCard
          title="Taller Activo"
          value="12"
          subtitle="Trabajos en curso"
          href="/taller?tab=activos"
        />,
      );

      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("/taller?tab=activos");
      expect(link.className).toContain("active:scale-[0.97]");
    });
  });

  describe("Badge Component", () => {
    it("renderiza variantes semánticas conectadas a los tokens Tokyo Night", () => {
      const { container } = render(
        <Badge variant="warning" icon={Flame}>
          En Producción
        </Badge>,
      );

      const badge = screen.getByText("En Producción");
      expect(badge).not.toBeNull();
      expect(container.querySelector("span")?.className).toContain("dark:text-[#e0af68]");
    });
  });

  describe("Button Component", () => {
    it("renderiza variante primary con micro-interacción y soporte de click", () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" onClick={handleClick}>
          Guardar Cambios
        </Button>,
      );

      const btn = screen.getByRole("button", { name: "Guardar Cambios" });
      expect(btn.className).toContain("active:scale-[0.97]");
      expect(btn.className).toContain("touch-manipulation");
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
