"use client";

import { AlertTriangle, Ban, Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { anularPedidoConAuditoria } from "./actions";

type Props = {
  pedidoId: string;
  numeroOrden: number | string;
};

export function AnularPedidoModal({ pedidoId, numeroOrden }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirmar = () => {
    if (motivo.trim().length < 5) {
      setError("El motivo debe contener al menos 5 caracteres.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await anularPedidoConAuditoria(pedidoId, motivo);
      if (!res.ok) {
        setError(res.error ?? "No se pudo anular el pedido.");
      } else {
        setAbierto(false);
        setMotivo("");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAbierto(true);
          setError(null);
        }}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
        title="Anular pedido con registro de auditoría"
      >
        <Ban className="size-3.5 text-rose-600" />
        Anular
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <span className="rounded-xl bg-rose-100 p-2 dark:bg-rose-950/60">
                  <AlertTriangle className="size-5" />
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Anular Pedido #{numeroOrden}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={isPending}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Esta acción es <strong>irreversible</strong> y quedará registrada en el sistema de auditoría inmutable (RF-16). El pedido ya no contará en los ingresos ni en el dashboard.
            </p>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="motivo-anulacion"
                className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Motivo obligatorio de anulación *
              </label>
              <textarea
                id="motivo-anulacion"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indica el motivo (ej. cliente desistió por presupuesto, error en medidas)..."
                disabled={isPending}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
              <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                <span>Mínimo 5 caracteres</span>
                <span>{motivo.length}/500</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={isPending}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={isPending || motivo.trim().length < 5}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Anulando...
                  </>
                ) : (
                  <>
                    <Ban className="size-3.5" />
                    Confirmar Anulación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
