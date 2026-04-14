# 📋 Sistema de Facturación - Explicación

## Tipos de Documentos

### 1. 🧾 FACTURA (Con SAR)

**¿Qué es?**
- Documento fiscal legal para Honduras
- Requiere autorización de la SAR (Servicio de Administración de Rentas)
- Tiene validez legal y tributaria

**Características:**
- ✅ Requiere CAI (Código de Autorización de Impresión)
- ✅ Requiere correlativo SAR configurado
- ✅ Numeración: `000-001-01-00000001`
- ✅ Incluye desglose de ISV (15%)
- ✅ Válida para declaraciones fiscales
- ✅ Genera ingreso contable automático

**Cuándo usar:**
- Ventas a clientes finales
- Servicios odontológicos facturados
- Cualquier transacción que requiera comprobante fiscal

**Configuración requerida:**
1. Ir a `/dashboard/configuracion/facturacion`
2. Crear un correlativo para FACTURA
3. Ingresar CAI, rango de numeración y fecha límite

---

### 2. 📄 ORDEN DE PEDIDO (Documento Interno)

**¿Qué es?**
- Documento interno de la clínica
- NO tiene validez fiscal
- Usado para control interno o presupuestos

**Características:**
- ✅ NO requiere CAI
- ✅ NO requiere correlativo SAR
- ✅ Numeración automática simple: `OP-00001`
- ✅ Incluye cálculo de ISV (informativo)
- ✅ NO genera ingreso contable
- ✅ Puede convertirse en factura después

**Cuándo usar:**
- Presupuestos para pacientes
- Órdenes internas
- Cotizaciones
- Control de servicios pendientes
- Documentos que NO requieren validez fiscal

**Configuración requerida:**
- ✅ Ninguna - Funciona automáticamente

---

## ¿Qué hace el sistema al emitir cada documento?

### Al emitir una FACTURA:

1. **Valida** que existe un correlativo SAR activo
2. **Verifica** que el correlativo no esté vencido
3. **Verifica** que no se haya agotado el rango
4. **Genera** el número de factura según formato SAR
5. **Incrementa** el contador del correlativo
6. **Calcula** subtotal, ISV y total
7. **Crea** el registro en la base de datos
8. **Genera** un ingreso contable automático
9. **Muestra** confirmación y redirige

**Ejemplo de numeración:**
```
000-001-01-00000001
│   │   │  │
│   │   │  └─ Número secuencial (8 dígitos)
│   │   └──── Tipo de documento (01 = Factura)
│   └──────── Punto de emisión (001)
└──────────── Sucursal (000)
```

---

### Al emitir una ORDEN DE PEDIDO:

1. **NO valida** correlativos (no los necesita)
2. **Busca** la última orden emitida
3. **Genera** número secuencial simple: `OP-00001`
4. **Calcula** subtotal, ISV y total (informativo)
5. **Crea** el registro en la base de datos
6. **NO genera** ingreso contable
7. **Muestra** confirmación y redirige

**Ejemplo de numeración:**
```
OP-00001
│  │
│  └─ Número secuencial (5 dígitos)
└──── Prefijo de Orden de Pedido
```

---

## Flujo de Trabajo Recomendado

### Escenario 1: Venta Directa
```
Paciente → Servicio → FACTURA → Pago → Ingreso Contable
```

### Escenario 2: Presupuesto Primero
```
Paciente → Consulta → ORDEN DE PEDIDO (presupuesto)
         ↓
    Paciente acepta
         ↓
    FACTURA → Pago → Ingreso Contable
```

### Escenario 3: Tratamiento por Etapas
```
Paciente → Plan de Tratamiento → ORDEN DE PEDIDO (cada etapa)
         ↓
    Al completar etapa
         ↓
    FACTURA → Pago → Ingreso Contable
```

---

## Diferencias Clave

| Característica | FACTURA | ORDEN DE PEDIDO |
|---------------|---------|-----------------|
| Validez Fiscal | ✅ Sí | ❌ No |
| Requiere CAI | ✅ Sí | ❌ No |
| Requiere Correlativo | ✅ Sí | ❌ No |
| Numeración | SAR (compleja) | Simple (OP-00001) |
| Ingreso Contable | ✅ Automático | ❌ No genera |
| Desglose ISV | ✅ Obligatorio | ℹ️ Informativo |
| Uso | Legal/Fiscal | Interno |

---

## Configuración del Sistema

### Para usar FACTURAS:

1. **Ir a Configuración de Facturación:**
   ```
   Dashboard → Configuración → Facturación SAR
   ```

2. **Crear Correlativo:**
   - Tipo: FACTURA
   - CAI: (proporcionado por SAR)
   - Sucursal: 000
   - Punto de Emisión: 001
   - Tipo de Documento: 01
   - Rango Inicial: 1
   - Rango Final: 10000 (ejemplo)
   - Fecha Límite: (según autorización SAR)

3. **Activar el Correlativo**

### Para usar ÓRDENES DE PEDIDO:

✅ **No requiere configuración** - Funciona automáticamente

---

## Preguntas Frecuentes

### ¿Puedo emitir facturas sin configurar correlativos?
❌ No. Las facturas requieren correlativo SAR obligatoriamente.

### ¿Puedo emitir órdenes sin configurar correlativos?
✅ Sí. Las órdenes funcionan automáticamente sin configuración.

### ¿Qué pasa si se agota mi rango de facturas?
⚠️ El sistema no permitirá emitir más facturas. Debes:
1. Solicitar nuevo CAI a la SAR
2. Crear nuevo correlativo en el sistema

### ¿Puedo convertir una orden en factura?
📝 Actualmente no automáticamente, pero puedes:
1. Ver la orden de pedido
2. Crear una nueva factura con los mismos items

### ¿Las órdenes aparecen en reportes contables?
❌ No. Solo las facturas generan ingresos contables.

### ¿Puedo usar órdenes para presupuestos?
✅ Sí. Es el uso recomendado para presupuestos y cotizaciones.

---

## Resumen

**FACTURA = Documento Legal**
- Usa cuando necesites comprobante fiscal
- Requiere configuración SAR
- Genera contabilidad automática

**ORDEN DE PEDIDO = Documento Interno**
- Usa para presupuestos y control interno
- No requiere configuración
- No afecta contabilidad

---

## Soporte

Si tienes dudas sobre:
- **Configuración SAR:** Consulta con tu contador
- **Uso del sistema:** Revisa esta documentación
- **Problemas técnicos:** Verifica los logs del servidor
