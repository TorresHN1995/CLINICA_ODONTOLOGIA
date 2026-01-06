-- Script SQL para crear la base de datos en Hostinger
-- Ejecuta este script en phpMyAdmin o en la consola de MySQL de Hostinger

-- Crear la base de datos con codificación UTF-8
CREATE DATABASE IF NOT EXISTS clinica_odontologica 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Opcional: Crear un usuario específico para la aplicación (recomendado)
-- Reemplaza 'tu_usuario' y 'tu_contraseña' con valores seguros
CREATE USER IF NOT EXISTS 'tu_usuario'@'%' IDENTIFIED BY 'tu_contraseña_segura';

-- Otorgar permisos al usuario
GRANT ALL PRIVILEGES ON clinica_odontologica.* TO 'tu_usuario'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;

-- Verificar que la base de datos se creó
SHOW DATABASES LIKE 'clinica_odontologica';

