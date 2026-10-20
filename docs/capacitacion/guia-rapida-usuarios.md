# Guía Rápida de Uso de APSys por Perfil

**Sistema:** APSys — Taller de Gráfica & Impresión  
**Versión:** 1.0.0  
**Audiencia:** Personal de Mostrador, Operarios de Taller y Gerencia

---

## 1. Pantalla Principal y Perfil Mostrador (Recepción y Cobranza)

### Banner de Bienvenida y Fecha en Vivo (Caracas)
- En la parte superior de la página principal (`/`), el sistema muestra la **fecha de hoy en vivo** en español venezolano (`es-VE`) vinculada estrictamente al huso horario de Venezuela (`America/Caracas`, UTC-4).
- **Reactiva a Medianoche:** El reloj de fecha cambia automáticamente a las 12:00 a. m. sin necesidad de recargar la página. Es totalmente independiente de la ubicación del servidor en la nube y de la tasa BCV que se encuentre activa o programada.

### Estado de Producción en Vivo (Sincronización 1:1 con Taller)
- Las tarjetas de métricas en la pantalla principal reflejan en tiempo real el estado exacto del taller bajo cromo neutro estricto y acento al 3-5%:
  - **Recibido (Azul Zafiro `#7aa2f7`):** Órdenes recibidas en mostrador que esperan inicio de trabajo (`recibido`). Coincide con la primera columna de taller.
  - **En Producción (Ámbar `#e0af68`):** Órdenes en máquinas de impresión, ploteo o mesa de corte (`en_produccion`). Coincide con la segunda columna de taller.
  - **Listos para Retiro (Esmeralda `#73daca`):** Órdenes terminadas y empaquetadas que esperan ser retiradas por el cliente (`listo`).
  - **Total de Trabajos Activos:** Suma exacta de los tres estados en proceso.
- **Sensación Táctil Nativa (Micro-interacciones Emil Kowalski):** Todas las tarjetas y botones del sistema cuentan con compresión táctil física instantánea (`scale(0.97)` en `:active`) y optimización `touch-action: manipulation`, eliminando el retardo de 300ms en tablets operativas.

---

## 2. Perfil Mostrador / Recepción (Registro y Cobranza)

### Registrar una Nueva Orden de Trabajo (< 2 minutos)

1. Presiona el botón **"Nuevo pedido"** (o navega a `/pedidos/nuevo`).
2. **Selecciona o crea el cliente (Selector Inteligente):**
   - Escribe en el buscador predictivo para filtrar al instante por nombre o número de teléfono.
   - Si es nuevo, pulsa el botón integrado "Registrar Nuevo Cliente", ingresa sus datos y queda seleccionado automáticamente.
3. **Agrega los trabajos a realizar (Desanidado Limpio con Divisores Horizontales):**
   - El desglose de renglones prescinde de recuadros o tarjetas anidadas (*no card-in-a-card*), presentando los ítems delimitados por separadores sutiles de alta legibilidad.
   - Selecciona el servicio desde el selector interactivo (ej. Vinil Adhesivo, Pendón, Talonarios).
   - Ingresa dimensiones (ancho × alto en metros o cm) y acabados (ojetes, laminado, corte).
   - Coloca la cantidad y el precio unitario pactado en USD.
   - Presiona `+ Agregar otro ítem` para incorporar trabajos adicionales con feedback táctil inmediato.
4. **Registra el abono inicial y selecciona la tasa adecuada:**
   - Puedes cobrar en **USD efectivo** o **Bolívares (Pago Móvil / Transferencia)**.
   - Si el cobro es en Bs, el sistema aplica la tasa oficial del día automáticamente.
   - **Ciclo Diario de Tasas y Corte a las 12:00 a. m.:**
     - **Tarde (4:00 PM - 11:59 PM):** El BCV publica la tasa de mañana y se resalta en ámbar en el Sidebar. El operador tiene la opción de revisarla y aplicarla voluntariamente en `/tasas`.
     - **Post-Medianoche (12:00 a. m. en adelante):** Si el operador no la aplicó manualmente antes de las 11:59 PM, el sistema la auto-adopta y guarda en la base de datos de forma obligatoria e inmediata al primer acceso, protegiendo el margen del taller sin depender de la memoria del personal.
