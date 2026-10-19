"use client";

import { MessageCircle } from "lucide-react";
import {
  generarEnlaceWhatsAppAviso,
  normalizarTelefonoWhatsApp,
} from "@/lib/notificaciones/whatsapp";

type Props = {
  telefono: string | null | undefined;
  nombreCliente: string;
  numeroOrden: number;
  totalUsd: number;
  saldoUsd: number;
  tasaBsPorUsd?: number | null;
  variante?: "boton" | "icono" | "full";
};

/**
 * Botón interactivo para avisar al cliente por WhatsApp cuando su orden está lista (RF-08 / D-2).
 * Abre directamente wa.me con el mensaje preformateado y saldo pendiente.
 */
export function BotonAvisoWhatsApp({
  telefono,
  nombreCliente,
  numeroOrden,
  totalUsd,
  saldoUsd,
  tasaBsPorUsd,
  variante = "boton",
}: Props) {
  const telefonoValido = normalizarTelefonoWhatsApp(telefono);

  if (!telefonoValido) {
    if (variante === "icono") return null;

    return (
      <span
        title="El cliente no tiene teléfono válido para WhatsApp"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-400 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500"
      >
        <MessageCircle className="size-3.5" />
        Sin WhatsApp
      </span>
    );
  }

  const urlWhatsApp = generarEnlaceWhatsAppAviso({
    telefono,
    nombreCliente,
    numeroOrden,
    totalUsd,
    saldoUsd,
    tasaBsPorUsd,
  });

  if (!urlWhatsApp) return null;

  const ordenStr = `ORD-${String(numeroOrden).padStart(4, "0")}`;

  if (variante === "full") {
    const estiloClases =
      "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/80 bg-emerald-50/70 px-4 text-xs font-semibold text-emerald-950 shadow-xs transition hover:bg-emerald-100 active:scale-98 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-emerald-300 dark:hover:bg-[#252b42] dark:hover:border-emerald-700/60";
    const iconoClases = "size-4 text-emerald-600 dark:text-emerald-400";

    return (
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Avisar por WhatsApp a ${nombreCliente} sobre ${ordenStr}`}
        data-testid={`btn-whatsapp-${numeroOrden}`}
        className={estiloClases}
      >
        <MessageCircle className={iconoClases} />
        <span>Avisar por WhatsApp</span>
      </a>
    );
  }

  if (variante === "icono") {
    return (
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Avisar por WhatsApp a ${nombreCliente}`}
        data-testid={`btn-whatsapp-${numeroOrden}`}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-emerald-300/80 bg-emerald-50/80 text-emerald-700 transition hover:bg-emerald-100 active:scale-95 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        title="Avisar por WhatsApp"
      >
        <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
      </a>
    );
  }

  return (
    <a
      href={urlWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Avisar por WhatsApp a ${nombreCliente} sobre ${ordenStr}`}
      data-testid={`btn-whatsapp-${numeroOrden}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50/80 px-3 text-xs font-semibold text-emerald-950 shadow-xs transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      Aviso WhatsApp
    </a>
  );
}
