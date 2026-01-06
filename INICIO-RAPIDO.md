# ⚡ Inicio Rápido - Clínica Odontológica

Esta guía te ayudará a tener el sistema funcionando en **menos de 10 minutos**.

## 🎯 Pasos Rápidos

### 1️⃣ Instalar Dependencias (2 min)

```bash
npm install
```

### 2️⃣ Configurar Base de Datos MySQL (3 min)

Opción A - **MySQL ya instalado:**
```bash
# Conectarse a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE clinica_odontologica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Opción B - **Usar XAMPP/WAMP:**
1. Iniciar XAMPP
2. Abrir phpMyAdmin (http://localhost/phpmyadmin)
3. Crear base de datos: `clinica_odontologica`

### 3️⃣ Configurar Variables de Entorno (1 min)

El archivo `.env` ya está configurado con valores por defecto. Si tu MySQL usa credenciales diferentes, edita `.env`:

```env
# Si tu MySQL requiere contraseña:
DATABASE_URL="mysql://root:tu_contraseña@localhost:3306/clinica_odontologica"

# Si no requiere contraseña (por defecto):
DATABASE_URL="mysql://root@localhost:3306/clinica_odontologica"
```

### 4️⃣ Inicializar Base de Datos (2 min)

```bash
# Generar cliente de Prisma y crear tablas
npx prisma generate
npx prisma db push

# Cargar datos de ejemplo
npx ts-node scripts/seed.ts
```

### 5️⃣ Iniciar la Aplicación (1 min)

```bash
npm run dev
```

### 6️⃣ Acceder al Sistema (1 min)

1. Abre tu navegador en: **http://localhost:3000**
2. Inicia sesión con:
   - **Usuario:** admin@clinica.com
   - **Contraseña:** admin123

## ✅ ¡Listo! El sistema está funcionando

Ahora puedes explorar:

### 📋 Módulos Disponibles
- ✅ **Dashboard** - Estadísticas y resumen
- ✅ **Pacientes** - Gestión completa de pacientes
- ✅ **Citas** - Agenda interactiva
- ✅ **Expedientes** - Con odontograma digital
- ✅ **Tratamientos** - Planes y seguimiento
- ✅ **Facturación** - Facturas y pagos
- ✅ **Inventario** - Control de materiales
- ✅ **Reportes** - Estadísticas y análisis

### 👥 Usuarios de Prueba

**Administrador:**
- Email: admin@clinica.com
- Contraseña: admin123
- Acceso: Total al sistema

**Odontólogo:**
- Email: dra.garcia@clinica.com
- Contraseña: odontologo123
- Acceso: Gestión clínica

**Recepción:**
- Email: recepcion@clinica.com
- Contraseña: odontologo123
- Acceso: Citas y pacientes

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor

# Base de datos
npx prisma studio             # Ver datos en navegador
npx prisma db push            # Actualizar esquema

# Producción
npm run build                 # Compilar
npm start                     # Iniciar compilado
```

## 🐛 Problemas Comunes

### MySQL no conecta:
```bash
# Verificar que MySQL esté corriendo
# Windows: Abrir XAMPP y verificar que MySQL esté iniciado
# Mac: brew services list | grep mysql
# Linux: sudo systemctl status mysql
```

### Puerto 3000 ocupado:
```bash
npm run dev -- -p 3001  # Usar puerto 3001
```

### Error "Cannot find module":
```bash
rm -rf node_modules
npm install
```

### Regenerar base de datos:
```bash
npx prisma db push --force-reset
npx ts-node scripts/seed.ts
```

## 📚 Documentación Completa

- **README.md** - Documentación completa del proyecto
- **INSTALACION.md** - Guía detallada de instalación
- **Este archivo** - Inicio rápido

## 🎓 Próximos Pasos

1. **Explorar el Dashboard** - Familiarízate con la interfaz
2. **Crear un Paciente** - Ve a Pacientes > Nuevo Paciente
3. **Agendar una Cita** - Ve a Citas > Nueva Cita
4. **Crear Expediente** - Ve a Expedientes > Nuevo Expediente
5. **Probar el Odontograma** - Dentro de un expediente
6. **Emitir una Factura** - Ve a Facturación > Nueva Factura

## 💡 Tips

- **Usa Prisma Studio** para ver/editar datos fácilmente: `npx prisma studio`
- **Explora los roles** cerrando sesión e iniciando con diferentes usuarios
- **Revisa el código** en `/app/dashboard` para entender la estructura
- **Personaliza** colores en `tailwind.config.js`

## 🎉 ¡Disfruta del Sistema!

El sistema está completamente funcional con:
- ✅ 8+ módulos implementados
- ✅ Odontograma interactivo
- ✅ Sistema de roles y permisos
- ✅ Diseño profesional y responsivo
- ✅ Base de datos con datos de ejemplo
- ✅ Listo para producción

---

**¿Necesitas ayuda?** Revisa INSTALACION.md o README.md para más detalles.

