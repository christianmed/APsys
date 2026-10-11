"use server";

import { revalidatePath } from "next/cache";
import { validarEntradaTasa } from "@/lib/tasas/tasas";
import {
  obtenerTasaBcv,
  obtenerTasasBcvCompletas,
  type TasasBcvCompletas,
} from "@/lib/tasas/bcv-service";
import { createClient } from "@/lib/supabase/server";

export type EstadoFormularioTasa = {
  exito?: boolean;
  mensaje?: string;
  error?: string;
};

export type EstadoSincronizacionBcv = {
  exito?: boolean;
  mensaje?: string;
  error?: string;
  valorSincronizado?: number;
};

/**
 * Registra una nueva tasa de cambio referencial (RF-15 / T-023).
 * Solo el perfil gerencial tiene permiso para modificar la tasa (RLS: tasas_cambio_escritura_gerencial).
 */
export async function registrarNuevaTasa(
  _prevState: EstadoFormularioTasa,
  formData: FormData,
): Promise<EstadoFormularioTasa> {
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
        "Solo los usuarios con perfil gerencial pueden actualizar la tasa de cambio referencial (RF-15 / RF-18).",
    };
  }

  const valorRaw = formData.get("valor");
  const fechaVigenciaRaw = formData.get("vigente_desde");

  const validacion = validarEntradaTasa(valorRaw);
  if (!validacion.valido || !validacion.valor) {
    return { error: validacion.error ?? "Valor de tasa no válido." };
  }

  let vigenteDesde = new Date().toISOString();
  if (fechaVigenciaRaw && typeof fechaVigenciaRaw === "string" && fechaVigenciaRaw.trim()) {
    const d = new Date(fechaVigenciaRaw);
    if (!isNaN(d.getTime())) {
      vigenteDesde = d.toISOString();
    }
  }

  const { error: insertError } = await supabase.from("tasas_cambio").insert({
    valor_bs_por_usd: validacion.valor,
    vigente_desde: vigenteDesde,
  });

  if (insertError) {
    console.error("Error al registrar nueva tasa de cambio:", insertError);
    return {
      error: "Ocurrió un error al guardar la nueva tasa en la base de datos.",
    };
  }

  revalidatePath("/tasas");
  revalidatePath("/pedidos");
  revalidatePath("/pedidos/nuevo");
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");

  return {
    exito: true,
    mensaje: `Tasa referencial de Bs. ${validacion.valor.toFixed(4)} registrada exitosamente. Los nuevos pedidos usarán esta tasa.`,
  };
}

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

  // Consultar la API oficial
  const tasaBcv = await obtenerTasaBcv("USD");

  if (!tasaBcv) {
    return {
      error:
        "No se pudo obtener la tasa desde la API del BCV. Intente nuevamente en unos minutos o ingrese la tasa manualmente.",
    };
  }

  // Redondear a 4 decimales (esquema: numeric(16, 4))
  const valorRedondeado = Math.round(tasaBcv.valorBs * 10000) / 10000;

  const { error: insertError } = await supabase.from("tasas_cambio").insert({
    valor_bs_por_usd: valorRedondeado,
    vigente_desde: new Date().toISOString(),
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

  return {
    exito: true,
    mensaje: `Tasa BCV sincronizada: Bs. ${valorRedondeado.toFixed(4)} / USD (fuente: ${tasaBcv.fuente}, actualizada: ${new Date(tasaBcv.fechaActualizacion).toLocaleDateString("es-VE")}).`,
    valorSincronizado: valorRedondeado,
  };
}

/**
 * Consulta en vivo las tasas BCV (USD y EUR) sin modificar la base de datos.
 * Se usa para mostrar información en tiempo real en la UI.
 */
export async function consultarTasasBcvEnVivo(): Promise<TasasBcvCompletas> {
  return obtenerTasasBcvCompletas();
}
