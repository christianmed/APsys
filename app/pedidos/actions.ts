"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validarCambioEstado,
  type EstadoPedido,
} from "@/lib/pedidos/estados";
import { validarMotivoAnulacion } from "@/lib/pedidos/anulacion";
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
    .lte("vigente_desde", new Date().toISOString())
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
 * Consulta la tasa de cambio programada en el futuro (si existe, p. ej. publicada por el BCV para mañana).
 */
export async function obtenerTasaProgramada(supabase: SupabaseServidor): Promise<{
  id: string | null;
  valor_bs_por_usd: number;
  vigente_desde: string;
} | null> {
  const { data: tasa } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd, vigente_desde")
    .gt("vigente_desde", new Date().toISOString())
    .order("vigente_desde", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (tasa && Number(tasa.valor_bs_por_usd) > 0) {
    return {
      id: tasa.id,
      valor_bs_por_usd: Number(tasa.valor_bs_por_usd),
      vigente_desde: tasa.vigente_desde,
    };
  }

  return null;
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

  // Obtener tasa de cambio (permite elegir tasa programada para presupuestos de mañana)
  const tasaIdSeleccionada = (formData.get("tasa_id") as string | null) || null;
  let tasaParaPedido = await obtenerTasaVigente(supabase);

  if (tasaIdSeleccionada) {
    const { data: tasaEspecifica } = await supabase
      .from("tasas_cambio")
      .select("id, valor_bs_por_usd")
      .eq("id", tasaIdSeleccionada)
      .maybeSingle();

    if (tasaEspecifica && Number(tasaEspecifica.valor_bs_por_usd) > 0) {
      tasaParaPedido = {
        id: tasaEspecifica.id,
        valor_bs_por_usd: Number(tasaEspecifica.valor_bs_por_usd),
      };
    }
  }

  // Validar cobranza inicial contra el total del pedido
  const { errores: erroresCobranza, datos: datosCobranza } =
    validarCobranzaInicial(
      datosPedido.total_usd,
      {
        monto: Number.isNaN(abonoMonto) ? 0 : abonoMonto,
        moneda: abonoMoneda,
        referencia: abonoReferenciaRaw,
      },
      tasaParaPedido.valor_bs_por_usd,
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

  // Obtener número de orden secuencial sin huecos (RF-05 / T-010)
  const { data: numeroRpc } = await supabase.rpc("siguiente_numero_orden");

  let siguienteNumero = numeroRpc ? Number(numeroRpc) : null;
  if (!siguienteNumero) {
    const { data: ultimoPedido } = await supabase
      .from("pedidos")
      .select("numero_orden")
      .order("numero_orden", { ascending: false })
      .limit(1)
      .maybeSingle();

    siguienteNumero = (ultimoPedido?.numero_orden ?? 1000) + 1;
  }

  // 1. Insertar cabecera de pedido (estado inicial 'recibido' y marcas limpias)
  const { data: pedidoCreado, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: datosPedido.cliente_id,
      numero_orden: siguienteNumero,
      total_usd: datosPedido.total_usd,
      tasa_id: tasaParaPedido.id,
      notas: datosPedido.notas,
      estado: "recibido",
    })
    .select("id, numero_orden, estado, creado_en")
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
      tasa_id: tasaParaPedido.id,
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
  revalidatePath("/taller");
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");
  redirect("/pedidos");
}

/**
 * Cambia el estado de un pedido aplicando la máquina de estados,
 * permisos por rol y marcas de tiempo correspondientes (RF-05 / T-013).
 */
export async function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
  motivoCancelacion?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener rol del usuario actual
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rol = perfil?.rol ?? "operativo";

  // Consultar estado actual del pedido
  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .select("id, estado, listo_en, entregado_en, anulado")
    .eq("id", pedidoId)
    .maybeSingle();

  if (errorPedido || !pedido) {
    return { ok: false, error: "El pedido solicitado no existe." };
  }

  // Validar transición con la máquina de estados
  const validacion = validarCambioEstado({
    estadoActual: pedido.estado as EstadoPedido,
    nuevoEstado,
    rolUsuario: rol,
    motivoCancelacion,
  });

  if (!validacion.valido) {
    return { ok: false, error: validacion.error };
  }

  const updates: {
    estado: EstadoPedido;
    listo_en?: string | null;
    entregado_en?: string | null;
    anulado?: boolean;
    motivo_anulacion?: string | null;
  } = {
    estado: nuevoEstado,
  };

  const ahora = new Date().toISOString();

  if (nuevoEstado === "listo" && !pedido.listo_en) {
    updates.listo_en = ahora;
  } else if (nuevoEstado === "entregado" && !pedido.entregado_en) {
    updates.entregado_en = ahora;
  } else if (nuevoEstado === "cancelado") {
    updates.anulado = true;
    updates.motivo_anulacion = validacion.motivoLimpio;
  }

  const { error: errorUpdate } = await supabase
    .from("pedidos")
    .update(updates)
    .eq("id", pedidoId);

  if (errorUpdate) {
    return {
      ok: false,
      error: "No se pudo actualizar el estado del pedido. Intenta nuevamente.",
    };
  }

  if (nuevoEstado === "cancelado") {
    // Registrar traza inmutable en auditoria (RF-16 / T-024)
    await supabase.from("auditoria").insert({
      entidad: "pedido",
      entidad_id: pedidoId,
      accion: "anulacion",
      motivo: validacion.motivoLimpio,
      usuario_id: perfil?.id,
      fecha: ahora,
    });
  }

  revalidatePath("/pedidos");
  revalidatePath("/taller");
  revalidatePath(`/comanda/${pedidoId}`);
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");

  return { ok: true };
}

