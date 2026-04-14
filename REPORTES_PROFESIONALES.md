# Reportes Profesionales - Sistema de Gestión Dental

## 📊 Descripción General

El sistema incluye dos tipos de reportes profesionales con análisis detallado:

1. **Reporte Financiero** - Análisis de ingresos, egresos y utilidades
2. **Reporte Clínico** - Análisis de citas, tratamientos y procedimientos

---

## 💰 REPORTE FINANCIERO

### Ubicación
Dashboard → Reportes → Reporte Financiero

### Indicadores Clave (KPIs)

#### 1. Total Ingresos
- **Definición:** Suma de todos los ingresos registrados en el período
- **Fórmula:** Σ Ingresos
- **Ejemplo:** L. 18,847.26

#### 2. Total Egresos
- **Definición:** Suma de todos los gastos registrados
- **Fórmula:** Σ Egresos
- **Ejemplo:** L. 1,150.00

#### 3. Utilidad
- **Definición:** Diferencia entre ingresos y egresos
- **Fórmula:** Total Ingresos - Total Egresos
- **Ejemplo:** L. 17,697.26

#### 4. Margen de Utilidad
- **Definición:** Porcentaje de ganancia sobre ingresos
- **Fórmula:** (Utilidad / Total Ingresos) × 100
- **Ejemplo:** 93.89%

### Secciones del Reporte

#### A. Facturas por Estado
Gráfico de pastel mostrando:
- **Pagadas:** Facturas completamente pagadas
- **Pagadas Parcialmente:** Facturas con pagos pendientes
- **Pendientes:** Facturas sin pagar
- **Anuladas:** Facturas canceladas

**Datos mostrados:**
- Cantidad de facturas por estado
- Monto total por estado
- Porcentaje del total

#### B. Métodos de Pago
Gráfico de barras mostrando:
- Efectivo
- Tarjeta de Crédito
- Tarjeta de Débito
- Transferencia
- Cheque
- Otro

**Datos mostrados:**
- Cantidad de transacciones
- Monto total por método
- Tendencia de uso

#### C. Top 10 Pacientes por Gasto
Tabla ordenada por mayor gasto:
- Nombre del paciente
- Total gastado
- Porcentaje del total
- Barra de progreso visual

**Ejemplo:**
| Paciente | Total Gastado | Porcentaje |
|----------|---------------|-----------|
| Juan Pérez | L. 2,415.00 | 12.8% |
| María González | L. 1,495.00 | 7.9% |
| Carlos Morales | L. 1,288.00 | 6.8% |

#### D. Resumen Detallado

**Facturas:**
- Total de facturas emitidas
- Facturas pagadas
- Facturas pendientes
- Facturas parcialmente pagadas

**Flujo de Caja:**
- Total de facturas
- Total de pagos recibidos
- Saldo pendiente de cobro

**Egresos:**
- Total de egresos
- Cantidad de transacciones
- Egreso promedio

### Filtros Disponibles
- **Mes:** Seleccionar mes específico
- **Año:** Seleccionar año específico
- **Botón Actualizar:** Recargar datos

---

## 🏥 REPORTE CLÍNICO

### Ubicación
Dashboard → Reportes → Reporte Clínico

### Indicadores Clave (KPIs)

#### 1. Citas Realizadas
- **Definición:** Total de citas en el período
- **Ejemplo:** 15 citas

#### 2. Pacientes Atendidos
- **Definición:** Cantidad de pacientes únicos atendidos
- **Ejemplo:** 8 pacientes

#### 3. Tasa de Asistencia
- **Definición:** Porcentaje de citas completadas
- **Fórmula:** (Citas Completadas / Total Citas) × 100
- **Ejemplo:** 86.7%

#### 4. Procedimientos Realizados
- **Definición:** Total de procedimientos ejecutados
- **Ejemplo:** 22 procedimientos

### Secciones del Reporte

#### A. Citas por Estado
Gráfico de barras mostrando:
- Programadas
- Confirmadas
- En curso
- Completadas
- Canceladas
- No asistió

**Datos mostrados:**
- Cantidad por estado
- Porcentaje del total

#### B. Tratamientos por Estado
Gráfico de pastel mostrando:
- Planificados
- En progreso
- Pausados
- Completados
- Cancelados

**Datos mostrados:**
- Cantidad por estado
- Costo total
- Costo promedio

#### C. Top Procedimientos Realizados
Tabla ordenada por frecuencia:
- Nombre del procedimiento
- Cantidad realizada
- Porcentaje del total
- Barra de progreso visual

