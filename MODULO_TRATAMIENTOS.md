# Módulo de Tratamientos - Guía Completa

## 📋 Descripción General

El módulo de tratamientos permite gestionar planes de tratamiento dental para pacientes, incluyendo:
- Creación de planes de tratamiento
- Definición de etapas del tratamiento
- Seguimiento del progreso
- Gestión de costos
- Actualización de estados

---

## 🎯 Funcionalidades Principales

### 1. Listado de Tratamientos
**Ubicación:** Dashboard → Tratamientos

**Características:**
- ✅ Vista de todos los tratamientos
- ✅ Filtrado por estado
- ✅ Información del paciente
- ✅ Barra de progreso visual
- ✅ Costo total del tratamiento
- ✅ Cantidad de etapas completadas

**Estados Disponibles:**
- 🔵 **Planificado** - Tratamiento en fase de planificación
- 🟢 **En Progreso** - Tratamiento activo
- 🟡 **Pausado** - Tratamiento pausado temporalmente
- ✅ **Completado** - Tratamiento finalizado
- ❌ **Cancelado** - Tratamiento cancelado

**Filtros:**
- Todos
- Planificados
- En Progreso
- Pausados
- Completados
- Cancelados

---

### 2. Crear Nuevo Tratamiento
**Ubicación:** Dashboard → Tratamientos → Nuevo Tratamiento

**Campos Requeridos:**
- 📋 **Paciente** - Seleccionar paciente del sistema
- 📝 **Nombre** - Nombre del tratamiento (Ej: Ortodoncia, Implante)
- 💰 **Costo Total** - Costo total del tratamiento
- 📊 **Estado** - Estado inicial del tratamiento

**Campos Opcionales:**
- 📄 **Descripción** - Descripción detallada del tratamiento
- 📌 **Observaciones** - Notas adicionales

**Etapas del Tratamiento:**
- Agregar múltiples etapas
- Cada etapa tiene:
  - Nombre
  - Descripción
  - Costo individual
  - Orden de ejecución

**Ejemplo de Tratamiento:**
```
Nombre: Ortodoncia Completa
Paciente: Juan Pérez
Costo Total: L. 2,500.00
Estado: Planificado

Etapas:
1. Evaluación y Diagnóstico - L. 200.00
2. Colocación de Brackets - L. 800.00
3. Ajustes Mensuales (12 meses) - L. 1,200.00
4. Retención - L. 300.00
```

---

### 3. Detalle del Tratamiento
**Ubicación:** Dashboard → Tratamientos → [Nombre del Tratamiento]

**Información Mostrada:**

#### A. Resumen General
- 💰 **Costo Total** - Monto total del tratamiento
- ⏱️ **Progreso** - Porcentaje de avance
- 📊 **Etapas** - Cantidad completadas vs total

#### B. Barra de Progreso
- Visualización gráfica del avance
- Actualización en tiempo real
- Porcentaje exacto

#### C. Información del Tratamiento
- Nombre
- Descripción
- Estado actual
- Observaciones
- Paciente asociado

#### D. Etapas del Tratamiento
Cada etapa muestra:
- Número de etapa
- Nombre
- Descripción
- Costo
- Fecha de inicio (si aplica)
- Estado (Completada/Pendiente)
- Botones de acción

**Acciones en Etapas:**
- ✅ **Completar** - Marcar etapa como completada
- 🗑️ **Eliminar** - Eliminar etapa del tratamiento

---

### 4. Editar Tratamiento
**Cómo Acceder:**
1. Ir a detalle del tratamiento
2. Hacer clic en botón "Editar" (lápiz)
3. Modificar campos
4. Guardar cambios

**Campos Editables:**
- Nombre
- Descripción
- Estado
- Observaciones

**Nota:** El costo total no se puede editar directamente. Se calcula automáticamente desde las etapas.

---

### 5. Agregar Etapas
**Cómo Agregar:**
1. En detalle del tratamiento
2. Hacer clic en "Nueva Etapa"
3. Completar formulario:
   - Nombre (requerido)
   - Costo (requerido)
   - Descripción (opcional)
4. Hacer clic en "Agregar Etapa"

**Validaciones:**
- Nombre no puede estar vacío
- Costo debe ser un número válido
- Costo debe ser mayor a 0

---

### 6. Completar Etapas
**Cómo Completar:**
1. En detalle del tratamiento
2. Buscar la etapa a completar
3. Hacer clic en botón "Completar"
4. La etapa se marca como completada
5. El progreso se actualiza automáticamente

**Efectos:**
- ✅ Etapa se marca como completada
- 📅 Se registra fecha de finalización
- 📊 Progreso general se actualiza
- 🎨 Etapa cambia de color (verde)

---

### 7. Eliminar Tratamiento
**Cómo Eliminar:**
1. En detalle del tratamiento
2. Hacer clic en botón "Eliminar" (papelera)
3. Confirmar eliminación
4. Se elimina el tratamiento y todas sus etapas

**Advertencia:**
- Esta acción no se puede deshacer
- Se eliminarán todas las etapas asociadas

