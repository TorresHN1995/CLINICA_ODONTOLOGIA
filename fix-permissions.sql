-- Script SQL para otorgar permisos al usuario en Hostinger
-- Ejecuta esto en phpMyAdmin después de crear la base de datos

-- Base de datos: u670007821_clinica_odonto
-- Asegúrate de que la base de datos existe (ya está creada)

-- Otorgar TODOS los privilegios al usuario en la base de datos
GRANT ALL PRIVILEGES ON u670007821_clinica_odonto.* TO 'u670007821_odontologo'@'%';

-- Si el usuario no existe, créalo primero (puede que ya exista)
-- CREATE USER IF NOT EXISTS 'u670007821_odontologo'@'%' IDENTIFIED BY '/~g5$4t@L';

-- Aplicar los cambios
FLUSH PRIVILEGES;

-- Verificar los permisos
SHOW GRANTS FOR 'u670007821_odontologo'@'%';

-- Verificar que puedes acceder a la base de datos
USE u670007821_clinica_odonto;
SHOW TABLES;

