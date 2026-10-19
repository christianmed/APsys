# Manual Técnico de Arquitectura e Ingeniería del Sistema (APSys)

> **Documento Técnico Oficial — APSys**  
> **Versión del Documento:** 1.0.0  
> **Última Actualización:** 16 de Octubre de 2026  
> **Estado:** Vigente / Rama `feat/v1.0-blindaje-tecnico`  
> **Audiencia:** Desarrolladores, Arquitectos de Software, Administradores de Base de Datos y Operaciones (DevOps).

---

## 1. Propósito y Rutina Obligatoria de Mantenimiento

Este documento consolida la arquitectura completa, modelo de datos relacional, índices de rendimiento, mecanismos de seguridad, capas de validación, motores de sincronización y decisiones técnicas de **APSys**.

### Rutina Mandatoria de Actualización (Directriz de Ingeniería AGENTS.md)

De acuerdo con la **Regla 6** y la **Definition of Done** estipuladas en `AGENTS.md`:

1. Cada vez que se cree, modifique o elimine una tabla, columna, restricción o índice en PostgreSQL (`supabase/migrations/`), este manual debe actualizarse en la misma rama/commit.
2. Cada vez que se incorpore o ajuste un módulo de validación (`lib/validaciones/`), Server Action, endpoint de API o motor de sincronización de tasas, debe registrarse aquí su contrato y funcionamiento.
3. Todo cambio con impacto en la arquitectura de red, políticas de caché, seguridad RLS o sistema de diseño debe quedar reflejado de inmediato.

---

## 2. Visión General del Stack Tecnológico

APSys está construido sobre una arquitectura moderna orientada a la velocidad de respuesta, resiliencia y desacoplamiento de servicios:

```
[ Navegador Web / Mobile ]
         │
         ▼  (HTTPS / Next.js Proxy)
[ Next.js 16 App Router ] ── (Validación JWT Local < 1ms) ──► Proxy Headers (x-user-id, x-user-role)
         │
         ├── [ Contextos de Cliente (Client-First) ]
         │      ├── AuthContext (Sesión y rol reactivo sin parpadeo)
         │      └── TasasContext (Cálculo multimoneda USD/Bs instantáneo)
         │
         ├── [ Server Actions & API Routes ]
         │      ├── lib/validaciones/ (Sanitización y tipado estricto)
         │      ├── app/api/cron/sincronizar-tasas (Sincronización desatendida)
         │      └── lib/tasas/bcv-service.ts (Consumo DolarVZLA + Fallback)
         │
         ▼  (Conexión SSL Pooler / REST API)
[ Supabase Backend (PostgreSQL 15+) ]
         ├── RLS (Row Level Security por Rol)
         ├── Tablas Principales & Restricciones CHECK
         ├── Índices B-Tree de Alto Rendimiento (0006)
         └── Tabla Inmutable de Auditoría
```

### Componentes Principales:

- **Framework Frontend & SSR:** Next.js 16 (v16.4.0) con React 19 (v19.3.0), compilado de forma nativa con Turbopack.
- **Base de Datos & Auth:** Supabase (PostgreSQL 15 administrado, Supabase Auth con JWTs RFC 7519, Supabase SSR `@supabase/ssr`).
- **Sistema de Diseño:** Tailwind CSS v4, Paleta oficial Zinc, Iconografía Lucide React.
- **Testing & QA:** Vitest + React Testing Library (más de 225 pruebas unitarias automatizadas).

---

## 3. Arquitectura de Navegación y Rendimiento (Client-First)

Para garantizar transiciones de pantalla instantáneas (< 80ms) y eliminar bloqueos o parpadeos en el Sidebar:

### 3.1 Validación Local de JWT en Proxy (`lib/supabase/jwt-session.ts`)

- **Problema previo:** En cada cambio de ruta, el middleware/proxy de Next.js invocaba `supabase.auth.getUser()`, generando una llamada remota de red que añadía entre 1.5s y 2.5s de latencia.
- **Solución implementada:** `jwt-session.ts` decodifica e inspecciona criptográficamente el token JWT almacenado en las cookies del navegador. Si el token no ha expirado (`exp > Date.now() / 1000`), valida la sesión en **< 1ms** en memoria local.
- **Propagación por Cabeceras:** El proxy inyecta cabeceras seguras (`x-user-id`, `x-user-email`, `x-user-role`), permitiendo a las Server Actions y Server Components conocer la identidad del usuario sin consultar nuevamente a Supabase Auth.

### 3.2 Estado Reactivo en el Cliente (`context/`)

- `AuthContext`: Provee el estado del usuario (`usuario`, `rol`, `cargando`) al árbol de componentes.
- `TasasContext`: Almacena en memoria las tasas del día (USD y EUR) y las del siguiente día hábil, hidratadas desde caché local (`localStorage`) y revalidadas en segundo plano contra `/api/tasas/en-vivo`.
- `AuthenticatedShell`: Renderiza el cascarón de navegación una sola vez en el cliente, evitando que el Sidebar se desmonte al cambiar entre pestañas.

---

## 4. Capa de Validación y Sanitización Centralizada (`lib/validaciones/`)

Toda entrada proveniente de formularios, APIs o Server Actions se somete a validación estricta y desinfección antes de tocar la capa de base de datos.

### Estructura de Módulos:

