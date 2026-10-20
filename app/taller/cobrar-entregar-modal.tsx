"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Coins, DollarSign, LoaderCircle } from "lucide-react";
import { cobrarYEntregarPedido } from "@/app/pedidos/actions";
import { formatearMonedaBs, formatearMonedaUSD } from "@/lib/cobranzas/cuentas-por-cobrar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <Modal
      isOpen={abierto}
      onClose={alCerrar}
      title="Cobrar Saldo y Entregar"
      description={`ORD-${String(numeroOrden).padStart(4, "0")} · ${clienteNombre}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Resumen del saldo adeudado con cromo neutro y acento Tokyo Night */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-[#e0af68]">
              Saldo Pendiente:
            </span>
            <div className="text-right">
              <div className="text-xl font-extrabold tracking-tight text-amber-950 dark:text-[#e0af68]">
                {formatearMonedaUSD(saldoUsd)}
              </div>
              <div className="text-xs font-medium text-amber-800/80 dark:text-zinc-400">
                {formatearMonedaBs(saldoBs)}
              </div>
            </div>
          </div>
          <div className="mt-2.5 border-t border-amber-200/50 pt-2 text-[11px] text-amber-850 dark:border-amber-900/40 dark:text-zinc-400">
            Tasa de cambio del pedido:{" "}
            <strong className="text-amber-950 dark:text-zinc-200">
              Bs. {tasaEfectiva.toFixed(2)} / USD
            </strong>
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
              className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all touch-manipulation active:scale-[0.97] ${
                moneda === "USD"
                  ? "border-[#7aa2f7] bg-[#7aa2f7] text-white shadow-xs dark:border-[#7aa2f7] dark:bg-[#7aa2f7] dark:text-[#16161e]"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
              }`}
            >
              <DollarSign className="size-3.5" />
              <span>Dólares (USD)</span>
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => cambiarAMoneda("Bs")}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all touch-manipulation active:scale-[0.97] ${
                moneda === "Bs"
                  ? "border-[#7aa2f7] bg-[#7aa2f7] text-white shadow-xs dark:border-[#7aa2f7] dark:bg-[#7aa2f7] dark:text-[#16161e]"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
              }`}
            >
              <Coins className="size-3.5" />
              <span>Bolívares (Bs)</span>
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
          <Input
            id="monto-cobro"
            type="number"
            step="0.01"
            min="0.01"
            disabled={isPending}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="text-sm font-bold"
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
          <Input
            id="referencia-cobro"
            type="text"
            disabled={isPending}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. Efectivo caja, Pago Móvil 8921, Zelle..."
          />
        </div>

        {/* Mensaje de error si ocurre */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            disabled={isPending}
            onClick={handleConfirmar}
            className="w-full h-11 text-xs uppercase tracking-wider font-bold"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            <span>{isPending ? "Registrando Cobro..." : "Confirmar Cobro y Entregar"}</span>
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={alCerrar}
            className="w-full h-9 text-xs"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
