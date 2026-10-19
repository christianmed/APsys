import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { obtenerTasaBcv } from "@/lib/tasas/bcv-service";
import {
  calcularVigenciaDesdeFechaBcv,
  esTasaBcvFutura,
  obtenerFechaYmdCaracas,
} from "@/lib/tasas/tasas";

/**
 * Endpoint de auto-sincronización de tasas BCV post-medianoche.
 * Se invoca de forma transparente al abrir la aplicación si el sistema detecta
 * que ya pasaron las 12:00 a. m. y la tasa en la base de datos es de una jornada anterior
 * o es inferior a la tasa oficial emitida por el BCV para el día en curso.
 */
export async function POST() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          exito: false,
          error: "Credenciales maestras de Supabase no configuradas",
        },
        { status: 500 },
      );
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const tasaUsd = await obtenerTasaBcv("USD", { forzarRefresco: true });
    if (!tasaUsd) {
      return NextResponse.json(
        { exito: false, error: "No se pudo obtener la tasa oficial del BCV" },
        { status: 502 },
      );
    }

    const valorRedondeado = Math.round(tasaUsd.valorBs * 10000) / 10000;
    const fechaVigencia = calcularVigenciaDesdeFechaBcv(
      tasaUsd.fechaActualizacion,
    );
    const esFutura = esTasaBcvFutura(tasaUsd.fechaActualizacion);

    // Si es una tasa futura emitida en la tarde para el día siguiente y aún no son las 12:00 AM del día siguiente,
    // se respeta la ventana manual hasta las 11:59 PM para el operador.
    const ymdHoy = obtenerFechaYmdCaracas(new Date());
    if (esFutura && tasaUsd.fechaActualizacion > ymdHoy) {
      return NextResponse.json({
        exito: true,
        accion: "ventana_manual",
        mensaje:
          "Tasa futura programada disponible en ventana manual hasta las 11:59 PM.",
      });
    }

    // Verificar si ya existe exactamente esta vigencia registrada
    const { data: existente } = await adminClient
      .from("tasas_cambio")
      .select("id, valor_bs_por_usd")
      .eq("vigente_desde", fechaVigencia)
      .maybeSingle();

    if (existente && Number(existente.valor_bs_por_usd) === valorRedondeado) {
      return NextResponse.json({
        exito: true,
        accion: "al_dia",
        valor: valorRedondeado,
        fechaVigencia,
      });
    }

    // Insertar nueva vigencia en tasas_cambio
    const { error: insertError } = await adminClient
      .from("tasas_cambio")
      .insert({
        valor_bs_por_usd: valorRedondeado,
        vigente_desde: fechaVigencia,
      });

    if (insertError) {
      console.error("[auto-sync] Error al insertar tasa_cambio:", insertError);
      return NextResponse.json(
        { exito: false, error: insertError.message },
        { status: 500 },
      );
    }

    // Registrar en auditoría
    await adminClient.from("auditoria").insert({
      tabla: "tasas_cambio",
      accion: "INSERT",
      detalles: {
        valor_bs_por_usd: valorRedondeado,
        vigente_desde: fechaVigencia,
        origen: "auto_sync_post_medianoche",
        fecha_emision_bcv: tasaUsd.fechaActualizacion,
      },
    });

    revalidatePath("/tasas");
    revalidatePath("/pedidos");
    revalidatePath("/pedidos/nuevo");

    return NextResponse.json({
      exito: true,
      accion: "sincronizado_automaticamente",
      valor: valorRedondeado,
      fechaVigencia,
    });
  } catch (err) {
    console.error("[auto-sync] Excepción inesperada:", err);
    return NextResponse.json(
      { exito: false, error: "Error interno en auto-sync" },
      { status: 500 },
    );
  }
}
