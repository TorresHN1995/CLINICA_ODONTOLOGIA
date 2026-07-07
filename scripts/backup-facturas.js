// Respaldo (solo lectura) de facturas y todo lo relacionado ANTES de un borrado.
// Escribe un JSON con timestamp. No modifica nada.
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function maskUrl(u) {
  if (!u) return '(no definido)'
  return u.replace(/(mysql:\/\/)[^@]*@/, '$1***:***@')
}

async function main() {
  console.log('DB destino:', maskUrl(process.env.DATABASE_URL))

  const [facturas, items, pagos, ingresos] = await Promise.all([
    prisma.factura.findMany({ include: { items: true, pagos: true, ingreso: true } }),
    prisma.itemFactura.count(),
    prisma.pago.count(),
    prisma.ingreso.count(),
  ])

  const facturaIds = facturas.map((f) => f.id)

  const flujoIngresos = await prisma.flujoCaja.findMany({
    where: { tipo: 'INGRESO', referencia: { in: facturaIds } },
  })
  const presupuestosFacturados = await prisma.presupuesto.findMany({
    where: { facturaId: { in: facturaIds } },
    select: { id: true, numero: true, facturaId: true, estado: true },
  })
  const correlativos = await prisma.correlativo.findMany()

  const dump = {
    generadoEn: new Date().toISOString(),
    db: maskUrl(process.env.DATABASE_URL),
    conteos: {
      facturas: facturas.length,
      items_factura: items,
      pagos,
      ingresos,
      flujo_caja_ingreso_de_facturas: flujoIngresos.length,
      presupuestos_con_factura: presupuestosFacturados.length,
      correlativos: correlativos.length,
    },
    facturas,
    flujoIngresos,
    presupuestosFacturados,
    correlativos,
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(process.cwd(), `backup-facturas-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(dump, null, 2), 'utf8')

  console.log('\n=== CONTEOS ===')
  console.table(dump.conteos)
  console.log('\nRespaldo escrito en:', file)
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
