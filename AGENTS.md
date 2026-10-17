# AGENTS.md — Reglas de Ingeniería y Dinámica de Subagentes

Este documento define el marco de operación estricto para agentes de IA que operen en este repositorio mediante **Antigravity CLI (`agy`)**, **Gemini CLI** o **Antigravity IDE**, alineado con los estándares del framework `addyosmani/agent-skills`.

Para evitar la saturación de la ventana de contexto (_context window_), el agente principal actúa como **Orquestador e Implementador**, delegando tareas pesadas, ruidosas o de investigación en **Subagentes especializados con contexto aislado**.

---

## 1. Principios Operativos y Aislamiento de Contexto

1. **No asumir requerimientos ambiguos:** Si una tarea tiene especificaciones incompletas o supuestos no validados, interactúa directamente con el usuario (`/agent-skills:interview-me`) o delega la especificación técnica en `@system-architect`.
2. **Blindaje de Contexto (_Context Shielding_):** Tareas que generan volumen excesivo de tokens (inspección de logs y trazas de error, consultas web masivas, inspección DOM en navegador o auditorías profundas) DEBEN delegarse al subagente correspondiente.
3. **Especificación previa a la implementación:** Ninguna funcionalidad nueva se implementa directamente en código sin una especificación o contrato aprobado.
4. **Desarrollo Incremental:** Los cambios deben realizarse en rebanadas verticales pequeñas y comprobables (`incremental-implementation`), evitando commits masivos o monolíticos.
5. **Verificación obligatoria:** Todo cambio debe validarse mediante pruebas automatizadas y chequeo de tipos antes de considerarse completado.
6. **Sincronización Mandatoria de Manuales y Documentación:** Siempre que se agregue, modifique o ajuste una funcionalidad del sistema (reglas de negocio, navegación, permisos, flujos de pantalla, esquemas de BD, índices, validaciones o arquitectura backend), el agente o desarrollador DEBE actualizar automáticamente y en el mismo ciclo:
   - El manual de usuario (`docs/capacitacion/guia-rapida-usuarios.md`) para dinámicas operativas.
   - El manual técnico de arquitectura (`docs/arquitectura/manual-tecnico-sistema.md`) para esquemas, índices, validaciones, flujos de datos y diseño técnico.
   Ningún cambio con impacto en la operación o en la arquitectura se da por terminado sin su documentación alineada.

---

## 2. Flujo de Trabajo por Fases y Mapeo de Subagentes

```
[1. Entrevista / Spec] ──► @system-architect (/architect)
        ↓
[2. Planificación]     ──► tasks/plan.md y tasks/todo.md
        ↓
[3. Implementación]    ──► Agente Principal (TDD + Incremental)
        ├─ UI / Componentes ──► @frontend-engineer (/frontend)
        ├─ Docs / APIs      ──► @deep-researcher (/research)
        └─ Errores / Bugs   ──► @debugger (/debug)
        ↓
[4. Verificación]      ──► @test-engineer (/test)
        ↓
[5. Pre-Ship Audit]    ──► /ship (Fan-out: Reviewer + Security + QA)
```

### Fase 1: Especificación y Requisitos

- Para diseñar especificaciones (`docs/specs/`), contratos de interfaz (TypeScript / OpenAPI) o modelos de datos, invoca a **`@system-architect`** o ejecuta `/architect`.
- El resultado debe definir:
  - Contexto y objetivos de negocio.
  - Alcance (_In-Scope_ y _Out-of-Scope_).
  - Casos de prueba de aceptación en formato BDD (_Given / When / Then_).
  - Consideraciones de seguridad y modelo de datos.

### Fase 2: Planificación y Tareas

- Descomponer el trabajo en unidades atómicas (tamaño S o M) con criterios de aceptación medibles en `tasks/todo.md`.
- Ordenar las tareas respetando dependencias técnicas (ej. esquemas antes de lógica de negocio; mocks antes de clientes de integración).

### Fase 3: Implementación Guiada por Pruebas (TDD) e Incremental

- El agente principal implementa en ciclos estrictos de **Red-Green-Refactor**:
  1. **Rojo:** Escribir un test unitario o de integración mínimo que falle.
  2. **Verde:** Escribir el código mínimo necesario para hacer pasar el test.
  3. **Refactor:** Mejorar legibilidad, modularidad y rendimiento manteniendo los tests en verde.
- **Especialistas de apoyo durante la implementación:**
  - **Trabajo de UI, Maquetación o Estilos:** Delega en **`@frontend-engineer`** (o `/frontend`). Utiliza Browser Subagent y Chrome DevTools para inspección visual, accesibilidad (WCAG 2.1 AA) y validación de consola limpia sin ensuciar el chat principal.
  - **Dudas sobre APIs externas, librerías o versiones:** Delega en **`@deep-researcher`** (o `/research`). Consulta documentación oficial y contratos de API actuales en un hilo aislado.
  - **Bugs, excepciones en runtime o fallos de compilación:** Detén la implementación e invoca a **`@debugger`** (o `/debug`). Aplica el protocolo _Stop-the-Line_, aísla la causa raíz y genera el parche sin llenar el chat de trazas de terminal.

### Fase 4: Auditoría y Revisión de Código

- **Para revisión puntual de un PR o cambio:** Invoca a **`@code-reviewer`** o ejecuta `/review` para una evaluación en 5 ejes (Correctness, Readability, Architecture, Security, Performance).
- **Para cambios críticos o pase a producción:** Ejecuta **/ship**. Realizará un _fan-out_ paralelo con tres subagentes aislados (`code-reviewer`, `security-auditor` y `test-engineer`) y emitirá una decisión formal de lanzamiento (**GO | NO-GO**) con plan de rollback.

### 2.1 Vía Rápida (Fast Track / Fast Lanes) para Cambios Menores

Para tareas de bajo riesgo que NO alteran modelos de datos ni contratos de API públicos (ej. correcciones cosméticas de CSS/Tailwind, ajustes de responsividad móvil, refactorización interna sin cambio de comportamiento, o corrección de textos/copy):

- **Bypass de Especificación:** No se requiere convocar a `@system-architect` ni redactar una especificación formal en `docs/specs/`.
- **Ruta Directa TDD / Incremental:** El agente principal implementa directamente en Fase 3 aplicando TDD o verificación visual con Browser Subagent.
- **Compuerta de Salida:** Se mantienen obligatorios `npm test`, `npm run typecheck` y registro de tareas en `tasks/todo.md`.

---

## 3. Reglas de Modificación de Archivos y Entorno

- **Preservación del contexto:** No reescribir archivos completos innecesariamente; utilizar ediciones de diff precisas.
- **Manejo de dependencias:** No instalar paquetes externos sin justificar previamente por qué la biblioteca estándar o las dependencias existentes no resuelven el problema.
- **Manejo de secretos:** Cero credenciales, tokens o API keys en código fuente; utilizar siempre variables de entorno (`.env.local`).
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
- [ ] Cero errores de compilación / tipos (`tsc --noEmit` o equivalente del stack).
- [ ] No existen advertencias críticas de linter ni de consola del navegador.
- [ ] Manuales y documentación actualizados con el nuevo comportamiento:
  - Manual de usuario (`docs/capacitacion/guia-rapida-usuarios.md`) o runbook operativo (`docs/operaciones/`).
  - Manual técnico de arquitectura (`docs/arquitectura/manual-tecnico-sistema.md`).
- [ ] La revisión en los 5 ejes ha sido superada o el cambio superó la compuerta `/ship`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
