# Diagnóstico Integral y Hoja de Ruta de Modernización: APSys

- **Fecha de Diagnóstico:** 2026-10-19
- **Rama Principal de Trabajo:** `dev`
- **Metodología Aplicada:** Integración del Cuadrumvirato (Matt Pocock + Impeccable + Taste Skill + Emil Kowalski)
- **Estado del Baseline:** 300/300 Pruebas Unitarias Aprobadas (Vitest) | 0 Errores TypeScript (`tsc --noEmit`)

---

## 1. Hito Previo Completado: Instalación Local y Contratos

1. **Instalación Local de Skills (`.agents/skills/` y `skills-lock.json`):**
   - Se ejecutó la instalación física y no interactiva mediante el CLI oficial de `skills` (`antigravity` agent detectado).
   - Se instalaron **66 directivas de habilidades** de los 4 repositorios oficiales:
     - `pbakaus/impeccable`: 24 comandos de diseño, 61 detectores deterministas e inspectores.
     - `emilkowalski/skills`: 15 directivas de física, micro-animación, `mobile-native` y `break-ui`.
     - `mattpocock/skills`: 38 directivas de ingeniería, Deep Modules, TDD en costuras públicas y `/diagnosing-bugs`.
     - `leonxlnx/taste-skill`: Directivas anti-slop, reglas estrictas de _App Screens_ y erradicación de tells de IA.
2. **Contratos Normativos Creados:**
   - [`PRODUCT.md`](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/PRODUCT.md): Esquema formal de producto (usuarios, propósito, contexto operativo y principios).
   - [`DESIGN.md`](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/DESIGN.md): Esquema formal de tokens con la paleta oficial **Tokyo Night** (`#16161e`, `#1a1b26`, `#1f202c`, `#24283b`, `#7aa2f7`).
   - [`GLOSSARY.md`](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/GLOSSARY.md): Definición canónica del negocio (Comanda, Taller, Tasa BCV, Abono, Saldo Pendiente).
   - [`docs/adr/0001-arquitectura-datos-y-marcos-agentes.md`](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/docs/adr/0001-arquitectura-datos-y-marcos-agentes.md): Ratificación formal de **Supabase Nativo + PostgreSQL RLS (Cero Prisma)**.

---

## 2. Matriz Consolidada de Diagnóstico por Ejes

Se crearon 4 ramas de auditoría aisladas de solo-lectura:

```
dev (Base Verificada)
  ├── audit/seguridad-supabase      ──► docs/auditorias/plan-1-seguridad-supabase.md
  ├── audit/arquitectura-typescript ──► docs/auditorias/plan-2-arquitectura-typescript.md
  ├── audit/diseno-impeccable       ──► docs/auditorias/plan-3-diseno-impeccable.md
  └── audit/microinteraccion-emil   ──► docs/auditorias/plan-4-microinteraccion-emil.md
```

### Síntesis de Hallazgos Críticos

| Eje                         | Rama                            | Hallazgos Destacados                                                                                                                                                                                                                                                                                                                                   |
| :-------------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Seguridad & Supabase** | `audit/seguridad-supabase`      | 1. Rollback manual en `crearPedido` falla silenciosamente porque RLS prohíbe `DELETE` en `pedidos`.<br>2. Condición de carrera en `cobrarYEntregarPedido` por falta de bloqueo `FOR UPDATE`.<br>3. Vulnerabilidad fail-open en `/api/cron/sincronizar-tasas` si falta `CRON_SECRET`.<br>4. Endpoint `/api/tasas/auto-sync` desprotegido sin sesión.    |
| **2. Arquitectura & TS**    | `audit/arquitectura-typescript` | 1. Cero `as any`, pero 15 ocurrencias de `as unknown as` por falta de tipos generados para relaciones en Supabase.<br>2. Módulos inflados: `pedido-form.tsx` (768 líneas) y `actions.ts` (703 líneas) mezclan matemáticas de m² con UI y mutaciones.<br>3. Seams TDD sólidos (300 pruebas verdes).                                                     |
| **3. Macro-Diseño & Slop**  | `audit/diseno-impeccable`       | 1. Arcoíris de iconos en la cuadrícula de Home (Tell de IA Ola 2 con 6 cajas de colores dispares).<br>2. Tarjetas KPI con fondos teñidos en lugar de neutros (violación de App Screens: color al 25% en vez del 3–5%).<br>3. Cajas anidadas redundantes en formularios.                                                                                |
| **4. Micro-Tacto & Móvil**  | `audit/microinteraccion-emil`   | 1. Retardo táctil de 300ms en tablets por ausencia de `touch-action: manipulation;`.<br>2. Micro-escala física dispersa (`scale-98` y `scale-95`) en lugar del estándar `scale(0.97)`.<br>3. Flexbox desbordante en tarjetas de taller ante clientes con nombres largos (falta de `min-w-0`).<br>4. Cumplimiento perfecto en modales: cero `scale(0)`. |

