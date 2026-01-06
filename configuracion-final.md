# ✅ Configuración Final - Base de Datos Hostinger

## 📋 Información de Conexión

- **Usuario:** u670007821_odontologo
- **Contraseña:** /~g5$4t@L
- **Servidor:** srv650.hstgr.io
- **Puerto:** 3306
- **Base de Datos:** u670007821_clinica_odonto ✅

## 🔗 URL de Conexión Correcta

Tu `DATABASE_URL` debe ser:

```env
DATABASE_URL="mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/u670007821_clinica_odonto"
```

## 📝 Configuración del Archivo .env

Actualiza tu archivo `.env` con:

```env
# Base de datos MySQL en Hostinger
DATABASE_URL="mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/u670007821_clinica_odonto"

# NextAuth
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"
```

## ✅ Verificar Permisos

Asegúrate de que el usuario tenga permisos. Ejecuta en phpMyAdmin:

```sql
-- Otorgar permisos
GRANT ALL PRIVILEGES ON u670007821_clinica_odonto.* TO 'u670007821_odontologo'@'%';
FLUSH PRIVILEGES;

-- Verificar
SHOW GRANTS FOR 'u670007821_odontologo'@'%';
```

## 🚀 Crear las Tablas

Ahora ejecuta:

```bash
npx prisma generate
npx prisma db push
```

## 🎯 Para Vercel (Producción)

Cuando despliegues, usa la misma URL pero actualiza NEXTAUTH_URL:

```env
DATABASE_URL="mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/u670007821_clinica_odonto"
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
```

