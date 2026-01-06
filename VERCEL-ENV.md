# ✅ Variables de entorno correctas para Vercel (NextAuth + Prisma)

## Importante
- **No subas `.env` a GitHub**.
- Configura estas variables en **Vercel → Project → Settings → Environment Variables**.
- Marca cada variable para los entornos que correspondan (**Production** y también **Preview** si vas a usar previews).

---

## 1) Variables obligatorias

### `DATABASE_URL`
Formato:
```
mysql://USUARIO:CONTRASENA_URL_ENCODED@HOST:3306/NOMBRE_BD
```

### `NEXTAUTH_SECRET`
Debe ser **la misma** siempre (no la cambies, o las sesiones se “rompen”):
```
NEXTAUTH_SECRET=un_secret_largo_y_aleatorio
```

---

## 2) `NEXTAUTH_URL` (esto es lo que más causa “me logueo y vuelve a /login”)

### Recomendación (más estable)
- **Configura `NEXTAUTH_URL` SOLO para Production** con tu dominio estable:
```
NEXTAUTH_URL=https://tu-app.vercel.app
```
- Y **entra siempre por esa URL de producción**, no por una URL de preview.

### Si necesitas usar Preview
En previews el dominio cambia en cada deployment, por eso **es muy fácil romper NextAuth**.

La solución práctica es:
- Mantener `NEXTAUTH_SECRET` y `DATABASE_URL` en Preview (obligatorio)
- Y **no depender de `NEXTAUTH_URL` en Preview** (si tu app funciona sin él)

---

## 3) Checklist rápido cuando “se queda en /login”

1. En Vercel, confirma que `NEXTAUTH_SECRET` está cargado en **Production** (y **Preview** si usas previews).
2. Confirma que `DATABASE_URL` está cargado en **Production** (y Preview si aplica).
3. Si usas `NEXTAUTH_URL`, que sea el dominio real por el que estás entrando.
4. Después de cambiar variables, haz **Redeploy**.


