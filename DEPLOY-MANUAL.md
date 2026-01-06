# 🚀 Desplegar Manualmente en Vercel

## Opción 1: Desde el Dashboard de Vercel (Más Rápido)

### Paso 1: Ir al Proyecto
1. Ve a: https://vercel.com/dashboard
2. Busca tu proyecto `CLINICA_ODONTOLOGIA`
3. Si no existe, ve al Paso 2

### Paso 2: Si el Proyecto No Existe
1. Click en **"Add New..."** → **"Project"**
2. Selecciona **"Import Git Repository"**
3. Conecta GitHub si no está conectado
4. Selecciona: `TorresHN1995/CLINICA_ODONTOLOGIA`
5. Click en **"Import"**

### Paso 3: Configurar el Proyecto
1. **Framework Preset:** Next.js (debe detectarse automáticamente)
2. **Root Directory:** `./` (dejar por defecto)
3. **Build Command:** `prisma generate && next build`
4. **Output Directory:** `.next` (dejar por defecto)
5. **Install Command:** `npm install` (dejar por defecto)

### Paso 4: Configurar Variables de Entorno
Antes de hacer deploy, agrega estas variables:

1. Click en **"Environment Variables"**
2. Agrega cada una:

```
NEXTAUTH_URL
Valor: https://clinica-odontologia-ix3j.vercel.app
Entornos: Production, Preview, Development (marcar todos)
```

```
NEXTAUTH_SECRET
Valor: (el secret que generaste)
Entornos: Production, Preview, Development (marcar todos)
```

```
DATABASE_URL
Valor: mysql://u670007821_odontologo:%2F%7Eg5%244t%40L@srv650.hstgr.io:3306/u670007821_clinica_odonto
Entornos: Production, Preview, Development (marcar todos)
```

### Paso 5: Deploy
1. Click en **"Deploy"**
2. Espera a que termine el build
3. Si hay errores, revísalos y corrígelos

## Opción 2: Desde la Página de Deployments

Si el proyecto ya existe:

1. Ve a tu proyecto en Vercel
2. Click en **"Deployments"**
3. Click en **"..."** (tres puntos) del último deployment
4. Selecciona **"Redeploy"**
5. O click en **"Add New..."** → **"Deploy"**

## Opción 3: Usar Vercel CLI

Si prefieres usar la línea de comandos:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# En el directorio del proyecto
cd "E:\CLINICA ODONTOLOGIA"

# Deploy
vercel --prod
```

## Verificar el Deploy

Después del deploy:

1. Ve a la pestaña **"Deployments"**
2. Espera a que el estado sea **"Ready"** (verde)
3. Click en el deployment para ver la URL
4. Prueba acceder a: `https://clinica-odontologia-ix3j.vercel.app`

## Si Hay Errores en el Build

1. Click en el deployment fallido
2. Revisa los **"Build Logs"**
3. Busca errores en rojo
4. Los errores comunes son:
   - Variables de entorno faltantes
   - Errores de TypeScript
   - Errores de Prisma
   - Problemas de conexión a la base de datos

## Solución Rápida: Crear Proyecto Nuevo

Si el proyecto actual tiene problemas:

1. Ve a: https://vercel.com/new
2. Importa `TorresHN1995/CLINICA_ODONTOLOGIA`
3. Configura todo desde cero
4. Esto recreará los webhooks automáticamente

