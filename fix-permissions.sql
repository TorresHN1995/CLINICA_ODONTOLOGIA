-- Script SQL para otorgar permisos al usuario en Hostinger
-- Ejecuta esto en phpMyAdmin después de crear la base de datos

-- Base de datos: TU_BD
-- Asegúrate de que la base de datos existe (ya está creada)

-- Otorgar TODOS los privilegios al usuario en la base de datos
GRANT ALL PRIVILEGES ON TU_BD.* TO 'TU_USUARIO'@'%';

-- Si el usuario no existe, créalo primero (puede que ya exista)
-- CREATE USER IF NOT EXISTS 'TU_USUARIO'@'%' IDENTIFIED BY 'TU_CONTRASENA';

-- Aplicar los cambios
FLUSH PRIVILEGES;

-- Verificar los permisos
SHOW GRANTS FOR 'TU_USUARIO'@'%';

-- Verificar que puedes acceder a la base de datos
USE TU_BD;
SHOW TABLES;

