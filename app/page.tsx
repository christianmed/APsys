import {
  Bell,
  ClipboardList,
  FileText,
  Flame,
  LogOut,
  Tag,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
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
          Base del sistema APSys lista: gestión de pedidos, flujo de taller,
          cobranza multimoneda y control de producción.
        </p>

        <Link
          href="/taller"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-bold text-white transition hover:bg-amber-500 shadow-sm"
        >
          <Flame aria-hidden className="size-5" />
          Taller y Producción (Táctil)
        </Link>

        <Link
          href="/recordatorios"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-900 transition hover:bg-indigo-100 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
        >
          <Bell aria-hidden className="size-4 text-indigo-600 dark:text-indigo-400" />
          Recordatorios (48–72 h)
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <TrendingUp aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
          Dashboard Gerencial (Ingresos)
        </Link>

        <Link
          href="/cuentas-por-cobrar"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 text-sm font-bold text-rose-900 transition hover:bg-rose-100 shadow-sm dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <Wallet aria-hidden className="size-4 text-rose-600 dark:text-rose-400" />
          Cuentas por Cobrar (Saldos)
        </Link>

        <Link
          href="/plantillas"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          <FileText aria-hidden className="size-4 text-zinc-500" />
          Plantillas de Mensajes
        </Link>

        <Link
          href="/pedidos"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
        >
          <ClipboardList aria-hidden className="size-4" />
          Pedidos
        </Link>

        <Link
          href="/clientes"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          <Users aria-hidden className="size-4" />
          Clientes
        </Link>

        <Link
          href="/servicios"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          <Tag aria-hidden className="size-4" />
          Servicios
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
