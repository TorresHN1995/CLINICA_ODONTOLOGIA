/**
 * Tests de integridad sobre los datos (valida los invariantes que el código de la app debe mantener).
 * Corre contra la BD local sembrada.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const r2 = (n) => Math.round(n * 100) / 100
const N = (d) => Number(d)

let pass = 0, fail = 0
const fails = []
function check(cond, msg) { if (cond) pass++; else { fail++; fails.push('✗ ' + msg) } }

async function main() {
  const facturas = await prisma.factura.findMany({ include: { items: true, pagos: true, ingreso: true } })
  console.log(`Analizando ${facturas.length} facturas...`)

  for (const f of facturas) {
    // 1) ISV derivado de items (fix: ISV sobre base, no doble extracción)
    const impuestoEsperado = r2(f.items.reduce((s, it) => s + N(it.subtotal) * (N(it.tasaIsv) / 100), 0))
    check(Math.abs(impuestoEsperado - N(f.impuesto)) < 0.02, `[${f.numero}] impuesto = Σ(base×tasa) (esp ${impuestoEsperado}, db ${N(f.impuesto)})`)

    // 2) total = subtotal - descuento + impuesto
    const totalEsperado = r2(N(f.subtotal) - N(f.descuento) + N(f.impuesto))
    check(Math.abs(totalEsperado - N(f.total)) < 0.02, `[${f.numero}] total = subtotal - desc + impuesto`)

    // 3) item.subtotal = cantidad * precioUnitario
    for (const it of f.items) {
      check(Math.abs(N(it.subtotal) - N(it.cantidad) * N(it.precioUnitario)) < 0.02, `[${f.numero}] item subtotal = cant×PU`)
    }

    // 4) subtotal de factura = Σ items
    const sumItems = r2(f.items.reduce((s, it) => s + N(it.subtotal), 0))
    check(Math.abs(sumItems - N(f.subtotal)) < 0.02, `[${f.numero}] subtotal factura = Σ items`)

    // 5) No sobrepago (fix: pagos atómicos, evita sobrepago)
    const pagado = r2(f.pagos.reduce((s, p) => s + N(p.monto), 0))
    check(pagado <= N(f.total) + 0.02, `[${f.numero}] sin sobrepago (pagado ${pagado} ≤ total ${N(f.total)})`)

    // 6) Consistencia estado <-> pagos
    if (f.estado === 'PAGADA') check(Math.abs(pagado - N(f.total)) < 0.02, `[${f.numero}] PAGADA ⇒ pagado = total`)
    if (f.estado === 'PENDIENTE') check(pagado === 0, `[${f.numero}] PENDIENTE ⇒ sin pagos`)
    if (f.estado === 'PAGADA_PARCIAL') check(pagado > 0 && pagado < N(f.total), `[${f.numero}] PARCIAL ⇒ 0 < pagado < total`)

    // 7) Ingreso por factura (facturas route crea 1 ingreso con monto=total)
    check(!!f.ingreso, `[${f.numero}] tiene ingreso asociado`)
    if (f.ingreso) check(Math.abs(N(f.ingreso.monto) - N(f.total)) < 0.02, `[${f.numero}] ingreso.monto = total`)

    // 8) total no negativo (fix: sin total negativo)
    check(N(f.total) >= 0, `[${f.numero}] total ≥ 0`)
  }

  // 9) Correlativo: siguiente coherente con # facturas emitidas
  const corr = await prisma.correlativo.findFirst({ where: { tipo: 'FACTURA' } })
  const nConCorrelativo = await prisma.factura.count({ where: { correlativoId: corr?.id } })
  check(corr && corr.siguiente === corr.rangoInicial + nConCorrelativo, `correlativo.siguiente coherente (siguiente ${corr?.siguiente}, emitidas ${nConCorrelativo})`)

  // 10) Cierres de caja: fórmulas
  const cierres = await prisma.cierreCaja.findMany()
  console.log(`Analizando ${cierres.length} cierres de caja...`)
  for (const c of cierres) {
    const espEsperado = r2(N(c.fondoInicial) + N(c.totalEfectivo) - N(c.egresosEfectivo))
    check(Math.abs(espEsperado - N(c.efectivoEsperado)) < 0.02, `[cierre ${c.fecha.toISOString().slice(0,10)}] esperado = fondo + efectivo - egresosEfectivo`)
    const difEsperada = r2(N(c.efectivoContado) - N(c.efectivoEsperado))
    check(Math.abs(difEsperada - N(c.diferencia)) < 0.02, `[cierre ${c.fecha.toISOString().slice(0,10)}] diferencia = contado - esperado`)
  }

  // 11) Presupuestos: matemática inclusiva (subtotal + impuesto ≈ totalBruto; total = bruto - descuento)
  const presups = await prisma.presupuesto.findMany({ include: { items: true } })
  console.log(`Analizando ${presups.length} presupuestos...`)
  for (const p of presups) {
    const brutoEsperado = r2(N(p.subtotal) + N(p.impuesto))
    const totalEsperado = r2(brutoEsperado - N(p.descuento))
    check(Math.abs(totalEsperado - N(p.total)) < 0.05, `[${p.numero}] total = (subtotal+impuesto) - descuento (esp ${totalEsperado}, db ${N(p.total)})`)
    // items inclusivos: Σ item.subtotal ≈ subtotal + impuesto + (sin descuento)
    const sumInclusivo = r2(p.items.reduce((s, it) => s + N(it.subtotal), 0))
    check(Math.abs(sumInclusivo - brutoEsperado) < 0.05, `[${p.numero}] Σ items inclusivos = subtotal + impuesto`)
    // FACTURADO debe tener facturaId
    if (p.estado === 'FACTURADO') check(!!p.facturaId, `[${p.numero}] FACTURADO ⇒ vinculado a factura`)
  }

  // 12) ANULADAS no deben tener pagos que sumen a caja (no generan ingreso real cobrado)
  const anuladas = await prisma.factura.findMany({ where: { estado: 'ANULADA' }, include: { pagos: true } })
  for (const a of anuladas) {
    check(a.pagos.length === 0, `[${a.numero}] ANULADA sin pagos`)
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`RESULTADO: ${pass} ✓   ${fail} ✗`)
  if (fails.length) { console.log('\nFALLOS:'); fails.slice(0, 40).forEach((f) => console.log(f)); }
  else console.log('TODOS LOS INVARIANTES DE INTEGRIDAD SE CUMPLEN ✅')
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
