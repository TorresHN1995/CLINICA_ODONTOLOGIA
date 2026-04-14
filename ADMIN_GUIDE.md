# Guía de Administración - Sistema de Gestión Dental

## 🔐 Acceso a Administración

Solo los usuarios con rol **ADMINISTRADOR** pueden acceder a las funciones de administración.

### Credenciales por Defecto:
- **Usuario:** `admin`
- **Contraseña:** `Admin123!`

---

## 📋 Funciones de Administración

### 1. Exportar Base de Datos

**Ubicación:** Dashboard → Administración → Exportar Base de Datos

**Descripción:**
Descarga un backup completo de toda la base de datos en formato JSON. Incluye:
- Usuarios
- Pacientes
- Citas
- Expedientes
- Tratamientos
- Facturas
- Pagos
- Ingresos
- Egresos
- Inventario
- Documentos

**Cómo usar:**
1. Inicia sesión como administrador
2. Ve a Dashboard → Administración
3. Haz clic en "Descargar Backup"
4. El archivo se descargará automáticamente con el nombre: `clinica-backup-YYYY-MM-DD.json`

**Formato del archivo:**
```json
{
  "exportDate": "2026-04-14T...",
  "summary": {
    "usuarios": 5,
    "pacientes": 10,
    ...
  },
  "data": {
    "usuarios": [...],
    "pacientes": [...],
    ...
  }
}
```

---

### 2. Limpiar Base de Datos

**Ubicación:** Dashboard → Administración → Limpiar Base de Datos

**Descripción:**
Elimina todos los datos de la base de datos. Esta acción es **IRREVERSIBLE**.

**⚠️ ADVERTENCIA:**
- Esta acción eliminará permanentemente todos los datos
- Se recomienda hacer un backup antes de limpiar
- No se puede deshacer

**Cómo usar:**
1. Inicia sesión como administrador
2. Ve a Dashboard → Administración
3. Haz clic en "Limpiar Base de Datos"
4. Se abrirá un modal de confirmación
5. Escribe exactamente: `LIMPIAR_BASE_DE_DATOS`
6. Haz clic en "Confirmar"

---

## 🛠️ Scripts de Administración

### Reset Completo de Base de Datos

**Comando:**
```bash
node reset-database.js
```

**Qué hace:**
1. Limpia toda la base de datos
2. Regenera datos de prueba completos
3. Crea 5 pacientes
4. Crea 3 odontólogos
5. Crea 10 productos/servicios
6. Crea 9 items de inventario
7. Crea 5 expedientes clínicos
8. Crea 5 citas
9. Crea 5 planes de tratamiento
10. Crea 28 facturas con diferentes estados
11. Registra pagos e ingresos automáticamente

**Tiempo estimado:** 10-15 segundos

---

### Seed de Datos Completos

**Comando:**
```bash
node seed-complete.js
```

**Qué hace:**
- Crea usuarios (admin, odontólogos, recepcionistas)
- Crea pacientes
- Crea productos y servicios
- Crea inventario
- Crea expedientes clínicos
- Crea citas
- Crea planes de tratamiento
- Crea facturas básicas
- Crea egresos

---

### Seed de Facturas Completas

**Comando:**
```bash
node seed-facturas-completas.js
```

**Qué hace:**
- Crea 5 facturas con múltiples items
- Registra pagos automáticamente
- Crea ingresos asociados
- Genera diferentes estados de pago

---

### Seed de Facturas Adicionales

**Comando:**
```bash
node seed-facturas-adicionales.js
```

**Qué hace:**
- Crea 3 facturas con múltiples servicios
- Crea 2 facturas de tratamientos complejos
- Crea 3 facturas pendientes
- Crea 2 facturas con pagos parciales

---

## 📊 Estadísticas de Datos

Después de ejecutar `reset-database.js`, tendrás:

### Usuarios
- 1 Administrador
- 3 Odontólogos
- 1 Recepcionista

### Pacientes
- 5 pacientes con historial médico completo

### Facturas
- 28 facturas totales
- 10 facturas pagadas
- 7 facturas pagadas parcialmente
- 11 facturas pendientes

### Ingresos
- L. 18,847.26 en ingresos registrados

### Métodos de Pago
- Efectivo: 13 facturas
- Tarjeta de Crédito: 5 facturas
- Transferencia: 4 facturas
- Tarjeta de Débito: 4 facturas

---

## 🔒 Seguridad

### Protecciones Implementadas:

1. **Autenticación:**
   - Solo administradores pueden acceder
   - Validación de sesión en cada operación

2. **Confirmación:**
   - Requiere confirmación de texto para limpiar
   - Previene eliminaciones accidentales

3. **Backup:**
   - Se recomienda exportar antes de limpiar
   - Los backups se guardan localmente

4. **Auditoría:**
   - Todas las operaciones se registran en logs
   - Se puede rastrear quién hizo qué y cuándo

---

## 📝 Mejores Prácticas

### Antes de Limpiar:
1. ✅ Exporta la base de datos actual
2. ✅ Guarda el archivo en un lugar seguro
3. ✅ Verifica que no haya operaciones en curso
4. ✅ Notifica a otros usuarios

### Después de Limpiar:
1. ✅ Regenera datos de prueba si es necesario
2. ✅ Verifica que todo funcione correctamente
3. ✅ Documenta el cambio

### Backup Regular:
1. ✅ Exporta la base de datos semanalmente
2. ✅ Guarda en múltiples ubicaciones
3. ✅ Verifica la integridad de los backups

---

## 🆘 Solución de Problemas

### Error: "No autorizado"
- Verifica que estés logueado como administrador
- Comprueba que tu rol sea ADMINISTRADOR

### Error: "Confirmación inválida"
- Asegúrate de escribir exactamente: `LIMPIAR_BASE_DE_DATOS`
- Verifica que no haya espacios adicionales

### Error: "Error al exportar"
- Verifica que haya espacio en disco
- Comprueba la conexión a la base de datos
- Intenta nuevamente

### La base de datos no se limpia
- Verifica que no haya conexiones activas
- Intenta desde una ventana de incógnito
- Reinicia el servidor

---

## 📞 Soporte

Para reportar problemas o sugerencias:
1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Contacta al equipo de desarrollo

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