**Ejemplo:**
| Procedimiento | Cantidad | Porcentaje |
|---------------|----------|-----------|
| Obturación Compuesta | 8 | 36.4% |
| Limpieza Dental | 5 | 22.7% |
| Consulta General | 4 | 18.2% |
| Radiografía | 3 | 13.6% |
| Extracción | 2 | 9.1% |

#### D. Resumen Detallado

**Citas:**
- Total de citas
- Citas completadas
- Citas no asistidas
- Tasa de asistencia

**Tratamientos:**
- Tratamientos creados
- Costo total
- Costo promedio

**Procedimientos:**
- Total de procedimientos
- Costo total
- Costo promedio

---

## 📈 CARACTERÍSTICAS AVANZADAS

### 1. Filtrado por Período
- Seleccionar mes y año específicos
- Datos se actualizan automáticamente
- Histórico de 5 años disponible

### 2. Visualización de Datos
- **Gráficos de Pastel:** Distribución de estados
- **Gráficos de Barras:** Comparación de valores
- **Tablas:** Detalle de información
- **Barras de Progreso:** Porcentajes visuales

### 3. Exportación de Datos
- Datos listos para copiar
- Formato compatible con Excel
- Impresión optimizada

### 4. Análisis Comparativo
- Comparar períodos diferentes
- Identificar tendencias
- Detectar anomalías

---

## 🎯 CASOS DE USO

### Caso 1: Análisis de Rentabilidad
**Objetivo:** Determinar si el negocio es rentable

**Pasos:**
1. Ir a Reportes → Reporte Financiero
2. Seleccionar mes y año
3. Revisar KPI "Margen de Utilidad"
4. Si es > 20%, el negocio es rentable
5. Analizar "Top Pacientes" para identificar clientes clave

### Caso 2: Gestión de Cobranza
**Objetivo:** Identificar facturas pendientes de pago

**Pasos:**
1. Ir a Reportes → Reporte Financiero
2. Revisar sección "Facturas por Estado"
3. Identificar facturas "Pendientes"
4. Contactar pacientes para cobro
5. Registrar pagos en el sistema

### Caso 3: Análisis de Productividad Clínica
**Objetivo:** Evaluar desempeño clínico

**Pasos:**
1. Ir a Reportes → Reporte Clínico
2. Revisar "Citas Realizadas" y "Tasa de Asistencia"
3. Analizar "Top Procedimientos"
4. Identificar procedimientos más comunes
5. Planificar capacitación si es necesario

### Caso 4: Planificación de Recursos
**Objetivo:** Determinar necesidades de inventario

**Pasos:**
1. Ir a Reportes → Reporte Clínico
2. Revisar "Top Procedimientos"
3. Identificar materiales más utilizados
4. Planificar compras de inventario
5. Evitar desabastecimiento

---

## 📊 INTERPRETACIÓN DE DATOS

### Indicadores Positivos
✅ Margen de Utilidad > 20%
✅ Tasa de Asistencia > 80%
✅ Crecimiento de ingresos mes a mes
✅ Reducción de facturas pendientes
✅ Aumento de pacientes atendidos

### Indicadores de Alerta
⚠️ Margen de Utilidad < 10%
⚠️ Tasa de Asistencia < 70%
⚠️ Aumento de egresos sin justificación
⚠️ Facturas pendientes > 30% del total
⚠️ Disminución de procedimientos realizados

---

## 🔧 CONFIGURACIÓN

### Período de Reporte
- **Mes:** 1-12
- **Año:** Últimos 5 años disponibles
- **Actualización:** Automática al cambiar filtros

### Precisión de Datos
- Todos los cálculos son en tiempo real
- Datos se actualizan cada vez que se carga la página
- Precisión: 2 decimales para moneda

---

## 📝 NOTAS IMPORTANTES

1. **Datos Históricos:** Los reportes incluyen datos desde la creación del registro
2. **Precisión:** Todos los cálculos son automáticos y precisos
3. **Privacidad:** Solo usuarios autenticados pueden ver reportes
4. **Actualización:** Los datos se actualizan en tiempo real
5. **Exportación:** Los datos pueden copiarse para análisis externo

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: Los datos no se actualizan
**Solución:**
1. Haz clic en "Actualizar"
2. Recarga la página (F5)
3. Verifica que haya datos en el período seleccionado

### Problema: Gráficos no se muestran
**Solución:**
1. Verifica que JavaScript esté habilitado
2. Intenta en otro navegador
3. Limpia el caché del navegador

### Problema: Números no coinciden
**Solución:**
1. Verifica el período seleccionado
2. Comprueba que los datos estén completos
3. Contacta al administrador

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
