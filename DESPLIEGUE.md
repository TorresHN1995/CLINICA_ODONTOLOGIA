# 🚀 Guía de Despliegue - Sistema de Clínica Odontológica

Esta guía te ayudará a subir tu proyecto a un hosting gratuito. Te mostraremos las mejores opciones disponibles.

## 📋 Opciones de Hosting Gratuito

### 1. **Vercel** (Recomendado para Next.js) ⭐
- ✅ Gratis para siempre
- ✅ Despliegue automático desde GitHub
- ✅ Optimizado para Next.js
- ✅ SSL automático
- ✅ CDN global
- ⚠️ Necesitas base de datos externa (MySQL)

### 2. **Railway**
- ✅ Plan gratuito disponible
- ✅ Soporta MySQL directamente
- ✅ Despliegue fácil
- ⚠️ Límites en el plan gratuito

### 3. **Render**
- ✅ Plan gratuito disponible
- ✅ Soporta bases de datos
- ⚠️ Puede "dormir" después de inactividad

---

## 🎯 Opción 1: Desplegar en Vercel (Recomendado)

### Paso 1: Preparar el Proyecto

1. **Asegúrate de tener Git inicializado:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Crea un repositorio en GitHub:**
   - Ve a [GitHub](https://github.com)
   - Crea un nuevo repositorio
   - Sigue las instrucciones para conectar tu repositorio local

### Paso 2: Configurar Base de Datos en la Nube

Necesitas una base de datos MySQL en la nube. Opciones gratuitas:

#### Opción A: PlanetScale (Recomendado)
1. Ve a [PlanetScale](https://planetscale.com)
2. Crea una cuenta gratuita
3. Crea una nueva base de datos
4. Copia la URL de conexión (DATABASE_URL)

#### Opción B: Railway
1. Ve a [Railway](https://railway.app)
2. Crea una cuenta
3. Crea un nuevo proyecto → Add MySQL
4. Copia la URL de conexión

#### Opción C: Render
1. Ve a [Render](https://render.com)
2. Crea una cuenta
3. Crea una nueva base de datos MySQL
4. Copia la URL de conexión

### Paso 3: Desplegar en Vercel

1. **Ve a [Vercel](https://vercel.com)**
   - Crea una cuenta (puedes usar GitHub)

2. **Importa tu proyecto:**
   - Click en "Add New Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente que es Next.js

3. **Configura las Variables de Entorno:**
   En la sección "Environment Variables", agrega:
   ```
   DATABASE_URL=tu-url-de-base-de-datos-mysql
   NEXTAUTH_SECRET=genera-un-secret-aleatorio
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   ```

   Para generar NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Configura el Build:**
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`
   - Output Directory: `.next` (automático)

5. **Despliega:**
   - Click en "Deploy"
   - Espera a que termine el despliegue

### Paso 4: Configurar Prisma en Producción

Después del despliegue, necesitas ejecutar las migraciones:

1. **Opción A: Desde Vercel CLI (Recomendado)**
```bash
npm i -g vercel
vercel login
vercel link
npx prisma db push
```

2. **Opción B: Desde tu máquina local**
```bash
# Configura la DATABASE_URL de producción
export DATABASE_URL="tu-url-de-produccion"
npx prisma db push
```

3. **Opción C: Usar Prisma Migrate (Mejor práctica)**
```bash
# Crear migración
npx prisma migrate dev --name init

# Aplicar en producción
npx prisma migrate deploy
```

### Paso 5: Ejecutar Seed (Opcional)

Si quieres datos de prueba:
```bash
# Configura DATABASE_URL de producción
export DATABASE_URL="tu-url-de-produccion"
npx ts-node scripts/seed.ts
```

---

## 🎯 Opción 2: Desplegar en Railway (Todo en uno)

Railway puede hostear tanto tu aplicación como la base de datos.

### Paso 1: Crear cuenta en Railway
1. Ve a [Railway](https://railway.app)
2. Crea una cuenta con GitHub

### Paso 2: Crear Base de Datos
1. Click en "New Project"
2. Selecciona "Add MySQL"
3. Railway creará automáticamente la base de datos
4. Copia la URL de conexión (DATABASE_URL)

### Paso 3: Desplegar la Aplicación
1. En el mismo proyecto, click en "New" → "GitHub Repo"
2. Selecciona tu repositorio
3. Railway detectará Next.js automáticamente

### Paso 4: Configurar Variables de Entorno
En la configuración del servicio, agrega:
```
DATABASE_URL=la-url-que-copiaste-del-mysql
NEXTAUTH_SECRET=genera-un-secret
NEXTAUTH_URL=https://tu-proyecto.railway.app
```

### Paso 5: Configurar Build
En "Settings" → "Build Command":
```
prisma generate && next build
```

### Paso 6: Ejecutar Migraciones
Usa Railway CLI o ejecuta desde tu terminal:
```bash
railway run npx prisma db push
```

---

## 🎯 Opción 3: Desplegar en Render

### Paso 1: Crear cuenta
1. Ve a [Render](https://render.com)
2. Crea una cuenta

### Paso 2: Crear Base de Datos MySQL
1. Dashboard → "New" → "PostgreSQL" (o MySQL si está disponible)
2. Configura y crea la base de datos
3. Copia la URL de conexión

### Paso 3: Desplegar Aplicación
1. "New" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build Command:** `prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

### Paso 4: Variables de Entorno
Agrega las mismas variables que en Vercel

---

## 🔧 Configuración Post-Despliegue

### 1. Actualizar NEXTAUTH_URL
Asegúrate de que `NEXTAUTH_URL` apunte a tu dominio de producción:
```
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

### 2. Configurar Dominio Personalizado (Opcional)
- En Vercel: Settings → Domains
- Agrega tu dominio personalizado
- Actualiza `NEXTAUTH_URL` con el nuevo dominio

### 3. Verificar Base de Datos
```bash
npx prisma studio
# O usa la herramienta de tu proveedor de BD
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Prisma Client not generated"
**Solución:** Agrega `prisma generate` al build command:
```
prisma generate && next build
```

### Error: "Database connection failed"
**Solución:** 
- Verifica que la URL de la base de datos sea correcta
- Asegúrate de que la base de datos permita conexiones externas
- Verifica el firewall de tu proveedor de BD

### Error: "NEXTAUTH_SECRET is missing"
**Solución:** Genera y agrega el secret:
```bash
openssl rand -base64 32
```

### Error: "Build timeout"
**Solución:** 
- Optimiza el build eliminando dependencias innecesarias
- Considera usar `prisma generate` en un script separado

### La aplicación funciona pero no carga datos
**Solución:** 
- Verifica que las migraciones se hayan ejecutado
- Ejecuta `npx prisma db push` o `npx prisma migrate deploy`

---

## 📝 Checklist de Despliegue

- [ ] Proyecto subido a GitHub
- [ ] Base de datos MySQL creada en la nube
- [ ] Variables de entorno configuradas
- [ ] NEXTAUTH_SECRET generado y configurado
- [ ] NEXTAUTH_URL apunta a la URL de producción
- [ ] Migraciones de Prisma ejecutadas
- [ ] Build exitoso
- [ ] Aplicación accesible en la URL de producción
- [ ] Login funciona correctamente
- [ ] Base de datos conectada y funcionando

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en producción. Si tienes problemas, revisa los logs en tu plataforma de hosting.

### URLs Útiles:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Render Dashboard:** https://dashboard.render.com

---

## 💡 Consejos Adicionales

1. **Monitoreo:** Considera usar servicios como Sentry para monitorear errores
2. **Backups:** Configura backups automáticos de tu base de datos
3. **Performance:** Usa Vercel Analytics para monitorear el rendimiento
4. **Seguridad:** Nunca subas archivos `.env` a GitHub
5. **Actualizaciones:** Configura despliegues automáticos desde la rama `main`

---

**¿Necesitas ayuda?** Revisa la documentación oficial:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)

