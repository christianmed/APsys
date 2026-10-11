"use server";

import { revalidatePath } from "next/cache";
import {
  validarVariablesPlantilla,
  type TipoPlantilla,
} from "@/lib/notificaciones/plantillas";
import { createClient } from "@/lib/supabase/server";

export type GuardarPlantillaResultado = {
  ok: boolean;
  error?: string;
};

/**
 * Server Action para guardar o actualizar una plantilla de mensaje (RF-10 / T-017).
 * Requiere perfil gerencial según las políticas RLS de `public.plantillas` (0002_rls.sql).
 */
export async function guardarPlantilla(
  tipo: TipoPlantilla,
  contenido: string,
): Promise<GuardarPlantillaResultado> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Debe iniciar sesión para guardar plantillas." };
  }

  // Verificar perfil gerencial
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "gerencial") {
    return {
      ok: false,
      error:
        "Solo los usuarios con perfil gerencial pueden modificar plantillas de mensajes (RF-10).",
    };
  }

  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio) {
    return {
      ok: false,
      error: "El contenido de la plantilla no puede estar vacío.",
    };
  }

  // Validar variables
  const validacion = validarVariablesPlantilla(contenidoLimpio);
  if (!validacion.valido) {
    return {
      ok: false,
      error: `La plantilla contiene variables no reconocidas: ${validacion.variablesDesconocidas.join(", ")}.`,
    };
  }

  // Guardar en base de datos con upsert
  const { error: errorUpsert } = await supabase
    .from("plantillas")
    .upsert(
      {
        tipo,
        contenido: contenidoLimpio,
      },
      { onConflict: "tipo" },
    );

  if (errorUpsert) {
    return {
      ok: false,
      error: errorUpsert.message || "Error al guardar la plantilla en la base de datos.",
    };
  }

  revalidatePath("/plantillas");
  revalidatePath("/pedidos");
  revalidatePath("/recordatorios");

  return { ok: true };
}
