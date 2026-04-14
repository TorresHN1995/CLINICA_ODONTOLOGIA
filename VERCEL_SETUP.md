# Guía de Setup en Vercel - Clínica Odontológica

## Problema Actual
- ✗ Login no funciona en Vercel
- ✗ Credenciales incorrectas muestran error (debería ser silencioso)
- ✗ Base de datos no es accesible desde Vercel

## Soluciones

### 1. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Settings → Environment Variables
3. Agrega estas variables:

```
DATABASE_URL=mysql://usuario:contraseña@srv650.hstgr.io:3306/clinica_odontologica
NEXTAUTH_SECRET=<genera-uno-seguro-con-openssl>
NEXTAUTH_URL=https://tu-dominio-vercel.app
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Verificar Conectividad a la Base de Datos

**Desde tu máquina local:**
```bash
mysql -h srv650.hstgr.io -u usuario -p clinica_odontologica
```

Si no funciona:
- ✗ La BD no está corriendo
- ✗ Las credenciales son incorrectas
- ✗ El firewall bloquea la conexión

**Soluciones:**
1. Contacta a tu proveedor de hosting
2. Verifica que el servidor MySQL esté activo
3. Abre el puerto 3306 en el firewall

### 3. Problema: Credenciales Incorrectas Muestran Error

**Causa:** El error de autenticación se está exponiendo en el cliente

**Solución:** Modificar `lib/auth.ts` para no exponer errores:

```typescript
async authorize(credentials) {
  if (!credentials?.username || !credentials?.password) {
    return null  // No lanzar error, retornar null
  }

  const usuario = await prisma.usuario.findUnique({
    where: { username: credentials.username }
  })

  if (!usuario || !usuario.activo) {
    return null  // No lanzar error, retornar null
  }

  const passwordValida = await bcrypt.compare(
    credentials.password,
    usuario.password
  )

  if (!passwordValida) {
    return null  // No lanzar error, retornar null
  }

  return {
    id: usuario.id,
    email: usuario.email,
    name: `${usuario.nombre} ${usuario.apellido}`,
    role: usuario.rol,
  }
}
```

### 4. Checklist de Deployment en Vercel

- [ ] Variables de entorno configuradas
- [ ] DATABASE_URL apunta a la BD correcta
- [ ] NEXTAUTH_SECRET es un valor seguro
- [ ] NEXTAUTH_URL es el dominio de Vercel
- [ ] Base de datos es accesible desde Vercel
- [ ] Usuario admin existe en la BD
- [ ] Migraciones de Prisma se ejecutaron

### 5. Ejecutar Migraciones en Vercel

Después de configurar las variables, ejecuta en tu terminal local:

```bash
# Conectar a la BD remota
export DATABASE_URL="mysql://usuario:contraseña@srv650.hstgr.io:3306/clinica_odontologica"

# Ejecutar migraciones
npx prisma migrate deploy

# O si necesitas crear la BD desde cero
npx prisma db push
```

### 6. Crear Usuario Admin en Vercel

```bash
# Ejecutar el seed script
node seed-admin-user.js
```

Esto creará:
- Username: `admin`
- Password: `Admin123!`

### 7. Debugging en Vercel

**Ver logs en tiempo real:**
1. Ve a tu proyecto en Vercel
2. Deployments → Selecciona el deployment
3. Logs → Function Logs

**Buscar errores de autenticación:**
```
Error en login
Credenciales inválidas
Can't reach database
```

### 8. Alternativa: Usar Vercel Postgres

Si quieres evitar problemas de conectividad, considera usar Vercel Postgres:

1. Ve a Vercel → Storage → Create Database
2. Selecciona "Postgres"
3. Copia la `DATABASE_URL`
4. Ejecuta migraciones
5. Crea datos de prueba

**Ventajas:**
- ✅ Conectividad garantizada
- ✅ Backups automáticos
- ✅ Mejor rendimiento
- ✅ Soporte de Vercel

### 9. Troubleshooting

**Problema: "Can't reach database server"**
- Solución: Verifica que la BD esté corriendo y accesible

**Problema: "Credenciales inválidas" sin intentar login**
- Solución: Verifica que el usuario admin existe en la BD

**Problema: Login funciona localmente pero no en Vercel**
- Solución: Verifica que DATABASE_URL está configurada en Vercel

**Problema: Errores de sesión**
- Solución: Verifica que NEXTAUTH_SECRET y NEXTAUTH_URL están configuradas

## Contacto de Soporte

Si el problema persiste:
1. Verifica los logs de Vercel
2. Revisa que todas las variables de entorno estén configuradas
3. Contacta a tu proveedor de hosting de la BD
4. Abre un issue en GitHub con los logs de error
