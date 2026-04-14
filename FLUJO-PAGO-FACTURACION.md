# 💰 Flujo de Pago en Facturación

## Nuevo Flujo Implementado

### ✨ ¿Qué cambió?

Ahora al emitir una factura u orden de pedido, el sistema te lleva **automáticamente** a la página de pago con un modal interactivo.

---

## 🔄 Flujo Completo

### 1. Crear Factura/Orden
```
Dashboard → Facturación → Nueva Factura
  ↓
Seleccionar tipo (Factura o Orden de Pedido)
  ↓
Agregar paciente e items
  ↓
Click en "Emitir Factura/Orden"
```

### 2. Redirección Automática a Pago
```
Sistema crea la factura
  ↓
Redirige a: /dashboard/facturacion/[id]?pago=nuevo
  ↓
Se abre automáticamente el MODAL DE PAGO
```

### 3. Opciones en el Modal de Pago

#### Opción A: Registrar Pago Inmediato ✅
```
1. El monto se pre-llena con el total pendiente
2. Seleccionar método de pago
3. Agregar referencia (opcional)
4. Click en "Registrar Pago"
   ↓
Pago registrado exitosamente
   ↓
Si paga el total → Redirige a lista de facturas
Si paga parcial → Queda en la página para más pagos
```

#### Opción B: Dejar Pendiente ⏰
```
1. Click en "Dejar Pendiente"
   ↓
Factura queda con estado PENDIENTE
   ↓
Redirige a lista de facturas
```

---

## 🎯 Características del Modal de Pago

### Información Mostrada:
- ✅ Total de la factura
- ✅ Monto ya pagado
- ✅ Saldo pendiente (destacado en rojo)

### Campos del Formulario:
1. **Monto a Pagar**
   - Pre-llenado con el saldo pendiente
   - Botones rápidos: "Pago Total" y "50%"
   - Validación: No puede exceder el saldo

2. **Método de Pago**
   - 💵 Efectivo
   - 💳 Tarjeta de Crédito
   - 💳 Tarjeta de Débito
   - 🏦 Transferencia
   - 📝 Cheque
   - ➕ Otro

3. **Referencia** (Opcional)
   - Número de transacción
   - Número de cheque
   - Cualquier identificador

4. **Observaciones** (Opcional)
   - Notas adicionales sobre el pago

### Botones de Acción:
- **Dejar Pendiente** - Guarda sin pago
- **Registrar Pago** - Procesa el pago

---

## 📊 Estados de Factura

### PENDIENTE (Rojo)
- No se ha registrado ningún pago
- Saldo = Total de la factura

### PAGADA_PARCIAL (Amarillo)
- Se ha pagado parte del total
- Saldo > 0 pero < Total

### PAGADA (Verde)
- Se ha pagado el total
- Saldo = 0

### ANULADA (Gris)
- Factura cancelada
- No se pueden registrar pagos

---

## 💡 Casos de Uso

### Caso 1: Pago Total Inmediato
```
Paciente → Servicio → Emitir Factura
  ↓
Modal de pago se abre automáticamente
  ↓
Monto = L. 1,000.00 (total)
  ↓
Método: Efectivo
  ↓
Registrar Pago
  ↓
✅ Factura PAGADA
  ↓
Redirige a lista
```

### Caso 2: Pago Parcial
```
Paciente → Servicio → Emitir Factura
  ↓
Modal de pago se abre
  ↓
Total: L. 1,000.00
Paga: L. 500.00 (50%)
  ↓
Método: Efectivo
  ↓
Registrar Pago
  ↓
⚠️ Factura PAGADA_PARCIAL
  ↓
Queda en la página
  ↓
Puede registrar otro pago después
```

### Caso 3: Dejar Pendiente
```
Paciente → Servicio → Emitir Factura
  ↓
Modal de pago se abre
  ↓
Click en "Dejar Pendiente"
  ↓
❌ Factura PENDIENTE
  ↓
Redirige a lista
  ↓
Se puede pagar después desde la lista
```

