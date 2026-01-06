# ✅ Configuración Final - Base de Datos Hostinger

## 📋 Información de Conexión

- **Usuario:** (tu_usuario_mysql)
- **Contraseña:** (tu_contraseña_mysql)
- **Servidor:** (tu_host_mysql)
- **Puerto:** 3306
- **Base de Datos:** (tu_base_de_datos) ✅

## 🔗 URL de Conexión Correcta

Tu `DATABASE_URL` debe ser:

```env
DATABASE_URL="mysql://USUARIO:CONTRASENA_URL_ENCODED@HOST:3306/NOMBRE_BD"
```

## 📝 Configuración del Archivo .env

Actualiza tu archivo `.env` con:

```env
# Base de datos MySQL en Hostinger
DATABASE_URL="mysql://USUARIO:CONTRASENA_URL_ENCODED@HOST:3306/NOMBRE_BD"

# NextAuth
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"
```

## ✅ Verificar Permisos

Asegúrate de que el usuario tenga permisos. Ejecuta en phpMyAdmin:

```sql
-- Otorgar permisos
GRANT ALL PRIVILEGES ON TU_BD.* TO 'TU_USUARIO'@'%';
FLUSH PRIVILEGES;

-- Verificar
SHOW GRANTS FOR 'TU_USUARIO'@'%';
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
DATABASE_URL="mysql://USUARIO:CONTRASENA_URL_ENCODED@HOST:3306/NOMBRE_BD"
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
```