5. Haz clic en **"Crear Pedido"** e imprime la **Comanda Técnica**.

### Buscadores Unificados y Gestión de Pedidos (`/pedidos` y `/clientes`)

- **Buscador Moderno Unificado con Atajo `/`:** En las pantallas de Pedidos y Directorio de Clientes se cuenta con una barra de búsqueda integrada tipo píldora. Al presionar `/` en el teclado se enfoca instantáneamente el campo, con botón de limpieza inmediata `X`.
- **Organización Ergonómica de Tarjetas de Pedidos (`/pedidos`):**
  - **Columna Izquierda:** Contiene el número de orden con su píldora de estado actual (`Recibido`, `En Producción`, `Listo para Retiro`), datos del cliente, teléfono y fecha de registro. Justo debajo de la fecha se sitúa el **botón de avance operativo de estado** (`Iniciar producción`, `Listo para Retiro`, `Entregar pedido`) con icono vectorial Lucide, permitiendo transiciones de flujo a un toque sin interferir con la cabecera.
  - **Columna Derecha:** Muestra el Total en USD, seguido de las **píldoras semánticas financieras** vectoriales (`100% Pagado`, `Abonado: $xx.xx`, `Resta: $xx.xx`, `Sin abono`) con códigos cromáticos Tokyo Night e iconos Lucide. Inmediatamente debajo se agrupa la botonera de utilidades técnicas: `[Comanda]` `[Aviso WhatsApp]` `[Auditoría]` `[Anular]`.
- **Estandarización Iconográfica Global (Cero Emoticones):** Toda la interfaz del sistema utiliza exclusivamente iconos vectoriales tipográficos de la librería `lucide-react` para garantizar consistencia, sobriedad y legibilidad profesional.
- **Paginación Inteligente:** Las listas muestran **25 registros por página** con navegación por cursor (`[ Siguiente → ]` y `[ ← Inicio ]`).

---

## 3. Perfil Taller / Producción (Impresión y Acabados)

### Operar el Tablero Kanban (`/taller`)

El tablero de taller está diseñado para pantallas táctiles y uso con una sola mano:

1. **Columna "Por Iniciar":**
   - Muestra las órdenes entrantes ordenadas por urgencia.
   - Escanea el código de barras o pulsa **"Iniciar Producción"** cuando cargues el rollo/material.
2. **Columna "En Producción":**
   - Indica trabajos que están en máquina o en mesa de acabado.
   - Al finalizar corte, laminado y empaque, pulsa **"Marcar Listo"**.
3. **Notificación al Cliente (WhatsApp Refinado):**
   - Al pasar a "Listo", aparece el botón sobrio en tono esmeralda **"WhatsApp"**. Pulsa para abrir el chat con el mensaje preformateado de retiro y saldo pendiente, sin colores saturados que distraigan.
4. **Columna "Listo para Retiro" y Regla Estricta de Entrega con Saldo Cero:**
   - **Regla Estricta del Sistema:** Un pedido NO puede entregarse si tiene saldo pendiente (`saldo > 0`). El sistema bloquea de raíz cualquier intento de entrega con deuda para evitar fugas de caja.
   - **Pedidos con Saldo Pendiente:** El botón de acción se muestra como `[ 💵 Cobrar Saldo y Entregar ]`. Al presionarlo, se abre un modal rápido (≤ 3 segundos) prellenado con el saldo exacto en USD y su equivalente en Bs a la tasa del pedido. Permite elegir la moneda, registrar el comprobante/referencia (Efectivo, Pago Móvil, etc.) y liquidar la deuda registrando la entrega de inmediato.
   - **Pedidos 100% Saldados:** Muestra el botón directo `[ 📦 Entregar al Cliente ]`.
