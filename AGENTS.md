# AGENTS.md — Reglas de Ingeniería y Dinámica de Subagentes

Este documento define el marco de operación estricto para agentes de IA que operen en este repositorio mediante **Antigravity CLI (`agy`)**, **Gemini CLI** o **Antigravity IDE**, alineado con la integración de cuatro marcos metodológicos de referencia:

1. **Matt Pocock (`mattpocock/skills`):** Ingeniería real sin "vibe coding", interrogatorios estructurados (_Grilling_), modelado de dominio (`GLOSSARY.md`, `docs/adr/`), módulos profundos (_Deep Modules_) y TDD en costuras (_seams_).
2. **Impeccable (`pbakaus/impeccable`):** Sistema de diseño quirúrgico (24 comandos), separación de `PRODUCT.md` frente a `DESIGN.md` y 61 detectores deterministas a costo cero.
3. **Taste Skill (`leonxlnx/taste-skill`):** Erradicación de _tells_ de IA y reglas estrictas para _App Screens_ (color en datos al 3–5%, cromo neutro, KPIs tipográficos sin azulejos).
4. **Emil Kowalski (`emilkowalski/skills`):** Micro-interacciones físicas (`scale(0.97)` en `:active`), popovers conscientes del origen, rendimiento a 120fps en GPU y sensación nativa en dispositivos móviles y táctiles.

Para evitar la saturación de la ventana de contexto (_context window_), el agente principal actúa como **Orquestador e Implementador**, delegando tareas pesadas, ruidosas o de investigación en **Subagentes especializados con contexto aislado**.

---

## 1. Principios Operativos y Aislamiento de Contexto

1. **Protocolo de Interrogatorio Previo (_Grilling Mandatory_):** Si una tarea tiene especificaciones incompletas, reglas de negocio dudosas o decisiones arquitectónicas abiertas, el agente NO asume nada en silencio. Aplica una sesión de _Grilling_ (árbol de decisiones por rondas con opciones recomendadas) para alinear el requerimiento antes de escribir código.
2. **Memoria de Dominio y ADRs:** Todo término canónico del negocio debe estar documentado en `GLOSSARY.md`. Cada decisión arquitectónica irreversible se documenta de inmediato en `docs/adr/`.
3. **Blindaje de Contexto (_Context Shielding_):** Tareas que generan volumen excesivo de tokens (inspección de logs y trazas de error, consultas web masivas, inspección DOM en navegador o auditorías profundas) DEBEN delegarse al subagente correspondiente.
4. **Desarrollo Incremental y Balas Trazadoras (_Tracer Bullets_):** Los cambios se estructuran en rebanadas verticales estrechas (BD Supabase → Server Action/API → UI → Test) con dependencias explícitas, evitando capas horizontales monolíticas.
5. **Verificación TDD en Costuras Públicas (_Seams_):** Las pruebas automatizadas verifican capacidades de negocio en costuras acordadas, nunca acoplándose a detalles internos volátiles. Ciclo estricto de Red-Green-Refactor.
6. **Sincronización Mandatoria de Manuales y Documentación:** Siempre que se agregue, modifique o ajuste una funcionalidad del sistema (reglas de negocio, navegación, permisos, flujos de pantalla, políticas RLS de Supabase, esquemas de BD, índices, validaciones o arquitectura backend), el agente o desarrollador DEBE actualizar automáticamente y en el mismo ciclo:
   - El manual de usuario (`docs/capacitacion/guia-rapida-usuarios.md`) para dinámicas operativas.
   - El manual técnico de arquitectura (`docs/arquitectura/manual-tecnico-sistema.md`) para esquemas, índices, validaciones, flujos de datos y diseño técnico.
     Ningún cambio con impacto en la operación o en la arquitectura se da por terminado sin su documentación alineada.

---

## 2. Flujo de Trabajo por Fases y Mapeo de Subagentes

```
[1. Entrevista / Spec] ──► @system-architect (/grill-with-docs)
        ↓
[2. Planificación]     ──► tasks/plan.md y tasks/todo.md (Tracer bullets)
        ↓
[3. Implementación]    ──► Agente Principal (TDD + Incremental)
        ├─ Macro-UI / Slop  ──► @frontend-engineer (Taste Skill + /distill)
        ├─ Micro-Motion / UX──► @frontend-engineer (scale(0.97), 120fps, móvil)
        ├─ Backend / RLS    ──► @security-auditor (Supabase SSR & Postgres)
        └─ Errores / Bugs   ──► @debugger (/diagnosing-bugs con bucle cerrado)
        ↓
[4. Verificación]      ──► @test-engineer (Vitest + Playwright)
        ↓
[5. Pre-Ship Audit]    ──► /code-review (Subagentes paralelos: Standards vs. Spec)
```

### Fase 1: Especificación, Dominio y Requisitos

- Para diseñar especificaciones (`docs/specs/`), contratos de interfaz o modelos de datos en Supabase, invoca a **`@system-architect`** o ejecuta el flujo `/grill-with-docs`.
- El resultado debe definir:
  - Contexto y objetivos de negocio fundamentados en `GLOSSARY.md`.
  - Alcance (_In-Scope_ y _Out-of-Scope_).
  - Casos de prueba de aceptación en formato BDD (_Given / When / Then_).
  - Políticas de seguridad Row Level Security (RLS) en Supabase y tipado estricto.

