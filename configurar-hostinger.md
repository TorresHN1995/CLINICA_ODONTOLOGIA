# 🔧 Configuración para Hostinger - Paso a Paso

## ✅ Credenciales Configuradas

- **Usuario:** u670007821_odontologo
- **Servidor:** srv650.hstgr.io
- **Puerto:** 3306 (puerto estándar MySQL)
- **Base de datos:** clinica_odontologica (debes crearla primero)

## 📝 Paso 1: Crear la Base de Datos en Hostinger

### Opción A: Desde phpMyAdmin

1. Accede a phpMyAdmin en tu panel de Hostinger
2. Click en "Nueva" o "Create Database"
3. Nombre: `clinica_odontologica`
4. Codificación: `utf8mb4_unicode_ci`
5. Click en "Crear"

### Opción B: Desde SQL

Ejecuta este SQL en phpMyAdmin:

```sql
CREATE DATABASE IF NOT EXISTS clinica_odontologica 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

## 📝 Paso 2: Configurar el Archivo .env

Crea o edita el archivo `.env` en la raíz de tu proyecto con estos valores:

```env
# Base de datos MySQL en Hostinger
DATABASE_URL="mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/clinica_odontologica"

# NextAuth - Genera un secret seguro
NEXTAUTH_SECRET="tu-secret-generado-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 🔐 Generar NEXTAUTH_SECRET

En Windows PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}) | ConvertTo-Base64
```

O usa esta herramienta online: https://generate-secret.vercel.app/32

## 📝 Paso 3: Probar la Conexión

Ejecuta estos comandos en tu terminal:

```bash
# 1. Generar el cliente de Prisma
npx prisma generate

# 2. Crear todas las tablas automáticamente
npx prisma db push

# 3. (Opcional) Verificar con Prisma Studio
npx prisma studio
```

## 📝 Paso 4: Poblar Datos Iniciales (Opcional)

Si quieres datos de prueba:

```bash
npx ts-node scripts/seed.ts
```

## ✅ Verificar que Funciona

1. **Prueba la conexión:**
```bash
npx prisma db pull
```

2. **Abre Prisma Studio:**
```bash
npx prisma studio
```
Se abrirá en `http://localhost:5555` y podrás ver todas tus tablas.

3. **Verifica en phpMyAdmin:**
   - Ve a phpMyAdmin
   - Selecciona `clinica_odontologica`
   - Deberías ver todas las tablas creadas

## 🚀 Para Producción (Vercel)

Cuando despliegues en Vercel, agrega estas variables de entorno:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `DATABASE_URL` = `mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/clinica_odontologica`
   - `NEXTAUTH_SECRET` = (el mismo que generaste)
   - `NEXTAUTH_URL` = `https://tu-proyecto.vercel.app`

## ⚠️ Nota sobre la Contraseña

La contraseña `/~g5$4t@L` tiene caracteres especiales que fueron codificados en la URL:
- `/` → `%2F`
- `~` → `%7E`
- `$` → `%24`
- `@` → `%40`

Por eso la URL usa: `%2F%7Eg5%244t%40L`

## 🐛 Solución de Problemas

### Error: "Access denied"
- Verifica que el usuario tenga permisos en la base de datos
- Asegúrate de que la base de datos `clinica_odontologica` exista

### Error: "Can't connect to MySQL server"
- Verifica que el servidor `srv650.hstgr.io` sea correcto
- Verifica que el puerto sea `3306`
- Algunos planes de Hostinger requieren conexiones desde IPs específicas

### Error: "Unknown database"
- Asegúrate de haber creado la base de datos primero
- Verifica que el nombre sea exactamente `clinica_odontologica`

## 📋 Checklist

- [ ] Base de datos `clinica_odontologica` creada en Hostinger
- [ ] Archivo `.env` configurado con DATABASE_URL
- [ ] NEXTAUTH_SECRET generado y configurado
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado exitosamente
- [ ] Tablas creadas verificadas en phpMyAdmin o Prisma Studio
- [ ] (Opcional) Datos de prueba cargados con seed

## 🎉 ¡Listo!

Tu base de datos estará configurada y lista para usar.