---

## 3. Hoja de Ruta de Implementación Propuesta (Tracer Bullets)

Para ejecutar las mejoras con cero riesgo y verificación continua mediante TDD, se proponen las siguientes fases sucesivas en ramas tradicionales de características:

### Fase 1: Blindaje de Seguridad y Transacciones Supabase (`feat/transacciones-supabase-y-seguridad`)

- [ ] **Tarea 1.1:** Crear migración SQL con funciones RPC transaccionales:
  - `crear_pedido_transaccional(...)`: Inserta cabecera, renglones y abono en una sola transacción PostgreSQL con rollback automático.
  - `cobrar_y_entregar_transaccional(...)`: Bloquea la fila con `FOR UPDATE`, calcula saldo e inserta pago y entrega atómicamente.
- [ ] **Tarea 1.2:** Actualizar `app/pedidos/actions.ts` para invocar los RPCs eliminando los rollbacks manuales bloqueados por RLS.
- [ ] **Tarea 1.3:** Convertir `/api/cron/sincronizar-tasas` a Fail-Closed estricto (rechazar si falta `CRON_SECRET`).
- [ ] **Tarea 1.4:** Requerir sesión autenticada en `/api/tasas/auto-sync`.
- [ ] **Tarea 1.5:** Pruebas unitarias de seguridad y verificación DoD.

### Fase 2: Arquitectura de Tipos y Modularización Deep Modules (`feat/tipos-supabase-y-deep-modules`)

- [ ] **Tarea 2.1:** Crear `types/database.ts` con definiciones tipadas de consultas relacionales de Supabase.
- [ ] **Tarea 2.2:** Reemplazar las 15 ocurrencias de `as unknown as` en el código productivo por tipos inferidos seguros.
- [ ] **Tarea 2.3:** Extraer matemática de m² y precios de `pedido-form.tsx` hacia `lib/pedidos/calculos-renglones.ts` (módulo profundo puro con pruebas unitarias).
- [ ] **Tarea 2.4:** Descomponer `pedido-form.tsx` en 3 subcomponentes especializados limpios.

### Fase 3: Erradicación de Slop y Dirección de Arte Tokyo Night (`feat/diseno-app-screens-tokyo-night`)

- [ ] **Tarea 3.1:** Unificar los contenedores de iconos de Home a superficie neutra elevada (`#1f202c` con micro-borde `#24283b`) eliminando el arcoíris artificial de colores.
- [ ] **Tarea 3.2:** Reestructurar tarjetas KPI de producción a la regla de _App Screens_ (superficie `#1a1b26`, números tipográficos limpios y acentos de color estrictamente limitados al 3–5%).
- [ ] **Tarea 3.3:** Limpiar contenedores anidados en formularios de pedidos y clientes.
- [ ] **Tarea 3.4:** Inspección visual en navegador con Browser Subagent (DevTools Desktop & Mobile).

### Fase 4: Micro-Física Táctil y Rendimiento Móvil (`feat/micro-tacto-y-mobile-native`)

- [ ] **Tarea 4.1:** Declarar `touch-action: manipulation;` en `app/globals.css` para botones y enlaces, suprimiendo el retraso de 300ms en tablets.
- [ ] **Tarea 4.2:** Estandarizar la micro-física a `active:scale-[0.97]` en `lib/design-system.ts`, botones de taller y cabeceras.
- [ ] **Tarea 4.3:** Incorporar `min-w-0` en contenedores flexibles de taller para blindar el elipsis de texto contra nombres extremos (`break-ui`).
- [ ] **Tarea 4.4:** Verificar cero sticky hovers en dispositivos táctiles.

### Fase 5: Pre-Ship Audit y Fusión a `dev` y `main`

- [ ] **Tarea 5.1:** Ejecución completa de suite de pruebas (Vitest 100% verde).
- [ ] **Tarea 5.2:** Verificación estricta de compilación (`npm run typecheck` y `npm run build`).
- [ ] **Tarea 5.3:** Auditoría dual en dos ejes (Estándares vs. Especificación).
- [ ] **Tarea 5.4:** Sincronización mandatoria de manuales (`manual-tecnico-sistema.md` y `guia-rapida-usuarios.md`).
