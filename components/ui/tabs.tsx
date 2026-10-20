import React, { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

export type TabItem = {
  key: string;
  label: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Conmutador horizontal de pestañas canónico para filtros y columnas Kanban.
 * Soporta scroll táctil nativo sin barras invasivas, active:scale-[0.97] y touch-action: manipulation.
 */
export function Tabs({
  items,
  activeKey,
  onChange,
  className = "",
  size = "md",
}: TabsProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
  }[size];

  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none min-w-0 max-w-full ${className}`}
    >
      {items.map((tab) => {
        const isActive = tab.key === activeKey;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold transition-all duration-150 touch-manipulation active:scale-[0.97] ${sizeClasses} ${
              isActive
                ? "bg-zinc-900 text-white shadow-xs dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            {Icon && <Icon className="size-3.5" />}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-0.5">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