```
lib/validaciones/
├── comun.ts       # Funciones base (UUID, sanitización de strings, teléfonos)
├── cliente.ts     # Validadores de creación y edición de clientes
├── pedido.ts      # Validadores de órdenes, ítems, cambios de estado y anulación
├── pago.ts        # Validadores de transacciones financieras y referencias
└── index.ts       # Re-exportador centralizado
```

### 4.1 Utilidades Base (`comun.ts`)

- **`esUUIDValido(valor)`**: Verifica si un identificador cumple estrictamente con el estándar RFC 4122 (UUID v4 hexadecimal: `^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`). Previene ataques de inyección en parámetros de consulta.
- **`sanitizarTexto(valor, maxLongitud)`**:
  - Elimina caracteres de control ASCII (`\x00-\x1F` y `\x7F-\x9F`), exceptuando saltos de línea (`\n`, `\r`) y tabuladores en campos de notas.
  - Recorta espacios en blanco en los extremos (`trim`).
  - Trunca preventivamente al límite máximo de caracteres para evitar ataques de denegación de servicio por memoria.
- **`normalizarTelefono(telefono)`**: Limpia caracteres no telefónicos, dejando únicamente dígitos, espacios y el prefijo `+`.

### 4.2 Validadores de Clientes (`cliente.ts`)

- **Nombre:** Obligatorio, longitud entre 1 y 150 caracteres. Rechaza cadenas compuestas únicamente por espacios.
- **Teléfono:** Opcional, pero si se provee debe tener entre 7 y 30 caracteres tras ser normalizado.
- **Notas:** Sanitizadas, longitud máxima de 1000 caracteres.

### 4.3 Validadores de Pedidos (`pedido.ts`)

- **Cliente:** `cliente_id` debe ser un UUID válido.
- **Ítems:** Array obligatorio con al menos 1 ítem.
  - `servicio_id`: UUID válido.
  - `cantidad`: Entero mayor o igual a 1.
  - `precio_usd`: Numérico mayor o igual a 0.
  - `descripcion`, `dimensiones`, `acabados`: Sanitizados, longitud máxima de 300 caracteres cada uno.
- **Estados Permitidos:** `'recibido'`, `'en_produccion'`, `'listo'`, `'entregado'`, `'cancelado'`.
- **Anulación:** Requiere obligatoriamente un `motivo` sanitizado con longitud mínima de 5 caracteres.

### 4.4 Validadores de Pagos (`pago.ts`)

- **`pedido_id`**: UUID válido.
- **`monto`**: Numérico estrictamente mayor a 0 (`monto > 0`). Rechaza montos negativos o en cero.
- **`moneda`**: Debe ser exclusivamente `'USD'` o `'Bs'`.
- **`referencia`**: Sanitizada, alfanumérica, longitud máxima de 100 caracteres.
- **`tasa_id`**: Opcional, pero si se suministra debe ser un UUID válido.

---

## 5. Modelo Relacional de Base de Datos e Índices de Rendimiento

El backend de APSys opera sobre PostgreSQL 15 en Supabase. El esquema está diseñado para garantizar integridad referencial estricta y registros históricos inmutables.

### 5.1 Diagrama Entidad-Relación Conceptual

```
    ┌───────────────┐
    │   clientes    │
    └───────┬───────┘
            │ 1
            │
            │ N
    ┌───────▼───────┐          N ┌───────────────┐
    │    pedidos    ├───────────►│ tasas_cambio  │
    └───────┬───────┘            └───────────────┘
            │ 1
       ┌────┴────────────┐
       │ N               │ N
┌──────▼───────┐  ┌──────▼───────┐
│ pedido_items │  │    pagos     │
└──────┬───────┘  └──────────────┘
       │ N
       │
       │ 1
┌──────▼───────┐
│  servicios   │
└──────────────┘
```

### 5.2 Estructura de Tablas Núcleo

| Tabla          | Columnas Clave                                                                                                                               | Propósito / Reglas de Negocio                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `perfiles`     | `id`, `usuario_id`, `rol`                                                                                                                    | Relaciona `auth.users` con roles `'operativo'` o `'gerencial'`.                                                    |
| `clientes`     | `id`, `nombre`, `telefono`, `notas`, `creado_en`                                                                                             | Catálogo de clientes. Teléfono no tiene restricción `UNIQUE` porque puede compartirse.                             |
| `servicios`    | `id`, `nombre`, `activo`, `orden`                                                                                                            | Catálogo de servicios de impresión. Usa borrado lógico (`activo = false`) para no corromper órdenes históricas.    |
| `tasas_cambio` | `id`, `valor_bs_por_usd`, `vigente_desde`, `creado_en`                                                                                       | Histórico inmutable de tasas. Las filas nunca se actualizan; cada cambio inserta una nueva vigencia.               |
| `pedidos`      | `id`, `numero_orden`, `cliente_id`, `estado`, `total_usd`, `tasa_id`, `anulado`, `motivo_anulacion`, `creado_en`, `listo_en`, `entregado_en` | Cabecera del contrato. `numero_orden` es un entero secuencial único. No se borra físicamente; se anula con motivo. |
| `pedido_items` | `id`, `pedido_id`, `servicio_id`, `descripcion`, `dimensiones`, `acabados`, `cantidad`, `precio_usd`                                         | Renglones del trabajo. `precio_usd` se almacena en moneda base.                                                    |
| `pagos`        | `id`, `pedido_id`, `monto`, `moneda`, `referencia`, `tasa_id`, `creado_en`                                                                   | Abonos y liquidaciones. `moneda in ('USD', 'Bs')`. Congela la `tasa_id` usada en el momento del pago.              |
| `auditoria`    | `id`, `entidad`, `entidad_id`, `accion`, `motivo`, `usuario_id`, `fecha`                                                                     | Bitácora inmutable de eventos sensibles (anulaciones, ajustes).                                                    |

