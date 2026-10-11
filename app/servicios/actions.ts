"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarDatosServicio } from "./validaciones";

/**
 * Estado que las acciones del catálogo de servicios devuelven al formulario
 * (patrón useActionState): errores por campo y valores para repintarlo.
 */
export type EstadoFormularioServicio = {
  errores?: Record<string, string>;
  valores?: { nombre?: string; orden?: string | number };
};

/** Cliente de Supabase del servidor, derivado de `createClient`. */
type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

/**
 * ¿El usuario tiene perfil gerencial? Solo gerencial administra el catálogo
 * (RLS de `servicios`); la consulta a `perfiles` lee la propia fila.
 */
async function esGerencial(
  supabase: SupabaseServidor,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", userId)
    .maybeSingle();

  return data?.rol === "gerencial";
}

/**
 * Alta de servicio (RF-04). Solo el perfil gerencial puede ejecutarla; valida
 * los datos y trata el choque de nombre único (23505) como error de campo.
 */
export async function crearServicio(
  _prev: EstadoFormularioServicio,
  formData: FormData,
): Promise<EstadoFormularioServicio> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await esGerencial(supabase, user.id))) {
    return {
      errores: {
        general: "Solo el perfil gerencial puede administrar el catálogo.",
      },
    };
  }

  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    orden: String(formData.get("orden") ?? ""),
  };

  const { errores, datos } = validarDatosServicio(valores);
  if (Object.keys(errores).length > 0) {
    return { errores, valores };
  }

  const { error } = await supabase.from("servicios").insert({
    nombre: datos.nombre,
    orden: datos.orden,
    activo: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        errores: { nombre: "Ya existe un servicio con ese nombre." },
        valores,
      };
    }

    return {
      errores: { general: "No se pudo guardar el servicio. Intenta de nuevo." },
      valores,
    };
  }

  revalidatePath("/servicios");
  redirect("/servicios");
}

/**
 * Edición de servicio (RF-04). Misma guarda de rol y validación que el alta;
 * `activo` se toma del checkbox del formulario.
 */
export async function actualizarServicio(
  id: string,
  _prev: EstadoFormularioServicio,
  formData: FormData,
): Promise<EstadoFormularioServicio> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await esGerencial(supabase, user.id))) {
    return {
      errores: {
        general: "Solo el perfil gerencial puede administrar el catálogo.",
      },
    };
  }

  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    orden: String(formData.get("orden") ?? ""),
  };

  const { errores, datos } = validarDatosServicio(valores);
  if (Object.keys(errores).length > 0) {
    return { errores, valores };
  }

  const { error } = await supabase
    .from("servicios")
    .update({
      nombre: datos.nombre,
      orden: datos.orden,
      activo: formData.get("activo") === "on",
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        errores: { nombre: "Ya existe un servicio con ese nombre." },
        valores,
      };
    }

    return {
      errores: { general: "No se pudo guardar el servicio. Intenta de nuevo." },
      valores,
    };
  }

  revalidatePath("/servicios");
  redirect("/servicios");
}
