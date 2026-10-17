/**
 * APSys — Validación de Entrada de Clientes
 */

import {
  limpiarTexto,
  normalizarTelefono,
  type ResultadoValidacion,
} from "./comun";

export type ClienteEntrada = {
  nombre: string;
  telefono: string | null;
  notas: string | null;
};

export function validarEntradaCliente(
  input: unknown,
): ResultadoValidacion<ClienteEntrada> {
  const errores: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return {
      exito: false,
      errores: { general: "Datos de cliente inválidos o inexistentes." },
    };
  }

  const raw = input as Record<string, unknown>;
  const nombreLimpio = limpiarTexto(
    typeof raw.nombre === "string" ? raw.nombre : "",
  );

  if (!nombreLimpio) {
    errores.nombre = "El nombre del cliente es obligatorio.";
  } else if (nombreLimpio.length > 150) {
    errores.nombre = "El nombre no puede superar los 150 caracteres.";
  }

  const telefonoNormalizado = normalizarTelefono(
    typeof raw.telefono === "string" ? raw.telefono : null,
  );

  if (telefonoNormalizado && telefonoNormalizado.length > 30) {
    errores.telefono = "El teléfono no puede superar los 30 caracteres.";
  }

  const notasLimpias = limpiarTexto(
    typeof raw.notas === "string" ? raw.notas : null,
  );

  if (Object.keys(errores).length > 0) {
    return { exito: false, errores };
  }

  return {
    exito: true,
    datos: {
      nombre: nombreLimpio!,
      telefono: telefonoNormalizado,
      notas: notasLimpias,
    },
  };
}
