"use client";

import {
  AlertCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageCircle,
  Package,
  Search,
  User,
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
      {/* Cabecera */}
      <PageHeader
        title="Recordatorios (48–72 h)"
        description="Seguimiento a pedidos listos sin retirar para incentivar cobranza y despacho oportuno (RF-09)."
        backHref="/"
        backLabel="Inicio"
        breadcrumbs={[
          { label: "Operaciones" },
          { label: "Recordatorios de Retiro" },
        ]}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar orden o cliente..."
              className="h-10 w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-9 pr-9 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Listos sin Retirar
          </span>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalListos}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFiltro(filtro === "atencion_48h" ? "todos" : "atencion_48h")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition active:scale-98 ${
            filtro === "atencion_48h"
              ? "border-amber-500 bg-amber-50/70 dark:border-amber-600 dark:bg-amber-950/40 ring-2 ring-amber-500"
              : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Atención (≥ 48 h)
            </span>
            <AlertTriangle className="size-4 text-amber-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">
            {conteoAtencion}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFiltro(filtro === "urgente_72h" ? "todos" : "urgente_72h")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition active:scale-98 ${
            filtro === "urgente_72h"
              ? "border-red-500 bg-red-50/70 dark:border-red-600 dark:bg-red-950/40 ring-2 ring-red-500"
              : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">
              Urgente (≥ 72 h)
            </span>
            <AlertCircle className="size-4 text-red-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-red-900 dark:text-red-200">
            {conteoUrgente}
          </p>
        </button>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Saldo Retenido por Cobrar
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            ${saldoTotalRetenidoUsd.toFixed(2)}{" "}
            <span className="text-xs font-medium text-zinc-400">USD</span>
          </p>
        </div>
      </div>

      {/* Lista de Pedidos en Espera */}
      {pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
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
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center ${
                  umbral === "urgente_72h"
                    ? "border-red-200 bg-red-50/30 dark:border-red-900/60 dark:bg-red-950/20"
                    : umbral === "atencion_48h"
                      ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/60 dark:bg-amber-950/20"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                {/* Datos del Pedido */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {ordenStr}
                    </span>

                    {/* Badge de Antigüedad */}
                    {umbral === "urgente_72h" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        <AlertCircle className="size-3" />
                        URGENTE: {pedido.horasTranscurridas} h ({diasEspera} días)
                      </span>
                    )}

                    {umbral === "atencion_48h" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        <AlertTriangle className="size-3" />
                        ATENCIÓN: {pedido.horasTranscurridas} h
                      </span>
                    )}

                    {umbral === "reciente" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        <Clock className="size-3" />
                        Listo hace {pedido.horasTranscurridas} h
                      </span>
                    )}

                    <Link
                      href={`/comanda/${pedido.id}`}
                      target="_blank"
                      className="inline-flex size-6 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:hover:text-zinc-200"
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
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ✅ 100% Pagado ($0.00 pendiente)
                      </span>
                    ) : (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        💵 Saldo pendiente: ${pedido.saldoUsd.toFixed(2)} USD
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
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#20ba59] active:scale-98"
                    >
                      <MessageCircle className="size-4 fill-white/20" />
                      Enviar Recordatorio (1 Clic)
                    </a>
                  ) : (
                    <span className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800">
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
