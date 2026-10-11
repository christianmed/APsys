import { redirect } from "next/navigation";
import {
  PLANTILLAS_POR_DEFECTO,
  type TipoPlantilla,
} from "@/lib/notificaciones/plantillas";
import { createClient } from "@/lib/supabase/server";
import { PlantillaEditor } from "./plantilla-editor";

export const instant = false;

/**
 * Editor y gestor de plantillas de WhatsApp (RF-10 / T-017).
 * Permite a gerencia personalizar textos con variables dinámicas validadas.
 */
export default async function PlantillasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rolUsuario = perfil?.rol ?? "operativo";

  // Consultar plantillas guardadas en base de datos
  const { data: plantillasEnDb } = await supabase
    .from("plantillas")
    .select("tipo, contenido");

  const plantillasMap: Record<TipoPlantilla, string> = {
    aviso_retiro: PLANTILLAS_POR_DEFECTO.aviso_retiro,
    recordatorio: PLANTILLAS_POR_DEFECTO.recordatorio,
  };

  if (plantillasEnDb) {
    for (const fila of plantillasEnDb) {
      if (fila.tipo === "aviso_retiro" || fila.tipo === "recordatorio") {
        plantillasMap[fila.tipo as TipoPlantilla] = fila.contenido;
      }
    }
  }

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 sm:p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <PlantillaEditor
          plantillasIniciales={plantillasMap}
          rolUsuario={rolUsuario}
        />
      </div>
    </main>
  );
}
