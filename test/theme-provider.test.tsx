import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "@/components/providers/theme-provider";

function TestConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="btn-toggle" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="btn-set-dark" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button data-testid="btn-set-light" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("ThemeProvider y Hook useTheme (Fase 33)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
  });

  it("debe inicializar en modo dark si está guardado en localStorage", () => {
    localStorage.setItem("apsys-theme", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("debe alternar entre dark y light al llamar a toggleTheme", () => {
    localStorage.setItem("apsys-theme", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("dark");

    // Click toggle -> pasa a light
    act(() => {
      fireEvent.click(screen.getByTestId("btn-toggle"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("apsys-theme")).toBe("light");

    // Click toggle -> pasa a dark
    act(() => {
      fireEvent.click(screen.getByTestId("btn-toggle"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("apsys-theme")).toBe("dark");
  });

  it("debe permitir fijar explícitamente el tema con setTheme", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("light");

    act(() => {
      fireEvent.click(screen.getByTestId("btn-set-dark"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("apsys-theme")).toBe("dark");

    act(() => {
      fireEvent.click(screen.getByTestId("btn-set-light"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("apsys-theme")).toBe("light");
  });
});
