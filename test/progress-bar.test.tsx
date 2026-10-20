import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ProgressBar,
  SegmentedProgressBar,
  PROGRESS_VARIANT_STYLES,
} from "@/components/ui/progress-bar";

describe("ProgressBar Component", () => {
  it("renderiza una barra simple con valor clamped entre 0 y 100", () => {
    const { container } = render(<ProgressBar value={45} variant="info" />);
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("aria-valuenow")).toBe("45");
  });

  it("aplica los estilos Tokyo Blue canónicos en la variante info", () => {
    const { container } = render(<ProgressBar value={70} variant="info" />);
    const innerBar = container.querySelector(".bg-\\[\\#5a82d6\\]");
    expect(innerBar).not.toBeNull();
    expect(innerBar?.className).toContain("dark:bg-[#7aa2f7]");
  });

  it("aplica los estilos Tokyo Amber canónicos en la variante warning", () => {
    const { container } = render(<ProgressBar value={30} variant="warning" />);
    const innerBar = container.querySelector(".bg-\\[\\#cf9b4e\\]");
    expect(innerBar).not.toBeNull();
    expect(innerBar?.className).toContain("dark:bg-[#e0af68]");
  });

  it("soporta SegmentedProgressBar multi-segmentos para carteras de cobro / aging", () => {
    render(
      <SegmentedProgressBar
        segments={[
          { key: "0_7", value: 50, variant: "info", title: "Tramo 1" },
          { key: "8_15", value: 30, variant: "warning", title: "Tramo 2" },
          { key: "16_30", value: 0, variant: "orange", title: "Tramo 3" },
        ]}
      />,
    );

    const segments = screen.getAllByTitle(/Tramo/);
    expect(segments).toHaveLength(2); // Tramo 3 tiene 0% y debe omitirse
    expect(segments[0].className).toContain("dark:bg-[#7aa2f7]");
    expect(segments[1].className).toContain("dark:bg-[#e0af68]");
  });

  it("expone el diccionario PROGRESS_VARIANT_STYLES para sincronizar badges y puntos", () => {
    expect(PROGRESS_VARIANT_STYLES.info.bar).toBe("bg-[#5a82d6] dark:bg-[#7aa2f7]");
    expect(PROGRESS_VARIANT_STYLES.warning.bar).toBe("bg-[#cf9b4e] dark:bg-[#e0af68]");
    expect(PROGRESS_VARIANT_STYLES.danger.bar).toBe("bg-[#cf586c] dark:bg-[#f7768e]");
    expect(PROGRESS_VARIANT_STYLES.success.bar).toBe("bg-[#4f8a5a] dark:bg-[#9ece6a]");
  });
});