/**
 * Anulación directa de pedido con motivo obligatorio y registro en auditoría (RF-16 / T-024).
 * Solo para perfil gerencial.
 */
export async function anularPedidoConAuditoria(
  pedidoId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Debe iniciar sesión para realizar esta acción." };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rol = perfil?.rol ?? "operativo";
  if (rol !== "gerencial") {
    return {
      ok: false,
      error:
        "Solo los usuarios con perfil gerencial pueden anular pedidos (RF-16 / RF-18).",
    };
  }

  const validacion = validarMotivoAnulacion(motivo);
  if (!validacion.valido || !validacion.motivoLimpio) {
    return { ok: false, error: validacion.error ?? "Motivo de anulación inválido." };
  }

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, estado, anulado")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) {
    return { ok: false, error: "Pedido no encontrado." };
  }

  if (pedido.anulado) {
    return { ok: false, error: "El pedido ya se encuentra anulado." };
  }

  const ahora = new Date().toISOString();

  // 1. Actualizar pedido a cancelado y anulado
  const { error: errUpdate } = await supabase
    .from("pedidos")
    .update({
      anulado: true,
      motivo_anulacion: validacion.motivoLimpio,
      estado: "cancelado",
    })
    .eq("id", pedidoId);

  if (errUpdate) {
    return { ok: false, error: "Error al anular el pedido en base de datos." };
  }

  // 2. Insertar traza inmutable en auditoria (RF-16 / T-024)
  const { error: errAudit } = await supabase.from("auditoria").insert({
    entidad: "pedido",
    entidad_id: pedidoId,
    accion: "anulacion",
    motivo: validacion.motivoLimpio,
    usuario_id: perfil?.id,
    fecha: ahora,
  });

  if (errAudit) {
    console.error("Error al registrar evento de auditoría:", errAudit);
  }

  revalidatePath("/pedidos");
  revalidatePath("/taller");
  revalidatePath(`/comanda/${pedidoId}`);
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");

  return { ok: true };
}

/**
 * Consulta la traza histórica de auditoría para un pedido (RF-16 / T-024).
 * Solo usuarios gerenciales tienen acceso de lectura (RLS: auditoria_lectura_gerencial).
 */
export async function consultarAuditoriaPedido(pedidoId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("auditoria")
    .select(
      `
      id,
      entidad,
      entidad_id,
      accion,
      motivo,
      usuario_id,
      fecha
    `,
    )
    .eq("entidad", "pedido")
    .eq("entidad_id", pedidoId)
    .order("fecha", { ascending: false });

  return data ?? [];
}
