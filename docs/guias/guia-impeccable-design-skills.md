# Guía Integral de Impeccable Design Skills

> **Documento de Referencia Técnica y Operativa**  
> Basado en la especificación oficial de [pbakaus/impeccable](https://github.com/pbakaus/impeccable) y su documentación técnica en [impeccable.style/docs](https://impeccable.style/docs/).

---

## Índice

1. [¿Qué es Impeccable y cuál es su filosofía?](#1-qué-es-impeccable-y-cuál-es-su-filosofía)
2. [Instalación y Configuración Multi-Entorno](#2-instalación-y-configuración-multi-entorno)
3. [Arquitectura de Contexto y Gestión del Sistema de Diseño](#3-arquitectura-de-contexto-y-gestión-del-sistema-de-diseño)
4. [Cómo y Cuándo Usar para un NUEVO Elemento, Página o Componente](#4-cómo-y-cuándo-usar-para-un-nuevo-elemento-página-o-componente)
5. [Cómo y Cuándo Usar para ANALIZAR y MEJORAR Interfaces Existentes](#5-cómo-y-cuándo-usar-para-analizar-y-mejorar-interfaces-existentes)
6. [Iteración Visual en Vivo en el Navegador (`Live Mode`)](#6-iteración-visual-en-vivo-en-el-navegador-live-mode)
7. [Motor de Hooks Automáticos y Detección de Antipatrones](#7-motor-de-hooks-automáticos-y-detección-de-antipatrones)
8. [Matriz Completa de los 24 Comandos](#8-matriz-completa-de-los-24-comandos)
9. [Directrices de Aplicación en Nuestro Ecosistema](#9-directrices-de-aplicación-en-nuestro-ecosistema)

---

## 1. ¿Qué es Impeccable y cuál es su filosofía?

Creado por **Paul Bakaus** (diseñador e ingeniero de software veterano de Google y ex-Anthropic, autor de la conocida skill original `frontend-design`), **Impeccable** es un sistema integral de dirección, crítica y ejecución de diseño de interfaces creado específicamente para agentes de código impulsados por IA.

### Su Misión: Erradicar el _"AI Slop"_ en Frontend

Los modelos de lenguaje tienden a converger en plantillas visuales repetitivas debido a sus datos de entrenamiento comunes. Sin una guía estricta, la IA comete sistemáticamente los mismos vicios estéticos:

- Uso indiscriminado de la fuente tipográfica **Inter** o tipografías por defecto del sistema sin intención tipográfica.
- Degradados predecibles de morado a azul (_purple-to-blue gradients_).
- **Tarjetas anidadas dentro de tarjetas** (_cards inside cards_) y necesidad de encerrar cada sección en cajas con bordes grises.
- Texto gris medio sobre fondos de color, rompiendo los ratios mínimos de contraste.
- Cuadrados redondeados con íconos flotando sin propósito semántico sobre los títulos.
- Falta de ritmo espacial, agrupamiento por proximidad y consideración para el operador real.

### Pilares Fundamentales de Impeccable

1. **1 Skill Maestra Unificada (`impeccable`):** Un único punto de entrada orquestador.
2. **24 Comandos Especializados:** Un vocabulario de diseño compartido para que humano y agente se comuniquen con precisión quirúrgica.
3. **61 Reglas Deterministas Locales:** Un motor compilado en binario (`~/.impeccable/bin/`) que audita en tiempo real sin costo de tokens, sin llamadas de red y sin claves de API.
4. **Desacoplamiento Estricto de Contexto:** La identidad del producto y sus usuarios (`PRODUCT.md`) se mantiene separada de los tokens y reglas estéticas (`DESIGN.md`).
5. **Iteración Visual en el Navegador:** Capacidad de comparar variantes funcionales directamente sobre la pantalla renderizada antes de comprometer el código fuente.

---

## 2. Instalación y Configuración Multi-Entorno

Impeccable funciona mediante un ejecutable autónomo compilado localmente. Incluye lanzadores para sistemas Unix (`scripts/impeccable`) y Windows (`impeccable.cmd`).

### A. Instalación Universal vía CLI (Método Oficial Recomendado)

Desde la raíz del proyecto, ejecuta en la terminal:

```bash
npx impeccable install
```

El instalador detecta automáticamente el arnés o editor en uso (`.gemini`, `.cursor`, `~/.claude`, `~/.codex`, `~/.grok`, `~/.hermes`, etc.):

- **Alcance por proyecto (predeterminado):** Instala las configuraciones en la carpeta local del proyecto.
- **Alcance global:** `npx impeccable install --scope=global` para tenerlo disponible en todos tus repositorios.
- **Omitir hooks si se prefiere:** `npx impeccable install --no-hooks`.

Para actualizar Impeccable en el futuro:

```bash
npx impeccable update
```

### B. Métodos Alternativos de Instalación

- **Skills Manager genérico:**
  ```bash
  npx skills add pbakaus/impeccable
  npx skills update impeccable
  ```
- **Claude Code (Marketplace de Plugins):**
  ```bash
  /plugin marketplace add pbakaus/impeccable
  ```
- **Grok Build:**
  ```bash
  grok plugin install pbakaus/impeccable#plugin --trust
  ```
- **VS Code (GitHub Copilot):**
  ```bash
  code --install-extension renaissance-geek.impeccable
  ```
- **Git Submodule (para equipos que versionan sus dependencias de agentes):**
  ```bash
  git submodule add https://github.com/pbakaus/impeccable .impeccable
  npx impeccable link --source=.impeccable --providers=gemini,cursor,claude
  ```

### C. Inicialización Obligatoria del Proyecto

Una vez instalado, el primer paso en cualquier repositorio es ejecutar:

```bash
/impeccable init
```

1. **Entrevista de Producto:** El agente analiza el código y realiza preguntas puntuales sobre quién es la audiencia, restricciones técnicas, modelo operativo y tono.
2. **Generación de `PRODUCT.md`:** Guarda de forma permanente la verdad duradera del producto.
3. **Documentación del Sistema Visual Existente:** Si el proyecto ya cuenta con una interfaz construida (componentes Tailwind, variables CSS, temas claro/oscuro):
   ```bash
   /impeccable document
   ```
   Lee los componentes reales y genera `DESIGN.md` y `.impeccable/design.json`.

---

## 3. Arquitectura de Contexto y Gestión del Sistema de Diseño

Impeccable organiza el conocimiento de la interfaz en capas bien delimitadas:

```
┌────────────────────────────────────────────────────────┐
│                      PRODUCT.md                        │
│   (Audiencia, contexto operativo, restricciones, voz)  │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
 ┌──────────────┐                       ┌──────────────┐
 │  DESIGN.md   │                       │ .impeccable/ │
 │ (Tokens,     │                       │ surfaces/    │
 │  tipografía, │                       │ (Briefs de   │
 │  paleta,     │                       │  páginas     │
 │  componentes)│                       │  específicas)│
 └──────────────┘                       └──────────────┘
```

### 1. `PRODUCT.md` (La verdad duradera)

Define **para quién es y qué resuelve** la aplicación. Contiene:

- Perfil del usuario (ej. operadores de taller bajo presión de tiempo, cajeros de mostrador, clientes finales).
- Restricciones del entorno (pantallas táctiles sucias, luz ambiental variable, pantallas secundarias).
- Voz y tono de las comunicaciones.
- Cero mención a colores hex o fuentes; es duradero independientemente de los rediseños visuales.

### 2. `DESIGN.md` y `.impeccable/design.json` (El sistema visual)

- Registra la paleta de colores semántica (roles primarios, neutros tintados, estados de alerta).
- Escala tipográfica con tamaños proporcionales y alturas de línea.
- Reglas de layout, cuadrícula y escalas de espaciado (4px/8px).
- **Prevención de Desviación (_System Drift_):** El detector avisa si un archivo nuevo empieza a usar valores arbitrarios (`bg-[#38291a]`) en lugar de los tokens documentados.

### 3. Extracción de Componentes con `/impeccable extract`

Cuando en una página se crea un patrón visualmente exitoso que debe estandarizarse en todo el software:

```bash
/impeccable extract the repeated filter controls into our design system
```

Impeccable extrae las clases y la estructura a componentes compartidos reutilizables, actualizando `DESIGN.md`.

### 4. Los 4 Modos de Superficie (_Surface Modes_)

Al trabajar sobre una vista, Impeccable adapta sus criterios al tipo de superficie:

| Modo de Superficie | Casos de uso típicos                         | Prioridad de diseño                                                                                                         |
| :----------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **`Operate`**      | Dashboards, Taller, Pedidos, POS, Comandas   | Alta densidad de datos, escaneabilidad visual inmediata, atajos, botones amplios para targets táctiles, cero distracciones. |
| **`Persuade`**     | Landing pages, marketing, catálogo, pricing  | Alto impacto visual, contraste emocional, jerarquía dirigida hacia llamadas a la acción (CTA).                              |
| **`Read`**         | Manuales de usuario, documentación, reportes | Confort tipográfico, longitud de línea controlada (65–75 caracteres), contraste óptimo para lectura prolongada.             |
| **`Experience`**   | Portafolios, vitrinas interactivas           | Micro-animaciones fluidas, riqueza visual e interactividad exploratoria.                                                    |

---

## 4. Cómo y Cuándo Usar para un NUEVO Elemento, Página o Componente

### ¿Cuándo recurrir a Impeccable para trabajo nuevo?

- Al crear una **página o pantalla completa** (ej. nueva vista de conciliación, pantalla de clientes, reporte financiero).
- Al maquetar un **componente complejo** (ej. comanda digital interactiva, modal de pago multimoneda, selector de filtros).
- Cuando se tiene clara la lógica de backend o datos, pero se necesita una presentación intuitiva, accesible y ergonómica.

### Dos Enfoques: Comp-led vs. Code-led

```
                   ¿Diseñar algo nuevo?
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
   Comp-led (Mockup Primero)           Code-led (Código Directo)
   • Requiere generación de imagen.    • Sin dependencias de imagen.
   • Ideal para marketing/landings.    • Ideal para ERP / Sistemas SaaS.
   • Selector de dirección visual      • Estructura semántica inmediata
     en el navegador.                    respetando DESIGN.md.
   • Múltiples pases imagen-código.    • Coherencia de código desde el turno 1.
```

### Comandos y Sintaxis para Nuevas Creaciones

1. **Planificar antes de codificar:**

   ```bash
   /impeccable shape checkout drawer for fast cashier operations
   ```

   Genera un brief detallado con la jerarquía, estados y flujos antes de escribir el primer archivo `.tsx`.

2. **Diseñar directamente la interfaz:**

   ```bash
   /impeccable design a production queue dashboard for workshop operators
   ```

   Aplica el modo `Operate`, define la densidad correcta y reutiliza los componentes existentes en `DESIGN.md`.

3. **Flujo completo Shape-then-Build:**
   ```bash
   /impeccable craft customer order tracking view
   ```

---

## 5. Cómo y Cuándo Usar para ANALIZAR y MEJORAR Interfaces Existentes

Este flujo se utiliza cuando una pantalla ya funciona a nivel de lógica, pero se siente recargada, difícil de entender para el operador, "parecida a una plantilla genérica" o presenta fallos de contraste y ergonomía.

### Fase 1: Diagnóstico Integral

- **`/impeccable critique <objetivo>` (Auditoría UX y Percepción Visual):**
  Evalúa el flujo de atención del ojo, la jerarquía visual, la relación señal/ruido y la claridad cognitiva del componente o pantalla.
- **`/impeccable audit <objetivo>` (Auditoría Técnica y Accesibilidad):**
  Verifica ratios de contraste según WCAG (AA/AAA), tamaños de objetivos táctiles en móviles (mínimo 44x44px), soporte de navegación con teclado (`focus-visible`) y comportamiento responsive.

---

### Fase 2: Pases Quirúrgicos de Refinamiento

En lugar de pedir "mejora este diseño" (lo que provoca que la IA reescriba archivos enteros y rompa estilos), Impeccable utiliza **pases atómicos con un solo objetivo por comando**:

```
                         Pases de Refinamiento
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
  ESTRUCTURA Y RITMO           ESTILO Y COLOR            ROBUSTEZ Y COPIA
• /distill (quitar ruido)    • /typeset (fuentes)      • /clarify (textos/labels)
• /layout (alineación)       • /colorize (paleta)      • /harden (casos extremos)
• /bolder | /quieter         • /animate (movimiento)   • /onboard (estados vacíos)
                                   │
                                   ▼
                         TOQUE FINAL MAESTRO
                               /polish
```

#### Descripción Detallada de cada Pase:

1. **`/impeccable distill <target>` — Destilación:**
   Elimina bordes redundantes, tarjetas anidadas dentro de tarjetas, sombras innecesarias y fondos superpuestos. Aplica la regla de "reducir a lo esencial".
2. **`/impeccable layout <target>` — Estructura y Ritmo:**
   Ajusta espaciados basándose en una escala armónica (múltiplos de 4px/8px), agrupa datos vinculados por proximidad y da aire a secciones saturadas.
3. **`/impeccable typeset <target>` — Tipografía:**
   Define jerarquía clara entre titulares, etiquetas secundarias y valores numéricos. Ajusta pesos (_font-weight_), tamaños relativos y alturas de línea (_line-height_).
4. **`/impeccable colorize <target>` — Semántica de Color:**
   Sustituye colores genéricos o aleatorios por una paleta con significado funcional (verde para pagado/éxito, ámbar para pendiente, rojo para alertas). Aplica tonos neutros tintados en lugar de grises puros.
5. **`/impeccable clarify <target>` — Claridad de Copia y Etiquetas:**
   Reescribe textos ambiguos, etiquetas crípticas o mensajes de error técnicos para que el operador sepa exactamente qué hace cada acción.
6. **`/impeccable bolder` / `/impeccable quieter` — Volumen Visual:**
   - `bolder`: Amplifica la presencia de una llamada a la acción o tarjeta principal que pasa desapercibida.
   - `quieter`: Suaviza elementos visualmente agresivos que compiten con la tarea principal.
7. **`/impeccable harden <target>` — Resiliencia ante Casos Extremos:**
   Asegura que el diseño no se rompa ante textos extremadamente largos (truncamiento con tooltip), nombres extensos, pantallas sin datos (_empty states_), estados de carga lentos (_skeletons_) y errores de API.
8. **`/impeccable onboard <target>` — Activación:**
   Diseña estados iniciales, mensajes explicativos cuando una lista está vacía por primera vez y rutas guiadas para el usuario principiante.
9. **`/impeccable animate <target>` — Micro-interacciones:**
   Añade transiciones funcionales (acordeones suaves, cambios de estado en botones, feedback visual de guardado).
10. **`/impeccable delight <target>` — Detalles de Calidad:**
    Incorpora micro-momentos gratificantes que transmiten artesanía de software (feedback satisfactorio al completar un pedido).
11. **`/impeccable overdrive <target>` — Vanguardia Visual:**
    Implementa efectos visuales avanzados (fondos con ruido sutil, iluminación reactiva, profundidad) para interfaces que requieren distinción visual.
12. **`/impeccable adapt <target>` — Adaptabilidad de Dispositivo:**
    Ajusta una interfaz para pantallas táctiles de taller, terminales móviles de despacho o tablets de mostrador.
13. **`/impeccable polish <target>` — El Toque de Envío (_Ship-ready_):**
    Pase final que armoniza radios de curvatura, alinea bordes por subpíxel y garantiza estados `hover` y `active` impecables en temas claro y oscuro sin alterar la lógica de negocio.

---

## 6. Iteración Visual en Vivo en el Navegador (`Live Mode`)

Uno de los mayores avances de Impeccable es la capacidad de trabajar directamente con la aplicación en ejecución en tu servidor local (`localhost`).

```
  [Tu Aplicación Local] ─── (Helper Impeccable) ─── [Agente de Código]
           │                                                │
           ▼                                                ▼
  Barra de herramientas:                            Genera 3 opciones
  • Pick (clic en pantalla)                         en vivo en el DOM
  • Steer (directriz global)                                │
  • Tune (afinar espaciado)                                 │
           │                                                │
           └────────── Presionas [ACCEPT] ◄─────────────────┘
                                  │
                 Se escribe el código definitivo
                   en el archivo .tsx original
```

### A. Inspección y Selección con "Pick"

1. Ejecutas `/impeccable live`.
2. Se abre tu navegador con la barra de herramientas de Impeccable.
3. Activas **Pick** y haces clic sobre cualquier botón, tarjeta o tabla.
4. Aparece un campo de petición flotante justo al lado del elemento seleccionado. Escribes lo que necesitas (ej. _"reorganiza esta tarjeta para que la fecha y el botón de acción queden agrupados a la derecha"_).

### B. Generación y Comparación de Variantes con `/impeccable generate`

Desde el chat de tu agente puedes pedir:

```bash
/impeccable generate 3 layout variants of the workshop action bar
```

- Impeccable conecta con la página y renderiza las 3 alternativas.
- En la barra de herramientas puedes avanzar y retroceder entre la Variante 1, 2 y 3 para ver cómo lucen con datos reales.
- El panel **Tune** permite deslizar controles para ajustar espacios o tamaños al vuelo.
- Al hacer clic en **Accept**, el código se fusiona limpiamente en el archivo fuente original y los andamios de prueba se destruyen automáticamente.

---

## 7. Motor de Hooks Automáticos y Detección de Antipatrones

El motor determinista de Impeccable vigila las modificaciones del agente para garantizar que nunca introduzca defectos de diseño.

### Reglas Clave que el Detector Evalúa (61 Reglas Estáticas)

- **Fuentes Prohibidas por Defecto:** Alerta sobre el uso de Inter, Arial, Roboto o fuentes del sistema genéricas sin justificación documentada.
- **Contraste Deficiente:** Alerta sobre textos grises sobre fondos de color o ratios inferiores a 4.5:1 en texto estándar.
- **Colores Neutros Puros:** Prohíbe `#000000` o gris neutro puro; exige tintado armónico con la paleta de la aplicación.
- **Cajas Dentro de Cajas:** Detecta cuando una tarjeta contiene tarjetas secundarias con bordes redundantes que saturan la vista.
- **Tipografía con Degradados o Brillos Excesivos:** Evita textos con degradados ilegibles o sombras de neón (_glows_).
- **Easing Desactualizado:** Prohíbe curvas de animación elásticas o de rebote tipo Flash.
- **Iconografía Flotante Desconectada:** Detecta íconos metidos en cajas redondeadas que no aportan significado.

### Ciclo de Entrega de Hallazgos

- En **Cursor:** El hook analiza la edición _antes_ de aplicarla y puede bloquearla si introduce un antipatrón crítico para que el agente la corrija antes de escribir.
- En **Claude Code / Codex / Gemini CLI:** El hook entrega retroalimentación enfocada tras la edición de componentes y corre un escaneo global al finalizar el turno (`Stop` event).

### Diagnóstico del Sistema con `/impeccable doctor`

Si en algún momento sospechas que los hooks no se están ejecutando o que un archivo de contexto está desincronizado, ejecuta:

```bash
/impeccable doctor
```

El comando audita la salud de los scripts, rutas de binarios y estado de hooks en todo el repositorio.

---

## 8. Matriz Completa de los 24 Comandos

| Categoría       | Comando                 | Propósito Principal                                                          |
| :-------------- | :---------------------- | :--------------------------------------------------------------------------- |
| **Crear**       | `/impeccable`           | Punto de entrada general: describe en lenguaje natural qué quieres hacer.    |
|                 | `/impeccable shape`     | Planifica la estructura, estados y jerarquía antes de codificar.             |
|                 | `/impeccable craft`     | Ciclo integral de concepción, generación visual y maquetación a código.      |
| **Evaluar**     | `/impeccable critique`  | Evaluación de diseño UX: ritmo, jerarquía visual y carga cognitiva.          |
|                 | `/impeccable audit`     | Chequeo técnico: contraste WCAG, responsive y accesibilidad.                 |
| **Refinar**     | `/impeccable layout`    | Reorganiza la cuadrícula, espaciado y ritmo entre componentes.               |
|                 | `/impeccable typeset`   | Escala tipográfica, jerarquía de tamaños, pesos y legibilidad.               |
|                 | `/impeccable colorize`  | Paleta estratégica con propósito semántico y neutros tintados.               |
|                 | `/impeccable bolder`    | Aumenta el impacto y peso visual de un elemento relegado.                    |
|                 | `/impeccable quieter`   | Suaviza elementos invasivos para limpiar la pantalla.                        |
|                 | `/impeccable animate`   | Agrega microinteracciones y transiciones con propósito funcional.            |
|                 | `/impeccable delight`   | Detalles sutiles y feedback gratificante al completar tareas.                |
|                 | `/impeccable overdrive` | Efectos avanzados de vanguardia para componentes especiales.                 |
| **Simplificar** | `/impeccable distill`   | Elimina recuadros superfluos, ruido visual y tarjetas anidadas.              |
|                 | `/impeccable clarify`   | Mejora el microcopy, textos explicativos y etiquetas de acción.              |
|                 | `/impeccable adapt`     | Reconfigura interfaces para pantallas táctiles, talleres o móviles.          |
| **Robustecer**  | `/impeccable polish`    | Pase final de alineación, radios consistentes y preparación para producción. |
|                 | `/impeccable harden`    | Protección contra estados vacíos, textos largos y fallos de red.             |
|                 | `/impeccable onboard`   | Pantallas de bienvenida y estados de inicio vacíos pero orientativos.        |
|                 | `/impeccable optimize`  | Optimización de tiempos de render y eficiencia visual.                       |
| **Sistema**     | `/impeccable init`      | Entrevista inicial del producto y creación de `PRODUCT.md`.                  |
|                 | `/impeccable document`  | Lee el código del proyecto y formaliza el sistema en `DESIGN.md`.            |
|                 | `/impeccable extract`   | Convierte componentes repetidos en piezas compartidas del sistema.           |
|                 | `/impeccable live`      | Inicia el modo interactivo con barra de herramientas en el navegador.        |
|                 | `/impeccable generate`  | Genera variantes comparativas de un componente en el navegador.              |

> **Atajos Rápidos con `/impeccable pin`:**  
> Puedes crear alias directos escribiendo `/impeccable pin audit` para usar simplemente `/audit` en tu chat de desarrollo.

---

## 9. Directrices de Aplicación en Nuestro Ecosistema

Para aplicar Impeccable en nuestro proyecto sin fricciones y respetando las reglas de ingeniería de [AGENTS.md](file:///c:/Users/medin/Documents/Proyectos/APSys-Gemini/AGENTS.md):

1. **Prioridad en Modo `Operate`:**  
   Nuestro sistema (gestión de pedidos, producción en taller, comandas y caja) debe diseñarse siempre bajo el modo de superficie `Operate`: densidad de información controlada, botones táctiles generosos para el operador y excelente legibilidad visual a distancia.
2. **Respeto a los Temas Claro y Oscuro:**  
   Todo pase de `/impeccable polish` o `/impeccable colorize` debe verificar explícitamente la visibilidad de los estados `hover` tanto sobre fondos claros como sobre fondos oscuros.
3. **Cero Emoticones / Iconografía Coherente:**  
   Todas las mejoras visuales deben continuar utilizando exclusivamente **Lucide React**, evitando emojis o íconos no tipados.
4. **Respeto al Ciclo BDD/TDD:**  
   Los cambios de layout o maquetación no deben alterar la lógica de negocio ni romper los tests automatizados de la suite de pruebas.
