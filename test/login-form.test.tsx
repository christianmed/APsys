import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignInWithPassword = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

import { LoginForm } from "@/app/login/login-form";

describe("LoginForm (Robustez y Reseteo de Estado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza campos de entrada y botón de inicio habilitados al montar", () => {
    render(<LoginForm />);

    const correoInput = screen.getByLabelText(/correo electrónico/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const boton = screen.getByRole("button", { name: /iniciar sesión/i });

    expect(correoInput).toBeEnabled();
    expect(passInput).toBeEnabled();
    expect(boton).toBeEnabled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("muestra error si los campos están vacíos sin bloquear el botón", async () => {
    render(<LoginForm />);

    const boton = screen.getByRole("button", { name: /iniciar sesión/i });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ingresá tu correo y tu contraseña.",
      );
    });

    expect(boton).toBeEnabled();
  });

  it("restablece el botón de inicio si Supabase devuelve error de credenciales", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginForm />);

    const correoInput = screen.getByLabelText(/correo electrónico/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const boton = screen.getByRole("button", { name: /iniciar sesión/i });

    fireEvent.change(correoInput, { target: { value: "operador@apsys.com" } });
    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // El botón debe quedar habilitado tras el intento fallido
    expect(boton).toBeEnabled();
  });

  it("restablece el botón con finally si ocurre una excepción de red o runtime", async () => {
    mockSignInWithPassword.mockRejectedValueOnce(new Error("Network failed"));

    render(<LoginForm />);

    const correoInput = screen.getByLabelText(/correo electrónico/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const boton = screen.getByRole("button", { name: /iniciar sesión/i });

    fireEvent.change(correoInput, { target: { value: "operador@apsys.com" } });
    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ocurrió un error inesperado al intentar iniciar sesión.",
      );
    });

    expect(boton).toBeEnabled();
  });
});
