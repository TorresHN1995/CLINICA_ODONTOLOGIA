# Guía de Deployment - Clínica Odontológica

## Problema Actual
La aplicación está intentando conectar a `srv650.hstgr.io:3306` pero no puede alcanzar la base de datos.

## Soluciones

### 1. Verificar Conectividad a la Base de Datos

```bash
# Desde tu máquina local
mysql -h srv650.hstgr.io -u root -p clinica_odontologica

# Si funciona, la BD está corriendo
# Si no funciona, contacta a tu proveedor de hosting
```

### 2. Configurar Variables de Entorno en Producción

Dependiendo de dónde esté desplegada la aplicación:

#### **Si está en Vercel:**
1. Ve a tu proyecto en vercel.com
2. Settings → Environment Variables
3. Agrega estas variables:
   ```
   DATABASE_URL=mysql://usuario:contraseña@srv650.hstgr.io:3306/clinica_odontologica
   NEXTAUTH_SECRET=<genera-uno-seguro>
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   ```

#### **Si está en Netlify:**
1. Ve a tu sitio en netlify.com
2. Site settings → Build & deploy → Environment
3. Agrega las mismas variables

#### **Si está en AWS Lambda/Amplify:**
1. Configura las variables en la consola de AWS
2. Asegúrate que el Lambda tiene acceso a la red donde está la BD

#### **Si está en un servidor propio:**
1. SSH al servidor
2. Edita el archivo `.env`:
   ```bash
   nano /ruta/a/app/.env
   ```
3. Agrega/actualiza:
   ```
   DATABASE_URL=mysql://usuario:contraseña@srv650.hstgr.io:3306/clinica_odontologica
   ```
4. Reinicia la aplicación

### 3. Verificar Credenciales de Base de Datos

Asegúrate que:
- ✅ Usuario y contraseña son correctos
- ✅ El host `srv650.hstgr.io` es accesible desde el servidor
- ✅ El puerto 3306 está abierto
- ✅ La base de datos `clinica_odontologica` existe

### 4. Generar NEXTAUTH_SECRET Seguro

```bash
# En tu terminal local
openssl rand -base64 32

# O usa Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Ejecutar Migraciones en Producción

Después de configurar las variables, ejecuta:

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# O si necesitas crear la BD desde cero
npx prisma db push
```

## Checklist de Deployment

- [ ] Base de datos está corriendo en `srv650.hstgr.io:3306`
- [ ] `DATABASE_URL` está configurada en variables de entorno
- [ ] `NEXTAUTH_SECRET` está configurado (valor seguro)
- [ ] `NEXTAUTH_URL` apunta al dominio correcto
- [ ] Migraciones de Prisma se ejecutaron
- [ ] Prueba la funcionalidad de citas en línea
- [ ] Verifica logs de error en el servidor

## Comandos Útiles

```bash
# Ver logs en tiempo real (si está en servidor propio)
tail -f /ruta/a/logs/app.log

# Reiniciar aplicación
pm2 restart clinica-odontologica

# Verificar estado
pm2 status

# Ver variables de entorno cargadas
echo $DATABASE_URL
```

## Contacto de Soporte

Si el problema persiste:
1. Verifica que `srv650.hstgr.io` esté corriendo
2. Contacta a tu proveedor de hosting
3. Revisa los logs de la aplicación para más detalles
