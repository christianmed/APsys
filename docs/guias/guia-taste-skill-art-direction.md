# Guía Maestra de Taste Skill (v2 & Classic)
> **Dirección de Arte Frontend Anti-Slop y Diseño de Pantallas de Aplicación**  
> Basado en la especificación oficial de [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill), el estudio empírico de 247 sitios premiados (Awwwards / One Page Love) y el análisis de 23 pantallas reales de productos SaaS de élite.

---

## Índice
1. [¿Qué es Taste Skill y cuál es su misión?](#1-qué-es-taste-skill-y-cuál-es-su-misión)
2. [El Registro de "Tells" (Las Tres Olas de AI-Slop)](#2-el-registro-de-tells-las-tres-olas-de-ai-slop)
3. [La Gran División: Páginas (Marketing) vs. Pantallas de Aplicación (App Screens)](#3-la-gran-división-páginas-marketing-vs-pantallas-de-aplicación-app-screens)
4. [Las Reglas de Oro de las Pantallas de Aplicación (Dashboards, Admin, POS)](#4-las-reglas-de-oro-de-las-pantallas-de-aplicación-dashboards-admin-pos)
5. [Las Reglas de la Casa y Leyes del Oficio (House Rules & Laws of Craft)](#5-las-reglas-de-la-casa-y-leyes-del-oficio-house-rules--laws-of-craft)
6. [El Flujo de Ejecución en 10 Pasos ("The Run")](#6-el-flujo-de-ejecución-en-10-pasos-the-run)
7. [Catálogo de Skills del Repositorio](#7-catálogo-de-skills-del-repositorio)
8. [Matriz Comparativa: Taste Skill vs. Impeccable vs. Emil Kowalski vs. Matt Pocock](#8-matriz-comparativa-taste-skill-vs-impeccable-vs-emil-kowalski-vs-matt-pocock)
9. [Cuándo, Cómo y Por Qué Usar Cada Ecosistema en APSys](#9-cuándo-cómo-y-por-qué-usar-cada-ecosistema-en-apsys)

---

## 1. ¿Qué es Taste Skill y cuál es su misión?

Creado por Leonxlnx, **Taste Skill** es un sistema de dirección de arte y maquetación frontend creado con un objetivo explícito: **hacer que los agentes de código diseñen interfaces con identidad propia en lugar de ensamblar la página web promedio que genera la IA**.

A diferencia de guías que dan sugerencias abstractas, Taste Skill se basa en la medición estricta de píxeles, proporciones y contrastes extraídos de:
- **247 sitios web premiados** (*Sites of the Day* de Awwwards y One Page Love).
- **23 pantallas reales de productos de software de referencia** (analizadas en 1440px y 1512px).
- Un inspector automatizado (`inspect.mjs`) que corre en un navegador real midiendo alturas, fuentes, ratios de titulares y áreas vacías antes de dar por buena una pantalla.

---

## 2. El Registro de "Tells" (Las Tres Olas de AI-Slop)

Un *"tell"* es un recurso visual que delata instantáneamente que una interfaz fue generada por IA sin intervención de diseño humano. La mayoría nació como una buena idea en sitios pioneros, pero al repetirse por defecto en millones de prompts se convirtió en cliché.

El inspector de Taste Skill audita y prohíbe (*banned*) o advierte (*warned*) estas tres olas:

### Primera Ola (2023–2024): El Estilo SaaS Genérico
- ❌ **Degradados violeta / índigo:** Usados en fondos, botones y efectos de resplandor (*glows*).
- ❌ **Texto de cabecera con degradado:** Títulos que van de blanco a violeta o celeste.
- ❌ **Paneles de cristal (*glassmorphism*):** Tarjetas semitransparentes con `backdrop-blur`.
- ❌ **El botón brillante "Get Started":** Botones con resplandor o gradientes estridentes.
- ❌ **La tríada de tarjetas idénticas:** Tres cajas con un ícono dentro de un cuadrado redondeado flotando arriba de cada título.
- ❌ **Emojis como balas o íconos:** Manitas saludando (👋), cohetes (🚀) o chispas (✨).
- ❌ **La misma plantilla de Hero:** Título centrado + subtítulo centrado + dos botones + captura de pantalla flotando debajo.

### Segunda y Tercera Ola (2025–2026): El Falso "Minimalismo Técnico"
- ❌ **Cajas Bento Monocromáticas con líneas de 1px por doquier:** Cuadrículas rígidas llenas de bordes que encierran cada dato.
- ❌ **Numeración de índice innecesaria:** Poner `01 / 02 / 03`, `(001)` o `"Step 1"` para adornar secciones sin orden cronológico.
- ❌ **Retículas, miras telescópicas y marcas de corte:** Cruces en las esquinas de los divs (*crosshairs*) para parecer "técnico".
- ❌ **Etiquetas "Eyebrow" / Chips píldora:** La típica etiqueta pequeña flotando arriba del titular (`"New · Version 2.0"`).
- ❌ **Monospace decorativo:** Usar tipografía mono en títulos o párrafos normales fuera de bloques de código reales.

---

## 3. La Gran División: Páginas (Marketing) vs. Pantallas de Aplicación (App Screens)

Una de las mayores innovaciones de Taste Skill es que **jamás aplica las reglas de una landing page a una pantalla de trabajo**. Antes de escribir código, se clasifica el trabajo en dos reinos:

```
                          ¿Qué tipo de trabajo es?
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
      PÁGINA (PAGES)                                PANTALLAS DE APP (APP SCREENS)
• Se lee y se scrollea verticalmente.           • Se trabaja dentro de ella.
• Landings, marketing, portfolios, eventos.     • Dashboards, admin, POS, taller, comandas.
• Títulos gigantes con escala visual 4.3x+.     • Escala tipográfica densa y contenida (14-24px).
• Una imagen dominante o fotografía real.       • Cero imágenes de stock; los datos son el arte.
• Mucho aire y pausas intencionales.            • Eficiencia de espacio, tablas y formularios.
```

---

## 4. Las Reglas de Oro de las Pantallas de Aplicación (Dashboards, Admin, POS)

El capítulo `references/app-screens.md` define los 7 principios extraídos de las 23 mejores herramientas SaaS del mundo:

1. **El color vive en los datos, NO en el cromo:**  
   En las mejores pantallas de trabajo, **sólo el 3% al 5% de los píxeles tienen color**. El cromo (barras de navegación, fondos, paneles) es estrictamente neutro. El color se reserva para el dato que requiere atención inmediata (estado de pedido, error, saldo pendiente).
2. **Los KPIs son tipografía, NO azulejos con íconos:**  
   Ningún software de primer nivel mete un ícono en un círculo coloreado dentro de una tarjeta de métrica, ni le dibuja un sparkline innecesario. El número grande con su etiqueta clara y su variación porcentual sobria habla por sí mismo.
3. **Superficies planas sin sombras pesadas:**  
   17 de las 23 herramientas estudiadas **no usan sombras en sus tarjetas**. La separación entre paneles se hace mediante una línea sutil de 1px o un salto de medio tono en el fondo.
4. **Cero encabezados gigantes tipo Hero:**  
   En una pantalla operativa, el título no debe superar los 24px (la mediana es 16px–18px). El operador no necesita que le den la bienvenida con un titular publicitario; necesita ver sus tareas de inmediato.
5. **Gráficos sin adornos innecesarios:**  
   Si una gráfica tiene una sola serie, no lleva leyenda. Las líneas guía de fondo se limitan a 3–5 líneas tenues o se omiten.
6. **Navegación que retrocede visualmente:**  
   El elemento activo del menú lateral es una píldora gris neutra o un cambio en el color del texto.
7. **Tablas limpias sin efecto cebra:**  
   Prohibido el fondo alternado gris/blanco en cada fila. Las tablas se ordenan mediante alineación perfecta, líneas divisorias delgadas y números con fuentes monoespaciadas tabulares (`tabular-nums`).

---

## 5. Las Reglas de la Casa y Leyes del Oficio (House Rules & Laws of Craft)

Para páginas públicas y vistas destacadas, Taste Skill impone límites cuantitativos estrictos:

### Tipografía
- **Titulares en 2 líneas o menos:** Si un `h1` o `h2` pasa a 3 líneas en cualquier ancho de pantalla, el inspector falla. Solución: recortar palabras o abrir el ancho, nunca achicar la fuente como primer recurso.
- **Relación de Escala 4.3x:** En una landing o hero, la relación entre el titular principal y el texto del cuerpo debe ser de al menos 4.3 a 1.
- **Párrafos de afirmación:** Las frases grandes de introducción no son titulares; deben maquetarse como `<p>` o `<blockquote>` de máximo 36px y unas 25 palabras en 3 líneas.
- **Alineación a la izquierda:** El texto centrado se permite como máximo en un solo momento de la página; el resto va alineado a la izquierda para garantizar escaneabilidad.

### Espaciado y Layout
- **Márgenes exteriores equilibrados:** Prohibido dejar una columna apiñada a la izquierda con la mitad derecha de la pantalla vacía. Todo vacío debe responderse con algo del otro lado de la cuadrícula.
- **Separación entre secciones generosa:** Entre 120px y 240px en escritorio. El espacio entre secciones debe ser claramente superior a cualquier separación interna.
- **Cero Grillas de Tarjetas (Card Grids):** Cada sección debe tener una composición diferente a la anterior. Repetir 3 columnas de tarjetas en cada sección es el mayor síntoma de pereza en IA.

### Color e Imágenes
- **Regla del 1-1-1:** Un fondo (*ground*), una tinta de texto (*ink*), y un solo acento (*accent*).
- **Prohibido el texto en gris claro:** El texto corrido va en la tinta completa. Una página en gris suave parece inacabada y destruye la legibilidad.
- **Una imagen dominante:** Una fotografía o ilustración real a gran tamaño vence a 6 fotos diminutas.

---

## 6. El Flujo de Ejecución en 10 Pasos ("The Run")

Cuando se crea o rediseña una interfaz con Taste Skill, se sigue esta secuencia:

1. **Leer el brief e inventariar lo real:** Listar de 8 a 12 hechos únicos de este negocio que ningún competidor tiene (su dirección real, sus horarios, su método de trabajo, su limitación deliberada). De aquí nace la idea original.
2. **Escribir el argumento:** Cada sección es una afirmación con su prueba.
3. **Determinar la dirección de arte:** Paleta, tipografía y estilo visual coherente.
4. **Encontrar la idea rectora:** La metáfora visual o estructura que hace que la página sea memorable.
5. **Escribir los textos:** Redacción precisa y directa sin clichés de marketing.
6. **Construir la estructura estática:** Maquetación limpia en HTML/Tailwind/React.
7. **Puerta de control (Gate):** Chequeo de sintaxis y renderizado.
8. **Mirar (Look):** Tomar captura de pantalla en navegador real y ejecutar `inspect.mjs`.
9. **Mover (Move):** Incorporar animaciones sutiles sólo donde aporten comprensión.
10. **Reportar:** Presentar los hallazgos y correcciones aplicadas.

---

## 7. Catálogo de Skills del Repositorio

| Skill | Nombre de Invocación | Propósito Principal |
| :--- | :--- | :--- |
| **`taste-skill`** | `design-taste-frontend` | **La skill principal v2.** Dirección de arte completa, house rules anti-slop, inspección en navegador real y soporte diferenciado para App Screens. |
| **`brutalist-skill`** | `industrial-brutalist-ui` | Estilo mecánico, tipografía suiza, cuadrículas expuestas, alto contraste y estética utilitaria. |
| **`minimalist-skill`** | `minimalist-ui` | Estilo editorial, paleta monocromática cálida, contraste tipográfico extremo y disposición bento plana. |
| **`soft-skill`** | `high-end-visual-design` | Estilo suave y prémium, contraste amortiguado, espacios generosos y micro-movimiento sutil. |
| **`stitch-skill`** | `stitch-design-taste` | Escribe un archivo `DESIGN.md` con reglas estrictas de color, fuentes y layout. |
| **`gpt-tasteskill`** | `gpt-taste` | Variante adaptada para modelos GPT/Codex con estructura AIDA estricta y GSAP scroll. |
| **`taste-skill-v1`** | `design-taste-frontend-v1` | Versión clásica original conservada por compatibilidad. |

---

## 8. Matriz Comparativa: Los 4 Ecosistemas de Skills

Ahora que dominamos a fondo los cuatro grandes repositorios del panorama actual de agentes, podemos entender con precisión qué aporta cada uno y cómo se articulan:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CUADRO COMPARATIVO DE ESPECIALIZACIÓN                                  │
├────────────────────┬──────────────────┬──────────────────────┬─────────────────────────────────────────┤
│ REPOSITORIO        │ CREADOR          │ FOCO PRIMARIO        │ SU MAYOR SUPERPODER                    │
├────────────────────┼──────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ **mattpocock/      │ Matt Pocock      │ Arquitectura,        │ • Entrevistas Grilling con árbol de     │
│   skills**         │ (TotalTS)        │ Lógica, DDD, TDD     │   decisiones y frontera de preguntas.   │
│                    │                  │ y Estructura         │ • GLOSSARY.md y ADRs de arquitectura.   │
│                    │                  │                      │ • Módulos Profundos y Tracer Bullets.   │
│                    │                  │                      │ • Review en 2 ejes paralelos.           │
├────────────────────┼──────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ **pbakaus/         │ Paul Bakaus      │ Sistema de Diseño,   │ • 61 detectores deterministas locales   │
│   impeccable**     │ (Ex-Anthropic /  │ Macro-Maquetación    │   a costo cero sin tokens.              │
│                    │  Google)         │ y Flujo de Calidad   │ • PRODUCT.md vs DESIGN.md.              │
│                    │                  │                      │ • 24 comandos de diseño quirúrgico.     │
│                    │                  │                      │ • Live Mode con toolbar en navegador.   │
├────────────────────┼──────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ **leonxlnx/        │ Leonxlnx         │ Dirección de Arte,   │ • Erradicación del AI Slop de 1ª/2ª/3ª  │
│   taste-skill**    │ (tasteskill.dev) │ Composición Gráfica  │   ola (adiós degradados, bentos, etc).  │
│                    │                  │ y Anti-Slop Estricto │ • Reglas exactas para App Screens.      │
│                    │                  │                      │ • Color al 3-5% (datos, no cromo).      │
│                    │                  │                      │ • Look-and-fix con capturas reales.     │
├────────────────────┼──────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ **emilkowalski/    │ Emil Kowalski    │ Micro-Interacciones, │ • Respuesta táctil en :active (0.97).   │
│   skills**         │ (Vercel, Linear, │ Física de Resortes   │ • Cero scale(0), popovers conscientes.  │
│                    │  Sonner, Vaul)   │ y Móvil Nativo       │ • Rendimiento GPU a 120fps (<8.3ms).    │
│                    │                  │                      │ • Web móvil nativa (sin tap lag/zoom).  │
│                    │                  │                      │ • Test de estrés extremo con break-ui.  │
└────────────────────┴──────────────────┴──────────────────────┴─────────────────────────────────────────┘
```

---

## 9. Cuándo, Cómo y Por Qué Usar Cada Ecosistema en APSys

En nuestro proyecto (**APSys**), cada repositorio asume una responsabilidad clara dentro del ciclo de desarrollo:

### 1. ¿Vas a planificar una nueva funcionalidad, un módulo o resolver un bug complejo?
👉 **Usa Matt Pocock (`mattpocock/skills`):**
- **Por qué:** Evita que el agente empiece a escribir código sin entender el negocio.
- **Cómo:** Lanzas `/grill-with-docs` para definir las reglas de negocio (ej. cómo calcular vueltos multimoneda, estados de órdenes en taller, permisos de cajero). Se registran las decisiones en `GLOSSARY.md` y `docs/adr/`. Si hay un bug raro, ejecutas `/diagnosing-bugs` para forzar un test reproducible antes de tocar el código.

### 2. ¿Vas a maquetar una pantalla nueva o evaluar su composición global?
👉 **Usa Impeccable + Taste Skill (`taste-skill` & `impeccable`):**
- **Por qué:** Garantizan que la pantalla no parezca una plantilla genérica de Tailwind ni un dashboard prefabricado con tarjetas dentro de tarjetas.
- **Cómo:** 
  - Si es una vista operativa (pedidos, taller, comanda, caja), aplicas el modo `Operate` de Impeccable y las reglas de `App Screens` de Taste Skill: **el color va en el dato, no en el cromo** (máximo 5% de color en pantalla, reservado para badges de estado y alertas).
  - Si se siente saturada, aplicas `/impeccable distill` para eliminar bordes y cajas redundantes.

### 3. ¿Vas a afinar los botones, transiciones, modales, toasts y la experiencia en tablets/móviles?
👉 **Usa Emil Kowalski (`emilkowalski/skills`):**
- **Por qué:** Transforma una pantalla estática en una aplicación con tacto prémium y respuesta instantánea.
- **Cómo:**
  - Botones de acción rápida de taller (*Iniciar Producción*, *Marcar Listo*) con `transform: scale(0.97)` en `:active`.
  - Modales y popovers abriéndose desde su origen sin `scale(0)`.
  - Pantallas de despacho y comandas en tablets blindadas contra el tap-delay (`touch-action: manipulation`) y sin hovers pegajosos.
  - Sometes la tabla de comandas a `break-ui` para asegurar que montos gigantes en Bolívares o nombres extensos jamás rompan las columnas.

### 4. ¿Vas a cerrar la tarea y preparar el commit/PR?
👉 **Vuelves a Matt Pocock e Impeccable:**
- **Cómo:** Ejecutas `/code-review` para que dos subagentes auditen el código (uno valida los estándares y tipos; el otro valida que cumpla la especificación acordada), seguido de `/impeccable polish` para los micro-detalles finales.
