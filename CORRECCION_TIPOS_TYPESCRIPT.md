# Corrección de Errores de Tipos TypeScript

## 🐛 Problema Identificado

**Error:** `Type error: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.`

**Ubicación:** `app/api/admin/database/stats/route.ts:77`

**Causa:** Prisma retorna valores de tipo `Decimal` cuando se usan campos monetarios, no `number`. Las operaciones aritméticas requieren conversión explícita.

---

## ✅ Solución Aplicada

### Antes (Incorrecto)
```typescript
const stats = {
  totalIngresos: totalIngresos._sum.monto || 0,
  totalEgresos: totalEgresos._sum.monto || 0,
  saldoNeto: (totalIngresos._sum.monto || 0) - (totalEgresos._sum.monto || 0),
}
```

### Después (Correcto)
```typescript
// Convertir Decimal a number
const totalIngresosNum = totalIngresos._sum.monto ? parseFloat(totalIngresos._sum.monto.toString()) : 0
const totalEgresosNum = totalEgresos._sum.monto ? parseFloat(totalEgresos._sum.monto.toString()) : 0

const stats = {
  totalIngresos: totalIngresosNum,
  totalEgresos: totalEgresosNum,
  saldoNeto: totalIngresosNum - totalEgresosNum,
}
```

---

## 🔍 Explicación

### ¿Por qué ocurre?

Prisma usa el tipo `Decimal` para campos monetarios en la base de datos para evitar problemas de precisión con números flotantes. Sin embargo, TypeScript no permite operaciones aritméticas directas con `Decimal`.

### ¿Cómo se resuelve?

1. **Convertir a string:** `totalIngresos._sum.monto.toString()`
2. **Convertir a number:** `parseFloat(...)`
3. **Manejar null:** Usar operador ternario para valores nulos

### Patrón General

```typescript
// Para un valor Decimal
const valor = decimalValue ? parseFloat(decimalValue.toString()) : 0

// Para operaciones
const resultado = (valor1 || 0) - (valor2 || 0)
```

---

## 📋 Archivos Afectados

✅ **Corregido:**
- `app/api/admin/database/stats/route.ts`

✅ **Verificados (sin problemas):**
- `app/api/reportes/financiero/route.ts`
- `app/api/reportes/clinico/route.ts`

---

## 🚀 Cómo Evitar en el Futuro

### Regla 1: Siempre convertir Decimal
```typescript
// ❌ Incorrecto
const total = ingreso._sum.monto - egreso._sum.monto

// ✅ Correcto
const total = parseFloat(ingreso._sum.monto?.toString() || '0') - 
              parseFloat(egreso._sum.monto?.toString() || '0')
```

### Regla 2: Usar helper function
```typescript
// Crear una función reutilizable
function toNumber(decimal: any): number {
  return decimal ? parseFloat(decimal.toString()) : 0
}

// Usar en el código
const total = toNumber(ingreso._sum.monto) - toNumber(egreso._sum.monto)
```

### Regla 3: Validar tipos en Prisma
```typescript
// En schema.prisma, asegurar que los campos monetarios sean Decimal
model Ingreso {
  monto Decimal @db.Decimal(10, 2)  // ✅ Correcto
}
```

---

## 📊 Impacto

**Antes:** ❌ Error de compilación, no se puede desplegar
**Después:** ✅ Compila correctamente, se puede desplegar

---

## 🔗 Referencias

- [Prisma Decimal Type](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#decimal)
- [TypeScript Arithmetic Operations](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

**Fecha de Corrección:** Abril 2026
**Versión:** 1.0.0
