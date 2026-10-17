# 📚 Guía Detallada: Paginación por Cursor en APSys

## ¿Qué es la Paginación por Cursor?

La paginación por cursor usa **un valor de referencia (cursor)** que indica dónde pararte en los datos, en lugar de un número fijo (como "página 2" o "offset 50"). Esto elimina la **ronda de cálculo de offset** y permite:

| Tipo   | Problema                                       | Solución Cursor                             |
| ------ | ---------------------------------------------- | ------------------------------------------- |
| Offset | `OFFSET 10000` con datos insertados → se rompe | Cursor es inmutante: siempre va hacia atrás |
| Cursor | Simple, eficiente, escalable                   | No necesitas calcular offsets               |

---

## 🎯 Por Qué Usar Cursor para APSys

Tu caso de uso (clientes y pedidos) tiene estos requisitos:

```typescript
// Requirimientos del sistema
const limit = 25; // Pagina de 25 a la vez
const maxRecords = 100_000; // Cliente base tiene ~100k registros
const orden = "created_at DESC"; // Recentes primero
```

| Técnica                                | Problema en tu caso                                                | Cursor es ideal porque:                    |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Offset (`WHERE id > 50`)               | Si insertas más datos, el offset se desvía del inicio              | Cursor es un UUID/fijo que nunca cambia    |
| Offset + `ORDER BY created_at`         | Si hay datos en desorden, el cursor puede saltar datos importantes | Cursor siempre sigue la secuencia estricta |
| **Cursor (`created_at < 1234567890`)** | ❌ No aplica aquí                                                  | ✅ Se mantiene simple y predecible         |

**Nota:** En PostgreSQL, usas **offset** si necesitas partir desde el inicio o desde una posición específica. Pero para una paginación de "los últimos N registros", cursor es más eficiente.

---

## 🛠️ Implementación Detallada

### 1. Estructura de Componente (Client-Side)

```typescript
// hooks/use-paginacion-cursor.ts
export interface PaginationState<T> {
  items: T[];
  hasMore: boolean;
  cursor: string | number;
  loading: boolean;
  error?: Error;
}

export function usePaginacionCursor<T>(
  fetchFn: (params: { limit: number; cursor?: string }) => Promise<T[]>,
): PaginationState<T> {
  const [state, setState] = useState<PaginationState<T>>({
    items: [],
    hasMore: true,
    cursor: null,
    loading: false,
    error: null,
  });

  const loadItems = async (limit: number) => {
    try {
      state.loading = true;
      const data = await fetchFn({ limit, cursor: state.cursor });

      if (data.length === 0) {
        state.hasMore = false;
        return;
      }

      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...data],
        loading: false,
        hasMore: data.length < limit,
        cursor: prev.cursor || null,
      }));
    } catch (error) {
      state.error = error as Error;
      state.loading = false;
    }
  };

  const fetchNextPage = () => {
    if (!state.hasMore) return;
    loadItems(25);
  };

  const fetchPrevPage = () => {
    // Para paginación hacia atrás (opcional para móviles)
    const lastItem = state.items[state.items.length - 1];
    loadItems({ limit: 25, cursor: lastItem?.created_at } as any);
  };

  return { state, fetchNextPage, fetchPrevPage };
}
```

### 2. Ejemplo en API Supabase (`lib/supabase/paginat.ts`)

```typescript
// lib/supabase/paginat.ts
import { db } from "./supabase";
import type { Client } from "@supabase/supabase-js";

export interface PaginacionParams<T> {
  limit: number;
  cursor?: any; // El valor del cursor (ej. fecha, id, etc.)
}

export interface PaginadoResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string | number;
}

// Ejemplo: Paginación de clientes por creación
export async function paginarClientes(
  limit: number,
  cursor: string | null = null,
): Promise<PaginadoResult<Client>> {
  const { count } = await db.client.query({
    method: "count",
    params: { limit, cursor },
  });

  // O usar directamente el select con cursor
  const result = await db.client.query(
    `SELECT * FROM clientes 
     WHERE created_at < ${cursor}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    { params: { limit, cursor } },
  );

  return {
    items: result.rows as Client[],
    hasMore: result.count > limit,
    nextCursor:
      result.rows.length > limit
        ? result.rows[result.rows.length - 1].created_at
        : null,
  };
}

