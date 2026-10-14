'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Search } from 'lucide-react';

/**
 * CustomSelect - Componente desplegable personalizado y accesible.
 * Reemplaza selectores nativos eliminando inconsistencias entre Android, iOS y Windows.
 * 
 * @param {Object} props
 * @param {Array} props.options - [{ value, label, subtitle, status, isActive, icon }]
 * @param {string|number} props.value - Valor actualmente seleccionado
 * @param {Function} props.onChange - Callback (value) => void
 * @param {string} [props.variant='form'] - 'header' | 'form'
 * @param {string} [props.headerTitle] - Encabezado interno del menú (ej. 'MIS RIFAS')
 * @param {string} [props.placeholder='Seleccionar...']
 * @param {Object} [props.actionButton] - { label, icon: Icon, onClick }
 * @param {string} [props.className] - Clases adicionales del contenedor
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  variant = 'form',
  headerTitle,
  placeholder = 'Seleccionar...',
  searchable = false,
  actionButton,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || null;

  // Cierre automático al hacer clic afuera (Click Outside) o presionar Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
    setSearchQuery('');
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  // 1. VARIANTE HEADER: Selector compacto tipo píldora para cabeceras
  if (variant === 'header') {
    return (
      <div ref={containerRef} className={`relative inline-block text-left min-w-0 ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer max-w-[145px] xs:max-w-[190px] sm:max-w-[240px] active:scale-98 select-none"
        >
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            size={13}
            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 w-72 max-w-[calc(100vw-32px)] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
            {headerTitle && (
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between select-none">
                <span>{headerTitle}</span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {options.length} disp.
                </span>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1 space-y-1 overscroll-contain">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 select-none ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {opt.isActive !== undefined && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              opt.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        )}
                        <span className="text-xs font-bold truncate block text-slate-900 dark:text-white">
                          {opt.label}
                        </span>
                      </div>

                      {opt.subtitle && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium truncate">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>

            {actionButton && (
              <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    actionButton.onClick?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors select-none"
                >
                  <Plus size={14} />
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
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full h-[34px] flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white transition-all focus:outline-none focus:border-emerald-500 active:scale-98 select-none"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <selectedOption.icon size={14} className="text-slate-400 shrink-0" />}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150 overscroll-contain">
          {searchable && (
            <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {options
            .filter((opt) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                String(opt.label).toLowerCase().includes(q) ||
                (opt.subtitle && String(opt.subtitle).toLowerCase().includes(q))
              );
            })
            .map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 select-none ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <opt.icon size={14} className="text-slate-400 shrink-0" />}
                    <span className="truncate block font-semibold">{opt.label}</span>
                  </div>
                  {opt.subtitle && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate font-normal">
                      {opt.subtitle}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
