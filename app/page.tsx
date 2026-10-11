import { LogOut, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "./actions";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se opta por bloquear la ruta con la opción documentada (`instant = false`),
// igual que en /login. No cambia el modelo de render; solo valida la navegación.
export const instant = false;

/**
 * Inicio de sesión activa: saludo + rol (leído de `perfiles`, protegido por
 * RLS) + cierre de sesión. El módulo de pedidos llega en la Fase 1.
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rol: string = perfil?.rol ?? "sin perfil";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
            <UserRound aria-hidden className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Hola{user.email ? `, ${user.email}` : ""}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Rol: <span className="font-medium">{rol}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Base del sistema APSys lista: sesión activa y permisos por rol
          verificados. El módulo de pedidos llega en la Fase 1.
        </p>

        <Link
          href="/clientes"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
        >
          <Users aria-hidden className="size-4" />
          Clientes
        </Link>

        <form action={cerrarSesion}>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <LogOut aria-hidden className="size-4" />
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
