# 🔐 Crear Usuario Administrador

## Problema
Las tablas se crearon pero no hay usuarios para acceder al sistema.

## Solución: Crear Usuario desde SQL

### Opción 1: Usando phpMyAdmin (Recomendado)

1. **Accede a phpMyAdmin en Hostinger**
2. **Selecciona la base de datos:** `u670007821_clinica_odonto`
3. **Ve a la pestaña "SQL"**
4. **Ejecuta este script:**

```sql
INSERT INTO usuarios (
  id,
  email,
  username,
  password,
  nombre,
  apellido,
  telefono,
  rol,
  activo,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'admin@clinica.com',
  'admin',
  '$2a$10$VeDu/L0yNAWjYElcIPnTZepwMfQCRSJvBU.UOjFNUkE1sHVnpC7Iu',
  'Admin',
  'Sistema',
  '555-0100',
  'ADMINISTRADOR',
  true,
  NOW(),
  NOW()
);
```

5. **Verifica que se creó:**

```sql
SELECT id, email, username, nombre, apellido, rol, activo 
FROM usuarios 
WHERE email = 'admin@clinica.com';
```

### Opción 2: Generar Hash de Contraseña Nuevo

Si quieres usar una contraseña diferente, necesitas generar el hash bcrypt. Puedes usar:

**Opción A: Online (temporal)**
- Ve a: https://bcrypt-generator.com/
- Ingresa tu contraseña
- Copia el hash generado

**Opción B: Desde Node.js**

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('tu_contraseña', 10).then(hash => console.log(hash));"
```

Luego usa ese hash en el INSERT.

## Credenciales por Defecto

Después de ejecutar el SQL, podrás acceder con:

- **Username:** `admin`
- **Contraseña:** `admin123`
- **Email:** `admin@clinica.com`

## ⚠️ IMPORTANTE

**Cambia la contraseña después del primer acceso** por seguridad.

## Si el INSERT falla

### Error: "Duplicate entry"
El usuario ya existe. Puedes:
1. Eliminarlo primero: `DELETE FROM usuarios WHERE email = 'admin@clinica.com';`
2. O actualizar la contraseña: `UPDATE usuarios SET password = '$2a$10$...' WHERE email = 'admin@clinica.com';`

### Error: "Column count doesn't match"
Verifica que todas las columnas existan. Ejecuta:
```sql
DESCRIBE usuarios;
```

Y ajusta el INSERT según las columnas que veas.

## Crear Más Usuarios

Puedes crear más usuarios cambiando los valores:

```sql
INSERT INTO usuarios (
  id, email, username, password, nombre, apellido, telefono, rol, activo, createdAt, updatedAt
) VALUES (
  UUID(),
  'odontologo@clinica.com',
  'odontologo',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  'Dr.',
  'Odontólogo',
  '555-0101',
  'ODONTOLOGO',
  true,
  NOW(),
  NOW()
);
```

Roles disponibles:
- `ADMINISTRADOR`
- `ODONTOLOGO`
- `ASISTENTE`
- `RECEPCION`

