import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_BOTON_SECUNDARIO =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

/**
 * Listado de clientes (RF-01): búsqueda por nombre o teléfono (formulario
 * GET) y, sin término, los últimos 50 registros. Cada tarjeta abre el
 * detalle/edición del cliente.
 */
export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const { q: qCrudo } = await searchParams;

  // El `or()` de PostgREST usa comas y paréntesis como sintaxis, y `%`/`_` son
  // comodines de ilike: se eliminan del término para que la búsqueda no rompa
  // el filtro ni amplíe coincidencias sin querer. Se limita a 80 caracteres.
  const q = (Array.isArray(qCrudo) ? qCrudo[0] : (qCrudo ?? ""))
    .trim()
    .replace(/[,()%_]/g, "")
    .slice(0, 80);

  const { data: clientes } = q
    ? await supabase
        .from("clientes")
        .select("id,nombre,telefono,notas,pedidos(id,total_usd,anulado)")
        .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
        .order("nombre")
        .limit(50)
    : await supabase
        .from("clientes")
        .select("id,nombre,telefono,notas,pedidos(id,total_usd,anulado)")
        .order("creado_en", { ascending: false })
        .limit(50);

  const lista = clientes ?? [];

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Directorio de Clientes"
          description="Búsqueda rápida por nombre o teléfono, WhatsApp y resumen de compras."
          badge={
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <Users className="size-3.5" />
              <span>Directorio de Clientes</span>
            </span>
          }
          actions={
            <Link
              href="/clientes/nuevo"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="size-4" />
              Nuevo Cliente
            </Link>
          }
        />

        <form method="get" className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <label
              htmlFor="q"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Buscar por nombre o teléfono
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nombre o teléfono"
              className={CLASES_INPUT}
            />
          </div>
          <button type="submit" className={CLASES_BOTON_SECUNDARIO}>
            <Search aria-hidden className="size-4" />
            Buscar
          </button>
        </form>

        {lista.length > 0 ? (
          <ul className="space-y-3">
            {lista.map((cliente) => {
              const rawPedidos = (cliente.pedidos as unknown as Array<{ total_usd: number | string; anulado: boolean | null }>) ?? [];
              const pedidosActivos = rawPedidos.filter((p) => !p.anulado);
              const totalGastado = pedidosActivos.reduce(
                (acc, p) => acc + Number(p.total_usd || 0),
                0,
              );

              return (
                <li key={cliente.id}>
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-50">
                          {cliente.nombre}
                        </p>
                        {cliente.telefono ? (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {cliente.telefono}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        {pedidosActivos.length > 0 ? (
                          <>
                            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                              {pedidosActivos.length} {pedidosActivos.length === 1 ? "orden" : "órdenes"}
                            </span>
                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              ${totalGastado.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">
                            Sin órdenes
                          </span>
                        )}
                      </div>
                    </div>

                    {cliente.notas ? (
                      <p className="mt-2 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {cliente.notas}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            {q ? `Sin resultados para «${q}»` : "No hay clientes todavía"}
          </p>
        )}
      </div>
    </AuthenticatedShell>
  );
}
