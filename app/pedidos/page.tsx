import {
  ArrowLeft,
  Bell,
  Clock,
  CreditCard,
  Flame,
  Package,
  Plus,
  Printer,
  SearchX,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sanearTerminoBusquedaOrden } from "@/lib/pedidos/busqueda";
import { type EstadoPedido } from "@/lib/pedidos/estados";
import { createClient } from "@/lib/supabase/server";
import { EstadoControl } from "./estado-control";
import { BotonAvisoWhatsApp } from "./boton-aviso-whatsapp";
import { PedidosBuscador } from "./pedidos-buscador";

export const instant = false;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * Listado de pedidos, búsqueda por número/escáner y cobranza (RF-01, RF-02, RF-06 / T-012).
 */
export default async function PedidosPage({ searchParams }: Props) {
  const { q } = await searchParams;
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

  const rolUsuario = perfil?.rol ?? "operativo";

  const busqueda = sanearTerminoBusquedaOrden(q);

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

  const { data: pedidos } = await query;
  const lista = pedidos ?? [];

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Pedidos
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Gestión de órdenes, comanda y lectura de escáner USB.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {rolUsuario === "gerencial" && (
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                <TrendingUp aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
                Dashboard
              </Link>
            )}

            <Link
              href="/taller"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <Flame aria-hidden className="size-4 text-amber-600" />
              Vista de Taller
            </Link>

            <Link
              href="/recordatorios"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-900 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
            >
              <Bell aria-hidden className="size-4 text-indigo-600 dark:text-indigo-400" />
              Recordatorios
            </Link>

            <Link
              href="/pedidos/nuevo"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
            >
              <Plus aria-hidden className="size-4" />
              Nuevo pedido
            </Link>
          </div>
        </div>

        {/* BUSCADOR Y LECTURA CON ESCÁNER USB */}
        <section aria-label="Búsqueda de pedidos">
          <PedidosBuscador valorInicial={q ?? ""} />
        </section>

        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            {q ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <SearchX className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No se encontraron pedidos
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  No hay órdenes que coincidan con el criterio &quot;{q}&quot;.
                </p>
                <Link
                  href="/pedidos"
                  className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Ver todos los pedidos
                </Link>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <Package className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No hay pedidos registrados
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Comienza registrando la primera orden de trabajo.
                </p>
                <Link
                  href="/pedidos/nuevo"
                  className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Plus className="size-4" />
                  Crear pedido
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {lista.map((pedido) => {
              const fecha = new Date(pedido.creado_en).toLocaleDateString(
                "es-VE",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

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
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
                        #{pedido.numero_orden}
                      </span>
                      <EstadoControl
                        pedidoId={pedido.id}
                        estadoActual={pedido.estado as EstadoPedido}
                        rolUsuario={rolUsuario}
                        anulado={pedido.anulado}
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
                  </div>

                  {/* Resumen financiero del pedido */}
                  <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Total
                      </span>
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        ${totalUsd.toFixed(2)} USD
                      </span>
                    </div>

                    <div className="text-right">
                      {esPagado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-500/15 dark:text-green-300">
                          Pagado
                        </span>
                      ) : tieneAbonoParcial ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                            Resta: ${saldoUsd.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            Abonado: ${totalPagadoUsd.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <CreditCard className="size-3" /> Saldo pendiente
                        </span>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {pedido.estado === "listo" && (
                          <BotonAvisoWhatsApp
                            telefono={clienteData?.telefono}
                            nombreCliente={clienteData?.nombre ?? "Cliente"}
                            numeroOrden={pedido.numero_orden}
                            totalUsd={totalUsd}
                            saldoUsd={saldoUsd}
                            tasaBsPorUsd={tasaValor}
                          />
                        )}

                        <Link
                          href={`/comanda/${pedido.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          <Printer className="size-3.5" />
                          Comanda
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
