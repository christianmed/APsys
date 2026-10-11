import { describe, expect, it } from "vitest";
import {
  calcularRotacionServicios,
  filtrarPedidosPorFecha,
  type PedidoRotacionInput,
  type ServicioCatalogo,
} from "@/lib/dashboard/rotacion-servicios";

describe("Cálculos de rotación de servicios (T-021a / RF-13)", () => {
  const catalogo: ServicioCatalogo[] = [
    { id: "s1", nombre: "Pendón Banner", activo: true, orden: 1 },
    { id: "s2", nombre: "Vinil Adhesivo", activo: true, orden: 2 },
    { id: "s3", nombre: "Microperforado", activo: true, orden: 3 },
    { id: "s4", nombre: "Letras Corpóreas", activo: true, orden: 4 },
  ];

  const pedidos: PedidoRotacionInput[] = [
    {
      id: "p1",
      anulado: false,
      creado_en: "2026-10-10T09:00:00Z",
      items: [
        { servicio_id: "s1", cantidad: 3, precio_usd: 60 }, // s1: 3 cant, $60
        { servicio_id: "s2", cantidad: 2, precio_usd: 30 }, // s2: 2 cant, $30
      ],
    },
    {
      id: "p2",
      anulado: false,
      creado_en: "2026-10-10T10:30:00Z",
      items: [
        { servicio_id: "s1", cantidad: 1, precio_usd: 20 }, // s1: 1 cant, $20
        { servicio_id: "s3", cantidad: 5, precio_usd: 100 }, // s3: 5 cant, $100
      ],
    },
    {
      id: "p3",
      anulado: true, // Pedido anulado: NO debe contar en métricas
      creado_en: "2026-10-10T11:00:00Z",
      items: [
        { servicio_id: "s1", cantidad: 10, precio_usd: 500 },
        { servicio_id: "s4", cantidad: 1, precio_usd: 300 },
      ],
    },
    {
      id: "p4",
      anulado: false,
      creado_en: "2026-09-01T15:00:00Z", // Fecha fuera del rango de octubre
      items: [
        { servicio_id: "s4", cantidad: 2, precio_usd: 200 },
      ],
    },
  ];

  it("filtra pedidos por rango de fechas omitiendo anulados", () => {
    const inicioOctubre = new Date("2026-10-01T00:00:00Z");
    const finOctubre = new Date("2026-10-31T23:59:59Z");

    const filtrados = filtrarPedidosPorFecha(pedidos, inicioOctubre, finOctubre);

    expect(filtrados.length).toBe(2); // p1 y p2 (p3 anulado, p4 es de septiembre)
    expect(filtrados.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("calcula la rotación por servicio con totales de cantidad, órdenes e ingresos", () => {
    const pedidosActivos = pedidos.filter((p) => !p.anulado && p.creado_en.startsWith("2026-10"));

    const resultado = calcularRotacionServicios(catalogo, pedidosActivos);

    expect(resultado.resumen.total_ordenes_procesadas).toBe(2);
    expect(resultado.resumen.total_items_producidos).toBe(11); // 3 + 2 + 1 + 5 = 11
    expect(resultado.resumen.total_ingresos_usd).toBe(210); // 60 + 30 + 20 + 100 = 210

    // Servicio s1: Pendón Banner (aparece en 2 órdenes, 4 unidades, $80)
    const s1 = resultado.metricasPorServicio.find((s) => s.servicio_id === "s1");
    expect(s1).toBeDefined();
    expect(s1?.cantidad_total).toBe(4);
    expect(s1?.ordenes_count).toBe(2);
    expect(s1?.ingresos_usd).toBe(80);
    expect(s1?.porcentaje_ingresos).toBe(38); // 80 / 210 = 38%
    expect(s1?.porcentaje_cantidad).toBe(36); // 4 / 11 = 36%

    // Servicio s3: Microperforado (aparece en 1 orden, 5 unidades, $100 -> líder en ingresos)
    const s3 = resultado.metricasPorServicio.find((s) => s.servicio_id === "s3");
    expect(s3).toBeDefined();
    expect(s3?.cantidad_total).toBe(5);
    expect(s3?.ingresos_usd).toBe(100);
    expect(s3?.porcentaje_ingresos).toBe(48); // 100 / 210 = 48%

    // Servicio s4: Letras Corpóreas (sin demanda en octubre -> 0)
    const s4 = resultado.metricasPorServicio.find((s) => s.servicio_id === "s4");
    expect(s4).toBeDefined();
    expect(s4?.cantidad_total).toBe(0);
    expect(s4?.ingresos_usd).toBe(0);
    expect(s4?.ordenes_count).toBe(0);

    // Identificación de líderes
    expect(resultado.resumen.servicio_lider_ingresos?.nombre).toBe("Microperforado");
    expect(resultado.resumen.servicio_lider_volumen?.nombre).toBe("Microperforado");
    expect(resultado.resumen.servicios_sin_demanda.length).toBe(1);
    expect(resultado.resumen.servicios_sin_demanda[0].nombre).toBe("Letras Corpóreas");
  });

  it("ordena por mayor demanda (volumen) o mayor ingreso", () => {
    const pedidosActivos = pedidos.filter((p) => !p.anulado && p.creado_en.startsWith("2026-10"));

    const porIngreso = calcularRotacionServicios(catalogo, pedidosActivos, "mayor_ingreso");
    expect(porIngreso.metricasPorServicio[0].nombre).toBe("Microperforado"); // $100
    expect(porIngreso.metricasPorServicio[1].nombre).toBe("Pendón Banner"); // $80
    expect(porIngreso.metricasPorServicio[2].nombre).toBe("Vinil Adhesivo"); // $30
    expect(porIngreso.metricasPorServicio[3].nombre).toBe("Letras Corpóreas"); // $0

    const porDemanda = calcularRotacionServicios(catalogo, pedidosActivos, "menor_demanda");
    // Menor demanda primero: Letras Corpóreas (0)
    expect(porDemanda.metricasPorServicio[0].nombre).toBe("Letras Corpóreas");
  });
});