---

### 5.3 Índices de Rendimiento y Optimización (`0006_indices_rendimiento.sql`)

Para garantizar que pantallas críticas como `/dashboard`, `/taller`, `/cuentas-por-cobrar` y `/pedidos` respondan en **< 15ms**, se diseñaron índices especializados B-Tree:

```sql
-- 1. Pedidos: Acelera ordenamiento cronológico en /pedidos y dashboard
CREATE INDEX IF NOT EXISTS pedidos_creado_en_desc_idx
  ON public.pedidos (creado_en DESC);

-- 2. Pedidos Activos: Filtro combinado para consultar órdenes no anuladas rápidamente
CREATE INDEX IF NOT EXISTS pedidos_anulado_creado_en_idx
  ON public.pedidos (anulado, creado_en DESC);

-- 3. Pagos: Agregación cronológica de ingresos en el Dashboard financiero (RF-11)
CREATE INDEX IF NOT EXISTS pagos_creado_en_desc_idx
  ON public.pagos (creado_en DESC);

-- 4. Ítems: Agregaciones de demanda y rotación de servicios (RF-13)
CREATE INDEX IF NOT EXISTS pedido_items_servicio_id_idx
  ON public.pedido_items (servicio_id);

-- 5. Clientes: Búsqueda rápida por nombre insensible a mayúsculas/minúsculas
CREATE INDEX IF NOT EXISTS clientes_nombre_lower_idx
  ON public.clientes (lower(nombre));
```

#### Resumen de Índices Existentes por Tabla:

- **`pedidos`**: `pedidos_cliente_id_idx`, `pedidos_estado_idx` (parcial `where not anulado`), `pedidos_listo_en_idx`, `pedidos_creado_en_desc_idx`, `pedidos_anulado_creado_en_idx`.
- **`pagos`**: `pagos_pedido_id_idx`, `pagos_creado_en_desc_idx`.
- **`pedido_items`**: `pedido_items_pedido_id_idx`, `pedido_items_servicio_id_idx`.
- **`clientes`**: `clientes_telefono_idx`, `clientes_nombre_lower_idx`.
- **`tasas_cambio`**: `tasas_cambio_vigente_desde_idx`.
- **`auditoria`**: `auditoria_entidad_idx` (`entidad, entidad_id`), `auditoria_fecha_idx` (`fecha DESC`).

---

### 5.4 Anatomía de un Fallo SQL y Garantías ACID en PostgreSQL

Durante el proceso de optimización técnica, se ejecutó una sentencia en el SQL Editor que produjo el siguiente error:
`ERROR: 42703: column "creado_en" does not exist` al intentar crear un índice sobre la tabla `auditoria`.

#### ¿Por qué ocurrió?

1. La tabla `auditoria` fue definida en `0001_schema.sql` utilizando la columna `fecha` (`fecha timestamptz not null default now()`) y no `creado_en`.
2. Adicionalmente, el índice `auditoria_fecha_idx` ya existía previamente en la base de datos desde la migración inicial.

#### ¿Por qué la base de datos NO sufrió ningún daño?

- **Propiedad de Atomicidad (ACID):** En PostgreSQL, cada bloque de ejecución o script SQL corre dentro de una transacción implícita o explícita.
- Cuando PostgreSQL encuentra un error de sintaxis o de columna inexistente (`42703`), aborta inmediatamente la transacción completa (`ROLLBACK`).
- Ninguna de las instrucciones erróneas se escribe en disco. El estado de las tablas, relaciones y datos preexistentes permanece exactamente igual al instante previo a la ejecución.
- La migración fue depurada y consolidada en `supabase/migrations/0006_indices_rendimiento.sql` conteniendo únicamente las sentencias limpias y verificadas.

---

### 5.5 Paginación de Alto Rendimiento por Cursor (Keyset Pagination)

Para evitar la sobrecarga de consultas sin límite en `/pedidos` y la restricción arbitraria de `limit(50)` en `/clientes`, se implementó el estándar de **Paginación por Cursor (Keyset Pagination)** con la técnica de sondeo `LIMIT + 1`.

#### Justificación Técnica (Keyset vs. Offset):

- **Evita O(N) Degradation:** En `OFFSET 5000 LIMIT 25`, PostgreSQL lee y descarta 5.000 filas. Con Keyset (`WHERE numero_orden < 1025 ORDER BY numero_orden DESC LIMIT 25`), la consulta utiliza directamente el índice B-Tree ejecutándose en tiempo constante **O(1) (< 2ms)**.
- **Inmunidad ante Inserciones Concurrentes:** Si entran 5 órdenes nuevas mientras el usuario consulta, la paginación tradicional duplica registros entre páginas. La paginación por cursor garantiza que la vista de registros anteriores permanezca inmutable y libre de duplicados o saltos.
- **Cero Sobrecarga de `COUNT(*)`:** La detección de páginas siguientes se realiza consultando `LIMIT 26` (25 registros para mostrar + 1 registro de control). Si se reciben 26 filas, se extrae el cursor del elemento 25 y se descarta el registro extra.

