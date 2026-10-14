import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  PLANTILLAS_POR_DEFECTO,
  type TipoPlantilla,
} from "@/lib/notificaciones/plantillas";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PlantillaEditor } from "./plantilla-editor";

export const instant = false;

/**
 * Editor y gestor de plantillas de WhatsApp (RF-10 / T-017).
 * Permite a gerencia personalizar textos con variables dinámicas validadas.
 */
export default async function PlantillasPage() {
  await connection();
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

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
    <AuthenticatedShell>
      <div className="space-y-6">
        <PlantillaEditor
          plantillasIniciales={plantillasMap}
          rolUsuario={rolUsuario}
        />
      </div>
    </AuthenticatedShell>
  );
}
