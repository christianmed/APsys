"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { mensajeDeErrorAuth } from "./errores";

/**
 * Formulario de acceso (RF-18). Solo usa `signInWithPassword` contra el
 * cliente de navegador de Supabase; la sesión queda en cookies que el
 * servidor (páginas y proxy) vuelve a leer.
 *
 * Los mensajes de error se traducen con `mensajeDeErrorAuth`: nunca se
 * reenvía el texto de Supabase ni se revela si la cuenta existe.
 */
const MENSAJE_CAMPOS_VACIOS = "Ingresá tu correo y tu contraseña.";

export function LoginForm() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const correoNormalizado = correo.trim();

    if (!correoNormalizado || !contrasena) {
      setMensajeError(MENSAJE_CAMPOS_VACIOS);
      return;
    }

    setMensajeError(null);
    setEnviando(true);

    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: correoNormalizado,
        password: contrasena,
      });

      if (error) {
        setMensajeError(mensajeDeErrorAuth(error));
        return;
      }

      // El proxy y las páginas de servidor leen la sesión de las cookies:
      // push + refresh garantizan que el home se renderice con el usuario.
      router.push("/");
      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al intentar iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="correo"
          className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Correo electrónico
        </label>
        <Input
          id="correo"
          name="correo"
          type="email"
          icon={Mail}
          sizeVariant="lg"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={enviando}
          error={Boolean(mensajeError)}
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contrasena"
          className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Contraseña
        </label>
        <Input
          id="contrasena"
          name="contrasena"
          type="password"
          icon={Lock}
          sizeVariant="lg"
          autoComplete="current-password"
          disabled={enviando}
          error={Boolean(mensajeError)}
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
        />
      </div>

      {mensajeError ? (
        <Alert variant="danger">
          {mensajeError}
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        icon={LogIn}
        isLoading={enviando}
        disabled={enviando}
        className="w-full"
      >
        Iniciar sesión
      </Button>
    </form>
  );
}
