"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  calcularConversionBsUsd,
  calcularConversionUsdBs,
} from "@/lib/tasas/tasas";

export interface TasasData {
  tasaUsd: number;
  tasaEur?: number;
  tasaSiguiente?: number;
}

export interface TasasContextType {
  tasaUsd: number;
  tasaEur?: number;
  tasaSiguiente?: number;
  isLoading: boolean;
  convertirUsdABs: (montoUsd: number) => number;
  convertirBsAUsd: (montoBs: number) => number;
  refrescarTasas: () => Promise<void>;
}

export interface TasasProviderProps {
  children: React.ReactNode;
  initialTasas?: Partial<TasasData>;
}

const TasasContext = createContext<TasasContextType | undefined>(undefined);

const TASA_POR_DEFECTO = 40.0;

/**
 * Proveedor de contexto para tasas de cambio y conversiones multimoneda en cliente.
 * Almacena las tasas en memoria RAM para permitir conversiones matemáticas y renderizado
 * instantáneo (0ms) en el Sidebar, Header y formularios.
 */
export function TasasProvider({ children, initialTasas }: TasasProviderProps) {
  const [tasaUsd, setTasaUsd] = useState<number>(
    initialTasas?.tasaUsd ?? TASA_POR_DEFECTO,
  );
  const [tasaEur] = useState<number | undefined>(
    initialTasas?.tasaEur,
  );
  const [tasaSiguiente, setTasaSiguiente] = useState<number | undefined>(
    initialTasas?.tasaSiguiente,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialTasas?.tasaUsd);

  const refrescarTasas = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const ahoraIso = new Date().toISOString();

      const [vigenteRes, programadaRes] = await Promise.all([
        supabase
          .from("tasas_cambio")
          .select("valor_bs_por_usd")
          .lte("vigente_desde", ahoraIso)
          .order("vigente_desde", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tasas_cambio")
          .select("valor_bs_por_usd")
          .gt("vigente_desde", ahoraIso)
          .order("vigente_desde", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (vigenteRes?.data?.valor_bs_por_usd) {
        setTasaUsd(Number(vigenteRes.data.valor_bs_por_usd));
      }

      if (programadaRes?.data?.valor_bs_por_usd) {
        setTasaSiguiente(Number(programadaRes.data.valor_bs_por_usd));
      } else {
        setTasaSiguiente(undefined);
      }
    } catch (err) {
      console.warn("No se pudieron refrescar las tasas desde Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialTasas?.tasaUsd) {
      let activo = true;
      Promise.resolve().then(() => {
        if (activo) {
          void refrescarTasas();
        }
      });
      return () => {
        activo = false;
      };
    }
  }, [initialTasas?.tasaUsd, refrescarTasas]);

  const convertirUsdABs = useCallback(
    (montoUsd: number) => {
      return calcularConversionBsUsd(montoUsd, tasaUsd);
    },
    [tasaUsd],
  );

  const convertirBsAUsd = useCallback(
    (montoBs: number) => {
      return calcularConversionUsdBs(montoBs, tasaUsd);
    },
    [tasaUsd],
  );

  const contextValue = useMemo<TasasContextType>(
    () => ({
      tasaUsd,
      tasaEur,
      tasaSiguiente,
      isLoading,
      convertirUsdABs,
      convertirBsAUsd,
      refrescarTasas,
    }),
    [
      tasaUsd,
      tasaEur,
      tasaSiguiente,
      isLoading,
      convertirUsdABs,
      convertirBsAUsd,
      refrescarTasas,
    ],
  );

  return (
    <TasasContext.Provider value={contextValue}>
      {children}
    </TasasContext.Provider>
  );
}

/**
 * Hook para acceder a las tasas del sistema y funciones de conversión instantánea
 * en cualquier componente sin latencia de red.
 */
export function useTasas(): TasasContextType {
  const context = useContext(TasasContext);
  if (!context) {
    throw new Error("useTasas debe ser utilizado dentro de un TasasProvider");
  }
  return context;
}