#### Módulos y Componentes:

- **`lib/paginacion/cursor.ts`:**
  - `procesarPaginacionCursor(items, limite, campoCursor)`: Función pura que determina `hayMas`, recorta a `limite` elementos y calcula `siguienteCursor`.
  - `construirUrlPaginacion(ruta, params)`: Serializa parámetros de URL preservando búsquedas (`q`) y descartando valores nulos.
- **`components/ui/cursor-pagination.tsx` (`CursorPagination`):**
  - Componente accesible mobile-first que renderiza:
    - Botón `[ Siguiente → ]`: Cuando `siguienteCursor` está presente.
    - Botón `[ ← Inicio ]`: Cuando el usuario ha avanzado de página (`cursorActivo` presente), permitiendo volver a las órdenes/clientes más recientes con un solo toque.
- **Implementación en Rutas:**
  - `/pedidos`: Cursor sobre la columna indexada `numero_orden` (numérico decreciente).
  - `/clientes`: Cursor sobre la columna indexada `creado_en` (timestamp ISO decreciente).

---

## 6. Motor de Tasas de Cambio, Doble Vigencia y Automatización (Cron)

APSys cuenta con un motor autónomo de tasas de cambio diseñado específicamente para la dinámica comercial y cambiaria de Venezuela (BCV).

```
[ DolarVZLA API ] ──(Falla de red)──► [ Fallback DolarAPI ]
         │
         ▼
[ lib/tasas/bcv-service.ts ]
         │
         ├── Evaluación de Fecha Oficial BCV vs. Fecha Hoy (Caracas UTC-4)
         │      ├── Fecha BCV <= Hoy   ──► Tasa Vigente para Hoy
         │      └── Fecha BCV > Hoy    ──► Tasa Programada para Mañana (00:00:00-04:00)
         │
         ├── Persistencia en DB (tasas_cambio con SUPABASE_SERVICE_ROLE_KEY)
         └── Revalidación de Caché Next.js (revalidatePath)
```

### 6.1 Lógica de Doble Vigencia (Hoy vs. Mañana)

- A partir de las 3:00 PM o 5:00 PM (hora de Caracas), el BCV publica frecuentemente la tasa que regirá el **siguiente día hábil**.
- Si el sistema actualizara ciegamente la tasa activa, los pedidos del final de la tarde del día actual se cotizarían con el precio del día siguiente, generando discrepancias contables.
- **Solución implementada:**
  - Si la fecha devuelta por la API es mayor a la fecha de hoy en Caracas, el sistema programa la vigencia con fecha del día siguiente a las `00:00:00-04:00`.
  - En `/pedidos/nuevo`, el usuario comercial puede visualizar la tasa de hoy y, opcionalmente, elegir la tasa de mañana si está elaborando un presupuesto diferido.
  - El Sidebar (`SidebarTasasCard`) resalta con un badge ámbar la existencia de una tasa futura lista para entrar en vigor a medianoche.

### 6.2 Automatización Desatendida con Vercel Cron

- **Ruta de Ejecución:** `app/api/cron/sincronizar-tasas/route.ts`.
- **Autenticación del Cron:** Requiere la cabecera `Authorization: Bearer <CRON_SECRET>`.
- **Ejecución con Privilegios Elevados:** Utiliza `SUPABASE_SERVICE_ROLE_KEY` para insertar la nueva tasa en la base de datos saltándose temporalmente las restricciones de RLS que requieren sesión interactiva de usuario.
- **Configuración en `vercel.json`:**
  - `30 22 * * 1-5` (22:30 UTC / 6:30 PM Caracas, Lunes a Viernes): Sincronización vespertina optimizada para capturar la tasa del día siguiente, 100% compatible con el límite de 1 cron diario del plan **Vercel Hobby**.
  - En entornos con Vercel Pro, puede habilitarse adicionalmente el turno de medianoche (`5 4 * * *` / 12:05 AM Caracas).

### 6.3 Micro-Webhook de Alertas por Telegram (`lib/notificaciones/telegram.ts`)

Para que el personal de gerencia y tecnología tenga visibilidad inmediata ante incidencias sin intervención humana, se integró un micro-cliente HTTP nativo de Telegram:

- **Cero Dependencias de Terceros:** Construido con `fetch` nativo sobre `https://api.telegram.org/bot<TOKEN>/sendMessage`.
- **Comportamiento Fail-Safe:** Si las variables `TELEGRAM_BOT_TOKEN` o `TELEGRAM_CHAT_ID` no están presentes (o si Telegram sufre una caída de red), la función captura el error limpiamente y no bloquea ni rompe la ejecución del cron.
- **Disparadores de Alerta en `app/api/cron/sincronizar-tasas/route.ts`:**
  1. Caída o timeout simultáneo de DolarVZLA y el fallback de DolarApi.
  2. Respuesta malformada o vacía del servicio BCV.
  3. Errores de lectura o escritura en las tablas de Supabase (`tasas_cambio`).
- **Formato del Mensaje:** Alerta en HTML con fecha/hora de Caracas, detalle técnico del error y acción recomendada.

---

## 7. Políticas de Seguridad (RBAC y Row-Level Security)

La seguridad en APSys opera bajo el modelo **Defensa en Profundidad**:

