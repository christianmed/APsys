"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

interface ThemeToggleButtonProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * Botón conmutador accesible para alternar entre tema claro y oscuro Tokyo Night.
 * Presenta micro-animación fluida y etiqueta ARIA contextual.
 */
export function ThemeToggleButton({
  className = "",
  size = "md",
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const sizeClasses =
    size === "sm" ? "size-8 text-xs" : "size-8.5 text-xs";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro Tokyo Night"}
      className={`inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300 dark:hover:bg-[#252b42] dark:hover:text-zinc-100 ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
