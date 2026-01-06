# 🚀 Guía Rápida de Despliegue

## Opción Más Rápida: Vercel + PlanetScale

### 1️⃣ Preparar el Proyecto (5 minutos)

```bash
# Si no tienes Git inicializado
git init
git add .
git commit -m "Preparado para despliegue"

# Sube a GitHub (crea un repositorio primero)
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### 2️⃣ Crear Base de Datos en PlanetScale (5 minutos)

1. Ve a https://planetscale.com y crea cuenta gratuita
2. Click en "Create database"
3. Elige "Free" plan
4. Copia la URL de conexión (se verá como: `mysql://...`)

### 3️⃣ Desplegar en Vercel (5 minutos)

1. Ve a https://vercel.com y crea cuenta con GitHub
2. Click en "Add New Project"
3. Selecciona tu repositorio
4. En "Environment Variables", agrega:

```
DATABASE_URL=tu-url-de-planetscale
NEXTAUTH_SECRET=ejecuta: openssl rand -base64 32
NEXTAUTH_URL=https://tu-proyecto.vercel.app
```

5. Click en "Deploy"

### 4️⃣ Configurar Base de Datos (2 minutos)

Después del despliegue, ejecuta:

```bash
# Instala Vercel CLI
npm i -g vercel

# Conecta tu proyecto
vercel link

# Ejecuta migraciones
npx prisma db push
```

### 5️⃣ ¡Listo! 🎉

Tu aplicación estará en: `https://tu-proyecto.vercel.app`

---

## Generar NEXTAUTH_SECRET

En Windows PowerShell:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})))
```

O usa esta herramienta online: https://generate-secret.vercel.app/32

---

## ¿Problemas?

Consulta el archivo `DESPLIEGUE.md` para una guía más detallada.

