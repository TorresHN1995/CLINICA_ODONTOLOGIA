# 🦷 Sistema de Gestión para Clínica Odontológica

Sistema completo de gestión para clínica odontológica desarrollado con **Next.js 14**, **React**, **TypeScript**, **Prisma** y **MySQL**.

## ✨ Características Principales

### 📋 Módulos Implementados

1. **👥 Gestión de Pacientes**
   - Registro completo con historial médico y odontológico
   - Gestión de alergias, medicamentos y enfermedades crónicas
   - Contactos de emergencia
   - Búsqueda y filtrado avanzado

2. **📅 Agenda y Citas**
   - Calendario interactivo con vista semanal
   - Programación, edición y cancelación de citas
   - Gestión de estados (Programada, En Curso, Completada, Cancelada)
   - Diferentes tipos de procedimientos con duraciones personalizadas
   - Vista por odontólogo

3. **🦷 Expediente Clínico**
   - Odontograma interactivo digital
   - Registro de diagnósticos y tratamientos
   - Evolución del tratamiento
   - Adjuntar imágenes y documentos
   - Historial completo por paciente

4. **💰 Facturación y Pagos**
   - Emisión de facturas con numeración automática
   - Gestión de items y servicios
   - Cálculo automático de impuestos y descuentos
   - Registro de pagos parciales y totales
   - Control de saldos pendientes
   - Múltiples métodos de pago

5. **🏥 Gestión de Tratamientos**
   - Planes de tratamiento con etapas
   - Seguimiento del progreso
   - Costos por etapa y total
   - Estados de tratamiento
   - Alertas de tratamientos pendientes

6. **📊 Reportería y Estadísticas**
   - Dashboard con métricas clave
   - Pacientes nuevos por período
   - Servicios más demandados
   - Ingresos por mes
   - Análisis de citas (completadas, canceladas)
   - Exportación de reportes

7. **📦 Control de Inventario**
   - Gestión de materiales e insumos
   - Alertas de bajo stock
   - Categorización de productos
   - Registro de movimientos

8. **👤 Gestión de Usuarios y Roles**
   - Roles: Administrador, Odontólogo, Asistente, Recepción
   - Autenticación segura con NextAuth
   - Permisos específicos por rol

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide Icons

- **Backend:**
  - Next.js API Routes
  - Prisma ORM
  - NextAuth.js (Autenticación)

- **Base de Datos:**
  - MySQL

- **Librerías Adicionales:**
  - React Hook Form (Formularios)
  - Zod (Validación)
  - date-fns (Manejo de fechas)
  - React Hot Toast (Notificaciones)
  - TanStack Query (Gestión de estado)

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- MySQL 8+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-repositorio>
cd CLINICA-ODONTOLOGIA
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**

Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
# Base de datos MySQL
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/clinica_odontologica"

# NextAuth
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-contraseña"
EMAIL_FROM="noreply@clinica.com"
```

Para generar un `NEXTAUTH_SECRET` seguro:
```bash
openssl rand -base64 32
```

4. **Crear la base de datos:**
```sql
CREATE DATABASE clinica_odontologica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Ejecutar las migraciones de Prisma:**
```bash
npx prisma generate
npx prisma db push
```

6. **Poblar la base de datos con datos de prueba:**
```bash
npx ts-node scripts/seed.ts
```

7. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Credenciales de Acceso

Después de ejecutar el seed, puedes usar estas credenciales:

### Administrador
- **Email:** admin@clinica.com
- **Contraseña:** admin123

### Odontólogo
- **Email:** dra.garcia@clinica.com
- **Contraseña:** odontologo123

### Recepción
- **Email:** recepcion@clinica.com
- **Contraseña:** odontologo123

## 📁 Estructura del Proyecto

