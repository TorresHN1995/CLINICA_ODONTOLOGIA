// Inspección (solo lectura) del tipo de valor almacenado en campos *.fecha:
// timestamp real (now()) vs solo-día a medianoche. Muestra la hora UTC guardada.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const iso = (d) => (d ? new Date(d).toISOString() : null)

async function sample(label, rows, field = 'fecha') {
  console.log(`\n### ${label} (${rows.length})`)
  for (const r of rows) {
    const v = r[field]
    console.log(`  ${field}=${iso(v)}  (horaUTC=${v ? new Date(v).getUTCHours() : '-'})`)
  }
}

async function main() {
  await sample('cita.fecha', await prisma.cita.findMany({ take: 3, orderBy: { createdAt: 'desc' } }))
  await sample('egreso.fecha', await prisma.egreso.findMany({ take: 3, orderBy: { createdAt: 'desc' } }))
  await sample('presupuesto.fecha', await prisma.presupuesto.findMany({ take: 3, orderBy: { createdAt: 'desc' } }))
  await sample('presupuesto.validoHasta', await prisma.presupuesto.findMany({ take: 3, orderBy: { createdAt: 'desc' } }), 'validoHasta')
  await sample('expediente.fecha', await prisma.expediente.findMany({ take: 3, orderBy: { createdAt: 'desc' } }))
  await sample('expediente.proximaCita', await prisma.expediente.findMany({ take: 3, orderBy: { createdAt: 'desc' } }), 'proximaCita')
  await sample('tratamiento.fechaInicio', await prisma.tratamiento.findMany({ take: 3, orderBy: { createdAt: 'desc' } }), 'fechaInicio')
  await sample('paciente.fechaNacimiento', await prisma.paciente.findMany({ take: 3, orderBy: { createdAt: 'desc' } }), 'fechaNacimiento')
  await sample('cierreCaja.fecha', await prisma.cierreCaja.findMany({ take: 3, orderBy: { createdAt: 'desc' } }))
  await sample('correlativo.fechaLimite', await prisma.correlativo.findMany({ take: 3 }), 'fechaLimite')
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
