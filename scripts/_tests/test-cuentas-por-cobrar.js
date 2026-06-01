/**
 * Tests unitarios de lib/cuentas-por-cobrar.ts (código real compilado).
 * Cubre: diasTranscurridos, clasificarBucket, construirCuenta, agruparPorBucket.
 */
const cc = require('./compiled/cuentas-por-cobrar.js')

let pass = 0, fail = 0
const fails = []
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) { pass++ }
  else { fail++; fails.push(`✗ ${msg}\n    esperado: ${e}\n    obtenido: ${a}`) }
}
function ok(cond, msg) { if (cond) pass++; else { fail++; fails.push(`✗ ${msg}`) } }

const AHORA = new Date('2026-05-31T12:00:00')
const fac = (over = {}) => ({
  id: 'f1', numero: 'F1', fecha: new Date('2026-05-01'), estado: 'PENDIENTE',
  total: 1000, tipoDocumento: 'FACTURA', pagos: [],
  paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez', identificacion: '123' },
  ...over,
})

console.log('── diasTranscurridos ──')
eq(cc.diasTranscurridos(new Date('2026-05-01'), new Date('2026-05-31')), 30, 'mismo mes = 30 días')
eq(cc.diasTranscurridos(new Date('2026-05-31'), new Date('2026-05-01')), 0, 'fecha futura nunca negativa')
eq(cc.diasTranscurridos(new Date('2026-05-31'), new Date('2026-05-31')), 0, 'mismo día = 0')

console.log('── clasificarBucket (límites) ──')
eq(cc.clasificarBucket(0), 'corriente', '0 → corriente')
eq(cc.clasificarBucket(30), 'corriente', '30 → corriente (límite inclusivo)')
eq(cc.clasificarBucket(31), 'dias31_60', '31 → 31-60')
eq(cc.clasificarBucket(60), 'dias31_60', '60 → 31-60')
eq(cc.clasificarBucket(61), 'dias61_90', '61 → 61-90')
eq(cc.clasificarBucket(90), 'dias61_90', '90 → 61-90')
eq(cc.clasificarBucket(91), 'mas90', '91 → +90')
eq(cc.clasificarBucket(9999), 'mas90', 'muy viejo → +90')

console.log('── construirCuenta: exclusiones ──')
ok(cc.construirCuenta(fac({ estado: 'ANULADA' }), 30, AHORA) === null, 'ANULADA → null')
ok(cc.construirCuenta(fac({ estado: 'PAGADA' }), 30, AHORA) === null, 'PAGADA → null')
ok(cc.construirCuenta(fac({ total: 1000, pagos: [{ monto: 1000 }] }), 30, AHORA) === null, 'saldo 0 → null')
ok(cc.construirCuenta(fac({ total: 1000, pagos: [{ monto: 1200 }] }), 30, AHORA) === null, 'sobrepago (saldo negativo) → null')

console.log('── construirCuenta: cálculo de saldo ──')
const c1 = cc.construirCuenta(fac({ total: 1000, pagos: [{ monto: 300 }, { monto: 200 }] }), 30, AHORA)
eq(c1.pagado, 500, 'suma de pagos = 500')
eq(c1.saldo, 500, 'saldo = total - pagado = 500')

console.log('── construirCuenta: mora (umbral 30) ──')
const cMora = cc.construirCuenta(fac({ fecha: new Date('2026-04-01') }), 30, AHORA) // 60 días
ok(cMora.enMora === true, '60 días > 30 → en mora')
eq(cMora.bucket, 'dias31_60', '60 días → bucket 31-60')
const cNoMora = cc.construirCuenta(fac({ fecha: new Date('2026-05-15') }), 30, AHORA) // 16 días
ok(cNoMora.enMora === false, '16 días ≤ 30 → NO en mora')
const cLimite = cc.construirCuenta(fac({ fecha: new Date('2026-05-01') }), 30, AHORA) // 30 días exactos
ok(cLimite.enMora === false, '30 días exactos NO es mora (> estricto)')

console.log('── construirCuenta: umbral configurable ──')
const cU = cc.construirCuenta(fac({ fecha: new Date('2026-05-15') }), 10, AHORA) // 16 días, umbral 10
ok(cU.enMora === true, 'umbral 10: 16 días → en mora')

console.log('── construirCuenta: redondeo de saldo ──')
const cR = cc.construirCuenta(fac({ total: 100.005, pagos: [{ monto: 33.333 }] }), 30, AHORA)
ok(Math.abs(cR.saldo - 66.67) < 0.005 || Math.abs(cR.saldo - 66.68) < 0.005, `saldo redondeado a 2 decimales (got ${cR.saldo})`)

console.log('── agruparPorBucket ──')
const cuentas = [
  cc.construirCuenta(fac({ id: 'a', fecha: new Date('2026-05-20'), total: 100 }), 30, AHORA), // corriente
  cc.construirCuenta(fac({ id: 'b', fecha: new Date('2026-04-10'), total: 200 }), 30, AHORA), // 31-60
  cc.construirCuenta(fac({ id: 'c', fecha: new Date('2026-05-25'), total: 50 }), 30, AHORA),  // corriente
].filter(Boolean)
const grp = cc.agruparPorBucket(cuentas)
eq(grp.corriente, 150, 'corriente = 100 + 50')
eq(grp.dias31_60, 200, '31-60 = 200')
eq(grp.dias61_90, 0, '61-90 = 0')
eq(grp.mas90, 0, '+90 = 0')

console.log(`\n${'='.repeat(50)}`)
console.log(`RESULTADO: ${pass} ✓   ${fail} ✗`)
if (fails.length) { console.log('\nFALLOS:'); fails.forEach((f) => console.log(f)); process.exit(1) }
else console.log('TODOS LOS TESTS DE CUENTAS POR COBRAR PASARON ✅')
