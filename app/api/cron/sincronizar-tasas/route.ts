import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { enviarAlertaTelegram } from "@/lib/notificaciones/telegram";
import { obtenerTasasBcvCompletas } from "@/lib/tasas/bcv-service";
import {
  calcularVigenciaDesdeFechaBcv,
  esTasaBcvFutura,
  calcularDiferenciaDiasCaracas,
  obtenerNombreDiaSemanaCaracas,
} from "@/lib/tasas/tasas";

/**
 * Route Handler para Cron Job automático de sincronización de tasas BCV (RF-15 / Fase 27).
 *
 * Se ejecuta automáticamente mediante Vercel Cron a las 6:30 p.m. (22:30 UTC)
 * y a las 12:05 a.m. (04:05 UTC) para registrar la tasa oficial vigente o programada
 * en Supabase usando SUPABASE_SERVICE_ROLE_KEY sin requerir usuario autenticado.
 *
 * Protegido mediante cabecera Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  // 1. Verificación de autorización con CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { exito: false, error: "No autorizado: cabecera Authorization requerida" },
        { status: 401 },
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== cronSecret) {
      return NextResponse.json(
        { exito: false, error: "No autorizado: token inválido" },
        { status: 401 },
      );
    }
  }

  // 2. Validación de credenciales maestras de Supabase
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[cron/sincronizar-tasas] Faltan variables de URL o Service Role Key de Supabase",
    );
    return NextResponse.json(
      {
        exito: false,
        error:
          "Configuración incompleta: se requieren NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY)",
      },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Consulta de tasas oficiales al servicio BCV (con bypass de caché para dato fresco)
  let tasasCompletas;
  try {
    tasasCompletas = await obtenerTasasBcvCompletas({ forzarRefresco: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[cron/sincronizar-tasas] Excepción al consultar BCV:", error);
    await enviarAlertaTelegram({
      titulo: "Fallo en Sincronización Automática BCV",
      mensaje: "Ocurrió una excepción al consultar las APIs de tasas oficiales (DolarVZLA y Fallback).",
      detalles: errorMsg,
    });
    return NextResponse.json(
      { exito: false, error: "Error de comunicación al consultar el servicio BCV" },
      { status: 502 },
    );
  }

  const tasaUsd = tasasCompletas?.usd;
  if (!tasaUsd || !tasaUsd.valorBs || tasaUsd.valorBs <= 0) {
    await enviarAlertaTelegram({
      titulo: "Tasa BCV No Disponible",
      mensaje: "La respuesta del servicio BCV no contenía una cotización USD válida en la ejecución del cron.",
    });
    return NextResponse.json(
      { exito: false, error: "No se pudo obtener la tasa oficial del BCV en este momento" },
      { status: 502 },
    );
  }

  // 4. Normalización de valor y cálculo de vigencia oficial (anclada a las 00:00:00 hora Caracas)
  const valorRedondeado = Math.round(tasaUsd.valorBs * 10000) / 10000;
  const fechaVigencia = calcularVigenciaDesdeFechaBcv(tasaUsd.fechaActualizacion);
  const esFutura = esTasaBcvFutura(tasaUsd.fechaActualizacion);
  const diffDias = calcularDiferenciaDiasCaracas(tasaUsd.fechaActualizacion);
  const nombreDia = diffDias === 1 ? "mañana" : `el ${obtenerNombreDiaSemanaCaracas(tasaUsd.fechaActualizacion)}`;

  // 5. Verificación de Idempotencia: ¿Ya existe una tasa para esta fecha?
  const { data: existente, error: queryError } = await adminClient
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd")
    .eq("vigente_desde", fechaVigencia)
    .maybeSingle();

  if (queryError) {
    console.error("[cron/sincronizar-tasas] Error al consultar tasas_cambio:", queryError);
    await enviarAlertaTelegram({
      titulo: "Error de Base de Datos al Sincronizar Tasas",
      mensaje: "Fallo al verificar tasas existentes en la tabla tasas_cambio de Supabase.",
      detalles: queryError.message,
    });
    return NextResponse.json(
      { exito: false, error: "Error al verificar tasas existentes en la base de datos" },
      { status: 500 },
    );
  }

  if (existente && Number(existente.valor_bs_por_usd) === valorRedondeado) {
    return NextResponse.json({
      exito: true,
      accion: "al_dia",
      mensaje: esFutura
        ? `La tasa para ${nombreDia} (${tasaUsd.fechaActualizacion}) ya estaba registrada.`
        : `La tasa de hoy (${tasaUsd.fechaActualizacion}) ya estaba al día.`,
      valor: valorRedondeado,
      fechaVigencia,
    });
  }

  // 6. Inserción de la nueva vigencia en tasas_cambio
  const { error: insertError } = await adminClient.from("tasas_cambio").insert({
    valor_bs_por_usd: valorRedondeado,
    vigente_desde: fechaVigencia,
  });

  if (insertError) {
    console.error("[cron/sincronizar-tasas] Error al insertar tasa:", insertError);
    await enviarAlertaTelegram({
      titulo: "Error al Guardar Nueva Tasa BCV",
      mensaje: `No se pudo persistir la nueva vigencia en Supabase (valor: Bs. ${valorRedondeado}).`,
      detalles: insertError.message,
    });
    return NextResponse.json(
      { exito: false, error: `Error al persistir tasa: ${insertError.message}` },
      { status: 500 },
    );
  }

  // 7. Registro en auditoría inmutable
  await adminClient.from("auditoria").insert({
    tabla: "tasas_cambio",
    accion: "INSERT",
    detalles: {
      valor_bs_por_usd: valorRedondeado,
      vigente_desde: fechaVigencia,
      origen: "cron_automatico_bcv",
      fecha_emision_bcv: tasaUsd.fechaActualizacion,
      es_futura: esFutura,
    },
  });

  // 8. Revalidación de rutas clave para reflejar el cambio en la aplicación
  revalidatePath("/tasas");
  revalidatePath("/pedidos");
  revalidatePath("/pedidos/nuevo");
  revalidatePath("/dashboard");
  revalidatePath("/cuentas-por-cobrar");

  const mensaje = esFutura
    ? `Tasa oficial programada para ${nombreDia} (${tasaUsd.fechaActualizacion}): Bs. ${valorRedondeado.toFixed(4)} / USD.`
    : `Tasa oficial de hoy sincronizada (${tasaUsd.fechaActualizacion}): Bs. ${valorRedondeado.toFixed(4)} / USD.`;

  return NextResponse.json({
    exito: true,
    accion: "insertada",
    mensaje,
    valor: valorRedondeado,
    fechaVigencia,
    esFutura,
  });
}
