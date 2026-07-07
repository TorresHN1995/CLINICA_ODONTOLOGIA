// Borra TODAS las facturas y reconcilia lo relacionado, en una transacción.
// Cascada automática (FK onDelete: Cascade): items_factura, pagos, ingresos.
// Manual: flujo_caja (INGRESO de facturas) y reinicio de correlativos.siguiente.
// EJECUTAR SOLO CON RESPALDO PREVIO (scripts/backup-facturas.js).
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const mask = (u) => (u || '').replace(/(mysql:\/\/)[^@]*@/, '$1***:***@')

async function main() {
  console.log('DB destino:', mask(process.env.DATABASE_URL))

  const ids = (await prisma.factura.findMany({ select: { id: true } })).map((f) => f.id)
  console.log('Facturas a borrar:', ids.length)

  const [flujoBorrado, facturasBorradas, correlativosReset] = await prisma.$transaction([
    prisma.flujoCaja.deleteMany({ where: { tipo: 'INGRESO', referencia: { in: ids } } }),
    prisma.factura.deleteMany({}),
    prisma.$executeRaw`UPDATE correlativos SET siguiente = rangoInicial`,
  ])

  console.log('\n=== RESULTADO ===')
  console.log('flujo_caja INGRESO borrados:', flujoBorrado.count)
  console.log('facturas borradas:', facturasBorradas.count, '(items/pagos/ingresos por cascada)')
  console.log('correlativos reiniciados:', correlativosReset)

  // Verificación posterior
  const [f, i, p, ing] = await Promise.all([
    prisma.factura.count(),
    prisma.itemFactura.count(),
    prisma.pago.count(),
    prisma.ingreso.count(),
  ])
  console.log('\n=== CONTEOS FINALES ===')
  console.table({ facturas: f, items_factura: i, pagos: p, ingresos: ing })
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
