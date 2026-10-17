# Guía Rápida de Uso de APSys por Perfil

**Sistema:** APSys — Taller de Gráfica & Impresión  
**Versión:** 1.0.0  
**Audiencia:** Personal de Mostrador, Operarios de Taller y Gerencia

---

## 1. Perfil Mostrador / Recepción (Registro y Cobranza)

### Registrar una Nueva Orden de Trabajo (< 2 minutos)

1. Presiona el botón **"Nuevo pedido"** (o navega a `/pedidos/nuevo`).
2. **Selecciona o crea el cliente (Selector Inteligente):**
   - Escribe en el buscador predictivo para filtrar al instante por nombre o número de teléfono.
   - Si es nuevo, pulsa el botón integrado "Registrar Nuevo Cliente", ingresa sus datos y queda seleccionado automáticamente.
3. **Agrega los trabajos a realizar:**
   - Selecciona el servicio desde el selector interactivo (ej. Vinil Adhesivo, Pendón, Talonarios).
   - Ingresa dimensiones (ancho × alto en metros o cm) y acabados (ojetes, laminado, corte).
   - Coloca la cantidad y el precio unitario pactado en USD.
4. **Registra el abono inicial y selecciona la tasa adecuada:**
   - Puedes cobrar en **USD efectivo** o **Bolívares (Pago Móvil / Transferencia)**.
   - Si el cobro es en Bs, el sistema aplica la tasa oficial del día automáticamente.
   - **Selector de Tasa Hoy vs. Mañana:** Si el BCV ya emitió en la tarde la tasa para el día siguiente y fue registrada en `/tasas`, en el formulario de la orden aparecerá un selector destacado en color ámbar:
     `[ Hoy (Bs. 879.12) ]` | `[ Mañana (Bs. 880.12) ]`
     Permite cotizar o cobrar de inmediato con la tasa nueva a discreción del operador para proteger el margen del taller antes del cierre de jornada.
5. Haz clic en **"Crear Pedido"** e imprime la **Comanda Técnica**.

### Navegación y Paginación en Listados (`/pedidos` y `/clientes`)

Para garantizar que el sistema cargue de manera instantánea sin congelar el navegador:

- Las listas de **Pedidos** y **Clientes** muestran **25 registros por página**.
- Al final del listado se ubican los botones de navegación:
  - `[ Siguiente → ]`: Carga las 25 órdenes o clientes anteriores aprovechando los índices rápidos de la base de datos.
  - `[ ← Inicio ]`: Aparece al haber avanzado de página para regresar con un solo toque a las órdenes más recientes.
- Si utilizas el buscador, la paginación respetará automáticamente tu término de búsqueda.

---

## 2. Perfil Taller / Producción (Impresión y Acabados)

### Operar el Tablero Kanban (`/taller`)

El tablero de taller está diseñado para pantallas táctiles y uso con una sola mano:

1. **Columna "Por Imprimir / Registrado":**
   - Muestra las órdenes entrantes ordenadas por urgencia.
   - Escanea el código de barras o pulsa **"Comenzar Impresión"** cuando cargues el rollo/material.
2. **Columna "En Impresión / Taller":**
   - Indica trabajos que están en máquina o en mesa de acabado.
   - Al finalizar corte, laminado y empaque, pulsa **"Marcar Listo"**.
3. **Notificación al Cliente:**
   - Al pasar a "Listo", aparece el botón verde **"WhatsApp"**. Pulsa para abrir el chat con el mensaje preformateado de retiro y saldo pendiente.
4. **Columna "Listo para Retiro":**
   - Cuando el cliente se presente en el mostrador, verifica el pago del saldo y pulsa **"Entregar"**.

---

## 3. Gestión y Dinámica de Tasas de Cambio (`/tasas`) — Operador & Gerencia

### Ciclo Diario y Doble Vigencia del BCV

En Venezuela, el Banco Central publica la tasa oficial bajo el siguiente ciclo operativo:

1. **En la mañana:** Rige la tasa fijada para el día hábil en curso (con vigencia legal desde las 12:00 a. m. de hoy).
2. **En la tarde (3:30 p. m. a 5:30 p. m.):** El BCV publica la tasa oficial del **siguiente día hábil**.

### Estados en el Histórico de Tasas

Al consultar `/tasas`, la tabla del histórico clasifica cada registro con un estado visual explícito:

- 🟢 **Vigente (Hoy):** La tasa oficial activa para la jornada en curso. Se toma por defecto para cálculos y cobros del día.
- 🟡 **Programada (Mañana):** La tasa oficial emitida para el siguiente día hábil (inicia a las 12:00 a. m. del día siguiente). Se mantiene en espera y **se activa de forma automática a medianoche (12:00 a. m.)** sin requerir ninguna acción del usuario.
- ⚪ **Histórica:** Tasas de días anteriores conservadas inmutablemente. Garantiza que ninguna orden o abono previo sufra variaciones en sus montos en bolívares.

### ¿Cómo aplicar o utilizar la tasa del día siguiente?

- **Paso 1:** Al final de la tarde, haz clic en **"Consultar Tasas BCV en Vivo"**.
- **Paso 2:** Si el BCV ya publicó para mañana, el botón mostrará: **"Programar Bs. XXX.XXXX para Mañana (Día Hábil)"**. Al pulsar el botón, la tasa queda registrada en la base de datos con inicio a las 12:00 a. m. del día siguiente.
- **Paso 3 (Opcional):** Si necesitas cobrar un pedido en ese momento usando esa tasa anticipada, ve a `/pedidos/nuevo` y activa la píldora **"Mañana (Bs. XXX.XX)"** en el selector de tasa.
- **Paso 4 (Automático):** Al llegar las 12:00 a. m. (medianoche), el sistema promueve automáticamente esa tasa como la nueva tasa **Vigente** para todo el sistema.

> 💡 **Sincronización Automática en Segundo Plano (Cron Job):**  
> Aunque ningún operador o administrador esté conectado al sistema, una tarea automática se ejecuta a las 6:30 p. m. y a las 12:05 a. m. para registrar la tasa oficial directamente en la base de datos de Supabase. El botón en `/tasas` queda disponible como respaldo inmediato para forzar una sincronización manual al instante.

---

## 4. Perfil Gerencial / Administración (Finanzas y Control)

### Widget de Tasas Referenciales BCV (Barra Lateral)

- En la barra lateral se ubica el widget interactivo con dos acordeones independientes:
  - **Hoy:** Tasa vigente en USD y EUR con indicador verde.
  - **Mañana:** Tasa programada emitida por el BCV para el día siguiente con indicador ámbar.
- Los acordeones **memorizan su estado abierto o cerrado** al navegar entre cualquier página del sistema.

### Cuentas por Cobrar (`/cuentas-por-cobrar`)

- Monitorea los saldos vencidos organizados en 4 tramos de antigüedad:
  - 0 a 7 días, 8 a 15 días, 16 a 30 días, más de 30 días.
- Haz clic en **"Recordatorio WhatsApp"** para enviar cobranza formal con un solo toque.

### Reportes y Exportación (`/dashboard`)

- Revisa ingresos consolidados en USD y Bs.
- Pulsa **"Descargar CSV"** para abrir en Excel o **"Imprimir / Guardar PDF"** para reportes ejecutivos.
- En caso de cancelaciones, usa **"Anular Pedido"** ingresando el motivo obligatorio para la auditoría inmutable.
