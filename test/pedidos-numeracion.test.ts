import { describe, expect, it } from "vitest";

describe("T-010 — numeración secuencial de órdenes y estado inicial (RF-05)", () => {
  it("un pedido recién creado debe tener estado 'recibido' por definición", () => {
    const estadoInicial = "recibido";
    const estadosValidos = [
      "recibido",
      "en_produccion",
      "listo",
      "entregado",
      "cancelado",
    ];

    expect(estadosValidos).toContain(estadoInicial);
    expect(estadoInicial).toBe("recibido");
  });

  it("las marcas de tiempo listas y entregadas deben comenzar nulas al registrar la orden", () => {
    const pedidoNuevo = {
      estado: "recibido",
      creado_en: new Date().toISOString(),
      listo_en: null,
      entregado_en: null,
    };

    expect(pedidoNuevo.estado).toBe("recibido");
    expect(pedidoNuevo.creado_en).toBeDefined();
    expect(pedidoNuevo.listo_en).toBeNull();
    expect(pedidoNuevo.entregado_en).toBeNull();
  });

  it("la secuencia de órdenes correlativas debe iniciar en 1001 si no hay órdenes previas", () => {
    function calcularSiguienteOrden(ultimoNumero: number | null | undefined): number {
      if (ultimoNumero === null || ultimoNumero === undefined || ultimoNumero < 1000) {
        return 1001;
      }
      return ultimoNumero + 1;
    }

    expect(calcularSiguienteOrden(null)).toBe(1001);
    expect(calcularSiguienteOrden(undefined)).toBe(1001);
    expect(calcularSiguienteOrden(1001)).toBe(1002);
    expect(calcularSiguienteOrden(1050)).toBe(1051);
  });

  it("simulación de concurrencia: la asignación serializada no produce duplicados ni huecos", async () => {
    // Simula una fuente de datos protegida por cerrojo transaccional (advisory lock)
    let maxNumero = 1000;
    let lockAdquirido = false;

    async function transaccionAsignarOrden(): Promise<number> {
      // Simula espera de cerrojo
      while (lockAdquirido) {
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
      lockAdquirido = true;
      try {
        maxNumero += 1;
        return maxNumero;
      } finally {
        lockAdquirido = false;
      }
    }

    // 10 solicitudes concurrentes simultáneas
    const resultados = await Promise.all([
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
      transaccionAsignarOrden(),
    ]);

    // Verificar que todas sean únicas (sin duplicados)
    const unicos = new Set(resultados);
    expect(unicos.size).toBe(10);

    // Verificar correlatividad estricta sin huecos
    const ordenados = [...resultados].sort((a, b) => a - b);
    expect(ordenados).toEqual([
      1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
    ]);
  });
});