5. **Conmutador Visual de Aspecto en Taller (Selector de 3 Estilos):**
   - En la cabecera de `/taller` se ubica una barra conmutadora que permite evaluar tres estilos visuales profesionales para las tarjetas y botones:
     - **Estilo A (Minimalista):** Look sobrio y elegante estilo Linear / Vercel con botones oscuros y micro-bordes.
     - **Estilo B (Pastel Tonal):** Look suave estilo Apple HIG con fondos tintados claros y alto contraste de lectura.
     - **Estilo C (Jerárquico):** Look progresivo estilo Stripe, con botones ligeros en preparación y botones sólidos en cobro y entrega.
   - La opción seleccionada se guarda en el navegador del usuario para no tener que reconfigurarla.
6. **Historial de Pedidos en Ficha de Cliente (`/clientes/[id]`):**
   - En pedidos ya entregados, el sistema **nunca muestra el botón de cobro por WhatsApp**, dado que la orden se encuentra completamente saldada al momento del despacho físico.

---

## 4. Gestión del Catálogo de Servicios (`/servicios`) — Perfil Gerencial

### Prioridad en Catálogo y Disponibilidad
- **Prioridad en Catálogo (Posición):** Define el orden numérico en el cual se lista cada servicio en los selectores al crear pedidos (`/pedidos/nuevo`). Los números más bajos (1, 2, 3...) aparecen primero, permitiendo priorizar los productos más vendidos.
- **Servicio Activo en Catálogo (Baja Lógica):** Al desmarcar esta casilla, el servicio se oculta del selector de nuevas órdenes sin eliminar ni afectar las órdenes históricas que lo hayan utilizado.
- **Eliminación Segura vs. Protección de Integridad:**
  - **Servicios sin órdenes vinculadas (0 pedidos):** Muestra el botón `[ Eliminar servicio definitivamente ]`, permitiendo su borrado físico permanente de la base de datos (ideal para servicios de prueba o creados por error).
  - **Servicios con pedidos asociados:** El botón de eliminación se oculta y el sistema muestra un recuadro informativo de **Protección de Integridad Histórica**, indicando el número exacto de pedidos asociados y recordando que para retirarlo del menú basta con desmarcar la casilla de "Servicio Activo".

---

## 5. Gestión y Dinámica de Tasas de Cambio (`/tasas`) — Operador & Gerencia

### Ciclo Diario y Doble Vigencia del BCV

En Venezuela, el Banco Central publica la tasa oficial bajo el siguiente ciclo operativo:

1. **Jornada Regular (Lunes a Jueves):**
   - **En la mañana:** Rige la tasa fijada para el día hábil en curso (vigencia legal desde las 12:00 a. m. de hoy).
   - **En la tarde (3:30 p. m. a 5:30 p. m.):** El BCV publica la tasa oficial del día siguiente.
2. **Fin de Semana y Días Feriados (Viernes a Domingo):**
   - El viernes por la tarde, el BCV emite la tasa que entrará en vigencia legal el **lunes de la semana siguiente**.
   - Durante el sábado y domingo, **la tasa de viernes permanece plenamente vigente y activa** para facturar y cotizar.
   - El sistema reconoce inteligentemente el fin de semana y no muestra textos equívocos como "Hoy" en sábado, sino **`Vigente (Fin de semana)`** o **`Vigente • DD/MM/AAAA`**.
   - La tasa futura del lunes se muestra como **`Programada (Lunes)`** o **`Lunes, DD/MM/AAAA (Próx. Día Hábil)`**.

### Estados en el Histórico de Tasas

Al consultar `/tasas`, la tabla del histórico clasifica cada registro con un estado visual explícito y consciente del calendario:

- 🟢 **Vigente (Hoy):** La tasa oficial activa para la jornada en curso entre semana.
- 🟢 **Vigente (Fin de semana):** La tasa activa fijada el viernes que rige durante sábado y domingo.
- 🟡 **Programada (Mañana):** La tasa oficial emitida entre semana para el siguiente día hábil.
- 🟡 **Programada (Lunes / Próx. Día Hábil):** La tasa oficial emitida el viernes para el inicio de la semana siguiente.
- ⚪ **Histórica:** Tasas de fechas pasadas conservadas inmutablemente para auditoría de pedidos y pagos previos.

