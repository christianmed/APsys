"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validarCobranzaInicial,
  type MonedaCobranza,
} from "./cobranza";
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
    abono_monto?: number | string;
    abono_moneda?: MonedaCobranza;
    abono_referencia?: string | null;
  };
};

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

/**
 * Obtiene la tasa de cambio vigente (más reciente por `vigente_desde`).
 * Si aún no se ha configurado ninguna fila en la base de datos, retorna una
 * tasa referencial base (40.00 Bs./USD).
 */
export async function obtenerTasaVigente(supabase: SupabaseServidor): Promise<{
  id: string | null;
  valor_bs_por_usd: number;
}> {
  const { data: tasa } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd")
    .order("vigente_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tasa && Number(tasa.valor_bs_por_usd) > 0) {
    return {
      id: tasa.id,
      valor_bs_por_usd: Number(tasa.valor_bs_por_usd),
    };
  }

  return {
    id: null,
    valor_bs_por_usd: 40.0,
  };
}

/**
 * Registra un pedido con sus ítems y cobranza inicial (RF-01 / RF-02 / T-008 / T-009).
 * Inserta la cabecera en `pedidos`, los renglones en `pedido_items` y, si hubo abono,
 * la transacción en `pagos` con la tasa de cambio congelada.
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

  // Cobranza inicial
  const abonoMontoRaw = formData.get("abono_monto");
  const abonoMonedaRaw = String(formData.get("abono_moneda") ?? "USD");
  const abonoReferenciaRaw = formData.get("abono_referencia")
    ? String(formData.get("abono_referencia"))
    : null;

  const abonoMonto =
    abonoMontoRaw !== null && abonoMontoRaw !== ""
      ? Number(abonoMontoRaw)
      : 0;
  const abonoMoneda: MonedaCobranza =
    abonoMonedaRaw === "Bs" ? "Bs" : "USD";

  let itemsParsed: ItemPedidoEntrada[] = [];
  try {
    itemsParsed = JSON.parse(itemsJson);
  } catch {
    return {
      errores: { general: "El formato de los servicios o ítems es inválido." },
    };
  }

  const entradaPedido: PedidoEntrada = {
    cliente_id,
    notas,
    items: itemsParsed,
  };

  const { errores: erroresPedido, datos: datosPedido } =
    validarDatosPedido(entradaPedido);

  // Obtener tasa de cambio vigente
  const tasaVigente = await obtenerTasaVigente(supabase);

  // Validar cobranza inicial contra el total del pedido
  const { errores: erroresCobranza, datos: datosCobranza } =
    validarCobranzaInicial(
      datosPedido.total_usd,
      {
        monto: Number.isNaN(abonoMonto) ? 0 : abonoMonto,
        moneda: abonoMoneda,
        referencia: abonoReferenciaRaw,
      },
      tasaVigente.valor_bs_por_usd,
    );

  const todosErrores = { ...erroresPedido, ...erroresCobranza };

  if (Object.keys(todosErrores).length > 0) {
    return {
      errores: todosErrores,
      valores: {
        cliente_id,
        notas,
        items: itemsParsed,
        abono_monto: abonoMonto,
        abono_moneda: abonoMoneda,
        abono_referencia: abonoReferenciaRaw,
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

  // 1. Insertar cabecera de pedido
  const { data: pedidoCreado, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: datosPedido.cliente_id,
      numero_orden: siguienteNumero,
      total_usd: datosPedido.total_usd,
      tasa_id: tasaVigente.id,
      notas: datosPedido.notas,
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
        abono_monto: abonoMonto,
        abono_moneda: abonoMoneda,
        abono_referencia: abonoReferenciaRaw,
      },
    };
  }

  // 2. Insertar renglones de pedido_items
  const renglones = datosPedido.items.map((item) => ({
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
    // Reversión: limpiar cabecera creada
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
        abono_monto: abonoMonto,
        abono_moneda: abonoMoneda,
        abono_referencia: abonoReferenciaRaw,
      },
    };
  }

  // 3. Insertar abono inicial en `pagos` si aplica (RF-02)
  if (datosCobranza.tieneAbono) {
    const { error: errorPago } = await supabase.from("pagos").insert({
      pedido_id: pedidoCreado.id,
      monto: datosCobranza.monto,
      moneda: datosCobranza.moneda,
      referencia: datosCobranza.referencia,
      tasa_id: tasaVigente.id,
    });

    if (errorPago) {
      // Reversión: limpiar ítems y pedido
      await supabase
        .from("pedido_items")
        .delete()
        .eq("pedido_id", pedidoCreado.id);
      await supabase.from("pedidos").delete().eq("id", pedidoCreado.id);
      return {
        errores: {
          general:
            "Ocurrió un error al registrar el abono inicial. Se canceló la creación del pedido.",
        },
        valores: {
          cliente_id,
          notas,
          items: itemsParsed,
          abono_monto: abonoMonto,
          abono_moneda: abonoMoneda,
          abono_referencia: abonoReferenciaRaw,
        },
      };
    }
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}
