"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Package,
  Search,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  clasificarUmbralAntiguedad,
  generarEnlaceWhatsAppRecordatorio,
  ordenarPedidosPorAntiguedad,
  type PedidoListoRecordatorio,
} from "@/lib/notificaciones/recordatorios";
import { PageHeader } from "@/components/shell/page-header";

type Props = {
  pedidosIniciales: PedidoListoRecordatorio[];
  rolUsuario?: string;
};

type FiltroUmbral = "todos" | "atencion_48h" | "urgente_72h";

export function RecordatoriosPanel({ pedidosIniciales }: Props) {
  const [filtro, setFiltro] = useState<FiltroUmbral>("todos");
  const [busqueda, setBusqueda] = useState("");

  const pedidosOrdenados = ordenarPedidosPorAntiguedad(pedidosIniciales);

  // Métricas globales
  const totalListos = pedidosOrdenados.length;
  const conteoAtencion = pedidosOrdenados.filter(
    (p) => clasificarUmbralAntiguedad(p.horasTranscurridas) === "atencion_48h",
  ).length;
  const conteoUrgente = pedidosOrdenados.filter(
    (p) => clasificarUmbralAntiguedad(p.horasTranscurridas) === "urgente_72h",
  ).length;
  const saldoTotalRetenidoUsd = pedidosOrdenados.reduce(
    (acc, p) => acc + (p.saldoUsd > 0 ? p.saldoUsd : 0),
    0,
  );

  // Filtrado
  const pedidosFiltrados = pedidosOrdenados.filter((p) => {
    const umbral = clasificarUmbralAntiguedad(p.horasTranscurridas);
    if (filtro === "atencion_48h" && umbral !== "atencion_48h") return false;
    if (filtro === "urgente_72h" && umbral !== "urgente_72h") return false;

    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase().trim();
    const ordStr = `ord-${String(p.numeroOrden).padStart(4, "0")}`.toLowerCase();
    const numStr = String(p.numeroOrden);
    const cliStr = p.nombreCliente.toLowerCase();

    return ordStr.includes(term) || numStr.includes(term) || cliStr.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Cabecera unificada */}
      <PageHeader
        title="Recordatorios (48–72 h)"
        description="Seguimiento a pedidos listos sin retirar para incentivar cobranza y despacho oportuno (RF-09)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
            <Bell className="size-3.5" />
            <span>Cobranzas & Alertas</span>
          </span>
        }
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar orden o cliente..."
              className="h-10 w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-9 pr-9 text-sm text-zinc-900 focus:border-[#7aa2f7] focus:bg-white focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-100 dark:focus:border-[#7aa2f7]"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        }
      />

      {/* Tarjetas de Métricas Resumen (Homologadas a KpiCards del Dashboard) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Listos
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-[#1f202c] dark:border dark:border-[#24283b] dark:text-[#7aa2f7]">
              <Package className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {totalListos}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#e0af68]">
              Atención (≥ 48 h)
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-[#1f202c] dark:border dark:border-[#24283b] dark:text-[#e0af68]">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {conteoAtencion}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-[#f7768e]">
              Urgente (≥ 72 h)
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-[#1f202c] dark:border dark:border-[#24283b] dark:text-[#f7768e]">
              <AlertCircle className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {conteoUrgente}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-[#9ece6a]">
              Saldo Retenido
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-[#1f202c] dark:border dark:border-[#24283b] dark:text-[#9ece6a]">
              <Wallet className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            ${saldoTotalRetenidoUsd.toFixed(2)}{" "}
            <span className="text-xs font-medium text-zinc-400">USD</span>
          </p>
        </div>
      </div>

      {/* Pestañas de Filtros Rápidos (Segmented Control Explícito) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-[#24283b]">
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filtro === "todos"
              ? "bg-zinc-900 text-white shadow-xs dark:border dark:border-[#7aa2f7]/50 dark:bg-[#1f202c] dark:text-[#7aa2f7]"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#1f202c] dark:hover:text-zinc-200"
          }`}
        >
          <span>Todos los listos</span>
          <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-[#16161e] dark:text-zinc-300">
            {totalListos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFiltro("atencion_48h")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filtro === "atencion_48h"
              ? "bg-amber-100 text-amber-900 shadow-xs dark:border dark:border-[#e0af68]/50 dark:bg-[#1f202c] dark:text-[#e0af68]"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#1f202c] dark:hover:text-zinc-200"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          <span>Atención (≥ 48 h)</span>
          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-[#16161e] dark:text-[#e0af68]">
            {conteoAtencion}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFiltro("urgente_72h")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filtro === "urgente_72h"
              ? "bg-red-100 text-red-900 shadow-xs dark:border dark:border-[#f7768e]/50 dark:bg-[#1f202c] dark:text-[#f7768e]"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#1f202c] dark:hover:text-zinc-200"
          }`}
        >
          <AlertCircle className="size-3.5" />
          <span>Urgente (≥ 72 h)</span>
          <span className="rounded-full bg-red-200/80 px-2 py-0.5 text-[10px] font-bold text-red-900 dark:bg-[#16161e] dark:text-[#f7768e]">
            {conteoUrgente}
          </span>
        </button>
      </div>

      {/* Lista de Pedidos en Espera */}
      {pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-[#24283b] dark:bg-[#1a1b26]">
          <Package className="size-12 text-zinc-400" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No hay pedidos en este umbral
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {busqueda
              ? `No se encontraron coincidencias para "${busqueda}".`
              : "No hay órdenes pendientes de retiro bajo el criterio seleccionado."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const umbral = clasificarUmbralAntiguedad(pedido.horasTranscurridas);
            const ordenStr = `ORD-${String(pedido.numeroOrden).padStart(4, "0")}`;
            const diasEspera = Math.floor(pedido.horasTranscurridas / 24);

            const enlaceRecordatorio = generarEnlaceWhatsAppRecordatorio({
              telefono: pedido.telefono,
              nombreCliente: pedido.nombreCliente,
              numeroOrden: pedido.numeroOrden,
              horasTranscurridas: pedido.horasTranscurridas,
              totalUsd: pedido.totalUsd,
              saldoUsd: pedido.saldoUsd,
              tasaBsPorUsd: pedido.tasaBsPorUsd,
            });

            return (
              <article
                key={pedido.id}
                data-testid={`recordatorio-item-${pedido.numeroOrden}`}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-[#24283b] dark:bg-[#1a1b26]"
              >
                {/* Datos del Pedido */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {ordenStr}
                    </span>

                    {/* Badge de Antigüedad */}
                    {umbral === "urgente_72h" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:border dark:border-[#f7768e]/30 dark:bg-[#f7768e]/15 dark:text-[#f7768e]">
                        <AlertCircle className="size-3" />
                        URGENTE: {pedido.horasTranscurridas} h ({diasEspera} días)
                      </span>
                    )}

                    {umbral === "atencion_48h" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border dark:border-[#e0af68]/30 dark:bg-[#e0af68]/15 dark:text-[#e0af68]">
                        <AlertTriangle className="size-3" />
                        ATENCIÓN: {pedido.horasTranscurridas} h
                      </span>
                    )}

                    {umbral === "reciente" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                        <Clock className="size-3" />
                        Listo hace {pedido.horasTranscurridas} h
                      </span>
                    )}

                    <Link
                      href={`/comanda/${pedido.id}`}
                      target="_blank"
                      className="inline-flex size-6 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-800 dark:border-[#24283b] dark:hover:text-zinc-200 dark:hover:bg-[#1f202c]"
                      aria-label={`Ver comanda de ${ordenStr}`}
                    >
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <User className="size-3.5 text-zinc-400" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {pedido.nombreCliente}
                    </span>
                    {pedido.telefono && (
                      <span className="text-xs text-zinc-500">({pedido.telefono})</span>
                    )}
                  </div>

                  {/* Estado Financiero */}
                  <div className="text-xs">
                    {pedido.saldoUsd <= 0.009 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-[#9ece6a]">
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-[#9ece6a]" />
                        100% Pagado ($0.00 pendiente)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-[#f7768e]">
                        <DollarSign className="size-3.5 text-red-600 dark:text-[#f7768e]" />
                        Saldo pendiente: ${pedido.saldoUsd.toFixed(2)} USD
                        {pedido.tasaBsPorUsd ? (
                          <span className="font-normal text-zinc-500 ml-1">
                            (aprox. Bs.{" "}
                            {(
                              Math.round(pedido.saldoUsd * pedido.tasaBsPorUsd * 100) / 100
                            ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            )
                          </span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acción de Envío a 1 Clic */}
                <div className="flex items-center gap-2">
                  {enlaceRecordatorio ? (
                    <a
                      href={enlaceRecordatorio}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`btn-recordatorio-${pedido.numeroOrden}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#9ece6a] dark:hover:border-emerald-700/60 dark:hover:bg-[#252b42]"
                    >
                      <MessageCircle className="size-4 text-emerald-600 dark:text-[#9ece6a]" />
                      <span>Enviar Recordatorio</span>
                    </a>
                  ) : (
                    <span className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs text-zinc-400 dark:border-[#24283b] dark:bg-[#1f202c]">
                      Sin teléfono registrado
                    </span>
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
