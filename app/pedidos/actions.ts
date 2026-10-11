"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validarDatosPedido,
  type ItemPedidoEntrada,
  type PedidoEntrada,
} from "./validaciones";

export type EstadoFormularioPedido = {
  errores?: Record<string, string>;
  valores?: {
    cliente_id?: string;
    notas?: string | null;
    items?: ItemPedidoEntrada[];
  };
};

/**
 * Registra un pedido con sus ítems (RF-01 / T-008).
 * Inserta la cabecera en `pedidos` y los renglones correspondientes en `pedido_items`.
 */
export async function crearPedido(
  _prev: EstadoFormularioPedido,
  formData: FormData,
): Promise<EstadoFormularioPedido> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cliente_id = String(formData.get("cliente_id") ?? "");
  const notas = String(formData.get("notas") ?? "");
  const itemsJson = String(formData.get("items_json") ?? "[]");

  let itemsParsed: ItemPedidoEntrada[] = [];
  try {
    itemsParsed = JSON.parse(itemsJson);
  } catch {
    return {
      errores: { general: "El formato de los servicios o ítems es inválido." },
    };
  }

  const entrada: PedidoEntrada = {
    cliente_id,
    notas,
    items: itemsParsed,
  };

  const { errores, datos } = validarDatosPedido(entrada);
  if (Object.keys(errores).length > 0) {
    return {
      errores,
      valores: {
        cliente_id,
        notas,
        items: itemsParsed,
      },
    };
  }

  // Obtener el siguiente número de orden correlativo (T-010 lo formaliza con lock/secuencia)
  const { data: ultimoPedido } = await supabase
    .from("pedidos")
    .select("numero_orden")
    .order("numero_orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const siguienteNumero = (ultimoPedido?.numero_orden ?? 1000) + 1;

  // Insertar cabecera de pedido
  const { data: pedidoCreado, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: datos.cliente_id,
      numero_orden: siguienteNumero,
      total_usd: datos.total_usd,
      notas: datos.notas,
      estado: "recibido",
    })
    .select("id, numero_orden")
    .single();

  if (errorPedido || !pedidoCreado) {
    return {
      errores: {
        general:
          "No se pudo registrar la orden del pedido. Intenta nuevamente.",
      },
      valores: {
        cliente_id,
        notas,
        items: itemsParsed,
      },
    };
  }

  // Insertar renglones de pedido_items
  const renglones = datos.items.map((item) => ({
    pedido_id: pedidoCreado.id,
    servicio_id: item.servicio_id,
    descripcion: item.descripcion,
    dimensiones: item.dimensiones,
    acabados: item.acabados,
    cantidad: item.cantidad,
    precio_usd: item.precio_usd,
  }));

  const { error: errorItems } = await supabase
    .from("pedido_items")
    .insert(renglones);

  if (errorItems) {
    // Reversión simple si falla la inserción de ítems para no dejar cabeceras huérfanas
    await supabase.from("pedidos").delete().eq("id", pedidoCreado.id);
    return {
      errores: {
        general:
          "Ocurrió un error al guardar los ítems del pedido. Se canceló la creación.",
      },
      valores: {
        cliente_id,
        notas,
        items: itemsParsed,
      },
    };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}
