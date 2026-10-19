"use client";

import {
  CircleAlert,
  LoaderCircle,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  type EstadoFormularioServicio,
} from "./actions";

type ServicioExistente = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

type Props =
  | { modo: "crear"; servicio?: undefined; pedidosAsociados?: undefined }
  | {
      modo: "editar";
      servicio: ServicioExistente;
      pedidosAsociados?: number;
    };

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-[#7aa2f7] dark:focus-visible:ring-[#7aa2f7]/20";

const CLASES_BOTON =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-100 dark:hover:bg-[#252b42] dark:focus-visible:ring-[#7aa2f7] dark:focus-visible:ring-offset-[#1a1b26]";

const CLASES_BOTON_SECUNDARIO =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42]";

const CLASES_CHECKBOX =
  "size-4 shrink-0 accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-[#7aa2f7]";

/**
 * Formulario de alta/edición de servicio (RF-04/T-007b). Resuelve la acción
 * con `useActionState` y repinta errores/valores desde el estado que devuelve
 * el servidor (T-007a). `activo` solo se edita en modo "editar": la baja de un
 * servicio es lógica (los pedidos históricos siguen referenciándolo).
 * Si el servicio no tiene pedidos asociados (0 vinculaciones), permite su
 * eliminación física definitiva; si tiene pedidos, la bloquea explicando el motivo.
 */
export function ServicioForm({ modo, servicio, pedidosAsociados = 0 }: Props) {
  const router = useRouter();
  const enEdicion = modo === "editar" ? servicio : undefined;
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null);

  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioServicio,
    FormData
  >(
    enEdicion ? actualizarServicio.bind(null, enEdicion.id) : crearServicio,
    {},
  );

  const valores = {
    nombre: estado.valores?.nombre ?? enEdicion?.nombre ?? "",
    orden: estado.valores?.orden ?? enEdicion?.orden ?? 0,
  };

  const mensajeError =
    estado.errores?.general ??
    estado.errores?.nombre ??
    estado.errores?.orden ??
    errorEliminacion;

  const handleEliminar = async () => {
    if (!enEdicion) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el servicio "${enEdicion.nombre}"?\n\nAl no tener pedidos registrados en el sistema, se borrará definitivamente de la base de datos.`,
    );

    if (!confirmacion) return;

    setEliminando(true);
    setErrorEliminacion(null);

    try {
      const res = await eliminarServicio(enEdicion.id);
      if (res.ok) {
        router.push("/servicios");
      } else {
        setErrorEliminacion(res.error ?? "No se pudo eliminar el servicio.");
        setEliminando(false);
      }
    } catch {
      setErrorEliminacion("Ocurrió un error inesperado al intentar eliminar el servicio.");
      setEliminando(false);
    }
  };

  return (
    <form action={accion} className="space-y-6">
      {/* Campo Nombre */}
      <div className="space-y-1.5">
        <label
          htmlFor="nombre"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Nombre del Servicio
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          disabled={pendiente || eliminando}
          aria-invalid={estado.errores?.nombre ? true : undefined}
          defaultValue={valores.nombre}
          placeholder="Ej: Pendones, Viniles, Gigantografías..."
          className={CLASES_INPUT}
        />
      </div>

      {/* Campo Prioridad / Posición en Catálogo */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="orden"
            className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Prioridad en Catálogo (Posición)
          </label>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Menor número = Más arriba
          </span>
        </div>
        <input
          id="orden"
          name="orden"
          type="number"
          min={0}
          disabled={pendiente || eliminando}
          aria-invalid={estado.errores?.orden ? true : undefined}
          defaultValue={valores.orden}
          className={CLASES_INPUT}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Determina la posición en que aparecerá este servicio en las listas y selectores al crear nuevas órdenes (ej. 1, 2, 3...).
        </p>
      </div>

      {/* Casilla Activo / Baja Lógica */}
      {enEdicion ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#24283b] dark:bg-[#16161e]">
          <div className="flex items-start gap-3">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              defaultChecked={enEdicion.activo}
              disabled={pendiente || eliminando}
              className={`${CLASES_CHECKBOX} mt-0.5`}
            />
            <div>
              <label
                htmlFor="activo"
                className="cursor-pointer text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Servicio Activo en Catálogo
              </label>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Si desmarcas esta opción, el servicio se ocultará al registrar nuevos pedidos (baja lógica), preservando intacto el historial contable de órdenes previas.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Advertencia de pedidos vinculados si aplica */}
      {enEdicion && pedidosAsociados > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <span className="font-bold">Protección de Integridad Histórica:</span>
              <p>
                Este servicio tiene <strong>{pedidosAsociados} {pedidosAsociados === 1 ? "pedido registrado" : "pedidos registrados"}</strong>. Por seguridad contable no se puede eliminar físicamente de la base de datos para no romper comandas ni reportes existentes. Para retirarlo del menú de nuevas órdenes, simplemente desmarca la casilla <strong>&quot;Servicio Activo&quot;</strong> arriba.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Feedback de error */}
      {mensajeError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{mensajeError}</span>
        </p>
      ) : null}

      {/* Botones de acción principales */}
      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={pendiente || eliminando}
          className={CLASES_BOTON}
        >
          {pendiente ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          Guardar cambios
        </button>

        <Link href="/servicios" className={CLASES_BOTON_SECUNDARIO}>
          Cancelar
        </Link>
      </div>

      {/* Botón de Eliminación Segura (Solo disponible si 0 pedidos vinculados) */}
      {enEdicion && pedidosAsociados === 0 ? (
        <div className="border-t border-zinc-200 pt-5 dark:border-[#24283b]">
          <div className="space-y-2">
            <button
              type="button"
              disabled={pendiente || eliminando}
              onClick={handleEliminar}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/40"
            >
              {eliminando ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-rose-600 dark:text-rose-400" />
              )}
              {eliminando ? "Eliminando..." : "Eliminar servicio definitivamente"}
            </button>
            <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              Este servicio no tiene órdenes asociadas y puede ser borrado de forma permanente.
            </p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
