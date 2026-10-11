"use client";

import { CircleAlert, LoaderCircle, Save, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  actualizarCliente,
  crearCliente,
  type EstadoFormularioCliente,
} from "./actions";

type ClienteExistente = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
};

type Props =
  | { modo: "crear"; cliente?: undefined }
  | { modo: "editar"; cliente: ClienteExistente };

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_TEXTAREA =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_BOTON =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

const CLASES_BOTON_SECUNDARIO =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800";

/**
 * Formulario de alta/edición de cliente (RF-01). Resuelve la acción con
 * `useActionState` y muestra los errores y el aviso de teléfono duplicado
 * que devuelve el servidor (T-006a) sin perder lo ya cargado.
 */
export function ClienteForm({ modo, cliente }: Props) {
  const enEdicion = modo === "editar" ? cliente : undefined;

  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioCliente,
    FormData
  >(enEdicion ? actualizarCliente.bind(null, enEdicion.id) : crearCliente, {});

  const valores = {
    nombre: estado.valores?.nombre ?? enEdicion?.nombre ?? "",
    telefono: estado.valores?.telefono ?? enEdicion?.telefono ?? "",
    notas: estado.valores?.notas ?? enEdicion?.notas ?? "",
  };

  const mensajeError = estado.errores?.general ?? estado.errores?.nombre;

  return (
    <form action={accion} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          autoComplete="name"
          disabled={pendiente}
          aria-invalid={estado.errores?.nombre ? true : undefined}
          defaultValue={valores.nombre}
          className={CLASES_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="telefono"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          autoComplete="tel"
          disabled={pendiente}
          defaultValue={valores.telefono}
          className={CLASES_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="notas"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          disabled={pendiente}
          defaultValue={valores.notas}
          className={CLASES_TEXTAREA}
        />
      </div>

      {mensajeError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{mensajeError}</span>
        </p>
      ) : null}

      {estado.avisoDuplicado ? (
        <div
          role="alert"
          className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <p className="flex items-start gap-2">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{estado.avisoDuplicado}</span>
          </p>
          <button
            type="submit"
            name="confirmar"
            value="1"
            disabled={pendiente}
            className={CLASES_BOTON_SECUNDARIO}
          >
            Guardar de todas formas
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <button type="submit" disabled={pendiente} className={CLASES_BOTON}>
          {pendiente ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          Guardar cliente
        </button>

        <Link
          href="/clientes"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
