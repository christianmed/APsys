"use client";

import React, { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
};

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

/**
 * Modal Canónico de APSys (Emil Kowalski + Impeccable + Tokyo Night).
 * - Cero scale(0) para evitar desgarre visual: transición suave de opacidad y scale-[0.98] a scale-100.
 * - Backdrop sutil con desenfoque suave (backdrop-blur-xs).
 * - Cierre accesible con tecla Escape y click en backdrop.
 * - Cromo neutro (#1a1b26 dark / white light).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className = "",
}: ModalProps) {
  // Manejo de escape accesible
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    // Bloquear scroll de fondo al abrir
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop con desenfoque suave */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Diálogo */}
      <div
        className={`relative w-full ${MAX_WIDTHS[maxWidth]} rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-[0.98] dark:border-[#24283b] dark:bg-[#1a1b26] dark:text-[#f8fafc] ${className}`}
      >
        {/* Cabecera */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-[#24283b]">
            <div className="space-y-1 pr-6 min-w-0">
              {title && (
                <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-[#f8fafc] break-words">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 break-words">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] active:scale-[0.97] touch-manipulation dark:text-zinc-500 dark:hover:bg-[#1f202c] dark:hover:text-zinc-200"
            >
              <X className="size-4 shrink-0" />
            </button>
          </div>
        )}

        {/* Cuerpo */}
        <div className="pt-4 pb-2 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Pie de acción */}
        {footer && (
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-[#24283b]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
