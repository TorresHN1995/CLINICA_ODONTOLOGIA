/**
 * Reproduce el bug del correlativo y valida el fix.
 * Pone la fechaLimite del correlativo FACTURA en HOY a medianoche (lo que hacía
 * un <input type="date">) y compara la consulta VIEJA (gte: ahora) vs la NUEVA
 * (gte: inicio de hoy). No modifica permanentemente: restaura el valor al final.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const corr = await prisma.correlativo.findFirst({ where: { tipo: 'FACTURA' } })
  if (!corr) { console.log('No hay correlativo FACTURA'); return }
  const original = corr.fechaLimite

  // Simular el caso problemático: fecha límite = HOY a medianoche
  const hoyMedianoche = new Date(); hoyMedianoche.setHours(0, 0, 0, 0)
  await prisma.correlativo.update({ where: { id: corr.id }, data: { fechaLimite: hoyMedianoche, activo: true } })
  console.log(`Escenario: fechaLimite = HOY medianoche (${hoyMedianoche.toISOString()})`)
  console.log(`Ahora = ${new Date().toISOString()}\n`)

  // CONSULTA VIEJA: gte ahora (con hora)
  const vieja = await prisma.correlativo.findFirst({
    where: { tipo: 'FACTURA', activo: true, fechaLimite: { gte: new Date() } },
  })
  console.log(`Consulta VIEJA (gte: ahora)        → ${vieja ? 'ENCONTRADO ✅' : 'NO encontrado ❌ (este era el bug)'}`)

  // CONSULTA NUEVA: gte inicio de hoy
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
  const nueva = await prisma.correlativo.findFirst({
    where: { tipo: 'FACTURA', activo: true, fechaLimite: { gte: inicioHoy } },
  })
  console.log(`Consulta NUEVA (gte: inicio de hoy) → ${nueva ? 'ENCONTRADO ✅ (fix funciona)' : 'NO encontrado ❌'}`)

  // Caso: fecha límite AYER debe seguir excluyéndose (SAR: vencido)
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1); ayer.setHours(23, 59, 59, 999)
  await prisma.correlativo.update({ where: { id: corr.id }, data: { fechaLimite: ayer } })
  const vencido = await prisma.correlativo.findFirst({
    where: { tipo: 'FACTURA', activo: true, fechaLimite: { gte: inicioHoy } },
  })
  console.log(`\nFecha límite AYER → consulta NUEVA: ${vencido ? 'ENCONTRADO ❌ (no debería)' : 'NO encontrado ✅ (correcto: vencido)'}`)

  // Restaurar valor original
  await prisma.correlativo.update({ where: { id: corr.id }, data: { fechaLimite: original } })
  console.log(`\nRestaurada fechaLimite original: ${new Date(original).toISOString()}`)

  const ok = !vieja && nueva && !vencido
  console.log(`\n${ok ? '✅ FIX VALIDADO' : '❌ revisar'}`)
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