```
[ Capa 1: Proxy / Middleware ] ──► Verificación de JWT activo
         │
         ▼
[ Capa 2: Server Actions ]    ──► Control de Rol (gerencial vs operativo)
         │
         ▼
[ Capa 3: Supabase RLS ]      ──► Reglas PostgreSQL a nivel de fila
```

### 7.1 Matriz de Roles y Permisos

- **Rol `operativo`:**
  - Creación y edición de clientes.
  - Creación de pedidos y comanda de ítems.
  - Transición de estados en el tablero de taller (`recibido` → `en_produccion` → `listo` → `entregado`).
  - Registro de pagos y abonos.
  - Sincronización asistida de tasa BCV a 1 toque (habilitado en Migración 0005).
  - _Prohibido:_ Anular órdenes de trabajo, ver reportes de ingresos en el Dashboard o alterar tablas maestras.
- **Rol `gerencial`:**
  - Acceso total a todas las vistas operativas y administrativas.
  - Visualización del Dashboard Gerencial de Ingresos (RF-11) y Rotación de Servicios (RF-13).
  - Anulación formal de órdenes con registro mandatorio de motivo.
  - Inspección de la bitácora inmutable de auditoría.

### 7.2 Políticas RLS en PostgreSQL (`0002_rls.sql` y `0005_...`)

- **`tasas_cambio`**: Lectura abierta para cualquier usuario autenticado (`auth.uid() IS NOT NULL`). Inserción autorizada para roles `gerencial` y `operativo`. Actualizaciones (`UPDATE`) y eliminaciones (`DELETE`) denegadas globalmente.
- **`auditoria`**: Inserción autorizada para Server Actions; lectura restringida a `gerencial`. Operaciones `UPDATE` y `DELETE` bloqueadas sin excepción (append-only).
- **`pedidos`**: Inserción y lectura para usuarios autenticados. `UPDATE` en columna `anulado` restringido exclusivamente a perfiles con `rol = 'gerencial'`.

---

## 8. Sistema de Diseño, Ergonomía y Directrices Mobile-First

El sistema visual de APSys está optimizado para funcionar tanto en computadoras de escritorio de recepción y gerencia como en teléfonos inteligentes y tablets de operarios en planta.

### 8.1 Viewport y Prevención de Desbordamiento

- En `app/layout.tsx`: Configurado `viewport: { width: 'device-width', initialScale: 1 }`.
- En `components/shell/app-shell.tsx`: Clases `min-w-0 max-w-full overflow-x-hidden` aplicadas al contenedor raíz `<main>`.
- Regla de oro de ingeniería: En ninguna vista ni resolución (desde 360px hasta 4K) `scrollWidth` puede exceder `clientWidth`.

### 8.2 Componente Universal `CustomSelect` (`components/ui/custom-select.tsx`)

- Sustituye selectores `<select>` nativos que presentaban comportamientos inconsistentes entre navegadores y sistemas operativos.
- Implementa atributos WAI-ARIA completos (`role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded`).
- Navegación completa por teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`).
- **Control de Scrollbars:** Diseñado con un solo contenedor con scroll interior (`max-h-60 overflow-y-auto`) para evitar barras de desplazamiento dobles o anidadas.

### 8.3 Utilidad de Scrollbars Ocultas (`app/globals.css`)

- Para carruseles horizontales de botones (filtros de tiempo, pestañas de antigüedad en Cuentas por Cobrar), se diseñaron las clases `.scrollbar-none` y `.no-scrollbar`:
  ```css
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none !important;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none !important;
    width: 0;
    height: 0;
  }
  ```
- Permite desplazamiento táctil horizontal 100% fluido en móviles sin barras grises que afeen la interfaz.

---

## 9. Procedimientos Operativos de Base de Datos y Backups

### 9.1 Respaldo Criptográfico de Datos (`scripts/backup-supabase.mjs`)

- Exporta en formato JSON todas las tablas del sistema.
- Calcula y estampa un hash criptográfico **SHA-256** del contenido exportado para garantizar la inmutabilidad y verificar que los archivos de respaldo no hayan sido manipulados.

### 9.2 Restauración Segura (`scripts/restore-supabase.mjs`)

- Valida la integridad del archivo contra el hash SHA-256 antes de iniciar la restauración.
- Inserta los registros respetando el orden estricto de dependencias de clave foránea:
  `perfiles` → `clientes` → `servicios` → `tasas_cambio` → `pedidos` → `pedido_items` → `pagos` → `plantillas` → `auditoria`.

### 9.3 Aplicación de Migraciones en Supabase Studio

Para aplicar scripts de optimización o migraciones estructurales:

1. Acceder al dashboard de Supabase del proyecto.
2. Ingresar a la sección **SQL Editor**.
3. Abrir o pegar el contenido de la migración (ej. `supabase/migrations/0006_indices_rendimiento.sql`).
4. Presionar **Run**.
5. Verificar el mensaje `Success. No rows returned` y constatar la creación de los índices en **Database > Indexes**.

---

## 10. Módulo Autónomo de Tasas BCV y Dinámica de Calendario Bancario

El módulo de tasas de cambio está diseñado como una capacidad autónoma, modular y portable para cualquier sistema transaccional que liquide en Bolívares (VES) y Dólares (USD).

### 10.1 Arquitectura Desacoplada y Componentes

1. **Persistencia e Inmutabilidad (`tasas_cambio`):**  
   Almacena cada vigencia con precisión `NUMERIC(16, 4)` y fecha/hora con zona horaria (`TIMESTAMPTZ`). Los pedidos retienen la tasa histórica exacta de su creación o abono.
2. **Servicio de Integración y Caché (`lib/tasas/bcv-service.ts`):**  
   Consumo unificado de `https://rates.dolarvzla.com/bcv/current.json` (USD + EUR) con fallback automático de alta disponibilidad a `https://ve.dolarapi.com/v1`. Dispone de caché en memoria RAM con TTL de 15 minutos en el servidor para evitar llamadas HTTP redundantes en cada petición SSR.
