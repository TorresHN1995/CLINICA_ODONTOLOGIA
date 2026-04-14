#!/usr/bin/env node

/**
 * Script para resetear la base de datos y regenerar datos de prueba
 * Ejecutar: node reset-database.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando reset de base de datos...\n');

  try {
    // 1. Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    
    await prisma.documento.deleteMany({});
    await prisma.imagenClinica.deleteMany({});
    await prisma.pago.deleteMany({});
    await prisma.ingreso.deleteMany({});
    await prisma.egreso.deleteMany({});
    await prisma.flujoCaja.deleteMany({});
    await prisma.itemFactura.deleteMany({});
    await prisma.factura.deleteMany({});
    await prisma.procedimiento.deleteMany({});
    await prisma.etapaTratamiento.deleteMany({});
    await prisma.tratamiento.deleteMany({});
    await prisma.expediente.deleteMany({});
    await prisma.cita.deleteMany({});
    await prisma.paciente.deleteMany({});
    await prisma.movimientoInventario.deleteMany({});
    await prisma.inventario.deleteMany({});
    await prisma.estadisticaOdontologo.deleteMany({});
    await prisma.correlativo.deleteMany({});
    await prisma.configuracionEmpresa.deleteMany({});
    await prisma.productoServicio.deleteMany({});
    await prisma.usuario.deleteMany({
      where: { rol: { not: 'ADMINISTRADOR' } }
    });

    console.log('✓ Base de datos limpiada\n');

    // 2. Ejecutar seed de datos completos
    console.log('🌱 Regenerando datos de prueba...');
    execSync('node seed-complete.js', { stdio: 'inherit' });

    // 3. Ejecutar seed de facturas
    console.log('\n💰 Generando facturas de prueba...');
    execSync('node seed-facturas-completas.js', { stdio: 'inherit' });

    // 4. Ejecutar seed de facturas adicionales
    console.log('\n📊 Generando facturas adicionales...');
    execSync('node seed-facturas-adicionales.js', { stdio: 'inherit' });

    console.log('\n✅ Reset de base de datos completado exitosamente');
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Admin:');
    console.log('   • Usuario: admin');
    console.log('   • Contraseña: Admin123!');

  } catch (error) {
    console.error('❌ Error durante reset:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
