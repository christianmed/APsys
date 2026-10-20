import React, { forwardRef, type InputHTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  error?: boolean | string;
  sizeVariant?: "sm" | "md" | "lg";
};

/**
 * Campo de texto canónico del sistema APSys bajo diseño Tokyo Night & Editorial Light.
 * Superficie neutra (#16161e en oscuro, #f8fafc en claro), anillo de foco azul zafiro (#7aa2f7) y micro-interacción.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon: Icon, error, sizeVariant = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 text-xs px-2.5",
      md: "h-9 text-xs px-3",
      lg: "h-11 text-sm px-3.5",
    }[sizeVariant];

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className="w-full space-y-1">
        <div className="relative w-full">
          {Icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              <Icon className="size-4" />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] dark:bg-[#16161e] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25 ${
              Icon ? "pl-9" : ""
            } ${
              hasError
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500"
                : "border-zinc-200 dark:border-[#24283b]"
            } ${sizeClasses} ${className}`}
            {...props}
          />
        </div>
        {errorMessage && (
          <p className="text-[11px] font-medium text-rose-600 dark:text-[#f7768e]">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
