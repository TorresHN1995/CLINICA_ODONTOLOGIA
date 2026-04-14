const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.usuario.update({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    });

    console.log('✓ Contraseña actualizada para admin');
    console.log(`  Username: ${admin.username}`);
    console.log(`  Nueva contraseña: Admin123!`);

    // Verificar
    const passwordValida = await bcrypt.compare('Admin123!', admin.password);
    console.log(`  Verificación: ${passwordValida ? '✓ Válida' : '✗ Inválida'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
