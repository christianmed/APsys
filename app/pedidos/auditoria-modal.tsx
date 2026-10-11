"use client";

import { History, Loader2, ShieldCheck, X } from "lucide-react";
import { useState, useTransition } from "react";
import { consultarAuditoriaPedido } from "./actions";

type EventoAudit = {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  motivo?: string | null;
  usuario_id?: string | null;
  fecha: string;
};

type Props = {
  pedidoId: string;
  numeroOrden: number | string;
};

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AuditoriaModal({ pedidoId, numeroOrden }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [eventos, setEventos] = useState<EventoAudit[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAbrir = () => {
    setAbierto(true);
    startTransition(async () => {
      const data = await consultarAuditoriaPedido(pedidoId);
      setEventos(data as unknown as EventoAudit[]);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAbrir}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Ver registro de auditoría inmutable"
      >
        <History className="size-3.5 text-zinc-400" />
        Auditoría
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white">
                <span className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
                  <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Registro de Auditoría — Pedido #{numeroOrden}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Traza inmutable append-only de operaciones sensibles (RF-16)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-5" />
              </button>
            </div>

            {isPending ? (
              <div className="flex items-center justify-center py-8 gap-2 text-xs text-zinc-500">
                <Loader2 className="size-4 animate-spin" />
                Cargando traza de auditoría...
              </div>
            ) : !eventos || eventos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
                No hay eventos de auditoría registrados para esta orden.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 overflow-hidden text-xs dark:divide-zinc-800 dark:border-zinc-800 max-h-72 overflow-y-auto">
                {eventos.map((e) => (
                  <div key={e.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                        Acción: {e.accion}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatoFecha(e.fecha)}
                      </span>
                    </div>
                    {e.motivo && (
                      <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg mt-1 text-[11px]">
                        <strong>Motivo:</strong> {e.motivo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="h-9 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
