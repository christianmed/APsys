/**
 * Generador vectorial SVG de códigos QR (ISO/IEC 18004).
 * Genera una matriz 2D compacta y la renderiza como SVG con rectángulos agrupados.
 */

// Tablas de Reed-Solomon y polinomios de Galois Field GF(256)
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function inicializarGalois() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function multiplicarGF(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function generarPolinomioGenerador(grado: number): number[] {
  let poli = [1];
  for (let i = 0; i < grado; i++) {
    const factor = [1, EXP_TABLE[i]];
    const res = new Array(poli.length + 1).fill(0);
    for (let j = 0; j < poli.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        res[j + k] ^= multiplicarGF(poli[j], factor[k]);
      }
    }
    poli = res;
  }
  return poli;
}

function calcularECC(datos: number[], numECC: number): number[] {
  const generador = generarPolinomioGenerador(numECC);
  const msg = [...datos, ...new Array(numECC).fill(0)];
  for (let i = 0; i < datos.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < generador.length; j++) {
        msg[i + j] ^= multiplicarGF(generador[j], coef);
      }
    }
  }
  return msg.slice(datos.length);
}

/**
 * Matriz 2D de módulos de código QR.
 */
class QRMatrix {
  tamaño: number;
  modulos: (boolean | null)[][];

  constructor(tamaño: number) {
    this.tamaño = tamaño;
    this.modulos = Array.from({ length: tamaño }, () =>
      new Array(tamaño).fill(null),
    );
  }

  set(r: number, c: number, valor: boolean) {
    if (r >= 0 && r < this.tamaño && c >= 0 && c < this.tamaño) {
      this.modulos[r][c] = valor;
    }
  }

  isReserved(r: number, c: number): boolean {
    return this.modulos[r][c] !== null;
  }

  ponerPatronFinder(fila: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rf = fila + r;
        const cf = col + c;
        if (rf >= 0 && rf < this.tamaño && cf >= 0 && cf < this.tamaño) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            this.set(rf, cf, true);
          } else {
            this.set(rf, cf, false);
          }
        }
      }
    }
  }

  ponerPatronesSincronizacion() {
    for (let i = 8; i < this.tamaño - 8; i++) {
      const v = i % 2 === 0;
      if (!this.isReserved(6, i)) this.set(6, i, v);
      if (!this.isReserved(i, 6)) this.set(i, 6, v);
    }
  }

  ponerPatronAlineacion(fila: number, col: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const dist = Math.max(Math.abs(r), Math.abs(c));
        this.set(fila + r, col + c, dist !== 1);
      }
    }
  }
}

/**
 * Genera el marcado SVG de un código QR para comanda o enlace móvil.
 */
export function generarQrSvg(
  texto: string,
  opciones: { tamaño?: number; margen?: number } = {},
): string {
  const textoLimpio = texto?.trim();
  if (!textoLimpio) {
    throw new Error("El texto para el código QR no puede estar vacío.");
  }

  // Codificación Byte UTF-8
  const bytes = Array.from(new TextEncoder().encode(textoLimpio));

  // Determinar versión según longitud (Versión 1: max 17 bytes L, Versión 2: max 32, Versión 3: max 53, Versión 4: max 78)
  let version = 1;
  let totalDataCodewords = 19;
  let eccCodewords = 7;

  if (bytes.length > 53) {
    version = 4;
    totalDataCodewords = 64;
    eccCodewords = 16;
  } else if (bytes.length > 32) {
    version = 3;
    totalDataCodewords = 44;
    eccCodewords = 15;
  } else if (bytes.length > 17) {
    version = 2;
    totalDataCodewords = 34;
    eccCodewords = 10;
  }

  const dimension = 17 + version * 4;
  const qr = new QRMatrix(dimension);

  // Colocar Finders
  qr.ponerPatronFinder(0, 0);
  qr.ponerPatronFinder(0, dimension - 7);
  qr.ponerPatronFinder(dimension - 7, 0);
  qr.ponerPatronesSincronizacion();

  if (version >= 2) {
    const pos = dimension - 7;
    qr.ponerPatronAlineacion(pos, pos);
  }

  // Bit stream de datos
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Indicador de modo Byte (0100)
  pushBits(0b0100, 4);
  // Conteo de caracteres (8 bits para ver 1-9)
  pushBits(bytes.length, 8);
  for (const b of bytes) {
    pushBits(b, 8);
  }
  // Terminador (hasta 4 ceros)
  for (let i = 0; i < 4 && bits.length < totalDataCodewords * 8; i++) {
    bits.push(0);
  }
  // Rellenar a byte
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convertir a bytes de datos
  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i + b];
    }
    dataBytes.push(byteVal);
  }

  // Bytes de relleno (Pad bytes: 0xEC, 0x11 alternados)
  const pad = [0xec, 0x11];
  let pIdx = 0;
  while (dataBytes.length < totalDataCodewords) {
    dataBytes.push(pad[pIdx % 2]);
    pIdx++;
  }

  // Calcular ECC
  const ecc = calcularECC(dataBytes, eccCodewords);
  const mensajeFinal = [...dataBytes, ...ecc];

  // Convertir todo a lista de bits para poblar matriz
  const finalBits: number[] = [];
  for (const byte of mensajeFinal) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((byte >> b) & 1);
    }
  }

  // Recorrer matriz en zig-zag desde derecha hacia izquierda
  let bitIdx = 0;
  let subiendo = true;

  for (let col = dimension - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Saltear columna de sincronización

    const filas = subiendo
      ? Array.from({ length: dimension }, (_, i) => dimension - 1 - i)
      : Array.from({ length: dimension }, (_, i) => i);

    for (const fila of filas) {
      for (const c of [col, col - 1]) {
        if (!qr.isReserved(fila, c)) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Aplicar máscara patrón 0: (fila + c) % 2 === 0
          const mascara = (fila + c) % 2 === 0;
          qr.set(fila, c, bit === 1 ? !mascara : mascara);
        }
      }
    }
    subiendo = !subiendo;
  }

  // Renderizar a SVG
  const tamañoSvg = opciones.tamaño ?? 180;
  const margen = opciones.margen ?? 2;
  const totalModulos = dimension + margen * 2;

  const rects: string[] = [];
  for (let r = 0; r < dimension; r++) {
    for (let c = 0; c < dimension; c++) {
      if (qr.modulos[r][c] === true) {
        rects.push(
          `<rect x="${c + margen}" y="${r + margen}" width="1" height="1" fill="currentColor"/>`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModulos} ${totalModulos}" width="${tamañoSvg}" height="${tamañoSvg}" role="img" aria-label="Código QR">${rects.join("")}</svg>`;
}
