"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown, Check, Plus, Search } from "lucide-react";

export type CustomSelectOption<T = string | number> = {
  value: T;
  label: string;
  subtitle?: string;
  status?: string;
  isActive?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export type CustomSelectActionButton = {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
};

export interface CustomSelectProps<T = string | number> {
  options: CustomSelectOption<T>[];
  value?: T | null;
  onChange?: (value: T) => void;
  variant?: "form" | "header";
  size?: "sm" | "md" | "lg";
  headerTitle?: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  actionButton?: CustomSelectActionButton;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  "aria-label"?: string;
}

/**
 * CustomSelect - Componente desplegable accesible y estilizado con la paleta oficial Zinc de APSys.
 * Elimina inconsistencias entre navegadores y soporta búsqueda reactiva, navegación por teclado y botones de acción rápida.
 */
export function CustomSelect<T extends string | number = string>({
  options = [],
  value,
  onChange,
  variant = "form",
  size = "md",
  headerTitle,
  placeholder = "Seleccionar...",
  searchable = false,
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones",
  actionButton,
  disabled = false,
  error = false,
  className = "",
  id: externalId,
  name,
  required = false,
  "aria-label": ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = externalId || generatedId;

  // Opción actualmente seleccionada
  const selectedOption = useMemo(() => {
    return (
      options.find((opt) => String(opt.value) === String(value)) || null
    );
  }, [options, value]);

  // Opciones filtradas por búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subtitle ? opt.subtitle.toLowerCase().includes(q) : false;
      return matchLabel || matchSub;
    });
  }, [options, searchQuery]);

  // Cerrar y limpiar búsqueda
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  }, []);

  // Seleccionar una opción
  const handleSelect = useCallback(
    (optionValue: T, isOptionDisabled?: boolean) => {
      if (isOptionDisabled || disabled) return;
      if (onChange) {
        onChange(optionValue);
      }
      closeDropdown();
    },
    [disabled, onChange, closeDropdown]
  );

  // Manejo de clic exterior y tecla Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, closeDropdown]);

  // Enfocar el input de búsqueda automáticamente al abrir
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Abrir desplegable sincronizando el resaltado inicial
  const openDropdown = useCallback(() => {
    if (disabled) return;
    const idx = filteredOptions.findIndex(
      (opt) => String(opt.value) === String(value)
    );
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  }, [disabled, filteredOptions, value]);

  // Alternar apertura y cierre
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [disabled, isOpen, closeDropdown, openDropdown]);

  // Navegación por teclado dentro del menú
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          return next;
        });
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          return next;
        });
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value, opt.disabled);
          }
        }
        break;
      }
      case "Tab": {
        closeDropdown();
        break;
      }
    }
  };

  // Clases de altura y texto según tamaño
  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs",
    md: "h-10 px-3.5 text-sm",
    lg: "h-11 px-4 text-sm",
  }[size];

  // 1. VARIANTE HEADER: Selector compacto tipo píldora para cabeceras y barras de filtro
  if (variant === "header") {
    return (
      <div
        ref={containerRef}
        className={`relative inline-block text-left min-w-0 ${className}`}
        onKeyDown={handleKeyDown}
      >
        {name && (
          <input
            type="hidden"
            name={name}
            value={value !== undefined && value !== null ? String(value) : ""}
            required={required}
          />
        )}
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || placeholder}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer max-w-[160px] sm:max-w-[260px] active:scale-[0.98] select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            size={13}
            className={`text-zinc-400 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-500" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="absolute top-full left-0 mt-2 z-50 w-72 max-w-[calc(100vw-32px)] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {headerTitle && (
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between select-none">
                <span>{headerTitle}</span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {options.length} disp.
                </span>
              </div>
            )}

            {searchable && (
              <div className="p-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur z-10">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    className="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-lg pl-7 pr-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1 space-y-1 overscroll-contain">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 select-none ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : isHighlighted
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {opt.isActive !== undefined && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                opt.isActive
                                  ? "bg-emerald-500"
                                  : "bg-zinc-400"
                              }`}
                            />
                          )}
                          <span className="text-xs font-semibold truncate block text-zinc-900 dark:text-zinc-100">
                            {opt.label}
                          </span>
                        </div>

                        {opt.subtitle && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5 font-medium truncate">
                            {opt.subtitle}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {actionButton && (
              <div className="pt-1.5 mt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown();
                    actionButton.onClick?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors select-none"
                >
                  {actionButton.icon ? (
                    <actionButton.icon size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>{actionButton.label}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. VARIANTE FORM: Para formularios, modales y ajustes
  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={value !== undefined && value !== null ? String(value) : ""}
          required={required}
        />
      )}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 border ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
        } rounded-xl ${sizeClasses} text-zinc-900 dark:text-zinc-100 transition-all focus:outline-none focus:ring-2 active:scale-[0.99] select-none shadow-xs ${
          disabled ? "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon
              size={14}
              className="text-zinc-400 shrink-0"
            />
          )}
          <span
            className={`truncate ${
              !selectedOption
                ? "text-zinc-400 dark:text-zinc-500"
                : "font-medium"
            }`}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150 overscroll-contain"
        >
          {headerTitle && (
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between select-none">
              <span>{headerTitle}</span>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {options.length} disp.
              </span>
            </div>
          )}

          {searchable && (
            <div className="p-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur z-10">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-lg pl-8 pr-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-0.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 select-none ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20"
                          : isHighlighted
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon && (
                          <opt.icon
                            size={14}
                            className="text-zinc-400 shrink-0"
                          />
                        )}
                        <span className="truncate block font-medium">
                          {opt.label}
                        </span>
                      </div>
                      {opt.subtitle && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5 truncate font-normal">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        size={14}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {actionButton && (
            <div className="pt-1.5 mt-1 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  closeDropdown();
                  actionButton.onClick?.();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors select-none"
              >
                {actionButton.icon ? (
                  <actionButton.icon size={14} />
                ) : (
                  <Plus size={14} />
                )}
                <span>{actionButton.label}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