3. **Lógica Pura y Calendario Bancario (`lib/tasas/tasas.ts`):**  
   - `calcularDiferenciaDiasCaracas`: Calcula la distancia exacta en días naturales calendario según la zona horaria `America/Caracas` (UTC-4), blindado contra saltos horarios.
   - `describirEstadoVigencia`: Clasifica dinámicamente cada registro histórico (`vigente_hoy`, `vigente_fin_de_semana`, `programada_manana`, `programada_proximo_dia_habil`, `historica`).
   - `formatearEtiquetaSidebar`: Genera las etiquetas de los acordeones del Sidebar (`Hoy`, `Vigente • DD/MM`, `Mañana`, `Lunes, DD/MM`).
4. **Automatización Desatendida (`app/api/cron/sincronizar-tasas/route.ts`):**  
   Vercel Cron ejecutado a las 6:30 p. m. (detección vespertina) y 12:05 a. m. (inicio de jornada) con cabecera `CRON_SECRET` y webhook de contingencia por Telegram.
5. **Blueprint para Replicación con IA (`docs/arquitectura/modulo-tasas-bcv-blueprint.md`):**  
   Documento rector que contiene el **Prompt Maestro** para clonar este módulo íntegro en otros proyectos mediante herramientas de IA (Claude, Gemini, ChatGPT, Antigravity) con un solo comando.

---

## 11. Blindaje Estricto de Entregas (Saldo $0 Obligatorio) y Catálogo de Servicios

### 11.1 Regla de Negocio: Entrega Física Exclusiva con Saldo Cero ($0.00)

Para garantizar la integridad financiera del taller y erradicar entregas con saldo pendiente por error humano:

1. **Máquina de Estados de Pedidos (`lib/pedidos/estados.ts`):**
   - La función `validarCambioEstado` evalúa el parámetro `saldoPendienteUsd`.
   - Si `nuevoEstado === "entregado"` y `saldoPendienteUsd > 0.005`, la transición es rechazada formalmente:
     `{ valido: false, error: "No se puede entregar el pedido: tiene un saldo pendiente de $X.XX. Debe liquidarse el pago antes de realizar la entrega física." }`.
   - Transiciones a estados operativos anteriores (`recibido` → `en_produccion` → `listo`) están permitidas aún con saldo pendiente, garantizando que el flujo de manufactura no se detenga.
2. **Server Action `cambiarEstadoPedido` (`app/pedidos/actions.ts`):**
   - Cuando se solicita avanzar a `"entregado"`, consulta la tabla `pagos` y `tasas_cambio`, calcula la sumatoria de pagos recibidos en USD o Bs y computa el `saldoPendienteUsd`.
   - Si existe saldo pendiente, aborta inmediatamente antes de actualizar la tabla `pedidos`.
3. **Acción Atómica `cobrarYEntregarPedido` (`app/pedidos/actions.ts`):**
   - Diseñada para la agilidad de mostrador y taller (≤ 3 segundos).
   - Recibe `{ pedidoId, datosPago: { monto, moneda, referencia } }`.
   - Valida que el monto satisfaga la totalidad de la deuda pendiente (con tolerancia de 1 centavo para redondeos).
   - Inserta el registro correspondiente en la tabla `pagos` y actualiza el pedido a `estado = "entregado"`, fijando `entregado_en = now()`.
   - Revalida instantáneamente las rutas `/pedidos`, `/taller`, `/clientes`, `/clientes/[id]`, `/cuentas-por-cobrar` y `/dashboard`.

### 11.2 Experiencia en Tablero Kanban de Taller (`app/taller/taller-tablero.tsx`)

- **Pedidos en columna "Listo" con Saldo Pendiente (`saldo_usd > 0`):**
  - El botón principal verde de entrega se transmuta dinámicamente en un botón ámbar de alta visibilidad:
    `[ 💵 Cobrar Saldo y Entregar (Resta: $X.XX) ]`.
  - Al presionarlo, despliega el componente modal `CobrarYEntregarModal` (`app/taller/cobrar-entregar-modal.tsx`), el cual calcula en tiempo real la deuda en USD y Bs a la tasa del pedido, permitiendo registrar la cobranza y entregar la orden sin abandonar el tablero.
- **Pedidos en columna "Listo" 100% Pagados (`saldo_usd === 0`):**
  - Presenta el botón verde directo: `[ 📦 1 TOQUE: Entregar al Cliente ]`.

### 11.3 Supresión de Enlace de Cobro en Historial de Cliente (`/clientes/[id]`)

- En la ficha de detalle e historial del cliente (`app/clientes/[id]/historial-cliente-view.tsx`), el botón WhatsApp **"Cobrar"** queda condicionado a `pedido.estado !== 'entregado'`.
- Dado que un pedido entregado ya está completamente saldado, se evita enviar mensajes de cobro extemporáneos o erróneos a los clientes.

