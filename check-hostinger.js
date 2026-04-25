require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const usuarios = await prisma.usuario.findMany({
    select: { username: true, nombre: true, rol: true, activo: true }
  });
  
  console.log('\nUsuarios en BD:');
  usuarios.forEach(u => console.log(` - ${u.username} | ${u.nombre} | ${u.rol} | activo: ${u.activo}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
