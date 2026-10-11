"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Lock,
  MessageCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
  DESCRIPCION_VARIABLES,
  PLANTILLAS_POR_DEFECTO,
  renderizarPlantilla,
  type TipoPlantilla,
  validarVariablesPlantilla,
  VARIABLES_PERMITIDAS,
} from "@/lib/notificaciones/plantillas";
import { PageHeader } from "@/components/shell/page-header";
import { guardarPlantilla } from "./actions";

type Props = {
  plantillasIniciales: Record<TipoPlantilla, string>;
  rolUsuario: string;
};

export function PlantillaEditor({ plantillasIniciales, rolUsuario }: Props) {
  const [tipoActivo, setTipoActivo] = useState<TipoPlantilla>("aviso_retiro");
  const [plantillas, setPlantillas] =
    useState<Record<TipoPlantilla, string>>(plantillasIniciales);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const esGerencial = rolUsuario === "gerencial";
  const contenidoActual = plantillas[tipoActivo];

  const validacionActual = validarVariablesPlantilla(contenidoActual);

  // Simulación de datos para preview en tiempo real
  const previewSimulado = renderizarPlantilla(contenidoActual, {
    cliente: "Corporación Gráfica C.A.",
    orden: "ORD-0042",
    total: 120.0,
    saldo: 40.0,
    saldoBs: 1600.0,
    tasa: 40.0,
    dias: 3,
    horas: 72,
  });

  const handleInsertarVariable = (variable: string) => {
    setPlantillas((prev) => ({
      ...prev,
      [tipoActivo]: `${prev[tipoActivo]} ${variable}`,
    }));
  };

  const handleRestablecerDefecto = () => {
    const porDefecto = PLANTILLAS_POR_DEFECTO[tipoActivo];
    setPlantillas((prev) => ({
      ...prev,
      [tipoActivo]: porDefecto,
    }));
    setMensajeExito(null);
    setMensajeError(null);
  };

  const handleGuardar = () => {
    if (!esGerencial) {
      setMensajeError(
        "Modo solo lectura: solo el perfil gerencial puede guardar cambios en las plantillas.",
      );
      return;
    }

    setMensajeExito(null);
    setMensajeError(null);

    startTransition(async () => {
      const res = await guardarPlantilla(tipoActivo, contenidoActual);
      if (res.ok) {
        setMensajeExito("Plantilla guardada y aplicada con éxito.");
      } else {
        setMensajeError(res.error ?? "No se pudo guardar la plantilla.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <PageHeader
        title="Gestión de Plantillas de Mensajes"
        description="Personalización de avisos y recordatorios de WhatsApp con variables automáticas (RF-10)."
        backHref="/"
        backLabel="Inicio"
        breadcrumbs={[
          { label: "Soporte" },
          { label: "Plantillas de Mensajes" },
        ]}
        actions={
          !esGerencial ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <Lock className="size-3.5" />
              Solo lectura (Gerencial requerido para guardar)
            </div>
          ) : undefined
        }
      />

      {mensajeExito && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {mensajeExito}
        </div>
      )}

      {mensajeError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {mensajeError}
        </div>
      )}

      {/* Selector de plantilla */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setTipoActivo("aviso_retiro");
            setMensajeExito(null);
            setMensajeError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tipoActivo === "aviso_retiro"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <MessageCircle className="size-4" />
          Aviso de Retiro (T-015)
        </button>

        <button
          type="button"
          onClick={() => {
            setTipoActivo("recordatorio");
            setMensajeExito(null);
            setMensajeError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tipoActivo === "recordatorio"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Bell className="size-4" />
          Recordatorio de 48–72 h (T-016)
        </button>
      </div>

      {/* Contenedor en 2 Columnas: Editor a la izquierda, Preview a la derecha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Contenido de la Plantilla
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Escriba el texto del mensaje e inserte variables dinámicas entre llaves.
            </p>
          </div>

          {/* Selector rápido de variables */}
          <div>
            <span className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
              Insertar variable disponible:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES_PERMITIDAS.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => handleInsertarVariable(variable)}
                  title={DESCRIPCION_VARIABLES[variable]}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1">
            <textarea
              rows={12}
              value={contenidoActual}
              onChange={(e) =>
                setPlantillas((prev) => ({
                  ...prev,
                  [tipoActivo]: e.target.value,
                }))
              }
              aria-label="Contenido de plantilla"
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3.5 font-mono text-xs leading-relaxed text-zinc-900 transition focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />

            {!validacionActual.valido && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Variables no permitidas detectadas:{" "}
                {validacionActual.variablesDesconocidas.join(", ")}
              </p>
            )}
          </div>

          {/* Botonera de acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestablecerDefecto}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              <RotateCcw className="size-3.5" />
              Restablecer por defecto
            </button>

            <button
              type="button"
              disabled={!esGerencial || isPending || !validacionActual.valido}
              onClick={handleGuardar}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Save className="size-4" />
              {isPending ? "Guardando..." : "Guardar Plantilla"}
            </button>
          </div>
        </div>

        {/* Preview en vivo */}
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Vista Previa en Vivo (Simulador WhatsApp)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Así visualizará el cliente el mensaje con los datos de ejemplo interpolados.
            </p>
          </div>

          {/* Burbuja estilo WhatsApp */}
          <div className="rounded-2xl bg-[#EFEAE2] p-4 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 min-h-[300px]">
            <div className="max-w-[85%] rounded-2xl bg-white p-4 text-xs leading-relaxed text-zinc-900 shadow-sm dark:bg-[#005c4b]/30 dark:text-zinc-100 whitespace-pre-wrap font-sans">
              {previewSimulado}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
