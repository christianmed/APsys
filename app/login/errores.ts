/**
 * Traduce errores de Supabase Auth a mensajes en español para el formulario de
 * acceso. Nunca reenvía el texto original del error (puede traer detalles
 * internos) y no revela si la cuenta existe o no: ambos casos de credenciales
 * inválidas comparten el mismo mensaje.
 */
type ErrorAuth = { code?: string | null; message?: string | null } | null;

const MENSAJE_GENERICO =
  "No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.";

export function mensajeDeErrorAuth(error: ErrorAuth): string {
  if (!error) {
    return MENSAJE_GENERICO;
  }

  const texto = (error.message ?? "").toLowerCase();

  if (
    error.code === "invalid_credentials" ||
    texto.includes("invalid login credentials")
  ) {
    return "Correo o contraseña incorrectos.";
  }

  if (
    error.code === "email_not_confirmed" ||
    texto.includes("email not confirmed")
  ) {
    return "La cuenta todavía no está confirmada. Contacta a la gerencia.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    texto.includes("rate limit")
  ) {
    return "Demasiados intentos seguidos. Espera un momento e intenta de nuevo.";
  }

  if (
    texto.includes("invalid format") ||
    error.code === "email_address_invalid"
  ) {
    return "Revisa el formato del correo electrónico.";
  }

  return MENSAJE_GENERICO;
}
