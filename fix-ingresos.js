/**
 * Agrega facturas pagadas adicionales para que ingresos > egresos
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fecha(d) { const f = new Date(); f.setDate(f.getDate() - d); f.setHours(10,0,0,0); return f; }

async function main() {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });
  const pacientes = await prisma.paciente.findMany({ take: 10 });
  const ultimaFac = await prisma.factura.findFirst({ orderBy: { numero: 'desc' } });
  let num = 14; // siguiente después de FAC-000013

  const extras = [
    { p: 1, d: 15, items: [{ desc: 'Control ortodoncia', pr: 500 }, { desc: 'Ajuste brackets', pr: 300 }], met: 'EFECTIVO' },
    { p: 5, d: 11, items: [{ desc: 'Sellantes x4', pr: 1000 }], met: 'EFECTIVO' },
    { p: 8, d: 9, items: [{ desc: 'Consulta General', pr: 300 }, { desc: 'Radiografía Panorámica', pr: 400 }], met: 'TARJETA_CREDITO' },
    { p: 2, d: 7, items: [{ desc: 'Control post-extracción', pr: 300 }], met: 'EFECTIVO' },
    { p: 0, d: 5, items: [{ desc: 'Consulta control', pr: 300 }, { desc: 'Radiografía periapical', pr: 150 }], met: 'EFECTIVO' },
    { p: 7, d: 3, items: [{ desc: 'Consulta General', pr: 300 }, { desc: 'Aplicación de Flúor', pr: 200 }], met: 'TARJETA_DEBITO' },
    { p: 9, d: 2, items: [{ desc: 'Placa Oclusal', pr: 1800 }], met: 'TRANSFERENCIA' },
    { p: 6, d: 1, items: [{ desc: 'Tratamiento periodontal', pr: 1500 }], met: 'EFECTIVO' },
  ];

  let totalNuevo = 0;
  for (const f of extras) {
    const items = f.items.map(i => ({ descripcion: i.desc, cantidad: 1, precioUnitario: i.pr, subtotal: i.pr }));
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const impuesto = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;
    const numero = `FAC-${String(num++).padStart(6, '0')}`;
    const fechaF = fecha(f.d);

    const fac = await prisma.factura.create({
      data: {
        numero, pacienteId: pacientes[f.p].id, emitenteId: admin.id,
        subtotal, descuento: 0, impuesto, total, estado: 'PAGADA', metodoPago: f.met, fecha: fechaF,
        items: { create: items },
        pagos: { create: [{ monto: total, metodoPago: f.met, referencia: `Pago ${numero}`, fecha: fechaF }] },
      },
    });
    await prisma.ingreso.create({
      data: { facturaId: fac.id, concepto: `Pago ${numero}`, categoria: 'CONSULTA', monto: total, fecha: fechaF, metodoPago: f.met, estado: 'REGISTRADO' },
    });
    totalNuevo += total;
    console.log(`  ✓ ${numero} — L.${total}`);
  }

  // Actualizar correlativo
  await prisma.correlativo.updateMany({ where: { activo: true }, data: { siguiente: num } });

  // Totales finales
  const ingresos = await prisma.ingreso.aggregate({ _sum: { monto: true } });
  const egresos = await prisma.egreso.aggregate({ _sum: { monto: true } });
  const ti = parseFloat(ingresos._sum.monto || 0);
  const te = parseFloat(egresos._sum.monto || 0);

  console.log(`\n✅ Facturas adicionales: L.${totalNuevo.toFixed(2)}`);
  console.log(`📊 Total ingresos: L.${ti.toFixed(2)}`);
  console.log(`📊 Total egresos:  L.${te.toFixed(2)}`);
  console.log(`📊 Utilidad:       L.${(ti - te).toFixed(2)} (${(((ti-te)/ti)*100).toFixed(1)}%)`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