### ¿Cómo aplicar o utilizar la tasa del día siguiente?

- **Paso 1:** Al final de la tarde, haz clic en **"Consultar Tasas BCV en Vivo"**.
- **Paso 2:** Si el BCV ya publicó para la siguiente jornada, el botón indicará dinámicamente el día exacto: ej. **"Programar Bs. XXX.XXXX para Lunes (Día Hábil)"** o **"para Mañana (Día Hábil)"**. Al pulsar el botón, la tasa queda registrada en la base de datos con inicio a las 12:00 a. m.
- **Paso 3 (Opcional):** Si necesitas cotizar un pedido usando esa tasa anticipada, ve a `/pedidos/nuevo` y activa la píldora en el selector interactivo de tasa.
- **Paso 4 (Automático):** Al llegar las 12:00 a. m. de la fecha programada, el sistema promueve automáticamente esa tasa como la nueva tasa **Vigente** para todo el sistema sin intervención humana.

> 💡 **Sincronización Automática en Segundo Plano (Cron Job):**  
> Aunque ningún operador o administrador esté conectado al sistema, una tarea automática se ejecuta a las 6:30 p. m. y a las 12:05 a. m. para registrar la tasa oficial directamente en la base de datos de Supabase. El botón en `/tasas` queda disponible como respaldo inmediato para forzar una sincronización manual al instante.

---

## 6. Perfil Gerencial / Administración (Finanzas y Control)

### Widget de Tasas Referenciales BCV (Barra Lateral)

- En la barra lateral se ubica el widget interactivo con dos acordeones independientes:
  - **Tasa Activa:** Muestra `Hoy, DD/MM/AAAA` entre semana, o `Vigente • DD/MM/AAAA` en fines de semana para USD y EUR con indicador verde esmeralda.
  - **Tasa Siguiente:** Muestra `Mañana, DD/MM/AAAA` o el día de la semana correspondiente (ej. `Lunes, DD/MM/AAAA`) con indicador ámbar.
- Los acordeones **memorizan su estado abierto o cerrado** en el navegador (`localStorage`) al navegar entre cualquier página del sistema.

### Cuentas por Cobrar (`/cuentas-por-cobrar`)

- Monitorea los saldos vencidos organizados en 4 tramos de antigüedad:
  - 0 a 7 días, 8 a 15 días, 16 a 30 días, más de 30 días.
- Haz clic en **"Recordatorio WhatsApp"** para enviar cobranza formal con un solo toque.

### Reportes y Exportación (`/dashboard`)

- Revisa ingresos consolidados en USD y Bs.
- Pulsa **"Descargar CSV"** para abrir en Excel o **"Imprimir / Guardar PDF"** para reportes ejecutivos.
- En caso de cancelaciones, usa **"Anular Pedido"** ingresando el motivo obligatorio para la auditoría inmutable.

---

## 7. Conmutador de Tema (Modo Claro / Modo Oscuro Tokyo Night)

- **Ubicación del Conmutador:**
  - **En Computadora / Tablet:** En la parte superior de la barra lateral (Sidebar), donde anteriormente figuraba la versión del sistema, ahora se encuentra el botón interactivo con icono de **Sol / Luna** (`Sun` / `Moon`).
  - **En Teléfono Móvil:** En la barra superior junto al botón del menú hamburguesa.
  - **Ubicación de la versión del sistema:** La versión `v1.0.0` se ubica discretamente al pie de la barra lateral junto al correo de sesión.
- **Paleta Tokyo Night:** Al activar el modo oscuro, la aplicación adopta tonos nocturnos azulados (`#16161e` de fondo, `#1a1b26` en superficies y `#1f202c` en botones interactivos) para un descanso visual prolongado y un contraste nítido de lectura.
- **Persistencia Inmediata:** La preferencia se almacena en tu navegador. Al recargar la página o volver al día siguiente, el sistema mantendrá tu tema sin parpadeos.

---

## 8. Lectura Visual y Flujo Táctil en Taller de Producción (`/taller`)

En el tablero de producción, cada tarjeta comunica su estado actual mediante el **color de fondo de la tarjeta**, mientras que los botones de avance son sobrios y neutrales:

