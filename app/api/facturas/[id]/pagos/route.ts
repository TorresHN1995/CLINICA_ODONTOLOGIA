import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarFlujoCaja } from '@/lib/flujo-caja'
import { z } from 'zod'

const pagoSchema = z.object({
  monto: z.number().positive(),
  metodoPago: z.enum([
    'EFECTIVO',
    'TARJETA_CREDITO',
    'TARJETA_DEBITO',
    'TRANSFERENCIA',
    'CHEQUE',
    'OTRO'
  ]),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
})

// POST - Registrar pago
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = pagoSchema.parse(body)

    // Obtener factura actual
    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
      include: { pagos: true },
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Calcular total pagado
    const totalPagado = factura.pagos.reduce(
      (sum, pago) => sum + Number(pago.monto),
      0
    )
    const nuevoTotal = totalPagado + validatedData.monto

    if (nuevoTotal > Number(factura.total)) {
      return NextResponse.json(
        { error: 'El monto del pago excede el total de la factura' },
        { status: 400 }
      )
    }

    // Registrar pago
    const pago = await prisma.pago.create({
      data: {
        facturaId: params.id,
        monto: validatedData.monto,
        metodoPago: validatedData.metodoPago,
        referencia: validatedData.referencia || null,
        observaciones: validatedData.observaciones || null,
      },
    })

    // Actualizar estado de factura
    let nuevoEstado = factura.estado
    if (nuevoTotal >= Number(factura.total)) {
      nuevoEstado = 'PAGADA'
    } else if (nuevoTotal > 0) {
      nuevoEstado = 'PAGADA_PARCIAL'
    }

    await prisma.factura.update({
      where: { id: params.id },
      data: { estado: nuevoEstado },
    })

    // Registrar en Flujo de Caja por el monto del pago
    await registrarFlujoCaja(
      'INGRESO',
      `Pago factura ${params.id}`,
      validatedData.monto,
      params.id
    )

    // Actualizar Ingreso asociado a la factura
    try {
      const ingreso = await prisma.ingreso.findUnique({
        where: { facturaId: params.id },
      })
      if (ingreso) {
        await prisma.ingreso.update({
          where: { id: ingreso.id },
          data: {
            metodoPago: validatedData.metodoPago,
            estado: nuevoEstado === 'PAGADA' ? 'CONFIRMADO' : 'REGISTRADO',
          },
        })
      }
    } catch (e) {
      console.error('No se pudo actualizar Ingreso vinculado a la factura:', e)
    }

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al registrar pago:', error)
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    )
  }
}


