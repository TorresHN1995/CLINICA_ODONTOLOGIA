/**
 * Simula EXACTAMENTE la lógica de creación de factura de app/api/facturas/route.ts
 * (búsqueda de correlativo + creación) dentro de una transacción que se REVIERTE
 * al final (lanza un error a propósito) para no persistir nada.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class Rollback extends Error {}

async function main() {
  const paciente = await prisma.paciente.findFirst({ where: { activo: true } })
  const emisor = await prisma.usuario.findFirst()
  console.log(`Paciente: ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'NINGUNO'}`)
  console.log(`Emisor:   ${emisor ? emisor.email : 'NINGUNO'}\n`)

  const items = [{ descripcion: 'Consulta general', cantidad: 1, precioUnitario: 500, tasaIsv: 15 }]
  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0)
  const impuesto = items.reduce((s, it) => s + it.cantidad * it.precioUnitario * (it.tasaIsv / 100), 0)
  const total = subtotal + impuesto

  try {
    await prisma.$transaction(async (tx) => {
      // ── Réplica EXACTA del bloque correlativo (con el fix) ──
      const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
      const correlativo = await tx.correlativo.findFirst({
        where: { tipo: 'FACTURA', activo: true, fechaLimite: { gte: inicioHoy } },
        orderBy: { createdAt: 'desc' },
      })

      if (!correlativo) {
        throw new Error('❌ No hay correlativo activo o disponible para FACTURA (REPRODUCIDO el error del usuario)')
      }
      console.log(`✅ Correlativo encontrado: ${correlativo.sucursal}-${correlativo.puntoEmision}-${correlativo.tipoDoc}, siguiente=${correlativo.siguiente}`)

      if (correlativo.siguiente > correlativo.rangoFinal) {
        throw new Error('❌ El rango de facturación se ha agotado')
      }

      const numero = `${correlativo.sucursal}-${correlativo.puntoEmision}-${correlativo.tipoDoc}-${String(correlativo.siguiente).padStart(8, '0')}`
      console.log(`✅ Número generado: ${numero}`)

      // Crear factura (se revertirá)
      const factura = await tx.factura.create({
        data: {
          numero, pacienteId: paciente.id, emitenteId: emisor.id,
          subtotal, descuento: 0, impuesto, total,
          tipoDocumento: 'FACTURA', correlativoId: correlativo.id, cai: correlativo.cai,
          items: { create: items.map((it) => ({ descripcion: it.descripcion, cantidad: it.cantidad, precioUnitario: it.precioUnitario, subtotal: it.cantidad * it.precioUnitario, tasaIsv: it.tasaIsv })) },
        },
      })
      console.log(`✅ Factura creada (en transacción): ${factura.numero} — total ${total}`)
      console.log('\n🎉 La creación de factura FUNCIONA en local (revirtiendo cambios)...')

      throw new Rollback('rollback-intencional')
    }, { isolationLevel: 'Serializable' })
  } catch (e) {
    if (e instanceof Rollback) {
      console.log('↩️  Transacción revertida — no se guardó nada.')
      console.log('\nCONCLUSIÓN: el backend local crea facturas SIN problema. El error del usuario NO se reproduce aquí.')
    } else {
      console.log('\n' + e.message)
      console.log('\nCONCLUSIÓN: se reprodujo el fallo — el problema está en los DATOS del correlativo.')
    }
  }
}
main().catch((e) => { console.error(e) }).finally(() => prisma.$disconnect())