### Caso 4: Múltiples Pagos
```
Factura Total: L. 3,000.00
  ↓
Pago 1: L. 1,000.00 (Efectivo)
  → Estado: PAGADA_PARCIAL
  ↓
Pago 2: L. 1,000.00 (Tarjeta)
  → Estado: PAGADA_PARCIAL
  ↓
Pago 3: L. 1,000.00 (Transferencia)
  → Estado: PAGADA ✅
```

---

## 🔧 Funcionalidades Adicionales

### Botones Rápidos de Monto:
- **Pago Total** - Llena el monto con el saldo completo
- **50%** - Llena el monto con la mitad del saldo

### Validaciones:
- ✅ El monto debe ser mayor a 0
- ✅ El monto no puede exceder el saldo pendiente
- ✅ Todos los campos requeridos deben estar llenos

### Feedback Visual:
- ✅ Notificación de éxito al registrar pago
- ✅ Notificación al dejar pendiente
- ✅ Indicador de carga mientras procesa
- ✅ Colores según estado de factura

---

## 📱 Acceso Posterior al Pago

Si dejaste una factura pendiente o con pago parcial, puedes:

1. **Ir a la lista de facturas**
   ```
   Dashboard → Facturación
   ```

2. **Buscar la factura**
   - Por número
   - Por paciente
   - Por estado (PENDIENTE, PAGADA_PARCIAL)

3. **Click en la factura**
   - Se abre la página de detalle
   - Click en "Registrar Pago" (botón verde)
   - Se abre el modal de pago

4. **Registrar el pago pendiente**

---

## 🎨 Diseño del Modal

### Características:
- ✨ Animación suave al abrir
- 🎨 Gradiente verde en el header
- 📊 Resumen visual del saldo
- 🔘 Botones grandes y claros
- 📱 Responsive (funciona en móvil)
- ⌨️ Auto-focus en el campo de monto
- ❌ Cerrar con X o ESC

### Colores:
- Verde: Pagos y acciones positivas
- Rojo: Saldo pendiente
- Amarillo: Pagos parciales
- Gris: Información secundaria

---

## 🚀 Ventajas del Nuevo Flujo

### Para el Usuario:
✅ Más rápido - No hay que buscar la factura después
✅ Más intuitivo - El flujo es natural
✅ Menos clicks - Todo en un solo lugar
✅ Menos errores - Validaciones automáticas

### Para la Clínica:
✅ Mejor control de pagos
✅ Menos facturas pendientes
✅ Registro inmediato de ingresos
✅ Historial completo de pagos

---

## 📝 Notas Importantes

1. **Orden de Pedido vs Factura:**
   - Ambas siguen el mismo flujo de pago
   - Las órdenes también pueden tener pagos registrados

2. **Pagos Parciales:**
   - Se pueden registrar múltiples pagos
   - Cada pago queda en el historial
   - El saldo se actualiza automáticamente

3. **Métodos de Pago:**
   - Se pueden combinar diferentes métodos
   - Cada pago puede tener su propio método

4. **Referencia:**
   - Útil para conciliación bancaria
   - Ayuda a identificar transacciones
   - No es obligatoria

---

## 🔄 Flujo Alternativo (Sin Modal Automático)

Si prefieres no usar el modal automático:

1. Emitir factura normalmente
2. Cerrar el modal (X)
3. Ir a la lista de facturas
4. Buscar y abrir la factura
5. Click en "Registrar Pago"

---

## 💻 Atajos de Teclado

- **Enter** - Registrar pago (cuando el formulario está completo)
- **ESC** - Cerrar modal
- **Tab** - Navegar entre campos

---

## 🎯 Resumen

**Antes:**
```
Emitir Factura → Lista → Buscar → Abrir → Registrar Pago
(5 pasos)
```

**Ahora:**
```
Emitir Factura → Modal de Pago → Registrar o Dejar Pendiente
(2 pasos)
```

**Resultado:** ⚡ Proceso 60% más rápido

---

¡El nuevo flujo hace que registrar pagos sea más rápido y eficiente! 🎉
