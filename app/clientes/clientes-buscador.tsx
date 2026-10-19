"use client";

import { Search, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Props = {
  valorInicial?: string;
};

/**
 * Buscador reactivo para el directorio de clientes con atajo de teclado '/' (T-012b).
 * Mantiene la misma consistencia visual y de interacción que el buscador de pedidos.
 */
export function ClientesBuscador({ valorInicial = "" }: Props) {
  const router = useRouter();
  const [termino, setTermino] = useState(valorInicial);
  const [prevValorInicial, setPrevValorInicial] = useState(valorInicial);
  const [pendiente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (valorInicial !== prevValorInicial) {
    setPrevValorInicial(valorInicial);
    setTermino(valorInicial);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const ejecutarBusqueda = (valor: string) => {
    const limpio = valor.trim();
    startTransition(() => {
      if (limpio === "") {
        router.push("/clientes");
      } else {
        router.push(`/clientes?q=${encodeURIComponent(limpio)}`);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarBusqueda(termino);
  };

  const limpiarBusqueda = () => {
    setTermino("");
    inputRef.current?.focus();
    startTransition(() => {
      router.push("/clientes");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 flex items-center text-zinc-400">
          <UserCheck className="size-4" />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar cliente por nombre o teléfono... (Atajo: /)"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-20 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:ring-2 focus:ring-[#7aa2f7]/20 focus:outline-none dark:border-[#24283b] dark:bg-[#1a1b26] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {termino ? (
            <button
              type="button"
              onClick={limpiarBusqueda}
              aria-label="Limpiar búsqueda"
              className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#1f202c] dark:hover:text-[#f8fafc]"
            >
              <X className="size-3.5" />
            </button>
          ) : null}

          <button
            type="submit"
            disabled={pendiente}
            aria-label="Buscar cliente"
            className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc] dark:hover:bg-[#252b42]"
          >
            <Search className="size-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
