# 🔍 Verificar NEXTAUTH_URL en Vercel

## ⚠️ Problema Común

Si el login no redirige después de iniciar sesión, puede ser que `NEXTAUTH_URL` no esté configurado correctamente.

## 📋 Pasos para Verificar

### 1. Obtener la URL Correcta de tu Proyecto

En Vercel, hay dos tipos de URLs:

#### URL de Producción (Principal)
- Ve a tu proyecto en Vercel
- En la página principal verás: `https://clinica-odontologia-ix3j.vercel.app`
- **Esta es la URL que debes usar para `NEXTAUTH_URL`**

#### URLs de Preview (Temporales)
- Las URLs como `https://clinica-odontologia-ix3j-c5eop5jex-torreshns-projects-cafd1759.vercel.app`
- Son URLs temporales para cada deployment
- **NO uses estas para `NEXTAUTH_URL`**

### 2. Configurar NEXTAUTH_URL Correctamente

1. **Ve a tu proyecto en Vercel**
2. **Settings → Environment Variables**
3. **Busca `NEXTAUTH_URL`**
4. **Debe ser exactamente:**
   ```
   https://clinica-odontologia-ix3j.vercel.app
   ```
   - ✅ Con `https://`
   - ✅ Sin trailing slash (`/`)
   - ✅ Sin rutas adicionales
   - ✅ URL de producción, NO de preview

### 3. Si Usas Dominio Personalizado

Si tienes un dominio personalizado configurado:
```
NEXTAUTH_URL=https://tudominio.com
```

### 4. Verificar Otras Variables

Asegúrate de tener también:
```
NEXTAUTH_SECRET=tu-secret-generado
DATABASE_URL=tu-url-de-base-de-datos
```

### 5. Reiniciar el Deployment

Después de cambiar las variables:
1. Ve a **Deployments**
2. Click en los **3 puntos** del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine

## 🧪 Probar el Login

1. Ve a: `https://clinica-odontologia-ix3j.vercel.app/login`
2. Inicia sesión con: `admin` / `admin123`
3. Debería redirigir a `/dashboard`

## 🐛 Si Aún No Funciona

### Verificar en la Consola del Navegador

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Console**
3. Intenta hacer login
4. Busca errores relacionados con:
   - Cookies
   - NextAuth
   - CORS
   - Session

### Verificar Cookies

1. En DevTools, ve a **Application** → **Cookies**
2. Busca cookies que empiecen con `next-auth`
3. Deberías ver:
   - `next-auth.session-token`
   - O `__Secure-next-auth.session-token` (en HTTPS)

### Verificar Logs en Vercel

1. Ve a **Deployments** → Último deployment
2. Click en **Functions**
3. Busca errores en los logs de `/api/auth/[...nextauth]`

## ✅ Checklist

- [ ] `NEXTAUTH_URL` está configurado con la URL de producción
- [ ] `NEXTAUTH_URL` no tiene trailing slash
- [ ] `NEXTAUTH_SECRET` está configurado
- [ ] `DATABASE_URL` está configurado correctamente
- [ ] Se hizo redeploy después de cambiar las variables
- [ ] Las cookies se están estableciendo en el navegador
- [ ] No hay errores en la consola del navegador

## 📝 Nota Importante

Si cambias `NEXTAUTH_URL`, **debes hacer un redeploy** para que los cambios surtan efecto.