### 11.4 Catálogo de Servicios: Prioridad, Baja Lógica y Borrado Seguro

1. **Prioridad en Catálogo (Posición):**
   - El campo `orden` en la tabla `servicios` se expone en la interfaz como `Prioridad en Catálogo (Posición)` con texto explicativo. Los números menores (1, 2, 3...) priorizan la visibilidad del servicio en los selectores desplegables al crear órdenes.
2. **Baja Lógica (`activo: boolean`):**
   - Desactivar un servicio lo oculta inmediatamente de `/pedidos/nuevo` sin alterar ni borrar las filas de `pedido_items` vinculadas a órdenes históricas.
3. **Eliminación Física Segura (`eliminarServicio` en `app/servicios/actions.ts`):**
   - Solo autorizada para perfil `gerencial`.
   - Consulta el conteo de registros en `pedido_items` asociados al `servicio_id`.
   - **Si `COUNT(pedido_items) === 0`:** Permite la eliminación permanente del registro en la tabla `servicios` (ideal para depurar servicios de prueba).
   - **Si `COUNT(pedido_items) > 0`:** Bloquea la acción invocando `validarEliminacionServicio` (`lib/validaciones/servicio.ts`), explicando al operador la imposibilidad técnica de borrado físico y sugiriendo la baja lógica.
   - En el formulario `ServicioForm`, los servicios con pedidos asociados ocultan el botón de eliminación y muestran un banner informativo de **Protección de Integridad Histórica**.

---

## 12. Arquitectura Centralizada de Fechas Caracas, Consistencia de Contadores y Estilos de Taller (Fase 32)

### 12.1 Módulo Centralizado de Fechas (`lib/fechas.ts`) — Single Source of Truth

Para eliminar inconsistencias causadas por la diferencia horaria entre los servidores en la nube (que operan en UTC +0) y el huso oficial de Venezuela (UTC-4, `America/Caracas`), se estableció `lib/fechas.ts` como la única fuente de verdad temporal para todo el sistema:

1. **Inmunidad a Desfase de Servidores Cloud:**
   - En servidores Vercel o AWS Lambda en UTC, a partir de las 8:00 p. m. en Caracas ya es el día siguiente en UTC.
   - Las funciones de `lib/fechas.ts` (`obtenerFechaYmdCaracas`, `formatearFechaLargaCaracas`, `formatearFechaHoraCaracas`) utilizan explícitamente `{ timeZone: "America/Caracas", locale: "es-VE" }`, garantizando que la fecha mostrada corresponda siempre al día calendario en curso en Venezuela sin importar dónde se ejecute el SSR.
2. **Límites de Jornada y Rangos de Reportes:**
   - `obtenerInicioFinDiaCaracas`: Devuelve las marcas de tiempo ISO (UTC) correspondientes exactamente a las `00:00:00.000` y `23:59:59.999` de la jornada en Caracas.
   - `obtenerRangoPresetCaracas`: Calcula los intervalos para los filtros del dashboard gerencial (`hoy`, `esta_semana`, `este_mes`, `todo`). `lib/dashboard/ingresos.ts` delega el cálculo de fechas en esta función, asegurando que el filtro "Hoy" no salte prematuramente a las 8:00 p. m.
3. **Badge Reactivo de Fecha en Vivo (`components/shell/fecha-en-vivo-badge.tsx`):**
   - Montado en el banner principal del Home (`app/page.tsx`).
   - Se actualiza automáticamente al cruzar la medianoche en Caracas sin necesidad de recargar la página web, programando un temporizador exacto (`obtenerTiempoHastaMedianocheCaracas`) y un intervalo de respaldo cada 60 segundos.

### 12.2 Consistencia de Contadores de Producción (Home vs. Taller)

1. **Estados Canónicos del Modelo Relacional (`lib/pedidos/estados.ts`):**
   - Se corrigieron los filtros en `app/page.tsx`, eliminando estados obsoletos de borradores iniciales (`registrado`, `imprimiendo`) que provocaban lecturas en cero.
   - La función `calcularContadoresProduccion` unifica los cálculos para toda la aplicación:
     - `porIniciar`: Pedidos con `estado === "recibido"` (no anulados).
     - `enProduccion`: Pedidos con `estado === "en_produccion"` (no anulados).
     - `listos`: Pedidos con `estado === "listo"` (no anulados).
     - `totalActivos`: `porIniciar + enProduccion + listos` (excluyendo estrictamente `entregado` y `cancelado`).
2. **Unificación de Nomenclatura:**
   - Las tarjetas KPI del panel de inicio se alinearon con las pestañas del tablero de taller:
     - *"Por Iniciar"* (antes "Por Imprimir").
     - *"En Producción"* (antes "En Impresión").
     - *"Listos para Retiro"*.

### 12.3 Sistema de Conmutación Visual de Estilos en Taller (`app/taller/taller-tablero.tsx`)

Para responder al requerimiento de eliminar colores saturados estridentes y permitir la evaluación comparativa en vivo por parte del usuario, se implementó un conmutador interactivo con persistencia local (`localStorage.getItem("apsys_taller_estilo")`):

