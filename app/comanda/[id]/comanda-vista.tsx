"use client";

import { ArrowLeft, CheckCircle2, FileText, Printer, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type FormatoImpresion = "a4" | "ticket";

type Props = {
  pedido: {
    id: string;
    numero_orden: number;
    estado: string;
    total_usd: number;
    creado_en: string;
    notas: string | null;
    cliente: {
      nombre: string;
      telefono: string | null;
    } | null;
    items: Array<{
      id: string;
      servicio_nombre: string;
      descripcion: string | null;
      dimensiones: string | null;
      acabados: string | null;
      cantidad: number;
      precio_usd: number;
    }>;
    pagos: Array<{
      monto: number;
      moneda: string;
      referencia: string | null;
    }>;
    tasa_bs: number;
  };
  barcodeSvg: string;
  qrSvg: string;
};

/**
 * Vista interactiva e imprimible de la comanda de producción (RF-03, D-4 / T-011b).
 * Soporta alternancia en tiempo real entre formato de Taller A4 y Ticket térmico 80mm,
 * con estilos `@media print` para impresión sin distracciones en mostrador o taller.
 */
export function ComandaVista({ pedido, barcodeSvg, qrSvg }: Props) {
  const [formato, setFormato] = useState<FormatoImpresion>("a4");

  const fechaFormateada = new Date(pedido.creado_en).toLocaleDateString(
    "es-VE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const totalPagadoUsd = pedido.pagos.reduce((acc, p) => {
    if (p.moneda === "USD") return acc + Number(p.monto);
    return acc + Number(p.monto) / pedido.tasa_bs;
  }, 0);

  const saldoUsd = Math.max(
    0,
    Math.round((pedido.total_usd - totalPagadoUsd) * 100) / 100,
  );
  const saldoBs = Math.round(saldoUsd * pedido.tasa_bs * 100) / 100;
  const esPagado = saldoUsd === 0 && pedido.total_usd > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-dvh bg-zinc-100 py-6 text-zinc-900 print:bg-white print:p-0 dark:bg-zinc-950 dark:text-zinc-100 print:dark:bg-white print:dark:text-black">
      {/* BARRA DE HERRAMIENTAS EN PANTALLA (NO SE IMPRIME) */}
      <aside aria-label="Controles de comanda" className="no-print mx-auto mb-6 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 px-4">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" /> Volver a pedidos
        </Link>

        <div className="flex items-center gap-2">
          {/* Selector de formato: A4 vs Ticket */}
          <div className="flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setFormato("a4")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                formato === "a4"
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <FileText className="size-3.5" /> Hoja A4
            </button>
            <button
              type="button"
              onClick={() => setFormato("ticket")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                formato === "ticket"
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Receipt className="size-3.5" /> Ticket 80mm
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Printer className="size-3.5" /> Imprimir
          </button>
        </div>
      </aside>

      {/* DOCUMENTO IMPRIMIBLE */}
      <div
        className={`mx-auto bg-white p-6 shadow-sm print:p-0 print:shadow-none print:m-0 ${
          formato === "ticket"
            ? "max-w-[340px] text-xs font-mono border-dashed border-zinc-300 print:border-none"
            : "max-w-2xl rounded-2xl border border-zinc-200 print:rounded-none print:border-none"
        }`}
      >
        {/* CABECERA */}
        <header className="border-b border-zinc-200 pb-4 text-center print:border-black">
          <h2 className="text-lg font-black tracking-wide uppercase">
            Sol_gráficas C.J., C.A.
          </h2>
          <p className="text-[11px] text-zinc-500 uppercase print:text-black">
            Comanda de Producción y Recepción
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 print:border-black">
            <span className="text-left">
              <span className="block text-[10px] text-zinc-400 uppercase print:text-black">
                Orden
              </span>
              <span className="text-xl font-black text-zinc-900">
                #{pedido.numero_orden}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-[10px] text-zinc-400 uppercase print:text-black">
                Fecha
              </span>
              <span className="text-xs font-medium text-zinc-700">
                {fechaFormateada}
              </span>
            </span>
          </div>
        </header>

        {/* CÓDIGO DE BARRAS (PARA ESCÁNER USB EN RECEPCIÓN Y TALLER) */}
        <div className="my-3 flex flex-col items-center justify-center py-1">
          <div
            className="w-48 text-zinc-900 print:text-black"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />
          <span className="mt-1 font-mono text-[10px] tracking-widest uppercase">
            *ORD-{pedido.numero_orden}*
          </span>
        </div>

        {/* DATOS DEL CLIENTE */}
        <section className="my-3 border-y border-dashed border-zinc-200 py-3 text-left print:border-black">
          <div className="flex justify-between">
            <span className="font-bold text-zinc-600 print:text-black">
              Cliente:
            </span>
            <span className="font-bold text-zinc-900">
              {pedido.cliente?.nombre ?? "No especificado"}
            </span>
          </div>
          {pedido.cliente?.telefono ? (
            <div className="mt-1 flex justify-between">
              <span className="text-zinc-600 print:text-black">Teléfono:</span>
              <span className="font-medium text-zinc-900">
                {pedido.cliente.telefono}
              </span>
            </div>
          ) : null}
        </section>

        {/* DETALLE DE TRABAJOS / SERVICIOS A PRODUCIR */}
        <section className="my-4">
          <h3 className="mb-2 text-left text-xs font-black uppercase tracking-wider text-zinc-700 print:text-black">
            Detalle de Producción ({pedido.items.length}{" "}
            {pedido.items.length === 1 ? "ítem" : "ítems"})
          </h3>

          <div className="divide-y divide-zinc-200 border-y border-zinc-200 print:border-black print:divide-black">
            {pedido.items.map((item, idx) => (
              <div key={item.id} className="py-2.5 text-left">
                <div className="flex items-start justify-between font-bold">
                  <span>
                    #{idx + 1}. {item.servicio_nombre}
                  </span>
                  <span className="ml-2 font-mono">x{item.cantidad}</span>
                </div>

                {item.dimensiones ? (
                  <p className="mt-0.5 text-zinc-600 print:text-black">
                    <span className="font-semibold">Medidas:</span>{" "}
                    {item.dimensiones}
                  </p>
                ) : null}

                {item.acabados ? (
                  <p className="mt-0.5 text-zinc-600 print:text-black">
                    <span className="font-semibold">Acabados:</span>{" "}
                    {item.acabados}
                  </p>
                ) : null}

                {item.descripcion ? (
                  <p className="mt-0.5 text-zinc-500 italic print:text-black">
                    Detalle: {item.descripcion}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* NOTAS */}
        {pedido.notas ? (
          <section className="my-3 rounded-lg bg-zinc-50 p-2.5 text-left text-xs print:border print:border-zinc-300 print:bg-white">
            <span className="font-bold uppercase tracking-wide text-zinc-600 print:text-black">
              Observaciones:
            </span>
            <p className="mt-0.5 text-zinc-800">{pedido.notas}</p>
          </section>
        ) : null}

        {/* RESUMEN FINANCIERO */}
        <section className="my-4 border-t-2 border-zinc-900 pt-3 text-left print:border-black">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 print:text-black">Total orden:</span>
            <span className="font-bold">
              ${pedido.total_usd.toFixed(2)} USD
            </span>
          </div>

          <div className="mt-1 flex justify-between text-xs">
            <span className="text-zinc-600 print:text-black">Abonado:</span>
            <span className="font-medium text-green-700 print:text-black">
              ${totalPagadoUsd.toFixed(2)} USD
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-dashed border-zinc-300 pt-2 text-sm font-black print:border-black">
            <span>Saldo a cobrar al retiro:</span>
            <div className="text-right">
              <div>${saldoUsd.toFixed(2)} USD</div>
              <div className="text-[11px] font-normal text-zinc-500 print:text-black">
                (~ {saldoBs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)
              </div>
            </div>
          </div>

          {esPagado ? (
            <div className="mt-2 text-center text-xs font-bold text-green-700 print:text-black">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> TOTALMENTE PAGADO
              </span>
            </div>
          ) : null}
        </section>

        {/* CÓDIGO QR PARA ESCÁNER MÓVIL EN TALLER (RF-06) */}
        <footer className="mt-6 border-t border-zinc-200 pt-4 text-center print:border-black">
          <div className="flex flex-col items-center justify-center">
            <div
              className="size-28 text-zinc-900 print:text-black"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-wider print:text-black">
              Escanear en taller para actualizar estado
            </p>
          </div>
        </footer>
      </div>

      {/* ESTILOS CSS @media print NATIVOS PARA IMPRESORAS Y TICKETERAS */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 8mm;
            size: auto;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
