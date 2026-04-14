/**
 * Script para generar más facturas con diferentes escenarios
 * Ejecutar: node seed-facturas-adicionales.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('💰 Generando facturas adicionales con diferentes escenarios...\n');

  try {
    // Obtener admin
    const admin = await prisma.usuario.findFirst({
      where: { rol: 'ADMINISTRADOR' }
    });

    // Obtener todos los pacientes
    const pacientes = await prisma.paciente.findMany({
      where: { activo: true }
    });

    if (pacientes.length === 0) {
      console.error('❌ No se encontraron pacientes');
      process.exit(1);
    }

    console.log('📋 Creando facturas con diferentes escenarios...\n');

    let facturasCreadas = 0;

    // Escenario 1: Facturas con múltiples servicios
    console.log('📌 Escenario 1: Facturas con múltiples servicios\n');
    
    for (let i = 0; i < 3; i++) {
      const paciente = pacientes[i % pacientes.length];
      
      const items = [
        { descripcion: 'Consulta General', cantidad: 1, precioUnitario: 150.00 },
        { descripcion: 'Limpieza Dental', cantidad: 1, precioUnitario: 200.00 },
        { descripcion: 'Obturación Compuesta', cantidad: 2, precioUnitario: 350.00 },
        { descripcion: 'Radiografía Panorámica', cantidad: 1, precioUnitario: 100.00 },
      ];

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precioUnitario;
      }

      const descuento = 100.00;
      const subtotalConDescuento = subtotal - descuento;
      const impuesto = subtotalConDescuento * 0.15;
      const total = subtotalConDescuento + impuesto;

      const factura = await prisma.factura.create({
        data: {
          pacienteId: paciente.id,
          emitenteId: admin.id,
          numero: `FAC-MULTI-${Date.now()}-${i}`,
          subtotal: subtotal,
          descuento: descuento,
          impuesto: impuesto,
          total: total,
          metodoPago: 'TARJETA_CREDITO',
          estado: 'PAGADA',
          observaciones: 'Tratamiento completo - Múltiples servicios',
          items: {
            create: items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            }))
          }
        },
        include: { items: true }
      });

      // Registrar pago
      await prisma.pago.create({
        data: {
          facturaId: factura.id,
          monto: factura.total,
          metodoPago: 'TARJETA_CREDITO',
          referencia: `PAGO-MULTI-${Date.now()}-${i}`,
          observaciones: 'Pago con tarjeta de crédito',
          fecha: new Date(),
        }
      });

      // Registrar ingreso
      await prisma.ingreso.create({
        data: {
          facturaId: factura.id,
          concepto: `Ingreso por factura ${factura.numero}`,
          monto: factura.total,
          categoria: 'CONSULTA',
          metodoPago: 'TARJETA_CREDITO',
          estado: 'REGISTRADO',
          observaciones: 'Ingreso por servicios múltiples',
          fecha: new Date(),
        }
      });

      console.log(`✓ ${factura.numero} - ${paciente.nombre} - L. ${factura.total.toFixed(2)}`);
      facturasCreadas++;
    }

    // Escenario 2: Facturas de tratamientos complejos
    console.log('\n📌 Escenario 2: Facturas de tratamientos complejos\n');
    
    for (let i = 0; i < 2; i++) {
      const paciente = pacientes[(i + 3) % pacientes.length];
      
      const items = [
        { descripcion: 'Tratamiento de Conducto', cantidad: 1, precioUnitario: 800.00 },
        { descripcion: 'Corona Dental', cantidad: 1, precioUnitario: 1200.00 },
        { descripcion: 'Radiografía Periapical', cantidad: 2, precioUnitario: 50.00 },
      ];

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precioUnitario;
      }

      const descuento = 200.00;
      const subtotalConDescuento = subtotal - descuento;
      const impuesto = subtotalConDescuento * 0.15;
      const total = subtotalConDescuento + impuesto;

      const factura = await prisma.factura.create({
        data: {
          pacienteId: paciente.id,
          emitenteId: admin.id,
          numero: `FAC-COMPL-${Date.now()}-${i}`,
          subtotal: subtotal,
          descuento: descuento,
          impuesto: impuesto,
          total: total,
          metodoPago: 'TRANSFERENCIA',
          estado: 'PAGADA',
          observaciones: 'Tratamiento complejo - Endodoncia y restauración',
          items: {
            create: items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            }))
          }
        },
        include: { items: true }
      });

      // Registrar pago
      await prisma.pago.create({
        data: {
          facturaId: factura.id,
          monto: factura.total,
          metodoPago: 'TRANSFERENCIA',
          referencia: `TRANSF-${Date.now()}-${i}`,
          observaciones: 'Pago por transferencia bancaria',
          fecha: new Date(),
        }
      });

      // Registrar ingreso
      await prisma.ingreso.create({
        data: {
          facturaId: factura.id,
          concepto: `Ingreso por factura ${factura.numero}`,
          monto: factura.total,
          categoria: 'CONSULTA',
          metodoPago: 'TRANSFERENCIA',
          estado: 'REGISTRADO',
          observaciones: 'Ingreso por tratamiento complejo',
          fecha: new Date(),
        }
      });

      console.log(`✓ ${factura.numero} - ${paciente.nombre} - L. ${factura.total.toFixed(2)}`);
      facturasCreadas++;
    }

    // Escenario 3: Facturas pendientes de pago
    console.log('\n📌 Escenario 3: Facturas pendientes de pago\n');
    
    for (let i = 0; i < 3; i++) {
      const paciente = pacientes[i % pacientes.length];
      
      const items = [
        { descripcion: 'Consulta General', cantidad: 1, precioUnitario: 150.00 },
        { descripcion: 'Radiografía Periapical', cantidad: 1, precioUnitario: 50.00 },
      ];

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precioUnitario;
      }

      const impuesto = subtotal * 0.15;
      const total = subtotal + impuesto;

      const factura = await prisma.factura.create({
        data: {
          pacienteId: paciente.id,
          emitenteId: admin.id,
          numero: `FAC-PEND-${Date.now()}-${i}`,
          subtotal: subtotal,
          descuento: 0,
          impuesto: impuesto,
          total: total,
          metodoPago: 'EFECTIVO',
          estado: 'PENDIENTE',
          observaciones: 'Factura pendiente de pago',
          items: {
            create: items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            }))
          }
        },
        include: { items: true }
      });

      console.log(`✓ ${factura.numero} - ${paciente.nombre} - L. ${factura.total.toFixed(2)} (PENDIENTE)`);
      facturasCreadas++;
    }

    // Escenario 4: Facturas con pagos parciales
    console.log('\n📌 Escenario 4: Facturas con pagos parciales\n');
    
    for (let i = 0; i < 2; i++) {
      const paciente = pacientes[(i + 2) % pacientes.length];
      
      const items = [
        { descripcion: 'Limpieza Dental', cantidad: 1, precioUnitario: 200.00 },
        { descripcion: 'Obturación Simple', cantidad: 2, precioUnitario: 250.00 },
      ];

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precioUnitario;
      }

      const impuesto = subtotal * 0.15;
      const total = subtotal + impuesto;

      const factura = await prisma.factura.create({
        data: {
          pacienteId: paciente.id,
          emitenteId: admin.id,
          numero: `FAC-PARC-${Date.now()}-${i}`,
          subtotal: subtotal,
          descuento: 0,
          impuesto: impuesto,
          total: total,
          metodoPago: 'TARJETA_DEBITO',
          estado: 'PAGADA_PARCIAL',
          observaciones: 'Factura con pago parcial',
          items: {
            create: items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            }))
          }
        },
        include: { items: true }
      });

      // Registrar pago parcial (60% del total)
      const montoParcial = total * 0.6;
      await prisma.pago.create({
        data: {
          facturaId: factura.id,
          monto: montoParcial,
          metodoPago: 'TARJETA_DEBITO',
          referencia: `PAGO-PARC-${Date.now()}-${i}`,
          observaciones: 'Pago parcial - 60%',
          fecha: new Date(),
        }
      });

      // Registrar ingreso parcial
      await prisma.ingreso.create({
        data: {
          facturaId: factura.id,
          concepto: `Ingreso parcial por factura ${factura.numero}`,
          monto: montoParcial,
          categoria: 'CONSULTA',
          metodoPago: 'TARJETA_DEBITO',
          estado: 'REGISTRADO',
          observaciones: 'Ingreso parcial - 60%',
          fecha: new Date(),
        }
      });

      const saldoPendiente = total - montoParcial;
      console.log(`✓ ${factura.numero} - ${paciente.nombre} - L. ${factura.total.toFixed(2)} (Pagado: L. ${montoParcial.toFixed(2)}, Pendiente: L. ${saldoPendiente.toFixed(2)})`);
      facturasCreadas++;
    }

    // Resumen final
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              RESUMEN DE FACTURAS ADICIONALES               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const totalFacturas = await prisma.factura.count();
    const totalIngresos = await prisma.ingreso.aggregate({
      _sum: { monto: true }
    });
    const totalPagos = await prisma.pago.aggregate({
      _sum: { monto: true }
    });

    const facturasEstados = await prisma.factura.groupBy({
      by: ['estado'],
      _count: true,
      _sum: { total: true }
    });

    console.log(`📊 Estadísticas Generales:`);
    console.log(`   • Facturas creadas en esta sesión: ${facturasCreadas}`);
    console.log(`   • Total de facturas en el sistema: ${totalFacturas}`);
    console.log(`   • Total de ingresos registrados: L. ${(totalIngresos._sum.monto || 0).toFixed(2)}`);
    console.log(`   • Total de pagos: L. ${(totalPagos._sum.monto || 0).toFixed(2)}`);

    console.log(`\n📈 Facturas por Estado:`);
    for (const estado of facturasEstados) {
      console.log(`   • ${estado.estado}: ${estado._count} facturas - L. ${(estado._sum.total || 0).toFixed(2)}`);
    }

    // Métodos de pago
    const metodosPago = await prisma.factura.groupBy({
      by: ['metodoPago'],
      _count: true,
      _sum: { total: true }
    });

    console.log(`\n💳 Facturas por Método de Pago:`);
    for (const metodo of metodosPago) {
      console.log(`   • ${metodo.metodoPago}: ${metodo._count} facturas - L. ${(metodo._sum.total || 0).toFixed(2)}`);
    }

    console.log(`\n✅ Generación de facturas adicionales completada`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
