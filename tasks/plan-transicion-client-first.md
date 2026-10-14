# Plan Maestro de Transición: Arquitectura Client-First / Instant Navigation para APSys

## 1. Justificación y Objetivos de Negocio

### Antecedentes

En fases anteriores, **APSys** implementó una arquitectura basada puramente en **React Server Components (RSC) bloqueantes** en cada ruta (`export const instant = false; await connection();`).
Aunque el backend está optimizado y el proxy valida tokens en < 1ms, cada navegación de usuario entre módulos del Sidebar (`/pedidos` ↔ `/taller` ↔ `/dashboard`) obliga al navegador a esperar que el servidor de Node.js ejecute consultas secuenciales a la base de datos de PostgreSQL en la nube antes de enviar el HTML. Esto genera una latencia perceptible de entre 300ms y 1.2s por clic.

En contraste, el proyecto hermano **3DCalc** opera con una arquitectura **Client-First (SPA)** donde la sesión, las tasas y la navegación residen en la memoria del navegador (`AuthContext` + `"use client"`), logrando transiciones instantáneas de **0 a 16 milisegundos**.

### Objetivos Principales

1. **Latencia Cero en Navegación (0ms - 50ms):** Al hacer clic en cualquier botón del Sidebar, la pantalla debe cambiar instantáneamente sin esperar respuesta del servidor.
2. **Preservación del 100% de la Seguridad (RLS):** Todas las operaciones de lectura y escritura siguen gobernadas estrictamente por PostgreSQL Row Level Security y los permisos por rol (`operativo` vs `gerencial`).
3. **Cero Regresiones:** Mantener el 100% de los 171 tests existentes verdes y el diseño UI/UX actual intacto.
4. **Resiliencia Offline/Caché:** Las tasas del día y los catálogos se precargan en memoria para responder de inmediato incluso con micro-cortes de red.

---

## 2. Diagrama de la Nueva Arquitectura

```
                        ┌────────────────────────────────────────────────────────┐
                        │             Navegador del Usuario (Cliente)            │
                        ├────────────────────────────────────────────────────────┤
                        │  AuthProvider (Mantiene usuario y rol en memoria)      │
                        │  TasasProvider (Mantiene tasas USD/EUR en caché)       │
                        │  AppShell (Navegación instantánea en 0 milisegundos)    │
                        └──────────────────┬──────────────────┬──────────────────┘
                                           │                  │
                         Consultas directas│                  │WebSocket Realtime
                         con JWT del cliente                  │(Avance automático)
                                           ▼                  ▼
                        ┌────────────────────────────────────────────────────────┐
                        │              Supabase Cloud (PostgreSQL)               │
                        ├────────────────────────────────────────────────────────┤
                        │  Row Level Security (RLS) - Reglas de Seguridad        │
                        │  Tablas: pedidos, perfiles, tasas_cambio, clientes     │
                        └────────────────────────────────────────────────────────┘
```

---

## 3. Desglose de Fases de Ejecución

### Fase 1: Capa de Autenticación y Perfil en Cliente (`AuthContext`)

- **Archivos a crear/modificar:**
  - `context/auth-context.tsx` (`"use client"`)
  - `lib/supabase/client.ts` (Cliente singleton de navegador)
  - `app/layout.tsx` (Envolver la aplicación con `<AuthProvider>`)
- **Comportamiento:**
  - Inicializa la sesión con `supabase.auth.getSession()` en memoria.
  - Escucha cambios de sesión con `supabase.auth.onAuthStateChange()`.
  - Consulta y cachea el perfil del usuario (`perfiles.rol`).
  - Provee `useAuth()`: `{ user, perfil, rol, esGerencial, isLoading, signOut }`.
- **Estrategia TDD:**
  - `test/auth-context.test.tsx`: Validar emisión de usuario, retención en memoria y cambio de sesión.

### Fase 2: Capa de Tasas y Moneda en Memoria de Cliente (`TasasContext`)

- **Archivos a crear:**
  - `context/tasas-context.tsx` (`"use client"`)
