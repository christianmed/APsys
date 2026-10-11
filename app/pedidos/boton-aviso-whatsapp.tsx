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
    return (
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Avisar por WhatsApp a ${nombreCliente} sobre ${ordenStr}`}
        data-testid={`btn-whatsapp-${numeroOrden}`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#20ba59] active:scale-98"
      >
        <MessageCircle className="size-5 fill-white/20" />
        Avisar por WhatsApp
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
        className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:bg-[#20ba59] active:scale-95 shadow-sm"
        title="Avisar por WhatsApp"
      >
        <MessageCircle className="size-4 fill-white/20" />
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
      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20ba59] active:scale-95"
    >
      <MessageCircle className="size-3.5 fill-white/20" />
      Avisar por WhatsApp
    </a>
  );
}