---

## 📊 Cálculos Automáticos

### Progreso del Tratamiento
```
Progreso (%) = (Etapas Completadas / Total Etapas) × 100
```

**Ejemplo:**
- Total de etapas: 4
- Etapas completadas: 2
- Progreso: (2/4) × 100 = 50%

### Costo Total
```
Costo Total = Σ Costo de Etapas
```

**Ejemplo:**
- Etapa 1: L. 200.00
- Etapa 2: L. 800.00
- Etapa 3: L. 1,200.00
- Etapa 4: L. 300.00
- Costo Total: L. 2,500.00

---

## 🔄 Flujo de Trabajo Típico

### Paso 1: Crear Tratamiento
```
1. Ir a Tratamientos → Nuevo Tratamiento
2. Seleccionar paciente
3. Ingresar nombre y costo total
4. Agregar etapas
5. Guardar
```

### Paso 2: Iniciar Tratamiento
```
1. Cambiar estado a "EN_PROGRESO"
2. Comenzar con primera etapa
3. Registrar fecha de inicio
```

### Paso 3: Completar Etapas
```
1. Conforme se completan etapas
2. Hacer clic en "Completar"
3. Progreso se actualiza automáticamente
```

### Paso 4: Finalizar Tratamiento
```
1. Cuando todas las etapas estén completas
2. Cambiar estado a "COMPLETADO"
3. Registrar observaciones finales
```

---

## 📈 Casos de Uso

### Caso 1: Ortodoncia
```
Nombre: Ortodoncia Completa
Costo Total: L. 2,500.00

Etapas:
1. Evaluación y Diagnóstico (L. 200)
2. Colocación de Brackets (L. 800)
3. Ajustes Mensuales (L. 1,200)
4. Retención (L. 300)

Duración: 24 meses
```

### Caso 2: Implante Dental
```
Nombre: Implante Dental
Costo Total: L. 3,500.00

Etapas:
1. Evaluación y Radiografías (L. 300)
2. Colocación de Implante (L. 2,000)
3. Integración Ósea (L. 500)
4. Colocación de Corona (L. 700)

Duración: 6 meses
```

### Caso 3: Blanqueamiento
```
Nombre: Blanqueamiento Dental
Costo Total: L. 800.00

Etapas:
1. Limpieza Previa (L. 200)
2. Aplicación de Blanqueador (L. 400)
3. Seguimiento (L. 200)

Duración: 1 mes
```

---

## 🔐 Permisos y Seguridad

**Quién puede acceder:**
- ✅ Administrador
- ✅ Odontólogo
- ✅ Asistente
- ✅ Recepción

**Validaciones:**
- Solo usuarios autenticados
- Validación de sesión en cada operación
- Datos validados con Zod

---

## 📱 Interfaz Responsiva

**Dispositivos Soportados:**
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

**Adaptaciones:**
- Grid responsive
- Botones táctiles
- Textos legibles
- Navegación optimizada

---

## 🆘 Solución de Problemas

### Problema: No puedo crear un tratamiento
**Solución:**
1. Verifica que hayas seleccionado un paciente
2. Completa todos los campos requeridos
3. Verifica que el costo sea un número válido
4. Intenta nuevamente

### Problema: El progreso no se actualiza
**Solución:**
1. Recarga la página
2. Verifica que las etapas estén marcadas como completadas
3. Comprueba que haya etapas en el tratamiento

### Problema: No puedo eliminar una etapa
**Solución:**
1. Verifica que tengas permisos de administrador
2. Intenta desde otra ventana del navegador
3. Limpia el caché del navegador

### Problema: Los datos no se guardan
**Solución:**
1. Verifica tu conexión a internet
2. Comprueba que la sesión esté activa
3. Intenta nuevamente

---

## 📊 Estadísticas y Reportes

**Datos Disponibles:**
- Total de tratamientos
- Tratamientos por estado
- Progreso promedio
- Costo total de tratamientos
- Etapas completadas vs pendientes

**Acceso:**
- Dashboard → Reportes → Reporte Clínico

---

## 🔗 Integración con Otros Módulos

**Pacientes:**
- Cada tratamiento está asociado a un paciente
- Se puede ver historial de tratamientos

**Facturas:**
- Los costos de tratamientos pueden facturarse
- Integración con módulo de facturación

**Expedientes:**
- Los tratamientos se registran en el expediente
- Historial clínico completo

---

## 📝 Notas Importantes

1. **Costo Total:** Se calcula automáticamente desde las etapas
2. **Progreso:** Se actualiza en tiempo real
3. **Etapas:** Pueden agregarse en cualquier momento
4. **Estados:** Pueden cambiarse según el progreso
5. **Eliminación:** No se puede deshacer

---

## 🚀 Mejoras Futuras

- [ ] Exportar tratamientos a PDF
- [ ] Recordatorios automáticos de etapas
- [ ] Historial de cambios
- [ ] Notas por etapa
- [ ] Adjuntos (radiografías, fotos)
- [ ] Integración con calendario
- [ ] Notificaciones al paciente

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