- **Comportamiento:**
  - Carga inmediata (0ms) desde `localStorage` de las últimas tasas conocidas.
  - Sincronización en segundo plano con `tasas_cambio` (tasa hoy y tasa programada) y DolarVZLA.
  - Provee `useTasas()`: `{ tasaHoy, tasaEurHoy, tasaSiguiente, convertirBs, convertirUsd }`.
- **Estrategia TDD:**
  - `test/tasas-context.test.tsx`: Validar hidratación sin parpadeo, conversión matemática y actualización reactiva.

### Fase 3: Desacoplamiento del Shell ([AuthenticatedShell](file:///c:/Users/medin/Documents/Proyectos/APSys-Gemini/components/shell/authenticated-shell.tsx))

- **Acción:**
  - Convertir `AuthenticatedShell` en un componente de cliente que consuma `useAuth()` y `useTasas()`.
  - El Sidebar y la barra de navegación móvil dejan de hacer peticiones SSR en cada clic.
  - Si no hay usuario autenticado, redirige a `/login` sin esperar al servidor.
- **Estrategia TDD:**
  - `test/authenticated-shell-client.test.tsx`: Validar render inmediato del shell y protección de rutas.

### Fase 4: Migración Incremental de Páginas (Desbloqueo de Cascarones)

- **Lote A (Flujo Crítico Operativo):**
  - `app/taller/page.tsx`: Muestra la interfaz de inmediato; los pedidos se cargan en cliente y se sincronizan con Supabase Realtime (WebSocket).
  - `app/pedidos/page.tsx`: El listado y buscador cargan al instante con caché en cliente.
  - `app/pedidos/nuevo/page.tsx`: Apertura instantánea del formulario; selector de servicios precargado en memoria.
- **Lote B (Gestión de Negocio):**
  - `app/clientes/page.tsx` y `app/servicios/page.tsx`.
- **Lote C (Administración y Finanzas):**
  - `app/dashboard/page.tsx`, `app/cuentas-por-cobrar/page.tsx`, `app/dashboard/rotacion/page.tsx` y `app/tasas/page.tsx`.
- **Patrón a aplicar en cada página:**
  - Eliminar `export const instant = false; await connection();` y llamadas bloqueantes a la base de datos en el cascarón de servidor.
  - Las vistas hijas consumen hooks reactivos con caché en cliente.

### Fase 5: Suite de Pruebas E2E y Medición de Rendimiento

- **E2E Playwright (`e2e/navegacion-instantanea.spec.ts`):**
  - Prueba de velocidad de navegación continua: Medir el tiempo de render al saltar entre `/pedidos` → `/taller` → `/dashboard` (criterio de éxito: < 80ms).
  - Prueba de persistencia: Recarga de página (`F5`) sin pérdida de estado ni parpadeos de sesión.
  - Prueba de permisos: Operario bloqueado de `/tasas` y `/dashboard`; Gerencial con acceso total.
  - Prueba de cotización con doble vigencia en `/pedidos/nuevo` desde el estado de cliente.

---

## 4. Matriz de Riesgos y Mitigaciones

| Riesgo Potencial                                         | Impacto | Mitigación Técnica                                                                                                                              |
| :------------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pérdida de sesión al recargar (F5)**                   | Medio   | `AuthContext` lee la sesión persistida en cookies por `@supabase/ssr` antes de declarar `isLoading: false`.                                     |
| **Consultas no autorizadas a Supabase desde el cliente** | Alto    | Supabase RLS (Row Level Security) bloquea a nivel de PostgreSQL cualquier consulta que no cumpla las políticas, independientemente del cliente. |
| **Desfase de tasas de cambio en el cliente**             | Bajo    | `TasasContext` implementa sondeo de fondo suave cada 15 minutos y se actualiza inmediatamente cuando se dispara una sincronización en `/tasas`. |
| **Rotura de pruebas existentes**                         | Medio   | Mantener los Server Actions existentes (`app/pedidos/actions.ts`, etc.) intactos para mutaciones críticas de base de datos.                     |
