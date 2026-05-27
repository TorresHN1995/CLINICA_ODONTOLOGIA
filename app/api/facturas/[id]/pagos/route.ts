import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarFlujoCaja } from '@/lib/flujo-caja'
import { EstadoFactura } from '@prisma/client'
import { z } from 'zod'

// Error de negocio con código HTTP asociado (para mapear dentro de la transacción)
class PagoError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

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

    // Todo el bloque crítico (leer pagos -> validar -> crear pago -> actualizar estado)
    // se ejecuta en UNA transacción serializada para evitar sobrepagos por concurrencia.
    const { pago, nuevoEstado } = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.findUnique({
        where: { id: params.id },
        include: { pagos: true },
      })

      if (!factura) {
        throw new PagoError('Factura no encontrada', 404)
      }
      if (factura.estado === 'ANULADA') {
        throw new PagoError('No se pueden registrar pagos en una factura anulada', 400)
      }
      if (factura.estado === 'PAGADA') {
        throw new PagoError('La factura ya está completamente pagada', 400)
      }

      // Total pagado recalculado DENTRO de la transacción
      const totalPagado = factura.pagos.reduce(
        (sum, p) => sum + Number(p.monto),
        0
      )
      const nuevoTotal = totalPagado + validatedData.monto

      if (nuevoTotal > Number(factura.total)) {
        throw new PagoError('El monto del pago excede el total de la factura', 400)
      }

      const pago = await tx.pago.create({
        data: {
          facturaId: params.id,
          monto: validatedData.monto,
          metodoPago: validatedData.metodoPago,
          referencia: validatedData.referencia || null,
          observaciones: validatedData.observaciones || null,
        },
      })

      let nuevoEstado: EstadoFactura = factura.estado
      if (nuevoTotal >= Number(factura.total)) {
        nuevoEstado = 'PAGADA'
      } else if (nuevoTotal > 0) {
        nuevoEstado = 'PAGADA_PARCIAL'
      }

      await tx.factura.update({
        where: { id: params.id },
        data: { estado: nuevoEstado },
      })

      // Actualizar Ingreso asociado dentro de la misma transacción
      const ingreso = await tx.ingreso.findUnique({
        where: { facturaId: params.id },
      })
      if (ingreso) {
        await tx.ingreso.update({
          where: { id: ingreso.id },
          data: {
            metodoPago: validatedData.metodoPago,
            estado: nuevoEstado === 'PAGADA' ? 'CONFIRMADO' : 'REGISTRADO',
          },
        })
      }

      return { pago, nuevoEstado }
    }, {
      isolationLevel: 'Serializable',
    })

    // El flujo de caja se registra fuera (tiene su propia transacción) una vez confirmado el pago
    await registrarFlujoCaja(
      'INGRESO',
      `Pago factura ${params.id}`,
      validatedData.monto,
      params.id
    )

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    if (error instanceof PagoError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
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


