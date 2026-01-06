# 🔧 Solución: Error de Acceso Denegado en Hostinger

## ❌ Error que estás viendo:
```
Error: P1010: User was denied access on the database `clinica_odontologica`
```

## 🔍 Causas Posibles:

1. **La base de datos no existe** - Debes crearla primero
2. **El usuario no tiene permisos** - Necesitas otorgar permisos explícitos
3. **El usuario no puede acceder desde fuera** - Hostinger puede restringir conexiones externas

## ✅ Solución Paso a Paso:

### Paso 1: Verificar/Crear la Base de Datos

1. **Accede a phpMyAdmin en Hostinger**
2. **Crea la base de datos:**
   - Click en "Nueva" o "Create Database"
   - Nombre: `clinica_odontologica`
   - Codificación: `utf8mb4_unicode_ci`
   - Click en "Crear"

   O ejecuta este SQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS clinica_odontologica 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```

### Paso 2: Otorgar Permisos al Usuario

**IMPORTANTE:** En Hostinger, el usuario `u670007821_odontologo` puede que ya exista pero no tenga permisos en la nueva base de datos.

Ejecuta este SQL en phpMyAdmin:

```sql
-- Otorgar TODOS los privilegios
GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'u670007821_odontologo'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;
```

### Paso 3: Verificar Permisos

Ejecuta este SQL para verificar:

```sql
SHOW GRANTS FOR 'u670007821_odontologo'@'%';
```

Deberías ver algo como:
```
GRANT ALL PRIVILEGES ON `clinica_odontologica`.* TO `u670007821_odontologo`@`%`
```

### Paso 4: Verificar la Conexión

Prueba conectarte desde phpMyAdmin:
1. Selecciona la base de datos `clinica_odontologica`
2. Si puedes verla y acceder, los permisos están bien

### Paso 5: Reintentar Prisma

Después de otorgar permisos, ejecuta:

```bash
npx prisma generate
npx prisma db push
```

## 🔐 Alternativa: Usar el Usuario Principal

Si el usuario `u670007821_odontologo` no puede tener permisos, puedes:

1. **Usar el usuario principal de Hostinger** (si tienes acceso)
2. **Crear un nuevo usuario específico** para esta base de datos

### Crear Nuevo Usuario (si es posible):

```sql
-- Crear usuario nuevo
CREATE USER 'clinica_user'@'%' IDENTIFIED BY 'tu_contraseña_segura';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'clinica_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

Luego actualiza tu DATABASE_URL:
```
mysql://clinica_user:tu_contraseña@srv650.hstgr.io:3306/clinica_odontologica
```

## 🌐 Problema: Conexiones Externas en Hostinger

Hostinger puede restringir conexiones externas. Verifica:

1. **En el panel de Hostinger:**
   - Ve a "MySQL Databases" o "Remote MySQL"
   - Asegúrate de que las conexiones remotas estén permitidas
   - Puede que necesites agregar tu IP a la lista blanca

2. **Si estás desplegando en Vercel:**
   - Vercel usa IPs dinámicas
   - Puede que necesites permitir conexiones desde cualquier IP (`%`)
   - O contactar a Hostinger para habilitar conexiones remotas

## 🔄 Verificar la URL de Conexión

Asegúrate de que tu `.env` tenga exactamente:

```env
DATABASE_URL="mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/clinica_odontologica"
```

**Verifica:**
- ✅ El usuario es correcto: `u670007821_odontologo`
- ✅ La contraseña está codificada: `%2F%7Eg5%244t%40L`
- ✅ El servidor es correcto: `srv650.hstgr.io`
- ✅ El puerto es: `3306`
- ✅ El nombre de la BD es: `clinica_odontologica`

## 🧪 Probar Conexión Manualmente

Puedes probar la conexión con este comando (si tienes MySQL client):

```bash
mysql -h srv650.hstgr.io -u u670007821_odontologo -p clinica_odontologica
```

O usa una herramienta como MySQL Workbench o DBeaver para probar la conexión.

## 📞 Si Nada Funciona

1. **Contacta el soporte de Hostinger:**
   - Pregunta si el usuario `u670007821_odontologo` puede tener permisos en nuevas bases de datos
   - Pregunta sobre restricciones de conexiones remotas
   - Pregunta si necesitas un plan específico para conexiones externas

2. **Alternativa: Usar base de datos en la nube:**
   - PlanetScale (gratis)
   - Railway (gratis)
   - Render (gratis)
   - Estos servicios están diseñados para aplicaciones en la nube

## ✅ Checklist de Verificación

- [ ] Base de datos `clinica_odontologica` existe en Hostinger
- [ ] Permisos otorgados al usuario con `GRANT ALL PRIVILEGES`
- [ ] `FLUSH PRIVILEGES` ejecutado
- [ ] Permisos verificados con `SHOW GRANTS`
- [ ] Conexión probada desde phpMyAdmin
- [ ] DATABASE_URL correcta en `.env`
- [ ] Conexiones remotas habilitadas (si aplica)
- [ ] Reintentado `npx prisma db push`

## 🎯 Solución Rápida (Resumen)

1. Crea la BD en phpMyAdmin
2. Ejecuta: `GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'u670007821_odontologo'@'%';`
3. Ejecuta: `FLUSH PRIVILEGES;`
4. Reintenta: `npx prisma db push`

