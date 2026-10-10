import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, refresh: h.refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: h.signInWithPassword } }),
}));

import { LoginForm } from "@/app/login/login-form";

function enviarFormulario() {
  const boton = screen.getByRole("button", { name: /iniciar sesión/i });
  fireEvent.submit(boton.closest("form")!);
}

function completarCredenciales() {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "quien@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "secreto" },
  });
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con campos vacíos muestra un aviso y no llama a Supabase", async () => {
    render(<LoginForm />);

    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresá tu correo y tu contraseña.",
    );
    expect(h.signInWithPassword).not.toHaveBeenCalled();
  });

  it("con credenciales inválidas muestra el mensaje en español y no navega", async () => {
    h.signInWithPassword.mockResolvedValue({
      error: {
        code: "invalid_credentials",
        message: "Invalid login credentials",
      },
    });
    render(<LoginForm />);

    completarCredenciales();
    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Correo o contraseña incorrectos.",
    );
    expect(h.push).not.toHaveBeenCalled();
  });

  it("con login correcto navega al inicio", async () => {
    h.signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);

    completarCredenciales();
    enviarFormulario();

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/"));
    expect(h.refresh).toHaveBeenCalled();
  });
});
