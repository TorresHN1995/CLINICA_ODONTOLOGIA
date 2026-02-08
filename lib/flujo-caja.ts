import { prisma } from '@/lib/prisma'

/**
 * Registra un movimiento en el flujo de caja usando una transacción
 * serializada para evitar race conditions en el cálculo de saldos.
 */
export async function registrarFlujoCaja(
  tipo: 'INGRESO' | 'EGRESO' | 'AJUSTE',
  concepto: string,
  monto: number,
  referencia: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Bloquear lectura del último flujo dentro de la transacción
      const ultimoFlujo = await tx.flujoCaja.findFirst({
        orderBy: { fecha: 'desc' },
      })

      const saldoAnterior = ultimoFlujo ? Number(ultimoFlujo.saldoActual) : 0
      const saldoActual =
        tipo === 'EGRESO'
          ? saldoAnterior - monto
          : saldoAnterior + monto

      await tx.flujoCaja.create({
        data: {
          tipo,
          concepto,
          monto,
          saldoAnterior,
          saldoActual,
          referencia,
        },
      })
    }, {
      isolationLevel: 'Serializable',
    })
  } catch (error) {
    console.error('Error al registrar flujo de caja:', error)
  }
}
