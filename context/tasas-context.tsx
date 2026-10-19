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
  obtenerFechaYmdCaracas,
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

      // 1. Resolver Tasa USD Hoy con regla estricta de corte a las 12:00 a. m.
      // - Si estamos en la ventana de la tarde (4:00 PM - 11:59 PM), el operador tiene la opción de aplicar la tasa manualmente.
      // - Pasadas las 12:00 a. m. (inicio de la nueva jornada comercial en Caracas), la tasa oficial emitida por el BCV para hoy
      //   es obligatoria. Si la BD tiene una tasa anterior o menor (el operador no la actualizó antes de las 11:59 PM),
      //   el sistema auto-adopta bcvUsdHoy de inmediato en memoria y dispara auto-persistencia en BD.
      const ymdCaracasHoy = obtenerFechaYmdCaracas(new Date());
      const bcvUsdHoy = bcvRes?.hoy?.usd ? Number(bcvRes.hoy.usd) : undefined;
      const bdUsdHoy = vigenteRes?.data?.valor_bs_por_usd ? Number(vigenteRes.data.valor_bs_por_usd) : undefined;
      const bdVigenteDesde = vigenteRes?.data?.vigente_desde;
      const bdYmd = bdVigenteDesde ? obtenerFechaYmdCaracas(bdVigenteDesde) : undefined;

      const requiereAutoSync =
        Boolean(bcvUsdHoy && bcvUsdHoy > 0) &&
        (!bdUsdHoy ||
          bdUsdHoy === TASA_POR_DEFECTO ||
          (bcvUsdHoy && bdUsdHoy && bcvUsdHoy > bdUsdHoy) ||
          (bcvRes?.hoy?.fecha === ymdCaracasHoy && bdYmd && bdYmd < ymdCaracasHoy));

      if (requiereAutoSync && bcvUsdHoy) {
        setTasaUsd(bcvUsdHoy);
        if (typeof window !== "undefined") {
          void fetch("/api/tasas/auto-sync", { method: "POST" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => {});
        }
      } else if (bdUsdHoy && bdUsdHoy > 0 && bdUsdHoy !== TASA_POR_DEFECTO) {
        setTasaUsd(bdUsdHoy);
      } else if (bcvUsdHoy && bcvUsdHoy > 0) {
        setTasaUsd(bcvUsdHoy);
      } else if (bdUsdHoy && bdUsdHoy > 0) {
        setTasaUsd(bdUsdHoy);
      }

      // 2. Resolver Tasa USD Mañana:
      // Si existe tasa programada en BD, se usa. Si no, se toma la tasa oficial del día siguiente
      // emitida en vivo por el BCV (bcvRes.siguiente.usd) para activar el acordeón en amarillo automáticamente.
      const bcvUsdSiguiente = bcvRes?.siguiente?.usd ? Number(bcvRes.siguiente.usd) : undefined;
      const bdUsdSiguiente = programadaRes?.data?.valor_bs_por_usd ? Number(programadaRes.data.valor_bs_por_usd) : undefined;

      if (bdUsdSiguiente && bdUsdSiguiente > 0) {
        setTasaSiguiente(bdUsdSiguiente);
      } else if (bcvUsdSiguiente && bcvUsdSiguiente > 0) {
        setTasaSiguiente(bcvUsdSiguiente);
      } else {
        setTasaSiguiente(undefined);
      }

      // 3. Resolver Tasa EUR Hoy
      if (bcvRes?.hoy?.eur) {
        setTasaEur(Number(bcvRes.hoy.eur));
      } else if (bcvRes?.tasas?.eur?.valorBs) {
        setTasaEur(Number(bcvRes.tasas.eur.valorBs));
      }

      // 4. Resolver Tasa EUR Mañana
      if (bcvRes?.siguiente?.eur) {
        setTasaEurSiguiente(Number(bcvRes.siguiente.eur));
      } else {
        setTasaEurSiguiente(undefined);
      }

      // 5. Fechas descriptivas emitidas por el BCV
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
