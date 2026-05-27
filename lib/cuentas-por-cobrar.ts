/**
 * Utilidades para Cuentas por Cobrar (cobranza / antigüedad de saldos).
 *
 * El saldo de una factura = total - (suma de pagos). Solo se consideran las
 * facturas con estado PENDIENTE o PAGADA_PARCIAL (las ANULADAS y PAGADAS no
 * generan cuenta por cobrar). Como las facturas no tienen fecha de vencimiento,
 * la antigüedad se mide desde la fecha de emisión.
 */

export type BucketAntiguedad = 'corriente' | 'dias31_60' | 'dias61_90' | 'mas90'

export const ETIQUETAS_BUCKET: Record<BucketAntiguedad, string> = {
  corriente: '0-30 días',
  dias31_60: '31-60 días',
  dias61_90: '61-90 días',
  mas90: '+90 días',
}

// Umbral por defecto (en días) a partir del cual una cuenta se considera en mora.
export const UMBRAL_MORA_DEFAULT = 30

export interface CuentaPorCobrar {
  facturaId: string
  numero: string
  fecha: string
  tipoDocumento: string
  pacienteId: string
  pacienteNombre: string
  identificacion: string
  total: number
  pagado: number
  saldo: number
  diasVencido: number
  bucket: BucketAntiguedad
  enMora: boolean
}

// Número de días enteros transcurridos entre dos fechas (>= 0).
export function diasTranscurridos(desde: Date, hasta: Date = new Date()): number {
  const ms = hasta.getTime() - desde.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function clasificarBucket(dias: number): BucketAntiguedad {
  if (dias <= 30) return 'corriente'
  if (dias <= 60) return 'dias31_60'
  if (dias <= 90) return 'dias61_90'
  return 'mas90'
}

// Forma mínima de factura que necesita el cálculo (desacoplada de Prisma).
interface FacturaParaCobro {
  id: string
  numero: string
  fecha: Date
  estado: string
  total: unknown // Prisma.Decimal | number
  tipoDocumento: string
  pagos: { monto: unknown }[]
  paciente: { id: string; nombre: string; apellido: string; identificacion: string }
}

/**
 * Construye una cuenta por cobrar a partir de una factura, o null si no aplica
 * (anulada, pagada por completo, o saldo no positivo).
 */
export function construirCuenta(
  factura: FacturaParaCobro,
  umbralMora: number = UMBRAL_MORA_DEFAULT,
  ahora: Date = new Date()
): CuentaPorCobrar | null {
  if (factura.estado === 'ANULADA' || factura.estado === 'PAGADA') return null

  const total = Number(factura.total)
  const pagado = factura.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
  const saldo = Math.round((total - pagado) * 100) / 100

  if (saldo <= 0) return null

  const diasVencido = diasTranscurridos(new Date(factura.fecha), ahora)

  return {
    facturaId: factura.id,
    numero: factura.numero,
    fecha: new Date(factura.fecha).toISOString(),
    tipoDocumento: factura.tipoDocumento,
    pacienteId: factura.paciente.id,
    pacienteNombre: `${factura.paciente.nombre} ${factura.paciente.apellido}`,
    identificacion: factura.paciente.identificacion,
    total,
    pagado,
    saldo,
    diasVencido,
    bucket: clasificarBucket(diasVencido),
    enMora: diasVencido > umbralMora,
  }
}

/** Suma los saldos por bucket de antigüedad. */
export function agruparPorBucket(cuentas: CuentaPorCobrar[]): Record<BucketAntiguedad, number> {
  const acc: Record<BucketAntiguedad, number> = {
    corriente: 0,
    dias31_60: 0,
    dias61_90: 0,
    mas90: 0,
  }
  for (const c of cuentas) {
    acc[c.bucket] = Math.round((acc[c.bucket] + c.saldo) * 100) / 100
  }
  return acc
}
