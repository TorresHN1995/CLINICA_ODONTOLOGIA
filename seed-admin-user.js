/**
 * Script para crear un usuario administrador de prueba
 * Ejecutar: node seed-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔐 Creando usuario administrador de prueba...');

    // Verificar si el usuario ya existe
    const existente = await prisma.usuario.findUnique({
      where: { username: 'admin' }
    });

    if (existente) {
      console.log('✅ Usuario admin ya existe');
      console.log('   Username: admin');
      console.log('   Password: Admin123!');
      return;
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const usuario = await prisma.usuario.create({
      data: {
        email: 'admin@clinica.com',
        username: 'admin',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        telefono: '50412345678',
        rol: 'ADMINISTRADOR',
        activo: true,
      }
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('   ID:', usuario.id);
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('   Email: admin@clinica.com');
    console.log('   Rol: ADMINISTRADOR');
    console.log('\n📝 Usa estas credenciales para iniciar sesión');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
