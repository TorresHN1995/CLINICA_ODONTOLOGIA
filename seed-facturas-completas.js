/**
 * Script para generar facturas completas y realistas
 * Ejecutar: node seed-facturas-completas.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Datos de facturas realistas
const FACTURAS_DATOS = [
  {
    paciente: 'Juan Pérez',
    items: [
      { descripcion: 'Consulta General', cantidad: 1, precioUnitario: 150.00 },
      { descripcion: 'Radiografía Periapical', cantidad: 2, precioUnitario: 50.00 },
    ],
    descuento: 0,
    metodoPago: 'EFECTIVO',
    observaciones: 'Consulta inicial con radiografías',
  },
  {
    paciente: 'María González',
    items: [
      { descripcion: 'Limpieza Dental', cantidad: 1, precioUnitario: 200.00 },
      { descripcion: 'Obturación Compuesta', cantidad: 2, precioUnitario: 350.00 },
      { descripcion: 'Radiografía Panorámica', cantidad: 1, precioUnitario: 100.00 },
    ],
    descuento: 50.00,
    metodoPago: 'TARJETA_CREDITO',
    observaciones: 'Tratamiento de caries - Descuento por pago inmediato',
  },
  {
    paciente: 'Pedro Rodríguez',
    items: [
      { descripcion: 'Tratamiento de Conducto', cantidad: 1, precioUnitario: 800.00 },
      { descripcion: 'Corona Dental', cantidad: 1, precioUnitario: 1200.00 },
    ],
    descuento: 100.00,
    metodoPago: 'TRANSFERENCIA',
    observaciones: 'Endodoncia y restauración - Pago por transferencia',
  },
  {
    paciente: 'Laura Hernández',
    items: [
      { descripcion: 'Consulta General', cantidad: 1, precioUnitario: 150.00 },
      { descripcion: 'Extracción Dental', cantidad: 1, precioUnitario: 300.00 },
      { descripcion: 'Radiografía Periapical', cantidad: 1, precioUnitario: 50.00 },
    ],
    descuento: 0,
    metodoPago: 'EFECTIVO',
    observaciones: 'Extracción dental con radiografía de control',
  },
  {
    paciente: 'Carlos Morales',
    items: [
      { descripcion: 'Limpieza Dental', cantidad: 1, precioUnitario: 200.00 },
      { descripcion: 'Obturación Simple', cantidad: 3, precioUnitario: 250.00 },
      { descripcion: 'Radiografía Periapical', cantidad: 3, precioUnitario: 50.00 },
    ],
    descuento: 75.00,
    metodoPago: 'TARJETA_DEBITO',
    observaciones: 'Múltiples obturaciones - Descuento por volumen',
  },
];

// Estados de pago
const ESTADOS_PAGO = ['PAGADA', 'PAGADA_PARCIAL', 'PENDIENTE'];

async function main() {
  console.log('💰 Iniciando generación de facturas completas...\n');

  try {
    // Obtener admin
    const admin = await prisma.usuario.findFirst({
      where: { rol: 'ADMINISTRADOR' }
    });

    if (!admin) {
      console.error('❌ No se encontró usuario administrador');
      process.exit(1);
    }

    // Obtener pacientes
    const pacientes = await prisma.paciente.findMany({
      where: { activo: true },
      take: 5,
    });

    if (pacientes.length === 0) {
      console.error('❌ No se encontraron pacientes');
      process.exit(1);
    }

    console.log('📋 Creando facturas completas...\n');

    let facturasCreadas = 0;
    let pagosRegistrados = 0;

    for (let i = 0; i < FACTURAS_DATOS.length && i < pacientes.length; i++) {
      const facturaData = FACTURAS_DATOS[i];
      const paciente = pacientes[i];

      // Calcular subtotal
      let subtotal = 0;
      for (const item of facturaData.items) {
        subtotal += item.cantidad * item.precioUnitario;
      }

      // Aplicar descuento
      const descuento = facturaData.descuento || 0;
      const subtotalConDescuento = subtotal - descuento;

      // Calcular impuesto (15% ISV)
      const impuesto = subtotalConDescuento * 0.15;
      const total = subtotalConDescuento + impuesto;

      // Crear factura
      const factura = await prisma.factura.create({
        data: {
          pacienteId: paciente.id,
          emitenteId: admin.id,
          numero: `FAC-${Date.now()}-${i}`,
          subtotal: subtotal,
          descuento: descuento,
          impuesto: impuesto,
          total: total,
          metodoPago: facturaData.metodoPago,
          estado: ESTADOS_PAGO[Math.floor(Math.random() * ESTADOS_PAGO.length)],
          observaciones: facturaData.observaciones,
          items: {
            create: facturaData.items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
            }))
          }
        },
        include: { items: true, paciente: true }
      });

      facturasCreadas++;

      console.log(`✓ Factura ${factura.numero}`);
      console.log(`  Paciente: ${paciente.nombre} ${paciente.apellido}`);
      console.log(`  Items: ${factura.items.length}`);
      console.log(`  Subtotal: L. ${factura.subtotal.toFixed(2)}`);
      if (factura.descuento > 0) {
        console.log(`  Descuento: -L. ${factura.descuento.toFixed(2)}`);
      }
      console.log(`  ISV (15%): L. ${factura.impuesto.toFixed(2)}`);
      console.log(`  Total: L. ${factura.total.toFixed(2)}`);
      console.log(`  Estado: ${factura.estado}`);
      console.log(`  Método de Pago: ${factura.metodoPago}\n`);

      // Registrar pagos según el estado
      if (factura.estado === 'PAGADA') {
        // Pago completo
        const pago = await prisma.pago.create({
          data: {
            facturaId: factura.id,
            monto: factura.total,
            metodoPago: factura.metodoPago,
            referencia: `PAGO-${Date.now()}-${i}`,
            observaciones: 'Pago completo',
            fecha: new Date(),
          }
        });

        // Actualizar estado de factura
        await prisma.factura.update({
          where: { id: factura.id },
          data: { estado: 'PAGADA' }
        });

        // Crear ingreso automático
        await prisma.ingreso.create({
          data: {
            facturaId: factura.id,
            concepto: `Ingreso por factura ${factura.numero}`,
            monto: factura.total,
            categoria: 'CONSULTA',
            metodoPago: factura.metodoPago,
            estado: 'REGISTRADO',
            observaciones: 'Pago completo',
            fecha: new Date(),
          }
        });

        pagosRegistrados++;
        console.log(`  💳 Pago registrado: L. ${pago.monto.toFixed(2)}`);
        console.log(`  📊 Ingreso registrado automáticamente\n`);

      } else if (factura.estado === 'PAGADA_PARCIAL') {
        // Pago parcial (50% del total)
        const montoParcial = factura.total * 0.5;

        const pago = await prisma.pago.create({
          data: {
            facturaId: factura.id,
            monto: montoParcial,
            metodoPago: factura.metodoPago,
            referencia: `PAGO-PARCIAL-${Date.now()}-${i}`,
            observaciones: 'Pago parcial - 50%',
            fecha: new Date(),
          }
        });

        // Actualizar estado de factura
        await prisma.factura.update({
          where: { id: factura.id },
          data: { estado: 'PAGADA_PARCIAL' }
        });

        // Crear ingreso automático por el monto pagado
        await prisma.ingreso.create({
          data: {
            facturaId: factura.id,
            concepto: `Ingreso parcial por factura ${factura.numero}`,
            monto: montoParcial,
            categoria: 'CONSULTA',
            metodoPago: factura.metodoPago,
            estado: 'REGISTRADO',
            observaciones: 'Pago parcial - 50%',
            fecha: new Date(),
          }
        });

        pagosRegistrados++;
        console.log(`  💳 Pago parcial registrado: L. ${pago.monto.toFixed(2)}`);
        console.log(`  Saldo pendiente: L. ${(factura.total - montoParcial).toFixed(2)}`);
        console.log(`  📊 Ingreso parcial registrado automáticamente\n`);

      } else {
        console.log(`  ⏳ Factura pendiente de pago\n`);
      }
    }

    // Calcular estadísticas
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  RESUMEN DE FACTURACIÓN                    ║');
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
    console.log(`   • Total de facturas: ${totalFacturas}`);
    console.log(`   • Total de ingresos registrados: L. ${(totalIngresos._sum.monto || 0).toFixed(2)}`);
    console.log(`   • Total de pagos: L. ${(totalPagos._sum.monto || 0).toFixed(2)}`);

    console.log(`\n📈 Facturas por Estado:`);
    for (const estado of facturasEstados) {
      console.log(`   • ${estado.estado}: ${estado._count} facturas - L. ${(estado._sum.total || 0).toFixed(2)}`);
    }

    // Flujo de caja
    console.log(`\n💰 Flujo de Caja:`);
    const flujosCaja = await prisma.flujoCaja.findMany({
      orderBy: { fecha: 'desc' },
      take: 5,
    });

    if (flujosCaja.length > 0) {
      for (const flujo of flujosCaja) {
        const saldo = flujo.saldoAcumulado ? parseFloat(flujo.saldoAcumulado) : 0;
        console.log(`   • ${flujo.fecha.toLocaleDateString()}: Saldo L. ${saldo.toFixed(2)}`);
      }
    } else {
      console.log(`   • No hay registros de flujo de caja aún`);
    }

    console.log(`\n✅ Generación de facturas completada exitosamente`);
    console.log(`   • Facturas creadas: ${facturasCreadas}`);
    console.log(`   • Pagos registrados: ${pagosRegistrados}`);

  } catch (error) {
    console.error('❌ Error durante generación de facturas:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
