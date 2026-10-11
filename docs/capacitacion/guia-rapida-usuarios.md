# Guía Rápida de Uso de APSys por Perfil

**Sistema:** APSys — Taller de Gráfica & Impresión  
**Versión:** 1.0.0  
**Audiencia:** Personal de Mostrador, Operarios de Taller y Gerencia  

---

## 1. Perfil Mostrador / Recepción (Registro y Cobranza)

### Registrar una Nueva Orden de Trabajo (< 2 minutos)
1. Presiona el botón **"Nuevo pedido"** (o navega a `/pedidos/nuevo`).
2. **Selecciona o crea el cliente:**
   - Si es recurrente, búscalo por nombre o teléfono.
   - Si es nuevo, pulsa "Nuevo cliente", ingresa nombre y WhatsApp y guarda.
3. **Agrega los trabajos a realizar:**
   - Selecciona el servicio (ej. Vinil Adhesivo, Pendón, Talonarios).
   - Ingresa dimensiones (ancho × alto en metros o cm) y acabados (ojetes, laminado, corte).
   - Coloca la cantidad y el precio unitario pactado en USD.
4. **Registra el abono inicial:**
   - Puedes cobrar en **USD efectivo** o **Bolívares (Pago Móvil / Transferencia)**.
   - Si es en Bs, el sistema aplica la tasa oficial del día automáticamente.
5. Haz clic en **"Crear Pedido"** e imprime la **Comanda Técnica**.

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

## 3. Perfil Gerencial / Administración (Finanzas y Control)

### Tasa de Cambio del Día (`/tasas`)
- Al abrir el taller cada mañana, ingresa a `/tasas` y actualiza la tasa referencial (BCV u oficial).
- **Garantía histórica:** Modificar la tasa de hoy nunca alterará los montos de pedidos de días anteriores.

### Cuentas por Cobrar (`/cuentas-por-cobrar`)
- Monitorea los saldos vencidos organizados en 4 tramos de antigüedad:
  - 0 a 7 días, 8 a 15 días, 16 a 30 días, más de 30 días.
- Haz clic en **"Recordatorio WhatsApp"** para enviar cobranza formal con un solo toque.

### Reportes y Exportación (`/dashboard`)
- Revisa ingresos consolidados en USD y Bs.
- Pulsa **"Descargar CSV"** para abrir en Excel o **"Imprimir / Guardar PDF"** para reportes ejecutivos.
- En caso de cancelaciones, usa **"Anular Pedido"** ingresando el motivo obligatorio para la auditoría inmutable.
