import { render, screen, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// Mock de Supabase Browser Client
const mockAuth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
};

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: mockAuth,
    from: mockFrom,
  }),
  getSupabaseBrowserClient: () => ({
    auth: mockAuth,
    from: mockFrom,
  }),
}));

import { AuthProvider, useAuth } from "@/context/auth-context";

// Componente consumidor de prueba
function ConsumerComponent() {
  const { user, rol, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Cargando sesión...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? "Autenticado" : "No autenticado"}</div>
      <div data-testid="user-id">{user?.id || "sin-usuario"}</div>
      <div data-testid="user-email">{user?.email || "sin-email"}</div>
      <div data-testid="user-role">{rol || "sin-rol"}</div>
      <button onClick={() => signOut()} data-testid="sign-out-btn">
        Cerrar Sesión
      </button>
    </div>
  );
}

describe("AuthContext (Client-First Session Management)", () => {
  let authListenerCallback: ((event: string, session: unknown) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authListenerCallback = null;

    mockAuth.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authListenerCallback = cb;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  it("lanza un error claro si useAuth se usa fuera de AuthProvider", () => {
    // Silenciar error en consola de React para esta prueba esperada
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ConsumerComponent />)).toThrow(
      "useAuth debe ser utilizado dentro de un AuthProvider",
    );

    spy.mockRestore();
  });

  it("hidrata inmediatamente sin parpadeo si se proporcionan initialUser e initialPerfil", () => {
    const initialUser = { id: "usr-123", email: "admin@apsys.com" };
    const initialPerfil = { rol: "gerencial" };

    render(
      <AuthProvider initialUser={initialUser} initialPerfil={initialPerfil}>
        <ConsumerComponent />
      </AuthProvider>,
    );

    // No debe mostrar estado de carga
    expect(screen.queryByTestId("loading")).toBeNull();
    expect(screen.getByTestId("auth-status")).toHaveTextContent("Autenticado");
    expect(screen.getByTestId("user-id")).toHaveTextContent("usr-123");
    expect(screen.getByTestId("user-email")).toHaveTextContent("admin@apsys.com");
    expect(screen.getByTestId("user-role")).toHaveTextContent("gerencial");
  });

  it("carga la sesión desde Supabase y consulta el perfil si no hay estado inicial", async () => {
    const fakeSession = {
      user: { id: "usr-operativo-1", email: "operador@apsys.com" },
    };

    mockAuth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { rol: "operativo" },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockFrom.mockReturnValue({ select: mockSelect });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    // Inicialmente puede mostrar carga
    expect(screen.getByTestId("loading")).toHaveTextContent("Cargando sesión...");

    // Tras resolver la sesión y el perfil
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("Autenticado");
    });

    expect(screen.getByTestId("user-id")).toHaveTextContent("usr-operativo-1");
    expect(screen.getByTestId("user-role")).toHaveTextContent("operativo");
    expect(mockFrom).toHaveBeenCalledWith("perfiles");
    expect(mockSelect).toHaveBeenCalledWith("rol");
    expect(mockEq).toHaveBeenCalledWith("usuario_id", "usr-operativo-1");
  });

  it("maneja sesión nula correctamente estableciendo isAuthenticated en falso", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("No autenticado");
    });

    expect(screen.getByTestId("user-id")).toHaveTextContent("sin-usuario");
    expect(screen.getByTestId("user-role")).toHaveTextContent("sin-rol");
  });

  it("reacciona en tiempo real a eventos onAuthStateChange (SIGNED_OUT)", async () => {
    const initialUser = { id: "usr-temp", email: "temp@apsys.com" };
    const initialPerfil = { rol: "operativo" };

    mockAuth.signOut.mockResolvedValue({ error: null });

    render(
      <AuthProvider initialUser={initialUser} initialPerfil={initialPerfil}>
        <ConsumerComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Autenticado");

    // Simular evento SIGNED_OUT emitido por Supabase Auth
    act(() => {
      if (authListenerCallback) {
        authListenerCallback("SIGNED_OUT", null);
      }
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("No autenticado");
    expect(screen.getByTestId("user-id")).toHaveTextContent("sin-usuario");
    expect(screen.getByTestId("user-role")).toHaveTextContent("sin-rol");
  });

  it("permite ejecutar signOut() cerrando sesión en Supabase y limpiando el estado", async () => {
    const initialUser = { id: "usr-logout", email: "logout@apsys.com" };
    const initialPerfil = { rol: "operativo" };

    mockAuth.signOut.mockResolvedValue({ error: null });

    render(
      <AuthProvider initialUser={initialUser} initialPerfil={initialPerfil}>
        <ConsumerComponent />
      </AuthProvider>,
    );

    const signOutBtn = screen.getByTestId("sign-out-btn");
    await act(async () => {
      signOutBtn.click();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId("auth-status")).toHaveTextContent("No autenticado");
  });

  it("limpia la suscripción a onAuthStateChange cuando el componente se desmonta", () => {
    const { unmount } = render(
      <AuthProvider initialUser={{ id: "u1" }}>
        <ConsumerComponent />
      </AuthProvider>,
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
