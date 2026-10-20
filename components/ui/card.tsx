import React, { type ReactNode } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
};

/**
 * Contenedor universal de tarjeta bajo estándares Impeccable & Taste Skill.
 * Superficie neutra (blanca en claro, #1a1b26 en oscuro), micro-borde sutil y sombra mínima.
 */
export function Card({ children, className = "", onClick, href }: CardProps) {
  const baseClasses =
    "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]";

  if (href) {
    return (
      <Link
        href={href}
        className={`block w-full text-left transition-all duration-150 touch-manipulation hover:border-zinc-300 dark:hover:border-[#2f3654] active:scale-[0.97] ${baseClasses} ${className}`}
      >
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left transition-all duration-150 touch-manipulation hover:border-zinc-300 dark:hover:border-[#2f3654] active:scale-[0.97] ${baseClasses} ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${baseClasses} ${className}`}>{children}</div>;
}

export type KpiCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "info" | "warning" | "danger" | "success";
  onClick?: () => void;
  href?: string;
  className?: string;
};

const KPI_ICON_STYLES = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-[#1f202c] dark:text-zinc-200",
  info: "bg-blue-50 text-[#3b5998] dark:bg-[#1f202c] dark:text-[#7aa2f7]",
  warning: "bg-amber-50 text-[#966b24] dark:bg-[#1f202c] dark:text-[#e0af68]",
  danger: "bg-rose-50 text-[#a83246] dark:bg-[#1f202c] dark:text-[#f7768e]",
  success: "bg-emerald-50 text-[#2e6237] dark:bg-[#1f202c] dark:text-[#9ece6a]",
};

const KPI_VALUE_STYLES = {
  default: "text-zinc-900 dark:text-zinc-50",
  info: "text-[#3b5998] dark:text-[#7aa2f7]",
  warning: "text-[#966b24] dark:text-[#e0af68]",
  danger: "text-[#a83246] dark:text-[#f7768e]",
  success: "text-[#2e6237] dark:text-[#9ece6a]",
};

/**
 * Tarjeta de métrica cuantitativa (KPI) estandarizada.
 * Jerarquía tipográfica audaz con cromo 100% neutro.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  onClick,
  href,
  className = "",
}: KpiCardProps) {
  const content = (
    <div className="p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {Icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg p-2 ${KPI_ICON_STYLES[variant]}`}
          >
            <Icon className="size-5" />
          </span>
        )}
      </div>

      <div
        className={`mt-3 text-3xl font-extrabold tracking-tight truncate ${KPI_VALUE_STYLES[variant]}`}
      >
        {value}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 break-words">
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <Card href={href} onClick={onClick} className={className}>
      {content}
    </Card>
  );
}
