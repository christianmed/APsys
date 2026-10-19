import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { FechaEnVivoBadge } from "@/components/shell/fecha-en-vivo-badge";

describe("Componente FechaEnVivoBadge (Fase 32)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debe renderizar la fecha larga en español para la hora de Caracas", () => {
    // 2026-10-18 21:30 en Caracas = 2026-10-19 01:30 UTC
    vi.setSystemTime(new Date("2026-10-19T01:30:00.000Z"));

    render(<FechaEnVivoBadge />);

    const badge = screen.getByRole("status");
    expect(badge).toBeDefined();
    expect(badge.textContent?.toLowerCase()).toContain("domingo");
    expect(badge.textContent?.toLowerCase()).toContain("18");
    expect(badge.textContent?.toLowerCase()).toContain("octubre");
    expect(badge.textContent?.toLowerCase()).toContain("2026");
  });

  it("debe actualizar la fecha automáticamente cuando transcurre la medianoche sin recargar", () => {
    // 2026-10-18 23:59:50 en Caracas = 2026-10-19 03:59:50 UTC (10 segundos antes de medianoche)
    vi.setSystemTime(new Date("2026-10-19T03:59:50.000Z"));

    render(<FechaEnVivoBadge />);

    expect(screen.getByRole("status").textContent?.toLowerCase()).toContain("domingo");

    // Avanzar el tiempo 15 segundos (cruza las 00:00:00 de Caracas)
    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    // Ahora debe decir lunes 19 de octubre
    expect(screen.getByRole("status").textContent?.toLowerCase()).toContain("lunes");
    expect(screen.getByRole("status").textContent?.toLowerCase()).toContain("19");
  });
});
