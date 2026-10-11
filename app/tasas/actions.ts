"use server";

import { revalidatePath } from "next/cache";
import {
  obtenerTasaBcv,
  obtenerTasasBcvCompletas,
  type TasasBcvCompletas,
} from "@/lib/tasas/bcv-service";
import {
  calcularVigenciaDesdeFechaBcv,
  esTasaBcvFutura,
} from "@/lib/tasas/tasas";
import { createClient } from "@/lib/supabase/server";

export type EstadoSincronizacionBcv = {
  exito?: boolean;
  mensaje?: string;
  error?: string;
  valorSincronizado?: number;
};

/**
 * Sincroniza la tasa BCV oficial desde la API de DolarApi y la registra
 * automáticamente en la base de datos como nueva vigencia.
 *
 * Solo disponible para el perfil gerencial.
 */
export async function sincronizarTasaBcv(): Promise<EstadoSincronizacionBcv> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debe iniciar sesión para realizar esta acción." };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "gerencial") {
    return {
      error:
        "Solo los usuarios con perfil gerencial pueden sincronizar la tasa BCV.",
    };
  }

  // Consultar la API oficial (forzando refresco para traer el dato más reciente)
  const tasaBcv = await obtenerTasaBcv("USD", { forzarRefresco: true });

  if (!tasaBcv) {
    return {
      error:
        "No se pudo obtener la tasa desde la API del BCV. Intente nuevamente en unos minutos o ingrese la tasa manualmente.",
    };
  }

  // Redondear a 4 decimales (esquema: numeric(16, 4))
  const valorRedondeado = Math.round(tasaBcv.valorBs * 10000) / 10000;

  const esFutura = esTasaBcvFutura(tasaBcv.fechaActualizacion);
  const fechaVigencia = esFutura
    ? calcularVigenciaDesdeFechaBcv(tasaBcv.fechaActualizacion)
    : new Date().toISOString();

  // Verificar si ya existe una tasa registrada para esta misma fecha de vigencia
  const { data: tasaExistente } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd")
    .eq("vigente_desde", fechaVigencia)
    .maybeSingle();

  if (tasaExistente && Number(tasaExistente.valor_bs_por_usd) === valorRedondeado) {
    return {
      exito: true,
      mensaje: esFutura
        ? `La tasa oficial de mañana (${tasaBcv.fechaActualizacion}) ya está registrada: Bs. ${valorRedondeado.toFixed(4)} / USD.`
        : `La tasa oficial de hoy ya está al día: Bs. ${valorRedondeado.toFixed(4)} / USD.`,
      valorSincronizado: valorRedondeado,
    };
  }

  const { error: insertError } = await supabase.from("tasas_cambio").insert({
    valor_bs_por_usd: valorRedondeado,
    vigente_desde: fechaVigencia,
  });

  if (insertError) {
    console.error("[sincronizarTasaBcv] Error al insertar:", insertError);
    return {
      error: "Error al guardar la tasa sincronizada en la base de datos.",
    };
  }

  revalidatePath("/tasas");
  revalidatePath("/pedidos");
  revalidatePath("/pedidos/nuevo");
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");

  const mensaje = esFutura
    ? `Tasa BCV programada para mañana (${tasaBcv.fechaActualizacion}): Bs. ${valorRedondeado.toFixed(4)} / USD. Entrará en vigor automáticamente a las 00:00 (hora Caracas), manteniendo intacta la tasa de hoy.`
    : `Tasa BCV sincronizada para hoy: Bs. ${valorRedondeado.toFixed(4)} / USD.`;

  return {
    exito: true,
    mensaje,
    valorSincronizado: valorRedondeado,
  };
}

/**
 * Consulta en vivo las tasas BCV (USD y EUR) sin modificar la base de datos.
 * Se usa para mostrar información en tiempo real en la UI.
 */
export async function consultarTasasBcvEnVivo(): Promise<TasasBcvCompletas> {
  return obtenerTasasBcvCompletas({ forzarRefresco: true });
}
