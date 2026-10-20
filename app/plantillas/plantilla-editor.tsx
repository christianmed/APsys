"use client";

import {
  Bell,
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { guardarPlantilla } from "./actions";

type Props = {
  plantillasIniciales: Record<TipoPlantilla, string>;
  rolUsuario: string;
};

const TAB_PLANTILLAS = [
  {
    key: "aviso_retiro",
    label: "Aviso de Retiro (T-015)",
    icon: MessageCircle,
  },
  {
    key: "recordatorio",
    label: "Recordatorio de 48–72 h (T-016)",
    icon: Bell,
  },
];

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
      {/* Cabecera unificada */}
      <PageHeader
        title="Gestión de Plantillas de Mensajes"
        description="Personalización de avisos y recordatorios de WhatsApp con variables automáticas (RF-10)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <MessageCircle className="size-3.5" />
            <span>WhatsApp & Automatización</span>
          </span>
        }
        actions={
          !esGerencial ? (
            <Badge variant="warning" icon={Lock}>
              Solo lectura (Gerencial requerido para guardar)
            </Badge>
          ) : undefined
        }
      />

      {mensajeExito && (
        <Alert variant="success">{mensajeExito}</Alert>
      )}

      {mensajeError && (
        <Alert variant="danger">{mensajeError}</Alert>
      )}

      {/* Selector de plantilla canónico */}
      <Tabs
        items={TAB_PLANTILLAS}
        activeKey={tipoActivo}
        onChange={(key) => {
          setTipoActivo(key as TipoPlantilla);
          setMensajeExito(null);
          setMensajeError(null);
        }}
      />

      {/* Contenedor en 2 Columnas: Editor a la izquierda, Preview a la derecha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card className="space-y-4 p-5">
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
            <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Insertar variable disponible:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES_PERMITIDAS.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => handleInsertarVariable(variable)}
                  title={DESCRIPCION_VARIABLES[variable]}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 active:scale-[0.97] touch-manipulation dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300 dark:hover:bg-[#252b42]"
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
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3.5 font-mono text-xs leading-relaxed text-zinc-900 transition focus:border-[#7aa2f7] focus:bg-white focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-100 dark:focus:border-[#7aa2f7]"
            />

            {!validacionActual.valido && (
              <p className="text-xs text-rose-600 dark:text-[#f7768e]">
                Variables no permitidas detectadas:{" "}
                {validacionActual.variablesDesconocidas.join(", ")}
              </p>
            )}
          </div>

          {/* Botonera de acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleRestablecerDefecto}
            >
              Restablecer por defecto
            </Button>

            <Button
              type="button"
              variant="primary"
              icon={Save}
              disabled={!esGerencial || isPending || !validacionActual.valido}
              isLoading={isPending}
              onClick={handleGuardar}
            >
              {isPending ? "Guardando..." : "Guardar Plantilla"}
            </Button>
          </div>
        </Card>

        {/* Preview en vivo */}
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Vista Previa en Vivo (Simulador WhatsApp)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Así visualizará el cliente el mensaje con los datos de ejemplo interpolados.
            </p>
          </div>

          {/* Burbuja estilo WhatsApp */}
          <div className="min-h-[300px] rounded-2xl border border-zinc-200 bg-[#EFEAE2] p-4 dark:border-[#24283b] dark:bg-[#16161e]">
            <div className="max-w-[85%] rounded-2xl bg-white p-4 font-sans text-xs leading-relaxed text-zinc-900 shadow-sm whitespace-pre-wrap dark:bg-[#005c4b]/30 dark:text-zinc-100">
              {previewSimulado}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
