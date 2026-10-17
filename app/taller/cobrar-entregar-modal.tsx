"use client";

import { AlertCircle, Banknote, CheckCircle, LoaderCircle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { cobrarYEntregarPedido } from "@/app/pedidos/actions";
import { formatearMonedaBs, formatearMonedaUSD } from "@/lib/cobranzas/cuentas-por-cobrar";

type Props = {
  pedidoId: string;
  numeroOrden: number | string;
  clienteNombre: string;
  saldoUsd: number;
  tasaBs: number;
  abierto: boolean;
  alCerrar: () => void;
  alCompletar: (pedidoId: string) => void;
};

export function CobrarYEntregarModal({
  pedidoId,
  numeroOrden,
  clienteNombre,
  saldoUsd,
  tasaBs,
  abierto,
  alCerrar,
  alCompletar,
}: Props) {
  const [moneda, setMoneda] = useState<"USD" | "Bs">("USD");
  const [monto, setMonto] = useState<string>(saldoUsd.toFixed(2));
  const [referencia, setReferencia] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tasaEfectiva = tasaBs > 0 ? tasaBs : 40.0;
  const saldoBs = Math.round(saldoUsd * tasaEfectiva * 100) / 100;

  const cambiarAMoneda = (nuevaMoneda: "USD" | "Bs") => {
    setMoneda(nuevaMoneda);
    if (nuevaMoneda === "USD") {
      setMonto(saldoUsd.toFixed(2));
    } else {
      setMonto(saldoBs.toFixed(2));
    }
  };

  if (!abierto) return null;

  const handleConfirmar = () => {
    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto numérico válido mayor a cero.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const res = await cobrarYEntregarPedido(pedidoId, {
        monto: montoNum,
        moneda,
        referencia: referencia.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error ?? "No se pudo registrar el cobro y entrega.");
      } else {
        alCompletar(pedidoId);
        alCerrar();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Banknote className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Cobrar Saldo y Entregar
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ORD-{String(numeroOrden).padStart(4, "0")} · {clienteNombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            disabled={isPending}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Resumen del saldo adeudado */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              Saldo Pendiente:
            </span>
            <div className="text-right">
              <div className="text-xl font-extrabold text-amber-950 dark:text-amber-200">
                {formatearMonedaUSD(saldoUsd)}
              </div>
              <div className="text-xs font-semibold text-amber-800/80 dark:text-amber-400">
                {formatearMonedaBs(saldoBs)}
              </div>
            </div>
          </div>
          <div className="mt-2 border-t border-amber-200/60 pt-2 text-[11px] text-amber-800/80 dark:border-amber-900/40 dark:text-amber-400">
            Tasa de cambio del pedido: <strong>Bs. {tasaEfectiva.toFixed(2)} / USD</strong>
          </div>
        </div>

        {/* Selector de moneda */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Moneda del Pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => cambiarAMoneda("USD")}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition ${
                moneda === "USD"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              }`}
            >
              💵 Dólares (USD)
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => cambiarAMoneda("Bs")}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition ${
                moneda === "Bs"
                  ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              }`}
            >
              🇻🇪 Bolívares (Bs)
            </button>
          </div>
        </div>

        {/* Monto recibido */}
        <div className="space-y-1.5">
          <label
            htmlFor="monto-cobro"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Monto a Cobrar ({moneda})
          </label>
          <input
            id="monto-cobro"
            type="number"
            step="0.01"
            min="0.01"
            disabled={isPending}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base font-bold text-zinc-900 transition focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-100"
          />
        </div>

        {/* Referencia o método de pago opcional */}
        <div className="space-y-1.5">
          <label
            htmlFor="referencia-cobro"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Referencia / Método (Opcional)
          </label>
          <input
            id="referencia-cobro"
            type="text"
            disabled={isPending}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. Efectivo caja, Pago Móvil 8921, Zelle..."
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
          />
        </div>

        {/* Mensaje de error si ocurre */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmar}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            {isPending ? "Registrando Cobro..." : "Confirmar Cobro y Entregar"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={alCerrar}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
