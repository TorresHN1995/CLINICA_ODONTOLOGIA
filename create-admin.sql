-- Script SQL para crear usuario administrador en Hostinger
-- Ejecuta este script en phpMyAdmin

-- Insertar usuario administrador
-- La contraseña 'admin123' está hasheada con bcrypt

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
)
ON DUPLICATE KEY UPDATE email = email;

-- Verificar que se creó
SELECT id, email, username, nombre, apellido, rol, activo 
FROM usuarios 
WHERE email = 'admin@clinica.com' OR username = 'admin';

