import { describe, expect, it } from "vitest";
import { mensajeDeErrorAuth } from "@/app/login/errores";

describe("mensajeDeErrorAuth", () => {
  it("credenciales inválidas → mensaje claro en español", () => {
    expect(
      mensajeDeErrorAuth({
        code: "invalid_credentials",
        message: "Invalid login credentials",
      }),
    ).toBe("Correo o contraseña incorrectos.");
  });

  it("cuenta sin confirmar → indica contactar a la gerencia", () => {
    expect(
      mensajeDeErrorAuth({
        code: "email_not_confirmed",
        message: "Email not confirmed",
      }),
    ).toBe("La cuenta todavía no está confirmada. Contacta a la gerencia.");
  });

  it("límite de intentos → pide esperar un momento", () => {
    expect(
      mensajeDeErrorAuth({
        code: null,
        message: "Request rate limit reached",
      }),
    ).toContain("Demasiados intentos");
  });

  it("error desconocido → mensaje genérico sin filtrar el original", () => {
    const mensaje = mensajeDeErrorAuth({
      code: "otro",
      message: "Internal server error at db-42",
    });

    expect(mensaje).toBe(
      "No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.",
    );
    expect(mensaje).not.toContain("Internal server error");
  });

  it("sin error → mensaje genérico", () => {
    expect(mensajeDeErrorAuth(null)).toContain("No pudimos iniciar sesión");
  });
});
