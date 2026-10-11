/**
 * Motor de plantillas y variables para mensajes de WhatsApp (RF-10 / T-017).
 */

export type TipoPlantilla = "aviso_retiro" | "recordatorio";

export const VARIABLES_PERMITIDAS = [
  "{cliente}",
  "{orden}",
  "{total}",
  "{saldo}",
  "{saldo_bs}",
  "{tasa}",
  "{dias}",
  "{horas}",
] as const;

export type VariablePermitida = (typeof VARIABLES_PERMITIDAS)[number];

export const DESCRIPCION_VARIABLES: Record<VariablePermitida, string> = {
  "{cliente}": "Nombre del cliente o empresa",
  "{orden}": "Número de orden correlativo (ej. ORD-0001)",
  "{total}": "Monto total del pedido en USD (ej. 150.00)",
  "{saldo}": "Saldo pendiente por pagar en USD (ej. 50.00)",
  "{saldo_bs}": "Equivalente en Bolívares del saldo pendiente",
  "{tasa}": "Tasa de cambio referencial en Bs/$ del pedido",
  "{dias}": "Días transcurridos desde que el pedido estuvo listo",
  "{horas}": "Horas transcurridas desde que el pedido estuvo listo",
};

export const PLANTILLAS_POR_DEFECTO: Record<TipoPlantilla, string> = {
  aviso_retiro: `👋 *Hola {cliente}*, le escribimos de *APSys Gráfica*.

🎉 ¡Su orden *#{orden}* está lista para ser retirada en nuestro taller!

💵 *Total:* \${total} USD
💳 *Saldo pendiente:* \${saldo} USD

📍 Puede pasar a retirar su pedido en nuestro horario habitual. ¡Muchas gracias por confiar en nosotros!`,

  recordatorio: `🔔 *Hola {cliente}*, le escribimos con un cordial recordatorio de *APSys Gráfica*.

📦 Le recordamos que su orden *#{orden}* lleva varios días lista para entrega ({dias} días en taller).

💵 *Total:* \${total} USD
💳 *Saldo pendiente:* \${saldo} USD

📍 Le esperamos en nuestras instalaciones para retirar su material. Si ya coordinó el retiro, por favor desestime este mensaje. ¡Muchas gracias!`,
};

export type DatosVariablesPlantilla = {
  cliente?: string | null;
  orden?: string | number | null;
  total?: number | null;
  saldo?: number | null;
  saldoBs?: number | null;
  tasa?: number | null;
  dias?: number | null;
  horas?: number | null;
};

/**
 * Valida si el texto de la plantilla contiene únicamente variables permitidas.
 */
export function validarVariablesPlantilla(texto: string): {
  valido: boolean;
  variablesDesconocidas: string[];
} {
  const patronVariables = /\{[a-zA-Z0-9_]+\}/g;
  const coincidencias = texto.match(patronVariables) ?? [];

  const variablesDesconocidas: string[] = [];

  for (const match of coincidencias) {
    if (!VARIABLES_PERMITIDAS.includes(match as VariablePermitida)) {
      if (!variablesDesconocidas.includes(match)) {
        variablesDesconocidas.push(match);
      }
    }
  }

  return {
    valido: variablesDesconocidas.length === 0,
    variablesDesconocidas,
  };
}

function formatearMoneda(valor: number): string {
  return valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Interpola las variables dentro del texto de la plantilla.
 */
export function renderizarPlantilla(
  plantilla: string,
  datos: DatosVariablesPlantilla,
): string {
  let resultado = plantilla;

  const clienteValor = datos.cliente?.trim() || "Cliente";
  const ordenValor = datos.orden != null ? String(datos.orden) : "ORD-0000";
  const totalValor = datos.total != null ? formatearMoneda(datos.total) : "0.00";
  const saldoValor = datos.saldo != null ? formatearMoneda(datos.saldo) : "0.00";
  const saldoBsValor =
    datos.saldoBs != null ? formatearMoneda(datos.saldoBs) : "0.00";
  const tasaValor = datos.tasa != null ? formatearMoneda(datos.tasa) : "0.00";
  const diasValor = datos.dias != null ? String(datos.dias) : "0";
  const horasValor = datos.horas != null ? String(datos.horas) : "0";

  resultado = resultado.replaceAll("{cliente}", clienteValor);
  resultado = resultado.replaceAll("{orden}", ordenValor);
  resultado = resultado.replaceAll("{total}", totalValor);
  resultado = resultado.replaceAll("{saldo}", saldoValor);
  resultado = resultado.replaceAll("{saldo_bs}", saldoBsValor);
  resultado = resultado.replaceAll("{tasa}", tasaValor);
  resultado = resultado.replaceAll("{dias}", diasValor);
  resultado = resultado.replaceAll("{horas}", horasValor);

  return resultado;
}
