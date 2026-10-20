"use client";

import { LoaderCircle, Save, TriangleAlert } from "lucide-react";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-1.5">
        <label
          htmlFor="nombre"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
        >
          Nombre completo <span className="text-rose-500">*</span>
        </label>
        <Input
          id="nombre"
          name="nombre"
          type="text"
          required
          autoComplete="name"
          disabled={pendiente}
          aria-invalid={estado.errores?.nombre ? true : undefined}
          defaultValue={valores.nombre}
          sizeVariant="lg"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="telefono"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
        >
          Teléfono (Móvil / WhatsApp)
        </label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          autoComplete="tel"
          disabled={pendiente}
          defaultValue={valores.telefono}
          placeholder="Ej: 0414-1234567"
          sizeVariant="lg"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="notas"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
        >
          Notas u Observaciones (Opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          disabled={pendiente}
          defaultValue={valores.notas}
          placeholder="Dirección fiscal, persona de contacto, condiciones..."
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25"
        />
      </div>

      {mensajeError ? (
        <Alert variant="danger">
          {mensajeError}
        </Alert>
      ) : null}

      {estado.avisoDuplicado ? (
        <Alert variant="warning" icon={TriangleAlert} title="Posible cliente duplicado">
          <div className="space-y-2 mt-1">
            <p>{estado.avisoDuplicado}</p>
            <Button
              type="submit"
              name="confirmar"
              value="1"
              variant="outline"
              size="sm"
              disabled={pendiente}
            >
              Guardar de todas formas
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="space-y-2.5 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pendiente}
          className="w-full"
        >
          {pendiente ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          <span>{enEdicion ? "Guardar cambios" : "Registrar cliente"}</span>
        </Button>

        <Button
          href="/clientes"
          variant="outline"
          size="lg"
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