### Fase 2: Planificación y Tareas (Tracer Bullets)

- Descomponer el trabajo en balas trazadoras (_tracer bullets_) verticales con criterios de aceptación medibles en `tasks/todo.md`.
- Declarar dependencias y bloqueos entre tareas.

### Fase 3: Implementación Guiada por Pruebas (TDD) e Incremental

- El agente principal implementa en ciclos estrictos de **Red-Green-Refactor**:
  1. **Rojo:** Escribir un test unitario o de integración mínimo que falle en la costura pública acordada.
  2. **Verde:** Escribir el código mínimo necesario para hacer pasar el test.
  3. **Refactor & Micro-Pase:** Mejorar modularidad, aplicar micro-escalado táctil (`scale(0.97)`), eliminar `scale(0)` y limpiar clases.
- **Especialistas de apoyo durante la implementación:**
  - **Macro-UI y Erradicación de Slop:** Delega en **`@frontend-engineer`**. Aplica las reglas de _App Screens_ (color al 3–5% en datos, cromo neutro, KPIs tipográficos) e inspección visual con Browser Subagent.
  - **Micro-Interacciones y Experiencia Táctil:** Verifica feedback instantáneo en `:active`, ausencia de tap-delay en tablets (`touch-action: manipulation`) y somete los datos a pruebas de estrés con `break-ui`.
  - **Backend y Supabase:** Delega en **`@security-auditor`** para verificar consultas seguras con `@supabase/ssr`, transaccionalidad RPC y políticas RLS blindadas.
  - **Bugs y Excepciones:** Aplica el protocolo de `/diagnosing-bugs`: prohibido teorizar hasta construir un bucle de retroalimentación cerrado (_tight feedback loop_ que falle reproduciblemente). Redactar secretos antes de imprimir trazas.

### Fase 4: Auditoría y Revisión de Código en Dos Ejes

- **Revisión Dual `/code-review`:** Antes de fusionar a `dev` o `main`, se ejecutan dos subagentes en paralelo:
  1. **Eje de Estándares:** Verifica cumplimiento de `AGENTS.md`, linters, cero `as any` y contratos de tipos.
  2. **Eje de Especificación:** Verifica que la implementación resuelva exactamente lo solicitado en el ticket/spec sin omisiones ni sobre-ingeniería.
- **Pase de Calidad Final:** Ejecutar `/impeccable polish` para afinar alineación de subpíxeles, consistencia de bordes y contrastes en tema claro y oscuro.

### 2.1 Vía Rápida (Fast Track / Fast Lanes) para Cambios Menores

Para tareas cosméticas de bajo riesgo que NO alteran modelos de datos de Supabase ni contratos de API públicos (ej. ajustes menores de padding, correcciones de texto/copy o afinación de micro-interacciones):

- **Bypass de Especificación:** No se requiere convocar a `@system-architect` ni redactar una especificación formal en `docs/specs/`.
- **Ruta Directa TDD / Incremental:** Implementación directa aplicando TDD o verificación visual con Browser Subagent.
- **Compuerta de Salida:** Se mantienen obligatorios `npm test`, `npm run typecheck` y registro de tareas en `tasks/todo.md`.

---

## 3. Reglas de Modificación de Archivos y Entorno

- **Preservación del contexto:** No reescribir archivos completos innecesariamente; utilizar ediciones de diff precisas.
- **Manejo de dependencias:** No instalar paquetes externos sin justificar previamente por qué la biblioteca estándar o las dependencias existentes no resuelven el problema.
- **Manejo de secretos:** Cero credenciales, tokens o API keys en código fuente; utilizar siempre variables de entorno (`.env.local`).
- **Arquitectura de Base de Datos:** Todo acceso a datos se realiza a través del SDK nativo de Supabase (`@supabase/supabase-js`, `@supabase/ssr`), respetando políticas RLS de Postgres y Server Actions tipados.
- **Commits:** Seguir la convención de [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: <descripción corta>`
  - `fix: <descripción corta>`
  - `test: <descripción corta>`
  - `refactor: <descripción corta>`
  - `docs: <descripción corta>`

---

## 4. Compuerta de Salida (Definition of Done)

Una tarea sólo se marca como concluida cuando el agente haya verificado:

- [ ] La especificación técnica y las tareas en `tasks/todo.md` están cumplidas.
- [ ] Todos los tests nuevos y preexistentes se ejecutan y aprueban exitosamente (`npm test` o test runner local).
- [ ] Cero errores de compilación / tipos (`npm run typecheck`).
- [ ] No existen advertencias críticas de linter ni de consola del navegador.
- [ ] Auditoría de App Screens superada (color limitado a datos, KPIs tipográficos limpios, cero cajas anidadas).
- [ ] Micro-interacción verificada (feedback instantáneo en `:active`, cero `scale(0)` en modales, touch-action en móvil).
- [ ] Manuales y documentación actualizados con el nuevo comportamiento:
  - Manual de usuario (`docs/capacitacion/guia-rapida-usuarios.md`) o runbook operativo (`docs/operaciones/`).
  - Manual técnico de arquitectura (`docs/arquitectura/manual-tecnico-sistema.md`).
- [ ] Revisión en dos ejes de `/code-review` aprobada.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
