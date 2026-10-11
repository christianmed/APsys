"use server";

import { revalidatePath } from "next/cache";
import { validarEntradaTasa } from "@/lib/tasas/tasas";
import { createClient } from "@/lib/supabase/server";

export type EstadoFormularioTasa = {
  exito?: boolean;
  mensaje?: string;
  error?: string;
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
