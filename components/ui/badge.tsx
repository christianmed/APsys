import React, { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import {
  type ProgressVariant,
  PROGRESS_VARIANT_STYLES,
} from "./progress-bar";

export type BadgeVariant = ProgressVariant;

export type BadgeSize = "sm" | "md";

const BADGE_SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
};

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  title?: string;
};

/**
 * Píldora de estado universal (Badge) conectada a la fuente única de verdad semántica.
 */
export function Badge({
  variant = "neutral",
  size = "md",
  icon: Icon,
  children,
  className = "",
  title,
}: BadgeProps) {
  const variantStyles = PROGRESS_VARIANT_STYLES[variant];

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-colors ${BADGE_SIZE_STYLES[size]} ${variantStyles.badge} ${className}`}
    >
      {Icon && <Icon className="size-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
