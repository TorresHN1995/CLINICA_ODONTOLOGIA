import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  construirCuenta,
  agruparPorBucket,
  UMBRAL_MORA_DEFAULT,
  type BucketAntiguedad,
  type CuentaPorCobrar,
} from '@/lib/cuentas-por-cobrar'

export const dynamic = 'force-dynamic'

// GET - Estado de cuentas por cobrar (cobranza / antigüedad de saldos)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')
    const bucket = searchParams.get('bucket') as BucketAntiguedad | null
    const soloMora = searchParams.get('soloMora') === 'true'
    const umbralMora = Math.max(0, parseInt(searchParams.get('umbralMora') || String(UMBRAL_MORA_DEFAULT)) || UMBRAL_MORA_DEFAULT)

    // Solo facturas con saldo (PENDIENTE / PAGADA_PARCIAL); se excluyen ANULADA y PAGADA
    const facturas = await prisma.factura.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'PAGADA_PARCIAL'] },
        ...(pacienteId ? { pacienteId } : {}),
      },
      include: {
        pagos: { select: { monto: true } },
        paciente: { select: { id: true, nombre: true, apellido: true, identificacion: true } },
      },
      orderBy: { fecha: 'asc' },
    })

    const ahora = new Date()
    let cuentas: CuentaPorCobrar[] = []
    for (const f of facturas) {
      const cuenta = construirCuenta(f as any, umbralMora, ahora)
      if (cuenta) cuentas.push(cuenta)
    }

    // Filtros adicionales en memoria
    if (bucket) cuentas = cuentas.filter((c) => c.bucket === bucket)
    if (soloMora) cuentas = cuentas.filter((c) => c.enMora)

    // Más vencidas primero
    cuentas.sort((a, b) => b.diasVencido - a.diasVencido)

    // Resumen
    const totalPorCobrar = cuentas.reduce((s, c) => s + c.saldo, 0)
    const totalEnMora = cuentas.filter((c) => c.enMora).reduce((s, c) => s + c.saldo, 0)
    const pacientesDeudores = new Set(cuentas.map((c) => c.pacienteId)).size
    const buckets = agruparPorBucket(cuentas)

    return NextResponse.json({
      resumen: {
        totalPorCobrar: Math.round(totalPorCobrar * 100) / 100,
        totalEnMora: Math.round(totalEnMora * 100) / 100,
        facturasPendientes: cuentas.length,
        pacientesDeudores,
        umbralMora,
      },
      buckets,
      cuentas,
    })
  } catch (error) {
    console.error('Error al obtener cuentas por cobrar:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas por cobrar' },
      { status: 500 }
    )
  }
}
