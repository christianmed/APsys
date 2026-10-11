/**
 * Utilidades para escaneo de comanda con cámara móvil (RF-06 / T-018).
 * Soporta decodificación de Code 39 y QR mediante BarcodeDetector nativo.
 */

import { sanearTerminoBusquedaOrden } from "../pedidos/busqueda";

export const FORMATOS_BARCODE_DETECTOR = [
  "code_39",
  "qr_code",
] as const;

/**
 * Extrae el número de orden correlativo a partir del texto leído por la cámara.
 * Maneja códigos de barras Code 39 (*ORD-0001*), URLs de QR con parámetros y numerales.
 */
export function extraerNumeroOrdenDeLecturaCamara(
  entrada: string | null | undefined,
): number | null {
  if (!entrada) return null;

  const texto = entrada.trim();
  if (!texto) return null;

  // 1. Caso: URL de comanda con parámetro de consulta o fragmento
  // Ej: https://dominio.com/comanda/uuid?orden=42 o /comanda/uuid#ORD-0015
  const matchParamOrden = texto.match(/[?&]orden=(\d+)/i);
  if (matchParamOrden && matchParamOrden[1]) {
    const num = Number.parseInt(matchParamOrden[1], 10);
    if (!Number.isNaN(num) && num > 0) return num;
  }

  const matchHashOrden = texto.match(/#ORD-?(\d+)/i);
  if (matchHashOrden && matchHashOrden[1]) {
    const num = Number.parseInt(matchHashOrden[1], 10);
    if (!Number.isNaN(num) && num > 0) return num;
  }

  // 2. Caso: Lectura directa de Code 39 o código de orden (ej. *ORD-0042*, #42, 42)
  const saneado = sanearTerminoBusquedaOrden(texto);
  if (saneado.esNumeroOrden && saneado.numeroOrden !== null && saneado.numeroOrden > 0) {
    return saneado.numeroOrden;
  }

  return null;
}