| Propuesta | Estilo Visual | Botón Recibido | Botón Producción | Botón WhatsApp | Botón Cobro / Entrega |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Estilo A (Recomendado)** | Minimalista Monocromático (Linear / Vercel) | `bg-zinc-900 text-white` con icono `Sparkles` azul sutil | `bg-zinc-900 text-white` con icono `CheckCircle2` ámbar | Outline refinado `border-emerald-300 bg-emerald-50/70 text-emerald-950` | `bg-zinc-900 text-white` con badge interior ámbar para saldos |
| **Estilo B** | Tonales Pastel Suaves (Apple HIG) | `border-sky-200 bg-sky-50 text-sky-900` | `border-amber-300 bg-amber-50 text-amber-950` | `border-emerald-200 bg-emerald-50 text-emerald-900` | `border-amber-300 bg-amber-100/70 text-amber-950` |
| **Estilo C** | Jerarquía Progresiva (Stripe) | Botón neutro `border-zinc-200 bg-white text-zinc-700` | Borde ámbar suave `border-amber-300/80 bg-amber-50/50` | Outline gris neutro | Botón sólido de certeza con peso visual en la fase final de cobro |

---

## 13. Sistema de Tema Claro/Oscuro Tokyo Night, Armonización de Home y Tarjetas de Taller por Estado (Fase 33)

### 13.1 Paleta Tokyo Night y Configuración Tailwind CSS v4

Para ofrecer una experiencia nocturna profesional con tonos azulados profundos y confort visual de estándar internacional, se adoptó la paleta **Tokyo Night**:

- **Canvas / Fondo Global (`--background`):** `#16161e` (canvas base de la aplicación).
- **Superficie de Tarjetas, Sidebar y Modales (`--surface`):** `#1a1b26` (elevación primaria para contenedores).
- **Superficies Interactivas y Botones Neutrales (`--surface-elevated`):** `#1f202c` (botones neutros, inputs, estados hover y badges).
- **Líneas y Micro-Bordes (`--border`):** `#24283b` y `#2f3654` (delimitadores sutiles de alto contraste).

En `app/globals.css`, se configuró la directiva oficial de Tailwind CSS v4 para soporte de modo oscuro por clase DOM:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### 13.2 Arquitectura de Tema (`ThemeProvider`) y Conmutador 0ms FOUC

1. **Contexto Unificado (`components/providers/theme-provider.tsx`):**
   - Hook `useTheme()` con funciones `theme`, `toggleTheme` y `setTheme`.
   - Persistencia automática en el navegador bajo la clave `apsys-theme` en `localStorage`.
   - Resiliencia arquitectónica: incluye fallback seguro `DEFAULT_THEME_CONTEXT` si un componente o test unitario se evalúa de manera aislada sin el proveedor.
2. **Eliminación Total de Parpadeo (0ms FOUC):**
   - En `app/layout.tsx`, se inyecta un script síncrono previo a la hidratación que inspecciona `localStorage.getItem("apsys-theme")` o `prefers-color-scheme: dark` y aplica la clase `.dark` a `document.documentElement` antes de que el navegador pinte el primer fotograma.
3. **Conmutador Ergonómico (`components/shell/theme-toggle-button.tsx`):**
   - Reemplaza la posición que ocupaba la etiqueta `v1.0.0` en la cabecera del Sidebar de escritorio.
   - Disponible en el header móvil junto al menú hamburguesa.
   - La versión `v1.0.0` fue reubicada discretamente al pie del Sidebar junto al perfil de usuario.

### 13.3 Tarjetas de Taller por Estado (`lib/taller/estilos-tarjeta.ts`) e Iconografía

El estado de la orden en el tablero de taller se comunica a través del fondo completo y el contorno de la tarjeta, manteniendo los botones 100% neutros:

- **Por Iniciar (`recibido`):** Tinte azul zafiro tenue (`border-sky-200 bg-sky-50/20 dark:border-sky-900/50 dark:bg-sky-950/15`). Botón neutral `#1f202c` con icono `Play` (inicio de producción).
- **En Producción (`en_produccion`):** Tinte ámbar noche suave (`border-amber-200 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/15`). Botón neutral `#1f202c` con icono `Printer` (impresora en marcha).
- **Listo para Retiro (`listo`):** Tinte esmeralda bosque sutil (`border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/15`).
  - Si tiene saldo pendiente: botón de cobro prioritario con icono `HandCoins`.
  - Si saldo es $0: botón de entrega final con icono `PackageCheck`.
- **Aviso WhatsApp (`app/pedidos/boton-aviso-whatsapp.tsx`):** Integrado sobre superficie `#1f202c` con acento esmeralda discreto para avisar al cliente cuando su pedido esté listo.

### 13.4 Armonización de Contraste y Navegación en el Home (`app/page.tsx`)

1. **Navegación Directa de KPIs al Taller:** Las 4 tarjetas de resumen de taller ahora son enlaces interactivos (`<Link href="/taller?tab=...">`), permitiendo acceder directamente a la vista filtrada con 1 toque.
2. **Corrección de Hover Fantasma:** Eliminado el efecto de hover beige/grisáceo lavado en modo oscuro mediante `dark:hover:bg-amber-950/40` y `dark:hover:bg-emerald-950/40`.
3. **Polaridad Normalizada en Accesos Rápidos:** Tarjetas con dos botones ("Gestión de Pedidos", "Clientes") estandarizadas con botón principal neutral a la izquierda y botón de creación rápida outline a la derecha. El acceso al taller adoptó un botón neutral con micro-icono de acento, eliminando el color naranja saturado anterior.



