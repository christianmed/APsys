import React, { forwardRef, type ButtonHTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm dark:border dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#f8fafc] dark:hover:bg-[#252b42]",
  secondary:
    "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-200 dark:hover:bg-[#1f202c]",
  outline:
    "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-[#24283b] dark:bg-[#1a1b26] dark:text-zinc-200 dark:hover:border-[#2f3654] dark:hover:bg-[#1f202c]",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1f202c] dark:hover:text-[#f8fafc]",
  danger:
    "border border-rose-200 bg-rose-50 text-[#a83246] hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-[#f7768e] dark:hover:bg-rose-900/60",
};

const BUTTON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
  md: "h-9 px-4 text-xs font-semibold rounded-xl gap-2",
  lg: "h-11 px-5 text-sm font-semibold rounded-xl gap-2.5",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  isLoading?: boolean;
};

/**
 * Botón universal con micro-interacción física (:active:scale-[0.97])
 * y optimización contra tap-delay (touch-action: manipulation).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      isLoading,
      disabled,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 touch-manipulation active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${BUTTON_VARIANT_STYLES[variant]} ${BUTTON_SIZE_STYLES[size]} ${className}`}
        {...props}
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