```
CLINICA-ODONTOLOGIA/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── pacientes/            # Endpoints de pacientes
│   │   ├── citas/                # Endpoints de citas
│   │   ├── expedientes/          # Endpoints de expedientes
│   │   ├── tratamientos/         # Endpoints de tratamientos
│   │   ├── facturas/             # Endpoints de facturas
│   │   └── usuarios/             # Endpoints de usuarios
│   ├── dashboard/                # Páginas del dashboard
│   │   ├── pacientes/            # Módulo de pacientes
│   │   ├── citas/                # Módulo de citas
│   │   ├── expedientes/          # Módulo de expedientes
│   │   ├── tratamientos/         # Módulo de tratamientos
│   │   ├── facturacion/          # Módulo de facturación
│   │   ├── inventario/           # Módulo de inventario
│   │   └── reportes/             # Módulo de reportes
│   ├── login/                    # Página de login
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página de inicio
│   └── globals.css               # Estilos globales
├── components/                   # Componentes reutilizables
│   ├── layout/                   # Componentes de layout
│   │   ├── Sidebar.tsx           # Barra lateral
│   │   └── Header.tsx            # Encabezado
│   └── odontograma/              # Componentes del odontograma
│       └── Odontograma.tsx       # Odontograma interactivo
├── lib/                          # Librerías y utilidades
│   ├── prisma.ts                 # Cliente de Prisma
│   └── auth.ts                   # Configuración de autenticación
├── prisma/                       # Configuración de Prisma
│   └── schema.prisma             # Esquema de base de datos
├── scripts/                      # Scripts de utilidad
│   └── seed.ts                   # Script de seed
├── types/                        # Tipos de TypeScript
│   └── next-auth.d.ts            # Tipos de NextAuth
├── .env.example                  # Ejemplo de variables de entorno
├── package.json                  # Dependencias del proyecto
├── tailwind.config.js            # Configuración de Tailwind
├── tsconfig.json                 # Configuración de TypeScript
└── README.md                     # Este archivo
```

## 🎨 Características de UX/UI

- **Diseño Moderno y Responsivo:** Interfaz adaptable a cualquier dispositivo
- **Colores Profesionales:** Paleta de colores específica para sector salud
- **Navegación Intuitiva:** Sidebar con iconos y menú contextual
- **Feedback Visual:** Notificaciones toast para todas las acciones
- **Estados Visuales:** Indicadores de color para estados de citas, facturas, etc.
- **Animaciones Suaves:** Transiciones y animaciones para mejor experiencia
- **Accesibilidad:** Diseño pensado en accesibilidad web

## 🚀 Características Técnicas

### Seguridad
- Autenticación con JWT
- Hash de contraseñas con bcryptjs
- Validación de datos con Zod
- Protección de rutas con middleware
- Permisos basados en roles

### Performance
- Server Components de Next.js 14
- Lazy loading de componentes
- Optimización de imágenes
- Caché de consultas con TanStack Query
- Paginación en listados

### Base de Datos
- Esquema relacional completo
- Índices para optimización de consultas
- Soft deletes (eliminación lógica)
- Relaciones bien definidas
- Migraciones con Prisma

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor de desarrollo

# Prisma
npm run prisma:generate        # Generar cliente de Prisma
npm run prisma:push           # Sincronizar esquema con BD
npm run prisma:studio         # Abrir Prisma Studio

# Build
npm run build                 # Compilar para producción
npm run start                 # Iniciar servidor de producción

# Linting
npm run lint                  # Ejecutar ESLint
```

## 🔧 Configuración de Prisma Studio

Para visualizar y editar datos fácilmente:
```bash
npx prisma studio
```

Se abrirá en `http://localhost:5555`

## 📱 Módulos Adicionales Sugeridos

### Implementaciones Futuras:
- 📲 **Portal del Paciente:** Área donde el paciente puede ver su historial
- 📧 **Notificaciones Automáticas:** Email/WhatsApp para recordatorios
- 📄 **Generación de PDF:** Para facturas, recetas, consentimientos
- 📊 **Reportes Avanzados:** Exportación a Excel y PDF
- 🔔 **Sistema de Notificaciones:** Notificaciones en tiempo real
- 📸 **Gestión de Imágenes:** Subida y gestión de radiografías
- 🤖 **IA para Diagnóstico:** Sugerencias basadas en historial

## 🐛 Solución de Problemas

### Error de conexión a MySQL:
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/clinica_odontologica"
```

### Error de migraciones:
```bash
# Resetear la base de datos (¡cuidado en producción!)
npx prisma db push --force-reset

# Volver a ejecutar el seed
npx ts-node scripts/seed.ts
```

### Puerto 3000 ocupado:
```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3001"
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Desarrollo

Desarrollado como sistema completo de gestión para clínicas odontológicas.

### Características Destacadas:
- ✅ Sistema completo de autenticación y roles
- ✅ Gestión integral de pacientes
- ✅ Agenda con calendario interactivo
- ✅ Odontograma digital interactivo
- ✅ Sistema de facturación completo
- ✅ Control de tratamientos por etapas
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Reportería avanzada
- ✅ Control de inventario con alertas
- ✅ Diseño profesional y responsivo

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias sobre el sistema, por favor abre un issue en el repositorio.

---

**¡Disfruta del sistema de gestión para tu clínica odontológica! 🦷✨**

