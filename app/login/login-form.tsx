"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_BOTON =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

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
      <div className="space-y-2">
        <label
          htmlFor="correo"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Correo electrónico
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={enviando}
          aria-invalid={mensajeError ? true : undefined}
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
          className={CLASES_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="contrasena"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          disabled={enviando}
          aria-invalid={mensajeError ? true : undefined}
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          className={CLASES_INPUT}
        />
      </div>

      {mensajeError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{mensajeError}</span>
        </p>
      ) : null}

      <button type="submit" disabled={enviando} className={CLASES_BOTON}>
        {enviando ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden className="size-4" />
        )}
        Iniciar sesión
      </button>
    </form>
  );
}