1. **🔵 Tarjeta con Tinte Azul Zafiro (Por Iniciar / Recibido):**
   - Indica que la orden está en espera de arrancar en máquinas.
   - Botón neutral: **`[ ▶ Iniciar Producción ]`** (1 solo toque para pasar a máquinas).
2. **🟡 Tarjeta con Tinte Ámbar (En Producción):**
   - Indica que el trabajo está actualmente imprimiéndose o ensamblándose.
   - Botón neutral: **`[ 🖨 Listo para Retiro ]`** (con icono de impresora).
   - Botón secundario discreto: *Revertir a recibido* si hubo una detención justificada.
3. **🟢 Tarjeta con Tinte Esmeralda (Listos para Retiro):**
   - El trabajo está terminado y empacado en mostrador.
   - Botón directo de **`[ Avisar por WhatsApp ]`** para notificar al cliente.
   - **Si tiene saldo pendiente:** Botón prioritario neutral **`[ 🪙 Cobrar Saldo y Entregar ]`** (icono de monedas en mano), que abre la calculadora de cobro en Bs o USD antes de entregar.
   - **Si el saldo es $0.00:** Botón neutral **`[ 📦 Entregar al Cliente ]`** (icono de paquete verificado).
4. **Acceso Rápido desde la Pantalla de Inicio (Home):**
   - Las 4 tarjetas de resumen del taller en la página principal ahora son interactivas: al hacer clic en cualquiera de ellas ("Activas en Taller", "Por Iniciar", "En Producción", "Listos para Retiro"), viajarás directamente al taller con ese filtro preseleccionado.

---

## 9. Sistema de Diseño Integral Tokyo Night y Selectores Universales (Fase 34)

A partir de la versión v1.0.0, la experiencia visual de APSys fue unificada transversalmente bajo el estándar de diseño **Tokyo Night**:

1. **Unificación Estricta del Azul Zafiro (`#7aa2f7`):**
   - El color azul utilizado en la tarjeta "Por Iniciar" del Home es **exactamente el mismo** utilizado en los accesos de "Gestión de Pedidos", la tasa informativa del Euro BCV, los checks de selección y los anillos de foco de la interfaz. Esto elimina cualquier confusión visual o disparidad entre pantallas.
2. **Selector Universal Inteligente (`CustomSelect`):**
   - Al registrar pedidos o seleccionar clientes y servicios, el nuevo selector desplegable ofrece:
     - Búsqueda en tiempo real por nombre o teléfono sin perder el contexto.
     - Botón directo para registrar clientes nuevos sin abandonar el pedido en curso.
     - Enfoque visual nítido con el azul oficial Tokyo Night, sin bordes verdes desentonados.
     - Navegación táctil ágil adaptada para tablets de mostrador y teléfonos móviles.
3. **Consistencia en Todas las Pantallas:**
   - La barra lateral (Sidebar), el widget de tasas BCV, el pie de usuario, las listas de clientes, catálogo de servicios, comanda técnica, paneles de cobranza y reportes financieros comparten ahora la misma armonía cromática (`#16161e` en fondos, `#1a1b26` en tarjetas, `#1f202c` en controles interactivos y `#24283b` en divisiones), ofreciendo una apariencia profesional, moderna y libre de saturación visual.
4. **Barras de Progreso Canónicas:**
   - Tanto las barras de participación y demanda por servicio en *Rotación* como la barra acumulativa de vencimiento de cartera (*Aging*) en *Cuentas por Cobrar* comparten los mismos tokens cromáticos (Azul Zafiro `#7aa2f7`, Ámbar `#e0af68`, Naranja `#ff9e64` y Rojo `#f7768e` en modo oscuro, con contraste calibrado en modo claro).
5. **Navegación Fluida y Retención de Scroll en Menú Lateral:**
   - Al desplazarse por la barra lateral para acceder a módulos inferiores como *Rotación de Servicios* o *Cuentas por Cobrar*, el menú retiene de forma continua su posición exacta de desplazamiento entre navegaciones, evitando molestos saltos a la parte superior.
