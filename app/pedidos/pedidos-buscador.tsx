"use client";

import { ScanBarcode, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  valorInicial?: string;
};

/**
 * Buscador reactivo para recepción y taller con soporte para escáner USB (RF-06 / T-012b).
 * Captura entradas de teclado de lectores ópticos/láser (HID keyboard wedge)
 * y ejecuta la búsqueda instantánea al recibir 'Enter' en < 2 segundos.
 */
export function PedidosBuscador({ valorInicial = "" }: Props) {
  const router = useRouter();
  const [termino, setTermino] = useState(valorInicial);
  const [prevValorInicial, setPrevValorInicial] = useState(valorInicial);
  const [pendiente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado cuando cambia el prop valorInicial durante la navegación
  if (valorInicial !== prevValorInicial) {
    setPrevValorInicial(valorInicial);
    setTermino(valorInicial);
  }

  // Atajo de teclado: si el usuario presiona '/' o escanea mientras está en la página,
  // se enfoca automáticamente el campo de búsqueda.
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
        router.push("/pedidos");
      } else {
        router.push(`/pedidos?q=${encodeURIComponent(limpio)}`);
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
      router.push("/pedidos");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          icon={ScanBarcode}
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar por N° orden (#1001), cliente o escanear comanda... (Atajo: /)"
          className="pr-20 text-sm"
          sizeVariant="lg"
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
            aria-label="Buscar pedido"
            className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc] dark:hover:bg-[#252b42]"
          >
            <Search className="size-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
