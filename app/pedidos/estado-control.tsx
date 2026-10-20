"use client";

import {
  Ban,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  PackageCheck,
  Play,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
  obtenerSiguienteEstadoSugerido,
  type EstadoPedido,
} from "@/lib/pedidos/estados";
import { cambiarEstadoPedido } from "./actions";

type Props = {
  pedidoId: string;
  estadoActual: EstadoPedido;
  rolUsuario: string;
  anulado?: boolean;
  modo?: "completo" | "solo_badge" | "solo_boton";
};

export const ESTADO_CONFIG: Record<
  EstadoPedido,
  {
    label: string;
    clasesBadge: string;
    siguienteLabel?: string;
    IconoSiguiente?: typeof Play;
    iconoColor?: string;
  }
> = {
  recibido: {
    label: "Recibido",
    clasesBadge:
      "border border-blue-200/90 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-[#7aa2f7]",
    siguienteLabel: "Iniciar producción",
    IconoSiguiente: Play,
    iconoColor: "text-[#7aa2f7]",
  },
  en_produccion: {
    label: "En Producción",
    clasesBadge:
      "border border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-[#e0af68]",
    siguienteLabel: "Listo para Retiro",
    IconoSiguiente: CheckCircle2,
    iconoColor: "text-[#9ece6a]",
  },
  listo: {
    label: "Listo para Retiro",
    clasesBadge:
      "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-[#9ece6a]",
    siguienteLabel: "Entregar pedido",
    IconoSiguiente: PackageCheck,
    iconoColor: "text-[#9ece6a]",
  },
  entregado: {
    label: "Entregado",
    clasesBadge:
      "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300",
  },
  cancelado: {
    label: "Cancelado",
    clasesBadge:
      "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-[#f7768e]",
  },
};

/**
 * Control interactivo de estado de pedidos para recepción y taller (RF-05 / T-013b).
 * Permite avanzar de estado en ≤ 2 toques y cancelar pedidos con motivo (rol gerencial).
 */
export function EstadoControl({
  pedidoId,
  estadoActual,
  rolUsuario,
  anulado = false,
  modo = "completo",
}: Props) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const config = ESTADO_CONFIG[estadoActual] ?? ESTADO_CONFIG.recibido;
  const siguienteEstado = obtenerSiguienteEstadoSugerido(estadoActual);
  const esTerminal = estadoActual === "entregado" || estadoActual === "cancelado" || anulado;
  const puedeCancelar = rolUsuario === "gerencial" && !esTerminal;

  const handleAvanzar = (nuevo: EstadoPedido) => {
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoPedido(pedidoId, nuevo);
      if (!res.ok && res.error) {
        setError(res.error);
      }
    });
  };

  const handleConfirmarCancelar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoCancelacion.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoPedido(
        pedidoId,
        "cancelado",
        motivoCancelacion,
      );
      if (!res.ok && res.error) {
        setError(res.error);
      } else {
        setMostrarModalCancelar(false);
        setMotivoCancelacion("");
      }
    });
  };

  // Modo solo_badge: solo muestra la píldora informativa de estado
  if (modo === "solo_badge") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.clasesBadge}`}
      >
        {config.label}
      </span>
    );
  }

  // Modo solo_boton: solo muestra el botón de acción rápida de avance de estado
  if (modo === "solo_boton") {
    if (!siguienteEstado || anulado) return null;

    const Icono = config.IconoSiguiente ?? ChevronRight;
    const colorIcono = config.iconoColor ?? "text-[#7aa2f7]";

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => handleAvanzar(siguienteEstado)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 hover:border-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-60 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#f8fafc] dark:hover:bg-[#252b42] dark:hover:border-[#7aa2f7]/50"
        >
          {pendiente ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Icono className={`size-3.5 shrink-0 ${colorIcono}`} />
          )}
          <span>{config.siguienteLabel}</span>
        </button>

        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.clasesBadge}`}
        >
          {config.label}
        </span>

        {/* Botón de acción rápida: avanzar al siguiente estado en 1 toque */}
        {siguienteEstado && !anulado ? (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => handleAvanzar(siguienteEstado)}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-zinc-900 bg-zinc-900 px-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 disabled:opacity-60 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#f8fafc] dark:hover:bg-[#252b42]"
          >
            {pendiente ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : config.IconoSiguiente ? (
              <config.IconoSiguiente className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            {config.siguienteLabel}
          </button>
        ) : null}

        {/* Botón de cancelar para gerencial */}
        {puedeCancelar ? (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => setMostrarModalCancelar(true)}
            aria-label="Cancelar pedido"
            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-red-200 px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Ban className="size-3" /> Cancelar
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {/* Modal para ingresar motivo de cancelación obligatoria (RF-16 / T-013) */}
      {mostrarModalCancelar ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Ban className="size-5" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Cancelar pedido
              </h3>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              La anulación de una orden de producción es irreversible y requiere
              un motivo justificado para la auditoría.
            </p>

            <form onSubmit={handleConfirmarCancelar} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Motivo obligatorio de anulación
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Archivo defectuoso, cliente no aprobó prueba de color..."
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCancelar(false);
                    setMotivoCancelacion("");
                  }}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={pendiente || !motivoCancelacion.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {pendiente ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : null}
                  Confirmar anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
