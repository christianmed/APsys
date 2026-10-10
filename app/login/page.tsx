import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

/**
 * Página de acceso (RF-18). Se usa desde el mostrador (tablet/móvil), por eso
 * la tarjeta única centrada y los controles de 44px.
 *
 * Con Cache Components (next.config.ts), `cookies()` fuera de <Suspense>
 * impide prerenderizar la ruta; como toda la página depende de la sesión
 * ("si ya hay sesión, ir al home") se opta por bloquear con `instant = false`,
 * la opción documentada para rutas que no pueden tener shell estático.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Iniciar sesión · APSys",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black sm:px-6">
      <main className="flex w-full max-w-sm flex-col gap-6">
        <header className="text-center">
          <p className="text-sm font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
            APSys
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Gestión y notificación de pedidos.
          </p>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
