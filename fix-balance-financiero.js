/**
 * Script para rebalancear datos financieros de prueba
 * Los ingresos deben ser mayores que los egresos para mostrar utilidad positiva
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🔧 Rebalanceando datos financieros...\n');

  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });
  if (!admin) { console.error('No hay admin'); return; }

  // ── Limpiar datos financieros existentes ──
  console.log('🗑️  Limpiando datos financieros anteriores...');
  await prisma.ingreso.deleteMany();
  await prisma.egreso.deleteMany();
  await prisma.flujoCaja.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.itemFactura.deleteMany();
  await prisma.factura.deleteMany();
  console.log('  ✓ Datos financieros limpiados\n');

  // ── Obtener pacientes ──
  const pacientes = await prisma.paciente.findMany({ take: 10 });

  // ── Crear facturas con fechas distribuidas en el mes actual ──
  console.log('💰 Creando facturas...');
  const facturasData = [
    { pacIdx: 0, items: [{ desc: 'Endodoncia pieza 16', precio: 2500 }, { desc: 'Radiografía periapical', precio: 150 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 25 },
    { pacIdx: 1, items: [{ desc: 'Profilaxis dental', precio: 450 }, { desc: 'Obturación con resina x2', precio: 1200 }], estado: 'PAGADA', metodo: 'TARJETA_CREDITO', dias: 22 },
    { pacIdx: 2, items: [{ desc: 'Extracción de cordal', precio: 1500 }, { desc: 'Radiografía panorámica', precio: 400 }, { desc: 'Medicamentos', precio: 200 }], estado: 'PAGADA', metodo: 'TRANSFERENCIA', dias: 20 },
    { pacIdx: 3, items: [{ desc: 'Corona de porcelana', precio: 4500 }, { desc: 'Provisional', precio: 500 }], estado: 'PAGADA', metodo: 'TARJETA_CREDITO', dias: 18 },
    { pacIdx: 4, items: [{ desc: 'Endodoncia pieza 36', precio: 2500 }, { desc: 'Poste fibra de vidrio', precio: 800 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 15 },
    { pacIdx: 5, items: [{ desc: 'Consulta general', precio: 300 }, { desc: 'Limpieza dental', precio: 450 }, { desc: 'Aplicación de flúor', precio: 200 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 12 },
    { pacIdx: 6, items: [{ desc: 'Evaluación para prótesis', precio: 300 }, { desc: 'Radiografía panorámica', precio: 400 }, { desc: 'Impresiones', precio: 500 }], estado: 'PAGADA', metodo: 'TRANSFERENCIA', dias: 10 },
    { pacIdx: 7, items: [{ desc: 'Consulta general', precio: 300 }, { desc: 'Obturación con resina x3', precio: 1800 }], estado: 'PAGADA', metodo: 'TARJETA_DEBITO', dias: 8 },
    { pacIdx: 8, items: [{ desc: 'Blanqueamiento dental', precio: 2000 }], estado: 'PAGADA', metodo: 'TARJETA_CREDITO', dias: 5 },
    { pacIdx: 9, items: [{ desc: 'Placa oclusal', precio: 1800 }, { desc: 'Consulta ATM', precio: 300 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 3 },
    // Facturas pendientes/parciales
    { pacIdx: 0, items: [{ desc: 'Corona de porcelana pieza 16', precio: 4500 }], estado: 'PAGADA_PARCIAL', metodo: 'EFECTIVO', dias: 2 },
    { pacIdx: 3, items: [{ desc: 'Puente dental 3 piezas', precio: 12000 }], estado: 'PENDIENTE', metodo: null, dias: 1 },
    // Más facturas pagadas para subir ingresos
    { pacIdx: 1, items: [{ desc: 'Control ortodoncia', precio: 500 }, { desc: 'Cambio de ligas', precio: 200 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 7 },
    { pacIdx: 4, items: [{ desc: 'Corona de porcelana pieza 36', precio: 4500 }], estado: 'PAGADA', metodo: 'TRANSFERENCIA', dias: 4 },
    { pacIdx: 5, items: [{ desc: 'Sellantes x4', precio: 1000 }], estado: 'PAGADA', metodo: 'EFECTIVO', dias: 6 },
  ];

  let factNum = 1;
  let totalIngresosCreados = 0;

  for (const f of facturasData) {
    if (!pacientes[f.pacIdx]) continue;
    const items = f.items.map(i => ({ descripcion: i.desc, cantidad: 1, precioUnitario: i.precio, subtotal: i.precio }));
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const impuesto = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;
    const numero = `FAC-${String(factNum++).padStart(6, '0')}`;
    const fecha = diasAtras(f.dias);

    const pagos = [];
    if (f.estado === 'PAGADA') {
      pagos.push({ monto: total, metodoPago: f.metodo, referencia: `Pago completo ${numero}`, fecha });
    } else if (f.estado === 'PAGADA_PARCIAL') {
      pagos.push({ monto: Math.round(total * 0.5 * 100) / 100, metodoPago: f.metodo || 'EFECTIVO', referencia: `Abono ${numero}`, fecha });
    }

    const factura = await prisma.factura.create({
      data: {
        numero, pacienteId: pacientes[f.pacIdx].id, emitenteId: admin.id,
        subtotal, descuento: 0, impuesto, total,
        estado: f.estado, metodoPago: f.metodo, fecha,
        items: { create: items },
        pagos: pagos.length > 0 ? { create: pagos } : undefined,
      },
    });

    // Crear ingreso para facturas pagadas
    if (f.estado === 'PAGADA' || f.estado === 'PAGADA_PARCIAL') {
      const montoIngreso = f.estado === 'PAGADA' ? total : Math.round(total * 0.5 * 100) / 100;
      await prisma.ingreso.create({
        data: {
          facturaId: factura.id,
          concepto: `Pago ${numero} - ${pacientes[f.pacIdx].nombre} ${pacientes[f.pacIdx].apellido}`,
          categoria: 'CONSULTA', monto: montoIngreso,
          fecha, metodoPago: f.metodo || 'EFECTIVO', estado: 'REGISTRADO',
        },
      });
      totalIngresosCreados += montoIngreso;
    }

    console.log(`  ✓ ${numero} — L.${total} (${f.estado})`);
  }
  console.log(`  📊 Total ingresos: L.${totalIngresosCreados.toFixed(2)}\n`);


  // ── Crear egresos realistas pero menores que ingresos ──
  console.log('📉 Creando egresos...');
  const egresosData = [
    { concepto: 'Alquiler del local', categoria: 'ALQUILER', monto: 8000.00, metodo: 'TRANSFERENCIA', proveedor: 'Inmobiliaria Palmira S.A.', numFact: 'ALQ-2026-04', estado: 'PAGADO', dias: 1 },
    { concepto: 'Salario asistente dental', categoria: 'SALARIOS', monto: 6000.00, metodo: 'TRANSFERENCIA', proveedor: null, numFact: null, estado: 'PAGADO', dias: 1 },
    { concepto: 'Salario recepcionista', categoria: 'SALARIOS', monto: 5000.00, metodo: 'TRANSFERENCIA', proveedor: null, numFact: null, estado: 'PAGADO', dias: 1 },
    { concepto: 'Compra de resinas y materiales', categoria: 'MATERIALES_DENTALES', monto: 3500.00, metodo: 'TRANSFERENCIA', proveedor: '3M Dental Honduras', numFact: 'DS-2026-0891', estado: 'PAGADO', dias: 20 },
    { concepto: 'Compra de anestésicos', categoria: 'MEDICAMENTOS', monto: 1800.00, metodo: 'TRANSFERENCIA', proveedor: 'Septodont', numFact: 'SEP-2026-445', estado: 'PAGADO', dias: 18 },
    { concepto: 'Energía eléctrica', categoria: 'SERVICIOS_PUBLICOS', monto: 1500.00, metodo: 'EFECTIVO', proveedor: 'ENEE', numFact: 'ENEE-04-2026', estado: 'PAGADO', dias: 5 },
    { concepto: 'Agua potable', categoria: 'SERVICIOS_PUBLICOS', monto: 400.00, metodo: 'EFECTIVO', proveedor: 'SANAA', numFact: 'SANAA-04-2026', estado: 'PAGADO', dias: 5 },
    { concepto: 'Internet y telefonía', categoria: 'SERVICIOS_PUBLICOS', monto: 800.00, metodo: 'TARJETA_CREDITO', proveedor: 'Tigo Honduras', numFact: 'TIGO-04-2026', estado: 'PAGADO', dias: 3 },
    { concepto: 'Guantes y consumibles', categoria: 'MATERIALES_DENTALES', monto: 1200.00, metodo: 'TARJETA_CREDITO', proveedor: 'MediHonduras S.A.', numFact: 'MH-2026-789', estado: 'PAGADO', dias: 15 },
    { concepto: 'Publicidad redes sociales', categoria: 'MARKETING', monto: 1000.00, metodo: 'TARJETA_CREDITO', proveedor: 'Meta Ads', numFact: 'META-04-2026', estado: 'PAGADO', dias: 10 },
  ];

  let totalEgresosCreados = 0;
  for (const e of egresosData) {
    await prisma.egreso.create({
      data: {
        concepto: e.concepto, categoria: e.categoria, monto: e.monto,
        metodoPago: e.metodo, proveedor: e.proveedor, numeroFactura: e.numFact,
        estado: e.estado, registradoPor: admin.id, fecha: diasAtras(e.dias),
      },
    });
    totalEgresosCreados += e.monto;
    console.log(`  ✓ ${e.concepto} — L.${e.monto}`);
  }
  console.log(`  📊 Total egresos: L.${totalEgresosCreados.toFixed(2)}\n`);

  // ── Recrear flujo de caja ──
  console.log('💵 Creando flujo de caja...');
  let saldo = 0;
  const movimientos = [
    { tipo: 'AJUSTE', concepto: 'Saldo inicial del mes', monto: 25000.00, dias: 28 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 1', monto: 12000.00, dias: 21 },
    { tipo: 'EGRESO', concepto: 'Alquiler y servicios', monto: 10700.00, dias: 20 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 2', monto: 15000.00, dias: 14 },
    { tipo: 'EGRESO', concepto: 'Materiales y medicamentos', monto: 5300.00, dias: 13 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 3', monto: 11000.00, dias: 7 },
    { tipo: 'EGRESO', concepto: 'Salarios del personal', monto: 11000.00, dias: 5 },
    { tipo: 'INGRESO', concepto: 'Ingresos semana 4', monto: 8500.00, dias: 1 },
    { tipo: 'EGRESO', concepto: 'Marketing y otros', monto: 2200.00, dias: 1 },
  ];

  for (const m of movimientos) {
    const saldoAnterior = saldo;
    saldo += m.tipo === 'EGRESO' ? -m.monto : m.monto;
    await prisma.flujoCaja.create({
      data: { tipo: m.tipo, concepto: m.concepto, monto: m.monto, saldoAnterior, saldoActual: saldo, fecha: diasAtras(m.dias) },
    });
  }
  console.log(`  ✓ ${movimientos.length} movimientos (saldo: L.${saldo.toFixed(2)})\n`);

  // ── Actualizar correlativo ──
  await prisma.correlativo.updateMany({ where: { activo: true }, data: { siguiente: factNum } });

  // ── Resumen ──
  const utilidad = totalIngresosCreados - totalEgresosCreados;
  const margen = ((utilidad / totalIngresosCreados) * 100).toFixed(1);

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ✅ Datos financieros rebalanceados              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n📊 Resumen:`);
  console.log(`   Ingresos:  L.${totalIngresosCreados.toFixed(2)}`);
  console.log(`   Egresos:   L.${totalEgresosCreados.toFixed(2)}`);
  console.log(`   Utilidad:  L.${utilidad.toFixed(2)}`);
  console.log(`   Margen:    ${margen}%`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
