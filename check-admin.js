const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.usuario.findUnique({
      where: { username: 'admin' }
    });

    if (!admin) {
      console.log('❌ Usuario admin no existe');
      return;
    }

    console.log('✓ Usuario admin encontrado:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Nombre: ${admin.nombre} ${admin.apellido}`);
    console.log(`  Rol: ${admin.rol}`);
    console.log(`  Activo: ${admin.activo}`);
    console.log(`  Password hash: ${admin.password.substring(0, 20)}...`);

    // Verificar contraseña
    const passwordValida = await bcrypt.compare('Admin123!', admin.password);
    console.log(`  Contraseña válida: ${passwordValida}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
