import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditar } from '@/lib/auditoria'
import { startOfDay, endOfDay } from 'date-fns'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const r2 = (n: number) => Math.round(n * 100) / 100

// Parsea 'yyyy-MM-dd' como medianoche LOCAL. new Date('yyyy-MM-dd') asume UTC,
// lo que con startOfDay/endOfDay (hora local) desfasa el día en zonas UTC-negativas (ej. Honduras UTC-6).
function parseFechaLocal(str: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(str)
}

const METODOS = ['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO']

// Calcula los movimientos de efectivo y por método para un día dado
async function calcularDia(fecha: Date) {
  const inicio = startOfDay(fecha)
  const fin = endOfDay(fecha)

  const [pagos, egresos] = await Promise.all([
    prisma.pago.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      select: { monto: true, metodoPago: true },
    }),
    // Egresos del día que efectivamente representan salida de dinero (excluye RECHAZADO)
    prisma.egreso.findMany({
      where: { fecha: { gte: inicio, lte: fin }, estado: { not: 'RECHAZADO' } },
      select: { monto: true, metodoPago: true },
    }),
  ])

  const desglosePorMetodo: Record<string, number> = {}
  for (const m of METODOS) desglosePorMetodo[m] = 0
  let totalIngresos = 0
  for (const p of pagos) {
    const monto = Number(p.monto)
    totalIngresos += monto
    desglosePorMetodo[p.metodoPago] = r2((desglosePorMetodo[p.metodoPago] || 0) + monto)
  }

  let totalEgresos = 0
  let egresosEfectivo = 0
  for (const e of egresos) {
    const monto = Number(e.monto)
    totalEgresos += monto
    if (e.metodoPago === 'EFECTIVO') egresosEfectivo += monto
  }

  const totalEfectivo = desglosePorMetodo['EFECTIVO'] || 0

  return {
    inicio,
    fin,
    totalIngresos: r2(totalIngresos),
    totalEfectivo: r2(totalEfectivo),
    totalEgresos: r2(totalEgresos),
    egresosEfectivo: r2(egresosEfectivo),
    desglosePorMetodo,
  }
}

// GET - Preview del día + cierre existente + historial
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha')
    const fecha = fechaParam ? parseFechaLocal(fechaParam) : new Date()
    if (isNaN(fecha.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }

    const dia = await calcularDia(fecha)

    const [existente, historial] = await Promise.all([
      prisma.cierreCaja.findFirst({
        where: { fecha: { gte: dia.inicio, lte: dia.fin } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cierreCaja.findMany({ orderBy: { fecha: 'desc' }, take: 30 }),
    ])

    return NextResponse.json({
      fecha: dia.inicio.toISOString(),
      preview: {
        totalIngresos: dia.totalIngresos,
        totalEfectivo: dia.totalEfectivo,
        totalEgresos: dia.totalEgresos,
        egresosEfectivo: dia.egresosEfectivo,
        desglosePorMetodo: dia.desglosePorMetodo,
        // efectivo esperado sin fondo inicial (el fondo lo agrega el usuario en el cliente)
        efectivoNeto: r2(dia.totalEfectivo - dia.egresosEfectivo),
      },
      existente,
      historial,
    })
  } catch (error) {
    console.error('Error al obtener cierre de caja:', error)
    return NextResponse.json({ error: 'Error al obtener cierre de caja' }, { status: 500 })
  }
}

const cierreSchema = z.object({
  fecha: z.string(),
  fondoInicial: z.number().min(0).default(0),
  efectivoContado: z.number().min(0),
  observaciones: z.string().max(5000).optional(),
})

// POST - Registrar cierre de caja (recalcula server-side)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = cierreSchema.parse(body)
    const fecha = parseFechaLocal(data.fecha)
    if (isNaN(fecha.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }

    const dia = await calcularDia(fecha)
    const efectivoEsperado = r2(data.fondoInicial + dia.totalEfectivo - dia.egresosEfectivo)
    const diferencia = r2(data.efectivoContado - efectivoEsperado)

    const cierre = await prisma.cierreCaja.create({
      data: {
        fecha: dia.inicio,
        usuarioId: session.user.id,
        usuarioNombre: session.user.name || null,
        fondoInicial: data.fondoInicial,
        totalIngresos: dia.totalIngresos,
        totalEfectivo: dia.totalEfectivo,
        totalEgresos: dia.totalEgresos,
        egresosEfectivo: dia.egresosEfectivo,
        efectivoEsperado,
        efectivoContado: data.efectivoContado,
        diferencia,
        desglosePorMetodo: dia.desglosePorMetodo,
        observaciones: data.observaciones || null,
      },
    })

    await auditar(session, request, {
      accion: 'CREAR',
      entidad: 'CierreCaja',
      entidadId: cierre.id,
      descripcion: `Cerró la caja del ${dia.inicio.toLocaleDateString('es-HN')} (esperado ${efectivoEsperado.toFixed(2)}, contado ${data.efectivoContado.toFixed(2)}, diferencia ${diferencia.toFixed(2)})`,
      datos: { efectivoEsperado, efectivoContado: data.efectivoContado, diferencia },
    })

    return NextResponse.json(cierre, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error al registrar cierre de caja:', error)
    return NextResponse.json({ error: 'Error al registrar cierre de caja' }, { status: 500 })
  }
}
