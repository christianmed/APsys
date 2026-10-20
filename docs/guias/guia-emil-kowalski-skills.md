# Guía Maestra de Skills de Emil Kowalski

> **Ingeniería de Diseño, Animaciones Fluidas y Micro-Interacciones de Alto Nivel**  
> Basado en la especificación oficial de [emilkowalski/skills](https://github.com/emilkowalski/skills) y la filosofía de diseño de Emil Kowalski (_Vercel, Linear, creador de Sonner y Vaul, autor de "Animations on the Web"_).

---

## Índice

1. [Filosofía Central: "Agents Don't Have Great Taste"](#1-filosofía-central-agents-dont-have-great-taste)
2. [Instalación y Configuración](#2-instalación-y-configuración)
3. [El Catálogo de las 15 Skills Especializadas](#3-el-catálogo-de-las-15-skills-especializadas)
4. [Los Diez Estándares Innegociables de Animación](#4-los-diez-estándares-innegociables-de-animación)
5. [Principios de Construcción de Componentes React & CSS](#5-principios-de-construcción-de-componentes-react--css)
6. [Rendimiento Extremo: Presupuesto de Fotogramas a 60/120fps](#6-rendimiento-extremo-presupuesto-de-fotogramas-a-60120fps)
7. [Diseño Fluido e Interacción Física al Estilo Apple](#7-diseño-fluido-e-interacción-física-al-estilo-apple)
8. [Sensación Nativa en Dispositivos Móviles (`mobile-native`)](#8-sensación-nativa-en-dispositivos-móviles-mobile-native)
9. [Pruebas de Estrés con Datos Reales de Producción (`break-ui`)](#9-pruebas-de-estrés-con-datos-reales-de-producción-break-ui)
10. [Stack Recomendado: Curaduría de Librerías (`pick-ui-library`)](#10-stack-recomendado-curaduría-de-librerías-pick-ui-library)
11. [Sinergia: Impeccable + Emil Kowalski en Nuestro Proyecto](#11-sinergia-impeccable--emil-kowalski-en-nuestro-proyecto)

---

## 1. Filosofía Central: "Agents Don't Have Great Taste"

Emil Kowalski parte de una observación fundamental sobre la inteligencia artificial actual: **los modelos de lenguaje carecen de buen gusto intrínseco en frontend**.

Cuando un agente de IA genera una interfaz o una animación sin directrices estrictas, comete de forma predecible errores que arruinan la experiencia:

- Aplica curvas de aceleración `ease-in` a elementos que entran en pantalla (haciendo que el elemento arranque lento justo cuando el usuario lo está esperando).
- Anima elementos desde `scale(0)`, produciendo un efecto grotesco de explosión en lugar de un sutil crecimiento orgánico desde `scale(0.95)`.
- Utiliza bordes sólidos y toscos en vez de sombras semitransparentes en capas.
- Anima propiedades que disparan el recálculo del layout (`height`, `width`, `top`, `margin`), arruinando el rendimiento y la tasa de fotogramas.
- Anima mediante estados locales de React (`useState` disparado en bucle), provocando decenas de re-renderizados innecesarios por segundo.

### Los Tres Axiomas del Design Engineering

1. **El buen gusto se entrena, no es innato (_Taste is trained, not innate_):**  
   El buen gusto no es preferencia subjetiva. Es un instinto entrenado que permite reconocer qué eleva un producto de "funcional" a "memorable". Se entrena estudiando por qué las mejores interfaces se sienten fluidas, inspeccionando interacciones y desarmando animaciones fotograma a fotograma.
2. **Los detalles invisibles se acumulan (_Unseen details compound_):**  
   La mayoría de los usuarios no perciben conscientemente un resorte bien calibrado o un botón con respuesta táctil instantánea. Pero cuando cada elemento responde exactamente como la intuición física espera, el conjunto transmite solidez, confianza y placer de uso.
   > _"Todos esos detalles invisibles se combinan para producir algo simplemente impresionante, como mil voces apenas audibles cantando en perfecta afinación."_ — Paul Graham
3. **La belleza es una ventaja competitiva (_Beauty is leverage_):**  
   En un mercado donde la funcionalidad básica está comoditizada, la respuesta táctil, la artesanía visual y los buenos valores predeterminados son los factores que hacen que los usuarios amen un software.

---

## 2. Instalación y Configuración

Las skills de Emil Kowalski están empaquetadas conforme al estándar abierto de `skills.sh`.

### Instalación vía CLI

Para añadir el paquete completo de skills a cualquier proyecto o arnés de agentes (Claude Code, Cursor, Codex, Gemini/Antigravity):

```bash
npx skills@latest add emilkowalski/skills
```

### Formato de Salida Obligatorio (Before / After Tables)

Al evaluar o revisar código de interfaces con estas skills, el agente está obligado a responder utilizando **tablas comparativas Antes / Después** para que la justificación técnica de cada micro-decisión sea transparente:

| Antes                           | Después                                                        | Razón Técnica                                                                                               |
| :------------------------------ | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `transition: all 300ms ease-in` | `transition: transform 160ms ease-out, opacity 160ms ease-out` | `ease-in` retrasa la respuesta inicial; `all` anima propiedades no deseadas; 300ms se siente lento para UI. |
| `transform: scale(0)`           | `transform: scale(0.95); opacity: 0`                           | Los objetos físicos no nacen de tamaño cero. Escalar desde 0.95 evita la sensación de explosión.            |

---

## 3. El Catálogo de las 15 Skills Especializadas

El repositorio no es un único prompt; es un conjunto de **15 herramientas modulares** con tareas muy específicas:

```
                                 CATÁLOGO DE SKILLS
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  NÚCLEO Y MOTION               DISPOSITIVOS Y AUDITORÍA          DISEÑO Y STACK
• emil-design-eng (Maestra)   • mobile-native (Web móvil)       • apple-design (Interacción)
• animate (Desde cero)        • break-ui (Estrés de datos)      • ask-sonner (Toasts)
• improve-animations (Mejora) • animation-performance (GPU/FPS) • pick-ui-library (Stack)
• review-animations (10 reglas)• find-opportunities (Hallazgos) • prototype (Exploración)
• animation-vocabulary (Glosario)• animate-expo (React Native)  • write-swift (Swift 6)
```

### Resumen de cada Skill:

1. **`emil-design-eng` (La Skill Maestra):**  
   Codifica la filosofía completa de Emil: física de resortes, curvas de aceleración, principios de componentes, técnicas de CSS avanzado (`clip-path`, `@starting-style`, `transform-origin`) y accesibilidad.
2. **`animate`:**  
   Diseña y programa una animación web desde cero tomando las decisiones en el orden correcto: ¿debe animarse?, ¿en qué hilo corre?, ¿qué propiedades toca?, ¿resorte o curva?, ¿cuál es la duración?
3. **`improve-animations`:**  
   Toma animaciones existentes que se sienten toscas o lentas y las refina aplicando curvas asimétricas, reduciendo duraciones y eliminando saltos.
4. **`review-animations`:**  
   Audita un diff o componente frente a los **10 estándares innegociables** de calidad y emite una tabla de hallazgos.
5. **`find-animation-opportunities`:**  
   Rastrea el código en busca de lugares de alto impacto donde falta movimiento útil (ej. transiciones de pestañas, confirmación de copiado, expansión de acordeones).
6. **`animation-performance`:**  
   Especialista en presupuesto de fotogramas (16.7ms a 60fps, 8.3ms a 120fps). Detecta _layout thrashing_, optimiza para la GPU y elimina el jank.
7. **`animation-vocabulary`:**  
   Diccionario de búsqueda inversa: traduce descripciones vagas del usuario (_"el rebote ese cuando se abre un menú"_) al término técnico exacto (_Pop in, Rubber-banding, Stagger, Layout morph, Velocity handoff_).
8. **`apple-design`:**  
   Traduce a la web los principios de fluidez e interacción física de Apple: latencia cero en _pointer-down_, manipulación 1:1, continuidad de momentum e interruptibilidad total.
9. **`ask-sonner`:**  
   Guía experta para implementar, tematizar, posicionar y depurar toasts con Sonner (la librería insignia de Emil).
10. **`break-ui`:**  
    Somete un componente a la prueba de "Aleksandra Wiśniewska-Kowalczyk": inyecta datos extremos de producción (nombres kilométricos, emails irrompibles, 0 elementos, 1.284 filas, emojis, caracteres no latinos) tras un botón de toggle para verificar dónde se rompe el layout.
11. **`mobile-native`:**  
    Corrige los fallos que hacen que una web se sienta "como una página web barata" en un teléfono (el tap pegajoso, el flash gris de Safari, el bug de 100vh, el zoom en inputs, el retardo de 300ms).
12. **`pick-ui-library`:**  
    Catálogo de recomendaciones directas y con criterio para elegir librerías frontend (Base UI, cmdk, Motion, Sonner, NumberFlow, Zustand, Virtuoso).
13. **`prototype`:**  
    Crea 3 variantes genuinamente distintas de una interfaz detrás de un selector interactivo para explorar alternativas antes de comprometer el código.
14. **`animate-expo`:**  
    Construye animaciones e interacciones táctiles a 120fps en React Native / Expo usando Reanimated, Gesture Handler y hápticos.
15. **`write-swift`:**  
    Directrices para escribir código moderno en Swift 6, SwiftUI, seguridad de tipos de valor y concurrencia estructurada sin bloqueos en el hilo principal.

---

## 4. Los Diez Estándares Innegociables de Animación

Toda animación evaluada por la skill `review-animations` debe cumplir estrictamente estas 10 reglas:

```
1. Justificada ────────► ¿Por qué se mueve? (Explicación espacial o feedback; nunca por "verse cool").
2. Frecuencia ─────────► 100+ veces al día = CERO animación. Rara/Ocasional = Animación estándar.
3. Easing responsivo ──► Siempre ease-out o cubic-bezier pronunciado; PROHIBIDO ease-in en entradas.
4. Sub-300ms ──────────► Toda animación de UI interactiva debe resolverse en menos de 300ms.
5. Origen físico ──────► Animar desde el trigger (transform-origin). NUNCA desde scale(0) (usar 0.95).
6. Interrumpible ──────► Si el usuario cambia de idea a mitad de camino, debe poder revertir sin salto.
7. Sólo GPU ───────────► Exclusivamente transform y opacity. NUNCA animar height, width, top ni margin.
8. Accesibilidad ──────► Respetar prefers-reduced-motion y aislar hovers tras capability queries táctiles.
9. Asimetría ──────────► Entradas rápidas y decisivas; salidas suaves o acciones deliberadas lentas.
10. Cohesión ──────────► Coherencia con la personalidad del producto. Usar blur sutil para unir estados.
```

---

## 5. Principios de Construcción de Componentes React & CSS

### A. Botones con Respuesta Táctil Instantánea

Todo elemento clickeable debe dar retroalimentación física inmediata en `:active` mediante un micro-escalado:

```css
.button {
  transition: transform 160ms ease-out;
}

.button:active {
  transform: scale(0.97); /* 0.95 a 0.98 según el tamaño del botón */
}
```

### B. Prohibido Animar desde `scale(0)`

En el mundo real ningún objeto pasa de tamaño cero a su tamaño completo. Comenzar en `scale(0)` produce una sensación caricaturesca de explosión.  
**Regla de oro:** Comienza siempre en `scale(0.95)` o `scale(0.92)` combinado con `opacity: 0`.

```css
/* INCORRECTO */
.dialog-enter {
  transform: scale(0);
}

/* CORRECTO */
.dialog-enter {
  transform: scale(0.95);
  opacity: 0;
  transition:
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms ease-out;
}
```

### C. Popovers y Menús Conscientes de su Origen (_Origin-aware_)

Los menús y popovers no deben crecer desde su centro geométrico; deben nacer desde el botón que los disparó:

```css
.popover {
  transform-origin: var(--transform-origin); /* Calculado respecto al trigger */
}

/* EXCEPCIÓN: Los modales deben conservar transform-origin: center porque pertenecen al viewport */
.modal {
  transform-origin: center;
}
```

### D. Tooltips con Retardo Compartido (_Skip delay on subsequent hovers_)

El primer tooltip debe esperar ~300ms para evitar abrirse accidentalmente al mover el cursor. Pero si el usuario pasa inmediatamente a un botón adyacente, el siguiente tooltip debe abrirse **al instante (0ms de delay y 0ms de transición)**:

```css
.tooltip {
  transition:
    transform 125ms ease-out,
    opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}

/* Cuando ya hay un tooltip en pantalla, los contiguos son instantáneos */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

### E. Enmascarar Transiciones Imperfectas con Desenfoque Sutil (`filter: blur`)

Cuando dos estados o íconos se reemplazan (por ejemplo, un ícono de "copiar" que pasa a "check"), un simple fundido de opacidad revela dos imágenes superpuestas que lucen sucias.  
Añadir `filter: blur(2px)` durante la transición engaña al cerebro para que perciba una metamorfosis fluida única:

```css
.icon-swap {
  transition:
    filter 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.icon-swap.transitioning {
  filter: blur(2px);
  opacity: 0.6;
  transform: scale(0.95);
}
```

_(Nota de rendimiento: mantén el desenfoque por debajo de 20px; en Safari, desenfoques mayores impactan la GPU)._

### F. Entradas Limpias sin JS con `@starting-style`

La forma moderna de CSS para animar la entrada de un elemento sin requerir un `useEffect` ni librerías pesadas:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 300ms ease-out,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);

  @starting-style {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
}
```

### G. Dominio de `clip-path: inset()` para Pestañas y Eliminaciones

Para animar el cambio de pestaña activa, botones de mantener presionado para borrar (_hold-to-delete_) o revelado de imágenes, `clip-path: inset(...)` ofrece transiciones de color de 60fps sin alterar el flujo del DOM:

```css
/* Pestaña activa revelándose sobre la inactiva sin repintar el texto */
.tab-indicator {
  clip-path: inset(0 0 0 calc(100% - var(--active-width)));
  transition: clip-path 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 6. Rendimiento Extremo: Presupuesto de Fotogramas a 60/120fps

### El Presupuesto de Tiempo por Fotograma

- A **60Hz (pantallas estándar):** Tienes **16.7 milisegundos** por fotograma.
- A **120Hz (ProMotion, iPhones modernos, MacBooks):** Tienes sólo **8.3 milisegundos**.

Si una animación obliga al navegador a calcular el layout (geometría de elementos), esa operación puede costar más de 50ms, provocando la pérdida de 6 fotogramas seguidos (_jank_ visible).

### Las Tres Capas del Navegador y su Costo

| Etapa                  | Propiedades Afectadas                                 | Costo en Tiempo     | Veredicto                                         |
| :--------------------- | :---------------------------------------------------- | :------------------ | :------------------------------------------------ |
| **1. Layout (Reflow)** | `width`, `height`, `top`, `left`, `margin`, `padding` | Muy Alto (>30ms)    | **TERMINANTEMENTE PROHIBIDO en animaciones**      |
| **2. Paint (Repaint)** | `color`, `background`, `box-shadow`, `border-radius`  | Medio (5–15ms)      | Evitar en transiciones continuas                  |
| **3. Composite (GPU)** | `transform`, `opacity`, `filter: blur()`              | Ultrarrápido (<2ms) | **EL ÚNICO NIVEL ACEPTABLE para motion continuo** |

### Síntomas Comunes de Rendimiento y su Solución Inmediata

| Síntoma                                              | Causa Real                                 | Solución de Emil                                                                                                                                    |
| :--------------------------------------------------- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| La animación titubea (_stutter_)                     | Animando `width`/`height`/`margin`         | Anima exclusivamente `transform` y `opacity`.                                                                                                       |
| La sombra se ve a tirones                            | Animando `box-shadow` directamente         | Anima la `opacity` de un pseudo-elemento `::after` con la sombra ya dibujada, o usa `filter: drop-shadow()`.                                        |
| El arrastre (_drag_) se pone lento con listas largas | Animando una variable CSS heredada         | Escribe el `transform` directamente en el elemento arrastrado sin propagar variables al árbol.                                                      |
| React pierde fotogramas en animaciones               | Animando mediante `useState` en cada frame | **Nunca animes por estado de React.** Escribe directamente en `ref.current.style`, usa `MotionValue` o la Web Animations API (`element.animate()`). |
| El elemento parpadea 1px al comenzar                 | Promoción de capa tardía                   | Aplica `will-change: transform` únicamente al elemento afectado mientras dure el movimiento.                                                        |

---

## 7. Diseño Fluido e Interacción Física al Estilo Apple

La skill `apple-design` extrae la ingeniería de interfaz de iOS y macOS y la traslada a la web:

1. **Responde en `pointerdown`, no en `click` / `pointerup`:**  
   Esperar a que el usuario levante el dedo para mostrar la pulsación hace que la interfaz se sienta muerta. El oscurecimiento o micro-escala debe ocurrir el milisegundo exacto en que la piel toca la pantalla.
2. **Manipulación Directa 1:1 (`setPointerCapture`):**  
   Cuando el usuario arrastra un cajón (_drawer_) o un slider, el elemento debe moverse exactamente a la misma velocidad que el dedo y respetar el punto exacto de agarre (_grab offset_), sin saltar al centro.
3. **Interruptibilidad Absoluta (El principio más sagrado):**  
   Si un modal se está cerrando y el usuario toca la pantalla a mitad de camino, la animación debe frenar en ese fotograma exacto e invertir el sentido sin saltos bruscos. Los resortes y las transiciones CSS admiten esto; los `@keyframes` rígidos no.
4. **Física de Resortes (_Springs_) sobre Duraciones Fijas:**  
   Los resortes no tienen duración fija; se detienen cuando su energía se disipa.

### Parámetros de Resorte Recomendados

**Enfoque Apple (Recomendado por Emil por su facilidad mental):**

```js
// Motion (Framer Motion)
{ type: "spring", duration: 0.5, bounce: 0.15 }
```

- Mantén el `bounce` sutil (0.1 a 0.25). Un rebote exagerado (>0.4) hace que el software parezca un juguete.

**Enfoque de Física Tradicional:**

```js
{ type: "spring", mass: 1, stiffness: 120, damping: 14 }
```

5. **Proyección de Inercia (_Velocity Handoff_):**  
   Al soltar un gesto de arrastre, calcula la velocidad residual de los últimos 3 eventos táctiles y traslada esa velocidad inicial al resorte. El elemento debe continuar viajando hacia donde fue lanzado, no frenar en seco al soltar el dedo.

---

## 8. Sensación Nativa en Dispositivos Móviles (`mobile-native`)

Cuando una aplicación web corre en un navegador móvil (Safari iOS o Chrome Android), pequeños detalles arruinan la sensación de producto instalado. Esta skill ofrece la tabla definitiva de soluciones:

### Tabla de Correcciones Esenciales para Móvil

| Problema Móvil                                        | Causa                                                 | Solución de Código                                                                                           |
| :---------------------------------------------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **El hover se queda pegado**                          | Touch simula hover en el primer tap                   | Aislar los hovers: `@media (hover: hover) and (pointer: fine) { .btn:hover { ... } }`                        |
| **Destello gris al tocar**                            | Comportamiento predeterminado de Safari/Chrome        | `-webkit-tap-highlight-color: transparent;` en todos los botones y enlaces.                                  |
| **El fondo salta al abrir teclado / scroll**          | `100vh` no toma en cuenta la barra del navegador      | Usar `100dvh` (viewport dinámico) para layouts o `100svh` para pantallas de bienvenida.                      |
| **La pantalla hace zoom al tocar un input**           | En iOS, cualquier input con fuente < 16px fuerza zoom | `font-size: 16px;` mínimo absoluto en todo `<input>`, `<select>` o `<textarea>`.                             |
| **Retardo de 300ms en pulsaciones**                   | El navegador espera a ver si harás doble tap          | `touch-action: manipulation;` en botones y tarjetas clickeables.                                             |
| **El pull-to-refresh rompe el scroll interno**        | La página entera se estira al deslizar un drawer      | `overscroll-behavior-y: none;` en `html, body` y en contenedores modales.                                    |
| **Contenido tapado por el Notch / Isla Dinámica**     | El viewport no cubre las áreas seguras                | `<meta name="viewport" content="..., viewport-fit=cover">` + `padding-bottom: env(safe-area-inset-bottom);`. |
| **Mantener presionado selecciona el texto del botón** | Long-press activa selección de texto nativa           | `user-select: none; -webkit-user-select: none;` en botones e íconos interactivos.                            |

---

## 9. Pruebas de Estrés con Datos Reales de Producción (`break-ui`)

Los desarrolladores suelen probar componentes con datos amables como _"Juan Pérez"_, correos cortos y 3 tareas en una lista. Luego, en producción, el sistema colapsa visualmente.

La skill `break-ui` somete cualquier componente al **Test de Caso Extremo**:

1. **Nombres largos y complejos:** _"Aleksandra Wiśniewska-Kowalczyk"_ o _"Hubert Blaine Wolfeschlegelsteinhausenbergerdorff"_.
2. **Correos irrompibles sin espacios:** `bartholomew.fitzgerald@northwind-industries-holdings.example.com`.
3. **Nombres de un solo caracter:** _"Jo"_, _"Al"_, _"吴"_.
4. **Listas en los extremos:**
   - **Caso Cero (Empty State):** 0 elementos. ¿Hay un mensaje amigable o una tabla vacía rota?
   - **Caso Uno:** Exactamente 1 elemento (probar que no diga "1 pedidos encontrados" sino "1 pedido").
   - **Caso Masivo:** 1.284 elementos. ¿Se bloquea el hilo principal? ¿Se desborda el contenedor?
5. **Números extremos:** Precios de `$0.00`, cifras de `$999,999,999.99` o balances negativos `-$450.50`.
6. **Implementación de Toggle:**  
   Inyecta un interruptor en el entorno de desarrollo: `[ Datos de Demo | Peor Caso de Producción ]` para comprobar al instante la resiliencia de la interfaz antes de enviar a producción.

---

## 10. Stack Recomendado: Curaduría de Librerías (`pick-ui-library`)

Emil Kowalski mantiene una lista deliberada y rigurosamente filtrada de herramientas de UI. Su directriz: **no inventes primitivas complejas desde cero ni uses librerías hinchadas**.

| Necesidad Frontend                             | Librería Recomendada                                              | Justificación de Emil                                                                     |
| :--------------------------------------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Componentes primitivos accesibles**          | [base-ui](https://base-ui.com) (o Radix UI)                       | Manejo perfecto de foco, accesibilidad WAI-ARIA y atajos sin estilos forzados.            |
| **Toasts y Notificaciones**                    | [Sonner](https://sonner.emilkowal.ski)                            | Creada por Emil. Apilamiento fluido, animaciones de altura automáticas, swipe to dismiss. |
| **Cajones / Bottom Sheets móviles**            | [Vaul](https://vaul.emilkowal.ski)                                | Creada por Emil. Física nativa de iOS, arrastre continuo con inercia e interruptible.     |
| **Menús de Comando (⌘K Palettes)**             | [cmdk](https://cmdk.paco.me)                                      | Creada por Paco Coursey. La paleta de comandos de referencia en Linear y Vercel.          |
| **Animación general y resortes**               | [motion](https://motion.dev) (Framer Motion)                      | El motor de referencia para física de resortes y morphing de layout en React.             |
| **Animación de números y contadores**          | [NumberFlow](https://number-flow.barvian.me)                      | Transición fluida dígito por dígito para precios y métricas sin saltos de ancho.          |
| **Inputs de códigos OTP / Verificación**       | [input-otp](https://input-otp.rodz.dev)                           | Manejo de pegado de portapapeles, foco invisible y soporte de teclado móvil sin fallos.   |
| **Drag and Drop interactivo**                  | [dnd kit](https://dndkit.com)                                     | Ligero, modular y compatible con gestos táctiles y accesibilidad.                         |
| **Virtualización de listas y tablas gigantes** | [Virtuoso](https://virtuoso.dev)                                  | Manejo de miles de filas con altura variable sin calcular dimensiones fijas previas.      |
| **Manejo de estado global**                    | [Zustand](https://zustand.docs.pmnd.rs)                           | Mínimo overhead, sin boilerplate de Redux y fuera del árbol de contexto de React.         |
| **Clases condicionales y variantes**           | [clsx](https://github.com/lukeed/clsx) + [cva](https://cva.style) | Composición tipada de variantes en Tailwind CSS sin concatenaciones frágiles.             |
| **Temas Claro / Oscuro sin flash**             | [next-themes](https://github.com/pacocoursey/next-themes)         | Inyección de script en `<head>` para evitar el parpadeo de hidratación en Next.js.        |

---

## 11. Sinergia: Impeccable + Emil Kowalski en Nuestro Proyecto

La combinación de **Impeccable** y las **Skills de Emil Kowalski** conforma el estándar de diseño e ingeniería de frontend más avanzado disponible para desarrollo asistido por IA:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DIVISIÓN DE RESPONSABILIDADES                        │
├───────────────────────────────────┬────────────────────────────────────┤
│       IMPECCABLE (Paul Bakaus)    │     EMIL KOWALSKI SKILLS           │
│           [Nivel Macro]           │          [Nivel Micro]             │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Erradicar el "AI Slop" global.  │ • Curvas de resorte y aceleración. │
│ • Eliminar cajas/bordes excesivos │ • Respuesta táctil en :active.     │
│ • Jerarquía de layout y espacios. │ • Rendimiento a 60/120fps en GPU.  │
│ • Modos: Operate / Persuade / Read│ • Sensación nativa en móviles.     │
│ • Hooks deterministas pre-edit.   │ • Pruebas de estrés de datos.      │
│ • Live Mode / Comparador en vivo. │ • Toasts y drawers fluidos.        │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Aplicación Práctica en APSys (Gestión de Pedidos, Taller y Caja):

1. **Comandas y Botones de Acción:**  
   Aplicar el principio de feedback táctil instantáneo (`scale(0.97)` en `:active`) a los botones de acción rápida (_Iniciar Producción_, _Entregado_, _Marcar Listo_).
2. **Tarjetas de Pedidos sin "Slop":**  
   Usar Impeccable (`/distill`) para eliminar recuadros dobles y Emil Kowalski para dotar a las píldoras de abonos y estados de transiciones suaves sin jank.
3. **Móvil en Taller y Mostrador:**  
   Garantizar que no existan retardos de 300ms (`touch-action: manipulation`) ni hovers pegajosos en las pantallas táctiles donde operan los despachadores.
4. **Resiliencia en Nombres y Monedas:**  
   Aplicar la filosofía de `break-ui` para que la visualización de montos en Bolívares y Dólares con tasas variables jamás desborde ni quiebre el ancho de las columnas.