// Ejemplo: Paginación de pedidos
export async function paginarPedidos(
  limit: number,
  cursor: string | null = null,
): Promise<PaginadoResult<Pedido>> {
  const result = await db.client.query(
    `SELECT * FROM pedidos 
     WHERE created_at < ${cursor}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    { params: { limit, cursor } },
  );

  return {
    items: result.rows as Pedido[],
    hasMore: result.count > limit,
    nextCursor:
      result.rows.length > limit
        ? result.rows[result.rows.length - 1].created_at
        : null,
  };
}
```

### 3. Ejemplo en Componente de Cliente (Next.js)

```typescript
// components/PaginaClientes.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  creado_en: string;
}

export function PaginaClientes() {
  const [paginacion, setPaginacion] = useState({
    items: [],
    loading: false,
    hasMore: true,
    cursor: null as string | null,
    page: 1
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await paginarClientes(25, paginacion.cursor);

      setPaginacion(prev => ({
        ...prev,
        items: response.items,
        hasMore: response.hasMore,
        loading: false,
        cursor: response.nextCursor
      }));
    } catch (error) {
      console.error('Error cargando clientes', error);
    }
  };

  // Botones de navegación
  const cargarAnterior = () => {
    if (!paginacion.hasMore) return;
    setPaginacion(prev => ({
      ...prev,
      cursor: paginacion.cursor ? prev.items[0].created_at : null
    }));
    cargarClientes();
  };

  const cargarSiguiente = () => {
    if (!paginacion.hasMore) return;
    setPaginacion(prev => ({
      ...prev,
      cursor: prev.items[prev.items.length - 1].created_at
    }));
    cargarClientes();
  };

  // Componente visual
  return (
    <div>
      {/* Lista de clientes */}
      <ul className="list-disc pl-5">
        {paginacion.items.map((cliente, index) => (
          <li key={cliente.id}>
            <div className="flex items-center gap-3 mb-2">
              <span>{index + 1}</span>
              <span>{cliente.nombre}</span>
              <span>☎️ {cliente.teléfono}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Botones de paginación */}
      <div className="flex justify-center gap-2 mt-4">
        {paginacion.hasMore && (
          <button
            onClick={cargarSiguiente}
            disabled={!paginacion.hasMore}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cargar más ({paginacion.items.length + 25})
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4. Ejemplo: Componente con Skeletons y Estado de Carga

```typescript
// components/ListaClientesSkeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

export function ListaClientesSkeleton() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga con timeout
    setTimeout(() => {
      setItems([
        { id: '1', nombre: 'Cliente', telefono: '+34 600 000 000' },
        { id: '2', nombre: 'Cliente', telefono: '+34 601 000 000' },
        { id: '3', nombre: 'Cliente', telefono: '+34 602 000 000' },
        // Más elementos para simular
      ]);
      setLoading(false);
    }, 800);

    return () => setLoading(true);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <Skeleton key={index} height={60} />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              C
            </div>
            <span className="font-medium">{item.nombre}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

---

## 📋 Diagrama de Flujo de Paginación

```
┌─────────────────────────────────────────────────────────────┐
│                      PÁGINA 1                                  │
│  ┌───────────────────┐  cursor: null                       │
│  │                    │  ──[FETCH]──────────────              │
│  │  Cliente 1        │  ↓                                    │
│  │  Cliente 2        │  ──[PAGINA]──────────────              │
│  │  ...              │  ↓                                    │
│  │  Cliente 25        │                                  │
│  └───────────────────┘  cursor: "created_at < 1234567890"  │
│           ↑                                                       │
│          / \                                                       │
│         /   \                                                      │
│   Carga Anterior              Carga Siguiente                    │
│       ↓                              ↓                             │
│   cursor: "created_at < 1234567890"  cursor: "created_at < X"  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   PAGINA 2                                      │
│  ┌───────────────────┐  cursor: "2024-01-15T12:00:00"     │
│  │  Cliente 26        │  ──[FETCH]──────────────              │
│  │  Cliente 27        │  ↓                                    │
│  │  ...               │                                      │
│  │  Cliente 50        │                                      │
│  └───────────────────┘  cursor: "created_at < 1234567891"    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuración en Next.js Server Componente

### Ejemplo: API Route para Paginación

```typescript
// app/api/pedidos/route.ts
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import type { PaginadoResult } from "@/lib/supabase/paginat";

export async function GET(request: NextRequest) {
  try {
    // Extraer parámetros desde la query string
    const {
      limit = 25,
      page = "1",
      cursor,
    } = new URL(request.url).searchParams;
    const intLimit = parseInt(limit, 10);
    const intPage = parseInt(page, 10);

    // Obtener el cursor de la página anterior
    let prevCursor: string | null = null;

    // Para página 1, no hay cursor
    if (intPage > 1) {
      const paginadoPrevio = await paginarPedidos(intLimit - 1);
      prevCursor = paginadoPrevio.nextCursor as string;
    }

    // Ejecutar la consulta principal con cursor si existe
    const result = await paginarPedidos(intLimit, prevCursor);

    // Retornar con formato de respuesta
    return Response.json({
      items: result.items,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      currentPage: intPage,
      totalPages: Math.ceil(result.count / intLimit),
    });
  } catch (error) {
    console.error("Error en API de pedidos", error);
    return new Response("Error interno", { status: 500 });
  }
}
```

---

## 🚀 Implementación Rápida en tu Proyecto Actual

### Paso 1: Agregar Hook a `app/pedidos/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ListaPedidos() {
  const [datos, setDatos] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const cargarDatos = async (limite: number) => {
    try {
      // Consulta con cursor para paginación
      const { data } = await supabase
        .from('pedidos')
        .select('nombre_cliente, estado, creado_en')
        .order('creado_en', { ascending: false })
        .range(0, limite - 1) // Esto no funciona con cursor, ver abajo...

      // CORRECCIÓN: Usar select directo con offset en SQL
      // O mejor usar el hook personalizado con cursor
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const cargar = () => {
      cargDatos(25);
    };

    carg();
  }, [cursor]);

  return (
    <div>
      {datos.map((item, index) => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  );
}
```

### Paso 2: Mejorar con Supabase `select` + Cursor Real

```typescript
// lib/supabase/pedidos-cursor.ts
export async function obtenerPedidosPaginados(
  limit: number,
  cursor: string | null = null,
): Promise<{ items: any[]; hasMore: boolean }> {
  const sql = `
    SELECT * FROM pedidos
    WHERE creado_en < $1
    ORDER BY creado_en DESC
    LIMIT $2
  `;

  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .limit(limit)
    .order("creado_en", { ascending: false })
    .maybe("cursor");

  // Para cursor, usamos WHERE + ORDER BY + LIMIT
  const result = await supabase
    .from("pedidos")
    .select("*")
    .where("creado_en", "lt", cursor)
    .order("creado_en", { ascending: false })
    .limit(limit);

  const rows = result.data || [];

  // El nextCursor viene de los datos más antiguos (el primero en la lista)
  const nextCursor = rows[rows.length - 1]?.created_at;

  return {
    items: rows,
    hasMore: cursor ? true : false, // Esto no es correcto, ver abajo...
  };
}
```

### Paso 3: Solución Correcta (Cursor + Supabase Query Builder)

```typescript
// lib/supabase/pedidos-cursor.ts - SOLUCIÓN FINAL CORRECTA
import type { Client } from "@supabase/supabase-js";

export async function obtenerPedidosPaginados(
  limit: number,
  cursor: string | null = null,
): Promise<{ items: any[]; hasMore: boolean }> {
  // Si no hay cursor, paginamos por offset
  const sql = `
    SELECT * FROM pedidos
    ORDER BY creado_en DESC
    LIMIT $1
  `;

  const { data } = await supabase.from("pedidos").select("*").limit(limit);

  // Si hay cursor, usamos WHERE + ORDER BY + LIMIT
  if (cursor) {
    const sqlCursor = `
      SELECT * FROM pedidos
      WHERE creado_en < $1
      ORDER BY creado_en DESC
      LIMIT $2
    `;
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .limit(limit)
      .or(`(created_at < $1)`, { cursor });

    // O mejor: usar select con WHERE y LIMIT directamente en SQL
  }

  // SOLUCIÓN FINAL RECOMENDADA
  const result = await supabase
    .from("pedidos")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(limit)
    .range(cursor ? parseInt(cursor as number) : 0, limit - 1);

  return {
    items: result.data || [],
    hasMore: result.count > limit,
  };
}
```

---

## 🔄 Comparación: Offset vs Cursor en tu Caso

| Método     | SQL                                                  | Problema                              | Solución              |
| ---------- | ---------------------------------------------------- | ------------------------------------- | --------------------- |
| **Offset** | `WHERE created_at < '...' LIMIT 25`                  | Si insertas datos, el offset se rompe | Cursor es mejor       |
| **Cursor** | `WHERE created_at < 1234567890 ORDER BY... LIMIT 25` | -                                     | ✅ Ideal para tu caso |

**Mi recomendación:** Usa cursor con `created_at DESC` porque:

1. Los pedidos se ordenan por fecha de creación
2. El cursor es una fecha que nunca cambia (siempre apunta a la fila anterior)
3. No necesitas cálculos de offset

---

## 🧪 Ejemplo Completo: Componente ListaClientes con Paginación

```typescript
// app/clientes/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PaginaClientes() {
  const [clientes, setClientes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    cargarClientes();
  }, [cursor]);

  const cargarClientes = async () => {
    try {
      const { limit } = { limit: 25 };

      // Consulta con cursor para paginación
      const response = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Si hay cursor, agregar WHERE para filtrar
      if (cursor) {
        const sqlCursor = `WHERE created_at < $1`;
        await supabase
          .from('clientes')
          .select('*')
          .where(sqlCursor, { params: { created_at: new Date(cursor) } })
          .order('created_at', { ascending: false })
          .limit(limit);
      }

      setClientes(response.data || []);
      setHasMore(response.count > limit);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarSiguiente = () => {
    if (!hasMore) return;

    const ultimoCliente = clientes[clientes.length - 1];
    const nuevoCursor = ultimoCliente?.created_at ? new Date(ultimoCliente.created_at).toISOString() : null;

    setCursor(nuevoCursor);
  };

  return (
    <div>
      {/* Header de paginación */}
      <div className="flex justify-between items-center mb-6">
        <h1>Clientes ({clientes.length})</h1>
        {hasMore && (
          <span>Cargando más páginas...</span>
        )}
      </div>

      {/* Lista de clientes */}
      <ul className="list-disc pl-5 space-y-2">
        {clientes.map((cliente, index) => (
          <li key={cliente.id}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {string.from(cliente.id.slice(-2))}
              </div>
              <div>
                <p className="font-medium">{cliente.nombre}</p>
                <p className="text-sm text-gray-600">{cliente.telefono}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Botones de paginación */}
      {hasMore && (
        <button
          onClick={cargarSiguiente}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Cargar siguiente página
        </button>
      )}
    </div>
  );
}
```

---

## 📋 Resumen Final de la Solución

### ✅ Pasos para implementar en APSys:

| Paso | Acción                                                  | Tiempo  |
| ---- | ------------------------------------------------------- | ------- |
| 1    | Crear `lib/supabase/paginat.ts` con funciones genéricas | 2 horas |
| 2    | Actualizar `app/pedidos/page.tsx` con el hook           | 1 hora  |
| 3    | Actualizar `app/clientes/page.tsx` con paginación       | 1 hora  |
| 4    | Testar en E2E Playwright (nuevo test)                   | 2 horas |

### 🔧 Códos Clave a Copiar:

```typescript
// Librería centralizada
export async function obtenerPedidosPaginados(
  limit: number,
  cursor: string | null = null
): Promise<{ items: any[], hasMore: boolean }> {
  return await supabase
    .from('pedidos')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(limit)
    .range(cursor ? parseInt(cursor as number) : 0, limit - 1);
}

// Componente
export default function PaginaPedidos() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    obtenerPedidosPaginados(25).then(datos => {
      setPedidos(datos.items);
      // Lógica de hasMore y cursor
    });
  }, []);

  return (
    <ul>{pedidos.map(p => <li key={p.id}>{p.nombre}</li>)}</ul>
  );
}
```

---

## 🎯 Recomendación Final

**Implementa el cursor ya mismo.** Es:

- ✅ Más eficiente para bases de datos grandes
- ✅ Menos propenso a errores
- ✅ Más predecible
- ✅ Compatible con tu ordenamiento por fecha de creación

**El offset será más difícil de mantener en el futuro** si los usuarios agregan pedidos manualmente. El cursor siempre sabe dónde pararse.
