require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const existe = await prisma.usuario.findUnique({ where: { username: 'lester' } });
  if (existe) {
    console.log('El usuario lester ya existe');
    return;
  }
  const hash = await bcrypt.hash('Lester123!', 10);
  const user = await prisma.usuario.create({
    data: {
      email: 'lester@clinica.com',
      username: 'lester',
      password: hash,
      nombre: 'Lester',
      apellido: 'Invitado',
      rol: 'ADMINISTRADOR',
      activo: true,
    }
  });
  console.log('Usuario creado:', user.username, '-', user.rol);
}

main().catch(console.error).finally(() => prisma.$disconnect());
