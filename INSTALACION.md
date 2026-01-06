# 📖 Guía de Instalación Detallada

Esta guía te llevará paso a paso por la instalación del Sistema de Gestión para Clínica Odontológica.

## 📋 Requisitos del Sistema

### Software Requerido

1. **Node.js** (versión 18 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **MySQL** (versión 8 o superior)
   - Descargar desde: https://dev.mysql.com/downloads/mysql/
   - O usar XAMPP/WAMP/MAMP que incluye MySQL

3. **Git** (opcional pero recomendado)
   - Descargar desde: https://git-scm.com/

### Requisitos de Hardware

- **RAM:** Mínimo 4GB (recomendado 8GB)
- **Espacio en Disco:** 500MB para el proyecto + 1GB para dependencias
- **Procesador:** Cualquier procesador moderno de 2 núcleos

## 🔧 Instalación Paso a Paso

### Paso 1: Instalar Node.js

#### Windows:
1. Descargar el instalador desde https://nodejs.org/
2. Ejecutar el instalador y seguir las instrucciones
3. Reiniciar la computadora si es necesario
4. Verificar instalación:
```bash
node --version
npm --version
```

#### macOS:
```bash
# Usando Homebrew
brew install node

# Verificar instalación
node --version
npm --version
```

#### Linux (Ubuntu/Debian):
```bash
# Actualizar paquetes
sudo apt update

# Instalar Node.js
sudo apt install nodejs npm

# Verificar instalación
node --version
npm --version
```

### Paso 2: Instalar MySQL

#### Windows (usando XAMPP):
1. Descargar XAMPP desde https://www.apachefriends.org/
2. Instalar XAMPP
3. Abrir el Panel de Control de XAMPP
4. Iniciar el módulo MySQL
5. Acceder a phpMyAdmin en http://localhost/phpmyadmin

#### macOS:
```bash
# Usando Homebrew
brew install mysql

# Iniciar MySQL
brew services start mysql

# Configurar MySQL (opcional)
mysql_secure_installation
```

#### Linux (Ubuntu/Debian):
```bash
# Instalar MySQL
sudo apt install mysql-server

# Iniciar MySQL
sudo systemctl start mysql

# Configurar MySQL
sudo mysql_secure_installation
```

### Paso 3: Configurar MySQL

1. **Acceder a MySQL:**
```bash
mysql -u root -p
```

2. **Crear la base de datos:**
```sql
CREATE DATABASE clinica_odontologica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Crear un usuario (recomendado para producción):**
```sql
CREATE USER 'clinica_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'clinica_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 4: Descargar el Proyecto

#### Opción A: Usando Git (recomendado)
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd CLINICA-ODONTOLOGIA
```

#### Opción B: Descarga Manual
1. Descargar el archivo ZIP del proyecto
2. Extraer en la ubicación deseada
3. Abrir terminal en la carpeta del proyecto

### Paso 5: Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install

# Esto puede tardar varios minutos
```

Si encuentras errores, intenta:
```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules
npm install
```

### Paso 6: Configurar Variables de Entorno

1. **Copiar el archivo de ejemplo:**
```bash
cp .env.example .env
```

2. **Editar el archivo .env:**

Abre el archivo `.env` con tu editor de texto favorito y configura:

```env
# Base de datos MySQL
DATABASE_URL="mysql://clinica_user:tu_contraseña_segura@localhost:3306/clinica_odontologica"

# NextAuth - Genera un secret aleatorio
NEXTAUTH_SECRET="reemplaza-esto-con-un-secret-aleatorio-muy-largo"
NEXTAUTH_URL="http://localhost:3000"

# Configuración de Email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-contraseña-de-aplicacion"
EMAIL_FROM="noreply@clinica.com"
```

3. **Generar NEXTAUTH_SECRET:**

En Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

En macOS/Linux:
```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `NEXTAUTH_SECRET`

### Paso 7: Configurar Prisma y la Base de Datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas en la base de datos
npx prisma db push

# Verificar que todo esté correcto (opcional)
npx prisma studio
```

El último comando abrirá Prisma Studio en tu navegador donde podrás ver las tablas creadas.

### Paso 8: Poblar la Base de Datos

```bash
# Ejecutar el script de seed
npx ts-node scripts/seed.ts
```

Este script creará:
- Usuarios de prueba (admin, odontólogos, recepción)
- Pacientes de ejemplo
- Citas de ejemplo
- Expedientes y tratamientos
- Facturas de ejemplo
- Inventario inicial

### Paso 9: Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Deberías ver un mensaje como:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X ms
```

### Paso 10: Acceder al Sistema

1. Abre tu navegador
2. Ve a `http://localhost:3000`
3. Serás redirigido a la página de login
4. Usa las credenciales de prueba:
   - **Email:** admin@clinica.com
   - **Contraseña:** admin123

## ✅ Verificación de Instalación

### Checklist de Verificación:

- [ ] Node.js instalado (verificar con `node --version`)
- [ ] MySQL instalado y corriendo
- [ ] Base de datos `clinica_odontologica` creada
- [ ] Dependencias instaladas (`node_modules` existe)
- [ ] Archivo `.env` configurado correctamente
- [ ] Prisma configurado (`npx prisma generate` exitoso)
- [ ] Tablas creadas en la base de datos
- [ ] Seed ejecutado correctamente
- [ ] Servidor corriendo en http://localhost:3000
- [ ] Login exitoso con credenciales de prueba

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to MySQL server"

**Solución:**
```bash
# Verificar que MySQL esté corriendo
# Windows (XAMPP): Abrir panel de control y verificar que MySQL esté iniciado
# macOS:
brew services list | grep mysql
# Linux:
sudo systemctl status mysql

# Verificar credenciales en .env
# Asegúrate de que usuario, contraseña y puerto sean correctos
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Opción 1: Usar otro puerto
npm run dev -- -p 3001

# Opción 2: Cerrar el proceso que usa el puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <numero-pid> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

### Error: "Module not found"

**Solución:**
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# O usar npm ci (más rápido)
npm ci
```

### Error al ejecutar seed: "Cannot find module 'ts-node'"

**Solución:**
```bash
# Instalar ts-node globalmente
npm install -g ts-node

# O usar npx
npx ts-node scripts/seed.ts
```

### Error: "Prisma Client is not generated"

**Solución:**
```bash
# Generar el cliente de Prisma
npx prisma generate

# Si persiste, limpiar y regenerar
rm -rf node_modules/.prisma
npx prisma generate
```

### Error de permisos en MySQL

**Solución:**
```sql
-- Conectarse a MySQL como root
mysql -u root -p

-- Otorgar todos los privilegios al usuario
GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'clinica_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🔐 Configuración de Email (Opcional)

### Usando Gmail:

1. **Habilitar autenticación de 2 factores en Gmail**
2. **Generar contraseña de aplicación:**
   - Ve a https://myaccount.google.com/security
   - Busca "Contraseñas de aplicaciones"
   - Genera una nueva contraseña
   - Copia la contraseña generada

3. **Configurar en .env:**
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="contraseña-de-aplicacion-generada"
EMAIL_FROM="tu-email@gmail.com"
```

## 🚀 Despliegue en Producción

### Requisitos Adicionales:
- Servidor con Node.js
- MySQL en servidor o servicio cloud (AWS RDS, Google Cloud SQL, etc.)
- Dominio personalizado

### Pasos:

1. **Compilar el proyecto:**
```bash
npm run build
```

2. **Configurar variables de entorno de producción:**
```env
DATABASE_URL="mysql://usuario:contraseña@host-produccion:3306/clinica_odontologica"
NEXTAUTH_URL="https://tudominio.com"
NEXTAUTH_SECRET="secret-super-seguro-para-produccion"
```

3. **Iniciar en modo producción:**
```bash
npm start
```

### Servicios de Hosting Recomendados:
- **Vercel:** Hosting optimizado para Next.js
- **Railway:** Base de datos y aplicación en un solo lugar
- **DigitalOcean:** VPS con control total
- **AWS:** Para aplicaciones enterprise

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de MySQL](https://dev.mysql.com/doc/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

## 💬 Soporte

Si encuentras problemas durante la instalación:
1. Revisa esta guía cuidadosamente
2. Verifica los logs de error
3. Consulta la sección de solución de problemas
4. Abre un issue en el repositorio con detalles del error

---

**¡Felicidades! Tu sistema de gestión odontológica está listo para usar. 🎉**

