# Guía Maestra de Skills de Matt Pocock
> **Ingeniería Real para Agentes de Código — No Vibe Coding**  
> Basado en la especificación oficial de [mattpocock/skills](https://github.com/mattpocock/skills) y la filosofía técnica de Matt Pocock (*Total TypeScript, TypeScript Wizard, educador de referencia mundial en TypeScript y arquitectura de software*).

---

## Índice
1. [Filosofía Central: "Real Engineering, Not Vibe Coding"](#1-filosofía-central-real-engineering-not-vibe-coding)
2. [Los Dos Grandes Problemas que Resuelve](#2-los-dos-grandes-problemas-que-resuelve)
3. [Instalación y Configuración Multi-Entorno](#3-instalación-y-configuración-multi-entorno)
4. [El Flujo Principal de Ingeniería (Main Flow: Idea → Ship)](#4-el-flujo-principal-de-ingeniería-main-flow-idea--ship)
5. [Rutas de Entrada (On-Ramps) para Trabajo Reactivo](#5-rutas-de-entrada-on-ramps-para-trabajo-reactivo)
6. [Arquitectura de Código: Módulos Profundos (*Deep Modules*)](#6-arquitectura-de-código-módulos-profundos-deep-modules)
7. [TDD Riguroso y Costuras de Prueba (*Seams*)](#7-tdd-riguroso-y-costuras-de-prueba-seams)
8. [Auditoría de Código en Dos Ejes Paralelos (`code-review`)](#8-auditoría-de-código-en-dos-ejes-paralelos-code-review)
9. [Productividad, Asistentes y Fronteras de Fase](#9-productividad-asistentes-y-fronteras-de-fase)
10. [Catálogo Completo de las 38 Skills Clasificadas](#10-catálogo-completo-de-las-38-skills-clasificadas)
11. [La Tríada Definitiva en APSys: Matt Pocock + Impeccable + Emil Kowalski](#11-la-tríada-definitiva-en-apsys-matt-pocock--impeccable--emil-kowalski)

---

## 1. Filosofía Central: "Real Engineering, Not Vibe Coding"

El concepto de *"vibe coding"* (dejar que la IA escriba cientos de líneas mientras el desarrollador cruza los dedos esperando que funcione) es la antítesis de la ingeniería de software profesional.

Matt Pocock construyó este conjunto de skills a partir de décadas de experiencia en desarrollo para atacar los fallos estructurales que sufren los desarrolladores cuando trabajan con agentes autónomos (Claude Code, Codex, Cursor, Gemini CLI, etc.):

### Por Qué Fallan los Frameworks Monolíticos (GSD, BMAD, Spec-Kit)
Muchos frameworks de IA intentan "adueñarse de todo el proceso" imponiendo pipelines rígidos y masivos. El resultado:
- Le quitan el control al desarrollador humano.
- Cuando la IA comete un error en una etapa temprana, el error se arrastra y resolverlo dentro del framework se vuelve una pesadilla.
- Consumen cantidades exorbitantes de contexto con ceremonias innecesarias.

### La Alternativa de Matt Pocock: Skills Atómicas, Composables y Precisas
- **Pequeñas y Modulares:** Cada skill hace una sola cosa con maestría.
- **Independientes del Modelo:** Funcionan con Claude, GPT, Gemini o cualquier LLM moderno.
- **Control Humano en los Puntos Críticos:** La IA investiga hechos en el código, pero **las decisiones clave las toma el humano** a través de entrevistas estructuradas.

---

## 2. Los Dos Grandes Problemas que Resuelve

### Problema #1: "El agente no hizo lo que yo quería" (Desalineación)
> *"Nadie sabe exactamente lo que quiere hasta que lo ve."* — David Thomas & Andrew Hunt, *The Pragmatic Programmer*

El fallo más costoso en el desarrollo con IA es la brecha de comunicación inicial: tú crees que el agente entendió el requerimiento, pero cuando ves el código, descubres que asumió docenas de decisiones críticas en silencio.

- **La Solución: El Interrogatorio Relacual (*Grilling Session*):**  
  Mediante `/grill-me` o `/grill-with-docs`, el agente tiene prohibido escribir código de inmediato. Construye un **árbol de diseño (*design tree*)** y te entrevista en rondas.
- **La Frontera de Preguntas (*The Frontier*):**  
  El agente calcula qué preguntas puede hacer *ahora mismo* porque sus prerrequisitos ya están resueltos.
- **Formato Eficiente:**  
  Cada pregunta viene numerada (`Q1`, `Q2`), con opciones concretas y una **respuesta recomendada** por el agente. El desarrollador puede simplemente responder *"sí"* para aceptar la recomendación del agente y avanzar a la siguiente rama del árbol.
- **Búsqueda de Hechos vs. Toma de Decisiones:**  
  Buscar hechos en el sistema de archivos o herramientas es tarea del agente; **tomar decisiones de arquitectura o negocio es tarea del humano**.

---

### Problema #2: "El agente es demasiado verboso y no nos entendemos"
> *"Con un lenguaje ubicuo, las conversaciones entre desarrolladores y las expresiones del código se derivan del mismo modelo de dominio."* — Eric Evans, *Domain-Driven Design (DDD)*

Cuando un agente aterriza en un repositorio, no conoce la jerga del proyecto. Empieza a usar 20 palabras donde bastaría una sola, inventa sinónimos confusos para conceptos existentes y confunde entidades del negocio.

- **La Solución: Lenguaje Ubicuo y Memoria de Dominio (`domain-modeling`):**  
  Se mantiene un archivo vivo **`GLOSSARY.md`** en la raíz del proyecto.
  - *Antes:* *"Hay un problema cuando una lección dentro de una sección de un curso se hace real en el disco..."*
  - *Después:* *"Hay un problema en la cascada de materialización."*
- **Registros de Decisiones de Arquitectura (`docs/adr/*.md`):**  
  Las decisiones difíciles de revertir se documentan inmediatamente en un ADR para que futuras sesiones de agentes no las cuestionen ni las deshagan.

---

## 3. Instalación y Configuración Multi-Entorno

Las skills están disponibles a través del gestor universal `skills.sh` y plugins oficiales:

### Métodos de Instalación

```bash
# Claude Code (Actualización automática)
claude plugin install mattpocock-skills@claude-plugins-official

# Codex
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock

# GitHub Copilot (CLI y VS Code)
copilot plugin marketplace add mattpocock/skills
copilot plugin install mattpocock-skills@mattpocock

# Gemini CLI / Antigravity (Rutas directas)
gemini skills install https://github.com/mattpocock/skills.git --path skills/engineering
gemini skills install https://github.com/mattpocock/skills.git --path skills/productivity

# Instalador universal npx (Cursor, Windsurf, OpenCode, etc.)
npx skills@latest add mattpocock/skills
```

### Paso Obligatorio Inicial: `/setup-matt-pocock-skills`
Se ejecuta una sola vez al configurar el repositorio. El asistente te preguntará:
1. Qué gestor de incidencias utilizas (GitHub Issues, GitLab, archivos locales en markdown, Linear, etc.).
2. Cuál es tu vocabulario de etiquetas de triaje (ej. `bug`, `feature`, `needs-spec`, `ready-for-agent`).
3. Dónde almacenar los documentos de arquitectura (`docs/adr/`, `GLOSSARY.md`).

---

## 4. El Flujo Principal de Ingeniería (Main Flow: Idea → Ship)

El camino estándar por el que viaja cualquier funcionalidad seria dentro del repositorio:

```
[Idea / Requerimiento]
       │
       ▼
 1. /grill-with-docs ──► Entrevista relacual + actualiza GLOSSARY.md y docs/adr/
       │
       ├─► ¿Dudas de UI o estado interactivo? ──► [/prototype vía /handoff]
       │                                                      │
       ▼                                                      ▼
 2. /to-spec ──────────► Sintetiza el acuerdo en una especificación en el tracker
       │
       ▼
 3. /to-tickets ───────► Divide en rebanadas verticales (Tracer Bullets con bloqueos)
       │
       ▼
 4. /implement ────────► Ejecuta ticket a ticket respetando el orden de dependencias
       │
       ▼
 5. /tdd ──────────────► Bucle Rojo-Verde-Refactor sobre costuras (seams) públicas
       │
       ▼
 6. /code-review ──────► Dos subagentes paralelos: Estándares vs. Especificación
       │
       ▼
 7. /pr ───────────────► Redacta el Pull Request profesional con evidencia de tests
       │
       ▼
 8. /retro ────────────► Retrospectiva de sesión: ¿qué falló y qué regla aprendemos?
```

### Detalle de cada Fase del Flujo Principal:

1. **`/grill-with-docs`:**  
   Inicia la entrevista. Si el proyecto ya tiene un `GLOSSARY.md`, el agente lo consulta para desafiarte si usas términos contradictorios (*"Tu glosario define 'anulación' como X, pero estás usándolo como Y"*).
2. **`/prototype` (Desvío opcional):**  
   Si una decisión sobre la máquina de estados o la interfaz no se puede resolver en texto, se genera un prototipo desechable en una rama `prototype/<nombre>` para probarlo de forma interactiva.
3. **`/to-spec`:**  
   Toma la conversación consensuada y redacta una especificación formal completa sin volver a entrevistar.
4. **`/to-tickets` (Tracer Bullets):**  
   Descompone la especificación en **balas trazadoras (*tracer bullets*)**: rebanadas verticales estrechas que atraviesan todas las capas (Base de Datos → API → UI → Pruebas). Cada ticket declara qué otros tickets lo bloquean. Nunca crea tickets horizontales monolíticos como *"hacer toda la base de datos"*.
5. **`/implement` & `/tdd`:**  
   Implementa el ticket siguiendo el ciclo estricto de pruebas antes de código.
6. **`/code-review`:**  
   Audita el diff frente al commit o rama base en dos ejes paralelos sin mezclar contextos.
7. **`/pr`:**  
   Genera una descripción de PR que explica el qué, el por qué y las decisiones tomadas.
8. **`/retro`:**  
   Analiza la sesión de desarrollo: si hubo fricciones, propone nuevas reglas para `AGENTS.md` o ajustes en el glosario.

---

## 5. Rutas de Entrada (On-Ramps) para Trabajo Reactivo

No todo el trabajo parte de una idea nueva; a menudo el software requiere mantenimiento, diagnóstico de incidentes o triaje de peticiones externas:

### A. Triaje de Peticiones y Errores Entrantes (`/triage`)
- Se utiliza exclusivamente para tickets que **tú no creaste** (reportes de usuarios, bugs de clientes, PRs de terceros).
- Opera como una máquina de estados: categoriza, reproduce, verifica si falta información y, si es necesario, aplica un mini-grilling al emisor antes de generar un ticket listo para que lo tome un agente (`agent-ready brief`).

### B. Diagnóstico Científico de Bugs Difíciles (`/diagnosing-bugs`)
Diseñado para bugs intermitentes, regresiones sutiles o caídas de rendimiento:
1. **Redacción de Secretos Obligatoria:** Oculta cualquier token o credencial antes de imprimir logs (`<REDACTED>`).
2. **Fase 1: Construir el Bucle de Retroalimentación Cerrado (*Tight Feedback Loop*):**  
   *Esta es la regla de oro.* El agente tiene terminantemente prohibido proponer parches o teorizar sobre el código hasta que no tenga un comando o test automatizado reproducible que **falle exactamente con este bug**.
   - Orden de búsqueda: 1) Test automatizado, 2) Script curl / HTTP, 3) Comando de terminal.
3. **Fase 2: Aislamiento por Bisección:** Localizar la causa raíz.
4. **Fase 3: Test de Regresión y Solución:** El test que antes fallaba ahora debe pasar en verde.
5. **Fase 4: Retrospectiva (`/retro`):** Analizar qué defecto de arquitectura permitió que el bug ocurriera.

### C. Proyectos Nebulosos y Gigantescos (`/wayfinder`)
Para iniciativas que son demasiado grandes para caber en una sola sesión de agente (migraciones estructurales, reconstrucción de módulos):
- En lugar de ejecutar código a ciegas, traza un **mapa compartido de decisiones** en el gestor de tickets.
- Cada ticket en Wayfinder resuelve una **decisión**, no una entrega de código.
- Se resuelven una a una hasta que la niebla se despeja y la ruta queda lista para conectar con `/to-spec`.

---

## 6. Arquitectura de Código: Módulos Profundos (*Deep Modules*)

Basado en la filosofía de John Ousterhout (*A Philosophy of Software Design*), la skill `codebase-design` introduce el vocabulario y las reglas de diseño modular que todo agente debe respetar:

```
    ┌───────────────────────────┐
    │     INTERFAZ PEQUEÑA      │ ◄── Pocas funciones, firmas limpias,
    └─────────────┬─────────────┘     fácil de consumir y entender.
                  │
    ┌─────────────┴─────────────┐
    │                           │
    │  IMPLEMENTACIÓN PROFUNDA  │ ◄── Gran cantidad de comportamiento,
    │   (Lógica, validaciones,  │     invariantes, manejo de errores
    │     persistencia, caché)  │     y complejidad encapsulada.
    │                           │
    └───────────────────────────┘
```

### Términos Fundamentales
- **Módulo Profundo (*Deep Module*):** Mucho comportamiento encapsulado tras una interfaz reducida. Otorga gran apalancamiento (*leverage*) a quienes lo consumen.
- **Módulo Superficial (*Shallow Module*):** Un antipatrón común en IA. Clases o funciones pasarelas que sólo envían datos a otro sitio sin aportar valor, agregando ruido cognitivo.
- **Costura (*Seam*):** El límite público visible donde se observa el comportamiento del módulo. **Las pruebas automatizadas sólo deben colocarse en costuras pre-acordadas**, nunca espiando variables internas.
- **Adaptador (*Adapter*):** Pieza de código que traduce la interfaz de un servicio externo a las necesidades internas del sistema.

### Herramienta de Auditoría: `/improve-codebase-architecture`
Escanea el repositorio en busca de módulos superficiales, funciones duplicadas y costuras débiles, generando un **reporte visual interactivo en HTML** para que escojas qué área profundizar.

---

## 7. TDD Riguroso y Costuras de Prueba (*Seams*)

La skill `tdd` define cómo hacer desarrollo guiado por pruebas real con agentes:

1. **Pruebas a Comportamientos, No a Detalles de Implementación:**  
   Una buena prueba describe una capacidad del negocio (*"el cliente puede pagar con saldo mixto"*). Si la estructura interna del código se refactoriza por completo, la prueba debe seguir pasando intacta.
2. **Pacto Previo de Costuras:**  
   Antes de escribir el test, el agente debe acordar con el usuario en qué costura (*seam*) vivirá la prueba.
3. **Sustitución de Aserciones Peligrosas con `@total-typescript/shoehorn`:**  
   En pruebas de TypeScript, la IA suele escribir `const user = { id: '1' } as unknown as User;`. Esto silencia al compilador y oculta errores reales cuando el tipo `User` cambia.  
   Matt Pocock introdujo la skill `/migrate-to-shoehorn` para usar proxies tipados que garantizan que el código de prueba sea seguro sin falsas aserciones.

---

## 8. Auditoría de Código en Dos Ejes Paralelos (`code-review`)

A diferencia de las revisiones genéricas de IA que mezclan estilo con funcionalidad, la skill `/code-review` lanza **dos subagentes aislados en paralelo** sobre el diff:

```
                        git diff <base>...HEAD
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
  [Subagente 1: ESTÁNDARES]                           [Subagente 2: SPEC]
• ¿Cumple las reglas de AGENTS.md?                  • ¿Cumple lo que pedía el ticket?
• ¿Sigue las convenciones del glosario?              • ¿Ignoró algún criterio de aceptación?
• ¿Introduce antipatrones o fugas de tipos?          • ¿Agregó alcance no solicitado?
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   ▼
                  Reporte Unificado Lado a Lado
```

Al correr en hilos de contexto aislados, el evaluador de especificación no se distrae con la sintaxis, y el evaluador de estándares no asume que el código está bien sólo porque funciona.

---

## 9. Productividad, Asistentes y Fronteras de Fase

### A. El Asistente Bash para Humanos (`/wizard`)
Hay tareas que un agente de IA **jamás debe o puede hacer solo**: crear cuentas en Stripe, configurar registros DNS en Cloudflare, dar de alta credenciales en AWS o meter claves secretas en GitHub Secrets.  
- `/wizard` genera un script interactivo en Bash (`scripts/wizard-setup.sh`) con pasos claros, apertura de URLs en el navegador, campos ocultos para contraseñas y validación automática de variables en `.env`.
- Cuando el proceso termina, el script se borra o se versiona como herramienta de onboarding.

### B. El Botón de Freno: `/wait-what`
Si en mitad de una sesión el agente te suelta una parrafada técnica incomprensible, escribir `/wait-what` actúa como un freno de emergencia:  
- El agente se detiene, analiza qué concepto no quedó claro y te re-explica el punto en inglés/español llano, utilizando exclusivamente las definiciones formales de tu `GLOSSARY.md`.

### C. Redacción para Agentes (`/writing-for-agents`)
Guía maestra sobre cómo escribir archivos de instrucciones (`AGENTS.md`, `CLAUDE.md` o skills):
- **Punteros de Contexto (*Context Pointers*):** Exige que cada regla comience con la palabra clave que activa la decisión (*front-loading*), evitando gastar tokens en preámbulos innecesarios.

---

## 10. Catálogo Completo de las 38 Skills Clasificadas

| Categoría | Nombre / Comando | Propósito y Cuándo Invocar |
| :--- | :--- | :--- |
| **Ingeniería** | `/ask-matt` | **El router central:** Guía interactiva que te dice qué skill o flujo usar según tu necesidad. |
| | `/setup-matt-pocock-skills` | Configuración inicial única del repositorio (tracker, etiquetas, docs). |
| | `/grill-with-docs` | Entrevista implacable para refinar una idea guardando `GLOSSARY.md` y ADRs. |
| | `/to-spec` | Sintetiza la conversación acordada en una especificación formal. |
| | `/to-tickets` | Descompone una spec en tickets verticales (*tracer bullets*) con dependencias. |
| | `/implement` | Implementa un conjunto de tickets respetando dependencias. |
| | `/implement-spec` | Variante directa para implementar una especificación completa. |
| | `/tdd` | Ciclo Rojo-Verde-Refactor sobre costuras acordadas. |
| | `/code-review` | Auditoría de PR/diff en dos ejes (Estándares vs. Spec) en subagentes paralelos. |
| | `/pr` | Redacta la descripción del Pull Request con contexto y pruebas. |
| | `/retro` | Retrospectiva de sesión para extraer aprendizajes y nuevas reglas. |
| | `/diagnosing-bugs` | Diagnóstico científico de bugs con feedback loop cerrado y test de regresión. |
| | `/triage` | Triaje de issues y peticiones entrantes de terceros. |
| | `/wayfinder` | Mapeo de decisiones para iniciativas gigantescas y nebulosas. |
| | `/codebase-design` | Vocabulario y diseño de módulos profundos (*deep modules*). |
| | `/improve-codebase-architecture`| Reporte visual HTML de oportunidades de mejora arquitectónica. |
| | `/domain-modeling` | Construcción activa y depuración del modelo de dominio y glosario. |
| | `/prototype` | Construcción de prototipos desechables en rama `prototype/<nombre>`. |
| | `/research` | Delegar investigación de fuentes primarias a un subagente de fondo. |
| | `/wizard` | Generador de scripts bash interactivos para tareas exclusivas de humanos. |
| **Productividad**| `/grill-me` | Entrevista relacual sin escribir archivos (ideal para ideas fuera de un repo). |
| | `/grilling` | La primitiva base del interrogatorio por rondas y frontera de preguntas. |
| | `/handoff` | Compacta la sesión en un archivo markdown para traspasar trabajo entre agentes. |
| | `/wait-what` | Freno de emergencia: pide al agente re-explicar en lenguaje llano con el glosario. |
| | `/to-questionnaire` | Convierte una duda en un cuestionario para enviárselo a un tercero. |
| | `/teach` | Modo de aprendizaje guiado para dominar un concepto paso a paso. |
| | `/writing-for-agents` | Guía para redactar `AGENTS.md` y skills de máxima efectividad. |
| **En Progreso**| `chief-of-staff` | Orquestación de múltiples subagentes para metas de larga duración. |
| | `claude-handoff` | Traspaso inmediato a un agente en segundo plano. |
| | `loop-me` | Entrevista continua para flujos de trabajo dentro del workspace. |
| | `setup-ts-deep-modules` | Configuración de `dependency-cruiser` para blindar módulos en TypeScript. |
| | `writing-beats` | Ensamblado de textos paso a paso fundamentando cada concepto previo. |
| | `writing-fragments` | Extracción de fragmentos de ideas sin estructura previa. |
| | `writing-shape` | Moldeado de artículos párrafo por párrafo. |
| **Utilidades**| `git-guardrails-claude-code` | Hooks para bloquear comandos git peligrosos (`push`, `reset --hard`, etc.). |
| | `migrate-to-shoehorn` | Migración de aserciones `as Type` a mocks parciales tipados en tests. |
| | `setup-pre-commit` | Configuración de Husky, lint-staged, Prettier y chequeo de tipos en pre-commit. |
| | `scaffold-exercises` | Creación de estructuras de ejercicios educativos y tutoriales. |

---

## 11. La Tríada Definitiva en APSys: Matt Pocock + Impeccable + Emil Kowalski

Al combinar estas tres filosofías de ingeniería de software, el proyecto cuenta con el blindaje metodológico más completo posible:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DIVISIÓN DE RESPONSABILIDADES EN APSYS               │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   MATT POCOCK     │    IMPECCABLE     │        EMIL KOWALSKI           │
│   (Ingeniería)    │   (Macro-Diseño)  │        (Micro-Diseño)          │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Anti-vibe-coding│ • Anti-AI-slop.   │ • Respuesta física instantánea.│
│ • GLOSSARY.md /   │ • Modo Operate    │ • Curvas de resorte y easing.  │
│   ADRs de dominio.│   (ERP/Taller).   │ • 60/120fps en GPU.            │
│ • Grilling y      │ • Eliminar cajas  │ • Sensación nativa en móvil    │
│   Tracer Bullets. │   y bordes dobles.│   (sin tap delay ni zoom).     │
│ • Módulos Profundos│ • Hooks estáticos│ • Toasts apilables fluidos     │
│ • TDD y Seams.    │   pre-edit.       │   (Sonner) y drawers (Vaul).   │
│ • Revisión 2 ejes │ • Live Mode en el │ • Pruebas de estrés de datos   │
│   (Standards/Spec)│   navegador.      │   extremos (break-ui).         │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

Con esta guía, cualquier sesión futura puede activar el rigor de Matt Pocock para planificar e implementar la lógica de negocio y arquitectura del sistema sin caer jamás en el descontrol del "vibe coding".
