# 🗄️ Configuración de Base de Datos en Hostinger

## Paso 1: Crear la Base de Datos en Hostinger

### Opción A: Usando phpMyAdmin (Más fácil)

1. **Accede a tu panel de Hostinger:**
   - Ve a tu panel de control de Hostinger
   - Busca "phpMyAdmin" o "MySQL Databases"

2. **Crea la base de datos:**
   - Click en "Crear base de datos" o "Create Database"
   - Nombre: `clinica_odontologica`
   - Codificación: `utf8mb4_unicode_ci` (importante para caracteres especiales)
   - Click en "Crear"

3. **Crea un usuario (opcional pero recomendado):**
   - Nombre de usuario: elige uno (ej: `clinica_user`)
   - Contraseña: genera una contraseña segura
   - Asigna todos los privilegios a la base de datos `clinica_odontologica`

### Opción B: Usando SQL directo

1. Abre phpMyAdmin
2. Ve a la pestaña "SQL"
3. Ejecuta este comando:

```sql
CREATE DATABASE IF NOT EXISTS clinica_odontologica 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

## Paso 2: Obtener los Datos de Conexión

En Hostinger, necesitarás:

- **Host:** Generalmente `localhost` o algo como `mysql.hostinger.com` o `tu-dominio.mysql.database.azure.com`
- **Puerto:** `3306` (puerto estándar de MySQL)
- **Nombre de BD:** `clinica_odontologica`
- **Usuario:** El usuario que creaste o el usuario principal
- **Contraseña:** La contraseña que configuraste

## Paso 3: Configurar la URL de Conexión

La URL de conexión de MySQL tiene este formato:

```
mysql://usuario:contraseña@host:puerto/nombre_base_datos
```

**Ejemplo:**
```
mysql://clinica_user:MiPassword123@localhost:3306/clinica_odontologica
```

### ⚠️ Importante: Caracteres Especiales en la Contraseña

Si tu contraseña tiene caracteres especiales, debes codificarlos en URL:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- ` ` (espacio) → `%20`

**Ejemplo con caracteres especiales:**
```
Contraseña original: P@ssw0rd#123
URL codificada: mysql://usuario:P%40ssw0rd%23123@localhost:3306/clinica_odontologica
```

## Paso 4: Configurar en tu Proyecto

### Localmente (.env)

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="mysql://usuario:contraseña@host:puerto/clinica_odontologica"
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"
```

### En Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `DATABASE_URL` = tu URL de Hostinger
   - `NEXTAUTH_SECRET` = tu secret
   - `NEXTAUTH_URL` = https://tu-dominio.vercel.app

## Paso 5: Crear las Tablas con Prisma

**¡NO necesitas crear las tablas manualmente!** Prisma lo hace automáticamente.

### Opción A: Prisma DB Push (Desarrollo)

```bash
# Genera el cliente de Prisma
npx prisma generate

# Crea todas las tablas automáticamente basándose en schema.prisma
npx prisma db push
```

### Opción B: Prisma Migrate (Producción - Recomendado)

```bash
# Crear la primera migración
npx prisma migrate dev --name init

# En producción, aplicar migraciones
npx prisma migrate deploy
```

## Paso 6: Verificar la Conexión

```bash
# Abre Prisma Studio para ver tus datos
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver todas tus tablas.

## Paso 7: Poblar Datos Iniciales (Opcional)

Si quieres datos de prueba:

```bash
npx ts-node scripts/seed.ts
```

## 🔍 Verificar que Todo Funciona

1. **Prueba la conexión:**
```bash
npx prisma db pull
```

2. **Ver las tablas creadas:**
```bash
npx prisma studio
```

3. **Verificar en phpMyAdmin:**
   - Ve a phpMyAdmin
   - Selecciona la base de datos `clinica_odontologica`
   - Deberías ver todas las tablas creadas por Prisma

## ⚠️ Problemas Comunes

### Error: "Access denied for user"
- Verifica que el usuario y contraseña sean correctos
- Asegúrate de que el usuario tenga permisos en la base de datos
- Verifica que el host sea correcto (puede no ser `localhost` en Hostinger)

### Error: "Can't connect to MySQL server"
- Verifica que el host y puerto sean correctos
- En Hostinger, el host puede ser diferente a `localhost`
- Verifica que MySQL esté activo en tu plan de Hostinger

### Error: "Unknown database"
- Asegúrate de haber creado la base de datos primero
- Verifica que el nombre de la base de datos en la URL sea correcto

### Caracteres especiales en contraseña
- Usa un codificador de URL online: https://www.urlencoder.org/
- O cambia la contraseña a una sin caracteres especiales

## 📝 Resumen de Comandos

```bash
# 1. Configurar .env con DATABASE_URL de Hostinger
# 2. Generar cliente Prisma
npx prisma generate

# 3. Crear tablas automáticamente
npx prisma db push

# 4. (Opcional) Poblar datos de prueba
npx ts-node scripts/seed.ts

# 5. Verificar con Prisma Studio
npx prisma studio
```

## 🎉 ¡Listo!

Tu base de datos estará configurada y lista para usar. Prisma creará automáticamente todas las tablas basándose en tu `schema.prisma`.

