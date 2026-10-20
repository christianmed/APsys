import React from "react";

export type ProgressVariant =
  | "info"
  | "warning"
  | "orange"
  | "danger"
  | "success"
  | "neutral";

export type ProgressSize = "sm" | "md" | "lg";

export const PROGRESS_VARIANT_STYLES: Record<
  ProgressVariant,
  {
    bar: string;
    dot: string;
    text: string;
    badge: string;
  }
> = {
  info: {
    bar: "bg-[#5a82d6] dark:bg-[#7aa2f7]",
    dot: "bg-[#5a82d6] dark:bg-[#7aa2f7]",
    text: "text-[#3b5998] dark:text-[#7aa2f7]",
    badge:
      "border border-blue-200/80 bg-blue-50/70 text-[#3b5998] dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-[#7aa2f7]",
  },
  warning: {
    bar: "bg-[#cf9b4e] dark:bg-[#e0af68]",
    dot: "bg-[#cf9b4e] dark:bg-[#e0af68]",
    text: "text-[#966b24] dark:text-[#e0af68]",
    badge:
      "border border-amber-200/80 bg-amber-50/70 text-[#966b24] dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-[#e0af68]",
  },
  orange: {
    bar: "bg-[#d67644] dark:bg-[#ff9e64]",
    dot: "bg-[#d67644] dark:bg-[#ff9e64]",
    text: "text-[#b05224] dark:text-[#ff9e64]",
    badge:
      "border border-orange-200/80 bg-orange-50/70 text-[#b05224] dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-[#ff9e64]",
  },
  danger: {
    bar: "bg-[#cf586c] dark:bg-[#f7768e]",
    dot: "bg-[#cf586c] dark:bg-[#f7768e]",
    text: "text-[#a83246] dark:text-[#f7768e]",
    badge:
      "border border-rose-200/80 bg-rose-50/70 text-[#a83246] dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-[#f7768e]",
  },
  success: {
    bar: "bg-[#4f8a5a] dark:bg-[#9ece6a]",
    dot: "bg-[#4f8a5a] dark:bg-[#9ece6a]",
    text: "text-[#2e6237] dark:text-[#9ece6a]",
    badge:
      "border border-emerald-200/80 bg-emerald-50/70 text-[#2e6237] dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-[#9ece6a]",
  },
  neutral: {
    bar: "bg-zinc-400 dark:bg-zinc-600",
    dot: "bg-zinc-400 dark:bg-zinc-600",
    text: "text-zinc-600 dark:text-zinc-400",
    badge:
      "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-400",
  },
};

const SIZE_STYLES: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export type ProgressBarProps = {
  value: number; // 0 - 100
  variant?: ProgressVariant;
  size?: ProgressSize;
  className?: string;
  minVisibleValue?: number;
};

/**
 * Barra de progreso simple y unificada con tokens semánticos de APSys Tokyo Night.
 */
export function ProgressBar({
  value,
  variant = "info",
  size = "md",
  className = "",
  minVisibleValue = 2,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const displayWidth =
    clampedValue > 0 ? Math.max(minVisibleValue, clampedValue) : 0;
  const variantStyles = PROGRESS_VARIANT_STYLES[variant];

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#16161e] ${SIZE_STYLES[size]} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${variantStyles.bar}`}
        style={{ width: `${displayWidth}%` }}
      />
    </div>
  );
}

export type ProgressSegment = {
  key: string;
  value: number; // 0 - 100 (porcentaje sobre el total)
  variant: ProgressVariant;
  title?: string;
  minVisibleValue?: number;
};

export type SegmentedProgressBarProps = {
  segments: ProgressSegment[];
  size?: ProgressSize;
  className?: string;
};

/**
 * Barra de progreso multi-segmento proporcional (Stacked/Aging Bar).
 */
export function SegmentedProgressBar({
  segments,
  size = "lg",
  className = "",
}: SegmentedProgressBarProps) {
  return (
    <div
      role="progressbar"
      className={`flex w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#16161e] ${SIZE_STYLES[size]} ${className}`}
    >
      {segments.map((seg) => {
        if (seg.value <= 0) return null;
        const width = Math.max(seg.minVisibleValue ?? 4, seg.value);
        const variantStyles = PROGRESS_VARIANT_STYLES[seg.variant];

        return (
          <div
            key={seg.key}
            className={`h-full transition-all duration-300 ease-out ${variantStyles.bar}`}
            style={{ width: `${width}%` }}
            title={seg.title}
          />
        );
      })}
    </div>
  );
}
