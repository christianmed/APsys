import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  Plus,
  Printer,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { sanearTerminoBusquedaOrden } from "@/lib/pedidos/busqueda";
import { type EstadoPedido } from "@/lib/pedidos/estados";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { EstadoControl } from "./estado-control";
import { BotonAvisoWhatsApp } from "./boton-aviso-whatsapp";
import { PedidosBuscador } from "./pedidos-buscador";
import { AnularPedidoModal } from "./anular-pedido-modal";
import { AuditoriaModal } from "./auditoria-modal";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Button } from "@/components/ui/button";
import { procesarPaginacionCursor } from "@/lib/paginacion/cursor";
import { formatearFechaHoraCaracas } from "@/lib/fechas";

export const instant = false;

const TAMANO_PAGINA_PEDIDOS = 25;

type Props = {
  searchParams: Promise<{ q?: string; cursor?: string }>;
};

/**
 * Listado de pedidos, búsqueda por número/escáner y cobranza (RF-01, RF-02, RF-06 / T-012).
 */
export default async function PedidosPage({ searchParams }: Props) {
  const { q, cursor } = await searchParams;
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const rolUsuario = perfil?.rol ?? "operativo";

  const busqueda = sanearTerminoBusquedaOrden(q);
  const cursorNum = cursor ? Number(cursor) : null;
  const cursorValido =
    cursorNum !== null && !isNaN(cursorNum) && cursorNum > 0 ? cursorNum : null;

  let query = supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      creado_en,
      anulado,
      motivo_anulacion,
      cliente_id,
      clientes (
        nombre,
        telefono
      ),
      pagos (
        monto,
        moneda
      ),
      tasas_cambio (
        valor_bs_por_usd
      )
    `,
    )
    .order("numero_orden", { ascending: false });

  // Paginación por cursor si se navega a páginas posteriores
  if (cursorValido) {
    query = query.lt("numero_orden", cursorValido);
  }

  // Si se buscó un número de orden específico (o escaneó un código de barras)
  if (busqueda.esNumeroOrden && busqueda.numeroOrden !== null) {
    query = query.eq("numero_orden", busqueda.numeroOrden);
  } else if (busqueda.terminoLimpio !== "") {
    // Si se buscó por nombre o teléfono de cliente
    const { data: clientesCoincidentes } = await supabase
      .from("clientes")
      .select("id")
      .or(
        `nombre.ilike.%${busqueda.terminoLimpio}%,telefono.ilike.%${busqueda.terminoLimpio}%`,
      );

    const clientIds = clientesCoincidentes?.map((c) => c.id) ?? [];
    if (clientIds.length > 0) {
      query = query.in("cliente_id", clientIds);
    } else {
      // Forzar resultado vacío si ningún cliente coincide
      query = query.eq("numero_orden", -1);
    }
  }

  // Limitamos a TAMANO_PAGINA + 1 para detectar si existe página siguiente
  query = query.limit(TAMANO_PAGINA_PEDIDOS + 1);

  const { data: pedidos } = await query;
  const { datos: lista, siguienteCursor } = procesarPaginacionCursor(
    pedidos ?? [],
    TAMANO_PAGINA_PEDIDOS,
    "numero_orden",
  );

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Pedidos"
          description="Órdenes de trabajo, búsqueda rápida por escáner USB y comanda de taller."
          badge={
            <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
              <ClipboardList className="size-3.5" />
              <span>Órdenes de Trabajo</span>
            </span>
          }
          actions={
            <Button
              href="/pedidos/nuevo"
              variant="primary"
            >
              <Plus className="size-4" />
              Nueva Orden
            </Button>
          }
        />

        {/* BUSCADOR Y LECTURA CON ESCÁNER USB */}
        <section aria-label="Búsqueda de pedidos">
          <PedidosBuscador valorInicial={q ?? ""} />
        </section>

        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-[#24283b] dark:bg-[#1a1b26]">
            {q ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-[#1f202c] dark:text-[#7aa2f7]">
                  <SearchX className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No se encontraron pedidos
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  No hay órdenes que coincidan con el criterio &quot;{q}&quot;.
                </p>
                <Button
                  href="/pedidos"
                  variant="outline"
                  size="sm"
                  className="mt-5"
                >
                  Ver todos los pedidos
                </Button>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-[#1f202c] dark:text-[#7aa2f7]">
                  <Package className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No hay pedidos registrados
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Comienza registrando la primera orden de trabajo.
                </p>
                <Button
                  href="/pedidos/nuevo"
                  variant="primary"
                  size="sm"
                  className="mt-5"
                >
                  <Plus className="size-4" />
                  Nueva Orden
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-[#24283b] dark:border-[#24283b] dark:bg-[#1a1b26]">
            {lista.map((pedido) => {
              const fecha = formatearFechaHoraCaracas(pedido.creado_en);

              const clienteData = Array.isArray(pedido.clientes)
                ? pedido.clientes[0]
                : pedido.clientes;

              const tasaObj = pedido.tasas_cambio as {
                valor_bs_por_usd?: number | string;
              } | null;
              const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;

              const listaPagos = Array.isArray(pedido.pagos) ? pedido.pagos : [];
              const totalPagadoUsd = listaPagos.reduce((acc, p) => {
                const monto = Number(p.monto) || 0;
                if (p.moneda === "USD") return acc + monto;
                return acc + monto / tasaValor;
              }, 0);

              const totalUsd = Number(pedido.total_usd) || 0;
              const saldoUsd = Math.max(
                0,
                Math.round((totalUsd - totalPagadoUsd) * 100) / 100,
              );

              const esPagado = saldoUsd === 0 && totalUsd > 0;
              const tieneAbonoParcial = totalPagadoUsd > 0 && saldoUsd > 0;

              return (
                <div
                  key={pedido.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-[#1f202c]/50"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
                        #{pedido.numero_orden}
                      </span>
                      <EstadoControl
                        pedidoId={pedido.id}
                        estadoActual={pedido.estado as EstadoPedido}
                        rolUsuario={rolUsuario}
                        anulado={pedido.anulado}
                        modo="solo_badge"
                      />
                    </div>

                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {clienteData?.nombre ?? "Cliente no especificado"}
                      {clienteData?.telefono ? (
                        <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                          ({clienteData.telefono})
                        </span>
                      ) : null}
                    </p>

                    <p className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <Clock className="size-3.5" />
                      {fecha}
                    </p>

                    {/* Botón de avance operativo de estado reubicado debajo de la fecha */}
                    <div className="pt-1">
                      <EstadoControl
                        pedidoId={pedido.id}
                        estadoActual={pedido.estado as EstadoPedido}
                        rolUsuario={rolUsuario}
                        anulado={pedido.anulado}
                        modo="solo_boton"
                      />
                    </div>

                    {pedido.anulado && pedido.motivo_anulacion ? (
                      <p className="inline-block rounded-md bg-rose-50 px-2.5 py-1 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        <span className="font-semibold">Motivo de anulación:</span>{" "}
                        {pedido.motivo_anulacion}
                      </p>
                    ) : null}
                  </div>

                  {/* Resumen financiero y botones de acción complementaria */}
                  <div className="flex flex-col gap-2.5 sm:items-end">
                    <div className="text-left sm:text-right">
                      <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Total
                      </span>
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        ${totalUsd.toFixed(2)} USD
                      </span>
                    </div>

                    {/* Píldoras semánticas financieras sin emoticones */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      {esPagado ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-[#9ece6a]">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-[#9ece6a]" />
                          100% Pagado
                        </span>
                      ) : tieneAbonoParcial ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-[#7aa2f7]">
                            <Check className="size-3 text-blue-600 dark:text-[#7aa2f7]" />
                            Abonado: ${totalPagadoUsd.toFixed(2)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-[#e0af68]">
                            <AlertTriangle className="size-3 text-amber-600 dark:text-[#e0af68]" />
                            Resta: ${saldoUsd.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-[#f7768e]">
                          <DollarSign className="size-3 text-rose-600 dark:text-[#f7768e]" />
                          Sin abono (Resta ${saldoUsd.toFixed(2)})
                        </span>
                      )}
                    </div>

                    {/* Botones de acción del pedido reubicados a la derecha */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 sm:justify-end">
                      <Link
                        href={`/comanda/${pedido.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-300 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
                      >
                        <Printer className="size-3.5" />
                        Comanda
                      </Link>

                      {pedido.estado === "listo" && !pedido.anulado && (
                        <BotonAvisoWhatsApp
                          telefono={clienteData?.telefono}
                          nombreCliente={clienteData?.nombre ?? "Cliente"}
                          numeroOrden={pedido.numero_orden}
                          totalUsd={totalUsd}
                          saldoUsd={saldoUsd}
                          tasaBsPorUsd={tasaValor}
                        />
                      )}

                      {rolUsuario === "gerencial" && (
                        <>
                          <AuditoriaModal
                            pedidoId={pedido.id}
                            numeroOrden={pedido.numero_orden}
                          />

                          {!pedido.anulado && (
                            <AnularPedidoModal
                              pedidoId={pedido.id}
                              numeroOrden={pedido.numero_orden}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CursorPagination
          baseUrl="/pedidos"
          searchParams={{ q }}
          cursorActivo={cursorValido}
          siguienteCursor={siguienteCursor}
          totalEnPagina={lista.length}
        />
      </div>
    </AuthenticatedShell>
  );
}
