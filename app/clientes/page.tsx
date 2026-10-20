import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { procesarPaginacionCursor } from "@/lib/paginacion/cursor";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { ClientesBuscador } from "./clientes-buscador";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

const TAMANO_PAGINA_CLIENTES = 25;

/**
 * Listado de clientes (RF-01): búsqueda por nombre o teléfono (formulario
 * GET) con paginación por cursor. Cada tarjeta abre el detalle/edición del cliente.
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

  const { q: qCrudo, cursor: cursorCrudo } = await searchParams;

  // El `or()` de PostgREST usa comas y paréntesis como sintaxis, y `%`/`_` son
  // comodines de ilike: se eliminan del término para que la búsqueda no rompa
  // el filtro ni amplíe coincidencias sin querer. Se limita a 80 caracteres.
  const q = (Array.isArray(qCrudo) ? qCrudo[0] : (qCrudo ?? ""))
    .trim()
    .replace(/[,()%_]/g, "")
    .slice(0, 80);

  const cursor = (
    Array.isArray(cursorCrudo) ? cursorCrudo[0] : (cursorCrudo ?? "")
  ).trim();

  let query = supabase
    .from("clientes")
    .select("id,nombre,telefono,notas,creado_en,pedidos(id,total_usd,anulado)");

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`);
  }

  query = query.order("creado_en", { ascending: false });

  if (cursor) {
    query = query.lt("creado_en", cursor);
  }

  query = query.limit(TAMANO_PAGINA_CLIENTES + 1);

  const { data: clientes } = await query;
  const { datos: lista, siguienteCursor } = procesarPaginacionCursor(
    clientes ?? [],
    TAMANO_PAGINA_CLIENTES,
    "creado_en",
  );

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
            <Button
              href="/clientes/nuevo"
              variant="primary"
            >
              <Plus className="size-4" />
              Nuevo Cliente
            </Button>
          }
        />

        <ClientesBuscador valorInicial={q} />

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
                  <Card
                    href={`/clientes/${cliente.id}`}
                    className="p-4"
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
                            <Badge variant="neutral">
                              {pedidosActivos.length} {pedidosActivos.length === 1 ? "orden" : "órdenes"}
                            </Badge>
                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-[#9ece6a]">
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
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-[#24283b] dark:bg-[#1a1b26] dark:text-zinc-400">
            {q ? `Sin resultados para «${q}»` : "No hay clientes todavía"}
          </p>
        )}

        <CursorPagination
          baseUrl="/clientes"
          searchParams={{ q }}
          cursorActivo={cursor ? cursor : null}
          siguienteCursor={siguienteCursor}
          totalEnPagina={lista.length}
        />
      </div>
    </AuthenticatedShell>
  );
}
