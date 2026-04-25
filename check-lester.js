require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuario.findUnique({ where: { username: 'lester' } });
  if (!user) {
    console.log('❌ Usuario lester NO existe en la BD');
    return;
  }
  console.log('✓ Usuario encontrado:', user.username, '| Rol:', user.rol, '| Activo:', user.activo);
  console.log('  Hash guardado:', user.password);

  const ok = await bcrypt.compare('Lester123!', user.password);
  console.log('  Contraseña "Lester123!" válida:', ok);
}

main().catch(console.error).finally(() => prisma.$disconnect());
