"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarDatosCliente } from "./validaciones";

/**
 * Estado que las acciones de clientes devuelven al formulario
 * (patrón useActionState): errores por campo, aviso de teléfono duplicado
 * y valores para repintar el formulario.
 */
export type EstadoFormularioCliente = {
  errores?: Record<string, string>;
  avisoDuplicado?: string;
  valores?: { nombre?: string; telefono?: string | null; notas?: string | null };
};

/**
 * Alta de cliente (RF-01). Valida los datos y, si el teléfono ya existe en
 * otro cliente, pide confirmación (`confirmar=1`) antes de guardar.
 */
export async function crearCliente(
  _prev: EstadoFormularioCliente,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  };

  const { errores, datos } = validarDatosCliente(valores);
  if (Object.keys(errores).length > 0) {
    return { errores, valores };
  }

  if (datos.telefono) {
    const { data: existentes } = await supabase
      .from("clientes")
      .select("id,nombre")
      .eq("telefono", datos.telefono)
      .limit(1);

    const duplicado = existentes?.[0];

    if (duplicado && formData.get("confirmar") !== "1") {
      return {
        avisoDuplicado: `Ya existe un cliente con ese teléfono: ${duplicado.nombre}. ¿Guardar de todas formas?`,
        valores,
      };
    }
  }

  const { error } = await supabase.from("clientes").insert({
    nombre: datos.nombre,
    telefono: datos.telefono,
    notas: datos.notas,
  });

  if (error) {
    return {
      errores: { general: "No se pudo guardar el cliente. Intenta de nuevo." },
      valores,
    };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

/**
 * Edición de cliente (RF-01). La búsqueda de teléfono duplicado excluye el
 * propio registro (`neq id`) y también pide confirmación antes de guardar.
 */
export async function actualizarCliente(
  id: string,
  _prev: EstadoFormularioCliente,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  };

  const { errores, datos } = validarDatosCliente(valores);
  if (Object.keys(errores).length > 0) {
    return { errores, valores };
  }

  if (datos.telefono) {
    const { data: existentes } = await supabase
      .from("clientes")
      .select("id,nombre")
      .eq("telefono", datos.telefono)
      .neq("id", id)
      .limit(1);

    const duplicado = existentes?.[0];

    if (duplicado && formData.get("confirmar") !== "1") {
      return {
        avisoDuplicado: `Ya existe un cliente con ese teléfono: ${duplicado.nombre}. ¿Guardar de todas formas?`,
        valores,
      };
    }
  }

  const { error } = await supabase
    .from("clientes")
    .update({
      nombre: datos.nombre,
      telefono: datos.telefono,
      notas: datos.notas,
    })
    .eq("id", id);

  if (error) {
    return {
      errores: { general: "No se pudo guardar el cliente. Intenta de nuevo." },
      valores,
    };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}
