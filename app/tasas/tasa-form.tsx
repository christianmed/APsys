"use client";

import { CheckCircle2, CircleAlert, Loader2, Save } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { registrarNuevaTasa, type EstadoFormularioTasa } from "./actions";

type Props = {
  valorActual?: number;
};

export function TasaForm({ valorActual }: Props) {
  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioTasa,
    FormData
  >(registrarNuevaTasa, {});

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.exito) {
      formRef.current?.reset();
    }
  }, [estado.exito]);

  return (
    <form ref={formRef} action={accion} className="space-y-4">
      {estado.error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          <CircleAlert className="size-4 shrink-0 text-rose-600" />
          <span>{estado.error}</span>
        </div>
      )}

      {estado.exito && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{estado.mensaje}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="valor"
          className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"
        >
          Nuevo Valor de la Tasa (Bs. por 1 USD) *
        </label>
        <div className="mt-1 relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
            Bs.
          </span>
          <input
            id="valor"
            name="valor"
            type="text"
            required
            placeholder={valorActual ? valorActual.toFixed(2) : "ej. 45.50"}
            disabled={pendiente}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          />
        </div>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Soporta hasta 4 decimales. Los pedidos ya creados mantendrán su tasa original.
        </p>
      </div>

      <div>
        <label
          htmlFor="vigente_desde"
          className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"
        >
          Vigente desde (opcional)
        </label>
        <input
          id="vigente_desde"
          name="vigente_desde"
          type="datetime-local"
          disabled={pendiente}
          className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        />
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Si se deja vacío, entra en vigencia inmediatamente.
        </p>
      </div>

      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pendiente ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Guardando tasa...
          </>
        ) : (
          <>
            <Save className="size-4" />
            Aplicar Nueva Tasa Referencial
          </>
        )}
      </button>
    </form>
  );
}
