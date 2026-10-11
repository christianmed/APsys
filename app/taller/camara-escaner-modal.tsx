"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Flashlight,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  extraerNumeroOrdenDeLecturaCamara,
  FORMATOS_BARCODE_DETECTOR,
} from "@/lib/camara/escaner";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onOrdenDetectada: (numeroOrden: number) => void;
};

// Declaración de tipos para BarcodeDetector global
interface BarcodeDetectionResult {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement | ImageBitmapSource): Promise<BarcodeDetectionResult[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: readonly string[] }): BarcodeDetectorInstance;
      getSupportedFormats?(): Promise<string[]>;
    };
  }
}

export function CamaraEscanerModal({
  abierto,
  onCerrar,
  onOrdenDetectada,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [iniciando, setIniciando] = useState(true);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [soportaBarcodeDetector] = useState(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
  );
  const [codigoDetectado, setCodigoDetectado] = useState<number | null>(null);
  const [antorchaActiva, setAntorchaActiva] = useState(false);
  const [soportaAntorcha, setSoportaAntorcha] = useState(false);
  const [inputManual, setInputManual] = useState("");

  const detenerStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCerrar = () => {
    detenerStream();
    onCerrar();
  };

  useEffect(() => {
    if (!abierto) {
      detenerStream();
      return;
    }

    async function iniciarCamara() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorCamara(
            "Su navegador no soporta acceso a la cámara mediante getUserMedia.",
          );
          setIniciando(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Verificar soporte para antorcha/flash
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
          setSoportaAntorcha(Boolean(capabilities?.torch));
        }

        setIniciando(false);

        // Iniciar bucle de detección con BarcodeDetector si está disponible
        if (soportaBarcodeDetector && window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: FORMATOS_BARCODE_DETECTOR,
          });

          const escanearFrame = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              animFrameRef.current = requestAnimationFrame(escanearFrame);
              return;
            }

            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                for (const barcode of barcodes) {
                  const num = extraerNumeroOrdenDeLecturaCamara(barcode.rawValue);
                  if (num !== null) {
                    setCodigoDetectado(num);
                    detenerStream();
                    setTimeout(() => {
                      onOrdenDetectada(num);
                      onCerrar();
                    }, 400);
                    return;
                  }
                }
              }
            } catch {
              // Frame no decodificado, continuar escaneando
            }

            animFrameRef.current = requestAnimationFrame(escanearFrame);
          };

          animFrameRef.current = requestAnimationFrame(escanearFrame);
        }
      } catch (err) {
        setIniciando(false);
        const mensaje =
          err instanceof Error
            ? err.message
            : "No se pudo acceder a la cámara del dispositivo.";
        setErrorCamara(
          mensaje.includes("Permission") || mensaje.includes("denied")
            ? "Permiso de cámara denegado. Permita el acceso a la cámara en los ajustes del navegador."
            : `Error de cámara: ${mensaje}`,
        );
      }
    }

    void iniciarCamara();

    return () => {
      detenerStream();
    };
  }, [abierto, onCerrar, onOrdenDetectada, soportaBarcodeDetector]);

  const toggleAntorcha = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nuevoEstado = !antorchaActiva;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nuevoEstado }],
      });
      setAntorchaActiva(nuevoEstado);
    } catch {
      // Ignorar si falla el comando de antorcha
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = extraerNumeroOrdenDeLecturaCamara(inputManual);
    if (num !== null) {
      detenerStream();
      onOrdenDetectada(num);
      onCerrar();
    }
  };

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-escaner"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl border border-zinc-800 text-white">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-amber-500" />
            <h2 id="titulo-escaner" className="text-base font-bold">
              Escanear Comanda con Cámara
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCerrar}
            aria-label="Cerrar escáner"
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Visor de cámara */}
        <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
          {iniciando && (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <LoaderCircle className="size-8 animate-spin text-amber-500" />
              <p className="text-xs">Iniciando cámara trasera...</p>
            </div>
          )}

          {errorCamara && (
            <div className="p-6 text-center text-xs text-red-300">
              <AlertCircle className="mx-auto mb-2 size-8 text-red-400" />
              <p className="font-semibold">{errorCamara}</p>
            </div>
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            className={`size-full object-cover ${
              iniciando || errorCamara ? "hidden" : "block"
            }`}
          />

          {/* Guía visual de enfoque de código de barras / QR */}
          {!iniciando && !errorCamara && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={`size-56 sm:size-64 rounded-2xl border-2 transition-colors ${
                  codigoDetectado
                    ? "border-emerald-500 bg-emerald-500/20"
                    : "border-amber-400 border-dashed"
                }`}
              >
                <div className="relative size-full">
                  <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-white size-4" />
                  <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-white size-4" />
                </div>
              </div>

              {codigoDetectado && (
                <div className="absolute flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-mono text-sm font-bold text-white shadow-lg">
                  <CheckCircle2 className="size-4" />
                  ORD-{String(codigoDetectado).padStart(4, "0")} DETECTADO
                </div>
              )}
            </div>
          )}

          {/* Botón de flash / antorcha */}
          {soportaAntorcha && !iniciando && !errorCamara && (
            <button
              type="button"
              onClick={toggleAntorcha}
              aria-label={antorchaActiva ? "Apagar linterna" : "Encender linterna"}
              className={`absolute bottom-4 right-4 rounded-xl p-2.5 backdrop-blur-md transition ${
                antorchaActiva
                  ? "bg-amber-500 text-black shadow-lg"
                  : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              <Flashlight className="size-5" />
            </button>
          )}
        </div>

        {/* Información y Fallback para navegadores sin BarcodeDetector */}
        <div className="p-4 space-y-3 bg-zinc-900 border-t border-zinc-800">
          {!soportaBarcodeDetector && (
            <p className="text-[11px] text-amber-300">
              ℹ️ Su navegador actual no cuenta con BarcodeDetector activo. Puede escribir el número o usar el lector USB a continuación:
            </p>
          )}

          {/* Input manual rápido como fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="search"
              value={inputManual}
              onChange={(e) => setInputManual(e.target.value)}
              placeholder="Escribir # orden (ej. 42 o ORD-0042)"
              aria-label="Número de orden manual"
              className="h-10 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-500 active:scale-95"
            >
              <Search className="size-3.5" />
              Filtrar
            </button>
          </form>

          <p className="text-center text-[11px] text-zinc-500">
            Apunta la cámara al código de barras Code 39 o código QR de la comanda impresa.
          </p>
        </div>
      </div>
    </div>
  );
}
