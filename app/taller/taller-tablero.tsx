"use client";

import {
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Package,
  RotateCcw,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cambiarEstadoPedido } from "@/app/pedidos/actions";
import { sanearTerminoBusquedaOrden } from "@/lib/pedidos/busqueda";
import { BotonAvisoWhatsApp } from "@/app/pedidos/boton-aviso-whatsapp";
import { PageHeader } from "@/components/shell/page-header";
import { CamaraEscanerModal } from "./camara-escaner-modal";
import {
  ESTADOS_METADATA,
  type EstadoPedido,
  obtenerSiguienteEstadoSugerido,
} from "@/lib/pedidos/estados";

export type PedidoTallerItem = {
  id: string;
  cantidad: number;
  descripcion?: string | null;
  dimensiones?: string | null;
  acabados?: string | null;
  ancho?: number | null;
  alto?: number | null;
  notas?: string | null;
  servicios?: {
    nombre: string;
    unidad_medida?: string;
  } | null;
};

export type PedidoTaller = {
  id: string;
  numero_orden: number;
  estado: EstadoPedido;
  creado_en: string;
  listo_en: string | null;
  entregado_en: string | null;
  anulado: boolean;
  total_usd?: number;
  saldo_usd?: number;
  tasa_bs?: number;
  clientes?: {
    nombre: string;
    telefono: string | null;
  } | null;
  items: PedidoTallerItem[];
};

type Props = {
  pedidosIniciales: PedidoTaller[];
  rolUsuario: string;
};

type TabEstado = "activos" | "recibido" | "en_produccion" | "listo";

function formatoTiempo(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const diffMin = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60));

    if (diffMin < 1) return "Justo ahora";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    const diffDias = Math.floor(diffHoras / 24);
    return `Hace ${diffDias} d`;
  } catch {
    return "";
  }
}

