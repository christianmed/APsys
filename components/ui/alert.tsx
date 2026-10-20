import React, { type ReactNode } from "react";
import { type LucideIcon, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export type AlertVariant = "info" | "warning" | "danger" | "success";

export type AlertProps = {
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: AlertVariant;
  className?: string;
};

const ALERT_STYLES: Record<
  AlertVariant,
  {
    container: string;
    icon: LucideIcon;
    iconClass: string;
    titleClass: string;
    textClass: string;
  }
> = {
  info: {
    container: "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20",
    icon: Info,
    iconClass: "text-[#5a82d6] dark:text-[#7aa2f7]",
    titleClass: "text-[#3b5998] dark:text-[#7aa2f7]",
    textClass: "text-[#3b5998]/90 dark:text-zinc-300",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20",
    icon: AlertTriangle,
    iconClass: "text-[#cf9b4e] dark:text-[#e0af68]",
    titleClass: "text-[#966b24] dark:text-[#e0af68]",
    textClass: "text-[#966b24]/90 dark:text-zinc-300",
  },
  danger: {
    container: "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20",
    icon: AlertCircle,
    iconClass: "text-[#cf586c] dark:text-[#f7768e]",
    titleClass: "text-[#a83246] dark:text-[#f7768e]",
    textClass: "text-[#a83246]/90 dark:text-zinc-300",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    icon: CheckCircle,
    iconClass: "text-[#4f8a5a] dark:text-[#9ece6a]",
    titleClass: "text-[#2e6237] dark:text-[#9ece6a]",
    textClass: "text-[#2e6237]/90 dark:text-zinc-300",
  },
};

/**
 * Banner de notificación o advertencia canónico con semántica y micro-bordes sutiles.
 */
export function Alert({
  title,
  children,
  icon: CustomIcon,
  variant = "info",
  className = "",
}: AlertProps) {
  const config = ALERT_STYLES[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 shadow-xs transition-colors ${config.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${config.iconClass}`} />
        <div className="space-y-0.5 min-w-0">
          {title && (
            <h4 className={`text-xs font-bold leading-tight ${config.titleClass}`}>
              {title}
            </h4>
          )}
          <div className={`text-xs leading-relaxed ${config.textClass}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
