/**
 * Generador vectorial SVG de código de barras Code 39 (ISO/IEC 16388).
 * Compatible de forma nativa con lectores USB ópticos y láser sin librerías externas.
 */

const PATRONES_CODE39: Record<string, string> = {
  "0": "000110100",
  "1": "100100001",
  "2": "001100001",
  "3": "101100000",
  "4": "000110001",
  "5": "100110000",
  "6": "001110000",
  "7": "000100101",
  "8": "100100100",
  "9": "001100100",
  A: "100001001",
  B: "001001001",
  C: "101001000",
  D: "000011001",
  E: "100011000",
  F: "001011000",
  G: "000001101",
  H: "100001100",
  I: "001001100",
  J: "000011100",
  K: "100000011",
  L: "001000011",
  M: "101000010",
  N: "000010011",
  O: "100010010",
  P: "001010010",
  Q: "000000111",
  R: "100000110",
  S: "001000110",
  T: "000010110",
  U: "110000001",
  V: "011000001",
  W: "111000000",
  X: "010010001",
  Y: "110010000",
  Z: "011010000",
  "-": "010000101",
  ".": "110000100",
  " ": "011000100",
  $: "010101000",
  "/": "010100010",
  "+": "010001010",
  "%": "000101010",
  "*": "010010100", // Carácter de inicio y fin (Stop/Start)
};

export type OpcionesBarcode = {
  altura?: number;
  anchoEstrecho?: number;
  anchoAncho?: number;
};

/**
 * Genera el marcado SVG de un código de barras Code 39 para impresión de comandas.
 */
export function generarCodigoBarrasSvg(
  texto: string,
  opciones: OpcionesBarcode = {},
): string {
  const textoLimpio = texto?.trim().toUpperCase();
  if (!textoLimpio) {
    throw new Error("El texto para el código de barras no puede estar vacío.");
  }

  const altura = opciones.altura ?? 50;
  const estrecho = opciones.anchoEstrecho ?? 2;
  const ancho = opciones.anchoAncho ?? 5;

  const cadenaCompleta = `*${textoLimpio}*`;
  let anchoTotal = 0;
  const rects: Array<{ x: number; width: number }> = [];

  // Margen inicial de quiet zone
  anchoTotal += estrecho * 5;

  for (let i = 0; i < cadenaCompleta.length; i++) {
    const char = cadenaCompleta[i];
    const patron = PATRONES_CODE39[char];
    if (!patron) {
      continue; // Ignorar caracteres no soportados
    }

    // El patrón tiene 9 bits: alternando barra (B), espacio (S), barra, espacio...
    for (let bit = 0; bit < 9; bit++) {
      const esBarra = bit % 2 === 0;
      const esAncho = patron[bit] === "1";
      const w = esAncho ? ancho : estrecho;

      if (esBarra) {
        rects.push({ x: anchoTotal, width: w });
      }
      anchoTotal += w;
    }

    // Espacio entre caracteres (inter-character gap)
    anchoTotal += estrecho;
  }

  // Margen final de quiet zone
  anchoTotal += estrecho * 5;

  const rectsSvg = rects
    .map(
      (r) =>
        `<rect x="${r.x}" y="0" width="${r.width}" height="${altura}" fill="currentColor" />`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${anchoTotal} ${altura}" width="100%" height="${altura}" preserveAspectRatio="none" role="img" aria-label="Código de barras ${textoLimpio}">${rectsSvg}</svg>`;
}
