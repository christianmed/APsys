import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertTriangle, Layers } from "lucide-react";

describe("Break-UI Adversarial Stress Testing (Phase 41)", () => {
  const EXTREME_DATA = {
    longName:
      "Corporación Gráfica y Publicitaria Latinoamericana e Intercontinental de Oriente y Occidente S.A.",
    unbreakableEmail:
      "bartholomew.fitzgerald.von.humboldt@northwind-industries-holdings-international-conglomerate.example.com",
    massiveMoney: "$1,894,520,340,999.50",
    massiveBsMoney: "Bs. 98,765,432,100,500.25",
    longUrl:
      "https://portal.apsys-enterprise-solutions.internal.corp/ventas/ordenes/produccion/talleres/lotes/2026/caracas?filter=critical&sort=desc",
    oneChar: "A",
    empty: "",
    extremeError:
      "FATAL_POSTGRES_TRANSACTION_VIOLATION_CODE_42703_UNDEFINED_COLUMN_IN_QUERY_EXECUTION_CONTEXT_AT_SUPABASE_DATABASE_CONNECTOR",
  };

  describe("KpiCard Stress Resistance", () => {
    it("resiste títulos y valores numéricos astronómicos sin colapso de layout", () => {
      const { container } = render(
        <KpiCard
          title={EXTREME_DATA.longName}
          value={EXTREME_DATA.massiveMoney}
          subtitle={EXTREME_DATA.unbreakableEmail}
          icon={DollarSign}
          variant="success"
        />
      );

      const titleEl = screen.getByText(EXTREME_DATA.longName);
      expect(titleEl.className).toContain("min-w-0");
      expect(titleEl.className).toContain("truncate");

      const valueEl = screen.getByText(EXTREME_DATA.massiveMoney);
      expect(valueEl.className).toContain("truncate");

      const subtitleEl = screen.getByText(EXTREME_DATA.unbreakableEmail);
      expect(subtitleEl.className).toContain("break-words");

      const iconWrapper = container.querySelector(".shrink-0");
      expect(iconWrapper).not.toBeNull();
    });

    it("maneja valores de 1 solo caracter y sin subtítulo", () => {
      render(
        <KpiCard
          title={EXTREME_DATA.oneChar}
          value={EXTREME_DATA.oneChar}
        />
      );

      expect(screen.getAllByText(EXTREME_DATA.oneChar).length).toBe(2);
    });
  });

  describe("Badge Stress Resistance", () => {
    it("preserva el icono con shrink-0 ante etiquetas de estado extensas", () => {
      const { container } = render(
        <Badge icon={AlertTriangle} variant="warning">
          {EXTREME_DATA.longName}
        </Badge>
      );

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("shrink-0");
      expect(screen.getByText(EXTREME_DATA.longName)).not.toBeNull();
    });
  });

  describe("Alert Stress Resistance", () => {
    it("aplica break-words en mensajes de error largos y títulos densos", () => {
      render(
        <Alert
          title={EXTREME_DATA.longName}
          variant="danger"
        >
          {EXTREME_DATA.extremeError}
        </Alert>
      );

      const titleEl = screen.getByText(EXTREME_DATA.longName);
      expect(titleEl.className).toContain("break-words");

      const errorEl = screen.getByText(EXTREME_DATA.extremeError);
      expect(errorEl.className).toContain("break-words");
    });
  });

  describe("Input Stress Resistance", () => {
    it("mantiene el icono con shrink-0 y maneja mensajes de error extensos", () => {
      render(
        <Input
          placeholder="Buscar..."
          icon={Layers}
          error={EXTREME_DATA.extremeError}
          defaultValue={EXTREME_DATA.unbreakableEmail}
        />
      );

      const errorMsg = screen.getByText(EXTREME_DATA.extremeError);
      expect(errorMsg.className).toContain("break-words");

      const input = screen.getByDisplayValue(EXTREME_DATA.unbreakableEmail);
      expect(input).not.toBeNull();
    });
  });

  describe("Modal Stress Resistance", () => {
    it("mantiene el botón de cierre intacto y el cuerpo con scroll controlado", () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title={EXTREME_DATA.longName}
          description={EXTREME_DATA.unbreakableEmail}
        >
          <div style={{ height: "1500px" }}>Contenido gigante de prueba</div>
        </Modal>
      );

      const titleEl = screen.getByText(EXTREME_DATA.longName);
      expect(titleEl.className).toContain("break-words");

      const bodyContainer = screen.getByText("Contenido gigante de prueba").parentElement;
      expect(bodyContainer?.className).toContain("overflow-y-auto");
      expect(bodyContainer?.className).toContain("max-h-[75vh]");

      const closeBtn = screen.getByRole("button", { name: "Cerrar modal" });
      expect(closeBtn.className).toContain("shrink-0");
    });
  });

  describe("Tabs Stress Resistance", () => {
    it("soporta etiquetas largas aplicando truncate e iconos con shrink-0", () => {
      const items = [
        {
          key: "tab-1",
          label: EXTREME_DATA.longName,
          icon: Layers,
          badge: <Badge variant="info">100</Badge>,
        },
      ];

      render(<Tabs items={items} activeKey="tab-1" onChange={vi.fn()} />);

      const label = screen.getByText(EXTREME_DATA.longName);
      expect(label.className).toContain("truncate");
    });
  });

  describe("Button Stress Resistance", () => {
    it("mantiene shrink-0 en icono aun con etiquetas de botón extensas", () => {
      const { container } = render(
        <Button icon={DollarSign} variant="primary">
          {EXTREME_DATA.longName}
        </Button>
      );

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("shrink-0");
      expect(screen.getByText(EXTREME_DATA.longName)).not.toBeNull();
    });
  });
});
