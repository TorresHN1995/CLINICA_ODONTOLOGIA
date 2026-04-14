require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Limpiando base de datos (conservando admin)...\n');

  await prisma.pago.deleteMany(); console.log('  ✓ Pagos');
  await prisma.itemFactura.deleteMany(); console.log('  ✓ Items factura');
  await prisma.ingreso.deleteMany(); console.log('  ✓ Ingresos');
  await prisma.factura.deleteMany(); console.log('  ✓ Facturas');
  await prisma.correlativo.deleteMany(); console.log('  ✓ Correlativos');
  await prisma.etapaTratamiento.deleteMany(); console.log('  ✓ Etapas tratamiento');
  await prisma.tratamiento.deleteMany(); console.log('  ✓ Tratamientos');
  await prisma.procedimiento.deleteMany(); console.log('  ✓ Procedimientos');
  await prisma.imagenClinica.deleteMany(); console.log('  ✓ Imágenes clínicas');
  await prisma.expediente.deleteMany(); console.log('  ✓ Expedientes');
  await prisma.documento.deleteMany(); console.log('  ✓ Documentos');
  await prisma.cita.deleteMany(); console.log('  ✓ Citas');
  await prisma.paciente.deleteMany(); console.log('  ✓ Pacientes');
  await prisma.estadisticaOdontologo.deleteMany(); console.log('  ✓ Estadísticas');
  await prisma.movimientoInventario.deleteMany(); console.log('  ✓ Movimientos inventario');
  await prisma.inventario.deleteMany(); console.log('  ✓ Inventario');
  await prisma.productoServicio.deleteMany(); console.log('  ✓ Productos/Servicios');
  await prisma.flujoCaja.deleteMany(); console.log('  ✓ Flujo de caja');
  await prisma.egreso.deleteMany(); console.log('  ✓ Egresos');
  await prisma.configuracionEmpresa.deleteMany(); console.log('  ✓ Config empresa');
  await prisma.usuario.deleteMany({ where: { rol: { not: 'ADMINISTRADOR' } } }); console.log('  ✓ Usuarios (admin conservado)');

  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });
  console.log('\n✅ Base de datos limpia.');
  console.log('👤 Admin conservado: ' + admin.username + ' (' + admin.email + ')');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
