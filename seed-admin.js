/**
 * Script para crear un usuario administrador inicial
 * Ejecutar: node seed-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando usuario administrador inicial...\n');

  try {
    // Verificar si ya existe un admin
    const adminExistente = await prisma.usuario.findFirst({
      where: { rol: 'ADMINISTRADOR' }
    });

    if (adminExistente) {
      console.log('✓ Ya existe un usuario administrador en la base de datos');
      console.log(`  Email: ${adminExistente.email}`);
      console.log(`  Username: ${adminExistente.username}`);
      return;
    }

    // Crear admin
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@clinica.com',
        username: 'admin',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        telefono: '50412345678',
        rol: 'ADMINISTRADOR',
        activo: true,
      },
    });

    console.log('✓ Usuario administrador creado exitosamente\n');
    console.log('📋 Credenciales:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Contraseña: Admin123!`);
    console.log(`   Rol: ${admin.rol}\n`);

    // Crear odontólogo de prueba
    const hashedPasswordOdontologo = await bcrypt.hash('Odontologo123!', 10);
    
    const odontologo = await prisma.usuario.create({
      data: {
        email: 'odontologo@clinica.com',
        username: 'odontologo',
        password: hashedPasswordOdontologo,
        nombre: 'Carlos',
        apellido: 'López',
        telefono: '50412345679',
        rol: 'ODONTOLOGO',
        activo: true,
      },
    });

    console.log('✓ Usuario odontólogo creado exitosamente\n');
    console.log('📋 Credenciales:');
    console.log(`   Email: ${odontologo.email}`);
    console.log(`   Username: ${odontologo.username}`);
    console.log(`   Contraseña: Odontologo123!`);
    console.log(`   Rol: ${odontologo.rol}\n`);

    // Crear recepcionista de prueba
    const hashedPasswordRecepcion = await bcrypt.hash('Recepcion123!', 10);
    
    const recepcion = await prisma.usuario.create({
      data: {
        email: 'recepcion@clinica.com',
        username: 'recepcion',
        password: hashedPasswordRecepcion,
        nombre: 'María',
        apellido: 'García',
        telefono: '50412345680',
        rol: 'RECEPCION',
        activo: true,
      },
    });

    console.log('✓ Usuario recepcionista creado exitosamente\n');
    console.log('📋 Credenciales:');
    console.log(`   Email: ${recepcion.email}`);
    console.log(`   Username: ${recepcion.username}`);
    console.log(`   Contraseña: Recepcion123!`);
    console.log(`   Rol: ${recepcion.rol}\n`);

    console.log('✅ Seed completado exitosamente');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
