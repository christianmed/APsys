import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => "/pedidos",
}));

const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockUseAuth = vi.fn();
const mockUseTasas = vi.fn();

vi.mock("@/context/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/context/tasas-context", () => ({
  useTasas: () => mockUseTasas(),
}));

import { AuthenticatedShell } from "@/components/shell/authenticated-shell";

describe("AuthenticatedShell (Client Component Transition)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTasas.mockReturnValue({
      tasaUsd: 51.5,
      tasaEur: 55.0,
      tasaSiguiente: 52.0,
      isLoading: false,
    });
  });

  it("renderiza el cascarón con datos de usuario y tasas en 0ms desde la memoria", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "usr-1", email: "admin@apsys.com" },
      perfil: { rol: "gerencial" },
      isLoading: false,
      isAuthenticated: true,
      signOut: mockSignOut,
    });

    render(
      <AuthenticatedShell>
        <div data-testid="child-content">Contenido de la página</div>
      </AuthenticatedShell>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("admin@apsys.com")).toBeInTheDocument();
    expect(screen.getAllByText(/51\.50/).length).toBeGreaterThanOrEqual(1);
  });

  it("redirige a /login si termina de cargar y no existe usuario autenticado", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      perfil: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: mockSignOut,
    });

    render(
      <AuthenticatedShell>
        <div>Contenido protegido</div>
      </AuthenticatedShell>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("ejecuta signOut y redirige a /login al pulsar el botón de cerrar sesión", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "usr-1", email: "operador@apsys.com" },
      perfil: { rol: "operativo" },
      isLoading: false,
      isAuthenticated: true,
      signOut: mockSignOut,
    });

    render(
      <AuthenticatedShell>
        <div>Contenido</div>
      </AuthenticatedShell>,
    );

    const logoutButtons = screen.getAllByRole("button", { name: /cerrar sesión/i });
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
