import { BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

const CLASES_FILA =
  "block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

const CLASES_FILA_ENLACE = `${CLASES_FILA} transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60`;

const CLASES_BADGE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const CLASES_BADGE_ACTIVO = `${CLASES_BADGE} bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300`;

const CLASES_BADGE_INACTIVO = `${CLASES_BADGE} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`;

/**
 * Catálogo de servicios (RF-04/T-007b): listado completo ordenado por `orden`
 * y nombre, con badge de estado. Solo el perfil gerencial administra: ve el
 * alta y abre cada fila para editar (incluida la baja lógica vía `activo`).
 */
export default async function ServiciosPage() {
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

  const esGerencial = perfil?.rol === "gerencial";

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id,nombre,activo,orden")
    .order("orden", { ascending: true })
    .order("nombre");

  const lista = servicios ?? [];

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Servicios
          </h1>
          {esGerencial ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/rotacion"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-900 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
              >
                <BarChart3 aria-hidden className="size-4 text-indigo-600 dark:text-indigo-400" />
                Rotación
              </Link>
              <Link
                href="/servicios/nuevo"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
              >
                <Plus aria-hidden className="size-4" />
                Nuevo servicio
              </Link>
            </div>
          ) : null}
        </div>

        {esGerencial ? null : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Solo la gerencia administra el catálogo.
          </p>
        )}

        {lista.length > 0 ? (
          <ul className="space-y-3">
            {lista.map((servicio) => {
              const contenido = (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {servicio.nombre}
                    </p>
                    <span
                      className={
                        servicio.activo
                          ? CLASES_BADGE_ACTIVO
                          : CLASES_BADGE_INACTIVO
                      }
                    >
                      {servicio.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Orden {servicio.orden}
                  </p>
                </>
              );

              return (
                <li key={servicio.id}>
                  {esGerencial ? (
                    <Link
                      href={`/servicios/${servicio.id}`}
                      className={CLASES_FILA_ENLACE}
                    >
                      {contenido}
                    </Link>
                  ) : (
                    <div className={CLASES_FILA}>{contenido}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Aún no hay servicios
          </p>
        )}
      </div>
    </main>
  );
}
