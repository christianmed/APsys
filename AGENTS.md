# AGENTS.md — Reglas de Ingeniería y Dinámica de Subagentes

Este documento define el marco de operación estricto para agentes de IA que operen en este repositorio (proyecto **APSys**) mediante **AutoClaw**, **Antigravity CLI (`agy`)**, **Gemini CLI** o **Antigravity IDE**, alineado con los estándares del framework `addyosmani/agent-skills`.

> **Alcance:** este archivo es específico de este proyecto; no debe copiarse a otros proyectos ni a configuraciones globales. Los recursos reutilizables son las skills locales instaladas en `.agents/skills/`.

Para evitar la saturación de la ventana de contexto (_context window_), el agente principal actúa como **Orquestador e Implementador**, delegando tareas pesadas, ruidosas o de investigación en **Subagentes especializados con contexto aislado**.

---

## 1. Principios Operativos y Aislamiento de Contexto

1. **No asumir requerimientos ambiguos:** Si una tarea tiene especificaciones incompletas o supuestos no validados, interactúa directamente con el usuario (`/agent-skills:interview-me` o la skill `interview-me`) o delega la especificación técnica en `@system-architect`.
2. **Blindaje de Contexto (_Context Shielding_):** Tareas que generan volumen excesivo de tokens (inspección de logs y trazas de error, consultas web masivas, inspección DOM en navegador o auditorías profundas) DEBEN delegarse al subagente correspondiente.
3. **Especificación previa a la implementación:** Ninguna funcionalidad nueva se implementa directamente en código sin una especificación o contrato aprobado.
4. **Desarrollo Incremental:** Los cambios deben realizarse en rebanadas verticales pequeñas y comprobables (`incremental-implementation`), evitando commits masivos o monolíticos.
5. **Verificación obligatoria:** Todo cambio debe validarse mediante pruebas automatizadas y chequeo de tipos antes de considerarse completado.

## 2. Uso de Skills (pack local en `.agents/skills/`)

Las 25 skills del framework `addyosmani/agent-skills` están instaladas **localmente en este proyecto** en `.agents/skills/<nombre>/SKILL.md` (manifiesto: `skills-lock.json`). No modificar instalaciones globales de otros clientes (Gemini/Antigravity) desde este proyecto.

**Reglas de uso:**

1. **Invocación obligatoria:** si una tarea coincide con una skill (aunque sea parcialmente), es OBLIGATORIO leer su `SKILL.md` y seguirla completa — no parcialmente. Nunca implementar directamente si una skill aplica.
2. **Mapeo intención → skill:**
   - Funcionalidad nueva → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` + `test-driven-development`
   - Planificación / desglose → `planning-and-task-breakdown`
   - Bug / fallo / comportamiento inesperado → `debugging-and-error-recovery`
   - Revisión de código → `code-review-and-quality`
   - Refactor / simplificación → `code-simplification`
   - API / diseño de interfaces → `api-and-interface-design`
   - Trabajo de UI → `frontend-ui-engineering`
   - Seguridad → `security-and-hardening` · Rendimiento → `performance-optimization` · CI/CD → `ci-cd-and-automation` · Git → `git-workflow-and-versioning` · Documentación/ADRs → `documentation-and-adrs` · Lanzamiento → `shipping-and-launch`
3. **Ciclo de vida implícito** (equivalente a los comandos del pack):
   - DEFINE → `spec-driven-development` · PLAN → `planning-and-task-breakdown` · BUILD → `incremental-implementation` + `test-driven-development` · VERIFY → `debugging-and-error-recovery` · REVIEW → `code-review-and-quality` · SHIP → `shipping-and-launch`
4. **Anti-racionalización** — pensamientos incorrectos que deben ignorarse: "esto es muy pequeño para una skill", "lo implemento rápido yo mismo", "primero junto contexto". Correcto: comprobar primero si aplica una skill y usarla.
5. **Orquestación (regla del pack):** el orquestador es el usuario o el comando; **los personas no invocan a otros personas**. El único patrón multi-persona endorsado es **fan-out paralelo con merge** (lo usa `/ship`). Los personas del pack mapean así: `code-reviewer` (revisión 5 ejes), `security-auditor` (seguridad), `test-engineer` (QA), `web-performance-auditor` (rendimiento web).

### Reparto de trabajo y subagentes (local a este proyecto)

Regla de reparto: **el agente principal decide, especifica y sintetiza; los subagentes ejecutan el trabajo pesado, ruidoso o aislable** en su propia ventana de contexto.

| Trabajo | Skill(s) del pack | Quién ejecuta |
| --- | --- | --- |
| Especificar (con el usuario) | `interview-me` → `spec-driven-development` | Agente principal |
| Planificar / descomponer | `planning-and-task-breakdown` | Agente principal |
| Implementar slices | `incremental-implementation` + `test-driven-development` | 执行者 (Ejecutor) |
| Setup de repo, CI/CD, despliegue | `ci-cd-and-automation`, `git-workflow-and-versioning`, `shipping-and-launch` | 执行者 (Ejecutor) |
| Investigar APIs / dudas técnicas | `source-driven-development`, `doubt-driven-development` | 研究员 (Investigador) |
| Bugs / fallos | `debugging-and-error-recovery` | 执行者 (o 研究员 para causa raíz) |
| Revisión de código | `code-review-and-quality` | 审阅者 (Revisor) |
| Seguridad (RLS, auth, secretos) | `security-and-hardening` | 审阅者 (variante seguridad) |
| UI / pantallas / métricas | `frontend-ui-engineering` | 执行者 / 数据可视化师 (dashboards) |
| Documentación / ADRs | `documentation-and-adrs` | 文档撰写师 (Redactor) |
| Gate `/ship` | `shipping-and-launch` + fan-out (review + security + QA) | El agente principal orquesta el fan-out |

**Protocolo de delegación (obligatorio):** cada encargo a un subagente debe incluir: objetivo; límites; hechos ya establecidos; la(s) skill(s) a invocar con ruta exacta (`.agents/skills/<nombre>/SKILL.md`); entregable esperado; y formato de retorno corto (≈1000 caracteres), con el detalle hacia archivos del repositorio. Los subagentes no ven la conversación principal: el encargo debe ser autosuficiente.

## 3. Flujo de Trabajo por Fases y Mapeo de Subagentes

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

---

## 4. Reglas de Modificación de Archivos y Entorno

- **Preservación del contexto:** No reescribir archivos completos innecesariamente; utilizar ediciones de diff precisas.
- **Manejo de dependencias:** No instalar paquetes externos sin justificar previamente por qué la biblioteca estándar o las dependencias existentes no resuelven el problema.
- **Manejo de secretos:** Cero credenciales, tokens o API keys en código fuente; utilizar siempre variables de entorno (`.env.local`).
- **Commits:** Seguir la convención de [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: <descripción corta>`
  - `fix: <descripción corta>`
  - `test: <descripción corta>`
  - `refactor: <descripción corta>`
  - `docs: <descripción corta>`

## 5. Compuerta de Salida (Definition of Done)

Una tarea sólo se marca como concluida cuando el agente haya verificado:

- [ ] La especificación técnica y las tareas en `tasks/todo.md` están cumplidas.
- [ ] Todos los tests nuevos y preexistentes se ejecutan y aprueban exitosamente (`npm test` o test runner local).
- [ ] Cero errores de compilación / tipos (`tsc --noEmit` o equivalente del stack).
- [ ] No existen advertencias críticas de linter ni de consola del navegador.
- [ ] La revisión en los 5 ejes ha sido superada o el cambio superó la compuerta `/ship`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
