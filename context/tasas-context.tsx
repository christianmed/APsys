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
  tasaEurSiguiente?: number;
  fechaHoy?: string;
  fechaSiguiente?: string;
}

export interface TasasContextType {
  tasaUsd: number;
  tasaEur?: number;
  tasaSiguiente?: number;
  tasaEurSiguiente?: number;
  fechaHoy?: string;
  fechaSiguiente?: string;
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
  const [tasaEur, setTasaEur] = useState<number | undefined>(
    initialTasas?.tasaEur,
  );
  const [tasaSiguiente, setTasaSiguiente] = useState<number | undefined>(
    initialTasas?.tasaSiguiente,
  );
  const [tasaEurSiguiente, setTasaEurSiguiente] = useState<number | undefined>(
    initialTasas?.tasaEurSiguiente,
  );
  const [fechaHoy, setFechaHoy] = useState<string | undefined>(
    initialTasas?.fechaHoy,
  );
  const [fechaSiguiente, setFechaSiguiente] = useState<string | undefined>(
    initialTasas?.fechaSiguiente,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialTasas?.tasaUsd);

  const refrescarTasas = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const ahoraIso = new Date().toISOString();

      const [vigenteRes, programadaRes, bcvRes] = await Promise.all([
        supabase
          .from("tasas_cambio")
          .select("valor_bs_por_usd, vigente_desde")
          .lte("vigente_desde", ahoraIso)
          .order("vigente_desde", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tasas_cambio")
          .select("valor_bs_por_usd, vigente_desde")
          .gt("vigente_desde", ahoraIso)
          .order("vigente_desde", { ascending: true })
          .limit(1)
          .maybeSingle(),
        typeof window !== "undefined"
          ? fetch("/api/tasas/en-vivo")
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          : Promise.resolve(null),
      ]);

      if (vigenteRes?.data?.valor_bs_por_usd) {
        setTasaUsd(Number(vigenteRes.data.valor_bs_por_usd));
      }

      if (programadaRes?.data?.valor_bs_por_usd) {
        setTasaSiguiente(Number(programadaRes.data.valor_bs_por_usd));
      } else {
        setTasaSiguiente(undefined);
      }

      if (bcvRes?.hoy?.eur) {
        setTasaEur(Number(bcvRes.hoy.eur));
      } else if (bcvRes?.tasas?.eur?.valorBs) {
        setTasaEur(Number(bcvRes.tasas.eur.valorBs));
      }

      if (bcvRes?.siguiente?.eur) {
        setTasaEurSiguiente(Number(bcvRes.siguiente.eur));
      } else {
        setTasaEurSiguiente(undefined);
      }

      if (bcvRes?.hoy?.fecha) {
        setFechaHoy(bcvRes.hoy.fecha);
      }
      if (bcvRes?.siguiente?.fecha) {
        setFechaSiguiente(bcvRes.siguiente.fecha);
      }
    } catch (err) {
      console.warn("No se pudieron refrescar las tasas:", err);
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

  // Suscripción en tiempo real: cuando se actualiza o inserta una tasa en Supabase,
  // el contexto en memoria (Sidebar, Header y conversores) se refresca automáticamente.
  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const canal = supabase
        .channel("tasas-cambio-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasas_cambio",
          },
          () => {
            void refrescarTasas();
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(canal);
      };
    } catch {
      // Ignorar en entornos sin soporte de WebSockets (ej. jsdom)
    }
  }, [refrescarTasas]);

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
      tasaEurSiguiente,
      fechaHoy,
      fechaSiguiente,
      isLoading,
      convertirUsdABs,
      convertirBsAUsd,
      refrescarTasas,
    }),
    [
      tasaUsd,
      tasaEur,
      tasaSiguiente,
      tasaEurSiguiente,
      fechaHoy,
      fechaSiguiente,
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
