require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const inv = await p.inventario.findMany({ select: { codigo: true, nombre: true } });
  const srv = await p.productoServicio.findMany({ select: { codigo: true, nombre: true } });
  console.log('INVENTARIO:', inv.map(i => i.codigo).join(', '));
  console.log('\nSERVICIOS:', srv.map(s => s.codigo).join(', '));
}
main().finally(() => p.$disconnect());