export function TallerTablero({ pedidosIniciales, rolUsuario }: Props) {
  const [tabActual, setTabActual] = useState<TabEstado>("activos");
  const [busqueda, setBusqueda] = useState("");
  const [modalCamaraAbierto, setModalCamaraAbierto] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoTaller[]>(pedidosIniciales);
  const [idEnProceso, setIdEnProceso] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Conteo reactivo por estado
  const conteoRecibido = pedidos.filter((p) => p.estado === "recibido").length;
  const conteoProduccion = pedidos.filter((p) => p.estado === "en_produccion").length;
  const conteoListo = pedidos.filter((p) => p.estado === "listo").length;
  const conteoActivos = conteoRecibido + conteoProduccion + conteoListo;

  // Filtrado de pedidos según la pestaña y la búsqueda
  const busquedaObj = sanearTerminoBusquedaOrden(busqueda);
  const terminoLimpio = busquedaObj.terminoLimpio.toLowerCase();
  const numeroBuscado = busquedaObj.numeroOrden;

  const pedidosFiltrados = pedidos.filter((pedido) => {
    // Filtro por pestaña
    if (tabActual === "recibido" && pedido.estado !== "recibido") return false;
    if (tabActual === "en_produccion" && pedido.estado !== "en_produccion") return false;
    if (tabActual === "listo" && pedido.estado !== "listo") return false;
    if (tabActual === "activos") {
      if (pedido.estado !== "recibido" && pedido.estado !== "en_produccion" && pedido.estado !== "listo") {
        return false;
      }
    }

    // Filtro por término de búsqueda (escáner USB o tecleo rápido)
    if (!busqueda.trim()) return true;

    if (busquedaObj.esNumeroOrden && numeroBuscado !== null) {
      return pedido.numero_orden === numeroBuscado;
    }

    const numStr = `ord-${String(pedido.numero_orden).padStart(4, "0")}`.toLowerCase();
    const soloNum = String(pedido.numero_orden);
    const clienteNombre = (pedido.clientes?.nombre ?? "").toLowerCase();

    return (
      numStr.includes(terminoLimpio) ||
      soloNum.includes(terminoLimpio) ||
      clienteNombre.includes(terminoLimpio)
    );
  });

  const handleAvanzar = (pedido: PedidoTaller) => {
    const siguiente = obtenerSiguienteEstadoSugerido(pedido.estado);
    if (!siguiente) return;

    setIdEnProceso(pedido.id);
    setErrorFeedback(null);

    startTransition(async () => {
      const res = await cambiarEstadoPedido(pedido.id, siguiente);
      setIdEnProceso(null);

      if (res.ok) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedido.id ? { ...p, estado: siguiente } : p)),
        );
      } else {
        setErrorFeedback(res.error ?? "No se pudo actualizar el estado");
      }
    });
  };

  const handleRetroceder = (pedido: PedidoTaller, estadoDestino: EstadoPedido) => {
    setIdEnProceso(pedido.id);
    setErrorFeedback(null);

    startTransition(async () => {
      const res = await cambiarEstadoPedido(pedido.id, estadoDestino);
      setIdEnProceso(null);

      if (res.ok) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedido.id ? { ...p, estado: estadoDestino } : p)),
        );
      } else {
        setErrorFeedback(res.error ?? "No se pudo retroceder el estado");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Cabecera unificada consistente con el resto de la aplicación */}
      <PageHeader
        title="Taller y Producción"
        description="Control táctil rápido para impresores y ensambladores (≤ 2 toques)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
            <Flame className="size-3.5 text-amber-500" />
            <span>{rolUsuario}</span>
          </span>
        }
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escanear comanda o # orden..."
                aria-label="Escanear comanda en taller"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-9 pr-9 text-sm font-medium text-zinc-900 transition focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalCamaraAbierto(true)}
              aria-label="Escanear con cámara móvil"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600 active:scale-95 shrink-0"
              title="Escanear con cámara"
            >
              <Camera className="size-5" />
            </button>
          </div>
        }
      />

      {modalCamaraAbierto && (
        <CamaraEscanerModal
          abierto={modalCamaraAbierto}
          onCerrar={() => setModalCamaraAbierto(false)}
          onOrdenDetectada={(num) => setBusqueda(String(num))}
        />
      )}

      {errorFeedback && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorFeedback}
        </div>
      )}

      {/* Selector de pestañas táctiles grandes (min 48px de altura táctil) */}
      <nav aria-label="Filtro de estados de taller" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setTabActual("activos")}
          className={`flex h-14 flex-col items-center justify-center rounded-xl border px-3 transition active:scale-98 ${
            tabActual === "activos"
              ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">Activos en Taller</span>
          <span className="text-lg font-bold leading-tight">{conteoActivos}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActual("recibido")}
          className={`flex h-14 flex-col items-center justify-center rounded-xl border px-3 transition active:scale-98 ${
            tabActual === "recibido"
              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">Por Iniciar</span>
          <span className="text-lg font-bold leading-tight">{conteoRecibido}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActual("en_produccion")}
          className={`flex h-14 flex-col items-center justify-center rounded-xl border px-3 transition active:scale-98 ${
            tabActual === "en_produccion"
              ? "border-amber-600 bg-amber-600 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">En Producción</span>
          <span className="text-lg font-bold leading-tight">{conteoProduccion}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActual("listo")}
          className={`flex h-14 flex-col items-center justify-center rounded-xl border px-3 transition active:scale-98 ${
            tabActual === "listo"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">Listos para Retiro</span>
          <span className="text-lg font-bold leading-tight">{conteoListo}</span>
        </button>
      </nav>

      {/* Listado de tarjetas de taller */}
      {pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Package className="size-10 text-zinc-400" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No hay órdenes en este estado
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {busqueda
              ? `No se encontró ninguna orden que coincida con "${busqueda}".`
              : "Todas las órdenes asignadas a esta categoría han sido procesadas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidosFiltrados.map((pedido) => {
            const numeroFormateado = `ORD-${String(pedido.numero_orden).padStart(4, "0")}`;
            const metaEstado = ESTADOS_METADATA[pedido.estado];
            const cargandoEste = isPending && idEnProceso === pedido.id;

            return (
              <article
                key={pedido.id}
                data-testid={`taller-card-${pedido.numero_orden}`}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-3">
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                          {numeroFormateado}
                        </span>
                        <Link
                          href={`/comanda/${pedido.id}`}
                          target="_blank"
                          aria-label={`Ver comanda de ${numeroFormateado}`}
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock className="size-3" />
                        <span>{formatoTiempo(pedido.creado_en)}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${metaEstado.badgeColor}`}
                    >
                      {metaEstado.label}
                    </span>
                  </div>

                  {/* Datos del cliente */}
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                    <User className="size-4 shrink-0 text-zinc-400" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {pedido.clientes?.nombre ?? "Cliente sin registrar"}
                    </span>
                    {pedido.clientes?.telefono && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto shrink-0">
                        {pedido.clientes.telefono}
                      </span>
                    )}
                  </div>

                  {/* Lista de ítems a producir (dimensiones y acabados) */}
                  <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Materiales y Especificaciones ({pedido.items.length})
                    </h3>
                    <ul className="space-y-2">
                      {pedido.items.map((item, idx) => {
                        const tieneMedidas =
                          Boolean(item.dimensiones) ||
                          (item.ancho != null && item.alto != null);
                        const textoMedidas =
                          item.dimensiones ??
                          (item.ancho != null && item.alto != null
                            ? `${item.ancho} × ${item.alto} m`
                            : null);
                        return (
                          <li
                            key={item.id ?? idx}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300"
                          >
                            <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                              <span>
                                {item.cantidad}× {item.servicios?.nombre ?? "Servicio"}
                              </span>
                              {tieneMedidas && (
                                <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                  {textoMedidas}
                                </span>
                              )}
                            </div>
                            {item.acabados && (
                              <div className="mt-1 text-zinc-600 dark:text-zinc-300">
                                <span className="font-medium text-zinc-500">Acabado:</span>{" "}
                                {item.acabados}
                              </div>
                            )}
                            {(item.descripcion || item.notas) && (
                              <div className="mt-0.5 text-zinc-500 dark:text-zinc-400 italic">
                                {item.descripcion || item.notas}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* BOTÓN DE ACCIÓN TÁCTIL PRINCIPAL (≤ 2 toques: 1 toque directo para avanzar) */}
                <div className="mt-4 space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {pedido.estado === "recibido" && (
                    <button
                      type="button"
                      disabled={cargandoEste}
                      onClick={() => handleAvanzar(pedido)}
                      data-testid={`btn-avanzar-${pedido.numero_orden}`}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-base font-bold text-white shadow-sm transition hover:bg-sky-500 active:scale-98 disabled:opacity-50"
                    >
                      <Sparkles className="size-5" />
                      {cargandoEste ? "Iniciando..." : "1 TOQUE: Iniciar Producción"}
                    </button>
                  )}

                  {pedido.estado === "en_produccion" && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        disabled={cargandoEste}
                        onClick={() => handleAvanzar(pedido)}
                        data-testid={`btn-avanzar-${pedido.numero_orden}`}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-base font-bold text-white shadow-sm transition hover:bg-amber-500 active:scale-98 disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-5" />
                        {cargandoEste ? "Guardando..." : "1 TOQUE: ¡Listo para Retiro!"}
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEste}
                        onClick={() => handleRetroceder(pedido, "recibido")}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-400"
                      >
                        <RotateCcw className="size-3" />
                        Revertir a recibido
                      </button>
                    </div>
                  )}

                  {pedido.estado === "listo" && (
                    <div className="space-y-2">
                      <BotonAvisoWhatsApp
                        telefono={pedido.clientes?.telefono}
                        nombreCliente={pedido.clientes?.nombre ?? "Cliente"}
                        numeroOrden={pedido.numero_orden}
                        totalUsd={pedido.total_usd ?? 0}
                        saldoUsd={pedido.saldo_usd ?? 0}
                        tasaBsPorUsd={pedido.tasa_bs}
                        variante="full"
                      />
                      <button
                        type="button"
                        disabled={cargandoEste}
                        onClick={() => handleAvanzar(pedido)}
                        data-testid={`btn-avanzar-${pedido.numero_orden}`}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50"
                      >
                        <Package className="size-5" />
                        {cargandoEste ? "Guardando..." : "1 TOQUE: Entregar al Cliente"}
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEste}
                        onClick={() => handleRetroceder(pedido, "en_produccion")}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-400"
                      >
                        <RotateCcw className="size-3" />
                        Reabrir a taller (reimpresión)
                      </button>
                    </div>
                  )}

                  {pedido.estado === "entregado" && (
                    <div className="flex h-12 w-full items-center justify-center rounded-xl bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Entregado y finalizado
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
