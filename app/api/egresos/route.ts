import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const egresoSchema = z.object({
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.enum([
    'MATERIALES_DENTALES',
    'INSTRUMENTAL',
    'MEDICAMENTOS',
    'EQUIPAMIENTO',
    'SERVICIOS_PUBLICOS',
    'ALQUILER',
    'SALARIOS',
    'SEGUROS',
    'MANTENIMIENTO',
    'MARKETING',
    'CAPACITACION',
    'OTROS_GASTOS'
  ]),
  monto: z.number().positive('Monto debe ser positivo'),
  fecha: z.string(),
  metodoPago: z.enum([
    'EFECTIVO',
    'TARJETA_CREDITO',
    'TARJETA_DEBITO',
    'TRANSFERENCIA',
    'CHEQUE',
    'OTRO'
  ]),
  proveedor: z.string().optional(),
  numeroFactura: z.string().optional(),
  observaciones: z.string().optional(),
})

// GET - Obtener egresos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const where: any = {}

    if (categoria) where.categoria = categoria
    if (estado) where.estado = estado

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    }

    const egresos = await prisma.egreso.findMany({
      where,
      include: {
        registrador: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(egresos)
  } catch (error) {
    console.error('Error al obtener egresos:', error)
    return NextResponse.json(
      { error: 'Error al obtener egresos' },
      { status: 500 }
    )
  }
}

// POST - Crear egreso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = egresoSchema.parse(body)

    const egreso = await prisma.egreso.create({
      data: {
        concepto: validatedData.concepto,
        categoria: validatedData.categoria,
        monto: validatedData.monto,
        fecha: new Date(validatedData.fecha),
        metodoPago: validatedData.metodoPago,
        proveedor: validatedData.proveedor || null,
        numeroFactura: validatedData.numeroFactura || null,
        observaciones: validatedData.observaciones || null,
        registradoPor: session.user.id,
      },
      include: {
        registrador: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    })

    // Registrar en flujo de caja
    await registrarFlujoCaja(
      'EGRESO',
      validatedData.concepto,
      validatedData.monto,
      egreso.id
    )

    return NextResponse.json(egreso, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear egreso:', error)
    return NextResponse.json(
      { error: 'Error al crear egreso' },
      { status: 500 }
    )
  }
}

// Función auxiliar para registrar flujo de caja
async function registrarFlujoCaja(
  tipo: 'INGRESO' | 'EGRESO' | 'AJUSTE',
  concepto: string,
  monto: number,
  referencia: string
) {
  try {
    // Obtener el último saldo
    const ultimoFlujo = await prisma.flujoCaja.findFirst({
      orderBy: { fecha: 'desc' },
    })

    const saldoAnterior = ultimoFlujo ? Number(ultimoFlujo.saldoActual) : 0
    const saldoActual = tipo === 'INGRESO' 
      ? saldoAnterior + monto 
      : saldoAnterior - monto

    await prisma.flujoCaja.create({
      data: {
        tipo,
        concepto,
        monto,
        saldoAnterior,
        saldoActual,
        referencia,
      },
    })
  } catch (error) {
    console.error('Error al registrar flujo de caja:', error)
  }
}

