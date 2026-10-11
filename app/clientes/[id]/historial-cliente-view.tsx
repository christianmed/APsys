"use client";

import {
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Package,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  type ClasificacionRecurrencia,
  type MetricasCliente,
} from "@/lib/clientes/historial";
import { generarMensajeCobranza } from "@/lib/cobranzas/cuentas-por-cobrar";

type Props = {
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  metricas: MetricasCliente;
};

const BADGES_RECURRENCIA: Record<
  ClasificacionRecurrencia,
  { label: string; color: string }
> = {
  "Sin compras": {
    label: "Sin compras",
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  Nuevo: {
    label: "Nuevo cliente",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  Ocasional: {
    label: "Cliente ocasional",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  Recurrente: {
    label: "Cliente recurrente",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  "VIP / Frecuente": {
    label: "VIP / Frecuente",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  "Inactivo (> 60 días)": {
    label: "Inactivo (> 60 días)",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatearUSD(monto: number): string {
  return `$${monto.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function HistorialClienteView({
  clienteId,
  clienteNombre,
  clienteTelefono,
  metricas,
}: Props) {
  const badgeClasificacion = BADGES_RECURRENCIA[metricas.clasificacion];

  return (
    <div className="space-y-6">
      {/* Tarjetas KPI de compras y recurrencia */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Comprado */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Total Comprado</span>
            <Wallet className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
            {formatearUSD(metricas.total_gastado_usd)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            En {metricas.total_pedidos_activos} pedido{metricas.total_pedidos_activos === 1 ? "" : "s"} activos
          </p>
        </div>

        {/* Saldo Pendiente */}
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            metricas.saldo_pendiente_usd > 0
              ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span className={metricas.saldo_pendiente_usd > 0 ? "text-rose-700 dark:text-rose-300" : ""}>
              Saldo por Cobrar
            </span>
            <AlertCircle
              className={`size-4 ${
                metricas.saldo_pendiente_usd > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-400"
              }`}
            />
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold ${
              metricas.saldo_pendiente_usd > 0
                ? "text-rose-900 dark:text-rose-100"
                : "text-zinc-900 dark:text-white"
            }`}
          >
            {formatearUSD(metricas.saldo_pendiente_usd)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {metricas.saldo_pendiente_usd > 0 ? "Saldo pendiente actual" : "100% al día"}
          </p>
        </div>

        {/* Ticket Promedio */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Ticket Promedio</span>
            <TrendingUp className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
            {formatearUSD(metricas.ticket_promedio_usd)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Promedio por pedido
          </p>
        </div>

        {/* Recurrencia */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Recurrencia</span>
            <Sparkles className="size-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeClasificacion.color}`}
            >
              {badgeClasificacion.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {metricas.frecuencia_dias_promedio !== null
              ? `Compra cada ~${metricas.frecuencia_dias_promedio} días`
              : metricas.dias_desde_ultima_compra !== null
                ? `Última compra hace ${metricas.dias_desde_ultima_compra} días`
                : "Sin pedidos aún"}
          </p>
        </div>
      </div>

      {/* Historial detallado de compras */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Historial de Compras ({metricas.historial_pedidos.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Órdenes realizadas por el cliente ordenadas cronológicamente
            </p>
          </div>

          <Link
            href={`/pedidos/nuevo?cliente_id=${clienteId}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <Plus className="size-3.5" />
            Nueva Orden
          </Link>
        </div>

        {metricas.historial_pedidos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="mx-auto size-8 text-zinc-400" />
            <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Sin órdenes registradas
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Este cliente aún no registra pedidos en el sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-3.5">N° Orden</th>
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-right">Abonado</th>
                  <th className="px-6 py-3.5 text-right">Saldo</th>
                  <th className="px-6 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {metricas.historial_pedidos.map((pedido) => {
                  const tieneSaldo = pedido.saldo_usd > 0 && !pedido.anulado;
                  const { enlaceWhatsApp } = tieneSaldo
                    ? generarMensajeCobranza({
                        cliente_nombre: clienteNombre,
                        cliente_telefono: clienteTelefono,
                        numero_orden: pedido.numero_orden,
                        saldo_usd: pedido.saldo_usd,
                        saldo_bs: pedido.saldo_bs,
                        dias_antiguedad: 0,
                      })
                    : { enlaceWhatsApp: null };

                  return (
                    <tr
                      key={pedido.pedido_id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        <Link
                          href={`/pedidos/${pedido.pedido_id}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {pedido.numero_orden}
                          <ExternalLink className="size-3 text-zinc-400" />
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {formatoFecha(pedido.creado_en)}
                      </td>

                      <td className="px-6 py-4">
                        {pedido.anulado ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            Anulado
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {pedido.estado.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-zinc-800 dark:text-zinc-200">
                        {formatearUSD(pedido.total_usd)}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatearUSD(pedido.total_pagado_usd)}
                      </td>

                      <td className="px-6 py-4 text-right font-bold">
                        {pedido.anulado ? (
                          <span className="text-zinc-400">-</span>
                        ) : tieneSaldo ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatearUSD(pedido.saldo_usd)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Pagado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {enlaceWhatsApp && (
                            <a
                              href={enlaceWhatsApp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                              title="Recordar cobro de saldo por WhatsApp"
                            >
                              <MessageCircle className="size-3 text-emerald-600 dark:text-emerald-400" />
                              Cobrar
                            </a>
                          )}

                          <Link
                            href={`/comanda/${pedido.pedido_id}`}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            <Receipt className="size-3" />
                            Comanda
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
